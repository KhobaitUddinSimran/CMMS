"""Mark model"""
from sqlalchemy import Column, Float, ForeignKey, String, DateTime, Text, Index
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
from .base_model import BaseModel
import uuid
from datetime import datetime

class Mark(BaseModel):
    """Mark model - stores student marks for assessments"""
    __tablename__ = "marks"
    __table_args__ = (
        Index("ix_marks_student_assessment", "student_id", "assessment_id", unique=False),
        Index("ix_marks_course", "course_id", unique=False),
    )
    
    student_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    course_id = Column(UUID(as_uuid=True), ForeignKey("courses.id"), nullable=False)
    assessment_id = Column(UUID(as_uuid=True), ForeignKey("assessments.id"), nullable=False)
    
    score = Column(Float, nullable=True)  # Can be null for unpublished marks
    is_delayed = Column(String(50), default="no")  # yes/no/medical_cert
    is_flagged = Column(String(50), default="no")  # For internal review
    flag_reason = Column(Text, nullable=True)
    
    status = Column(String(50), default="draft")  # draft, submitted, published
    
    # Audit trail
    modified_by = Column(UUID(as_uuid=True), nullable=True)  # User who last modified
    modified_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    student = relationship("User", foreign_keys=[student_id])
    course = relationship("Course", back_populates="marks")
    assessment = relationship("Assessment", back_populates="marks")
    
    class Config:
        json_schema_extra = {
            "example": {
                "student_id": "uuid",
                "course_id": "uuid",
                "assessment_id": "uuid",
                "score": 18.5,
                "status": "published"
            }
        }
