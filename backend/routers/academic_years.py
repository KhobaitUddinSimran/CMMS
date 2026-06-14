"""Academic Year endpoints — year-level management (HOD activates, coordinator creates)"""
import logging
from fastapi import APIRouter, Depends, HTTPException, status
from core.config import supabase
from dependencies.auth import get_current_user, has_effective_role
from models.user import User

router = APIRouter(prefix="/api/academic-years", tags=["academic-years"])
logger = logging.getLogger(__name__)


def _require_supabase():
    if supabase is None:
        raise HTTPException(status_code=503, detail="Database unavailable")


@router.get("")
async def list_academic_years(current_user: User = Depends(get_current_user)):
    """Return all academic years ordered newest first."""
    _require_supabase()
    resp = (
        supabase.table("academic_years")
        .select("*")
        .order("name", desc=True)
        .execute()
    )
    return resp.data or []


@router.get("/active")
async def get_active_academic_year(current_user: User = Depends(get_current_user)):
    """Return the currently active academic year (or null if none set)."""
    _require_supabase()
    resp = (
        supabase.table("academic_years")
        .select("*")
        .eq("is_active", True)
        .limit(1)
        .execute()
    )
    if resp.data:
        return resp.data[0]
    return None


@router.post("", status_code=201)
async def create_academic_year(data: dict, current_user: User = Depends(get_current_user)):
    """Create a new academic year. Coordinator/HOD/admin only."""
    _require_supabase()
    if not has_effective_role(current_user, "coordinator", "hod", "admin"):
        raise HTTPException(status_code=403, detail="Only coordinators, HODs, and admins can create academic years")

    name = (data.get("name") or "").strip()
    if not name:
        raise HTTPException(status_code=400, detail="Academic year name is required (e.g. 2025/2026)")

    try:
        # Check for duplicate
        existing = supabase.table("academic_years").select("id").eq("name", name).execute()
        if existing.data:
            raise HTTPException(status_code=409, detail=f"Academic year '{name}' already exists")

        resp = supabase.table("academic_years").insert({
            "name": name,
            "is_active": False,
            "created_by": current_user.get("user_id"),
        }).execute()

        if not resp.data:
            raise Exception("Insert returned no data")
        logger.info(f"Academic year '{name}' created by {current_user.get('user_id')}")
        return resp.data[0]
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating academic year: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to create academic year")


@router.put("/{year_id}/activate")
async def activate_academic_year(year_id: str, current_user: User = Depends(get_current_user)):
    """Set the specified year as active and deactivate all others. HOD/admin only."""
    _require_supabase()
    if not has_effective_role(current_user, "hod", "admin"):
        raise HTTPException(status_code=403, detail="Only HODs and admins can activate an academic year")

    try:
        # Verify year exists
        yr_resp = supabase.table("academic_years").select("id, name").eq("id", year_id).execute()
        if not yr_resp.data:
            raise HTTPException(status_code=404, detail="Academic year not found")

        # Deactivate all years
        supabase.table("academic_years").update({"is_active": False}).neq("id", "00000000-0000-0000-0000-000000000000").execute()

        # Activate the selected year
        resp = supabase.table("academic_years").update({"is_active": True}).eq("id", year_id).execute()
        if not resp.data:
            raise Exception("Update returned no data")

        logger.info(f"Academic year '{yr_resp.data[0]['name']}' activated by {current_user.get('user_id')}")
        return resp.data[0]
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error activating academic year {year_id}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to activate academic year")


@router.delete("/{year_id}", status_code=204)
async def delete_academic_year(year_id: str, current_user: User = Depends(get_current_user)):
    """Delete an academic year. Blocked if it has associated semester timelines."""
    _require_supabase()
    if not has_effective_role(current_user, "coordinator", "hod", "admin"):
        raise HTTPException(status_code=403, detail="Insufficient permissions")

    try:
        # Block deletion if timelines exist for this year
        tl_resp = (
            supabase.table("semester_timelines")
            .select("id", count="exact")
            .eq("academic_year_id", year_id)
            .limit(1)
            .execute()
        )
        if (tl_resp.count or 0) > 0:
            raise HTTPException(
                status_code=409,
                detail="Cannot delete academic year: it has associated semester timelines. Delete those first.",
            )

        supabase.table("academic_years").delete().eq("id", year_id).execute()
        logger.info(f"Academic year {year_id} deleted by {current_user.get('user_id')}")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting academic year {year_id}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to delete academic year")
