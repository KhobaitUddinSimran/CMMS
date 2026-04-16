"""Enrollment schemas"""
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from uuid import UUID

class EnrollmentBase(BaseModel):
    student_id: UUID
    course_id: UUID
    status: str = "active"
    source: str = "manual"

class EnrollmentCreate(EnrollmentBase):
    pass

class EnrollmentUpdate(BaseModel):
    status: Optional[str] = None

class EnrollmentResponse(EnrollmentBase):
    id: UUID
    enrollment_date: datetime
    withdrawal_date: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

class EnrollmentDetailResponse(EnrollmentResponse):
    student_name: str
    student_email: str
    course_code: str
    course_name: str
