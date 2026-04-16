from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class SignupRequest(BaseModel):
    """Step 1: User fills signup form"""
    email: EmailStr
    full_name: str = Field(..., min_length=1, max_length=255)
    password: str = Field(..., min_length=8, description="Minimum 8 characters")
    confirm_password: str = Field(..., description="Must match password")
    role: str = Field(..., description="student, lecturer, coordinator, hod")
    matric_number: Optional[str] = Field(None, description="Required for students")
    
    def validate_password_match(self):
        if self.password != self.confirm_password:
            raise ValueError("Passwords do not match")
    
    def validate_email_domain(self):
        """Validate email is from UTM domain"""
        if not (self.email.endswith("@utm.my") or self.email.endswith("@graduate.utm.my")):
            raise ValueError("Email must be from UTM domain (@utm.my or @graduate.utm.my)")

class SignupFormResponse(BaseModel):
    """Response after form submission - proceed to OTP verification"""
    email: str
    message: str
    next_step: str = "email_verification"

class SignupOTPVerifyRequest(BaseModel):
    """Step 2: User verifies OTP from email"""
    email: EmailStr
    code: str = Field(..., min_length=6, max_length=6)

class SignupOTPVerifyResponse(BaseModel):
    """Response after OTP verification"""
    success: bool
    message: str
    next_step: str = "admin_approval"

class SignupStatusResponse(BaseModel):
    """Check signup status/awaiting admin approval"""
    email: str
    full_name: str
    role: str
    approval_status: str  # pending, approved, rejected
    email_verified: bool
    message: str

class UserResponse(BaseModel):
    email: str
    name: str
    role: str
    initials: str

class LoginResponse(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse
    force_password_change: bool = False

class TokenRequest(BaseModel):
    access_token: str
    token_type: str = "bearer"

# Admin endpoints
class AdminSignupRequestResponse(BaseModel):
    """Signup request info for admin"""
    user_id: str
    email: str
    full_name: str
    role: str
    matric_number: Optional[str] = None
    approval_status: str
    email_verified: bool
    submitted_at: datetime

class ApproveSignupRequest(BaseModel):
    """Admin approval"""
    user_id: str
    message: Optional[str] = None

class RejectSignupRequest(BaseModel):
    """Admin rejection"""
    user_id: str
    reason: str = Field(...)

class ApprovalResponse(BaseModel):
    success: bool
    message: str
    user_email: str
