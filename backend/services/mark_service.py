"""Mark service"""
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from uuid import UUID
from typing import List, Optional
from ..models import Mark, Assessment
from ..schemas import MarkCreate, MarkUpdate
from datetime import datetime

class MarkService:
    """Service for mark operations"""
    
    @staticmethod
    async def create_mark(db: AsyncSession, mark_data: MarkCreate) -> Mark:
        """Create a new mark"""
        db_mark = Mark(
            student_id=mark_data.student_id,
            course_id=mark_data.course_id,
            assessment_id=mark_data.assessment_id,
            score=mark_data.score,
            is_delayed=mark_data.is_delayed,
            is_flagged=mark_data.is_flagged,
            flag_reason=mark_data.flag_reason,
            status="draft",
        )
        db.add(db_mark)
        await db.commit()
        await db.refresh(db_mark)
        return db_mark
    
    @staticmethod
    async def get_mark(db: AsyncSession, mark_id: UUID) -> Optional[Mark]:
        """Get a mark by ID"""
        result = await db.execute(select(Mark).where(Mark.id == mark_id))
        return result.scalar_one_or_none()
    
    @staticmethod
    async def get_student_assessment_mark(
        db: AsyncSession,
        student_id: UUID,
        assessment_id: UUID,
    ) -> Optional[Mark]:
        """Get a student's mark for an assessment"""
        result = await db.execute(
            select(Mark).where(
                (Mark.student_id == student_id) & (Mark.assessment_id == assessment_id)
            )
        )
        return result.scalar_one_or_none()
    
    @staticmethod
    async def list_marks(
        db: AsyncSession,
        assessment_id: Optional[UUID] = None,
        course_id: Optional[UUID] = None,
        student_id: Optional[UUID] = None,
        skip: int = 0,
        limit: int = 100,
    ) -> tuple[List[Mark], int]:
        """List marks with optional filters"""
        query = select(Mark)
        
        if assessment_id:
            query = query.where(Mark.assessment_id == assessment_id)
        if course_id:
            query = query.where(Mark.course_id == course_id)
        if student_id:
            query = query.where(Mark.student_id == student_id)
        
        # Get total count
        count_result = await db.execute(select(func.count(Mark.id)))
        total = count_result.scalar() or 0
        
        # Get paginated results
        result = await db.execute(query.offset(skip).limit(limit))
        marks = result.scalars().all()
        return marks, total
    
    @staticmethod
    async def update_mark(
        db: AsyncSession,
        mark_id: UUID,
        mark_data: MarkUpdate,
        modified_by: UUID,
    ) -> Optional[Mark]:
        """Update a mark"""
        mark = await MarkService.get_mark(db, mark_id)
        if not mark:
            return None
        
        # Cannot update published marks
        if mark.status == "published":
            return None
        
        update_data = mark_data.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(mark, key, value)
        
        mark.modified_by = modified_by
        mark.modified_at = datetime.utcnow()
        
        db.add(mark)
        await db.commit()
        await db.refresh(mark)
        return mark
    
    @staticmethod
    async def publish_marks(
        db: AsyncSession,
        mark_ids: List[UUID],
    ) -> int:
        """Publish multiple marks"""
        result = await db.execute(select(Mark).where(Mark.id.in_(mark_ids)))
        marks = result.scalars().all()
        
        count = 0
        for mark in marks:
            if mark.status == "draft":
                mark.status = "published"
                count += 1
        
        await db.commit()
        return count
    
    @staticmethod
    async def flag_mark(
        db: AsyncSession,
        mark_id: UUID,
        reason: str,
    ) -> Optional[Mark]:
        """Flag a mark for review"""
        mark = await MarkService.get_mark(db, mark_id)
        if not mark:
            return None
        
        mark.is_flagged = "yes"
        mark.flag_reason = reason
        db.add(mark)
        await db.commit()
        await db.refresh(mark)
        return mark
    
    @staticmethod
    async def get_student_course_marks(
        db: AsyncSession,
        student_id: UUID,
        course_id: UUID,
    ) -> List[Mark]:
        """Get all marks for a student in a course"""
        result = await db.execute(
            select(Mark).where(
                (Mark.student_id == student_id) & (Mark.course_id == course_id)
            )
        )
        return result.scalars().all()
    
    @staticmethod
    async def calculate_course_grade(
        db: AsyncSession,
        student_id: UUID,
        course_id: UUID,
    ) -> Optional[float]:
        """Calculate final grade for student in course"""
        # Get all published marks for this student and course
        result = await db.execute(
            select(Mark, Assessment.weight, Assessment.max_score).join(Assessment).where(
                (Mark.student_id == student_id)
                & (Mark.course_id == course_id)
                & (Mark.status == "published")
                & (Mark.score.isnot(None))
            )
        )
        
        marks_data = result.all()
        if not marks_data:
            return None
        
        total_grade = 0.0
        for mark, weight, max_score in marks_data:
            # Normalize score to 100
            normalized_score = (mark.score / max_score) * 100 if max_score > 0 else 0
            total_grade += normalized_score * weight
        
        return round(total_grade, 2)
