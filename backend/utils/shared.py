"""Shared utility helpers used across multiple routers.

Centralises common patterns that were previously copy-pasted into each router
module (require_supabase, course lookup / access checks, rate-limit key
extraction, elevated-role detection).
"""

import os
import logging
from fastapi import HTTPException, Request, status
from slowapi.util import get_remote_address

from ..core.config import supabase

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Supabase availability guard
# ---------------------------------------------------------------------------

def require_supabase() -> None:
    """Raise 503 if the Supabase client was not initialised (missing env vars)."""
    if supabase is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=(
                "Database service unavailable: Supabase client not initialised. "
                "Check SUPABASE_URL and SUPABASE_SERVICE_KEY environment variables."
            ),
        )


# ---------------------------------------------------------------------------
# Course helpers
# ---------------------------------------------------------------------------

def get_course_or_404(course_id: str) -> dict:
    """Fetch a course row from Supabase or raise 404."""
    response = supabase.table("courses").select("*").eq("id", course_id).execute()
    if not response.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Course not found",
        )
    return response.data[0]


def verify_course_access(course: dict, current_user: dict) -> None:
    """Verify the current user has access to *course*.

    * Admins, coordinators, and HODs have full access.
    * Lecturers can only access courses they are assigned to.
    """
    if is_elevated_role(current_user):
        return
    user_role = current_user.get("role")
    if user_role == "lecturer" and course.get("lecturer_id") != current_user.get("user_id"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not assigned to this course",
        )


# ---------------------------------------------------------------------------
# Role helpers
# ---------------------------------------------------------------------------

def is_elevated_role(current_user: dict) -> bool:
    """Return *True* if the user holds an elevated role (admin / coordinator / hod),
    either as their base role or via ``special_roles``."""
    user_role = current_user.get("role", "")
    special = set(current_user.get("special_roles", []) or [])
    return (
        user_role in ("admin", "coordinator", "hod")
        or "coordinator" in special
        or "hod" in special
    )


# ---------------------------------------------------------------------------
# Rate-limit key extraction
# ---------------------------------------------------------------------------

def get_rate_limit_key(request: Request) -> str:
    """Derive a rate-limit key from the inbound request.

    In development mode a fixed shared key is returned so that rate limits
    don't interfere with local testing.  In production the client IP is
    extracted from ``X-Forwarded-For`` / ``X-Real-IP`` (to work behind the
    Next.js reverse proxy on Render), falling back to the TCP peer address.
    """
    if os.getenv("ENVIRONMENT", "development") == "development":
        return "dev-shared-key"
    forwarded_for = request.headers.get("X-Forwarded-For")
    if forwarded_for:
        return forwarded_for.split(",")[0].strip()
    real_ip = request.headers.get("X-Real-IP")
    if real_ip:
        return real_ip.strip()
    return get_remote_address(request)
