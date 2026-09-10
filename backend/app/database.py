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
    
    # Relationships with cascade
    sessions = relationship("LearningSession", back_populates="user", cascade="all, delete-orphan")
    quiz_attempts = relationship("QuizAttempt", back_populates="user", cascade="all, delete-orphan")
    documents = relationship("Document", back_populates="user", cascade="all, delete-orphan")
    flashcards = relationship("Flashcard", back_populates="user", cascade="all, delete-orphan")
    reset_tokens = relationship("PasswordResetToken", back_populates="user", cascade="all, delete-orphan")


class Document(Base):
    """Document model for uploaded PDFs"""
    __tablename__ = "documents"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    filename = Column(String, nullable=False)
    file_path = Column(String, nullable=False)
    pinecone_namespace = Column(String, nullable=False)
    uploaded_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="documents")
    sessions = relationship("LearningSession", back_populates="document", cascade="all, delete-orphan")
    flashcards = relationship("Flashcard", back_populates="document", cascade="all, delete-orphan")


class LearningSession(Base):
    """Learning session tracking with competency scores"""
    __tablename__ = "learning_sessions"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    document_id = Column(Integer, ForeignKey("documents.id", ondelete="CASCADE"), nullable=False)
    competency_score = Column(Float, default=0.5)  # Default to middle level
    teaching_mode = Column(String, default="balanced")  # scaffolding, balanced, socratic
    session_start = Column(DateTime, default=datetime.utcnow)
    last_interaction = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="sessions")
    document = relationship("Document", back_populates="sessions")
    messages = relationship("ChatMessage", back_populates="session", cascade="all, delete-orphan")


class ChatMessage(Base):
    """Chat message history"""
    __tablename__ = "chat_messages"
    
    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("learning_sessions.id", ondelete="CASCADE"), nullable=False)
    role = Column(String, nullable=False)  # user, assistant, system
    content = Column(Text, nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    session = relationship("LearningSession", back_populates="messages")


class QuizAttempt(Base):
    """Quiz attempt tracking"""
    __tablename__ = "quiz_attempts"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    document_id = Column(Integer, ForeignKey("documents.id", ondelete="CASCADE"), nullable=False)
    quiz_data = Column(Text, nullable=False)  # JSON string containing questions + answers internally
    score = Column(Float, default=0.0, nullable=False)
    total_questions = Column(Integer, nullable=False)
    correct_answers = Column(Integer, default=0, nullable=False)
    submitted = Column(Boolean, default=False, nullable=False)
    attempted_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="quiz_attempts")


class Flashcard(Base):
    """Flashcard with SM-2 spaced-repetition scheduling state"""
    __tablename__ = "flashcards"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    document_id = Column(Integer, ForeignKey("documents.id", ondelete="CASCADE"), nullable=False)
    front = Column(Text, nullable=False)
    back = Column(Text, nullable=False)

    # SM-2 scheduling state
    ease_factor = Column(Float, default=2.5)
    interval_days = Column(Integer, default=0)
    repetitions = Column(Integer, default=0)
    next_review_at = Column(DateTime, default=datetime.utcnow)
    last_reviewed_at = Column(DateTime, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="flashcards")
    document = relationship("Document", back_populates="flashcards")


class PasswordResetToken(Base):
    """Secure, persistent password reset tokens stored as hashes"""
    __tablename__ = "password_reset_tokens"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    token_hash = Column(String, unique=True, index=True, nullable=False)
    expires_at = Column(DateTime, nullable=False)
    used = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="reset_tokens")


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
    Add any newly-introduced columns or tables to existing databases.
    Safe to run on every startup.
    """
    from sqlalchemy import inspect, text

    inspector = inspect(engine)
    existing_tables = set(inspector.get_table_names())
    
    # If users table exists, ensure all columns exist
    if "users" in existing_tables:
        existing_user_cols = {col["name"] for col in inspector.get_columns("users")}
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
                if name not in existing_user_cols:
                    conn.execute(text(
                        f"ALTER TABLE users ADD COLUMN {name} {col_type} DEFAULT {default}"
                    ))
                    conn.commit()
                    print(f"[migration] Added missing column users.{name}")

    if "quiz_attempts" in existing_tables:
        existing_quiz_cols = {col["name"] for col in inspector.get_columns("quiz_attempts")}
        if "submitted" not in existing_quiz_cols:
            with engine.connect() as conn:
                conn.execute(text("ALTER TABLE quiz_attempts ADD COLUMN submitted BOOLEAN DEFAULT FALSE"))
                conn.commit()
                print("[migration] Added missing column quiz_attempts.submitted")

    # Ensure password_reset_tokens table exists
    if "password_reset_tokens" not in existing_tables:
        PasswordResetToken.__table__.create(bind=engine, checkfirst=True)
        print("[migration] Created password_reset_tokens table")
