"""OTP endpoints"""
import logging
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from ..db.database import get_db
from ..schemas.otp import OTPRequest, OTPVerify, OTPResponse, OTPVerifyResponse, OTPResendRequest
from ..services.otp_service import OTPService
from ..services.email_service import EmailService

router = APIRouter(prefix="/api/otp", tags=["otp"])
logger = logging.getLogger(__name__)

@router.post("/send", response_model=OTPResponse)
async def send_otp(
    request: OTPRequest,
    db: AsyncSession = Depends(get_db),
):
    """
    Request an OTP code to be sent to email
    
    Supported OTP types:
    - password_reset: 15 minute expiration
    - email_verification: 24 hour expiration
    - login: 10 minute expiration
    """
    try:
        # Validate OTP type
        valid_types = ["password_reset", "email_verification", "login"]
        if request.otp_type not in valid_types:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid OTP type. Must be one of: {', '.join(valid_types)}"
            )
        
        # Create OTP
        otp = await OTPService.create_otp(
            db,
            email=request.email,
            otp_type=request.otp_type,
        )
        
        # Send OTP via email
        email_sent = await EmailService.send_otp(
            email=request.email,
            otp=otp.code,
            expires_in_minutes=OTPService.EXPIRATION_TIMES.get(request.otp_type, 15),
        )
        
        if not email_sent:
            logger.warning(f"Failed to send OTP email to {request.email}")
            # Still return success as OTP is created (for testing without email configured)
        
        return OTPResponse(
            email=request.email,
            otp_type=request.otp_type,
            expires_at=otp.expires_at,
            attempts_remaining=otp.max_attempts - otp.attempts,
            message="OTP sent successfully to your email"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error sending OTP to {request.email}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to send OTP"
        )

@router.post("/verify", response_model=OTPVerifyResponse)
async def verify_otp(
    request: OTPVerify,
    db: AsyncSession = Depends(get_db),
):
    """
    Verify an OTP code
    
    Returns success if OTP is valid and not expired
    """
    try:
        # Verify OTP
        is_valid, error_message = await OTPService.verify_otp(
            db,
            email=request.email,
            code=request.code,
            otp_type=request.otp_type,
        )
        
        if not is_valid:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=error_message
            )
        
        # Mark OTP as used
        await OTPService.mark_otp_used(
            db,
            email=request.email,
            code=request.code,
            otp_type=request.otp_type,
        )
        
        return OTPVerifyResponse(
            success=True,
            message="OTP verified successfully",
            error=None
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error verifying OTP for {request.email}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to verify OTP"
        )

@router.post("/resend", response_model=OTPResponse)
async def resend_otp(
    request: OTPResendRequest,
    db: AsyncSession = Depends(get_db),
):
    """
    Request a new OTP code (invalidates previous attempts)
    """
    try:
        # Validate OTP type
        valid_types = ["password_reset", "email_verification", "login"]
        if request.otp_type not in valid_types:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid OTP type. Must be one of: {', '.join(valid_types)}"
            )
        
        # Resend OTP (creates new one)
        otp = await OTPService.resend_otp(
            db,
            email=request.email,
            otp_type=request.otp_type,
        )
        
        # Send OTP via email
        email_sent = await EmailService.send_otp(
            email=request.email,
            otp=otp.code,
            expires_in_minutes=OTPService.EXPIRATION_TIMES.get(request.otp_type, 15),
        )
        
        if not email_sent:
            logger.warning(f"Failed to send OTP email to {request.email}")
        
        return OTPResponse(
            email=request.email,
            otp_type=request.otp_type,
            expires_at=otp.expires_at,
            attempts_remaining=otp.max_attempts - otp.attempts,
            message="New OTP sent successfully to your email"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error resending OTP to {request.email}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to resend OTP"
        )

@router.get("/status")
async def check_otp_status(
    email: str = Query(...),
    otp_type: str = Query("password_reset"),
    db: AsyncSession = Depends(get_db),
):
    """Check status of OTP for an email (for debugging)"""
    try:
        otp = await OTPService.get_latest_otp(db, email, otp_type)
        
        if not otp:
            return {
                "email": email,
                "otp_type": otp_type,
                "status": "not_found",
                "message": "No OTP found for this email"
            }
        
        return {
            "email": email,
            "otp_type": otp_type,
            "status": "found",
            "is_valid": otp.is_valid(),
            "is_expired": otp.is_expired(),
            "is_used": otp.is_used,
            "is_locked": otp.is_locked,
            "attempts": otp.attempts,
            "max_attempts": otp.max_attempts,
            "expires_at": otp.expires_at,
        }
        
    except Exception as e:
        logger.error(f"Error checking OTP status: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to check OTP status"
        )
