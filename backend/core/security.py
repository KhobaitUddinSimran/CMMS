"""JWT and password security utilities"""
import hashlib
import logging
from datetime import datetime, timedelta, timezone

import bcrypt
from jose import jwt, JWTError

from .config import settings

_logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Password hashing — bcrypt with unique per-user salts
# ---------------------------------------------------------------------------

def hash_password(password: str) -> str:
    """Hash a password using bcrypt (unique random salt per call)."""
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def _legacy_hash(password: str) -> str:
    """Reproduce the old static-salt PBKDF2 hash for migration checks."""
    salt = settings.JWT_SECRET_KEY.encode("utf-8")[:16]
    return hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, 100000).hex()


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash.

    Supports both new bcrypt hashes (start with ``$2b$``) and legacy
    PBKDF2 hex hashes so that existing accounts keep working.
    """
    try:
        if hashed_password.startswith("$2b$") or hashed_password.startswith("$2a$"):
            return bcrypt.checkpw(
                plain_password.encode("utf-8"),
                hashed_password.encode("utf-8"),
            )
        # Legacy PBKDF2 static-salt check
        return _legacy_hash(plain_password) == hashed_password
    except Exception:
        return False


# ---------------------------------------------------------------------------
# JWT helpers
# ---------------------------------------------------------------------------

def create_access_token(user_id: str, role: str, special_roles: list = None) -> str:
    to_encode = {
        "sub": user_id,
        "role": role,
        "special_roles": special_roles or [],
        "exp": datetime.now(timezone.utc) + timedelta(hours=settings.JWT_EXPIRATION_HOURS),
    }
    return jwt.encode(to_encode, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)


def decode_token(token: str) -> dict:
    try:
        payload = jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
        return payload
    except JWTError:
        return None
