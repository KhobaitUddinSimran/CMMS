"""Semester timeline endpoints — coordinator/admin only"""
import logging
from fastapi import APIRouter, Depends, HTTPException, status
from ..core.config import supabase
from ..dependencies.auth import get_current_user, has_effective_role
from ..models.user import User

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
    """Create or update a semester timeline (upserts on academic_year + semester)."""
    _require_supabase()
    if not has_effective_role(current_user, "coordinator", "admin"):
        raise HTTPException(status_code=403, detail="Only coordinators and admins can manage timelines")

    required = ("academic_year", "semester", "start_date", "end_date")
    for field in required:
        if not data.get(field):
            raise HTTPException(status_code=400, detail=f"{field} is required")

    payload = {
        "academic_year": data["academic_year"],
        "semester": int(data["semester"]),
        "start_date": data["start_date"],
        "end_date": data["end_date"],
        "midterm_deadline": data.get("midterm_deadline") or None,
        "grade_submission_deadline": data.get("grade_submission_deadline") or None,
        "final_deadline": data.get("final_deadline") or None,
        "notes": data.get("notes") or None,
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
        return resp.data[0]
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error upserting timeline: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to save timeline")


@router.delete("/{timeline_id}", status_code=204)
async def delete_timeline(timeline_id: str, current_user: User = Depends(get_current_user)):
    """Delete a semester timeline."""
    _require_supabase()
    if not has_effective_role(current_user, "coordinator", "admin"):
        raise HTTPException(status_code=403, detail="Insufficient permissions")
    supabase.table("semester_timelines").delete().eq("id", timeline_id).execute()
