# backend/app/api/settings.py
"""
User Settings API
Handles user preferences, notifications, learning settings, etc.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional

from app.database import get_db, User

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


# GET user settings
@router.get("/{user_id}")
async def get_user_settings(
    user_id: int,
    db: Session = Depends(get_db)
):
    """Get all settings for a user"""
    user = db.query(User).filter(User.id == user_id).first()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Get user settings (or defaults if not set)
    settings = {
        "profile": {
            "username": user.username,
            "email": user.email
        },
        "notifications": {
            "quiz_reminders": getattr(user, 'quiz_reminders', True),
            "progress_updates": getattr(user, 'progress_updates', True),
            "feature_announcements": getattr(user, 'feature_announcements', False)
        },
        "appearance": {
            "theme": getattr(user, 'theme', 'light')
        },
        "learning": {
            "default_quiz_difficulty": getattr(user, 'default_quiz_difficulty', 'mixed'),
            "questions_per_quiz": getattr(user, 'questions_per_quiz', 5)
        }
    }
    
    return settings


# UPDATE profile settings
@router.put("/{user_id}/profile")
async def update_profile(
    user_id: int,
    profile: UserProfileUpdate,
    db: Session = Depends(get_db)
):
    """Update user profile information"""
    user = db.query(User).filter(User.id == user_id).first()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if profile.username:
        # Check if username already exists
        existing = db.query(User).filter(
            User.username == profile.username,
            User.id != user_id
        ).first()
        if existing:
            raise HTTPException(status_code=400, detail="Username already taken")
        user.username = profile.username
    
    if profile.email:
        # Check if email already exists
        existing = db.query(User).filter(
            User.email == profile.email,
            User.id != user_id
        ).first()
        if existing:
            raise HTTPException(status_code=400, detail="Email already taken")
        user.email = profile.email
    
    db.commit()
    db.refresh(user)
    
    return {
        "message": "Profile updated successfully",
        "username": user.username,
        "email": user.email
    }


# UPDATE notification settings
@router.put("/{user_id}/notifications")
async def update_notifications(
    user_id: int,
    notifications: NotificationSettings,
    db: Session = Depends(get_db)
):
    """Update notification preferences"""
    user = db.query(User).filter(User.id == user_id).first()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Store in user object (you may want to create a separate Settings table)
    user.quiz_reminders = notifications.quiz_reminders
    user.progress_updates = notifications.progress_updates
    user.feature_announcements = notifications.feature_announcements
    
    db.commit()
    
    return {
        "message": "Notification settings updated",
        "settings": notifications.dict()
    }


# UPDATE appearance settings
@router.put("/{user_id}/appearance")
async def update_appearance(
    user_id: int,
    appearance: AppearanceSettings,
    db: Session = Depends(get_db)
):
    """Update appearance preferences"""
    user = db.query(User).filter(User.id == user_id).first()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if appearance.theme not in ["light", "dark", "auto"]:
        raise HTTPException(status_code=400, detail="Invalid theme")
    
    user.theme = appearance.theme
    
    db.commit()
    
    return {
        "message": "Appearance settings updated",
        "theme": appearance.theme
    }


# UPDATE learning preferences
@router.put("/{user_id}/learning")
async def update_learning_preferences(
    user_id: int,
    learning: LearningPreferences,
    db: Session = Depends(get_db)
):
    """Update learning preferences"""
    user = db.query(User).filter(User.id == user_id).first()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if learning.default_quiz_difficulty not in ["easy", "medium", "hard", "mixed"]:
        raise HTTPException(status_code=400, detail="Invalid difficulty")
    
    if not 3 <= learning.questions_per_quiz <= 20:
        raise HTTPException(status_code=400, detail="Questions per quiz must be between 3 and 20")
    
    user.default_quiz_difficulty = learning.default_quiz_difficulty
    user.questions_per_quiz = learning.questions_per_quiz
    
    db.commit()
    
    return {
        "message": "Learning preferences updated",
        "settings": learning.dict()
    }


# UPDATE all settings at once
@router.put("/{user_id}")
async def update_all_settings(
    user_id: int,
    settings: UserSettings,
    db: Session = Depends(get_db)
):
    """Update all user settings at once"""
    user = db.query(User).filter(User.id == user_id).first()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Update profile
    if settings.profile.username:
        user.username = settings.profile.username
    if settings.profile.email:
        user.email = settings.profile.email
    
    # Update notifications
    user.quiz_reminders = settings.notifications.quiz_reminders
    user.progress_updates = settings.notifications.progress_updates
    user.feature_announcements = settings.notifications.feature_announcements
    
    # Update appearance
    user.theme = settings.appearance.theme
    
    # Update learning
    user.default_quiz_difficulty = settings.learning.default_quiz_difficulty
    user.questions_per_quiz = settings.learning.questions_per_quiz
    
    db.commit()
    db.refresh(user)
    
    return {
        "message": "All settings updated successfully",
        "settings": {
            "profile": {
                "username": user.username,
                "email": user.email
            },
            "notifications": settings.notifications.dict(),
            "appearance": settings.appearance.dict(),
            "learning": settings.learning.dict()
        }
    }


# RESET settings to defaults
@router.post("/{user_id}/reset")
async def reset_settings(
    user_id: int,
    db: Session = Depends(get_db)
):
    """Reset all settings to defaults"""
    user = db.query(User).filter(User.id == user_id).first()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Reset to defaults
    user.quiz_reminders = True
    user.progress_updates = True
    user.feature_announcements = False
    user.theme = "light"
    user.default_quiz_difficulty = "mixed"
    user.questions_per_quiz = 5
    
    db.commit()
    
    return {"message": "Settings reset to defaults"}