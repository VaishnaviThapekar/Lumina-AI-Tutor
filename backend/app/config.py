from pydantic_settings import BaseSettings
from pydantic import model_validator
from typing import Optional, List
import os
import sys

class Settings(BaseSettings):
    # Environment
    ENVIRONMENT: str = "development"  # "development", "production", "test"

    # Database
    DATABASE_URL: str = "sqlite:///./lumina.db"
    
    # API Keys
    OPENAI_API_KEY: Optional[str] = None
    OPENAI_MODEL: str = "gpt-4o"
    GOOGLE_API_KEY: Optional[str] = None
    GEMINI_API_KEY: Optional[str] = None  # Alias for GOOGLE_API_KEY
    PINECONE_API_KEY: Optional[str] = None
    PINECONE_ENVIRONMENT: Optional[str] = None
    PINECONE_INDEX_NAME: str = "lumina-tutor"
    
    # RAG Configuration
    CHUNK_SIZE: int = 1000
    CHUNK_OVERLAP: int = 200
    EMBEDDING_MODEL: str = "text-embedding-3-small"
    
    # Adaptive Learning
    SCAFFOLDING_THRESHOLD: float = 0.5
    SOCRATIC_THRESHOLD: float = 0.8
    
    # Auth & JWT
    SECRET_KEY: str = "lumina-dev-secret-key-change-in-production-only"
    JWT_SECRET_KEY: str = "lumina-dev-jwt-secret-key-change-in-production-only"
    NEXTAUTH_SECRET: Optional[str] = None
    AUTH_SECRET: Optional[str] = None
    ALGORITHM: str = "HS256"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60  # Short-lived access token
    JWT_EXPIRATION_MINUTES: int = 1440  # 24 hours max lifetime
    
    # File upload limits
    MAX_UPLOAD_SIZE_MB: int = 10
    MAX_DOCS_PER_USER: int = 50
    
    # Rate Limiting
    RATE_LIMIT_ENABLED: bool = True
    
    # Frontend & CORS
    FRONTEND_URL: str = "http://localhost:3000"
    ALLOWED_ORIGINS: str = "http://localhost:3000,http://127.0.0.1:3000,http://localhost:3001"
    
    # Server
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    
    @model_validator(mode="after")
    def validate_production_settings(self) -> "Settings":
        # Resolve Gemini API Key alias
        if not self.GEMINI_API_KEY and self.GOOGLE_API_KEY:
            self.GEMINI_API_KEY = self.GOOGLE_API_KEY
        elif not self.GOOGLE_API_KEY and self.GEMINI_API_KEY:
            self.GOOGLE_API_KEY = self.GEMINI_API_KEY

        # In production, require strong secrets and fail fast
        if self.ENVIRONMENT == "production":
            insecure_defaults = [
                "your-secret-key-change-in-production-use-openssl-rand-hex-32",
                "your-jwt-secret-key-change-in-production",
                "lumina-dev-secret-key-change-in-production-only",
                "lumina-dev-jwt-secret-key-change-in-production-only",
                "secret",
                "changeme",
            ]
            if not self.JWT_SECRET_KEY or self.JWT_SECRET_KEY in insecure_defaults or len(self.JWT_SECRET_KEY) < 32:
                raise ValueError(
                    "FATAL: In production, JWT_SECRET_KEY must be configured in environment with a strong secret of at least 32 characters."
                )
            if not self.SECRET_KEY or self.SECRET_KEY in insecure_defaults or len(self.SECRET_KEY) < 32:
                raise ValueError(
                    "FATAL: In production, SECRET_KEY must be configured in environment with a strong secret of at least 32 characters."
                )

        return self

    class Config:
        env_file = ".env"
        case_sensitive = False
        extra = "allow"

settings = Settings()