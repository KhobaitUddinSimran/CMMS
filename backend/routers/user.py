"""User endpoints"""
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from dependencies.auth import get_current_user
from core.security import hash_password, verify_password
from core.config import supabase
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

    from core.config import supabase
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

class SetTeachingCreditsRequest(BaseModel):
    max_credits: int | None = None

@router.patch("/{user_id}/teaching-credits")
async def set_teaching_credits(
    user_id: str,
    request: SetTeachingCreditsRequest,
    current_user = Depends(get_current_user),
):
    """Set or clear the per-semester teaching credit cap for a lecturer.
    Accessible by coordinator, hod, or admin only."""
    from core.config import supabase
    if not supabase:
        raise HTTPException(status_code=503, detail="Database unavailable")

    # Permission check
    role = current_user.get("role", "")
    special = current_user.get("special_roles", [])
    allowed = role in ("admin",) or any(r in special for r in ("coordinator", "hod")) or role in ("coordinator", "hod")
    if not allowed:
        raise HTTPException(status_code=403, detail="Insufficient permissions")

    # Validate value
    if request.max_credits is not None and request.max_credits < 1:
        raise HTTPException(status_code=400, detail="max_credits must be at least 1, or null for no limit")

    try:
        resp = supabase.table("users").update(
            {"max_teaching_credits": request.max_credits}
        ).eq("id", user_id).execute()

        if not resp.data:
            raise HTTPException(status_code=404, detail="Lecturer not found")

        logger.info(f"Teaching credits for {user_id} set to {request.max_credits} by {current_user.get('user_id')}")
        return {"user_id": user_id, "max_teaching_credits": request.max_credits}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error setting teaching credits: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to update teaching credits")


class ChangePasswordRequest(BaseModel):
    old_password: str
    new_password: str
    confirm_password: str | None = None

@router.get("/me")
async def get_current_user_info(
    current_user=Depends(get_current_user),
):
    """Get current user information from Supabase."""
    user_id = current_user["user_id"]
    role_from_token = current_user.get("role", "student")
    special_roles_from_token = current_user.get("special_roles", [])

    if supabase:
        try:
            resp = supabase.table("users").select(
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
):
    """Update user profile"""
    try:
        user_id = current_user["user_id"]
        
        if not supabase:
            raise HTTPException(status_code=503, detail="Database unavailable")
        
        # Validate input
        if request.full_name is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="At least one field is required to update"
            )
        
        # Update profile
        resp = supabase.table("users").update(
            {"full_name": request.full_name}
        ).eq("id", user_id).execute()
        
        if not resp.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        logger.info(f"User {user_id} profile updated")
        
        return {
            "message": "Profile updated successfully",
            "id": user_id,
            "full_name": request.full_name
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating profile for user {current_user.get('user_id')}: {type(e).__name__}: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update profile"
        )

@router.post("/password-change")
async def change_password(
    request: ChangePasswordRequest,
    current_user = Depends(get_current_user),
):
    """Change password"""
    try:
        user_id = current_user["user_id"]
        
        if not supabase:
            raise HTTPException(status_code=503, detail="Database unavailable")
        
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
        resp = supabase.table("users").select("id, password_hash").eq("id", user_id).execute()
        if not resp.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        user = resp.data[0]
        
        # Verify old password
        if not verify_password(request.old_password, user.get("password_hash", "")):
            logger.warning(f"Failed password change attempt for {user_id} - incorrect old password")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Old password is incorrect"
            )
        
        # Hash new password
        new_password_hash = hash_password(request.new_password)
        
        # Update password in database
        supabase.table("users").update(
            {"password_hash": new_password_hash}
        ).eq("id", user_id).execute()
        
        logger.info(f"Password changed for user {user_id}")
        
        return {"message": "Password changed successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error changing password for user {current_user.get('user_id')}: {type(e).__name__}: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to change password"
        )
