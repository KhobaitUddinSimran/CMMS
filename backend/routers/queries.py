"""Queries endpoints — student mark queries and lecturer responses
Real DB table: course_queries
New columns: is_read_by_lecturer, is_read_by_student (Sprint 5)
"""
import asyncio
import logging
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status, Query
from pydantic import BaseModel
from typing import Optional
from core.config import supabase
from dependencies.auth import get_current_user, has_effective_role
from services.audit_service import AuditService
from services.email_service import EmailService

router = APIRouter(prefix="/api/queries", tags=["queries"])
logger = logging.getLogger(__name__)


def _require_supabase():
    if supabase is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database unavailable",
        )


def _enrich_queries(queries: list) -> list:
    """Enrich a list of course_queries rows with mark/assessment/course/student info."""
    if not queries:
        return queries

    # Collect IDs
    mark_ids = list({q.get("mark_id") for q in queries if q.get("mark_id")})
    student_ids = list({q.get("student_id") for q in queries if q.get("student_id")})

    # Fetch marks (to get assessment_id)
    mark_map: dict = {}
    if mark_ids:
        m_resp = supabase.table("marks").select("id, assessment_id, raw_score").in_("id", mark_ids).execute()
        for m in (m_resp.data or []):
            mark_map[m["id"]] = m

    # Fetch assessments (to get course_id, name, type)
    assessment_ids = list({m.get("assessment_id") for m in mark_map.values() if m.get("assessment_id")})
    a_map: dict = {}
    if assessment_ids:
        a_resp = supabase.table("assessments").select("id, course_id, name, type, max_score").in_("id", assessment_ids).execute()
        for a in (a_resp.data or []):
            a_map[a["id"]] = a

    # Fetch courses
    course_ids = list({a.get("course_id") for a in a_map.values() if a.get("course_id")})
    c_map: dict = {}
    if course_ids:
        c_resp = supabase.table("courses").select("id, code, name").in_("id", course_ids).execute()
        for c in (c_resp.data or []):
            c_map[c["id"]] = {"code": c.get("code"), "name": c.get("name")}

    # Fetch students
    s_map: dict = {}
    if student_ids:
        s_resp = supabase.table("users").select("id, full_name, email").in_("id", student_ids).execute()
        for s in (s_resp.data or []):
            s_map[s["id"]] = {"full_name": s.get("full_name"), "email": s.get("email")}

    # Attach enriched data
    for q in queries:
        mark = mark_map.get(q.get("mark_id"), {})
        assessment = a_map.get(mark.get("assessment_id"), {})
        q["mark"] = mark
        q["assessments"] = {k: assessment.get(k) for k in ("name", "type", "max_score")} if assessment else {}
        q["courses"] = c_map.get(assessment.get("course_id"), {}) if assessment else {}
        q["student"] = s_map.get(q.get("student_id"), {})
        q["status"] = "RESOLVED" if q.get("resolved_at") else "OPEN"

    return queries


# ==================== Request Models ====================

class QueryCreateRequest(BaseModel):
    assessment_id: str
    query_text: str


class QueryRespondRequest(BaseModel):
    response: str


class QueryStatusRequest(BaseModel):
    status: str  # OPEN | RESOLVED


# ==================== Submit Query (student) ====================

@router.post("", status_code=status.HTTP_201_CREATED)
async def create_query(
    data: QueryCreateRequest,
    current_user=Depends(get_current_user),
):
    """Student submits a query about a specific mark."""
    _require_supabase()
    if current_user.get("role") != "student":
        raise HTTPException(status_code=403, detail="Only students can submit queries")

    try:
        # Look up the student's mark for the given assessment
        mark_resp = supabase.table("marks").select("id").eq("assessment_id", data.assessment_id).eq("student_id", current_user["user_id"]).execute()
        if not mark_resp.data:
            raise HTTPException(status_code=404, detail="No mark found for this assessment — you may not have a score yet")
        mark_id = mark_resp.data[0]["id"]

        new_query = {
            "mark_id": mark_id,
            "student_id": current_user["user_id"],
            "query_text": data.query_text,
        }
        resp = supabase.table("course_queries").insert(new_query).execute()
        if not resp.data:
            raise HTTPException(status_code=500, detail="Failed to submit query")

        AuditService.log("QUERY_SUBMITTED", current_user["user_id"], resp.data[0].get("id"))

        # Notify lecturer — resolve: assessment → course → lecturer
        try:
            a_resp = supabase.table("assessments").select("id, course_id, name").eq("id", data.assessment_id).execute()
            if a_resp.data:
                course_id = a_resp.data[0].get("course_id")
                assessment_name = a_resp.data[0].get("name", "")
                c_resp = supabase.table("courses").select("name, code, lecturer_id").eq("id", course_id).execute()
                if c_resp.data and c_resp.data[0].get("lecturer_id"):
                    lecturer_id = c_resp.data[0]["lecturer_id"]
                    course_name = f"{c_resp.data[0].get('code', '')} – {c_resp.data[0].get('name', '')}"
                    l_resp = supabase.table("users").select("email, full_name").eq("id", lecturer_id).execute()
                    if l_resp.data:
                        lecturer_email = l_resp.data[0]["email"]
                        lecturer_name = l_resp.data[0].get("full_name", "Lecturer")
                        student_name = current_user.get("full_name", "A student")
                        asyncio.create_task(EmailService.send_query_submitted(
                            lecturer_email, lecturer_name, student_name,
                            course_name, data.query_text,
                        ))
        except Exception as email_err:
            logger.warning(f"Query submitted email failed: {email_err}")

        return resp.data[0]

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating query: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to submit query")


# ==================== List Queries (role-based) ====================

@router.get("")
async def list_queries(
    resolved: Optional[bool] = Query(None),
    current_user=Depends(get_current_user),
):
    """
    List queries — role-based:
    - student: own queries only
    - lecturer: queries for their course marks
    - coordinator / HOD / admin: all queries
    """
    _require_supabase()

    try:
        role = current_user.get("role")
        user_id = current_user["user_id"]
        q = supabase.table("course_queries").select("*")

        if role == "student":
            q = q.eq("student_id", user_id)
        elif not has_effective_role(current_user, "coordinator", "hod", "admin"):
            # Lecturer: scope to marks in their courses
            courses_resp = supabase.table("courses").select("id").eq("lecturer_id", user_id).execute()
            course_ids = [c["id"] for c in (courses_resp.data or [])]
            if not course_ids:
                return {"queries": [], "count": 0}
            a_resp = supabase.table("assessments").select("id").in_("course_id", course_ids).execute()
            assessment_ids = [a["id"] for a in (a_resp.data or [])]
            if not assessment_ids:
                return {"queries": [], "count": 0}
            m_resp = supabase.table("marks").select("id").in_("assessment_id", assessment_ids).execute()
            mark_ids = [m["id"] for m in (m_resp.data or [])]
            if not mark_ids:
                return {"queries": [], "count": 0}
            q = q.in_("mark_id", mark_ids)

        if resolved is True:
            q = q.not_.is_("resolved_at", "null")
        elif resolved is False:
            q = q.is_("resolved_at", "null")

        resp = q.order("created_at", desc=True).execute()
        queries = _enrich_queries(resp.data or [])

        # Compute unread_count for the calling user
        unread_count = 0
        for qry in queries:
            if role == "student":
                # Student sees unread = responded queries not yet seen
                if not qry.get("is_read_by_student") and qry.get("lecturer_response"):
                    unread_count += 1
            else:
                # Lecturer/coordinator/admin sees unread = queries awaiting response
                if not qry.get("is_read_by_lecturer"):
                    unread_count += 1

        return {"queries": queries, "count": len(queries), "unread_count": unread_count}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error listing queries: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to fetch queries")


# ==================== Get Single Query ====================

@router.get("/{query_id}")
async def get_query(
    query_id: str,
    current_user=Depends(get_current_user),
):
    """Get a single query with enriched mark/assessment/course data."""
    _require_supabase()

    try:
        resp = supabase.table("course_queries").select("*").eq("id", query_id).execute()
        if not resp.data:
            raise HTTPException(status_code=404, detail="Query not found")

        qry = _enrich_queries(resp.data)[0]
        role = current_user.get("role")
        user_id = current_user["user_id"]

        if role == "student" and qry.get("student_id") != user_id:
            raise HTTPException(status_code=403, detail="Access denied")

        # Auto-mark read
        try:
            if role == "student" and not qry.get("is_read_by_student"):
                supabase.table("course_queries").update({"is_read_by_student": True}).eq("id", query_id).execute()
                qry["is_read_by_student"] = True
            elif role != "student" and not qry.get("is_read_by_lecturer"):
                supabase.table("course_queries").update({"is_read_by_lecturer": True}).eq("id", query_id).execute()
                qry["is_read_by_lecturer"] = True
        except Exception:
            pass  # non-critical

        return qry

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching query {query_id}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to fetch query")


# ==================== Respond to Query ====================

@router.post("/{query_id}/respond")
async def respond_to_query(
    query_id: str,
    data: QueryRespondRequest,
    current_user=Depends(get_current_user),
):
    """Lecturer / coordinator / admin responds — sets lecturer_response and resolved_at."""
    _require_supabase()

    if not has_effective_role(current_user, "lecturer", "coordinator", "hod", "admin"):
        raise HTTPException(status_code=403, detail="Only lecturers and above can respond to queries")

    try:
        qry_resp = supabase.table("course_queries").select("id, student_id, mark_id").eq("id", query_id).execute()
        if not qry_resp.data:
            raise HTTPException(status_code=404, detail="Query not found")

        query_row = qry_resp.data[0]
        now = datetime.now(timezone.utc).isoformat()
        resp = supabase.table("course_queries").update({
            "lecturer_response": data.response,
            "resolved_at": now,
            "is_read_by_lecturer": True,  # lecturer just wrote the response
            "is_read_by_student": False,  # student hasn't seen the response yet
        }).eq("id", query_id).execute()
        if not resp.data:
            raise HTTPException(status_code=500, detail="Failed to save response")

        AuditService.log("QUERY_RESPONDED", current_user["user_id"], query_id)

        # Notify student of response
        try:
            student_id = query_row.get("student_id")
            mark_id = query_row.get("mark_id")
            if student_id and mark_id:
                s_resp = supabase.table("users").select("email, full_name").eq("id", student_id).execute()
                m_resp = supabase.table("marks").select("assessment_id").eq("id", mark_id).execute()
                if s_resp.data and m_resp.data:
                    student_email = s_resp.data[0]["email"]
                    student_name = s_resp.data[0].get("full_name", "Student")
                    assessment_id = m_resp.data[0]["assessment_id"]
                    a_resp = supabase.table("assessments").select("course_id, name").eq("id", assessment_id).execute()
                    if a_resp.data:
                        course_id = a_resp.data[0]["course_id"]
                        c_resp = supabase.table("courses").select("name, code, lecturer_id").eq("id", course_id).execute()
                        if c_resp.data:
                            course_code = c_resp.data[0].get("code", "")
                            course_name = c_resp.data[0].get("name", "")
                            lecturer_id = c_resp.data[0].get("lecturer_id")
                            if lecturer_id:
                                l_resp = supabase.table("users").select("full_name").eq("id", lecturer_id).execute()
                                lecturer_name = l_resp.data[0].get("full_name", "Lecturer") if l_resp.data else "Lecturer"
                                asyncio.create_task(EmailService.send_query_response_notification(
                                    email=student_email,
                                    student_name=student_name,
                                    lecturer_name=lecturer_name,
                                    course_code=course_code,
                                    course_name=course_name,
                                    response_text=data.response,
                                ))
        except Exception as email_err:
            logger.warning(f"Query responded email failed: {email_err}")

        result = resp.data[0]
        result["status"] = "RESOLVED"
        return result

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error responding to query {query_id}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to respond to query")


# ==================== Update Query Status (reopen) ====================

@router.patch("/{query_id}/status")
async def update_query_status(
    query_id: str,
    data: QueryStatusRequest,
    current_user=Depends(get_current_user),
):
    """RESOLVED → set resolved_at; OPEN → clear resolved_at + lecturer_response (reopen)."""
    _require_supabase()

    new_status = data.status.upper()
    if new_status not in {"OPEN", "RESOLVED"}:
        raise HTTPException(status_code=400, detail="Status must be OPEN or RESOLVED")

    try:
        qry_resp = supabase.table("course_queries").select("id, student_id").eq("id", query_id).execute()
        if not qry_resp.data:
            raise HTTPException(status_code=404, detail="Query not found")

        user_id = current_user["user_id"]
        role = current_user.get("role")

        if role == "student" and qry_resp.data[0].get("student_id") != user_id:
            raise HTTPException(status_code=403, detail="Cannot update another student's query")

        if new_status == "RESOLVED":
            update = {"resolved_at": datetime.now(timezone.utc).isoformat()}
        else:
            update = {"resolved_at": None, "lecturer_response": None}

        resp = supabase.table("course_queries").update(update).eq("id", query_id).execute()
        if not resp.data:
            raise HTTPException(status_code=500, detail="Failed to update status")

        AuditService.log("QUERY_STATUS_CHANGED", user_id, query_id, {"status": new_status})
        result = resp.data[0]
        result["status"] = new_status
        return result

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating query status {query_id}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to update query status")


# ==================== Send Query Response Email ====================

@router.post("/{query_id}/send-email")
async def send_query_email(
    query_id: str,
    current_user=Depends(get_current_user),
):
    """Manually resend query response email to student"""
    _require_supabase()

    if not has_effective_role(current_user, "lecturer", "coordinator", "hod", "admin"):
        raise HTTPException(status_code=403, detail="Only lecturers and above can send emails")

    try:
        qry_resp = supabase.table("course_queries").select(
            "id, student_id, mark_id, lecturer_response"
        ).eq("id", query_id).execute()
        if not qry_resp.data:
            raise HTTPException(status_code=404, detail="Query not found")

        query_row = qry_resp.data[0]
        if not query_row.get("lecturer_response"):
            raise HTTPException(status_code=400, detail="No response to send yet")

        student_id = query_row.get("student_id")
        mark_id = query_row.get("mark_id")

        # Fetch student, mark, assessment, course, and lecturer info
        s_resp = supabase.table("users").select("email, full_name").eq("id", student_id).execute()
        m_resp = supabase.table("marks").select("assessment_id").eq("id", mark_id).execute()

        if not s_resp.data or not m_resp.data:
            raise HTTPException(status_code=400, detail="Student or mark not found")

        student_email = s_resp.data[0]["email"]
        student_name = s_resp.data[0].get("full_name", "Student")
        assessment_id = m_resp.data[0]["assessment_id"]

        a_resp = supabase.table("assessments").select("course_id").eq("id", assessment_id).execute()
        if not a_resp.data:
            raise HTTPException(status_code=400, detail="Assessment not found")

        course_id = a_resp.data[0]["course_id"]
        c_resp = supabase.table("courses").select("name, code, lecturer_id").eq("id", course_id).execute()

        if not c_resp.data:
            raise HTTPException(status_code=400, detail="Course not found")

        course_code = c_resp.data[0].get("code", "")
        course_name = c_resp.data[0].get("name", "")
        lecturer_id = c_resp.data[0].get("lecturer_id")

        if not lecturer_id:
            raise HTTPException(status_code=400, detail="No lecturer assigned to course")

        l_resp = supabase.table("users").select("full_name").eq("id", lecturer_id).execute()
        lecturer_name = l_resp.data[0].get("full_name", "Lecturer") if l_resp.data else "Lecturer"

        # Send email
        await EmailService.send_query_response_notification(
            email=student_email,
            student_name=student_name,
            lecturer_name=lecturer_name,
            course_code=course_code,
            course_name=course_name,
            response_text=query_row.get("lecturer_response", ""),
        )

        return {"message": "Email sent successfully"}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error sending query email for {query_id}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to send email")
