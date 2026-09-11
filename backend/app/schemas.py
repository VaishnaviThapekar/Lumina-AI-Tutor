from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime


# User Schemas
class UserCreate(BaseModel):
    username: str = Field(..., min_length=3, max_length=50, pattern=r'^[a-zA-Z0-9_\-. ]+$')
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=72)


class UserResponse(BaseModel):
    id: int
    username: str
    email: str
    created_at: datetime
    
    class Config:
        from_attributes = True


class UserLogin(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=1, max_length=72)


class OAuthLoginRequest(BaseModel):
    provider: str = Field(..., min_length=1)
    token: str = Field(..., min_length=1)
    name: Optional[str] = None
    email: Optional[EmailStr] = None


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


class PasswordResetRequest(BaseModel):
    email: EmailStr


class PasswordResetConfirm(BaseModel):
    token: str = Field(..., min_length=1)
    new_password: str = Field(..., min_length=8, max_length=72)


# Document Schemas
class DocumentUploadResponse(BaseModel):
    id: int
    filename: str
    pinecone_namespace: str
    uploaded_at: datetime
    message: str


# Chat Schemas
class ChatRequest(BaseModel):
    session_id: int
    message: str = Field(..., min_length=1, max_length=4000)


class ChatResponse(BaseModel):
    response: str
    teaching_mode: str
    updated_competency_score: float
    sources: Optional[List[str]] = []


# Quiz Schemas
class QuizQuestionPublic(BaseModel):
    """Public question model sent before submission - DOES NOT contain correct_answer or explanation"""
    question: str
    options: List[str]


# Legacy internal representation for grading
class QuizQuestion(BaseModel):
    question: str
    options: List[str]
    correct_answer: int
    explanation: str


class QuizGenerateRequest(BaseModel):
    document_id: int
    num_questions: int = Field(5, ge=1, le=20)
    difficulty: Optional[str] = "mixed"  # easy, medium, hard, mixed


class QuizResponse(BaseModel):
    quiz_id: int
    questions: List[QuizQuestionPublic]


class QuizSubmission(BaseModel):
    quiz_id: int
    session_id: int
    answers: List[int]  # Selected option indices (0-3)


class QuizFeedbackItem(BaseModel):
    question_number: int
    question: str
    user_answer: str
    correct_answer: str
    is_correct: bool
    feedback: str


class QuizResult(BaseModel):
    score: float
    correct_answers: int
    total_questions: int
    updated_competency_score: float
    feedback: List[QuizFeedbackItem]


# Session Schemas
class SessionCreate(BaseModel):
    document_id: int


class SessionResponse(BaseModel):
    id: int
    user_id: int
    document_id: int
    competency_score: float
    teaching_mode: str
    session_start: datetime
    
    class Config:
        from_attributes = True


# Flashcard Schemas
class FlashcardGenerateRequest(BaseModel):
    document_id: int
    num_cards: int = Field(10, ge=1, le=30)


class FlashcardResponse(BaseModel):
    id: int
    front: str
    back: str
    ease_factor: float
    interval_days: int
    repetitions: int
    next_review_at: datetime

    class Config:
        from_attributes = True


class FlashcardReviewRequest(BaseModel):
    flashcard_id: int
    quality: int = Field(..., ge=0, le=5)  # 0-5 per SM-2


# Message Schemas
class MessageResponse(BaseModel):
    id: int
    role: str
    content: str
    timestamp: datetime
    
    class Config:
        from_attributes = True
