from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from contextlib import asynccontextmanager
import logging
import traceback

from app.config import settings
from app.database import create_tables, run_lightweight_migrations
from app.routes import auth
from app.api import upload, chat, quiz, flashcards, concept_map
from app.api import settings as settings_router

# Configure logging
logging.basicConfig(
    level=logging.INFO if settings.ENVIRONMENT == "production" else logging.DEBUG,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("lumina.main")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifecycle manager for startup and shutdown events"""
    logger.info("🚀 Starting Lumina Adaptive AI Tutor System")
    create_tables()
    run_lightweight_migrations()
    logger.info("✅ Database tables created and verified")
    yield
    logger.info("👋 Shutting down Lumina")


# Security Headers Middleware
class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response: Response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()"
        if settings.ENVIRONMENT == "production":
            response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        return response


# Create FastAPI application (hide docs in production)
is_prod = settings.ENVIRONMENT == "production"
app = FastAPI(
    title="Lumina AI Tutor API",
    description="Adaptive AI-Powered Tutoring System with RAG",
    version="1.0.0",
    lifespan=lifespan,
    docs_url=None if is_prod else "/docs",
    redoc_url=None if is_prod else "/redoc",
    openapi_url=None if is_prod else "/openapi.json"
)

# Add Security Headers Middleware
app.add_middleware(SecurityHeadersMiddleware)

# CORS middleware with restricted methods and headers
_cors_origins = [o.strip() for o in settings.ALLOWED_ORIGINS.split(",") if o.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=_cors_origins,
    allow_origin_regex=r"^https://.*\.vercel\.app$",
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=["Content-Type", "Authorization", "Accept", "Origin", "X-Requested-With"],
    expose_headers=["Content-Type", "Authorization"],
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
        "service": "Lumina AI Tutor API",
        "version": "1.0.0",
        "status": "active"
    }


@app.get("/health")
async def health_check():
    """Minimal, unauthenticated public health check"""
    return {
        "status": "healthy"
    }


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Secure global exception handler that logs server-side and prevents exception leakage"""
    logger.error(
        f"Unhandled exception on {request.method} {request.url.path}:\n{traceback.format_exc()}"
    )
    if settings.ENVIRONMENT == "production":
        return JSONResponse(
            status_code=500,
            content={"detail": "An unexpected error occurred. Please try again later."}
        )
    return JSONResponse(
        status_code=500,
        content={"detail": str(exc), "type": type(exc).__name__}
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host=settings.HOST, port=settings.PORT)