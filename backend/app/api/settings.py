"""
User Settings API
Handles user preferences, notifications, learning settings, profile editing,
password changes, and account deletion — all scoped strictly to the authenticated
user derived from the verified token.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field, EmailStr
from typing import Optional
from pathlib import Path
import logging

from app.database import get_db, User, Document
from app.dependencies import get_current_user
from app.utils.security import hash_password, verify_password
from app.services.vector_store import VectorStoreService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/settings", tags=["settings"])


# Pydantic Models for Settings
class UserProfileUpdate(BaseModel):
    username: Optional[str] = Field(None, min_length=3, max_length=50, pattern=r'^[a-zA-Z0-9_\-.]+$')
    email: Optional[EmailStr] = None


class NotificationSettings(BaseModel):
    quiz_reminders: bool = True
    progress_updates: bool = True
    feature_announcements: bool = False


class AppearanceSettings(BaseModel):
    theme: str = "light"  # light, dark, auto


class LearningPreferences(BaseModel):
    default_quiz_difficulty: str = "mixed"  # easy, medium, hard, mixed
    questions_per_quiz: int = Field(5, ge=3, le=20)


class UserSettings(BaseModel):
    profile: Optional[UserProfileUpdate] = None
    notifications: Optional[NotificationSettings] = None
    appearance: Optional[AppearanceSettings] = None
    learning: Optional[LearningPreferences] = None


class PasswordChangeRequest(BaseModel):
    current_password: str = Field(..., min_length=1, max_length=72)
    new_password: str = Field(..., min_length=8, max_length=72)


class AccountDeleteRequest(BaseModel):
    password: Optional[str] = None


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
        clean_email = profile.email.lower().strip()
        existing = db.query(User).filter(
            User.email == clean_email,
            User.id != current_user.id
        ).first()
        if existing:
            raise HTTPException(status_code=400, detail="Email already taken")
        current_user.email = clean_email

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

    try:
        current_user.hashed_password = hash_password(request.new_password)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    db.commit()
    return {"message": "Password changed successfully"}


# DELETE account & full cleanup
@router.delete("/account")
async def delete_account(
    request: AccountDeleteRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Permanently delete user account and clean up all resources:
    - Uploaded files on disk
    - Pinecone vector store namespaces
    - SQL database records (documents, sessions, chat, quizzes, flashcards, tokens, user)
    """
    # If password is provided or user has a non-empty password, check it
    if request.password:
        if not verify_password(request.password, current_user.hashed_password):
            raise HTTPException(status_code=400, detail="Password is incorrect")

    user_id = current_user.id
    user_docs = db.query(Document).filter(Document.user_id == user_id).all()
    vector_store = VectorStoreService()

    # 1. Clean up user files on disk and vector namespaces
    for doc in user_docs:
        try:
            vector_store.delete_namespace(doc.pinecone_namespace)
        except Exception as ve:
            logger.warning(f"Could not delete vectors for {doc.pinecone_namespace}: {str(ve)}")

        try:
            file_path = Path(doc.file_path)
            if file_path.exists():
                file_path.unlink()
        except Exception as fe:
            logger.warning(f"Could not delete file {doc.file_path}: {str(fe)}")

    # 2. Delete user (SQLAlchemy cascade deletes dependent records)
    db.delete(current_user)
    db.commit()

    logger.info(f"User {user_id} and all associated resources permanently deleted.")
    return {"message": "Account and all associated data permanently deleted"}


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
        "settings": notifications.model_dump()
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

    current_user.default_quiz_difficulty = learning.default_quiz_difficulty
    current_user.questions_per_quiz = learning.questions_per_quiz

    db.commit()

    return {
        "message": "Learning preferences updated",
        "settings": learning.model_dump()
    }


# UPDATE all settings at once
@router.put("")
async def update_all_settings(
    settings_data: UserSettings,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update all settings for the authenticated user at once"""
    if settings_data.profile:
        if settings_data.profile.username:
            existing = db.query(User).filter(
                User.username == settings_data.profile.username,
                User.id != current_user.id
            ).first()
            if existing:
                raise HTTPException(status_code=400, detail="Username already taken")
            current_user.username = settings_data.profile.username

        if settings_data.profile.email:
            clean_email = settings_data.profile.email.lower().strip()
            existing = db.query(User).filter(
                User.email == clean_email,
                User.id != current_user.id
            ).first()
            if existing:
                raise HTTPException(status_code=400, detail="Email already taken")
            current_user.email = clean_email

    if settings_data.notifications:
        current_user.quiz_reminders = settings_data.notifications.quiz_reminders
        current_user.progress_updates = settings_data.notifications.progress_updates
        current_user.feature_announcements = settings_data.notifications.feature_announcements

    if settings_data.appearance:
        if settings_data.appearance.theme in ["light", "dark", "auto"]:
            current_user.theme = settings_data.appearance.theme

    if settings_data.learning:
        if settings_data.learning.default_quiz_difficulty in ["easy", "medium", "hard", "mixed"]:
            current_user.default_quiz_difficulty = settings_data.learning.default_quiz_difficulty
        current_user.questions_per_quiz = settings_data.learning.questions_per_quiz

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
