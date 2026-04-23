"""JWT and password security utilities"""
from datetime import datetime, timedelta
from jose import jwt, JWTError
import hashlib
import hmac
from .config import settings

def hash_password(password: str) -> str:
    """Hash password using PBKDF2 (compatible with all systems)"""
    password_bytes = password.encode('utf-8')
    salt = settings.JWT_SECRET_KEY.encode('utf-8')[:16]
    hashed = hashlib.pbkdf2_hmac('sha256', password_bytes, salt, 100000)
    return hashed.hex()

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify password against hash"""
    try:
        return hash_password(plain_password) == hashed_password
    except:
        return False

def create_access_token(user_id: str, role: str, special_roles: list = None) -> str:
    to_encode = {
        "sub": user_id,
        "role": role,
        "special_roles": special_roles or [],
        "exp": datetime.utcnow() + timedelta(hours=settings.JWT_EXPIRATION_HOURS)
    }
    return jwt.encode(to_encode, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)

def decode_token(token: str) -> dict:
    try:
        payload = jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
        return payload
    except JWTError:
        return None
