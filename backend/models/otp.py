"""OTP (One-Time Password) model"""
from sqlalchemy import Column, String, Integer, DateTime, Boolean, Index
from sqlalchemy.dialects.postgresql import UUID
from .base_model import BaseModel
from datetime import datetime, timedelta
import uuid

class OTP(BaseModel):
    """OTP model - stores one-time passwords for verification"""
    __tablename__ = "otps"
    __table_args__ = (
        Index("ix_otps_email_type", "email", "otp_type", unique=False),
        Index("ix_otps_code", "code", unique=False),
    )
    
    email = Column(String(255), nullable=False)
    code = Column(String(6), nullable=False)  # 6-digit OTP
    otp_type = Column(String(50), nullable=False)  # password_reset, email_verification, login
    
    is_used = Column(Boolean, default=False)
    used_at = Column(DateTime, nullable=True)
    
    attempts = Column(Integer, default=0)  # Track verification attempts
    max_attempts = Column(Integer, default=5)  # Max attempts before lockout
    is_locked = Column(Boolean, default=False)  # Locked after max attempts
    
    # Expiration
    expires_at = Column(DateTime, nullable=False)
    
    def is_valid(self) -> bool:
        """Check if OTP is still valid"""
        return (
            not self.is_used
            and not self.is_locked
            and datetime.utcnow() < self.expires_at
            and self.attempts < self.max_attempts
        )
    
    def is_expired(self) -> bool:
        """Check if OTP is expired"""
        return datetime.utcnow() >= self.expires_at
    
    class Config:
        json_schema_extra = {
            "example": {
                "email": "user@utm.my",
                "code": "123456",
                "otp_type": "email_verification",
                "expires_at": "2024-04-15T12:00:00"
            }
        }
