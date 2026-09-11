"""
Compatibility module re-exporting from app.routes.auth
Ensures zero duplication and consistent database-backed auth/token handling.
"""
from app.routes.auth import router, send_reset_email, signup, login, oauth_login, get_me, forgot_password, reset_password, verify_reset_token

__all__ = [
    "router",
    "send_reset_email",
    "signup",
    "login",
    "oauth_login",
    "get_me",
    "forgot_password",
    "reset_password",
    "verify_reset_token",
]
