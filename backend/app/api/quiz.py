from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
import json
from datetime import datetime
import logging

from app.database import get_db, QuizAttempt, LearningSession, Document, User
from app.schemas import (
    QuizGenerateRequest, 
    QuizResponse, 
    QuizSubmission, 
    QuizResult,
    QuizQuestionPublic,
    QuizFeedbackItem
)
from app.services.quiz_generator import QuizGenerator
from app.services.adaptive_engine import AdaptiveEngine
from app.dependencies import get_current_user
from app.utils.rate_limiter import rate_limit

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/quiz", tags=["quiz"])


@router.post(
    "/generate", 
    response_model=QuizResponse,
    dependencies=[Depends(rate_limit(max_requests=10, window_seconds=60))]
)
async def generate_quiz(
    request: QuizGenerateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Generate a quiz based on document content.
    Enforces user ownership on the requested document and NEVER returns
    answer keys or explanations before submission.
    """
    # Verify document exists AND belongs to the authenticated user (IDOR prevention)
    document = db.query(Document).filter(
        Document.id == request.document_id,
        Document.user_id == current_user.id
    ).first()
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    
    try:
        # Generate quiz from document content
        quiz_generator = QuizGenerator()
        questions = quiz_generator.generate_quiz(
            namespace=document.pinecone_namespace,
            num_questions=request.num_questions,
            difficulty=request.difficulty or "mixed"
        )
        
        # Save complete quiz data (with answers) securely in the database
        quiz_data = json.dumps(questions)
        
        quiz_attempt = QuizAttempt(
            user_id=current_user.id,
            document_id=request.document_id,
            quiz_data=quiz_data,
            score=0.0,
            total_questions=len(questions),
            correct_answers=0,
            submitted=False,
            attempted_at=datetime.utcnow()
        )
        
        db.add(quiz_attempt)
        db.commit()
        db.refresh(quiz_attempt)
        
        # Format public response WITHOUT correct_answers or explanations
        public_questions = [
            QuizQuestionPublic(
                question=q["question"],
                options=q["options"]
            )
            for q in questions
        ]
        
        return QuizResponse(
            quiz_id=quiz_attempt.id,
            questions=public_questions
        )
    
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"[QUIZ GENERATE ERROR] {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Error generating quiz. Please try again.")


@router.post(
    "/submit", 
    response_model=QuizResult,
    dependencies=[Depends(rate_limit(max_requests=20, window_seconds=60))]
)
async def submit_quiz(
    submission: QuizSubmission,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Submit quiz answers and update competency score.
    Strictly validates ownership of both quiz attempt and learning session,
    validates all answer indices, and protects against replay/double-reward attacks.
    """
    # 1. Verify quiz attempt ownership
    quiz_attempt = db.query(QuizAttempt).filter(
        QuizAttempt.id == submission.quiz_id,
        QuizAttempt.user_id == current_user.id
    ).first()
    
    if not quiz_attempt:
        raise HTTPException(status_code=404, detail="Quiz attempt not found")
    
    # 2. Verify learning session ownership (IDOR prevention)
    session = db.query(LearningSession).filter(
        LearningSession.id == submission.session_id,
        LearningSession.user_id == current_user.id
    ).first()
    
    if not session:
        raise HTTPException(status_code=404, detail="Learning session not found")
    
    # 3. Check replay attack
    if quiz_attempt.submitted:
        raise HTTPException(status_code=400, detail="This quiz has already been submitted.")
    
    try:
        questions = json.loads(quiz_attempt.quiz_data)
        
        # 4. Validate answer count
        if len(submission.answers) != len(questions):
            raise HTTPException(
                status_code=400, 
                detail=f"Expected {len(questions)} answers, but received {len(submission.answers)}."
            )
        
        # 5. Validate answer index bounds for each question
        correct_count = 0
        feedback = []
        adaptive_engine = AdaptiveEngine()
        teaching_mode = adaptive_engine.determine_teaching_mode(session.competency_score)
        
        for i, (question, user_answer) in enumerate(zip(questions, submission.answers)):
            num_options = len(question.get("options", []))
            if not isinstance(user_answer, int) or user_answer < 0 or user_answer >= num_options:
                raise HTTPException(
                    status_code=400,
                    detail=f"Invalid answer index {user_answer} for question {i + 1}."
                )
            
            correct_idx = int(question["correct_answer"])
            is_correct = (user_answer == correct_idx)
            if is_correct:
                correct_count += 1
            
            formatted_feedback = adaptive_engine.format_feedback(
                is_correct=is_correct,
                teaching_mode=teaching_mode,
                explanation=question.get("explanation", "")
            )
            
            feedback.append(QuizFeedbackItem(
                question_number=i + 1,
                question=question["question"],
                user_answer=question["options"][user_answer],
                correct_answer=question["options"][correct_idx],
                is_correct=is_correct,
                feedback=formatted_feedback
            ))
        
        # 6. Calculate normalized score (0.0 - 1.0)
        score = correct_count / len(questions) if questions else 0.0
        
        # 7. Update quiz attempt record
        quiz_attempt.score = score
        quiz_attempt.correct_answers = correct_count
        quiz_attempt.submitted = True
        quiz_attempt.attempted_at = datetime.utcnow()
        
        # 8. Update competency score in session
        new_competency_score = adaptive_engine.update_competency_score(
            current_score=session.competency_score,
            quiz_performance=score,
            weight=0.3
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
    
    except HTTPException:
        db.rollback()
        raise
    except json.JSONDecodeError:
        db.rollback()
        raise HTTPException(status_code=500, detail="Corrupted quiz data")
    except Exception as e:
        db.rollback()
        logger.error(f"[QUIZ SUBMIT ERROR] {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Error processing quiz submission")


@router.get("/history")
async def get_quiz_history(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get quiz history for the authenticated user"""
    attempts = db.query(QuizAttempt).filter(
        QuizAttempt.user_id == current_user.id,
        QuizAttempt.submitted == True
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
    """Get detailed review of a completed quiz owned by user"""
    quiz_attempt = db.query(QuizAttempt).filter(
        QuizAttempt.id == quiz_id,
        QuizAttempt.user_id == current_user.id
    ).first()
    
    if not quiz_attempt or not quiz_attempt.submitted:
        raise HTTPException(status_code=404, detail="Completed quiz not found")
    
    questions = json.loads(quiz_attempt.quiz_data)
    
    return {
        "quiz_id": quiz_id,
        "score": quiz_attempt.score,
        "correct_answers": quiz_attempt.correct_answers,
        "total_questions": quiz_attempt.total_questions,
        "attempted_at": quiz_attempt.attempted_at,
        "questions": questions
    }
