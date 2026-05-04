"""Course endpoints - Supabase Edition"""
import logging
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import Optional
from ..core.config import supabase
from ..dependencies.auth import get_current_user, has_effective_role
from ..models.user import User
from ..services.audit_service import AuditService

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

            # Fix #13: count reflects real filter (archived courses excluded)
            count_resp = (
                supabase.table("courses")
                .select("id", count="exact")
                .in_("id", enrolled_ids)
                .is_("archived_at", "null")
                .execute()
            )
            total = count_resp.count or len(enrolled_ids)

            courses = (
                supabase.table("courses")
                .select("*")
                .in_("id", enrolled_ids)
                .is_("archived_at", "null")
                .range(skip, skip + limit - 1)
                .execute()
            ).data or []
        else:
            # Exclude archived courses from default listing
            query = supabase.table("courses").select("*").is_("archived_at", "null")
            if not is_elevated:
                query = query.eq("lecturer_id", user_id)

            # Query Supabase for courses with pagination
            response = query.range(skip, skip + limit - 1).execute()
            courses = response.data if response.data else []

            # Get total count
            count_query = supabase.table("courses").select("id", count="exact").is_("archived_at", "null")
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
            detail="Failed to list courses"
        )


@router.get("/lecturer-workloads")
async def get_lecturer_workloads(
    semester: Optional[str] = Query(None),
    academic_year: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user),
):
    """Return current credit load per lecturer for a given semester/academic_year.
    Cap is per-lecturer (`users.max_credits`, default 9)."""
    _require_supabase()
    if not has_effective_role(current_user, "coordinator", "hod", "admin"):
        raise HTTPException(status_code=403, detail="Insufficient permissions")

    try:
        query = supabase.table("courses").select("id, lecturer_id, credits, semester, academic_year").is_("archived_at", "null")
        if semester is not None and semester != "":
            try:
                query = query.eq("semester", int(semester))
            except (ValueError, TypeError):
                query = query.eq("semester", semester)
        if academic_year:
            query = query.eq("academic_year", academic_year)

        courses_data = (query.execute()).data or []

        workload: dict = {}
        for c in courses_data:
            lid = c.get("lecturer_id")
            if not lid:
                continue
            workload[lid] = workload.get(lid, 0.0) + float(c.get("credits") or 0)

        # Always include every teaching staff member (even with 0 load) so the
        # UI workload list isn't empty at semester start.
        staff_resp = (
            supabase.table("users")
            .select("id, full_name, email, role, special_roles, max_credits")
            .in_("role", ["lecturer", "coordinator", "hod"])
            .execute()
        )
        staff = staff_resp.data or []
        # merge load for lecturers not returned above (shouldn't happen but safe)
        for lid in list(workload.keys()):
            if not any(s["id"] == lid for s in staff):
                staff.append({"id": lid, "full_name": "", "email": "", "max_credits": 9})

        result = []
        for s in staff:
            used = workload.get(s["id"], 0.0)
            cap = float(s.get("max_credits") or 9)
            result.append({
                "lecturer_id": s["id"],
                "full_name": s.get("full_name", ""),
                "email": s.get("email", ""),
                "used_credits": round(used, 1),
                "max_credits": cap,
                "remaining_credits": round(max(0.0, cap - used), 1),
                "is_full": used >= cap,
            })
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting lecturer workloads: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to get lecturer workloads")


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

    # lecturer_id — keep NULL if not provided. Courses without an owner
    # show up in Course Management as "Unassigned" so a coordinator can
    # assign a real lecturer instead of the first random teaching-staff row.
    if not payload.get("lecturer_id"):
        payload["lecturer_id"] = None

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
        created = response.data[0]
        logger.info(f"Course created: {created.get('code')} by user {actor_id}")
        AuditService.log(
            "COURSE_CREATED", actor_id, created.get("id"),
            metadata={"code": created.get("code"), "name": created.get("name"), "credits": created.get("credits")},
        )
        return created
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
        # Snapshot old values for audit diff
        old_resp = supabase.table("courses").select("*").eq("id", course_id).execute()
        old_vals = old_resp.data[0] if old_resp.data else None

        response = supabase.table("courses").update(course_data).eq("id", course_id).execute()

        if not response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Course not found"
            )

        logger.info(f"Course updated: {course_id}")
        AuditService.log(
            "COURSE_UPDATED", current_user.get("user_id"), course_id,
            metadata={"old": {k: old_vals.get(k) for k in course_data.keys()} if old_vals else {}, "new": course_data},
        )
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
    force: bool = Query(False, description="Admin override — only permitted when no assessments/marks exist"),
    current_user: User = Depends(get_current_user),
):
    """Delete a course (admin only). Refuses when academic records exist;
    use POST /{course_id}/archive instead to preserve grade history."""
    _require_supabase()
    if current_user.get("role") != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can delete courses"
        )

    try:
        # Refuse hard-delete if any academic data exists — grades are legally
        # required to be retained. Coordinators should archive instead.
        a_resp = supabase.table("assessments").select("id", count="exact").eq("course_id", course_id).limit(1).execute()
        if (a_resp.count or 0) > 0:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Course has assessments/marks and cannot be deleted. Use archive instead to preserve records.",
            )
        e_resp = supabase.table("enrollments").select("id", count="exact").eq("course_id", course_id).limit(1).execute()
        if (e_resp.count or 0) > 0:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Course has enrolments and cannot be deleted. Use archive instead.",
            )

        supabase.table("courses").delete().eq("id", course_id).execute()
        logger.info(f"Course deleted: {course_id}")
        AuditService.log("COURSE_DELETED", current_user.get("user_id"), course_id)
        return None
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting course {course_id}: {type(e).__name__}: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete course"
        )


@router.post("/{course_id}/archive")
async def archive_course(
    course_id: str,
    current_user: User = Depends(get_current_user),
):
    """Archive a course — hides it from active listings while preserving all
    enrolments, assessments and marks. Reversible via unarchive."""
    _require_supabase()
    if not has_effective_role(current_user, "coordinator", "hod", "admin"):
        raise HTTPException(status_code=403, detail="Only coordinators/HODs/admins can archive courses")

    try:
        resp = (
            supabase.table("courses")
            .update({
                "archived_at": datetime.utcnow().isoformat(),
                "archived_by": current_user.get("user_id"),
            })
            .eq("id", course_id)
            .execute()
        )
        if not resp.data:
            raise HTTPException(status_code=404, detail="Course not found")
        AuditService.log("COURSE_ARCHIVED", current_user.get("user_id"), course_id)
        return resp.data[0]
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error archiving course {course_id}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to archive course")


@router.post("/{course_id}/unarchive")
async def unarchive_course(
    course_id: str,
    current_user: User = Depends(get_current_user),
):
    """Restore an archived course to active status."""
    _require_supabase()
    if not has_effective_role(current_user, "coordinator", "hod", "admin"):
        raise HTTPException(status_code=403, detail="Only coordinators/HODs/admins can unarchive courses")

    try:
        resp = (
            supabase.table("courses")
            .update({"archived_at": None, "archived_by": None})
            .eq("id", course_id)
            .execute()
        )
        if not resp.data:
            raise HTTPException(status_code=404, detail="Course not found")
        AuditService.log("COURSE_UNARCHIVED", current_user.get("user_id"), course_id)
        return resp.data[0]
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error unarchiving course {course_id}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to unarchive course")


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

        # Enforce per-lecturer credit cap (users.max_credits; default 9)
        course = course_resp.data[0]
        override = bool(data.get("override")) and has_effective_role(current_user, "hod", "admin")
        override_reason = (data.get("override_reason") or "").strip()
        if course.get("lecturer_id") != lecturer_id:
            course_credits = float(course.get("credits") or 0)
            cap = float(lecturer.get("max_credits") or 9)
            existing_resp = (
                supabase.table("courses")
                .select("credits")
                .eq("lecturer_id", lecturer_id)
                .eq("semester", course.get("semester"))
                .eq("academic_year", course.get("academic_year"))
                .is_("archived_at", "null")
                .neq("id", course_id)
                .execute()
            )
            used_credits = sum(float(c.get("credits") or 0) for c in (existing_resp.data or []))
            if used_credits + course_credits > cap and not override:
                remaining = max(0, cap - used_credits)
                raise HTTPException(
                    status_code=400,
                    detail=(
                        f"Credit limit exceeded: {lecturer.get('full_name', 'This lecturer')} already has "
                        f"{used_credits:.0f} credit(s) this semester. "
                        f"Adding {course_credits:.0f} credit(s) would exceed their {cap:.0f}-credit cap. "
                        f"Remaining capacity: {remaining:.0f} credit(s). An HOD or admin can override with a reason."
                    ),
                )
            if override and used_credits + course_credits > cap and not override_reason:
                raise HTTPException(status_code=400, detail="override_reason is required when overriding the credit cap")

        # Update course
        old_lecturer_id = course.get("lecturer_id")
        resp = supabase.table("courses").update({"lecturer_id": lecturer_id}).eq("id", course_id).execute()
        if not resp.data:
            raise HTTPException(status_code=500, detail="Failed to assign lecturer")

        logger.info(f"Lecturer {lecturer_id} assigned to course {course_id} by {current_user.get('user_id')}")
        AuditService.log(
            "LECTURER_ASSIGNED", current_user.get("user_id"), course_id,
            metadata={
                "old_lecturer_id": old_lecturer_id,
                "new_lecturer_id": lecturer_id,
                "override": override,
                "override_reason": override_reason or None,
            },
        )
        return resp.data[0]

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error assigning lecturer to course {course_id}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to assign lecturer")
