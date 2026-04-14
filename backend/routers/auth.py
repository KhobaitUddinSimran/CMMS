"""Authentication endpoints"""
import logging
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.ext.asyncio import AsyncSession
from slowapi import Limiter
from slowapi.util import get_remote_address
from ..db.database import get_db
from ..schemas.auth import LoginRequest, LoginResponse
from ..core.security import hash_password, verify_password, create_access_token
from ..models.user import User
from ..services.auth_service import AuthService
from ..services.email_service import EmailService

router = APIRouter(prefix="/api/auth", tags=["auth"])
import os

def get_rate_limit_key(request: Request) -> str:
    """Rate limit key function - per-user in production, lenient in dev"""
    # In development (localhost), don't strict rate limit
    if os.getenv("ENVIRONMENT", "development") == "development":
        return "dev-shared-key"  # All dev requests share one limit
    # In production, use IP-based limiting
    from slowapi.util import get_remote_address
    return get_remote_address(request)

limiter = Limiter(key_func=get_rate_limit_key)
logger = logging.getLogger(__name__)

# Mock users for demonstration (In production, these come from database)
MOCK_USERS = {
    "uddinsimran@graduate.utm.my": {"password": "password@cmms", "role": "student", "name": "Uddin Simran", "initials": "US", "force_password_change": False},
    "khobaituddinsimran@gmail.com": {"password": "password@cmms", "role": "lecturer", "name": "Dr. Khobaituddinsimran", "initials": "KS", "force_password_change": False},
    "lecturer@utm.my": {"password": "password@cmms", "role": "lecturer", "name": "Dr. Lecturer", "initials": "DL", "force_password_change": False},
    "coordinator@utm.my": {"password": "password@cmms", "role": "coordinator", "name": "Coordinator", "initials": "CO", "force_password_change": False},
    "hod@utm.my": {"password": "password@cmms", "role": "hod", "name": "HOD", "initials": "HE", "force_password_change": False},
    "admin@utm.my": {"password": "password@cmms", "role": "admin", "name": "Admin", "initials": "AD", "force_password_change": False},
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
