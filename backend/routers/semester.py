"""Semester timeline endpoints — coursework deadlines only (coordinator/lecturer/admin)"""
import asyncio
import logging
from fastapi import APIRouter, Depends, HTTPException, status
from core.config import supabase
from dependencies.auth import get_current_user, has_effective_role
from models.user import User
from services.email_service import EmailService

router = APIRouter(prefix="/api/semester-timelines", tags=["semester-timelines"])
logger = logging.getLogger(__name__)


def _require_supabase():
    if supabase is None:
        raise HTTPException(status_code=503, detail="Database unavailable")


@router.get("")
async def list_timelines(current_user: User = Depends(get_current_user)):
    """Return all configured semester timelines, newest first."""
    _require_supabase()
    resp = (
        supabase.table("semester_timelines")
        .select("*")
        .order("academic_year", desc=True)
        .order("semester", desc=True)
        .execute()
    )
    return resp.data or []


@router.post("", status_code=201)
async def upsert_timeline(data: dict, current_user: User = Depends(get_current_user)):
    """Create or update a semester timeline (upserts on academic_year + semester).
    Semesters 1–3 are supported. The timeline is linked to an academic_year record
    if academic_year_id is provided or can be resolved from the academic_year name."""
    _require_supabase()
    if not has_effective_role(current_user, "coordinator", "hod", "admin"):
        raise HTTPException(status_code=403, detail="Only coordinators, HODs, and admins can manage timelines")

    required = ("academic_year", "semester", "start_date", "end_date")
    for field in required:
        if not data.get(field):
            raise HTTPException(status_code=400, detail=f"{field} is required")

    sem_num = int(data["semester"])
    if sem_num not in (1, 2, 3):
        raise HTTPException(status_code=400, detail="Semester must be 1, 2, or 3")

    payload = {
        "academic_year": data["academic_year"],
        "semester": sem_num,
        "start_date": data["start_date"],
        "end_date": data["end_date"],
        "grade_submission_deadline": data.get("grade_submission_deadline") or None,
        "notes": data.get("notes") or None,
    }

    # Resolve academic_year_id: prefer explicit id, else look up by name
    ay_id = data.get("academic_year_id")
    if not ay_id:
        ay_resp = (
            supabase.table("academic_years")
            .select("id")
            .eq("name", data["academic_year"])
            .limit(1)
            .execute()
        )
        if ay_resp.data:
            ay_id = ay_resp.data[0]["id"]
    if ay_id:
        payload["academic_year_id"] = ay_id

    try:
        existing = (
            supabase.table("semester_timelines")
            .select("id")
            .eq("academic_year", payload["academic_year"])
            .eq("semester", payload["semester"])
            .execute()
        )
        if existing.data:
            tid = existing.data[0]["id"]
            resp = supabase.table("semester_timelines").update(payload).eq("id", tid).execute()
        else:
            payload["created_by"] = current_user.get("user_id")
            resp = supabase.table("semester_timelines").insert(payload).execute()

        if not resp.data:
            raise Exception("No data returned from DB")
        saved = resp.data[0]

        # Auto-fire deadline reminders to assigned lecturers (fire-and-forget)
        try:
            asyncio.create_task(_send_reminders_for_timeline(saved))
        except Exception as reminder_err:
            logger.warning(f"Auto reminder fire failed: {reminder_err}")

        return saved
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error upserting timeline: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to save timeline")


async def _send_reminders_for_timeline(timeline: dict) -> dict:
    """Shared helper: email all assigned lecturers for a given timeline dict."""
    timeline_id = timeline["id"]
    sent, skipped = 0, 0
    try:
        sel_resp = supabase.table("semester_course_selections").select("course_id").eq("timeline_id", timeline_id).execute()
        course_ids = [r["course_id"] for r in (sel_resp.data or [])]
        if not course_ids:
            return {"sent": 0, "skipped": 0, "message": "No courses selected for this timeline"}

        c_resp = supabase.table("courses").select("id, code, name, lecturer_id").in_("id", course_ids).execute()
        courses = c_resp.data or []

        # Group courses by lecturer
        lecturer_courses: dict = {}
        for course in courses:
            lid = course.get("lecturer_id")
            if not lid:
                skipped += 1
                continue
            if lid not in lecturer_courses:
                lecturer_courses[lid] = []
            lecturer_courses[lid].append(f"{course.get('code', '')} – {course.get('name', '')}")

        if not lecturer_courses:
            return {"sent": 0, "skipped": skipped, "message": "No assigned lecturers found"}

        lecturer_ids = list(lecturer_courses.keys())
        l_resp = supabase.table("users").select("id, email, full_name").in_("id", lecturer_ids).execute()

        for user in (l_resp.data or []):
            uid = user["id"]
            email = user.get("email", "")
            full_name = user.get("full_name", "Lecturer")
            if not email:
                skipped += 1
                continue
            await EmailService.send_deadline_reminder(
                email=email,
                lecturer_name=full_name,
                academic_year=timeline.get("academic_year", ""),
                semester=timeline.get("semester", 0),
                start_date=timeline.get("start_date", ""),
                end_date=timeline.get("end_date", ""),
                grade_submission_deadline=timeline.get("grade_submission_deadline"),
                notes=timeline.get("notes"),
                courses=lecturer_courses.get(uid, []),
            )
            sent += 1
    except Exception as e:
        logger.error(f"Error in _send_reminders_for_timeline: {e}", exc_info=True)
    return {"sent": sent, "skipped": skipped}


@router.post("/{timeline_id}/send-reminders")
async def send_reminders(timeline_id: str, current_user: User = Depends(get_current_user)):
    """Manually trigger deadline reminder emails to all lecturers with assigned courses."""
    _require_supabase()
    if not has_effective_role(current_user, "coordinator", "hod", "admin", "lecturer"):
        raise HTTPException(status_code=403, detail="Insufficient permissions")

    tl_resp = supabase.table("semester_timelines").select("*").eq("id", timeline_id).execute()
    if not tl_resp.data:
        raise HTTPException(status_code=404, detail="Timeline not found")

    result = await _send_reminders_for_timeline(tl_resp.data[0])
    return {
        **result,
        "message": f"Reminders sent to {result['sent']} lecturer(s), {result['skipped']} skipped (no email or unassigned)",
    }


@router.delete("/{timeline_id}", status_code=204)
async def delete_timeline(timeline_id: str, current_user: User = Depends(get_current_user)):
    """Delete a semester timeline.
    Also unassigns all lecturers from courses belonging to that semester/academic_year
    and removes the semester course selections. Coordinator/HOD/admin only."""
    _require_supabase()
    if not has_effective_role(current_user, "coordinator", "hod", "admin"):
        raise HTTPException(status_code=403, detail="Only coordinators, HODs, and admins can delete timelines")

    # Fetch timeline to get academic_year + semester
    tl_resp = supabase.table("semester_timelines").select("academic_year, semester").eq("id", timeline_id).limit(1).execute()
    if not tl_resp.data:
        raise HTTPException(status_code=404, detail="Timeline not found")

    academic_year = tl_resp.data[0]["academic_year"]
    semester = tl_resp.data[0]["semester"]

    # Unassign lecturers from all courses in this semester/academic_year
    supabase.table("courses").update({"lecturer_id": None}).eq("academic_year", academic_year).eq("semester", int(semester)).execute()

    # Remove semester course selections for this timeline
    supabase.table("semester_course_selections").delete().eq("timeline_id", timeline_id).execute()

    # Delete the timeline itself
    supabase.table("semester_timelines").delete().eq("id", timeline_id).execute()

    logger.info(
        f"Timeline {timeline_id} ({academic_year} Sem {semester}) deleted by {current_user.get('user_id')}; "
        f"lecturer assignments cleared"
    )


@router.get("/{timeline_id}/courses")
async def get_semester_courses(timeline_id: str, current_user: User = Depends(get_current_user)):
    """Return the list of course IDs selected for this semester timeline."""
    _require_supabase()
    resp = (
        supabase.table("semester_course_selections")
        .select("course_id")
        .eq("timeline_id", timeline_id)
        .execute()
    )
    return {"course_ids": [r["course_id"] for r in (resp.data or [])]}


@router.put("/{timeline_id}/courses", status_code=200)
async def set_semester_courses(
    timeline_id: str,
    data: dict,
    current_user: User = Depends(get_current_user),
):
    """Replace the course selection for this semester timeline (bulk replace).
    When a course's academic_year differs from the timeline's, find or create
    a year-scoped clone so assignments don't leak across years.
    Body: { "course_ids": ["<uuid>", ...] }
    Requires coordinator, hod, or admin."""
    _require_supabase()
    if not has_effective_role(current_user, "coordinator", "hod", "admin"):
        raise HTTPException(status_code=403, detail="Insufficient permissions")

    incoming_ids: list = data.get("course_ids", [])

    try:
        # Fetch timeline details
        tl_resp = supabase.table("semester_timelines").select("academic_year, semester").eq("id", timeline_id).execute()
        if not tl_resp.data:
            raise HTTPException(status_code=404, detail="Timeline not found")
        timeline_ay = tl_resp.data[0]["academic_year"]
        timeline_sem = tl_resp.data[0]["semester"]

        resolved_ids = []
        for cid in incoming_ids:
            c_resp = supabase.table("courses").select("*").eq("id", cid).execute()
            if not c_resp.data:
                continue  # skip missing course
            course = c_resp.data[0]

            # If already correct year, use as-is
            if course.get("academic_year") == timeline_ay:
                resolved_ids.append(cid)
                continue

            # Find existing clone for this year (same code + year)
            clone_resp = (
                supabase.table("courses")
                .select("id")
                .eq("code", course["code"])
                .eq("academic_year", timeline_ay)
                .is_("archived_at", "null")
                .execute()
            )
            if clone_resp.data:
                resolved_ids.append(clone_resp.data[0]["id"])
                continue

            # Create new year-scoped clone (no lecturer, correct year/sem)
            clone_payload = {
                "code": course["code"],
                "name": course.get("name"),
                "credits": course.get("credits"),
                "semester": timeline_sem,
                "academic_year": timeline_ay,
                "lecturer_id": None,
                "coordinator_id": course.get("coordinator_id"),
                "department_id": course.get("department_id"),
                "max_students": course.get("max_students"),
                "category": course.get("category"),
                "has_final_exam": course.get("has_final_exam"),
                "lecture_hours": course.get("lecture_hours"),
                "tutorial_hours": course.get("tutorial_hours"),
                "lab_hours": course.get("lab_hours"),
                "lab_name": course.get("lab_name"),
                "special_notes": course.get("special_notes"),
            }
            # Remove None values to avoid schema issues
            clone_payload = {k: v for k, v in clone_payload.items() if v is not None}

            new_resp = supabase.table("courses").insert(clone_payload).execute()
            if new_resp.data:
                resolved_ids.append(new_resp.data[0]["id"])
                logger.info(f"Cloned course {course['code']} to {timeline_ay} (new id: {new_resp.data[0]['id']})")
            else:
                logger.error(f"Failed to clone course {course['code']} for {timeline_ay}")

        # Delete existing selection and insert resolved ids
        supabase.table("semester_course_selections").delete().eq("timeline_id", timeline_id).execute()
        if resolved_ids:
            rows = [{"timeline_id": timeline_id, "course_id": rid} for rid in resolved_ids]
            supabase.table("semester_course_selections").insert(rows).execute()

        return {"timeline_id": timeline_id, "course_ids": resolved_ids, "count": len(resolved_ids)}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error setting semester courses: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to update course selection")
