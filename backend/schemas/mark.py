"""Mark schemas"""
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from uuid import UUID

class MarkBase(BaseModel):
    score: Optional[float] = None
    is_delayed: str = "no"
    is_flagged: str = "no"
    flag_reason: Optional[str] = None

class MarkCreate(MarkBase):
    student_id: UUID
    course_id: UUID
    assessment_id: UUID

class MarkUpdate(BaseModel):
    score: Optional[float] = None
    is_delayed: Optional[str] = None
    is_flagged: Optional[str] = None
    flag_reason: Optional[str] = None
    status: Optional[str] = None

class MarkResponse(MarkBase):
    id: UUID
    student_id: UUID
    course_id: UUID
    assessment_id: UUID
    status: str
    modified_at: datetime
    created_at: datetime
    
    class Config:
        from_attributes = True

class MarkDetailResponse(MarkResponse):
    student_name: str
    assessment_name: str
    max_score: float
    assessment_weight: float

class MarkPublishRequest(BaseModel):
    mark_ids: list[UUID]
    
class MarkBulkCreateRequest(BaseModel):
    assessment_id: UUID
    marks: list[dict]  # List of {student_id, score}
