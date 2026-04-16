"""Assessment schemas"""
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from uuid import UUID

class AssessmentBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    assessment_type: str = Field(..., description="quiz, assignment, midterm, final, practical")
    max_score: float = Field(..., gt=0)
    weight: float = Field(..., ge=0, le=1)
    order: Optional[int] = 0
    due_date: Optional[datetime] = None

class AssessmentCreate(AssessmentBase):
    course_id: UUID

class AssessmentUpdate(BaseModel):
    name: Optional[str] = None
    max_score: Optional[float] = None
    weight: Optional[float] = None
    order: Optional[int] = None
    due_date: Optional[datetime] = None
    is_published: Optional[str] = None

class AssessmentResponse(AssessmentBase):
    id: UUID
    course_id: UUID
    is_published: str
    published_date: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

class AssessmentDetailResponse(AssessmentResponse):
    submission_count: int = 0
    pending_count: int = 0
