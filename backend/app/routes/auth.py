from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel, EmailStr
from datetime import datetime, timedelta
import secrets
import hashlib

router = APIRouter()

# Temporary storage for reset tokens (in production, use database)
password_reset_tokens = {}

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
    reset_link = f"http://localhost:3000/reset-password?token={token}"
    
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
async def reset_password(request: PasswordResetConfirm):
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
    print(f"✅ Password reset successful for: {email}")
    print(f"   New password: {new_password}")
    
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
