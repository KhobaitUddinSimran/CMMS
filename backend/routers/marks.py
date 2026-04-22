"""Mark endpoints"""
import logging
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID
from ..db.database import get_db
from ..schemas.mark import (
    MarkCreate,
    MarkUpdate,
    MarkResponse,
    MarkDetailResponse,
    MarkPublishRequest,
    MarkBulkCreateRequest,
)
from ..services.mark_service import MarkService
from ..services.assessment_service import AssessmentService
from ..services.course_service import CourseService
from ..dependencies.auth import get_current_user
from ..models.user import User

router = APIRouter(prefix="/api/marks", tags=["marks"])
logger = logging.getLogger(__name__)

@router.post("", response_model=MarkResponse, status_code=status.HTTP_201_CREATED)
async def create_mark(
    mark_data: MarkCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a new mark - requires lecturer or admin role"""
    if current_user.get("role") not in ["lecturer", "admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only lecturers and admins can create marks"
        )
    
    # Verify assessment exists
    assessment = await AssessmentService.get_assessment(db, mark_data.assessment_id)
    if not assessment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Assessment not found"
        )
    
    # Verify lecturer is assigned to this course
    if current_user.get("role") == "lecturer":
        course = await CourseService.get_course(db, assessment.course_id)
        if course.lecturer_id != UUID(current_user.get("user_id")):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You are not assigned to this course"
            )
    
    try:
        mark = await MarkService.create_mark(db, mark_data)
        return MarkResponse.model_validate(mark)
    except Exception as e:
        logger.error(f"Error creating mark for assessment {mark_data.assessment_id}: {type(e).__name__}: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create mark"
        )

@router.get("/{mark_id}", response_model=MarkDetailResponse)
async def get_mark(
    mark_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get a specific mark"""
    mark = await MarkService.get_mark(db, mark_id)
    if not mark:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Mark not found"
        )
    
    # Students can only view their own marks
    if current_user.get("role") == "student" and mark.student_id != UUID(current_user.get("user_id")):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cannot view other student's marks"
        )
    
    return MarkDetailResponse.model_validate(mark)

@router.get("/assessment/{assessment_id}")
async def list_assessment_marks(
    assessment_id: UUID,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List marks for an assessment"""
    assessment = await AssessmentService.get_assessment(db, assessment_id)
    if not assessment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Assessment not found"
        )
    
    # Verify access
    if current_user.get("role") == "lecturer":
        course = await CourseService.get_course(db, assessment.course_id)
        if course.lecturer_id != UUID(current_user.get("user_id")):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have access to this assessment"
            )
    elif current_user.get("role") == "student":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Students cannot view all marks for an assessment"
        )
    
    marks, total = await MarkService.list_marks(
        db,
        assessment_id=assessment_id,
        skip=skip,
        limit=limit,
    )
    
    return {
        "data": [MarkResponse.model_validate(m) for m in marks],
        "total": total,
        "skip": skip,
        "limit": limit,
    }

@router.get("/course/{course_id}/student/{student_id}")
async def get_student_course_marks(
    course_id: UUID,
    student_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get all marks for a student in a course"""
    # Students can only view their own marks
    if current_user.get("role") == "student" and current_user.get("user_id") != str(student_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cannot view other student's marks"
        )
    
    # Verify course exists
    course = await CourseService.get_course(db, course_id)
    if not course:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Course not found"
        )
    
    # Lecturers can only view marks for their own courses
    if current_user.get("role") == "lecturer" and course.lecturer_id != UUID(current_user.get("user_id")):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have access to this course"
        )
    
    marks = await MarkService.get_student_course_marks(db, student_id, course_id)
    return {
        "data": [MarkResponse.model_validate(m) for m in marks],
        "count": len(marks),
    }

@router.put("/{mark_id}", response_model=MarkResponse)
async def update_mark(
    mark_id: UUID,
    mark_data: MarkUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update a mark - requires lecturer or admin role"""
    if current_user.get("role") not in ["lecturer", "admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only lecturers and admins can update marks"
        )
    
    mark = await MarkService.get_mark(db, mark_id)
    if not mark:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Mark not found"
        )
    
    # Verify lecturer is assigned to the course
    if current_user.get("role") == "lecturer":
        course = await CourseService.get_course(db, mark.course_id)
        if course.lecturer_id != UUID(current_user.get("user_id")):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You are not assigned to this course"
            )
    
    try:
        updated_mark = await MarkService.update_mark(db, mark_id, mark_data, UUID(current_user.get("user_id")))
        if updated_mark is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot update published marks"
            )
        return MarkResponse.model_validate(updated_mark)
    except Exception as e:
        logger.error(f"Error updating mark {mark_id}: {type(e).__name__}: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update mark"
        )

@router.post("/publish", status_code=status.HTTP_200_OK)
async def publish_marks(
    request: MarkPublishRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Publish multiple marks - requires lecturer or admin role"""
    if current_user.get("role") not in ["lecturer", "admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only lecturers and admins can publish marks"
        )
    
    try:
        count = await MarkService.publish_marks(db, request.mark_ids)
        return {
            "message": f"Published {count} marks",
            "count": count,
        }
    except Exception as e:
        logger.error(f"Error publishing {len(request.mark_ids)} marks: {type(e).__name__}: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to publish marks"
        )

@router.post("/{mark_id}/flag")
async def flag_mark(
    mark_id: UUID,
    reason: str = Query(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Flag a mark for review"""
    if current_user.get("role") not in ["lecturer", "admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only lecturers and admins can flag marks"
        )
    
    mark = await MarkService.get_mark(db, mark_id)
    if not mark:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Mark not found"
        )
    
    try:
        updated_mark = await MarkService.flag_mark(db, mark_id, reason)
        return MarkResponse.model_validate(updated_mark)
    except Exception as e:
        logger.error(f"Error flagging mark {mark_id}: {type(e).__name__}: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to flag mark"
        )

@router.get("/course/{course_id}/student/{student_id}/grade")
async def get_student_course_grade(
    course_id: UUID,
    student_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get final grade for a student in a course"""
    # Students can only view their own grades
    if current_user.get("role") == "student" and current_user.get("user_id") != str(student_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cannot view other student's grades"
        )
    
    try:
        grade = await MarkService.calculate_course_grade(db, student_id, course_id)
        return {
            "student_id": student_id,
            "course_id": course_id,
            "grade": grade,
        }
    except Exception as e:
        logger.error(f"Error calculating grade for student {student_id} in course {course_id}: {type(e).__name__}: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to calculate grade"
        )
