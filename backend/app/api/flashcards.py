from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime
from typing import List

from app.database import get_db, Flashcard, Document, User
from app.schemas import FlashcardGenerateRequest, FlashcardResponse, FlashcardReviewRequest
from app.services.flashcard_generator import FlashcardGenerator
from app.services.spaced_repetition import schedule_next_review
from app.dependencies import get_current_user

router = APIRouter(prefix="/api/flashcards", tags=["flashcards"])


@router.post("/generate", response_model=List[FlashcardResponse])
async def generate_flashcards(
    request: FlashcardGenerateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Generate a new batch of flashcards from a document's content."""
    document = db.query(Document).filter(
        Document.id == request.document_id,
        Document.user_id == current_user.id
    ).first()
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")

    try:
        generator = FlashcardGenerator()
        cards = generator.generate_flashcards(
            namespace=document.pinecone_namespace,
            num_cards=request.num_cards
        )

        db_cards = []
        for card in cards:
            db_card = Flashcard(
                user_id=current_user.id,
                document_id=document.id,
                front=card["front"],
                back=card["back"],
                ease_factor=2.5,
                interval_days=0,
                repetitions=0,
                next_review_at=datetime.utcnow(),  # due immediately
            )
            db.add(db_card)
            db_cards.append(db_card)

        db.commit()
        for c in db_cards:
            db.refresh(c)

        return db_cards

    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error generating flashcards: {str(e)}")


@router.get("/due", response_model=List[FlashcardResponse])
async def get_due_flashcards(
    document_id: int = None,
    limit: int = 20,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get flashcards that are due for review right now (next_review_at <= now)."""
    query = db.query(Flashcard).filter(
        Flashcard.user_id == current_user.id,
        Flashcard.next_review_at <= datetime.utcnow()
    )
    if document_id is not None:
        query = query.filter(Flashcard.document_id == document_id)

    cards = query.order_by(Flashcard.next_review_at.asc()).limit(limit).all()
    return cards


@router.get("/all", response_model=List[FlashcardResponse])
async def get_all_flashcards(
    document_id: int = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all of the current user's flashcards, optionally filtered by document."""
    query = db.query(Flashcard).filter(Flashcard.user_id == current_user.id)
    if document_id is not None:
        query = query.filter(Flashcard.document_id == document_id)
    return query.order_by(Flashcard.next_review_at.asc()).all()


@router.post("/review", response_model=FlashcardResponse)
async def review_flashcard(
    review: FlashcardReviewRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Submit a review for a flashcard using SM-2 quality rating (0-5):
    0-2 = forgot it, 3 = recalled with difficulty, 4 = recalled with hesitation,
    5 = recalled perfectly. Updates the card's scheduling.
    """
    card = db.query(Flashcard).filter(
        Flashcard.id == review.flashcard_id,
        Flashcard.user_id == current_user.id
    ).first()
    if not card:
        raise HTTPException(status_code=404, detail="Flashcard not found")

    new_ease, new_interval, new_reps, next_review = schedule_next_review(
        quality=review.quality,
        ease_factor=card.ease_factor,
        interval_days=card.interval_days,
        repetitions=card.repetitions,
    )

    card.ease_factor = new_ease
    card.interval_days = new_interval
    card.repetitions = new_reps
    card.next_review_at = next_review
    card.last_reviewed_at = datetime.utcnow()

    db.commit()
    db.refresh(card)

    return card


@router.delete("/{flashcard_id}")
async def delete_flashcard(
    flashcard_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a flashcard."""
    card = db.query(Flashcard).filter(
        Flashcard.id == flashcard_id,
        Flashcard.user_id == current_user.id
    ).first()
    if not card:
        raise HTTPException(status_code=404, detail="Flashcard not found")

    db.delete(card)
    db.commit()
    return {"message": "Flashcard deleted"}
