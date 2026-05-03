"""Authentication dependencies"""
from fastapi import Depends, HTTPException, status, Header
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import jwt, JWTError
from typing import Optional
import time
from ..core.config import settings
from ..core.exceptions import InvalidTokenException
from ..core.security import decode_token
import logging

_supabase = None

# Role cache: {user_id: (role, special_roles, expires_at_timestamp)}
_role_cache: dict[str, tuple[str, list, float]] = {}
ROLE_CACHE_TTL = 60  # seconds


def invalidate_role_cache(user_id: str) -> None:
    """Call this after changing a user's role or active status so the change takes effect immediately."""
    _role_cache.pop(user_id, None)


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
    """Fetch role + special_roles from Supabase with a 60s TTL cache.
    Also enforces is_active — raises 403 if the account has been deactivated.
    """
    now = time.time()
    cached = _role_cache.get(user_id)
    if cached and cached[2] > now:
        return cached[0], cached[1]

    sb = _get_supabase()
    if sb:
        try:
            resp = sb.table("users").select("role, special_roles, is_active").eq("id", user_id).limit(1).execute()
            if resp.data:
                row = resp.data[0]
                if not row.get("is_active", True):
                    raise HTTPException(
                        status_code=status.HTTP_403_FORBIDDEN,
                        detail="Account has been deactivated",
                    )
                db_role = row.get("role") or jwt_role
                db_special = row.get("special_roles") or []
                if not db_special and db_role in ("coordinator", "hod"):
                    db_special = [db_role]
                _role_cache[user_id] = (db_role, db_special, now + ROLE_CACHE_TTL)
                return db_role, db_special
        except HTTPException:
            raise
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

