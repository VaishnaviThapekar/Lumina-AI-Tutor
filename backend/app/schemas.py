from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime


# User Schemas
class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    id: int
    username: str
    email: str
    created_at: datetime
    
    class Config:
        from_attributes = True


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
    message: str
    competency_score: Optional[float] = None


class ChatResponse(BaseModel):
    response: str
    teaching_mode: str
    updated_competency_score: float
    sources: Optional[List[str]] = []


# Quiz Schemas
class QuizQuestion(BaseModel):
    question: str
    options: List[str]
    correct_answer: int
    explanation: str


class QuizGenerateRequest(BaseModel):
    document_id: int
    num_questions: int = 5
    difficulty: Optional[str] = "mixed"  # easy, medium, hard, mixed


class QuizResponse(BaseModel):
    quiz_id: int
    questions: List[QuizQuestion]


class QuizSubmission(BaseModel):
    quiz_id: int
    session_id: int
    answers: List[int]  # List of selected option indices


class QuizResult(BaseModel):
    score: float
    correct_answers: int
    total_questions: int
    updated_competency_score: float
    feedback: List[dict]


# Session Schemas
class SessionCreate(BaseModel):
    user_id: int
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


# Message Schemas
class MessageResponse(BaseModel):
    id: int
    role: str
    content: str
    timestamp: datetime
    
    class Config:
        from_attributes = True
