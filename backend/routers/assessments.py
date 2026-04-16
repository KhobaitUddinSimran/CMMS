"""Assessment endpoints"""
import logging
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID
from ..db.database import get_db
from ..schemas.assessment import AssessmentCreate, AssessmentUpdate, AssessmentResponse, AssessmentDetailResponse
from ..services.assessment_service import AssessmentService
from ..services.course_service import CourseService
from ..dependencies.auth import get_current_user
from ..models.user import User

router = APIRouter(prefix="/api/assessments", tags=["assessments"])
logger = logging.getLogger(__name__)

@router.post("", response_model=AssessmentResponse, status_code=status.HTTP_201_CREATED)
async def create_assessment(
    assessment_data: AssessmentCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a new assessment - requires lecturer or admin role"""
    if current_user.role not in ["lecturer", "admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only lecturers and admins can create assessments"
        )
    
    # Verify course exists
    course = await CourseService.get_course(db, assessment_data.course_id)
    if not course:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Course not found"
        )
    
    # Verify lecturer is assigned to this course
    if current_user.role == "lecturer" and course.lecturer_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not assigned to this course"
        )
    
    try:
        assessment = await AssessmentService.create_assessment(db, assessment_data)
        return AssessmentResponse.model_validate(assessment)
    except Exception as e:
        logger.error(f"Error creating assessment: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create assessment"
        )

@router.get("/{assessment_id}", response_model=AssessmentDetailResponse)
async def get_assessment(
    assessment_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get a specific assessment"""
    assessment = await AssessmentService.get_assessment(db, assessment_id)
    if not assessment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Assessment not found"
        )
    
    return AssessmentDetailResponse.model_validate(assessment)

@router.get("/course/{course_id}")
async def list_course_assessments(
    course_id: UUID,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List assessments for a course"""
    course = await CourseService.get_course(db, course_id)
    if not course:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Course not found"
        )
    
    assessments, total = await AssessmentService.list_assessments(
        db,
        course_id=course_id,
        skip=skip,
        limit=limit,
    )
    
    return {
        "data": [AssessmentResponse.model_validate(a) for a in assessments],
        "total": total,
        "skip": skip,
        "limit": limit,
    }

@router.put("/{assessment_id}", response_model=AssessmentResponse)
async def update_assessment(
    assessment_id: UUID,
    assessment_data: AssessmentUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update an assessment - requires lecturer or admin role"""
    if current_user.role not in ["lecturer", "admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only lecturers and admins can update assessments"
        )
    
    assessment = await AssessmentService.get_assessment(db, assessment_id)
    if not assessment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Assessment not found"
        )
    
    # Verify lecturer is assigned to the course
    if current_user.role == "lecturer":
        course = await CourseService.get_course(db, assessment.course_id)
        if course.lecturer_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You are not assigned to this course"
            )
    
    try:
        updated_assessment = await AssessmentService.update_assessment(db, assessment_id, assessment_data)
        return AssessmentResponse.model_validate(updated_assessment)
    except Exception as e:
        logger.error(f"Error updating assessment: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update assessment"
        )

@router.delete("/{assessment_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_assessment(
    assessment_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete an assessment - requires admin role"""
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can delete assessments"
        )
    
    success = await AssessmentService.delete_assessment(db, assessment_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Assessment not found"
        )

@router.post("/{assessment_id}/publish", response_model=AssessmentResponse)
async def publish_assessment(
    assessment_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Publish an assessment - requires lecturer or admin role"""
    if current_user.role not in ["lecturer", "admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only lecturers and admins can publish assessments"
        )
    
    assessment = await AssessmentService.get_assessment(db, assessment_id)
    if not assessment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Assessment not found"
        )
    
    # Verify weights sum to 100%
    if not await AssessmentService.validate_weights(db, assessment.course_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Assessment weights do not sum to 100%"
        )
    
    try:
        updated_assessment = await AssessmentService.publish_assessment(db, assessment_id)
        return AssessmentResponse.model_validate(updated_assessment)
    except Exception as e:
        logger.error(f"Error publishing assessment: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to publish assessment"
        )
