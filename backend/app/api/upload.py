from fastapi import APIRouter, UploadFile, File, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pathlib import Path
import uuid
import re
from datetime import datetime
import logging

from app.database import get_db, Document, User
from app.schemas import DocumentUploadResponse
from app.services.vector_store import VectorStoreService
from app.utils.pdf_processor import PDFProcessor
from app.config import settings
from app.dependencies import get_current_user
from app.utils.rate_limiter import rate_limit

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/upload", tags=["upload"])

UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True, parents=True)

MAX_BYTES = settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024


def sanitize_filename(filename: str) -> str:
    """Sanitize filename to prevent path traversal and unsafe characters"""
    base_name = Path(filename).name
    # Remove unsafe characters, keep alphanumeric, dots, underscores, dashes
    clean_name = re.sub(r'[^a-zA-Z0-9._-]', '_', base_name)
    return clean_name or "document.pdf"


@router.post(
    "/", 
    response_model=DocumentUploadResponse,
    dependencies=[Depends(rate_limit(max_requests=10, window_seconds=60))]
)
async def upload_document(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Upload a PDF document and process it for RAG with strict security validations:
    - Size check (max 10MB)
    - File magic signature validation (%PDF-)
    - Filename sanitization
    - Per-user document quota
    """
    # 1. Check user document quota
    user_doc_count = db.query(Document).filter(Document.user_id == current_user.id).count()
    if user_doc_count >= settings.MAX_DOCS_PER_USER:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Upload quota reached. Maximum {settings.MAX_DOCS_PER_USER} documents per account."
        )

    # 2. Check filename extension
    if not file.filename or not file.filename.lower().endswith('.pdf'):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Only PDF files are supported")

    safe_original_name = sanitize_filename(file.filename)
    file_uuid = uuid.uuid4().hex
    stored_filename = f"{file_uuid}_{safe_original_name}"
    file_path = UPLOAD_DIR / stored_filename

    try:
        # 3. Stream read with size enforcement to avoid memory exhaustion
        total_bytes = 0
        content_chunks = []
        
        while True:
            chunk = await file.read(1024 * 64)  # 64KB chunk
            if not chunk:
                break
            total_bytes += len(chunk)
            if total_bytes > MAX_BYTES:
                raise HTTPException(
                    status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                    detail=f"File exceeds maximum allowed size of {settings.MAX_UPLOAD_SIZE_MB}MB"
                )
            content_chunks.append(chunk)

        content = b"".join(content_chunks)

        # 4. Verify PDF magic signature (%PDF-)
        if not content.startswith(b"%PDF-"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid file format. The uploaded file is not a valid PDF."
            )

        # Write safely to disk
        with open(file_path, "wb") as f:
            f.write(content)

        # 5. Extract text from PDF
        pdf_processor = PDFProcessor(
            chunk_size=settings.CHUNK_SIZE,
            chunk_overlap=settings.CHUNK_OVERLAP
        )
        text = pdf_processor.extract_text(str(file_path))

        if not text or len(text.strip()) < 50:
            if file_path.exists():
                file_path.unlink()
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Could not extract sufficient readable text from this PDF."
            )

        # 6. Chunk text and cap chunks to prevent resource exhaustion
        chunks = pdf_processor.chunk_text(text)
        max_chunks = 200
        if len(chunks) > max_chunks:
            chunks = chunks[:max_chunks]

        # 7. Create database record
        namespace = f"doc_{file_uuid}"
        document = Document(
            user_id=current_user.id,
            filename=safe_original_name,
            file_path=str(file_path),
            pinecone_namespace=namespace,
            uploaded_at=datetime.utcnow()
        )
        db.add(document)
        db.commit()
        db.refresh(document)

        # 8. Store vectors
        vector_store = VectorStoreService()
        num_chunks = vector_store.store_document_chunks(
            chunks=chunks,
            namespace=namespace,
            document_id=document.id
        )

        return DocumentUploadResponse(
            id=document.id,
            filename=safe_original_name,
            pinecone_namespace=namespace,
            uploaded_at=document.uploaded_at,
            message=f"Successfully processed {num_chunks} chunks from document"
        )

    except HTTPException:
        db.rollback()
        if file_path.exists():
            try:
                file_path.unlink()
            except Exception:
                pass
        raise

    except Exception as e:
        db.rollback()
        if file_path.exists():
            try:
                file_path.unlink()
            except Exception:
                pass
        logger.error(f"[UPLOAD ERROR] Failed to process upload: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while processing the document. Please try again."
        )


@router.get("/documents")
async def list_documents(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List all documents owned by the authenticated user"""
    documents = db.query(Document).filter(Document.user_id == current_user.id).all()
    
    return {
        "documents": [
            {
                "id": doc.id,
                "filename": doc.filename,
                "uploaded_at": (doc.uploaded_at.isoformat() + "Z") if doc.uploaded_at else (datetime.utcnow().isoformat() + "Z"),
                "namespace": doc.pinecone_namespace
            }
            for doc in documents
        ]
    }


@router.delete("/documents/{document_id}")
async def delete_document(
    document_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a user-owned document and its vectors"""
    document = db.query(Document).filter(
        Document.id == document_id,
        Document.user_id == current_user.id
    ).first()
    
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    
    try:
        # Delete vectors
        try:
            vector_store = VectorStoreService()
            vector_store.delete_namespace(document.pinecone_namespace)
        except Exception as pinecone_error:
            logger.warning(f"Could not delete vectors for {document.pinecone_namespace}: {str(pinecone_error)}")
        
        # Delete file from filesystem
        file_path = Path(document.file_path)
        if file_path.exists():
            try:
                file_path.unlink()
            except Exception as fe:
                logger.warning(f"Could not delete file {file_path}: {str(fe)}")
        
        # Delete from DB
        db.delete(document)
        db.commit()
        
        return {"message": "Document deleted successfully"}
    
    except Exception as e:
        db.rollback()
        logger.error(f"[DELETE ERROR] {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Error deleting document")
