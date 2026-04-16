"""Admin endpoints"""
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr
from ..dependencies.auth import require_role
from ..db.mock_data import MOCK_USERS, PENDING_USERS
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/admin", tags=["admin"])

class ApproveUserRequest(BaseModel):
    email: EmailStr

class RejectUserRequest(BaseModel):
    email: EmailStr
    reason: str | None = None

@router.post("/approve-user")
async def approve_user(
    request: ApproveUserRequest,
    current_user = Depends(require_role("admin"))
):
    """Approve a pending user signup (Admin only)"""
    email = request.email.lower()
    
    # Check if user is in pending users
    if email not in PENDING_USERS:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found in pending list"
        )
    
    pending_user = PENDING_USERS[email]
    
    # Update user in MOCK_USERS to mark as active and approved
    if email in MOCK_USERS:
        MOCK_USERS[email].update({
            "is_active": True,
            "approval_status": "approved",
            "approved_by": current_user.get('email'),
        })
    else:
        # If not in MOCK_USERS, create entry
        MOCK_USERS[email] = {
            **pending_user,
            "is_active": True,
            "approval_status": "approved",
            "approved_by": current_user.get('email'),
        }
    
    # Remove from pending
    del PENDING_USERS[email]
    
    logger.info(f"User {email} approved by admin {current_user.get('email')} - User can now login")
    
    return {
        "message": "User approved successfully and can now login",
        "email": email,
        "status": "approved"
    }

@router.post("/reject-user")
async def reject_user(
    request: RejectUserRequest,
    current_user = Depends(require_role("admin"))
):
    """Reject a pending user signup (Admin only)"""
    email = request.email.lower()
    
    # Check if user is in pending users
    if email not in PENDING_USERS:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found in pending list"
        )
    
    # Remove from pending users
    del PENDING_USERS[email]
    
    logger.info(f"User {email} rejected by admin {current_user.get('email')} - Reason: {request.reason}")
    
    return {
        "message": "User rejected successfully",
        "email": email,
        "status": "rejected"
    }

@router.get("/pending-users")
async def get_pending_users(
    current_user = Depends(require_role("admin"))
):
    """Get list of pending user signups (Admin only)"""
    users = []
    
    for email, user_data in PENDING_USERS.items():
        users.append({
            "id": email,
            "email": email,
            "full_name": user_data.get("full_name", ""),
            "role": user_data.get("role", ""),
            "created_at": user_data.get("created_at")
        })
    
    return {
        "count": len(users),
        "users": users
    }
