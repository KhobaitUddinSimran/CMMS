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


@router.get("")
async def list_users(
    role: str | None = None,
    current_user=Depends(get_current_user),
):
    """List users with optional role filter. Requires authenticated user."""
    TEACHING_ROLES = ["lecturer", "coordinator", "hod"]
    is_teaching_filter = role in ("lecturer", "teaching")

    from ..core.config import supabase
    if not supabase:
        raise HTTPException(status_code=503, detail="Database unavailable")
    try:
        query = supabase.table("users").select("id, email, full_name, role, is_active")
        if is_teaching_filter:
            query = query.in_("role", TEACHING_ROLES)
        elif role:
            query = query.eq("role", role)
        resp = query.eq("is_active", True).execute()
        users = resp.data or []
        if is_teaching_filter:
            return {"lecturers": users}
        return {"users": users, "count": len(users)}
    except Exception as e:
        logger.error(f"Error listing users: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to list users")

class ChangePasswordRequest(BaseModel):
    old_password: str
    new_password: str
    confirm_password: str | None = None

@router.get("/me")
async def get_current_user_info(
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get current user information — tries Supabase REST, then SQLAlchemy, then mock fallback."""
    user_id = current_user["user_id"]
    role_from_token = current_user.get("role", "student")
    special_roles_from_token = current_user.get("special_roles", [])

    # Supabase lookup by canonical UUID
    from ..core.config import supabase as _sb
    if _sb:
        try:
            resp = _sb.table("users").select(
                "id, email, full_name, role, is_active, email_verified, approval_status, created_at"
            ).eq("id", user_id).execute()
            if resp.data:
                u = resp.data[0]
                db_role = u.get("role", role_from_token)
                db_special = [db_role] if db_role in ("coordinator", "hod") else []
                return {
                    "id": u["id"],
                    "email": u.get("email", ""),
                    "full_name": u.get("full_name", ""),
                    "role": db_role,
                    "is_active": u.get("is_active", True),
                    "email_verified": u.get("email_verified", False),
                    "approval_status": u.get("approval_status", "approved"),
                    "special_roles": db_special or special_roles_from_token,
                    "created_at": u.get("created_at"),
                }
        except Exception as e:
            logger.warning(f"Supabase /users/me lookup failed: {e}")

    # JWT fallback
    return {
        "id": user_id, "email": "", "full_name": "",
        "role": role_from_token, "is_active": True, "email_verified": True,
        "approval_status": "approved", "special_roles": special_roles_from_token,
    }

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
        
        if request.confirm_password is not None and request.new_password != request.confirm_password:
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
