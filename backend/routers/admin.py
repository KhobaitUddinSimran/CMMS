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

class AssignSpecialRoleRequest(BaseModel):
    email: EmailStr
    special_role: str  # "coordinator" or "hod"

class RevokeSpecialRoleRequest(BaseModel):
    email: EmailStr
    special_role: str  # "coordinator" or "hod"

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

# ==================== SPECIAL ROLE MANAGEMENT ====================

@router.post("/assign-special-role")
async def assign_special_role(
    request: AssignSpecialRoleRequest,
    current_user = Depends(require_role("admin"))
):
    """Assign a special role (coordinator/hod) to a lecturer (Admin only)"""
    email = request.email.lower()
    special_role = request.special_role.lower()
    
    # Validate special role
    if special_role not in ["coordinator", "hod"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Special role must be 'coordinator' or 'hod'"
        )
    
    # Check if user exists
    if email not in MOCK_USERS:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    user = MOCK_USERS[email]
    
    # Validate that user is a lecturer or admin
    if user.get("role") not in ["lecturer", "admin"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only lecturers can be assigned special roles"
        )
    
    # Add special role if not already present
    if special_role not in user.get("special_roles", []):
        if "special_roles" not in user:
            user["special_roles"] = []
        user["special_roles"].append(special_role)
        
        logger.info(f"Admin {current_user.get('email')} assigned {special_role} role to {email}")
        
        return {
            "message": f"Special role '{special_role}' assigned successfully",
            "email": email,
            "special_roles": user["special_roles"]
        }
    else:
        return {
            "message": f"User already has '{special_role}' role",
            "email": email,
            "special_roles": user["special_roles"]
        }

@router.post("/revoke-special-role")
async def revoke_special_role(
    request: RevokeSpecialRoleRequest,
    current_user = Depends(require_role("admin"))
):
    """Revoke a special role from a lecturer (Admin only)"""
    email = request.email.lower()
    special_role = request.special_role.lower()
    
    # Validate special role
    if special_role not in ["coordinator", "hod"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Special role must be 'coordinator' or 'hod'"
        )
    
    # Check if user exists
    if email not in MOCK_USERS:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    user = MOCK_USERS[email]
    
    # Remove special role if present
    if special_role in user.get("special_roles", []):
        user["special_roles"].remove(special_role)
        
        logger.info(f"Admin {current_user.get('email')} revoked {special_role} role from {email}")
        
        return {
            "message": f"Special role '{special_role}' revoked successfully",
            "email": email,
            "special_roles": user["special_roles"]
        }
    else:
        return {
            "message": f"User does not have '{special_role}' role",
            "email": email,
            "special_roles": user["special_roles"]
        }

@router.get("/lecturers")
async def list_lecturers(
    current_user = Depends(require_role("admin"))
):
    """Get list of all lecturers with their special roles (Admin only)"""
    lecturers = []
    
    for email, user_data in MOCK_USERS.items():
        if user_data.get("role") == "lecturer":
            lecturers.append({
                "id": email,
                "email": email,
                "full_name": user_data.get("full_name", ""),
                "role": "lecturer",
                "special_roles": user_data.get("special_roles", []),
                "is_active": user_data.get("is_active", False),
            })
    
    return {
        "count": len(lecturers),
        "lecturers": lecturers
    }
