from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import json
from datetime import datetime

from app.database import get_db, QuizAttempt, LearningSession, Document, User
from app.schemas import (
    QuizGenerateRequest, 
    QuizResponse, 
    QuizSubmission, 
    QuizResult,
    QuizQuestion
)
from app.services.quiz_generator import QuizGenerator
from app.services.adaptive_engine import AdaptiveEngine
from app.dependencies import get_current_user

router = APIRouter(prefix="/api/quiz", tags=["quiz"])


@router.post("/generate", response_model=QuizResponse)
async def generate_quiz(
    request: QuizGenerateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Generate a quiz based on document content
    
    Process:
    1. Retrieve document namespace
    2. Use QuizGenerator to create questions from content
    3. Return quiz with unique ID
    """
    
    # Verify document exists
    document = db.query(Document).filter(Document.id == request.document_id).first()
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    
    try:
        # Generate quiz
        quiz_generator = QuizGenerator()
        questions = quiz_generator.generate_quiz(
            namespace=document.pinecone_namespace,
            num_questions=request.num_questions,
            difficulty=request.difficulty or "mixed"
        )
        
        # Create quiz attempt record (without answers yet)
        quiz_data = json.dumps(questions)
        
        # For now, create a pending quiz attempt
        # We'll update it when the user submits
        quiz_attempt = QuizAttempt(
            user_id=current_user.id,
            document_id=request.document_id,
            quiz_data=quiz_data,
            score=0.0,
            total_questions=len(questions),
            correct_answers=0,
            attempted_at=datetime.utcnow()
        )
        
        db.add(quiz_attempt)
        db.commit()
        db.refresh(quiz_attempt)
        
        # Format response (without correct answers and explanations)
        quiz_questions = [
            QuizQuestion(
                question=q["question"],
                options=q["options"],
                correct_answer=q["correct_answer"],
                explanation=q["explanation"]
            )
            for q in questions
        ]
        
        return QuizResponse(
            quiz_id=quiz_attempt.id,
            questions=quiz_questions
        )
    
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error generating quiz: {str(e)}")


@router.post("/submit", response_model=QuizResult)
async def submit_quiz(
    submission: QuizSubmission,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Submit quiz answers and update competency score
    
    Process:
    1. Retrieve quiz and answers
    2. Grade the submission
    3. Calculate new competency score
    4. Update learning session
    5. Save results
    """
    
    # Get quiz attempt
    quiz_attempt = db.query(QuizAttempt).filter(
        QuizAttempt.id == submission.quiz_id
    ).first()
    
    if not quiz_attempt or quiz_attempt.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Quiz not found")
    
    # Get session
    session = db.query(LearningSession).filter(
        LearningSession.id == submission.session_id
    ).first()
    
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    try:
        # Parse quiz questions
        questions = json.loads(quiz_attempt.quiz_data)
        
        if len(submission.answers) != len(questions):
            raise HTTPException(
                status_code=400, 
                detail="Number of answers doesn't match number of questions"
            )
        
        # Grade quiz
        correct_count = 0
        feedback = []
        
        for i, (question, user_answer) in enumerate(zip(questions, submission.answers)):
            is_correct = user_answer == question["correct_answer"]
            if is_correct:
                correct_count += 1
            
            # Get teaching mode for feedback formatting
            adaptive_engine = AdaptiveEngine()
            teaching_mode = adaptive_engine.determine_teaching_mode(session.competency_score)
            
            formatted_feedback = adaptive_engine.format_feedback(
                is_correct=is_correct,
                teaching_mode=teaching_mode,
                explanation=question["explanation"]
            )
            
            feedback.append({
                "question_number": i + 1,
                "question": question["question"],
                "user_answer": question["options"][user_answer],
                "correct_answer": question["options"][question["correct_answer"]],
                "is_correct": is_correct,
                "feedback": formatted_feedback
            })
        
        # Calculate score
        score = correct_count / len(questions)
        
        # Update quiz attempt
        quiz_attempt.score = score
        quiz_attempt.correct_answers = correct_count
        quiz_attempt.attempted_at = datetime.utcnow()
        
        # Update competency score using adaptive engine
        adaptive_engine = AdaptiveEngine()
        new_competency_score = adaptive_engine.update_competency_score(
            current_score=session.competency_score,
            quiz_performance=score,
            weight=0.3  # 30% weight to new performance
        )
        
        session.competency_score = new_competency_score
        session.teaching_mode = adaptive_engine.determine_teaching_mode(new_competency_score)
        session.last_interaction = datetime.utcnow()
        
        db.commit()
        
        return QuizResult(
            score=score,
            correct_answers=correct_count,
            total_questions=len(questions),
            updated_competency_score=new_competency_score,
            feedback=feedback
        )
    
    except json.JSONDecodeError:
        raise HTTPException(status_code=500, detail="Error parsing quiz data")
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error submitting quiz: {str(e)}")


@router.get("/history")
async def get_quiz_history(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get quiz history for the authenticated user"""
    
    attempts = db.query(QuizAttempt).filter(
        QuizAttempt.user_id == current_user.id
    ).order_by(QuizAttempt.attempted_at.desc()).all()
    
    history = []
    for attempt in attempts:
        document = db.query(Document).filter(Document.id == attempt.document_id).first()
        
        history.append({
            "quiz_id": attempt.id,
            "document_name": document.filename if document else "Unknown",
            "score": attempt.score,
            "correct_answers": attempt.correct_answers,
            "total_questions": attempt.total_questions,
            "attempted_at": attempt.attempted_at
        })
    
    return {"history": history}


@router.get("/{quiz_id}/review")
async def review_quiz(
    quiz_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get detailed review of a completed quiz"""
    
    quiz_attempt = db.query(QuizAttempt).filter(QuizAttempt.id == quiz_id).first()
    
    if not quiz_attempt or quiz_attempt.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Quiz not found")
    
    questions = json.loads(quiz_attempt.quiz_data)
    
    return {
        "quiz_id": quiz_id,
        "score": quiz_attempt.score,
        "correct_answers": quiz_attempt.correct_answers,
        "total_questions": quiz_attempt.total_questions,
        "attempted_at": quiz_attempt.attempted_at,
        "questions": questions
    }
