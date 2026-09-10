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
    """Create a new learning session for a document owned by the user"""
    document = db.query(Document).filter(
        Document.id == session_data.document_id,
        Document.user_id == current_user.id
    ).first()
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    
    session = LearningSession(
        user_id=current_user.id,
        document_id=session_data.document_id,
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
    # 1. Retrieve session and verify ownership
    session = db.query(LearningSession).filter(
        LearningSession.id == chat_request.session_id,
        LearningSession.user_id == current_user.id
    ).first()
    
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    # 2. Get document namespace
    document = db.query(Document).filter(
        Document.id == session.document_id,
        Document.user_id == current_user.id
    ).first()
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    
    namespace = document.pinecone_namespace
    
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
    """Get chat history for an authenticated user's session"""
    session = db.query(LearningSession).filter(
        LearningSession.id == session_id,
        LearningSession.user_id == current_user.id
    ).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    messages = db.query(ChatMessage).filter(
        ChatMessage.session_id == session_id
    ).order_by(ChatMessage.timestamp.asc()).all()
    
    return {
        "session_id": session_id,
        "competency_score": session.competency_score,
        "teaching_mode": session.teaching_mode,
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
    """Get session details for an authenticated user's session"""
    session = db.query(LearningSession).filter(
        LearningSession.id == session_id,
        LearningSession.user_id == current_user.id
    ).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    document = db.query(Document).filter(
        Document.id == session.document_id,
        Document.user_id == current_user.id
    ).first()
    
    return {
        "id": session.id,
        "user_id": session.user_id,
        "document_id": session.document_id,
        "document_name": document.filename if document else None,
        "competency_score": session.competency_score,
        "teaching_mode": session.teaching_mode,
        "session_start": session.session_start,
        "last_interaction": session.last_interaction
    }