"""Authentication dependencies"""
from fastapi import Depends, HTTPException, status, Header
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import jwt, JWTError
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from ..core.config import settings
from ..core.exceptions import InvalidTokenException
from ..core.security import decode_token
from ..db.database import get_db
import logging

_supabase = None

def _get_supabase():
    global _supabase
    if _supabase is None:
        try:
            from ..core.config import supabase
            _supabase = supabase
        except Exception:
            pass
    return _supabase

def _resolve_current_role(user_id: str, jwt_role: str, jwt_special: list) -> tuple[str, list]:
    """Always fetch the current role + special_roles from Supabase so changes take effect immediately."""
    sb = _get_supabase()
    if sb:
        try:
            resp = sb.table("users").select("role, special_roles").eq("id", user_id).limit(1).execute()  # special_roles OK to be absent — caught below
            if resp.data:
                db_role = resp.data[0].get("role") or jwt_role
                db_special = resp.data[0].get("special_roles") or []
                # Backwards-compat: if special_roles column not yet migrated, derive from role
                if not db_special and db_role in ("coordinator", "hod"):
                    db_special = [db_role]
                return db_role, db_special
        except Exception:
            pass
    return jwt_role, jwt_special

logger = logging.getLogger(__name__)
security = HTTPBearer()

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Validate JWT token and return user info"""
    try:
        token = credentials.credentials
        payload = decode_token(token)

        if payload is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token is invalid or has expired"
            )

        user_id = payload.get("sub")
        jwt_role = payload.get("role")
        jwt_special = payload.get("special_roles", []) or []

        if user_id is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication token"
            )

        # Always resolve the current role from DB (not stale JWT)
        role, special_roles = _resolve_current_role(user_id, jwt_role, jwt_special)

        return {"user_id": user_id, "role": role, "special_roles": special_roles}
        
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication token"
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication failed"
        )

async def get_current_active_user(
    user = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Check if user is active in database"""
    try:
        user_id = user["user_id"]
        
        # Query database by UUID (new) or email (fallback for old tokens)
        result = await db.execute(
            text("SELECT is_active FROM users WHERE id = :user_id OR email = :user_id"),
            {"user_id": user_id}
        )
        db_user = result.fetchone()
        
        # If user exists in DB and is active
        if db_user and db_user[0]:
            return user
        
        # If user doesn't exist in DB (mock user - allow anyway for development)
        if not db_user:
            logger.debug(f"User {user_id} not found in database (mock user)")
            return user
        
        # User exists but is not active
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is not active. Please wait for admin approval."
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error checking user active status: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to verify user status"
        )

def require_role(required_role: str):
    """Require a specific role"""
    async def check_role(user = Depends(get_current_user)):
        if user.get("role") != required_role:
            raise HTTPException(status_code=403, detail="Access denied - insufficient permissions")
        return user
    return check_role


def has_effective_role(user: dict, *allowed_roles: str) -> bool:
    """Check if user's base role OR any special role matches any allowed role.
    E.g., a lecturer with special_roles=['coordinator'] has effective roles {lecturer, coordinator}.
    """
    if not user:
        return False
    base = user.get("role")
    special = set(user.get("special_roles", []) or [])
    effective = special | ({base} if base else set())
    return any(r in effective for r in allowed_roles)


def require_effective_role(*allowed_roles: str):
    """Require that user's base role OR any special_role is in allowed_roles."""
    async def check(user = Depends(get_current_user)):
        if not has_effective_role(user, *allowed_roles):
            raise HTTPException(
                status_code=403,
                detail=f"Access denied - requires one of: {', '.join(allowed_roles)}"
            )
        return user
    return check

def require_role_active(required_role: str):
    """Require a specific role and that user is active"""
    async def check_role_active(
        user = Depends(get_current_user),
        db: AsyncSession = Depends(get_db)
    ):
        if user.get("role") != required_role:
            raise HTTPException(status_code=403, detail="Access denied - insufficient permissions")
        
        # Check if user is active
        result = await db.execute(
            text("SELECT is_active FROM users WHERE email = :email"),
            {"email": user["user_id"]}
        )
        db_user = result.fetchone()
        
        if db_user and not db_user[0]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="User account is not active"
            )
        
        return user
    return check_role_active
