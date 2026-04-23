"""Admin endpoints - Supabase Edition with mock fallback"""
import logging
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr
from ..core.config import supabase
from ..dependencies.auth import require_role
from ..db.mock_data import MOCK_USERS, PENDING_USERS
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
async def approve_user(
    request: ApproveUserRequest,
    current_user=Depends(require_role("admin"))
):
    """Approve a pending user signup (Admin only)
    
    Tries Supabase first, falls back to mock data for dev.
    """
    email = request.email.lower()

    # Try Supabase first
    try:
        user_resp = supabase.table("users").select("*").eq("email", email).eq("approval_status", "pending").execute()
        if user_resp.data:
            user = user_resp.data[0]
            supabase.table("users").update({
                "is_active": True,
                "approval_status": "approved",
                "approved_by": current_user.get("user_id"),
            }).eq("id", user["id"]).execute()

            AuditService.log("USER_APPROVED", current_user.get("user_id"), user["id"], {"email": email})
            logger.info(f"User {email} approved (Supabase) by admin {current_user.get('user_id')}")
            return {"message": "User approved successfully and can now login", "email": email, "status": "approved"}
    except Exception as e:
        logger.warning(f"Supabase approve failed, trying mock: {e}")

    # Fallback to mock data
    if email not in PENDING_USERS:
        raise HTTPException(status_code=404, detail="User not found in pending list")

    pending_user = PENDING_USERS[email]
    if email in MOCK_USERS:
        MOCK_USERS[email].update({"is_active": True, "approval_status": "approved", "approved_by": current_user.get("user_id")})
    else:
        MOCK_USERS[email] = {**pending_user, "is_active": True, "approval_status": "approved", "approved_by": current_user.get("user_id")}

    del PENDING_USERS[email]
    logger.info(f"User {email} approved (mock) by admin {current_user.get('user_id')}")
    return {"message": "User approved successfully and can now login", "email": email, "status": "approved"}


@router.post("/reject-user")
async def reject_user(
    request: RejectUserRequest,
    current_user=Depends(require_role("admin"))
):
    """Reject a pending user signup (Admin only)"""
    email = request.email.lower()

    # Try Supabase first
    try:
        user_resp = supabase.table("users").select("*").eq("email", email).eq("approval_status", "pending").execute()
        if user_resp.data:
            user = user_resp.data[0]
            supabase.table("users").update({
                "approval_status": "rejected",
                "is_active": False,
            }).eq("id", user["id"]).execute()

            AuditService.log("USER_REJECTED", current_user.get("user_id"), user["id"], {"email": email, "reason": request.reason})
            return {"message": "User rejected successfully", "email": email, "status": "rejected"}
    except Exception as e:
        logger.warning(f"Supabase reject failed, trying mock: {e}")

    # Fallback to mock
    if email not in PENDING_USERS:
        raise HTTPException(status_code=404, detail="User not found in pending list")

    del PENDING_USERS[email]
    return {"message": "User rejected successfully", "email": email, "status": "rejected"}


@router.get("/pending-users")
async def get_pending_users(
    current_user=Depends(require_role("admin"))
):
    """Get list of pending user signups (Admin only)"""
    users = []

    # Try Supabase first
    try:
        resp = supabase.table("users").select("*").eq("approval_status", "pending").execute()
        if resp.data:
            for u in resp.data:
                users.append({
                    "id": u.get("id"),
                    "email": u.get("email"),
                    "full_name": u.get("full_name", ""),
                    "role": u.get("role", ""),
                    "created_at": u.get("created_at"),
                })
            return {"count": len(users), "users": users}
    except Exception as e:
        logger.warning(f"Supabase pending-users failed, trying mock: {e}")

    # Fallback to mock
    for email, user_data in PENDING_USERS.items():
        users.append({
            "id": email,
            "email": email,
            "full_name": user_data.get("full_name", ""),
            "role": user_data.get("role", ""),
            "created_at": user_data.get("created_at"),
        })

    return {"count": len(users), "users": users}


# ==================== SPECIAL ROLE MANAGEMENT ====================

@router.post("/assign-special-role")
async def assign_special_role(
    request: AssignSpecialRoleRequest,
    current_user=Depends(require_role("admin"))
):
    """Assign a special role (coordinator/hod) to a lecturer (Admin only)"""
    email = request.email.lower()
    special_role = request.special_role.lower()

    if special_role not in ["coordinator", "hod"]:
        raise HTTPException(status_code=400, detail="Special role must be 'coordinator' or 'hod'")

    # Try Supabase
    try:
        user_resp = supabase.table("users").select("*").eq("email", email).execute()
        if user_resp.data:
            user = user_resp.data[0]
            if user.get("role") not in ["lecturer", "admin"]:
                raise HTTPException(status_code=400, detail="Only lecturers can be assigned special roles")

            current_special = user.get("special_roles") or []
            if special_role not in current_special:
                current_special.append(special_role)
                supabase.table("users").update({"special_roles": current_special}).eq("id", user["id"]).execute()

            AuditService.log("SPECIAL_ROLE_ASSIGNED", current_user.get("user_id"), user["id"], {"role": special_role})
            return {"message": f"Special role '{special_role}' assigned successfully", "email": email, "special_roles": current_special}
    except HTTPException:
        raise
    except Exception as e:
        logger.warning(f"Supabase assign role failed, trying mock: {e}")

    # Fallback to mock
    if email not in MOCK_USERS:
        raise HTTPException(status_code=404, detail="User not found")

    user = MOCK_USERS[email]
    if user.get("role") not in ["lecturer", "admin"]:
        raise HTTPException(status_code=400, detail="Only lecturers can be assigned special roles")

    if "special_roles" not in user:
        user["special_roles"] = []
    if special_role not in user["special_roles"]:
        user["special_roles"].append(special_role)

    return {"message": f"Special role '{special_role}' assigned successfully", "email": email, "special_roles": user["special_roles"]}


@router.post("/revoke-special-role")
async def revoke_special_role(
    request: RevokeSpecialRoleRequest,
    current_user=Depends(require_role("admin"))
):
    """Revoke a special role from a lecturer (Admin only)"""
    email = request.email.lower()
    special_role = request.special_role.lower()

    if special_role not in ["coordinator", "hod"]:
        raise HTTPException(status_code=400, detail="Special role must be 'coordinator' or 'hod'")

    # Try Supabase
    try:
        user_resp = supabase.table("users").select("*").eq("email", email).execute()
        if user_resp.data:
            user = user_resp.data[0]
            current_special = user.get("special_roles") or []
            if special_role in current_special:
                current_special.remove(special_role)
                supabase.table("users").update({"special_roles": current_special}).eq("id", user["id"]).execute()

            AuditService.log("SPECIAL_ROLE_REVOKED", current_user.get("user_id"), user["id"], {"role": special_role})
            return {"message": f"Special role '{special_role}' revoked successfully", "email": email, "special_roles": current_special}
    except HTTPException:
        raise
    except Exception as e:
        logger.warning(f"Supabase revoke role failed, trying mock: {e}")

    # Fallback to mock
    if email not in MOCK_USERS:
        raise HTTPException(status_code=404, detail="User not found")

    user = MOCK_USERS[email]
    if special_role in user.get("special_roles", []):
        user["special_roles"].remove(special_role)

    return {"message": f"Special role '{special_role}' revoked successfully", "email": email, "special_roles": user.get("special_roles", [])}


@router.get("/lecturers")
async def list_lecturers(
    current_user=Depends(require_role("admin"))
):
    """Get list of all lecturers (Admin only)"""
    lecturers = []

    # Try Supabase
    try:
        resp = supabase.table("users").select("*").eq("role", "lecturer").execute()
        if resp.data:
            for u in resp.data:
                lecturers.append({
                    "id": u.get("id"),
                    "email": u.get("email"),
                    "full_name": u.get("full_name", ""),
                    "role": "lecturer",
                    "special_roles": u.get("special_roles") or [],
                    "is_active": u.get("is_active", False),
                })
            return {"count": len(lecturers), "lecturers": lecturers}
    except Exception as e:
        logger.warning(f"Supabase lecturers failed, trying mock: {e}")

    # Fallback to mock
    for email, user_data in MOCK_USERS.items():
        if user_data.get("role") == "lecturer":
            lecturers.append({
                "id": email,
                "email": email,
                "full_name": user_data.get("full_name", ""),
                "role": "lecturer",
                "special_roles": user_data.get("special_roles", []),
                "is_active": user_data.get("is_active", False),
            })

    return {"count": len(lecturers), "lecturers": lecturers}


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
        users_resp = supabase.table("users").select("id, role, is_active, approval_status, special_roles").execute()
        if users_resp.data:
            stats["total_users"] = len(users_resp.data)
            for u in users_resp.data:
                if u.get("is_active"):
                    stats["active_users"] += 1
                if u.get("approval_status") == "pending":
                    stats["pending_approvals"] += 1
                role = u.get("role", "")
                if role == "student":
                    stats["students"] += 1
                elif role == "lecturer":
                    stats["lecturers"] += 1
                sr = u.get("special_roles") or []
                if "coordinator" in sr:
                    stats["coordinators"] += 1
                if "hod" in sr:
                    stats["hods"] += 1

        courses_resp = supabase.table("courses").select("id", count="exact").execute()
        stats["total_courses"] = courses_resp.count or 0
        return stats
    except Exception as e:
        logger.warning(f"Supabase stats failed, using mock: {e}")

    for email_key, ud in MOCK_USERS.items():
        stats["total_users"] += 1
        if ud.get("is_active"):
            stats["active_users"] += 1
        if ud.get("approval_status") == "pending":
            stats["pending_approvals"] += 1
        role = ud.get("role", "")
        if role == "student":
            stats["students"] += 1
        elif role == "lecturer":
            stats["lecturers"] += 1
        sr = ud.get("special_roles", [])
        if "coordinator" in sr:
            stats["coordinators"] += 1
        if "hod" in sr:
            stats["hods"] += 1

    stats["pending_approvals"] += len(PENDING_USERS)
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
        query = supabase.table("users").select("id, email, full_name, role, is_active, approval_status, special_roles, created_at")
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
        return {"count": len(users_list), "users": users_list}
    except Exception as e:
        logger.warning(f"Supabase list users failed, using mock: {e}")

    for email_key, ud in MOCK_USERS.items():
        if role and ud.get("role") != role:
            continue
        if user_status == "active" and not ud.get("is_active"):
            continue
        if user_status == "inactive" and ud.get("is_active"):
            continue
        if user_status == "pending" and ud.get("approval_status") != "pending":
            continue
        entry = {
            "id": ud.get("id", email_key),
            "email": email_key,
            "full_name": ud.get("full_name", ""),
            "role": ud.get("role", ""),
            "is_active": ud.get("is_active", False),
            "approval_status": ud.get("approval_status", "approved"),
            "special_roles": ud.get("special_roles", []),
            "created_at": ud.get("created_at"),
        }
        if search:
            sl = search.lower()
            if sl not in email_key.lower() and sl not in ud.get("full_name", "").lower():
                continue
        users_list.append(entry)

    return {"count": len(users_list), "users": users_list}


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

    try:
        user_resp = supabase.table("users").select("*").eq("email", target_email).execute()
        if user_resp.data:
            target_user = user_resp.data[0]
            supabase.table("users").update({"is_active": request.is_active}).eq("id", target_user["id"]).execute()
            action = "USER_ACTIVATED" if request.is_active else "USER_DEACTIVATED"
            AuditService.log(action, current_user.get("user_id"), target_user["id"], {"email": target_email})
            return {"message": f"User {'activated' if request.is_active else 'deactivated'}", "email": target_email, "is_active": request.is_active}
    except Exception as e:
        logger.warning(f"Supabase toggle failed, using mock: {e}")

    if target_email not in MOCK_USERS:
        raise HTTPException(status_code=404, detail="User not found")

    MOCK_USERS[target_email]["is_active"] = request.is_active
    return {"message": f"User {'activated' if request.is_active else 'deactivated'}", "email": target_email, "is_active": request.is_active}


# ==================== AUDIT LOG ====================

@router.get("/audit-logs")
async def get_audit_logs(
    limit: int = 50,
    offset: int = 0,
    action: str | None = None,
    current_user=Depends(require_role("admin"))
):
    """Get audit log entries (Admin only)"""
    try:
        query = supabase.table("audit_log").select("*")
        if action:
            query = query.eq("action", action)
        resp = query.order("created_at", desc=True).range(offset, offset + limit - 1).execute()
        logs = resp.data or []

        actor_ids = list(set(l.get("actor_id") for l in logs if l.get("actor_id")))
        actor_map = {}
        if actor_ids:
            actors_resp = supabase.table("users").select("id, email, full_name").in_("id", actor_ids).execute()
            for a in (actors_resp.data or []):
                actor_map[a["id"]] = {"email": a.get("email"), "full_name": a.get("full_name")}

        for log_entry in logs:
            actor = actor_map.get(log_entry.get("actor_id"), {})
            log_entry["actor_email"] = actor.get("email", "system")
            log_entry["actor_name"] = actor.get("full_name", "System")

        return {"count": len(logs), "logs": logs}
    except Exception as e:
        logger.warning(f"Supabase audit logs failed: {e}")

    return {"count": 0, "logs": []}
