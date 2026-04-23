"""Course endpoints - Supabase Edition"""
import logging
from fastapi import APIRouter, Depends, HTTPException, status, Query
from ..core.config import supabase
from ..dependencies.auth import get_current_user, has_effective_role
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
    if not has_effective_role(current_user, "coordinator", "admin"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only coordinators and admins can create courses"
        )

    # Normalize payload for Supabase courses schema.
    # Works with both the original schema (academic_year) and migration 002 (year).
    payload = dict(course_data)

    # Required: code, name
    if not payload.get("code"):
        raise HTTPException(status_code=400, detail="Course code is required")
    if not payload.get("name"):
        raise HTTPException(status_code=400, detail="Course name is required")

    # Cast semester to int (DB expects INTEGER)
    try:
        if payload.get("semester") is not None and payload.get("semester") != "":
            payload["semester"] = int(payload["semester"])
    except (ValueError, TypeError):
        raise HTTPException(status_code=400, detail="Semester must be a number")

    # Mirror year ↔ academic_year so inserts work regardless of migration state
    year_val = payload.get("year") or payload.get("academic_year")
    if year_val:
        payload["academic_year"] = year_val
        payload["year"] = year_val

    # Default credits
    if not payload.get("credits"):
        payload["credits"] = 3

    # Default section
    if not payload.get("section"):
        payload["section"] = "01"

    actor_id = current_user.get("user_id")

    # Remove fields that may not exist in the live schema
    payload.pop("coordinator_id", None)
    payload.pop("created_by", None)  # column may not exist pre-migration-002

    logger.info(f"Creating course with normalized payload keys: {list(payload.keys())}")

    # Resilient insert: on "column not found" errors, strip that column and retry.
    # Handles schemas where migration 002 has not been applied yet.
    import re
    last_err = None
    for _ in range(6):
        try:
            response = supabase.table("courses").insert(payload).execute()
            if not response.data:
                raise Exception("Insert returned no data")
            logger.info(f"Course created: {response.data[0].get('code')} by user {actor_id}")
            return response.data[0]
        except Exception as e:
            last_err = e
            msg = str(e)
            # Parse missing column name from Supabase PGRST204 error
            m = re.search(r"Could not find the '([^']+)' column", msg)
            if m:
                missing = m.group(1)
                if missing in payload:
                    logger.warning(f"Dropping unknown column '{missing}' and retrying")
                    payload.pop(missing, None)
                    continue
            break

    err_msg = str(last_err) if last_err else "Unknown error"
    logger.error(f"Error creating course after retries: {err_msg}")
    raise HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST,
        detail=f"Failed to create course: {err_msg}"
    )


@router.put("/{course_id}")
async def update_course(
    course_id: str,
    course_data: dict,
    current_user: User = Depends(get_current_user),
):
    """Update a course - requires coordinator or admin role"""
    if not has_effective_role(current_user, "coordinator", "admin"):
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


@router.post("/{course_id}/lecturer")
async def assign_lecturer(
    course_id: str,
    data: dict,
    current_user: User = Depends(get_current_user),
):
    """Assign a lecturer to a course - requires coordinator or admin role"""
    if not has_effective_role(current_user, "coordinator", "admin"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only coordinators and admins can assign lecturers"
        )

    lecturer_id = data.get("lecturer_id")
    if not lecturer_id:
        raise HTTPException(status_code=400, detail="lecturer_id is required")

    try:
        # Verify course exists
        course_resp = supabase.table("courses").select("*").eq("id", course_id).execute()
        if not course_resp.data:
            raise HTTPException(status_code=404, detail="Course not found")

        # Verify lecturer exists and has lecturer role
        lecturer_resp = supabase.table("users").select("*").eq("id", lecturer_id).execute()
        if not lecturer_resp.data:
            raise HTTPException(status_code=404, detail="Lecturer not found")

        lecturer = lecturer_resp.data[0]
        if lecturer.get("role") not in ["lecturer", "admin"]:
            raise HTTPException(status_code=400, detail="User is not a lecturer")

        # Update course
        resp = supabase.table("courses").update({"lecturer_id": lecturer_id}).eq("id", course_id).execute()
        if not resp.data:
            raise HTTPException(status_code=500, detail="Failed to assign lecturer")

        logger.info(f"Lecturer {lecturer_id} assigned to course {course_id} by {current_user.get('user_id')}")
        return resp.data[0]

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error assigning lecturer to course {course_id}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to assign lecturer")
