"""Course schemas"""
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from uuid import UUID

class AssessmentRef(BaseModel):
    """Lightweight assessment reference for course"""
    id: UUID
    name: str
    assessment_type: str
    weight: float
    max_score: float

class CourseBase(BaseModel):
    code: str = Field(..., min_length=1, max_length=50)
    name: str = Field(..., min_length=1, max_length=255)
    section: str = Field(..., min_length=1, max_length=10)
    semester: str = Field(..., min_length=1, max_length=20)
    credit_hours: Optional[int] = 3
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None

class CourseCreate(CourseBase):
    lecturer_id: Optional[UUID] = None
    coordinator_id: Optional[UUID] = None

class CourseUpdate(BaseModel):
    name: Optional[str] = None
    section: Optional[str] = None
    lecturer_id: Optional[UUID] = None
    coordinator_id: Optional[UUID] = None
    status: Optional[str] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None

class CourseResponse(CourseBase):
    id: UUID
    lecturer_id: Optional[UUID] = None
    coordinator_id: Optional[UUID] = None
    status: str
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

class CourseDetailResponse(CourseResponse):
    assessments: List[AssessmentRef] = []
    enrollment_count: int = 0
