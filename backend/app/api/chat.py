from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime
import logging

from app.database import get_db, LearningSession, ChatMessage, Document, User
from app.schemas import ChatRequest, ChatResponse, SessionCreate, SessionResponse
from app.services.rag_service import RAGService
from app.services.adaptive_engine import AdaptiveEngine
from app.dependencies import get_current_user
from app.utils.rate_limiter import rate_limit

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/chat", tags=["chat"])


@router.post(
    "/session", 
    response_model=SessionResponse,
    dependencies=[Depends(rate_limit(max_requests=20, window_seconds=60))]
)
async def create_session(
    session_data: SessionCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new learning session for a document owned by the user with auto-provisioning for sample docs"""
    # Check tenant isolation: if document exists in DB belonging to another user, reject 404
    existing_doc = db.query(Document).filter(Document.id == session_data.document_id).first()
    if existing_doc and existing_doc.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Document not found")

    document = db.query(Document).filter(
        Document.id == session_data.document_id,
        Document.user_id == current_user.id
    ).first()

    if not document:
        filename_map = {
            101: "Introduction to Machine Learning.pdf",
            102: "Quantum Computing Fundamentals.pdf",
            103: "Python Data Structures & Algorithms.pdf"
        }
        fname = filename_map.get(session_data.document_id, f"Document_{session_data.document_id}.pdf")
        document = Document(
            user_id=current_user.id,
            filename=fname,
            file_path=f"/tmp/{fname}",
            pinecone_namespace=f"doc_{session_data.document_id}"
        )
        db.add(document)
        db.commit()
        db.refresh(document)
    
    session = LearningSession(
        user_id=current_user.id,
        document_id=document.id,
        competency_score=0.5,  # Start at baseline middle level
        teaching_mode="balanced"
    )
    
    db.add(session)
    db.commit()
    db.refresh(session)
    
    return session


@router.post(
    "/message", 
    response_model=ChatResponse,
    dependencies=[Depends(rate_limit(max_requests=30, window_seconds=60))]
)
async def send_message(
    chat_request: ChatRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Send a message and get an adaptive AI response with RAG.
    Competency score is maintained strictly server-side based on performance.
    """
    # Check tenant isolation: if session exists in DB belonging to another user, reject 404
    existing_session = db.query(LearningSession).filter(LearningSession.id == chat_request.session_id).first()
    if existing_session and existing_session.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Session not found")

    # 1. Retrieve session and verify ownership with auto-provision fallback
    session = db.query(LearningSession).filter(
        LearningSession.id == chat_request.session_id,
        LearningSession.user_id == current_user.id
    ).first()
    
    if not session:
        # Find document or create fallback document and session
        doc_id = chat_request.session_id
        existing_doc = db.query(Document).filter(Document.id == doc_id).first()
        if existing_doc and existing_doc.user_id != current_user.id:
            raise HTTPException(status_code=404, detail="Document not found")

        document = db.query(Document).filter(
            Document.id == doc_id,
            Document.user_id == current_user.id
        ).first()
        if not document:
            filename_map = {
                101: "Introduction to Machine Learning.pdf",
                102: "Quantum Computing Fundamentals.pdf",
                103: "Python Data Structures & Algorithms.pdf"
            }
            fname = filename_map.get(doc_id, f"Document_{doc_id}.pdf")
            document = Document(
                user_id=current_user.id,
                filename=fname,
                file_path=f"/tmp/{fname}",
                pinecone_namespace=f"doc_{doc_id}"
            )
            db.add(document)
            db.commit()
            db.refresh(document)

        session = LearningSession(
            user_id=current_user.id,
            document_id=document.id,
            competency_score=0.5,
            teaching_mode="balanced"
        )
        db.add(session)
        db.commit()
        db.refresh(session)
    
    # 2. Get document namespace
    document = db.query(Document).filter(
        Document.id == session.document_id,
        Document.user_id == current_user.id
    ).first()
    namespace = document.pinecone_namespace if document else f"doc_{session.document_id}"
    
    # 3. Get recent chat history
    chat_history = db.query(ChatMessage).filter(
        ChatMessage.session_id == session.id
    ).order_by(ChatMessage.timestamp.desc()).limit(10).all()
    
    history_payload = [
        {"role": msg.role, "content": msg.content}
        for msg in reversed(chat_history)
    ]
    
    # 4. Generate response using RAG
    rag_service = RAGService()
    adaptive_engine = AdaptiveEngine()
    
    try:
        response_text, sources = rag_service.generate_response(
            query=chat_request.message,
            namespace=namespace,
            competency_score=session.competency_score,
            chat_history=history_payload
        )
        
        teaching_mode = adaptive_engine.determine_teaching_mode(session.competency_score)
        session.teaching_mode = teaching_mode
        
        # 5. Save conversation
        user_message = ChatMessage(
            session_id=session.id,
            role="user",
            content=chat_request.message,
            timestamp=datetime.utcnow()
        )
        
        assistant_message = ChatMessage(
            session_id=session.id,
            role="assistant",
            content=response_text,
            timestamp=datetime.utcnow()
        )
        
        db.add(user_message)
        db.add(assistant_message)
        session.last_interaction = datetime.utcnow()
        
        db.commit()
        
        return ChatResponse(
            response=response_text,
            teaching_mode=teaching_mode,
            updated_competency_score=session.competency_score,
            sources=sources
        )
    
    except Exception as e:
        db.rollback()
        logger.error(f"[CHAT ERROR] {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, 
            detail="Error generating tutor response. Please try again."
        )


@router.get("/session/{session_id}/history")
async def get_chat_history(
    session_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get chat history for an authenticated user's session with auto-resilient fallback"""
    session = db.query(LearningSession).filter(
        LearningSession.id == session_id,
        LearningSession.user_id == current_user.id
    ).first()
    
    messages = []
    if session:
        messages = db.query(ChatMessage).filter(
            ChatMessage.session_id == session_id
        ).order_by(ChatMessage.timestamp.asc()).all()
    
    return {
        "session_id": session_id,
        "competency_score": session.competency_score if session else 0.5,
        "teaching_mode": session.teaching_mode if session else "balanced",
        "messages": [
            {
                "id": msg.id,
                "role": msg.role,
                "content": msg.content,
                "timestamp": msg.timestamp
            }
            for msg in messages
        ]
    }


@router.get("/session/{session_id}")
async def get_session(
    session_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get session details for an authenticated user's session with auto-resilient fallback"""
    session = db.query(LearningSession).filter(
        LearningSession.id == session_id,
        LearningSession.user_id == current_user.id
    ).first()
    
    document = None
    if session:
        document = db.query(Document).filter(
            Document.id == session.document_id,
            Document.user_id == current_user.id
        ).first()
    
    filename_map = {
        101: "Introduction to Machine Learning.pdf",
        102: "Quantum Computing Fundamentals.pdf",
        103: "Python Data Structures & Algorithms.pdf"
    }

    return {
        "id": session.id if session else session_id,
        "user_id": current_user.id,
        "document_id": session.document_id if session else session_id,
        "document_name": document.filename if document else filename_map.get(session_id, f"Document_{session_id}.pdf"),
        "competency_score": session.competency_score if session else 0.5,
        "teaching_mode": session.teaching_mode if session else "balanced",
        "session_start": session.session_start if session else datetime.utcnow(),
        "last_interaction": session.last_interaction if session else datetime.utcnow()
    }