"""Semester timeline endpoints — coursework deadlines only (coordinator/lecturer/admin)"""
import asyncio
import logging
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from typing import Optional
from ..core.config import supabase
from ..dependencies.auth import get_current_user, has_effective_role
from ..models.user import User
from ..services.email_service import EmailService

router = APIRouter(prefix="/api/semester-timelines", tags=["semester-timelines"])


class UpsertTimelineRequest(BaseModel):
    academic_year: str
    semester: int
    start_date: str
    end_date: str
    grade_submission_deadline: Optional[str] = None
    notes: Optional[str] = None


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
async def upsert_timeline(data: UpsertTimelineRequest, current_user: User = Depends(get_current_user)):
    """Create or update a semester timeline (upserts on academic_year + semester)."""
    _require_supabase()
    if not has_effective_role(current_user, "coordinator", "admin", "lecturer"):
        raise HTTPException(status_code=403, detail="Insufficient permissions to manage timelines")

    payload = {
        "academic_year": data.academic_year,
        "semester": data.semester,
        "start_date": data.start_date,
        "end_date": data.end_date,
        "grade_submission_deadline": data.grade_submission_deadline or None,
        "notes": data.notes or None,
    }

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
    """Delete a semester timeline."""
    _require_supabase()
    if not has_effective_role(current_user, "coordinator", "admin", "lecturer"):
        raise HTTPException(status_code=403, detail="Insufficient permissions")
    supabase.table("semester_timelines").delete().eq("id", timeline_id).execute()


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
    Body: { "course_ids": ["<uuid>", ...] }
    Requires coordinator, hod, or admin."""
    _require_supabase()
    if not has_effective_role(current_user, "coordinator", "hod", "admin"):
        raise HTTPException(status_code=403, detail="Insufficient permissions")

    course_ids: list = data.get("course_ids", [])

    try:
        # Delete existing selection
        supabase.table("semester_course_selections").delete().eq("timeline_id", timeline_id).execute()

        # Insert new selection
        if course_ids:
            rows = [{"timeline_id": timeline_id, "course_id": cid} for cid in course_ids]
            supabase.table("semester_course_selections").insert(rows).execute()

        return {"timeline_id": timeline_id, "course_ids": course_ids, "count": len(course_ids)}
    except Exception as e:
        logger.error(f"Error setting semester courses: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to update course selection")
