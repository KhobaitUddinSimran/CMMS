"""User endpoints"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from ..db.database import get_db
from ..schemas.user import UserResponse
from ..dependencies.auth import get_current_user

router = APIRouter(prefix="/api/users", tags=["users"])

@router.get("/me")
async def get_current_user_info(
    current_user = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get current user information"""
    # Return basic user info from token
    return {
        "id": current_user["user_id"],
        "email": current_user["user_id"],
        "name": current_user.get("name", ""),
        "role": current_user["role"],
        "created_at": ""
    }

@router.put("/me")
async def update_profile(
    current_user = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Update user profile"""
    # TODO: Update user profile
    return {"message": "Profile update not yet implemented"}

@router.post("/password-change")
async def change_password(
    current_user = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Change password"""
    # TODO: Change password
    return {"message": "Password change not yet implemented"}
