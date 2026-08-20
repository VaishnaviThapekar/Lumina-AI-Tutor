from sqlalchemy import create_engine, Column, Integer, String, Float, DateTime, Text, ForeignKey, Boolean
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from datetime import datetime
from app.config import settings



# Database engine
# Render (and similar providers) give connection strings starting with
# "postgres://", but SQLAlchemy 1.4+ requires the "postgresql://" scheme.
_db_url = settings.DATABASE_URL
if _db_url.startswith("postgres://"):
    _db_url = _db_url.replace("postgres://", "postgresql://", 1)

engine = create_engine(_db_url, pool_pre_ping=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


class User(Base):
    """User model for storing user information"""
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Notification preferences
    quiz_reminders = Column(Boolean, default=True)
    progress_updates = Column(Boolean, default=True)
    feature_announcements = Column(Boolean, default=False)

    # Appearance preferences
    theme = Column(String, default="light")

    # Learning preferences
    default_quiz_difficulty = Column(String, default="mixed")
    questions_per_quiz = Column(Integer, default=5)
    
    # Relationships
    sessions = relationship("LearningSession", back_populates="user")
    quiz_attempts = relationship("QuizAttempt", back_populates="user")


class Document(Base):
    """Document model for uploaded PDFs"""
    __tablename__ = "documents"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    filename = Column(String, nullable=False)
    file_path = Column(String, nullable=False)
    pinecone_namespace = Column(String, nullable=False)
    uploaded_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    sessions = relationship("LearningSession", back_populates="document")


class LearningSession(Base):
    """Learning session tracking with competency scores"""
    __tablename__ = "learning_sessions"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    document_id = Column(Integer, ForeignKey("documents.id"))
    competency_score = Column(Float, default=0.5)  # Default to middle level
    teaching_mode = Column(String, default="balanced")  # scaffolding, balanced, socratic
    session_start = Column(DateTime, default=datetime.utcnow)
    last_interaction = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="sessions")
    document = relationship("Document", back_populates="sessions")
    messages = relationship("ChatMessage", back_populates="session")


class ChatMessage(Base):
    """Chat message history"""
    __tablename__ = "chat_messages"
    
    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("learning_sessions.id"))
    role = Column(String, nullable=False)  # user, assistant, system
    content = Column(Text, nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    session = relationship("LearningSession", back_populates="messages")


class QuizAttempt(Base):
    """Quiz attempt tracking"""
    __tablename__ = "quiz_attempts"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    document_id = Column(Integer, ForeignKey("documents.id"))
    quiz_data = Column(Text, nullable=False)  # JSON string
    score = Column(Float, nullable=False)
    total_questions = Column(Integer, nullable=False)
    correct_answers = Column(Integer, nullable=False)
    attempted_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="quiz_attempts")


class Flashcard(Base):
    """Flashcard with SM-2 spaced-repetition scheduling state"""
    __tablename__ = "flashcards"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    document_id = Column(Integer, ForeignKey("documents.id"), nullable=False)
    front = Column(Text, nullable=False)
    back = Column(Text, nullable=False)

    # SM-2 scheduling state
    ease_factor = Column(Float, default=2.5)
    interval_days = Column(Integer, default=0)
    repetitions = Column(Integer, default=0)
    next_review_at = Column(DateTime, default=datetime.utcnow)
    last_reviewed_at = Column(DateTime, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User")
    document = relationship("Document")


def get_db():
    """Dependency for database session"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def create_tables():
    """Create all tables"""
    Base.metadata.create_all(bind=engine)


def run_lightweight_migrations():
    """
    Add any newly-introduced columns to existing tables that already had
    rows before the column existed. Base.metadata.create_all() only
    creates missing TABLES, not missing COLUMNS on existing tables, so
    this handles that gap without requiring a full Alembic setup.
    Safe to run on every startup — each ALTER is skipped if the column
    already exists.
    """
    from sqlalchemy import inspect, text

    inspector = inspect(engine)
    if "users" not in inspector.get_table_names():
        return  # create_tables() will have just created it fresh, fully up to date

    existing_columns = {col["name"] for col in inspector.get_columns("users")}

    # (column_name, SQL type, default) — keep in sync with the User model above
    new_columns = [
        ("quiz_reminders", "BOOLEAN", "TRUE"),
        ("progress_updates", "BOOLEAN", "TRUE"),
        ("feature_announcements", "BOOLEAN", "FALSE"),
        ("theme", "VARCHAR", "'light'"),
        ("default_quiz_difficulty", "VARCHAR", "'mixed'"),
        ("questions_per_quiz", "INTEGER", "5"),
    ]

    with engine.connect() as conn:
        for name, col_type, default in new_columns:
            if name not in existing_columns:
                conn.execute(text(
                    f"ALTER TABLE users ADD COLUMN {name} {col_type} DEFAULT {default}"
                ))
                conn.commit()
                print(f"[migration] Added missing column users.{name}")
