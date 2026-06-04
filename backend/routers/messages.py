"""In-portal messaging — coordinators contact lecturers (and vice-versa)."""
import logging
import os
from fastapi import APIRouter, Depends, HTTPException, Request, status
from slowapi import Limiter
from slowapi.util import get_remote_address
from ..core.config import supabase
from ..dependencies.auth import get_current_user
from ..models.user import User

router = APIRouter(prefix="/api/messages", tags=["messages"])
logger = logging.getLogger(__name__)


def _rate_key(request: Request) -> str:
    if os.getenv("ENVIRONMENT", "development") == "development":
        return "dev-shared-key"
    return get_remote_address(request)


limiter = Limiter(key_func=_rate_key)


def _require_supabase():
    if supabase is None:
        raise HTTPException(status_code=503, detail="Database unavailable")


def _can_message(sender: dict, recipient_role: str) -> bool:
    """Students cannot message admin/HOD directly \u2014 they go through their
    coordinator (who, in real workflows, owns the escalation chain). Lecturers
    can message anyone except admin (rare ops). Elevated roles can message all."""
    sender_role = sender.get("role", "")
    if sender_role in ("admin", "coordinator", "hod"):
        return True
    if sender_role == "lecturer":
        return recipient_role != "admin"
    if sender_role == "student":
        return recipient_role in ("lecturer", "coordinator")
    return False


def _enrich_users(messages: list) -> list:
    """Attach from_user / to_user display info to each message dict."""
    ids = set()
    for m in messages:
        ids.add(m.get("from_user_id"))
        ids.add(m.get("to_user_id"))
    ids.discard(None)
    user_map: dict = {}
    if ids:
        resp = (
            supabase.table("users")
            .select("id, full_name, email, role")
            .in_("id", list(ids))
            .execute()
        )
        user_map = {u["id"]: u for u in (resp.data or [])}
    for m in messages:
        m["from_user"] = user_map.get(m.get("from_user_id"), {})
        m["to_user"] = user_map.get(m.get("to_user_id"), {})
    return messages


@router.get("")
async def list_messages(current_user: User = Depends(get_current_user)):
    """Return inbox + sent for the current user."""
    _require_supabase()
    uid = current_user.get("user_id")

    inbox = (
        supabase.table("messages")
        .select("*, courses(code, name)")
        .eq("to_user_id", uid)
        .order("created_at", desc=True)
        .execute()
    ).data or []

    sent = (
        supabase.table("messages")
        .select("*, courses(code, name)")
        .eq("from_user_id", uid)
        .order("created_at", desc=True)
        .execute()
    ).data or []

    _enrich_users(inbox)
    _enrich_users(sent)

    unread_count = sum(1 for m in inbox if not m.get("is_read"))
    return {"inbox": inbox, "sent": sent, "unread_count": unread_count}


@router.post("", status_code=201)
@limiter.limit("60/hour")
async def send_message(
    request: Request,
    data: dict,
    current_user: User = Depends(get_current_user),
):
    """Send a message to one or more recipients.
    Accepts either to_user_id (str) or to_user_ids (list of str) for bulk sending.
    Optional `parent_message_id` threads the new message under an existing one."""
    _require_supabase()
    uid = current_user.get("user_id")

    body = (data.get("body") or "").strip()
    if not body:
        raise HTTPException(status_code=400, detail="Message body is required")
    if len(body) > 5000:
        raise HTTPException(status_code=400, detail="Message body exceeds 5000 character limit")

    # Resolve recipients
    to_ids: list = []
    if data.get("to_user_ids"):
        to_ids = [str(i) for i in data["to_user_ids"] if i]
    elif data.get("to_user_id"):
        to_ids = [str(data["to_user_id"])]
    if not to_ids:
        raise HTTPException(status_code=400, detail="At least one recipient is required")
    if len(to_ids) > 50:
        raise HTTPException(status_code=400, detail="Cannot send to more than 50 recipients in one request")

    # Validate role-based messaging rules
    recipients_resp = supabase.table("users").select("id, role").in_("id", to_ids).execute()
    recipient_map = {r["id"]: r for r in (recipients_resp.data or [])}
    for tid in to_ids:
        rec = recipient_map.get(tid)
        if not rec:
            raise HTTPException(status_code=404, detail=f"Recipient not found: {tid}")
        if not _can_message(current_user, rec.get("role", "")):
            raise HTTPException(
                status_code=403,
                detail=(
                    "You cannot message a user with this role directly. "
                    "Students should contact their lecturer or coordinator instead."
                ),
            )

    # Validate parent message (threading) if supplied
    parent_id = data.get("parent_message_id") or None
    if parent_id:
        parent_resp = supabase.table("messages").select("id, from_user_id, to_user_id").eq("id", parent_id).execute()
        if not parent_resp.data:
            raise HTTPException(status_code=404, detail="Parent message not found")
        parent = parent_resp.data[0]
        # Sender must have been a participant in the parent thread
        if uid not in (parent.get("from_user_id"), parent.get("to_user_id")):
            raise HTTPException(status_code=403, detail="You are not a participant in that thread")

    rows = [
        {
            "from_user_id": uid,
            "to_user_id": tid,
            "subject": (data.get("subject") or "").strip(),
            "body": body,
            "course_id": data.get("course_id") or None,
            "parent_message_id": parent_id,
        }
        for tid in to_ids
    ]

    try:
        resp = supabase.table("messages").insert(rows).execute()
        if not resp.data:
            raise Exception("Insert returned no data")
        return {"sent": len(resp.data), "messages": resp.data}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error sending message: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to send message")


@router.post("/{message_id}/read")
async def mark_read(message_id: str, current_user: User = Depends(get_current_user)):
    """Mark a received message as read."""
    _require_supabase()
    uid = current_user.get("user_id")
    supabase.table("messages").update({"is_read": True}).eq("id", message_id).eq("to_user_id", uid).execute()
    return {"ok": True}


@router.post("/read-all")
async def mark_all_read(current_user: User = Depends(get_current_user)):
    """Mark all inbox messages as read."""
    _require_supabase()
    uid = current_user.get("user_id")
    supabase.table("messages").update({"is_read": True}).eq("to_user_id", uid).eq("is_read", False).execute()
    return {"ok": True}


@router.delete("/{message_id}", status_code=204)
async def delete_message(message_id: str, current_user: User = Depends(get_current_user)):
    """Delete a message (sender or recipient can delete their copy)."""
    _require_supabase()
    uid = current_user.get("user_id")
    (
        supabase.table("messages")
        .delete()
        .eq("id", message_id)
        .or_(f"from_user_id.eq.{uid},to_user_id.eq.{uid}")
        .execute()
    )
