"""Assessment service"""
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from uuid import UUID
from typing import List, Optional
from ..models import Assessment, Course
from ..schemas import AssessmentCreate, AssessmentUpdate

class AssessmentService:
    """Service for assessment operations"""
    
    @staticmethod
    async def create_assessment(db: AsyncSession, assessment_data: AssessmentCreate) -> Assessment:
        """Create a new assessment"""
        db_assessment = Assessment(
            course_id=assessment_data.course_id,
            name=assessment_data.name,
            assessment_type=assessment_data.assessment_type,
            max_score=assessment_data.max_score,
            weight=assessment_data.weight,
            order=assessment_data.order,
            due_date=assessment_data.due_date,
        )
        db.add(db_assessment)
        await db.commit()
        await db.refresh(db_assessment)
        return db_assessment
    
    @staticmethod
    async def get_assessment(db: AsyncSession, assessment_id: UUID) -> Optional[Assessment]:
        """Get an assessment by ID"""
        result = await db.execute(select(Assessment).where(Assessment.id == assessment_id))
        return result.scalar_one_or_none()
    
    @staticmethod
    async def list_assessments(
        db: AsyncSession,
        course_id: UUID,
        skip: int = 0,
        limit: int = 100,
    ) -> tuple[List[Assessment], int]:
        """List assessments for a course"""
        query = select(Assessment).where(Assessment.course_id == course_id)
        
        # Get total count
        count_result = await db.execute(
            select(func.count(Assessment.id)).where(Assessment.course_id == course_id)
        )
        total = count_result.scalar() or 0
        
        # Get paginated results
        result = await db.execute(query.offset(skip).limit(limit))
        assessments = result.scalars().all()
        return assessments, total
    
    @staticmethod
    async def update_assessment(
        db: AsyncSession,
        assessment_id: UUID,
        assessment_data: AssessmentUpdate,
    ) -> Optional[Assessment]:
        """Update an assessment"""
        assessment = await AssessmentService.get_assessment(db, assessment_id)
        if not assessment:
            return None
        
        update_data = assessment_data.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(assessment, key, value)
        
        db.add(assessment)
        await db.commit()
        await db.refresh(assessment)
        return assessment
    
    @staticmethod
    async def delete_assessment(db: AsyncSession, assessment_id: UUID) -> bool:
        """Delete an assessment"""
        assessment = await AssessmentService.get_assessment(db, assessment_id)
        if not assessment:
            return False
        
        await db.delete(assessment)
        await db.commit()
        return True
    
    @staticmethod
    async def publish_assessment(db: AsyncSession, assessment_id: UUID) -> Optional[Assessment]:
        """Publish an assessment"""
        assessment = await AssessmentService.get_assessment(db, assessment_id)
        if not assessment:
            return None
        
        assessment.is_published = "published"
        from datetime import datetime
        assessment.published_date = datetime.utcnow()
        
        db.add(assessment)
        await db.commit()
        await db.refresh(assessment)
        return assessment
    
    @staticmethod
    async def validate_weights(db: AsyncSession, course_id: UUID) -> bool:
        """Validate that assessment weights sum to 100%"""
        result = await db.execute(
            select(func.sum(Assessment.weight)).where(Assessment.course_id == course_id)
        )
        total_weight = result.scalar() or 0
        return 0.95 <= total_weight <= 1.05  # Allow 5% margin for floating point
