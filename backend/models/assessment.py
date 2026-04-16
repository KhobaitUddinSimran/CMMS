"""Assessment model"""
from sqlalchemy import Column, String, Integer, Float, ForeignKey, Enum, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
from .base_model import BaseModel
import uuid
from datetime import datetime

class Assessment(BaseModel):
    """Assessment model - defines grading components for a course"""
    __tablename__ = "assessments"
    
    course_id = Column(UUID(as_uuid=True), ForeignKey("courses.id"), nullable=False)
    name = Column(String(255), nullable=False)  # e.g., "Quiz 1", "Midterm", "Final Exam"
    assessment_type = Column(Enum("quiz", "assignment", "midterm", "final", "practical", name="assessment_type"), nullable=False)
    max_score = Column(Float, nullable=False)  # e.g., 100
    weight = Column(Float, nullable=False)  # e.g., 0.1 for 10% of total
    order = Column(Integer, default=0)  # Display order
    
    # Deadline
    due_date = Column(DateTime, nullable=True)
    published_date = Column(DateTime, nullable=True)
    is_published = Column(String(50), default="draft")  # draft, published, locked
    
    # Relationships
    course = relationship("Course", back_populates="assessments")
    marks = relationship("Mark", back_populates="assessment", cascade="all, delete-orphan")
    
    class Config:
        json_schema_extra = {
            "example": {
                "name": "Quiz 1",
                "assessment_type": "quiz",
                "max_score": 20.0,
                "weight": 0.1,
                "due_date": "2024-04-30T23:59:59"
            }
        }
