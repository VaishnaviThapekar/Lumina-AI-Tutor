# backend/app/api/settings.py
"""
User Settings API
Handles user preferences, notifications, learning settings, profile editing,
password changes, and account deletion — all scoped to the authenticated
user, never by a raw user_id in the URL.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional

from app.database import get_db, User
from app.dependencies import get_current_user
from app.utils.security import hash_password, verify_password

router = APIRouter(prefix="/api/settings", tags=["settings"])


# Pydantic Models for Settings
class UserProfileUpdate(BaseModel):
    username: Optional[str] = None
    email: Optional[str] = None


class NotificationSettings(BaseModel):
    quiz_reminders: bool = True
    progress_updates: bool = True
    feature_announcements: bool = False


class AppearanceSettings(BaseModel):
    theme: str = "light"  # light, dark, auto


class LearningPreferences(BaseModel):
    default_quiz_difficulty: str = "mixed"  # easy, medium, hard, mixed
    questions_per_quiz: int = 5


class UserSettings(BaseModel):
    profile: UserProfileUpdate
    notifications: NotificationSettings
    appearance: AppearanceSettings
    learning: LearningPreferences


class PasswordChangeRequest(BaseModel):
    current_password: str
    new_password: str


class AccountDeleteRequest(BaseModel):
    password: str


def _settings_payload(user: User) -> dict:
    return {
        "profile": {
            "username": user.username,
            "email": user.email
        },
        "notifications": {
            "quiz_reminders": user.quiz_reminders,
            "progress_updates": user.progress_updates,
            "feature_announcements": user.feature_announcements
        },
        "appearance": {
            "theme": user.theme
        },
        "learning": {
            "default_quiz_difficulty": user.default_quiz_difficulty,
            "questions_per_quiz": user.questions_per_quiz
        }
    }


# GET current user's settings
@router.get("")
async def get_user_settings(
    current_user: User = Depends(get_current_user),
):
    """Get all settings for the authenticated user"""
    return _settings_payload(current_user)


# UPDATE profile settings
@router.put("/profile")
async def update_profile(
    profile: UserProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update the authenticated user's profile information"""
    if profile.username:
        existing = db.query(User).filter(
            User.username == profile.username,
            User.id != current_user.id
        ).first()
        if existing:
            raise HTTPException(status_code=400, detail="Username already taken")
        current_user.username = profile.username

    if profile.email:
        existing = db.query(User).filter(
            User.email == profile.email,
            User.id != current_user.id
        ).first()
        if existing:
            raise HTTPException(status_code=400, detail="Email already taken")
        current_user.email = profile.email

    db.commit()
    db.refresh(current_user)

    return {
        "message": "Profile updated successfully",
        "username": current_user.username,
        "email": current_user.email
    }


# CHANGE password
@router.put("/password")
async def change_password(
    request: PasswordChangeRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Change the authenticated user's password"""
    if not verify_password(request.current_password, current_user.hashed_password):
        raise HTTPException(status_code=400, detail="Current password is incorrect")

    if len(request.new_password) < 8:
        raise HTTPException(status_code=400, detail="New password must be at least 8 characters")

    current_user.hashed_password = hash_password(request.new_password)
    db.commit()

    return {"message": "Password changed successfully"}


# DELETE account
@router.delete("/account")
async def delete_account(
    request: AccountDeleteRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Permanently delete the authenticated user's account and all their data
    (documents, sessions, quiz attempts, flashcards). Requires re-entering
    the password as a safety confirmation.
    """
    if not verify_password(request.password, current_user.hashed_password):
        raise HTTPException(status_code=400, detail="Password is incorrect")

    # Import here to avoid circular imports at module load time
    from app.database import Document, LearningSession, ChatMessage, QuizAttempt, Flashcard

    user_id = current_user.id

    # Delete dependent rows first (no cascade configured on these FKs)
    db.query(Flashcard).filter(Flashcard.user_id == user_id).delete()
    db.query(QuizAttempt).filter(QuizAttempt.user_id == user_id).delete()

    session_ids = [s.id for s in db.query(LearningSession).filter(LearningSession.user_id == user_id).all()]
    if session_ids:
        db.query(ChatMessage).filter(ChatMessage.session_id.in_(session_ids)).delete(synchronize_session=False)
    db.query(LearningSession).filter(LearningSession.user_id == user_id).delete()

    db.query(Document).filter(Document.user_id == user_id).delete()

    db.delete(current_user)
    db.commit()

    return {"message": "Account deleted"}


# UPDATE notification settings
@router.put("/notifications")
async def update_notifications(
    notifications: NotificationSettings,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update notification preferences"""
    current_user.quiz_reminders = notifications.quiz_reminders
    current_user.progress_updates = notifications.progress_updates
    current_user.feature_announcements = notifications.feature_announcements

    db.commit()

    return {
        "message": "Notification settings updated",
        "settings": notifications.dict()
    }


# UPDATE appearance settings
@router.put("/appearance")
async def update_appearance(
    appearance: AppearanceSettings,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update appearance preferences"""
    if appearance.theme not in ["light", "dark", "auto"]:
        raise HTTPException(status_code=400, detail="Invalid theme")

    current_user.theme = appearance.theme
    db.commit()

    return {
        "message": "Appearance settings updated",
        "theme": appearance.theme
    }


# UPDATE learning preferences
@router.put("/learning")
async def update_learning_preferences(
    learning: LearningPreferences,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update learning preferences"""
    if learning.default_quiz_difficulty not in ["easy", "medium", "hard", "mixed"]:
        raise HTTPException(status_code=400, detail="Invalid difficulty")

    if not 3 <= learning.questions_per_quiz <= 20:
        raise HTTPException(status_code=400, detail="Questions per quiz must be between 3 and 20")

    current_user.default_quiz_difficulty = learning.default_quiz_difficulty
    current_user.questions_per_quiz = learning.questions_per_quiz

    db.commit()

    return {
        "message": "Learning preferences updated",
        "settings": learning.dict()
    }


# UPDATE all settings at once
@router.put("")
async def update_all_settings(
    settings: UserSettings,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update all settings for the authenticated user at once"""
    if settings.profile.username:
        current_user.username = settings.profile.username
    if settings.profile.email:
        current_user.email = settings.profile.email

    current_user.quiz_reminders = settings.notifications.quiz_reminders
    current_user.progress_updates = settings.notifications.progress_updates
    current_user.feature_announcements = settings.notifications.feature_announcements

    current_user.theme = settings.appearance.theme

    current_user.default_quiz_difficulty = settings.learning.default_quiz_difficulty
    current_user.questions_per_quiz = settings.learning.questions_per_quiz

    db.commit()
    db.refresh(current_user)

    return {
        "message": "All settings updated successfully",
        "settings": _settings_payload(current_user)
    }


# RESET settings to defaults
@router.post("/reset")
async def reset_settings(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Reset all settings to defaults for the authenticated user"""
    current_user.quiz_reminders = True
    current_user.progress_updates = True
    current_user.feature_announcements = False
    current_user.theme = "light"
    current_user.default_quiz_difficulty = "mixed"
    current_user.questions_per_quiz = 5

    db.commit()

    return {"message": "Settings reset to defaults"}
