from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime

from app.database import get_db, LearningSession, ChatMessage, Document
from app.schemas import ChatRequest, ChatResponse, SessionCreate, SessionResponse
from app.services.rag_service import RAGService
from app.services.adaptive_engine import AdaptiveEngine

router = APIRouter(prefix="/api/chat", tags=["chat"])


@router.post("/session", response_model=SessionResponse)
async def create_session(
    session_data: SessionCreate,
    db: Session = Depends(get_db)
):
    """Create a new learning session"""
    
    # Verify document exists
    document = db.query(Document).filter(Document.id == session_data.document_id).first()
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    
    # Create session
    session = LearningSession(
        user_id=session_data.user_id,
        document_id=session_data.document_id,
        competency_score=0.5,  # Start at middle level
        teaching_mode="balanced"
    )
    
    db.add(session)
    db.commit()
    db.refresh(session)
    
    return session


@router.post("/message", response_model=ChatResponse)
async def send_message(
    chat_request: ChatRequest,
    db: Session = Depends(get_db)
):
    """
    Send a message and get AI response with RAG
    
    This is the core endpoint that:
    1. Retrieves the learning session
    2. Gets chat history
    3. Uses competency_score to determine teaching mode
    4. Performs RAG (retrieval from Pinecone + LLM generation)
    5. Saves the conversation
    6. Returns adaptive response
    """
    
    # Get session
    session = db.query(LearningSession).filter(
        LearningSession.id == chat_request.session_id
    ).first()
    
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    # Update competency score if provided
    if chat_request.competency_score is not None:
        session.competency_score = chat_request.competency_score
    
    # Get document namespace
    document = db.query(Document).filter(Document.id == session.document_id).first()
    namespace = document.pinecone_namespace
    
    # Get chat history
    chat_history = db.query(ChatMessage).filter(
        ChatMessage.session_id == session.id
    ).order_by(ChatMessage.timestamp.desc()).limit(10).all()
    
    chat_history = [
        {"role": msg.role, "content": msg.content}
        for msg in reversed(chat_history)
    ]
    
    # Generate response using RAG
    rag_service = RAGService()
    adaptive_engine = AdaptiveEngine()
    
    try:
        response_text, sources = rag_service.generate_response(
            query=chat_request.message,
            namespace=namespace,
            competency_score=session.competency_score,
            chat_history=chat_history
        )
        
        # Determine teaching mode
        teaching_mode = adaptive_engine.determine_teaching_mode(session.competency_score)
        session.teaching_mode = teaching_mode
        
        # Save messages
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
        
        # Update session timestamp
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
        raise HTTPException(status_code=500, detail=f"Error generating response: {str(e)}")


@router.get("/session/{session_id}/history")
async def get_chat_history(
    session_id: int,
    db: Session = Depends(get_db)
):
    """Get chat history for a session"""
    
    session = db.query(LearningSession).filter(LearningSession.id == session_id).first()
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
    db: Session = Depends(get_db)
):
    """Get session details"""
    
    session = db.query(LearningSession).filter(LearningSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    document = db.query(Document).filter(Document.id == session.document_id).first()
    
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


@router.put("/session/{session_id}/competency")
async def update_competency(
    session_id: int,
    competency_score: float,
    db: Session = Depends(get_db)
):
    """
    Update competency score manually
    This endpoint allows the frontend to update the score based on quiz results
    """
    
    if not 0 <= competency_score <= 1:
        raise HTTPException(status_code=400, detail="Competency score must be between 0 and 1")
    
    session = db.query(LearningSession).filter(LearningSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    session.competency_score = competency_score
    
    # Update teaching mode
    adaptive_engine = AdaptiveEngine()
    session.teaching_mode = adaptive_engine.determine_teaching_mode(competency_score)
    
    db.commit()
    db.refresh(session)
    
    return {
        "session_id": session_id,
        "competency_score": session.competency_score,
        "teaching_mode": session.teaching_mode,
        "message": "Competency score updated successfully"
    }
