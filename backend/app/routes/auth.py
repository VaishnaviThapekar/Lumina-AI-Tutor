from fastapi import APIRouter, HTTPException, BackgroundTasks, Depends
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
import secrets
import hashlib

from app.database import get_db, User
from app.config import settings
from app.schemas import UserCreate, UserLogin, UserResponse, TokenResponse
from app.utils.security import hash_password, verify_password, create_access_token
from app.dependencies import get_current_user

router = APIRouter()

# Temporary storage for reset tokens (in production, use database / Redis)
password_reset_tokens = {}


@router.post("/api/auth/signup", response_model=TokenResponse)
async def signup(user_data: UserCreate, db: Session = Depends(get_db)):
    """Create a real user account in the database and return a JWT."""
    existing = db.query(User).filter(
        (User.email == user_data.email) | (User.username == user_data.username)
    ).first()
    if existing:
        field = "email" if existing.email == user_data.email else "username"
        raise HTTPException(status_code=400, detail=f"That {field} is already registered")

    user = User(
        username=user_data.username,
        email=user_data.email,
        hashed_password=hash_password(user_data.password),
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_access_token(user.id, user.email)
    return TokenResponse(access_token=token, user=UserResponse.model_validate(user))


@router.post("/api/auth/login", response_model=TokenResponse)
async def login(credentials: UserLogin, db: Session = Depends(get_db)):
    """Verify credentials against the database and return a JWT."""
    user = db.query(User).filter(User.email == credentials.email).first()
    if not user or not verify_password(credentials.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Incorrect email or password")

    token = create_access_token(user.id, user.email)
    return TokenResponse(access_token=token, user=UserResponse.model_validate(user))


@router.get("/api/auth/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)):
    """Return the currently authenticated user (validates the token)."""
    return current_user

class PasswordResetRequest(BaseModel):
    email: EmailStr

class PasswordResetConfirm(BaseModel):
    token: str
    new_password: str

def generate_reset_token(email: str) -> str:
    """Generate a secure reset token"""
    token = secrets.token_urlsafe(32)
    token_hash = hashlib.sha256(token.encode()).hexdigest()
    
    # Store token with expiration (1 hour)
    password_reset_tokens[token_hash] = {
        'email': email,
        'expires_at': datetime.utcnow() + timedelta(hours=1),
        'used': False
    }
    
    return token

def send_reset_email(email: str, token: str):
    """Send password reset email (prints to console for now)"""
    frontend_url = settings.ALLOWED_ORIGINS.split(",")[0].strip()
    reset_link = f"{frontend_url}/reset-password?token={token}"
    
    print(f"""
    ========================================
    PASSWORD RESET EMAIL
    ========================================
    To: {email}
    Subject: Reset Your Lumina Password
    
    Click the link below to reset your password:
    {reset_link}
    
    This link expires in 1 hour.
    ========================================
    """)

@router.post("/api/forgot-password")
async def forgot_password(
    request: PasswordResetRequest,
    background_tasks: BackgroundTasks
):
    """Request password reset"""
    email = request.email
    
    # Generate reset token
    token = generate_reset_token(email)
    
    # Send email in background
    background_tasks.add_task(send_reset_email, email, token)
    
    return {
        "success": True,
        "message": "If an account exists with this email, you will receive a password reset link."
    }

@router.post("/api/reset-password")
async def reset_password(request: PasswordResetConfirm, db: Session = Depends(get_db)):
    """Reset password with token"""
    token = request.token
    new_password = request.new_password
    
    # Hash the token to match stored version
    token_hash = hashlib.sha256(token.encode()).hexdigest()
    
    # Check if token exists
    if token_hash not in password_reset_tokens:
        raise HTTPException(status_code=400, detail="Invalid or expired token")
    
    token_data = password_reset_tokens[token_hash]
    
    # Check if token is expired
    if datetime.utcnow() > token_data['expires_at']:
        del password_reset_tokens[token_hash]
        raise HTTPException(status_code=400, detail="Token has expired")
    
    # Check if token was already used
    if token_data['used']:
        raise HTTPException(status_code=400, detail="Token has already been used")
    
    # Mark token as used
    token_data['used'] = True
    
    email = token_data['email']

    # Actually update the user's password in the database
    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.hashed_password = hash_password(new_password)
    db.commit()

    print(f"✅ Password reset successful for: {email}")
    
    return {
        "success": True,
        "message": "Password has been reset successfully"
    }

@router.get("/api/verify-reset-token/{token}")
async def verify_reset_token(token: str):
    """Verify if reset token is valid"""
    token_hash = hashlib.sha256(token.encode()).hexdigest()
    
    if token_hash not in password_reset_tokens:
        raise HTTPException(status_code=400, detail="Invalid token")
    
    token_data = password_reset_tokens[token_hash]
    
    if datetime.utcnow() > token_data['expires_at']:
        raise HTTPException(status_code=400, detail="Token expired")
    
    if token_data['used']:
        raise HTTPException(status_code=400, detail="Token already used")
    
    return {"valid": True, "email": token_data['email']}