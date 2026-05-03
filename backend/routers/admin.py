"""Admin endpoints — fully database-backed (Supabase)"""
import logging
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr
from ..core.config import supabase
from ..dependencies.auth import require_role, require_effective_role, invalidate_role_cache
from ..services.audit_service import AuditService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/admin", tags=["admin"])


class ApproveUserRequest(BaseModel):
    email: EmailStr

class RejectUserRequest(BaseModel):
    email: EmailStr
    reason: str | None = None

class AssignSpecialRoleRequest(BaseModel):
    email: EmailStr
    special_role: str  # "coordinator" or "hod"

class RevokeSpecialRoleRequest(BaseModel):
    email: EmailStr
    special_role: str  # "coordinator" or "hod"


@router.post("/approve-user")
async def approve_user(request: ApproveUserRequest, current_user=Depends(require_role("admin"))):
    """Approve a pending user signup (Admin only)."""
    email = request.email.lower()
    admin_id = current_user.get("user_id")
    if not supabase:
        raise HTTPException(status_code=503, detail="Database unavailable")
    try:
        resp = supabase.table("users").select("id").ilike("email", email).execute()
        if not resp.data:
            raise HTTPException(status_code=404, detail="User not found")
        user_id = resp.data[0]["id"]
        supabase.table("users").update({
            "is_active": True, "approval_status": "approved", "approved_by": admin_id,
        }).eq("id", user_id).execute()
        AuditService.log("USER_APPROVED", admin_id, user_id, {"email": email})
        logger.info(f"User {email} approved by admin {admin_id}")
        return {"message": "User approved successfully and can now login", "email": email, "status": "approved"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Approve user error: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.post("/reject-user")
async def reject_user(request: RejectUserRequest, current_user=Depends(require_role("admin"))):
    """Reject a pending user signup (Admin only)."""
    email = request.email.lower()
    if not supabase:
        raise HTTPException(status_code=503, detail="Database unavailable")
    try:
        resp = supabase.table("users").select("id").ilike("email", email).execute()
        if not resp.data:
            raise HTTPException(status_code=404, detail="User not found")
        user_id = resp.data[0]["id"]
        supabase.table("users").update({
            "approval_status": "rejected", "is_active": False,
            "rejection_reason": request.reason or "",
        }).eq("id", user_id).execute()
        AuditService.log("USER_REJECTED", current_user.get("user_id"), user_id, {"email": email, "reason": request.reason})
        return {"message": "User rejected successfully", "email": email, "status": "rejected"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Reject user error: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("/pending-users")
async def get_pending_users(current_user=Depends(require_role("admin"))):
    """Get list of pending user signups (Admin only)."""
    if not supabase:
        raise HTTPException(status_code=503, detail="Database unavailable")
    try:
        resp = supabase.table("users").select(
            "id, email, full_name, role, created_at"
        ).eq("approval_status", "pending").execute()
        users = resp.data or []
        return {"count": len(users), "users": users}
    except Exception as e:
        logger.error(f"Pending users error: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


# ==================== SPECIAL ROLE MANAGEMENT ====================

@router.post("/assign-special-role")
async def assign_special_role(
    request: AssignSpecialRoleRequest,
    current_user=Depends(require_role("admin"))
):
    """Assign a special role (coordinator/hod) to a lecturer (Admin only)
    
    FIXED: Properly persists to Supabase database. No longer uses in-memory mock fallback
    that was losing role assignments on app restart.
    """
    email = request.email.lower()
    special_role = request.special_role.lower()

    if special_role not in ["coordinator", "hod"]:
        raise HTTPException(status_code=400, detail="Special role must be 'coordinator' or 'hod'")

    # Update the user's base role to coordinator/hod (no special_roles column needed)
    try:
        # Case-insensitive email lookup
        user_resp = supabase.table("users").select("*").ilike("email", email).execute()
        user = user_resp.data[0] if user_resp.data else None

        if not user:
            raise HTTPException(status_code=404, detail=f"User not found: {email}")

        if user.get("role") not in ["lecturer", "coordinator", "hod", "admin"]:
            raise HTTPException(status_code=400, detail="Only lecturers can be assigned special roles")

        # Keep base role as 'lecturer'; append to special_roles array
        current_special = user.get("special_roles") or []
        if special_role not in current_special:
            current_special = current_special + [special_role]
        # If old-style row (role was coordinator/hod), normalise base role back to lecturer
        update_payload = {"special_roles": current_special}
        if user.get("role") in ("coordinator", "hod"):
            update_payload["role"] = "lecturer"
        supabase.table("users").update(update_payload).eq("id", user["id"]).execute()
        invalidate_role_cache(user["id"])
        logger.info(f"User {email} special_roles → {current_special}")
        AuditService.log("SPECIAL_ROLE_ASSIGNED", current_user.get("user_id"), user["id"], {"role": special_role})
        return {"message": f"Special role '{special_role}' assigned successfully", "email": email, "special_roles": current_special}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to assign special role in Supabase: {e}")
        raise HTTPException(status_code=500, detail="Failed to assign special role")


@router.post("/revoke-special-role")
async def revoke_special_role(
    request: RevokeSpecialRoleRequest,
    current_user=Depends(require_role("admin"))
):
    """Revoke a special role from a lecturer (Admin only)
    
    FIXED: Properly persists to Supabase database. No longer uses in-memory mock fallback
    that was losing role changes on app restart.
    """
    email = request.email.lower()
    special_role = request.special_role.lower()

    if special_role not in ["coordinator", "hod"]:
        raise HTTPException(status_code=400, detail="Special role must be 'coordinator' or 'hod'")

    # Revert the user's role back to lecturer
    try:
        user_resp = supabase.table("users").select("*").ilike("email", email).execute()
        if not user_resp.data:
            raise HTTPException(status_code=404, detail="User not found")
        user = user_resp.data[0]

        # Remove the revoked role from special_roles array
        current_special = user.get("special_roles") or []
        # Backwards-compat: old-style row where role IS the special role
        if not current_special and user.get("role") in ("coordinator", "hod"):
            current_special = [user["role"]]
        new_special = [r for r in current_special if r != special_role]
        update_payload = {"special_roles": new_special, "role": "lecturer"}
        supabase.table("users").update(update_payload).eq("id", user["id"]).execute()
        invalidate_role_cache(user["id"])
        logger.info(f"User {email} special_roles after revoke → {new_special}")
        AuditService.log("SPECIAL_ROLE_REVOKED", current_user.get("user_id"), user["id"], {"role": special_role})
        return {"message": f"Special role '{special_role}' revoked successfully", "email": email, "special_roles": new_special}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to revoke special role in Supabase: {e}")
        raise HTTPException(status_code=500, detail="Failed to revoke special role")


@router.get("/lecturers")
async def list_lecturers(
    current_user=Depends(require_role("admin"))
):
    """Get list of all lecturers (Admin only)
    
    FIXED: Now returns all lecturers including the new test accounts.
    Reads special_roles directly from Supabase database (persistent storage).
    """
    lecturers = []

    def _derive_special_roles(role: str, stored: list) -> list:
        """Derive special_roles from role (coordinator/hod stored as base role)."""
        if stored:
            return stored
        if role in ("coordinator", "hod"):
            return [role]
        return []

    # Read from Supabase — include lecturers, coordinators, and HODs
    try:
        resp = supabase.table("users").select("*").in_("role", ["lecturer", "coordinator", "hod"]).execute()
        seen_emails = set()
        if resp.data:
            for u in resp.data:
                email = u.get("email", "")
                seen_emails.add(email)
                role = u.get("role", "lecturer")
                special_roles = u.get("special_roles") or _derive_special_roles(role, [])
                lecturers.append({
                    "id": u.get("id"),
                    "email": email,
                    "full_name": u.get("full_name", ""),
                    "role": role,
                    "special_roles": special_roles,
                    "is_active": u.get("is_active", False),
                })
        logger.info(f"Loaded {len(lecturers)} teaching staff from Supabase")
        return {"count": len(lecturers), "lecturers": lecturers}
    except Exception as e:
        logger.error(f"Failed to fetch lecturers: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


# ==================== DASHBOARD STATS ====================

@router.get("/stats")
async def get_admin_stats(
    current_user=Depends(require_role("admin"))
):
    """Get dashboard stats for admin overview"""
    stats = {
        "total_users": 0,
        "active_users": 0,
        "pending_approvals": 0,
        "total_courses": 0,
        "students": 0,
        "lecturers": 0,
        "coordinators": 0,
        "hods": 0,
    }

    try:
        users_resp = supabase.table("users").select("*").execute()
        if users_resp.data:
            stats["total_users"] = len(users_resp.data)
            for u in users_resp.data:
                if u.get("is_active"):
                    stats["active_users"] += 1
                if u.get("approval_status") == "pending":
                    stats["pending_approvals"] += 1
                role = u.get("role", "")
                sr = u.get("special_roles") or []
                # Backwards-compat: old rows where special role was stored as base role
                if not sr and role in ("coordinator", "hod"):
                    sr = [role]
                if role == "student":
                    stats["students"] += 1
                elif role in ("lecturer", "coordinator", "hod"):
                    stats["lecturers"] += 1
                if "coordinator" in sr:
                    stats["coordinators"] += 1
                if "hod" in sr:
                    stats["hods"] += 1

        courses_resp = supabase.table("courses").select("id", count="exact").execute()
        stats["total_courses"] = courses_resp.count or 0
        return stats
    except Exception as e:
        logger.warning(f"Stats query failed: {e}")
    return stats


# ==================== ALL USERS MANAGEMENT ====================

@router.get("/users")
async def list_all_users(
    role: str | None = None,
    user_status: str | None = None,
    search: str | None = None,
    current_user=Depends(require_role("admin"))
):
    """List all users with optional filters (Admin only)"""
    users_list = []

    try:
        query = supabase.table("users").select("*")
        if role:
            query = query.eq("role", role)
        if user_status == "active":
            query = query.eq("is_active", True)
        elif user_status == "inactive":
            query = query.eq("is_active", False)
        elif user_status == "pending":
            query = query.eq("approval_status", "pending")
        resp = query.order("created_at", desc=True).execute()
        users_list = resp.data or []
        if search:
            sl = search.lower()
            users_list = [u for u in users_list if sl in u.get("email", "").lower() or sl in u.get("full_name", "").lower()]
        for u in users_list:
            if not u.get("special_roles"):
                u["special_roles"] = []
        return {"count": len(users_list), "users": users_list}
    except Exception as e:
        logger.error(f"List users error: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


class ToggleUserActiveRequest(BaseModel):
    email: EmailStr
    is_active: bool


@router.post("/toggle-user-active")
async def toggle_user_active(
    request: ToggleUserActiveRequest,
    current_user=Depends(require_role("admin"))
):
    """Enable or disable a user account (Admin only)"""
    target_email = request.email.lower()

    if not supabase:
        raise HTTPException(status_code=503, detail="Database unavailable")
    try:
        resp = supabase.table("users").select("id").ilike("email", target_email).execute()
        if not resp.data:
            raise HTTPException(status_code=404, detail="User not found")
        uid = resp.data[0]["id"]
        supabase.table("users").update({"is_active": request.is_active}).eq("id", uid).execute()
        invalidate_role_cache(uid)
        action = "USER_ACTIVATED" if request.is_active else "USER_DEACTIVATED"
        AuditService.log(action, current_user.get("user_id"), uid, {"email": target_email})
        return {"message": f"User {'activated' if request.is_active else 'deactivated'}", "email": target_email, "is_active": request.is_active}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Toggle user active error: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


# ==================== AUDIT LOG ====================

@router.get("/audit-logs")
async def get_audit_logs(
    limit: int = 50,
    offset: int = 0,
    action: str | None = None,
    current_user=Depends(require_effective_role("admin", "hod"))
):
    """Get audit log entries (Admin and HOD)"""
    try:
        query = supabase.table("audit_logs").select("*")
        if action:
            query = query.eq("action", action)
        resp = query.order("created_at", desc=True).range(offset, offset + limit - 1).execute()
        logs = resp.data or []

        actor_ids = list(set(l.get("user_id") for l in logs if l.get("user_id")))
        actor_map = {}
        if actor_ids:
            actors_resp = supabase.table("users").select("id, email, full_name").in_("id", actor_ids).execute()
            for a in (actors_resp.data or []):
                actor_map[a["id"]] = {"email": a.get("email"), "full_name": a.get("full_name")}

        for log_entry in logs:
            actor = actor_map.get(log_entry.get("user_id"), {})
            log_entry["actor_email"] = actor.get("email", "system")
            log_entry["actor_name"] = actor.get("full_name", "System")

        return {"count": len(logs), "logs": logs}
    except Exception as e:
        logger.warning(f"Supabase audit logs failed: {e}")

    return {"count": 0, "logs": []}


# ==================== HOD STATS ====================

@router.get("/hod-stats")
async def get_hod_stats(
    current_user=Depends(require_effective_role("admin", "hod"))
):
    """Get dashboard stats for HOD overview"""
    stats = {
        "total_students": 0,
        "total_faculty": 0,
        "active_courses": 0,
        "flagged_marks": 0,
    }

    if not supabase:
        return stats

    try:
        sr = supabase.table("users").select("id", count="exact").eq("role", "student").eq("is_active", True).execute()
        stats["total_students"] = sr.count or 0

        fr = supabase.table("users").select("id", count="exact").eq("role", "lecturer").eq("is_active", True).execute()
        stats["total_faculty"] = fr.count or 0

        cr = supabase.table("courses").select("id", count="exact").execute()
        stats["active_courses"] = cr.count or 0

        mr = supabase.table("marks").select("id", count="exact").eq("is_flagged", True).execute()
        stats["flagged_marks"] = mr.count or 0
    except Exception as e:
        logger.warning(f"HOD stats query failed: {e}")

    return stats
