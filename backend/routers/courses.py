"""Course endpoints - Supabase Edition"""
import logging
from fastapi import APIRouter, Depends, HTTPException, status, Query
from ..core.config import supabase
from ..dependencies.auth import get_current_user, has_effective_role
from ..models.user import User

router = APIRouter(prefix="/api/courses", tags=["courses"])
logger = logging.getLogger(__name__)


def _require_supabase():
    """Raise 503 if the Supabase client was not initialised (missing env vars)."""
    if supabase is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=(
                "Database service unavailable: Supabase client not initialised. "
                "Check SUPABASE_URL and SUPABASE_SERVICE_KEY environment variables."
            ),
        )


@router.get("")
async def list_courses(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    current_user: User = Depends(get_current_user),
):
    """List all courses with pagination using Supabase"""
    _require_supabase()
    try:
        logger.info(
            f"Listing courses - user: {current_user.get('user_id')}, "
            f"role: {current_user.get('role')}, skip: {skip}, limit: {limit}"
        )

        # Lecturers: scope to their own assigned courses only
        # Students: scope to their enrolled courses
        # Coordinators, HODs, admins: see all courses
        user_id = current_user.get("user_id")
        user_role = current_user.get("role", "")
        special = set(current_user.get("special_roles", []) or [])
        is_elevated = user_role in ("coordinator", "hod", "admin") or "coordinator" in special or "hod" in special
        is_student = user_role == "student"

        # Validate UUID format before hitting the DB
        import re as _re
        _UUID_RE = _re.compile(r'^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$', _re.IGNORECASE)
        if not is_elevated and not _UUID_RE.match(user_id or ""):
            logger.warning(f"Invalid UUID in JWT for user_id={user_id!r}. Token is stale — returning empty list.")
            return {"data": [], "total": 0, "skip": skip, "limit": limit}

        if is_student:
            # Fetch enrolled course IDs for this student
            enroll_resp = (
                supabase.table("enrollments")
                .select("course_id")
                .eq("student_id", user_id)
                .eq("status", "active")
                .execute()
            )
            enrolled_ids = [e["course_id"] for e in (enroll_resp.data or [])]
            if not enrolled_ids:
                return {"data": [], "total": 0, "skip": skip, "limit": limit}
            courses = (
                supabase.table("courses")
                .select("*")
                .in_("id", enrolled_ids)
                .range(skip, skip + limit - 1)
                .execute()
            ).data or []
            total = len(enrolled_ids)
        else:
            query = supabase.table("courses").select("*")
            if not is_elevated:
                query = query.eq("lecturer_id", user_id)

            # Query Supabase for courses with pagination
            response = query.range(skip, skip + limit - 1).execute()
            courses = response.data if response.data else []

            # Get total count
            count_query = supabase.table("courses").select("id", count="exact")
            if not is_elevated:
                count_query = count_query.eq("lecturer_id", user_id)
            count_response = count_query.execute()
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
    _require_supabase()
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
    _require_supabase()
    if not has_effective_role(current_user, "coordinator", "admin"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only coordinators and admins can create courses"
        )

    # Build a clean payload matched to the actual Supabase courses schema:
    # id, code, name, description, credits, lecturer_id, department_id,
    # semester, academic_year, max_students, created_at, updated_at
    payload = dict(course_data)

    # Required: code, name
    if not payload.get("code"):
        raise HTTPException(status_code=400, detail="Course code is required")
    if not payload.get("name"):
        raise HTTPException(status_code=400, detail="Course name is required")

    # Cast semester to int
    try:
        if payload.get("semester") is not None and payload.get("semester") != "":
            payload["semester"] = int(payload["semester"])
    except (ValueError, TypeError):
        raise HTTPException(status_code=400, detail="Semester must be a number")

    # Map year → academic_year ("2025" or "2025/2026" → "2025/2026")
    year_val = payload.get("year") or payload.get("academic_year")
    if year_val:
        y = str(year_val).strip()
        if "/" not in y:
            payload["academic_year"] = f"{y}/{int(y)+1}"
        else:
            payload["academic_year"] = y

    # Default credits
    if not payload.get("credits"):
        payload["credits"] = 3

    # lecturer_id — use provided value or fall back to first teaching-staff member in DB
    if not payload.get("lecturer_id"):
        try:
            lect_resp = supabase.table("users").select("id").in_("role", ["lecturer", "coordinator", "hod"]).limit(1).execute()
            if lect_resp.data:
                payload["lecturer_id"] = lect_resp.data[0]["id"]
        except Exception:
            pass

    # department_id — use provided value, else drop it (column should be nullable in DB)
    if not payload.get("department_id"):
        payload.pop("department_id", None)

    actor_id = current_user.get("user_id")

    # Strip columns that don't exist in the live schema
    for col in ["coordinator_id", "created_by", "year", "section"]:
        payload.pop(col, None)

    logger.info(f"Creating course with payload keys: {list(payload.keys())}")

    try:
        response = supabase.table("courses").insert(payload).execute()
        if not response.data:
            raise Exception("Insert returned no data")
        logger.info(f"Course created: {response.data[0].get('code')} by user {actor_id}")
        return response.data[0]
    except Exception as e:
        err_msg = str(e)
        logger.error(f"Error creating course: {err_msg}")
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
    _require_supabase()
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
    _require_supabase()
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
    _require_supabase()
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
        if lecturer.get("role") not in ["lecturer", "coordinator", "hod", "admin"]:
            raise HTTPException(status_code=400, detail="User is not a teaching staff member")

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
