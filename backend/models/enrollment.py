"""Enrollment model"""
from sqlalchemy import Column, String, ForeignKey, Enum, DateTime, Index
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
from .base_model import BaseModel
from datetime import datetime

class Enrollment(BaseModel):
    """Enrollment model - tracks student enrollment in courses"""
    __tablename__ = "enrollments"
    __table_args__ = (
        Index("ix_enrollments_student_course", "student_id", "course_id", unique=True),
    )
    
    student_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    course_id = Column(UUID(as_uuid=True), ForeignKey("courses.id"), nullable=False)
    
    status = Column(String(50), default="active")  # active, withdrawn, completed, dropped
    enrollment_date = Column(DateTime, default=datetime.utcnow)
    withdrawal_date = Column(DateTime, nullable=True)
    
    # Track enrollment source
    source = Column(String(50), default="manual")  # manual, roster_upload, self_seeding
    
    # Relationships
    student = relationship("User", foreign_keys=[student_id])
    course = relationship("Course", back_populates="enrollments")
    
    class Config:
        json_schema_extra = {
            "example": {
                "student_id": "uuid",
                "course_id": "uuid",
                "status": "active",
                "source": "roster_upload"
            }
        }
