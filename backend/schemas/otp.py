"""OTP schemas"""
from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime

class OTPRequest(BaseModel):
    """Request to generate/send OTP"""
    email: EmailStr
    otp_type: str = Field(
        default="password_reset",
        description="Type of OTP: password_reset, email_verification, login"
    )

class OTPVerify(BaseModel):
    """Request to verify OTP"""
    email: EmailStr
    code: str = Field(..., min_length=6, max_length=6, description="6-digit OTP code")
    otp_type: str = Field(
        default="password_reset",
        description="Type of OTP being verified"
    )

class OTPResponse(BaseModel):
    """OTP response"""
    email: str
    otp_type: str
    expires_at: datetime
    attempts_remaining: int
    message: str = "OTP sent successfully"

class OTPVerifyResponse(BaseModel):
    """Response after OTP verification"""
    success: bool
    message: str
    error: Optional[str] = None

class OTPResendRequest(BaseModel):
    """Request to resend OTP"""
    email: EmailStr
    otp_type: str = Field(
        default="password_reset",
        description="Type of OTP to resend"
    )
