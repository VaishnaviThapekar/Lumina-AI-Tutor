# from pydantic_settings import BaseSettings
# from typing import Optional


# class Settings(BaseSettings):
#     # Database
#     DATABASE_URL: str
    
#     # OpenAI
#     OPENAI_API_KEY: str
#     OPENAI_MODEL: str = "gpt-4o"
#     GEMINI_API_KEY: str
    
#     # Pinecone
#     PINECONE_API_KEY: str
#     PINECONE_ENVIRONMENT: str
#     PINECONE_INDEX_NAME: str
    
#     # RAG Configuration
#     CHUNK_SIZE: int = 1000
#     CHUNK_OVERLAP: int = 200
#     EMBEDDING_MODEL: str = "text-embedding-3-small"
    
#     # Adaptive Learning
#     SCAFFOLDING_THRESHOLD: float = 0.5
#     SOCRATIC_THRESHOLD: float = 0.8
    
#     # Auth
#     SECRET_KEY: str
#     ALGORITHM: str = "HS256"
#     ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
#     # CORS
#     ALLOWED_ORIGINS: str = "http://localhost:3000"
    
#     class Config:
#         env_file = ".env"


# settings = Settings()



from pydantic_settings import BaseSettings
from typing import Optional
import os

class Settings(BaseSettings):
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
    SECRET_KEY: str = "your-secret-key-change-in-production-use-openssl-rand-hex-32"
    JWT_SECRET_KEY: str = "your-jwt-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    JWT_EXPIRATION_MINUTES: int = 43200  # 30 days
    
    # CORS
    CORS_ORIGINS: list = ["http://localhost:3000", "http://127.0.0.1:3000"]
    ALLOWED_ORIGINS: str = "http://localhost:3000,http://127.0.0.1:3000"
    
    # Server
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    
    class Config:
        env_file = ".env"
        case_sensitive = False
        extra = "allow"  # Allow extra fields from .env

settings = Settings()