"""Course endpoints - Supabase Edition"""
import logging
from fastapi import APIRouter, Depends, HTTPException, status, Query
from ..core.config import supabase
from ..dependencies.auth import get_current_user
from ..models.user import User

router = APIRouter(prefix="/api/courses", tags=["courses"])
logger = logging.getLogger(__name__)


@router.get("")
async def list_courses(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    current_user: User = Depends(get_current_user),
):
    """List all courses with pagination using Supabase"""
    try:
        logger.info(
            f"Listing courses - user: {current_user.get('user_id')}, "
            f"role: {current_user.get('role')}, skip: {skip}, limit: {limit}"
        )

        # Query Supabase for courses with pagination
        response = supabase.table("courses").select("*").range(skip, skip + limit - 1).execute()

        courses = response.data if response.data else []

        # Get total count
        count_response = supabase.table("courses").select("id", count="exact").execute()
        total = count_response.count if hasattr(count_response, "count") else 0

        logger.info(f"Successfully retrieved {len(courses)} courses out of {total} total")

        return {
            "data": courses,
            "total": total,
            "skip": skip,
            "limit": limit,
        }
    except Exception as e:
        logger.error(f"Error listing courses: {type(e).__name__}: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to list courses: {str(e)}"
        )


@router.get("/{course_id}")
async def get_course(
    course_id: str,
    current_user: User = Depends(get_current_user),
):
    """Get a specific course by ID"""
    try:
        response = supabase.table("courses").select("*").eq("id", course_id).execute()

        if not response.data or len(response.data) == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Course not found"
            )

        return response.data[0]
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting course {course_id}: {type(e).__name__}: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get course"
        )


@router.post("")
async def create_course(
    course_data: dict,
    current_user: User = Depends(get_current_user),
):
    """Create a new course - requires coordinator or admin role"""
    if current_user.get("role") not in ["coordinator", "admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only coordinators and admins can create courses"
        )

    try:
        response = supabase.table("courses").insert(course_data).execute()

        if not response.data:
            raise Exception("Failed to create course")

        logger.info(f"Course created: {response.data[0]['code']} by user {current_user.get('user_id')}")
        return response.data[0]
    except Exception as e:
        logger.error(f"Error creating course: {type(e).__name__}: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create course"
        )


@router.put("/{course_id}")
async def update_course(
    course_id: str,
    course_data: dict,
    current_user: User = Depends(get_current_user),
):
    """Update a course - requires coordinator or admin role"""
    if current_user.get("role") not in ["coordinator", "admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only coordinators and admins can update courses"
        )

    try:
        response = supabase.table("courses").update(course_data).eq("id", course_id).execute()

        if not response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Course not found"
            )

        logger.info(f"Course updated: {course_id}")
        return response.data[0]
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating course {course_id}: {type(e).__name__}: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update course"
        )


@router.delete("/{course_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_course(
    course_id: str,
    current_user: User = Depends(get_current_user),
):
    """Delete a course - requires admin role"""
    if current_user.get("role") != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can delete courses"
        )

    try:
        supabase.table("courses").delete().eq("id", course_id).execute()
        logger.info(f"Course deleted: {course_id}")
        return None
    except Exception as e:
        logger.error(f"Error deleting course {course_id}: {type(e).__name__}: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete course"
        )
