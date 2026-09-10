import time
from typing import Dict, List, Tuple
from fastapi import Request, HTTPException, status
from app.config import settings

class InMemoryRateLimiter:
    """
    Sliding window rate limiter for abuse prevention and endpoint protection.
    """
    def __init__(self):
        # key -> list of timestamps (float)
        self._requests: Dict[str, List[float]] = {}

    def _clean_old_requests(self, key: str, window_seconds: int, now: float):
        if key in self._requests:
            cutoff = now - window_seconds
            self._requests[key] = [t for t in self._requests[key] if t > cutoff]
            if not self._requests[key]:
                del self._requests[key]

    def is_allowed(self, key: str, max_requests: int, window_seconds: int = 60) -> Tuple[bool, int]:
        if not settings.RATE_LIMIT_ENABLED:
            return True, max_requests

        now = time.time()
        self._clean_old_requests(key, window_seconds, now)

        current_requests = self._requests.get(key, [])
        if len(current_requests) >= max_requests:
            return False, 0

        current_requests.append(now)
        self._requests[key] = current_requests
        remaining = max_requests - len(current_requests)
        return True, remaining

limiter = InMemoryRateLimiter()

def get_client_ip(request: Request) -> str:
    """Extract client IP safely from request headers or client object"""
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "127.0.0.1"

def rate_limit(max_requests: int = 60, window_seconds: int = 60):
    """
    FastAPI dependency to rate limit by IP address.
    """
    async def dependency(request: Request):
        ip = get_client_ip(request)
        endpoint = request.url.path
        key = f"{ip}:{endpoint}"

        allowed, remaining = limiter.is_allowed(key, max_requests, window_seconds)
        if not allowed:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=f"Rate limit exceeded. Maximum {max_requests} requests per {window_seconds}s. Please try again later.",
                headers={"Retry-After": str(window_seconds)}
            )
    return dependency
