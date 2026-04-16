"""Course service"""
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from uuid import UUID
from typing import List, Optional
from ..models import Course
from ..schemas import CourseCreate, CourseUpdate, CourseResponse

class CourseService:
    """Service for course operations"""
    
    @staticmethod
    async def create_course(db: AsyncSession, course_data: CourseCreate) -> Course:
        """Create a new course"""
        db_course = Course(
            code=course_data.code,
            name=course_data.name,
            section=course_data.section,
            semester=course_data.semester,
            credit_hours=course_data.credit_hours,
            lecturer_id=course_data.lecturer_id,
            coordinator_id=course_data.coordinator_id,
            start_date=course_data.start_date,
            end_date=course_data.end_date,
        )
        db.add(db_course)
        await db.commit()
        await db.refresh(db_course)
        return db_course
    
    @staticmethod
    async def get_course(db: AsyncSession, course_id: UUID) -> Optional[Course]:
        """Get a course by ID"""
        result = await db.execute(select(Course).where(Course.id == course_id))
        return result.scalar_one_or_none()
    
    @staticmethod
    async def get_course_by_code(db: AsyncSession, code: str, semester: str) -> Optional[Course]:
        """Get a course by code and semester"""
        result = await db.execute(
            select(Course).where(
                (Course.code == code) & (Course.semester == semester)
            )
        )
        return result.scalar_one_or_none()
    
    @staticmethod
    async def list_courses(
        db: AsyncSession,
        skip: int = 0,
        limit: int = 100,
        lecturer_id: Optional[UUID] = None,
        semester: Optional[str] = None,
    ) -> tuple[List[Course], int]:
        """List courses with optional filters"""
        query = select(Course)
        
        if lecturer_id:
            query = query.where(Course.lecturer_id == lecturer_id)
        if semester:
            query = query.where(Course.semester == semester)
        
        # Get total count
        count_result = await db.execute(select(func.count(Course.id)).select_from(Course))
        total = count_result.scalar() or 0
        
        # Get paginated results
        result = await db.execute(query.offset(skip).limit(limit))
        courses = result.scalars().all()
        return courses, total
    
    @staticmethod
    async def update_course(db: AsyncSession, course_id: UUID, course_data: CourseUpdate) -> Optional[Course]:
        """Update a course"""
        course = await CourseService.get_course(db, course_id)
        if not course:
            return None
        
        update_data = course_data.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(course, key, value)
        
        db.add(course)
        await db.commit()
        await db.refresh(course)
        return course
    
    @staticmethod
    async def delete_course(db: AsyncSession, course_id: UUID) -> bool:
        """Delete a course"""
        course = await CourseService.get_course(db, course_id)
        if not course:
            return False
        
        await db.delete(course)
        await db.commit()
        return True
    
    @staticmethod
    async def get_lecturer_courses(db: AsyncSession, lecturer_id: UUID) -> List[Course]:
        """Get all courses for a lecturer"""
        result = await db.execute(
            select(Course).where(Course.lecturer_id == lecturer_id)
        )
        return result.scalars().all()
