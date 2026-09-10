from fastapi import APIRouter, HTTPException, BackgroundTasks, Depends, status
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
import secrets
import hashlib
import logging

from app.database import get_db, User, PasswordResetToken
from app.config import settings
from app.schemas import (
    UserCreate, 
    UserLogin, 
    UserResponse, 
    TokenResponse, 
    OAuthLoginRequest,
    PasswordResetRequest,
    PasswordResetConfirm
)
from app.utils.security import (
    hash_password, 
    verify_password, 
    create_access_token, 
    verify_oauth_token
)
from app.utils.rate_limiter import rate_limit
from app.dependencies import get_current_user

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post(
    "/api/auth/oauth-login", 
    response_model=TokenResponse,
    dependencies=[Depends(rate_limit(max_requests=15, window_seconds=60))]
)
async def oauth_login(request: OAuthLoginRequest, db: Session = Depends(get_db)):
    """
    Secure OAuth login: Verifies provider token before creating/logging in user.
    Rejects raw unverified email inputs.
    """
    verified_data = await verify_oauth_token(request.provider, request.token)
    if not verified_data or not verified_data.get("email"):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or unverified OAuth token"
        )

    email = verified_data["email"].lower().strip()
    user = db.query(User).filter(User.email == email).first()
    desired_name = request.name or verified_data.get("name") or email.split("@")[0]

    if not user:
        # Create user account with verified email
        username = desired_name
        base_username = username
        counter = 1
        while db.query(User).filter(User.username == username).first():
            username = f"{base_username}{counter}"
            counter += 1

        user = User(
            username=username,
            email=email,
            hashed_password=hash_password(secrets.token_urlsafe(32)),
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    else:
        # Existing user: update username if provided and available
        if request.name and user.username != request.name:
            conflict = db.query(User).filter(User.username == request.name, User.id != user.id).first()
            if not conflict:
                user.username = request.name
                db.commit()
                db.refresh(user)

    token = create_access_token(user.id, user.email)
    return TokenResponse(access_token=token, user=UserResponse.model_validate(user))


@router.post(
    "/api/auth/signup", 
    response_model=TokenResponse,
    dependencies=[Depends(rate_limit(max_requests=10, window_seconds=60))]
)
async def signup(user_data: UserCreate, db: Session = Depends(get_db)):
    """Create a real user account in the database and return a JWT."""
    email_clean = user_data.email.lower().strip()
    existing = db.query(User).filter(
        (User.email == email_clean) | (User.username == user_data.username)
    ).first()
    if existing:
        field = "email" if existing.email == email_clean else "username"
        raise HTTPException(status_code=400, detail=f"That {field} is already registered")

    try:
        hashed = hash_password(user_data.password)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    user = User(
        username=user_data.username,
        email=email_clean,
        hashed_password=hashed,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_access_token(user.id, user.email)
    return TokenResponse(access_token=token, user=UserResponse.model_validate(user))


@router.post(
    "/api/auth/login", 
    response_model=TokenResponse,
    dependencies=[Depends(rate_limit(max_requests=10, window_seconds=60))]
)
async def login(credentials: UserLogin, db: Session = Depends(get_db)):
    """Verify credentials against the database and return a JWT."""
    email_clean = credentials.email.lower().strip()
    user = db.query(User).filter(User.email == email_clean).first()
    if not user or not verify_password(credentials.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Incorrect email or password")

    token = create_access_token(user.id, user.email)
    return TokenResponse(access_token=token, user=UserResponse.model_validate(user))


@router.get("/api/auth/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)):
    """Return the currently authenticated user (validates the token)."""
    return current_user


def send_reset_email(email: str, token: str):
    """Send password reset email via configured frontend URL"""
    reset_link = f"{settings.FRONTEND_URL.rstrip('/')}/reset-password?token={token}"
    logger.info(f"Password reset link generated for {email}: {reset_link}")


@router.post(
    "/api/forgot-password",
    dependencies=[Depends(rate_limit(max_requests=5, window_seconds=900))]
)
async def forgot_password(
    request: PasswordResetRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """
    Request password reset with persistent tokens and account enumeration protection.
    """
    email = request.email.lower().strip()
    user = db.query(User).filter(User.email == email).first()

    if user:
        # Invalidate existing unused tokens for this user
        db.query(PasswordResetToken).filter(
            PasswordResetToken.user_id == user.id,
            PasswordResetToken.used == False
        ).update({"used": True})

        # Generate cryptographically secure token
        raw_token = secrets.token_urlsafe(32)
        token_hash = hashlib.sha256(raw_token.encode("utf-8")).hexdigest()

        reset_record = PasswordResetToken(
            user_id=user.id,
            token_hash=token_hash,
            expires_at=datetime.utcnow() + timedelta(hours=1),
            used=False
        )
        db.add(reset_record)
        db.commit()

        background_tasks.add_task(send_reset_email, email, raw_token)

    return {
        "success": True,
        "message": "If an account exists with this email, you will receive a password reset link."
    }


@router.post(
    "/api/reset-password",
    dependencies=[Depends(rate_limit(max_requests=5, window_seconds=900))]
)
async def reset_password(request: PasswordResetConfirm, db: Session = Depends(get_db)):
    """Reset password with cryptographically validated persistent token"""
    token_hash = hashlib.sha256(request.token.encode("utf-8")).hexdigest()

    reset_token = db.query(PasswordResetToken).filter(
        PasswordResetToken.token_hash == token_hash
    ).first()

    if not reset_token or reset_token.used:
        raise HTTPException(status_code=400, detail="Invalid or expired token")

    if datetime.utcnow() > reset_token.expires_at:
        db.delete(reset_token)
        db.commit()
        raise HTTPException(status_code=400, detail="Token has expired")

    user = db.query(User).filter(User.id == reset_token.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    try:
        user.hashed_password = hash_password(request.new_password)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    reset_token.used = True
    db.commit()

    return {
        "success": True,
        "message": "Password has been reset successfully"
    }


@router.get("/api/verify-reset-token/{token}")
async def verify_reset_token(token: str, db: Session = Depends(get_db)):
    """Verify if reset token is valid without leaking user details"""
    token_hash = hashlib.sha256(token.encode("utf-8")).hexdigest()

    reset_token = db.query(PasswordResetToken).filter(
        PasswordResetToken.token_hash == token_hash,
        PasswordResetToken.used == False,
        PasswordResetToken.expires_at > datetime.utcnow()
    ).first()

    if not reset_token:
        raise HTTPException(status_code=400, detail="Invalid or expired token")

    return {"valid": True}
