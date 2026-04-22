"""User endpoints"""
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from ..db.database import get_db
from ..schemas.user import UserResponse
from ..dependencies.auth import get_current_user
from ..core.security import hash_password, verify_password
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/users", tags=["users"])

class UpdateProfileRequest(BaseModel):
    full_name: str | None = None

class ChangePasswordRequest(BaseModel):
    old_password: str
    new_password: str
    confirm_password: str

@router.get("/me")
async def get_current_user_info(
    current_user = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get current user information"""
    try:
        user_id = current_user["user_id"]
        
        # Query database for full user info by UUID (new) or email (fallback)
        result = await db.execute(
            text("SELECT id, email, full_name, role, is_active FROM users WHERE id = :user_id OR email = :user_id"),
            {"user_id": user_id}
        )
        user = result.fetchone()
        
        if user:
            return {
                "id": str(user[0]),
                "email": user[1],
                "full_name": user[2],
                "role": user[3],
                "is_active": user[4],
            }
        else:
            # Fallback for mock users - return minimal info
            logger.debug(f"User {user_id} not found in database, returning mock user info")
            return {
                "id": user_id,
                "email": "unknown@utm.my",
                "full_name": "Mock User",
                "role": current_user.get("role", "student"),
                "is_active": True,
            }
    except Exception as e:
        logger.error(f"Error fetching user info: {type(e).__name__}: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch user information: {str(e)}"
        )

@router.put("/me")
async def update_profile(
    request: UpdateProfileRequest,
    current_user = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Update user profile"""
    try:
        user_id = current_user["user_id"]
        
        # Validate input
        if request.full_name is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="At least one field is required to update"
            )
        
        # Check if user exists
        result = await db.execute(
            text("SELECT id FROM users WHERE email = :email"),
            {"email": user_id}
        )
        user = result.fetchone()
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        # Update profile
        if request.full_name:
            await db.execute(
                text("UPDATE users SET full_name = :full_name WHERE email = :email"),
                {"full_name": request.full_name, "email": user_id}
            )
        
        await db.commit()
        logger.info(f"User {user_id} profile updated")
        
        return {
            "message": "Profile updated successfully",
            "email": user_id,
            "full_name": request.full_name
        }
        
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        logger.error(f"Error updating profile for user {current_user.get('user_id')}: {type(e).__name__}: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update profile"
        )

@router.post("/password-change")
async def change_password(
    request: ChangePasswordRequest,
    current_user = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Change password"""
    try:
        user_id = current_user["user_id"]
        
        # Validate input
        if not request.old_password:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Old password is required"
            )
        
        if not request.new_password:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="New password is required"
            )
        
        if len(request.new_password) < 8:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Password must be at least 8 characters"
            )
        
        if request.new_password != request.confirm_password:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Passwords do not match"
            )
        
        # Get user from database
        result = await db.execute(
            text("SELECT id, password_hash FROM users WHERE email = :email"),
            {"email": user_id}
        )
        user = result.fetchone()
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        # Verify old password
        if not verify_password(request.old_password, user[1]):
            logger.warning(f"Failed password change attempt for {user_id} - incorrect old password")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Old password is incorrect"
            )
        
        # Hash new password
        new_password_hash = hash_password(request.new_password)
        
        # Update password in database
        await db.execute(
            text("UPDATE users SET password_hash = :password_hash WHERE email = :email"),
            {"password_hash": new_password_hash, "email": user_id}
        )
        
        await db.commit()
        logger.info(f"Password changed for user {user_id}")
        
        return {"message": "Password changed successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        logger.error(f"Error changing password for user {current_user.get('user_id')}: {type(e).__name__}: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to change password"
        )
