"""
Password hashing, JWT token utilities, and OAuth token verification.
"""
from datetime import datetime, timedelta, timezone
from typing import Optional, Dict, Any
from jose import JWTError, jwt
import bcrypt
import httpx
import logging

from app.config import settings

logger = logging.getLogger(__name__)

# bcrypt hard limit is 72 bytes
MAX_PASSWORD_BYTES = 72


def hash_password(password: str) -> str:
    """Hash a plaintext password for storage."""
    password_bytes = password.encode("utf-8")
    if len(password_bytes) > MAX_PASSWORD_BYTES:
        raise ValueError(f"Password exceeds maximum allowed length of {MAX_PASSWORD_BYTES} bytes")
    hashed = bcrypt.hashpw(password_bytes, bcrypt.gensalt(rounds=12))
    return hashed.decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Check a plaintext password against a stored hash."""
    password_bytes = plain_password.encode("utf-8")
    if len(password_bytes) > MAX_PASSWORD_BYTES:
        return False
    try:
        return bcrypt.checkpw(password_bytes, hashed_password.encode("utf-8"))
    except Exception:
        return False


def create_access_token(user_id: int, email: str, expires_delta: Optional[timedelta] = None) -> str:
    """Create a cryptographically signed JWT for a logged-in user."""
    now = datetime.now(timezone.utc)
    if expires_delta:
        expire = now + expires_delta
    else:
        expire = now + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)

    payload = {
        "sub": str(user_id),
        "email": email,
        "iat": int(now.timestamp()),
        "exp": int(expire.timestamp()),
        "type": "access",
    }
    return jwt.encode(payload, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)


def decode_access_token(token: str) -> Optional[dict]:
    """Decode and validate a JWT. Returns payload if valid, None if invalid or expired."""
    try:
        payload = jwt.decode(
            token,
            settings.JWT_SECRET_KEY,
            algorithms=[settings.JWT_ALGORITHM],
            options={"verify_exp": True, "verify_sub": True, "verify_iat": True}
        )
        if payload.get("type") and payload.get("type") != "access":
            return None
        return payload
    except (JWTError, Exception):
        return None


async def verify_oauth_token(provider: str, token: str) -> Optional[Dict[str, Any]]:
    """
    Verify an OAuth token issued by Google, GitHub, or NextAuth signed token.
    Returns a dict with verified 'email', 'name', and 'sub', or None if invalid.
    """
    if not provider or not token:
        return None

    provider = provider.lower().strip()

    if provider == "google":
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                res = await client.get(
                    f"https://oauth2.googleapis.com/tokeninfo?id_token={token}"
                )
                if res.status_code != 200:
                    logger.warning(f"Google tokeninfo returned status {res.status_code}")
                    return None
                data = res.json()

                # Verify email and verification status
                email = data.get("email")
                email_verified = data.get("email_verified")
                if isinstance(email_verified, str):
                    email_verified = email_verified.lower() == "true"

                if not email or not email_verified:
                    logger.warning("Google token email is missing or not verified")
                    return None

                return {
                    "email": email,
                    "name": data.get("name") or email.split("@")[0],
                    "sub": data.get("sub"),
                    "provider": "google"
                }
        except Exception as e:
            logger.error(f"Google OAuth verification error: {str(e)}")
            return None

    elif provider == "github":
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                res = await client.get(
                    "https://api.github.com/user",
                    headers={"Authorization": f"Bearer {token}", "User-Agent": "Lumina-Tutor-Auth"}
                )
                if res.status_code != 200:
                    logger.warning(f"GitHub user API returned status {res.status_code}")
                    return None
                user_data = res.json()
                email = user_data.get("email")

                # If primary email is private on GitHub profile, fetch from emails endpoint
                if not email:
                    emails_res = await client.get(
                        "https://api.github.com/user/emails",
                        headers={"Authorization": f"Bearer {token}", "User-Agent": "Lumina-Tutor-Auth"}
                    )
                    if emails_res.status_code == 200:
                        emails_list = emails_res.json()
                        for e in emails_list:
                            if e.get("primary") and e.get("verified"):
                                email = e.get("email")
                                break

                if not email:
                    logger.warning("No verified email found for GitHub account")
                    return None

                return {
                    "email": email,
                    "name": user_data.get("name") or user_data.get("login") or email.split("@")[0],
                    "sub": str(user_data.get("id")),
                    "provider": "github"
                }
        except Exception as e:
            logger.error(f"GitHub OAuth verification error: {str(e)}")
            return None

    elif provider in ("nextauth", "signed"):
        # Verifiable server-to-server signed token from NextAuth
        valid_secrets = [
            s for s in [settings.NEXTAUTH_SECRET, settings.AUTH_SECRET, settings.SECRET_KEY]
            if s
        ]
        for secret in valid_secrets:
            try:
                payload = jwt.decode(token, secret, algorithms=["HS256"])
                email = payload.get("email")
                if email:
                    return {
                        "email": email,
                        "name": payload.get("name") or email.split("@")[0],
                        "sub": payload.get("sub", str(payload.get("id", ""))),
                        "provider": payload.get("provider", "nextauth")
                    }
            except Exception:
                continue

    return None
