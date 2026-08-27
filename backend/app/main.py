# from fastapi import FastAPI
# from fastapi.middleware.cors import CORSMiddleware
# from contextlib import asynccontextmanager
# from app.routes import auth

# from app.config import settings
# from app.database import create_tables
# from app.api import upload, chat, quiz
# from app.api import settings as settings_router

# settings = settings


# @asynccontextmanager
# async def lifespan(app: FastAPI):
#     """Lifecycle manager for startup and shutdown events"""
#     # Startup
#     print("🚀 Starting Lumina Adaptive AI Tutor System")
#     create_tables()
#     print("✅ Database tables created/verified")
    
#     yield
    
#     # Shutdown
#     print("👋 Shutting down Lumina")


# # Create FastAPI app
# app = FastAPI(
#     title="Lumina AI Tutor API",
#     description="Adaptive AI-Powered Tutoring System with RAG",
#     version="1.0.0",
#     lifespan=lifespan
# )

# # CORS middleware
# allowed_origins = settings.ALLOWED_ORIGINS.split(",")
# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=allowed_origins,
#     allow_credentials=True,
#     allow_methods=["*"],
#     allow_headers=["*"],
# )
# app.include_router(auth.router)
# # Include routers
# app.include_router(upload.router)
# app.include_router(chat.router)
# app.include_router(quiz.router)
# app.include_router(settings_router.router)


# @app.get("/")
# async def root():
#     """Root endpoint"""
#     return {
#         "message": "Welcome to Lumina AI Tutor API",
#         "version": "1.0.0",
#         "status": "active",
#         "endpoints": {
#             "docs": "/docs",
#             "upload": "/api/upload",
#             "chat": "/api/chat",
#             "quiz": "/api/quiz"
#         }
#     }


# @app.get("/health")
# async def health_check():
#     """Health check endpoint"""
#     return {
#         "status": "healthy",
#         "service": "Lumina AI Tutor",
#         "database": "connected",
#         "vector_store": "active"
#     }
# @app.exception_handler(Exception)
# async def global_exception_handler(request, exc):
#     import traceback
#     print("=" * 80)
#     print("ERROR DETAILS:")
#     print(traceback.format_exc())
#     print("=" * 80)
#     return JSONResponse(
#         status_code=500,
#         content={"detail": str(exc)}
#     )


# if __name__ == "__main__":
#     import uvicorn
#     uvicorn.run(app, host="0.0.0.0", port=8000)








from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager

from app.config import settings
from app.database import create_tables, run_lightweight_migrations
from app.routes import auth
from app.api import upload, chat, quiz, flashcards
from app.api import settings as settings_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifecycle manager for startup and shutdown events"""
    # Startup
    print("🚀 Starting Lumina Adaptive AI Tutor System")
    create_tables()
    run_lightweight_migrations()
    print("✅ Database tables created/verified")
    
    yield
    
    # Shutdown
    print("👋 Shutting down Lumina")


# Create FastAPI app
app = FastAPI(
    title="Lumina AI Tutor API",
    description="Adaptive AI-Powered Tutoring System with RAG",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware - MUST BE FIRST!
# Reads allowed origins from the ALLOWED_ORIGINS env var (comma-separated),
# falling back to localhost for local development. Set this in Render's
# dashboard to your real Vercel URL(s) in production.
_cors_origins = [o.strip() for o in settings.ALLOWED_ORIGINS.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=_cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# Include routers
app.include_router(auth.router)
app.include_router(upload.router)
app.include_router(chat.router)
app.include_router(quiz.router)
app.include_router(flashcards.router)
app.include_router(concept_map.router)
app.include_router(settings_router.router)


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "Welcome to Lumina AI Tutor API",
        "version": "1.0.0",
        "status": "active",
        "endpoints": {
            "docs": "/docs",
            "upload": "/api/upload",
            "chat": "/api/chat",
            "quiz": "/api/quiz"
        }
    }


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "Lumina AI Tutor",
        "database": "connected",
        "vector_store": "active"
    }


@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    """Global exception handler for debugging"""
    import traceback
    print("=" * 80)
    print("ERROR DETAILS:")
    print(traceback.format_exc())
    print("=" * 80)
    return JSONResponse(
        status_code=500,
        content={"detail": str(exc), "type": type(exc).__name__}
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)