from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from sqlalchemy.orm import Session
from pathlib import Path
import uuid
from datetime import datetime
import traceback

from app.database import get_db, Document
from app.schemas import DocumentUploadResponse
from app.services.vector_store import VectorStoreService
from app.utils.pdf_processor import PDFProcessor
from app.config import settings

router = APIRouter(prefix="/api/upload", tags=["upload"])

# Create uploads directory - FIX: Use relative path for local development
UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True, parents=True)


@router.post("/", response_model=DocumentUploadResponse)
async def upload_document(
    file: UploadFile = File(...),
    user_id: int = 1,  # TODO: Get from authentication
    db: Session = Depends(get_db)
):
    """
    Upload a PDF document and process it for RAG
    
    Process:
    1. Save PDF file
    2. Extract text from PDF
    3. Chunk text
    4. Generate embeddings
    5. Store in Pinecone
    6. Save metadata in PostgreSQL
    """
    
    try:
        print(f"[UPLOAD] Starting upload for file: {file.filename}")
        
        # Validate file type
        if not file.filename.endswith('.pdf'):
            raise HTTPException(status_code=400, detail="Only PDF files are supported")
        
        # Generate unique filename
        file_id = str(uuid.uuid4())
        filename = f"{file_id}_{file.filename}"
        file_path = UPLOAD_DIR / filename
        
        print(f"[UPLOAD] Saving file to: {file_path}")
        
        # Save file
        content = await file.read()
        with open(file_path, "wb") as f:
            f.write(content)
        
        print(f"[UPLOAD] File saved successfully. Size: {len(content)} bytes")
        
        # Process PDF
        pdf_processor = PDFProcessor(
            chunk_size=settings.CHUNK_SIZE,
            chunk_overlap=settings.CHUNK_OVERLAP
        )
        
        print(f"[UPLOAD] Extracting text from PDF...")
        
        # Extract text
        text = pdf_processor.extract_text(str(file_path))
        
        if not text or len(text) < 100:
            raise HTTPException(
                status_code=400, 
                detail="Could not extract sufficient text from PDF"
            )
        
        print(f"[UPLOAD] Extracted {len(text)} characters from PDF")
        
        # Chunk text
        chunks = pdf_processor.chunk_text(text)
        
        print(f"[UPLOAD] Created {len(chunks)} chunks")
        
        # Create namespace for this document
        namespace = f"doc_{file_id}"
        
        # Create document record first to get ID
        document = Document(
            user_id=user_id,
            filename=file.filename,
            file_path=str(file_path),
            pinecone_namespace=namespace,
            uploaded_at=datetime.utcnow()
        )
        db.add(document)
        db.commit()
        db.refresh(document)
        
        print(f"[UPLOAD] Document record created with ID: {document.id}")
        print(f"[UPLOAD] Storing vectors in Pinecone...")
        
        # Store in Pinecone
        vector_store = VectorStoreService()
        
        # Store vectors
        num_chunks = vector_store.store_document_chunks(
            chunks=chunks,
            namespace=namespace,
            document_id=document.id
        )
        
        print(f"[UPLOAD] Successfully stored {num_chunks} chunks in Pinecone")
        
        return DocumentUploadResponse(
            id=document.id,
            filename=file.filename,
            pinecone_namespace=namespace,
            uploaded_at=document.uploaded_at,
            message=f"Successfully processed {num_chunks} chunks from document"
        )
    
    except HTTPException:
        # Re-raise HTTP exceptions as-is
        raise
    
    except Exception as e:
        # Log detailed error
        print("=" * 80)
        print("[UPLOAD ERROR] Exception occurred during upload:")
        print(traceback.format_exc())
        print("=" * 80)
        
        # Rollback database changes
        db.rollback()
        
        # Return detailed error message
        raise HTTPException(
            status_code=500, 
            detail=f"Error processing document: {str(e)}"
        )


@router.get("/documents")
async def list_documents(
    user_id: int = 1,  # TODO: Get from authentication
    db: Session = Depends(get_db)
):
    """List all documents for a user"""
    documents = db.query(Document).filter(Document.user_id == user_id).all()
    
    return {
        "documents": [
            {
                "id": doc.id,
                "filename": doc.filename,
                "uploaded_at": doc.uploaded_at,
                "namespace": doc.pinecone_namespace
            }
            for doc in documents
        ]
    }


@router.delete("/documents/{document_id}")
async def delete_document(
    document_id: int,
    user_id: int = 1,  # TODO: Get from authentication
    db: Session = Depends(get_db)
):
    """Delete a document and its vectors"""
    document = db.query(Document).filter(
        Document.id == document_id,
        Document.user_id == user_id
    ).first()
    
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    
    try:
        # Try to delete from Pinecone (but don't fail if it doesn't work)
        try:
            vector_store = VectorStoreService()
            vector_store.delete_namespace(document.pinecone_namespace)
            print(f"[DELETE] Successfully deleted vectors from Pinecone")
        except Exception as pinecone_error:
            print(f"[DELETE] Warning: Could not delete from Pinecone: {str(pinecone_error)}")
            # Continue anyway - we can still delete from DB and filesystem
        
        # Delete file
        file_path = Path(document.file_path)
        if file_path.exists():
            file_path.unlink()
            print(f"[DELETE] Deleted file: {file_path}")
        
        # Delete from database
        db.delete(document)
        db.commit()
        
        print(f"[DELETE] Successfully deleted document {document_id}")
        return {"message": "Document deleted successfully"}
    
    except Exception as e:
        db.rollback()
        print(f"[DELETE] Error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error deleting document: {str(e)}")
