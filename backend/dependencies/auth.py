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

logger = logging.getLogger(__name__)
security = HTTPBearer()

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Validate JWT token and return user info"""
    try:
        token = credentials.credentials
        payload = decode_token(token)
        user_id = payload.get("sub")
        role = payload.get("role")
        
        if user_id is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication token"
            )
        
        return {"user_id": user_id, "role": role}
        
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
        # Query database to check if user is active
        result = await db.execute(
            text("SELECT is_active FROM users WHERE email = :email"),
            {"email": user["user_id"]}
        )
        db_user = result.fetchone()
        
        # If user exists in DB and is active
        if db_user and db_user[0]:
            return user
        
        # If user doesn't exist in DB (mock user - allow anyway for development)
        if not db_user:
            logger.debug(f"User {user['user_id']} not found in database (mock user)")
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
