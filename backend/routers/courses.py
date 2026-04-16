"""Course endpoints"""
import logging
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID
from ..db.database import get_db
from ..schemas.course import CourseCreate, CourseUpdate, CourseResponse, CourseDetailResponse
from ..services.course_service import CourseService
from ..dependencies.auth import get_current_user
from ..models.user import User

router = APIRouter(prefix="/api/courses", tags=["courses"])
logger = logging.getLogger(__name__)

@router.post("", response_model=CourseResponse, status_code=status.HTTP_201_CREATED)
async def create_course(
    course_data: CourseCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a new course - requires coordinator or admin role"""
    if current_user.role not in ["coordinator", "admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only coordinators and admins can create courses"
        )
    
    # Check if course code already exists
    existing = await CourseService.get_course_by_code(db, course_data.code, course_data.semester)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Course {course_data.code} already exists for semester {course_data.semester}"
        )
    
    try:
        course = await CourseService.create_course(db, course_data)
        return CourseResponse.model_validate(course)
    except Exception as e:
        logger.error(f"Error creating course: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create course"
        )

@router.get("/{course_id}", response_model=CourseDetailResponse)
async def get_course(
    course_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get a specific course"""
    course = await CourseService.get_course(db, course_id)
    if not course:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Course not found"
        )
    
    return CourseDetailResponse.model_validate(course)

@router.get("")
async def list_courses(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    semester: str = Query(None),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List courses with pagination"""
    lecturer_id = None
    if current_user.role == "lecturer":
        lecturer_id = current_user.id
    
    courses, total = await CourseService.list_courses(
        db,
        skip=skip,
        limit=limit,
        lecturer_id=lecturer_id,
        semester=semester,
    )
    
    return {
        "data": [CourseResponse.model_validate(c) for c in courses],
        "total": total,
        "skip": skip,
        "limit": limit,
    }

@router.put("/{course_id}", response_model=CourseResponse)
async def update_course(
    course_id: UUID,
    course_data: CourseUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update a course - requires coordinator or admin role"""
    if current_user.role not in ["coordinator", "admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only coordinators and admins can update courses"
        )
    
    course = await CourseService.get_course(db, course_id)
    if not course:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Course not found"
        )
    
    try:
        updated_course = await CourseService.update_course(db, course_id, course_data)
        return CourseResponse.model_validate(updated_course)
    except Exception as e:
        logger.error(f"Error updating course: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update course"
        )

@router.delete("/{course_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_course(
    course_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete a course - requires admin role"""
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can delete courses"
        )
    
    success = await CourseService.delete_course(db, course_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Course not found"
        )

@router.get("/lecturer/{lecturer_id}")
async def get_lecturer_courses(
    lecturer_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get all courses for a lecturer"""
    if current_user.role == "lecturer" and current_user.id != lecturer_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Can only view your own courses"
        )
    
    courses = await CourseService.get_lecturer_courses(db, lecturer_id)
    return {
        "data": [CourseResponse.model_validate(c) for c in courses],
        "count": len(courses),
    }
