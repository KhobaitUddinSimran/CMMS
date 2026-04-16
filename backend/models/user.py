"""User model"""
from sqlalchemy import Column, String, Boolean, DateTime, Text
from sqlalchemy.dialects.postgresql import UUID
from .base_model import BaseModel
from datetime import datetime
import uuid

class User(BaseModel):
    __tablename__ = "users"
    
    email = Column(String(255), unique=True, nullable=False)
    full_name = Column(String(255), nullable=False)
    password_hash = Column(String(255), nullable=True)
    role = Column(String(50), nullable=False)
    
    # Account status
    is_active = Column(Boolean, default=False)  # Can login
    email_verified = Column(Boolean, default=False)  # Email OTP verified
    approval_status = Column(String(50), default="pending")  # pending, approved, rejected
    
    # Student info
    matric_number = Column(String(50), nullable=True, unique=True)
    
    # Approval tracking
    approved_by = Column(UUID(as_uuid=True), nullable=True)  # Admin who approved
    approved_at = Column(DateTime, nullable=True)
    rejection_reason = Column(Text, nullable=True)  # If rejected
