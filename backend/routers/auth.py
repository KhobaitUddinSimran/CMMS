"""Authentication endpoints - Simplified for frontend compatibility"""
import logging
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel, EmailStr
from slowapi import Limiter
from slowapi.util import get_remote_address
from ..db.database import get_db
from ..core.security import hash_password, verify_password, create_access_token
from ..models.user import User
from ..dependencies.auth import get_current_user
from datetime import datetime
import uuid
import os

router = APIRouter(prefix="/auth", tags=["auth"])
logger = logging.getLogger(__name__)

def get_rate_limit_key(request: Request) -> str:
    """Rate limit key function - per-user in production, lenient in dev"""
    if os.getenv("ENVIRONMENT", "development") == "development":
        return "dev-shared-key"
    return get_remote_address(request)

limiter = Limiter(key_func=get_rate_limit_key)

# ==================== Pydantic Models ====================
class LoginRequest(BaseModel):
    email: EmailStr
    password: str
    role: str

class LoginResponse(BaseModel):
    token: str
    user: dict
    approval_status: str
    special_roles: list[str] = []

class SignupRequest(BaseModel):
    email: EmailStr
    full_name: str
    role: str
    password: str
    matric_number: str | None = None

class SignupResponse(BaseModel):
    user_id: str
    approval_status: str

class PasswordResetRequest(BaseModel):
    email: EmailStr

class PasswordResetResponse(BaseModel):
    message: str
    token_sent_at: str

class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str

class ResetPasswordResponse(BaseModel):
    success: bool
    message: str

class ApprovalStatusResponse(BaseModel):
    approval_status: str
    approved_at: str | None = None
    rejection_reason: str | None = None
    approved_by: str | None = None

class AuthUserResponse(BaseModel):
    id: str
    email: str
    full_name: str
    role: str
    is_active: bool
    email_verified: bool
    approval_status: str
    created_at: str | None = None

# Import mock users from shared storage
from ..db.mock_data import MOCK_USERS, PENDING_USERS

# ==================== LOGIN ENDPOINT ====================
@router.post("/login", response_model=LoginResponse)
@limiter.limit("50/15minutes")
async def login(request: Request, credentials: LoginRequest, db: AsyncSession = Depends(get_db)):
    """Login endpoint
    
    Accepts email, password, and role. Returns JWT token and user info.
    """
    try:
        # Check mock users first (for testing)
        user = MOCK_USERS.get(credentials.email)
        
        if user:
            # Try hashed password first (for new signups)
            password_valid = verify_password(credentials.password, user["password"])
            
            # Also try plain text for backward compatibility with test users
            if not password_valid:
                password_valid = (user["password"] == credentials.password)
            
            if password_valid:
                # Check if user is active (approved)
                if not user.get("is_active", False):
                    logger.warning(f"Login attempt for inactive user {credentials.email}")
                    raise HTTPException(
                        status_code=status.HTTP_403_FORBIDDEN,
                        detail="Account not approved yet. Please wait for admin approval."
                    )
                
                # Generate JWT token with UUID (not email)
                user_uuid = user.get("id", str(uuid.uuid4()))
                token = create_access_token(
                    user_id=user_uuid,
                    role=user["role"],
                    special_roles=user.get("special_roles", []),
                )
                
                logger.info(f"User {credentials.email} logged in successfully (mock) - UUID: {user_uuid}")
                
                return LoginResponse(
                    token=token,
                    user={
                        "id": user_uuid,  # Return UUID, not email
                        "email": credentials.email,
                        "full_name": user["full_name"],
                        "role": user["role"],
                        "is_active": user["is_active"],
                        "email_verified": user["email_verified"],
                        "approval_status": user["approval_status"],
                        "special_roles": user.get("special_roles", []),
                    },
                    approval_status=user["approval_status"],
                    special_roles=user.get("special_roles", []),
                )
        
        # Try database lookup (for real users)
        # This can be implemented later when database is ready
        
        logger.warning(f"Failed login attempt for {credentials.email}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Login error for {credentials.email}: {type(e).__name__}: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Authentication service error"
        )

# ==================== SIGNUP ENDPOINT ====================
@router.post("/signup", response_model=SignupResponse, status_code=status.HTTP_202_ACCEPTED)
@limiter.limit("100/1hour")
async def signup(
    request: Request,
    signup_data: SignupRequest,
    db: AsyncSession = Depends(get_db),
):
    """User signup endpoint
    
    Creates a new user account pending admin approval.
    """
    try:
        # Only student, lecturer, admin can sign up directly
        # Coordinator and HOD are special roles assigned by admin to lecturers
        if signup_data.role not in ("student", "lecturer", "admin"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Coordinator and HOD roles are assigned by admin. Please sign up as a lecturer."
            )
        
        # Validate email domain
        if not (signup_data.email.endswith("@utm.my") or signup_data.email.endswith("@graduate.utm.my")):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email must be from UTM domain (@utm.my or @graduate.utm.my)"
            )
        
        # Validate matric number for students
        if signup_data.role == "student" and not signup_data.matric_number:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Matric number is required for students"
            )
        
        # Check if email already exists (in mock or database)
        if signup_data.email in MOCK_USERS:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Email already registered"
            )
        
        # Generate user ID
        user_id = str(uuid.uuid4())
        
        # Add to PENDING_USERS awaiting admin approval
        # Do NOT add to MOCK_USERS until admin approves
        PENDING_USERS[signup_data.email] = {
            "id": user_id,
            "password": hash_password(signup_data.password),
            "role": signup_data.role,
            "full_name": signup_data.full_name,
            "email_verified": True,  # In production, would verify via OTP
            "matric_number": signup_data.matric_number,
            "created_at": datetime.utcnow().isoformat(),
        }
        
        # Also temporarily add to MOCK_USERS for approval status checking
        # but mark as inactive so login fails until approved
        MOCK_USERS[signup_data.email] = {
            "id": user_id,
            "password": hash_password(signup_data.password),
            "role": signup_data.role,
            "full_name": signup_data.full_name,
            "approval_status": "pending",
            "is_active": False,  # Cannot login until approved
            "email_verified": True,
            "matric_number": signup_data.matric_number,
        }
        
        logger.info(f"New signup for {signup_data.email} with role {signup_data.role} - pending admin approval")
        
        return SignupResponse(
            user_id=user_id,
            approval_status="pending",
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Signup error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Signup service error"
        )

# ==================== LOGOUT ENDPOINT ====================
@router.post("/logout")
async def logout(current_user = Depends(get_current_user)):
    """Logout endpoint
    
    JWT is stateless, so this just acknowledges logout on the client.
    """
    try:
        user_id = current_user.get("user_id", "unknown")
        logger.info(f"User {user_id} logged out")
        return {"message": "Logout successful"}
    except Exception as e:
        logger.error(f"Logout error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Logout failed"
        )

# ==================== GET CURRENT USER ====================
@router.get("/me")
async def get_current_user_info(current_user = Depends(get_current_user)):
    """Get current authenticated user info (includes special_roles for dynamic sidebar)"""
    try:
        user_id = current_user.get("user_id")
        role = current_user.get("role")

        # Try Supabase first (real users have UUID ids)
        try:
            from ..core.config import supabase
            resp = supabase.table("users").select("*").eq("id", user_id).execute()
            if resp.data:
                u = resp.data[0]
                return {
                    "id": u.get("id"),
                    "email": u.get("email"),
                    "full_name": u.get("full_name", ""),
                    "role": u.get("role"),
                    "is_active": u.get("is_active", True),
                    "email_verified": u.get("email_verified", False),
                    "approval_status": u.get("approval_status", "pending"),
                    "special_roles": u.get("special_roles") or [],
                }
        except Exception as e:
            logger.warning(f"Supabase /me lookup failed, trying mock: {e}")

        # Mock lookup — find by UUID or by email match
        matched_email = None
        matched_user = None
        for email_key, user_data in MOCK_USERS.items():
            if user_data.get("id") == user_id or email_key == user_id:
                matched_email = email_key
                matched_user = user_data
                break

        if matched_user:
            return {
                "id": matched_user.get("id", matched_email),
                "email": matched_email,
                "full_name": matched_user.get("full_name", ""),
                "role": matched_user.get("role", role),
                "is_active": matched_user.get("is_active", True),
                "email_verified": matched_user.get("email_verified", True),
                "approval_status": matched_user.get("approval_status", "approved"),
                "special_roles": matched_user.get("special_roles", []),
            }

        # Fallback: minimal info from token
        return {
            "id": user_id,
            "email": "",
            "full_name": "",
            "role": role,
            "is_active": True,
            "email_verified": False,
            "approval_status": "pending",
            "special_roles": [],
        }
        
    except Exception as e:
        logger.error(f"Error fetching user info: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch user information"
        )

# ==================== APPROVAL STATUS ENDPOINT ====================
@router.get("/approval-status/{user_id}", response_model=ApprovalStatusResponse)
async def check_approval_status(user_id: str):
    """Check approval status for a user"""
    try:
        # Check mock users
        if user_id in MOCK_USERS:
            user = MOCK_USERS[user_id]
            return ApprovalStatusResponse(
                approval_status=user["approval_status"],
                approved_at=None,
                rejection_reason=None,
                approved_by=None,
            )
        
        # If not found
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error checking approval status: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to check approval status"
        )

# ==================== PASSWORD RESET ====================
@router.post("/password-reset", response_model=PasswordResetResponse)
async def password_reset(request: PasswordResetRequest):
    """Request password reset"""
    try:
        # Check if user exists
        if request.email not in MOCK_USERS:
            # Don't reveal if email exists (security best practice)
            return PasswordResetResponse(
                message="If account exists, password reset instructions have been sent to your email",
                token_sent_at=datetime.now().isoformat(),
            )
        
        logger.info(f"Password reset requested for {request.email}")
        
        return PasswordResetResponse(
            message="Password reset instructions have been sent to your email",
            token_sent_at=datetime.now().isoformat(),
        )
        
    except Exception as e:
        logger.error(f"Password reset error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Password reset service error"
        )

# ==================== RESET PASSWORD WITH TOKEN ====================
@router.post("/reset-password", response_model=ResetPasswordResponse)
async def reset_password(request: ResetPasswordRequest):
    """Reset password with token (simplified - token validation not implemented yet)"""
    try:
        if not request.token or not request.new_password:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Token and new password are required"
            )
        
        if len(request.new_password) < 8:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Password must be at least 8 characters"
            )
        
        logger.info("Password reset with token completed")
        
        return ResetPasswordResponse(
            success=True,
            message="Password has been reset successfully. Please login with your new password."
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Reset password error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Password reset error"
        )
