"""Enrollment service"""
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from uuid import UUID
from typing import List, Optional
from ..models import Enrollment, Course, User
from ..schemas import EnrollmentCreate, EnrollmentUpdate

class EnrollmentService:
    """Service for enrollment operations"""
    
    @staticmethod
    async def create_enrollment(db: AsyncSession, enrollment_data: EnrollmentCreate) -> Enrollment:
        """Create a new enrollment"""
        db_enrollment = Enrollment(
            student_id=enrollment_data.student_id,
            course_id=enrollment_data.course_id,
            status=enrollment_data.status,
            source=enrollment_data.source,
        )
        db.add(db_enrollment)
        await db.commit()
        await db.refresh(db_enrollment)
        return db_enrollment
    
    @staticmethod
    async def get_enrollment(db: AsyncSession, enrollment_id: UUID) -> Optional[Enrollment]:
        """Get an enrollment by ID"""
        result = await db.execute(select(Enrollment).where(Enrollment.id == enrollment_id))
        return result.scalar_one_or_none()
    
    @staticmethod
    async def check_enrollment(
        db: AsyncSession,
        student_id: UUID,
        course_id: UUID,
    ) -> Optional[Enrollment]:
        """Check if student is enrolled in course"""
        result = await db.execute(
            select(Enrollment).where(
                (Enrollment.student_id == student_id) & (Enrollment.course_id == course_id)
            )
        )
        return result.scalar_one_or_none()
    
    @staticmethod
    async def list_enrollments(
        db: AsyncSession,
        course_id: Optional[UUID] = None,
        student_id: Optional[UUID] = None,
        skip: int = 0,
        limit: int = 100,
    ) -> tuple[List[Enrollment], int]:
        """List enrollments with optional filters"""
        query = select(Enrollment)
        
        if course_id:
            query = query.where(Enrollment.course_id == course_id)
        if student_id:
            query = query.where(Enrollment.student_id == student_id)
        
        # Get total count
        count_result = await db.execute(select(func.count(Enrollment.id)))
        total = count_result.scalar() or 0
        
        # Get paginated results
        result = await db.execute(query.offset(skip).limit(limit))
        enrollments = result.scalars().all()
        return enrollments, total
    
    @staticmethod
    async def get_student_courses(db: AsyncSession, student_id: UUID) -> List[Course]:
        """Get all courses a student is enrolled in"""
        result = await db.execute(
            select(Course).join(Enrollment).where(
                (Enrollment.student_id == student_id) & (Enrollment.status == "active")
            )
        )
        return result.scalars().all()
    
    @staticmethod
    async def update_enrollment(
        db: AsyncSession,
        enrollment_id: UUID,
        enrollment_data: EnrollmentUpdate,
    ) -> Optional[Enrollment]:
        """Update an enrollment"""
        enrollment = await EnrollmentService.get_enrollment(db, enrollment_id)
        if not enrollment:
            return None
        
        update_data = enrollment_data.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(enrollment, key, value)
        
        db.add(enrollment)
        await db.commit()
        await db.refresh(enrollment)
        return enrollment
    
    @staticmethod
    async def withdraw_enrollment(db: AsyncSession, enrollment_id: UUID) -> Optional[Enrollment]:
        """Withdraw an enrollment"""
        enrollment = await EnrollmentService.get_enrollment(db, enrollment_id)
        if not enrollment:
            return None
        
        enrollment.status = "withdrawn"
        from datetime import datetime
        enrollment.withdrawal_date = datetime.utcnow()
        
        db.add(enrollment)
        await db.commit()
        await db.refresh(enrollment)
        return enrollment
    
    @staticmethod
    async def get_course_enrollment_count(db: AsyncSession, course_id: UUID) -> int:
        """Get number of active enrollments for a course"""
        result = await db.execute(
            select(func.count(Enrollment.id)).where(
                (Enrollment.course_id == course_id) & (Enrollment.status == "active")
            )
        )
        return result.scalar() or 0
