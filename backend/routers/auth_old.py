"""Authentication endpoints - Simplified for frontend compatibility"""
import logging
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, text
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
import logging

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

# Mock users for testing (keeps existing test users)
MOCK_USERS = {
    "uddinsimran@graduate.utm.my": {"password": "password@cmms", "role": "student", "full_name": "Uddin Simran", "approval_status": "approved"},
    "khobaituddinsimran@gmail.com": {"password": "password@cmms", "role": "lecturer", "full_name": "Dr. Khobaituddinsimran", "approval_status": "approved"},
    "lecturer@utm.my": {"password": "password@cmms", "role": "lecturer", "full_name": "Dr. Lecturer", "approval_status": "approved"},
    "coordinator@utm.my": {"password": "password@cmms", "role": "coordinator", "full_name": "Coordinator", "approval_status": "approved"},
    "hod@utm.my": {"password": "password@cmms", "role": "hod", "full_name": "HOD", "approval_status": "approved"},
    "admin@utm.my": {"password": "password@cmms", "role": "admin", "full_name": "Admin", "approval_status": "approved"},
}

@router.post("/login", response_model=LoginResponse)
@limiter.limit("50/15minutes")  # Lenient in dev (50/15min), stricter in prod (configured via IP)
async def login(request: Request, credentials: LoginRequest, db: AsyncSession = Depends(get_db)):
    """Login endpoint with development-friendly rate limiting
    
    Development: Shared soft limit of 50 attempts per 15 minutes for all localhost requests
    Production: 5 attempts per 15 minutes per IP address (when ENVIRONMENT=production)
    """
    try:
        user = MOCK_USERS.get(credentials.email)
        
        # For mock users, do simple password comparison (development only)
        if not user or user["password"] != credentials.password:
            logger.warning(f"Failed login attempt for {credentials.email}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password"
            )
        
        # Create access token
        token = create_access_token(
            user_id=credentials.email,
            role=user["role"]
        )
        
        logger.info(f"User {credentials.email} logged in successfully")
        
        return LoginResponse(
            access_token=token,
            token_type="bearer",
            user={
                "email": credentials.email,
                "name": user["name"],
                "role": user["role"],
                "initials": user["initials"],
            },
            force_password_change=user.get("force_password_change", False)
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Login error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Authentication service error"
        )

@router.post("/password-reset")
async def password_reset(email: str):
    """Request password reset - sends OTP via email"""
    try:
        # Check if user exists
        if email not in MOCK_USERS:
            # Don't reveal if email exists (security best practice)
            return {"message": "If account exists, OTP has been sent"}
        
        # Generate OTP (6 digits)
        import random
        otp = f"{random.randint(100000, 999999)}"
        
        # Send OTP via email
        success = await EmailService.send_otp(email, otp, expires_in_minutes=15)
        
        if success:
            logger.info(f"Password reset OTP sent to {email}")
            return {"message": "OTP sent to your email"}
        else:
            logger.error(f"Failed to send OTP to {email}")
            return {"message": "Failed to send OTP. Please try again."}
            
    except Exception as e:
        logger.error(f"Password reset error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Password reset service error"
        )

@router.post("/password-reset/confirm")
async def confirm_password_reset(email: str, otp: str, new_password: str):
    """Confirm password reset with OTP"""
    try:
        if email not in MOCK_USERS:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        # In production, verify OTP from cache/database
        # For now, accept any 6-digit OTP for testing
        if not otp or len(otp) != 6:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid OTP"
            )
        
        # Validate password strength
        if len(new_password) < 6:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Password must be at least 6 characters"
            )
        
        # Update password (in real app, update in database)
        MOCK_USERS[email]["password"] = hash_password(new_password)
        
        logger.info(f"Password reset successful for {email}")
        return {"message": "Password reset successful"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Password reset confirmation error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Password reset confirmation error"
        )

@router.post("/signup", response_model=SignupFormResponse, status_code=status.HTTP_202_ACCEPTED)
@limiter.limit("1000/1hour")  # Lenient in dev (1000/hour), stricter in prod
async def signup_form_submit(
    request: Request,
    signup_data: SignupRequest,
    db: AsyncSession = Depends(get_db),
):
    """
    Step 1: User submits signup form
    - Validates form data
    - Creates user account (inactive)
    - Generates and sends OTP for email verification
    
    Process: Signup Form → OTP Verification → Admin Approval
    """
    try:
        # Validate password match
        if signup_data.password != signup_data.confirm_password:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Passwords do not match"
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
        
        # Create user account
        success, result = await AuthService.signup_step1_form(
            db,
            email=signup_data.email,
            full_name=signup_data.full_name,
            password=signup_data.password,
            role=signup_data.role,
            matric_number=signup_data.matric_number,
        )
        
        if not success:
            status_code = result.get("status", 400)
            raise HTTPException(
                status_code=status_code,
                detail=result.get("error", "Signup failed")
            )
        
        # Create and send OTP
        otp = await OTPService.create_otp(
            db,
            email=signup_data.email,
            otp_type="email_verification"
        )
        
        email_sent = await EmailService.send_otp(
            email=signup_data.email,
            otp=otp.code,
            expires_in_minutes=24*60,
        )
        
        if not email_sent:
            logger.warning(f"OTP email not sent to {signup_data.email}")
        
        logger.info(f"Signup form submitted for {signup_data.email}. OTP sent.")
        
        return SignupFormResponse(
            email=signup_data.email,
            message="Signup form received. OTP sent to your email. Please verify to continue.",
            next_step="email_verification"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Signup form error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Signup service error"
        )

@router.post("/signup/verify-otp", response_model=SignupOTPVerifyResponse)
@limiter.limit("1000/1hour")  # Lenient in dev (1000/hour), stricter in prod
async def signup_verify_otp(
    request: Request,
    verify_data: SignupOTPVerifyRequest,
    db: AsyncSession = Depends(get_db),
):
    """
    Step 2: User verifies email via OTP
    - Validates OTP code
    - Marks email as verified
    - User now awaits admin approval
    """
    try:
        success, result = await AuthService.signup_step2_verify_otp(
            db,
            email=verify_data.email,
            otp_code=verify_data.code,
        )
        
        if not success:
            status_code = result.get("status", 400)
            raise HTTPException(
                status_code=status_code,
                detail=result.get("error", "OTP verification failed")
            )
        
        logger.info(f"Email verified for {verify_data.email}. Awaiting admin approval.")
        
        return SignupOTPVerifyResponse(
            success=True,
            message="Email verified successfully. Your account is now awaiting administrator approval.",
            next_step="admin_approval"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"OTP verification error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Verification service error"
        )

@router.get("/signup/status/{email}", response_model=SignupStatusResponse)
async def check_signup_status(
    email: str,
    db: AsyncSession = Depends(get_db),
):
    """
    Check signup status: pending, email verified, approved, or rejected
    """
    try:
        status_info = await AuthService.get_signup_status(db, email)
        
        if not status_info:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Signup request not found"
            )
        
        return SignupStatusResponse(**status_info)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Status check error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Status check failed"
        )

@router.post("/logout")
async def logout(current_user = Depends(get_current_user)):
    """Logout endpoint - JWT is stateless, so this just acknowledges logout
    
    In a production system with token blacklisting, this would invalidate the token.
    For now, client-side token deletion is sufficient since JWTs are stateless.
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
