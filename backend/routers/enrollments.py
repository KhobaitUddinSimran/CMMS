"""Enrollment endpoints"""
import logging
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID
from ..db.database import get_db
from ..schemas.enrollment import EnrollmentCreate, EnrollmentUpdate, EnrollmentResponse, EnrollmentDetailResponse
from ..services.enrollment_service import EnrollmentService
from ..services.course_service import CourseService
from ..dependencies.auth import get_current_user
from ..models.user import User

router = APIRouter(prefix="/api/enrollments", tags=["enrollments"])
logger = logging.getLogger(__name__)

@router.post("", response_model=EnrollmentResponse, status_code=status.HTTP_201_CREATED)
async def create_enrollment(
    enrollment_data: EnrollmentCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a new enrollment - requires lecturer, coordinator, or admin role"""
    if current_user.get("role") not in ["lecturer", "coordinator", "admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only lecturers, coordinators, and admins can create enrollments"
        )
    
    # Check if already enrolled
    existing = await EnrollmentService.check_enrollment(
        db,
        enrollment_data.student_id,
        enrollment_data.course_id,
    )
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Student is already enrolled in this course"
        )
    
    try:
        enrollment = await EnrollmentService.create_enrollment(db, enrollment_data)
        return EnrollmentResponse.model_validate(enrollment)
    except Exception as e:
        logger.error(f"Error creating enrollment for student {enrollment_data.student_id}: {type(e).__name__}: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create enrollment"
        )

@router.get("/{enrollment_id}", response_model=EnrollmentDetailResponse)
async def get_enrollment(
    enrollment_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get a specific enrollment"""
    enrollment = await EnrollmentService.get_enrollment(db, enrollment_id)
    if not enrollment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Enrollment not found"
        )
    
    return EnrollmentDetailResponse.model_validate(enrollment)

@router.get("/course/{course_id}")
async def list_course_enrollments(
    course_id: UUID,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List enrollments for a course"""
    course = await CourseService.get_course(db, course_id)
    if not course:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Course not found"
        )
    
    # Verify user has access
    if current_user.get("role") == "lecturer" and course.lecturer_id != UUID(current_user.get("user_id")):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have access to this course"
        )
    
    enrollments, total = await EnrollmentService.list_enrollments(
        db,
        course_id=course_id,
        skip=skip,
        limit=limit,
    )
    
    return {
        "data": [EnrollmentResponse.model_validate(e) for e in enrollments],
        "total": total,
        "skip": skip,
        "limit": limit,
    }

@router.get("/student/{student_id}")
async def get_student_courses(
    student_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get all courses for a student"""
    if current_user.get("role") == "student" and current_user.get("user_id") != str(student_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Can only view your own courses"
        )
    
    courses = await EnrollmentService.get_student_courses(db, student_id)
    return {
        "data": courses,
        "count": len(courses),
    }

@router.put("/{enrollment_id}", response_model=EnrollmentResponse)
async def update_enrollment(
    enrollment_id: UUID,
    enrollment_data: EnrollmentUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update an enrollment - requires lecturer, coordinator, or admin role"""
    if current_user.get("role") not in ["lecturer", "coordinator", "admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only lecturers, coordinators, and admins can update enrollments"
        )
    
    enrollment = await EnrollmentService.get_enrollment(db, enrollment_id)
    if not enrollment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Enrollment not found"
        )
    
    try:
        updated_enrollment = await EnrollmentService.update_enrollment(db, enrollment_id, enrollment_data)
        return EnrollmentResponse.model_validate(updated_enrollment)
    except Exception as e:
        logger.error(f"Error updating enrollment {enrollment_id}: {type(e).__name__}: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update enrollment"
        )

@router.post("/{enrollment_id}/withdraw", response_model=EnrollmentResponse)
async def withdraw_enrollment(
    enrollment_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Withdraw an enrollment"""
    enrollment = await EnrollmentService.get_enrollment(db, enrollment_id)
    if not enrollment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Enrollment not found"
        )
    
    # Students can withdraw themselves, lecturers/admins can withdraw anyone
    if current_user.get("role") == "student" and current_user.get("user_id") != str(enrollment.student_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Can only withdraw your own enrollment"
        )
    
    try:
        updated_enrollment = await EnrollmentService.withdraw_enrollment(db, enrollment_id)
        return EnrollmentResponse.model_validate(updated_enrollment)
    except Exception as e:
        logger.error(f"Error withdrawing enrollment {enrollment_id}: {type(e).__name__}: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to withdraw enrollment"
        )
