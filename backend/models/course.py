"""Course model"""
from sqlalchemy import Column, String, Integer, ForeignKey, Enum, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
from .base_model import BaseModel
import uuid
from datetime import datetime

class Course(BaseModel):
    """Course model - stores course information and metadata"""
    __tablename__ = "courses"
    
    code = Column(String(50), unique=True, nullable=False)  # e.g., SCSJ3104
    name = Column(String(255), nullable=False)  # e.g., Application Development
    section = Column(String(10), nullable=False)  # e.g., 01, 02
    semester = Column(String(20), nullable=False)  # e.g., 2024/2025-1
    lecturer_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    coordinator_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    credit_hours = Column(Integer, default=3)
    status = Column(Enum("draft", "active", "completed", name="course_status"), default="draft")
    
    # Assessment schema
    assessments = relationship("Assessment", back_populates="course", cascade="all, delete-orphan")
    enrollments = relationship("Enrollment", back_populates="course", cascade="all, delete-orphan")
    marks = relationship("Mark", back_populates="course", cascade="all, delete-orphan")
    
    # Metadata
    start_date = Column(DateTime, nullable=True)
    end_date = Column(DateTime, nullable=True)
    
    class Config:
        json_schema_extra = {
            "example": {
                "code": "SCSJ3104",
                "name": "Application Development",
                "section": "01",
                "semester": "2024/2025-1",
                "status": "active"
            }
        }
