"""Mark endpoints - Supabase Edition"""
import logging
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status, Query
from pydantic import BaseModel
from typing import Optional, List
from ..core.config import supabase
from ..dependencies.auth import get_current_user, has_effective_role
from ..services.audit_service import AuditService
from ..utils.session import is_grade_window_closed


# ==================== Letter-grade mapping (UTM standard) ====================
# Source: UTM Academic Regulations — percentage → letter grade table.
_LETTER_GRADE_TABLE = (
    (90, "A+", 4.00),
    (80, "A",  4.00),
    (75, "A-", 3.67),
    (70, "B+", 3.33),
    (65, "B",  3.00),
    (60, "B-", 2.67),
    (55, "C+", 2.33),
    (50, "C",  2.00),
    (45, "C-", 1.67),
    (40, "D+", 1.33),
    (35, "D",  1.00),
    (30, "D-", 0.67),
    (0,  "E",  0.00),
)
_PASS_THRESHOLD = 50  # UTM minimum pass mark for undergraduate engineering


def _letter_grade(percentage: float) -> dict:
    """Map a 0–100 percentage to UTM letter grade + GPA point."""
    for threshold, letter, gpa in _LETTER_GRADE_TABLE:
        if percentage >= threshold:
            return {"letter": letter, "gpa": gpa}
    return {"letter": "E", "gpa": 0.0}


def _assert_grade_window_open(course_id: str):
    """Raise 409 if the grade_submission_deadline for this course's session
    has already passed. Coordinators/admins can override elsewhere via the
    explicit unlock endpoints on the timeline itself."""
    try:
        c = supabase.table("courses").select("academic_year, semester").eq("id", course_id).execute()
        if not c.data:
            return
        course = c.data[0]
        if is_grade_window_closed(course.get("academic_year") or "", int(course.get("semester") or 0)):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Grade submission deadline has passed for this semester. "
                       "Contact the coordinator to re-open the window.",
            )
    except HTTPException:
        raise
    except Exception:
        # fail-open — don't block grading because the timeline lookup hiccuped
        pass

router = APIRouter(prefix="/api/marks", tags=["marks"])
logger = logging.getLogger(__name__)


# ==================== Request Models ====================
class MarkCreateRequest(BaseModel):
    student_id: str
    assessment_id: str
    raw_score: Optional[float] = None
    is_flagged: bool = False
    flag_note: Optional[str] = None


class MarkUpdateRequest(BaseModel):
    raw_score: Optional[float] = None
    is_flagged: Optional[bool] = None
    flag_note: Optional[str] = None
    status: Optional[str] = None


class MarkPublishRequest(BaseModel):
    mark_ids: List[str]
    reason: Optional[str] = None  # required for unpublish audit, optional for publish


class MarkBulkCreateRequest(BaseModel):
    assessment_id: str
    marks: List[dict]  # List of {student_id, score}


# ==================== Helpers ====================
def _require_supabase():
    """Raise 503 if Supabase client is not initialised."""
    if supabase is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database unavailable: Supabase not initialised. Check SUPABASE_URL and SUPABASE_SERVICE_KEY.",
        )


def _verify_lecturer_course(course: dict, current_user: dict):
    """Verify lecturer is assigned to this course (skip check for elevated roles)"""
    special = set(current_user.get("special_roles", []) or [])
    is_elevated = current_user.get("role") in ("coordinator", "hod", "admin") or "coordinator" in special or "hod" in special
    if not is_elevated and course.get("lecturer_id") != current_user.get("user_id"):
        raise HTTPException(status_code=403, detail="You are not assigned to this course")


# ==================== Get All Marks for a Course (Smart Grid) ====================
@router.get("/course/{course_id}")
async def get_all_course_marks(
    course_id: str,
    current_user=Depends(get_current_user),
):
    """Get all marks for all students in a course — used by the Smart Grid"""
    _require_supabase()
    if not has_effective_role(current_user, "lecturer", "coordinator", "hod", "admin"):
        raise HTTPException(status_code=403, detail="Insufficient permissions")
    try:
        # marks table has no course_id — join via assessments
        a_resp = supabase.table("assessments").select("id").eq("course_id", course_id).execute()
        assessment_ids = [a["id"] for a in (a_resp.data or [])]
        if not assessment_ids:
            return []
        resp = (
            supabase.table("marks")
            .select("*")
            .in_("assessment_id", assessment_ids)
            .range(0, 9999)
            .execute()
        )
        marks = resp.data or []
        # normalise raw_score → score for frontend compatibility
        for m in marks:
            if "score" not in m or m["score"] is None:
                m["score"] = m.get("raw_score")
        return marks
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting all marks for course {course_id}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to get course marks")


# ==================== Student Marks Summary (per-course) ====================
@router.get("/student/{student_id}/summary")
async def get_student_marks_summary(
    student_id: str,
    current_user=Depends(get_current_user),
):
    """Return published marks grouped by course with carry-total for a student."""
    _require_supabase()
    if current_user.get("role") == "student" and current_user.get("user_id") != student_id:
        raise HTTPException(status_code=403, detail="Cannot view other student's marks")
    try:
        marks_resp = (
            supabase.table("marks")
            .select("*, assessments(id, name, max_score, weight_percentage, type, course_id)")
            .eq("student_id", student_id)
            .eq("status", "published")
            .execute()
        )
        marks = marks_resp.data or []

        course_groups: dict = {}
        for mark in marks:
            assessment = mark.get("assessments") or {}
            course_id = assessment.get("course_id")  # course_id lives on assessment, not mark
            if not course_id:
                continue
            max_score = float(assessment.get("max_score") or 100)
            weight = float(assessment.get("weight_percentage") or 0)
            score = float(mark.get("raw_score") or mark.get("score") or 0)
            normalized = (score / max_score * 100) if max_score > 0 else 0
            weighted = normalized * (weight / 100)

            if course_id not in course_groups:
                course_groups[course_id] = {"course_id": course_id, "marks": [], "carry_total": 0.0}

            course_groups[course_id]["marks"].append({
                "assessment_name": assessment.get("name", "Unknown"),
                "assessment_type": assessment.get("type", ""),
                "score": score,
                "max_score": max_score,
                "weight_percentage": weight,
                "weighted_contribution": round(weighted, 2),
            })
            course_groups[course_id]["carry_total"] = round(
                course_groups[course_id]["carry_total"] + weighted, 2
            )

        return list(course_groups.values())
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting marks summary for student {student_id}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to get marks summary")


# ==================== Create Mark ====================
@router.post("", status_code=status.HTTP_201_CREATED)
async def create_mark(
    data: MarkCreateRequest,
    current_user=Depends(get_current_user),
):
    """Create a new mark - requires lecturer or admin role"""
    _require_supabase()
    if not has_effective_role(current_user, "lecturer", "coordinator", "admin"):
        raise HTTPException(status_code=403, detail="Only lecturers and admins can create marks")

    try:
        # Verify assessment exists
        assessment_resp = supabase.table("assessments").select("*").eq("id", data.assessment_id).execute()
        if not assessment_resp.data:
            raise HTTPException(status_code=404, detail="Assessment not found")

        assessment = assessment_resp.data[0]

        # Verify course access
        course_resp = supabase.table("courses").select("*").eq("id", assessment["course_id"]).execute()
        if not course_resp.data:
            raise HTTPException(status_code=404, detail="Course not found")
        _verify_lecturer_course(course_resp.data[0], current_user)

        new_mark = {
            "student_id": data.student_id,
            "assessment_id": data.assessment_id,
            "raw_score": data.raw_score,
            "is_flagged": data.is_flagged,
            "flag_note": data.flag_note,
            "status": "draft",
        }

        resp = supabase.table("marks").insert(new_mark).execute()
        if not resp.data:
            raise HTTPException(status_code=500, detail="Failed to create mark")

        mark = resp.data[0]
        if mark.get("score") is None:
            mark["score"] = mark.get("raw_score")
        return mark

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating mark: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to create mark")


# ==================== Flagged Marks (must be BEFORE /{mark_id}) ====================
@router.get("/flagged")
async def get_flagged_marks(
    course_id: Optional[str] = Query(None),
    current_user=Depends(get_current_user),
):
    """Return all flagged marks — coordinator / HOD / admin only"""
    _require_supabase()
    if not has_effective_role(current_user, "coordinator", "hod", "admin"):
        raise HTTPException(status_code=403, detail="Insufficient permissions")

    try:
        # Single query with embedded joins — eliminates N+1 round trips
        select_expr = (
            "*, "
            "users!marks_student_id_fkey(id, full_name, email), "
            "assessments!marks_assessment_id_fkey(id, name, type, max_score, weight_percentage, "
            "courses!assessments_course_id_fkey(id, code, name))"
        )
        q = supabase.table("marks").select(select_expr).eq("is_flagged", True)
        if course_id:
            a_filter = supabase.table("assessments").select("id").eq("course_id", course_id).execute()
            aid_list = [a["id"] for a in (a_filter.data or [])]
            if not aid_list:
                return {"flagged_marks": [], "count": 0}
            q = q.in_("assessment_id", aid_list)
        resp = q.order("updated_at", desc=True).execute()
        marks_data = resp.data or []

        # Remap embedded join keys to maintain backward-compatible response shape
        for m in marks_data:
            m["student"] = m.pop("users", {}) or {}
            a_info = m.pop("assessments", {}) or {}
            m["courses"] = a_info.pop("courses", {}) or {}
            m["assessments"] = {k: a_info.get(k) for k in ("name", "type", "max_score", "weight_percentage")}

        return {"flagged_marks": marks_data, "count": len(marks_data)}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching flagged marks: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to fetch flagged marks")


# ==================== Unflag Mark ====================
@router.post("/{mark_id}/unflag")
async def unflag_mark(
    mark_id: str,
    current_user=Depends(get_current_user),
):
    """Clear flag on a mark — coordinator / HOD / admin only"""
    _require_supabase()
    if not has_effective_role(current_user, "coordinator", "hod", "admin"):
        raise HTTPException(status_code=403, detail="Insufficient permissions")

    try:
        mark_resp = supabase.table("marks").select("id").eq("id", mark_id).execute()
        if not mark_resp.data:
            raise HTTPException(status_code=404, detail="Mark not found")

        resp = (
            supabase.table("marks")
            .update({"is_flagged": False, "flag_note": None})
            .eq("id", mark_id)
            .execute()
        )
        if not resp.data:
            raise HTTPException(status_code=500, detail="Failed to unflag mark")

        AuditService.log("MARK_UNFLAGGED", current_user["user_id"], mark_id)
        return resp.data[0]

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error unflagging mark {mark_id}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to unflag mark")


# ==================== Get Mark ====================
@router.get("/{mark_id}")
async def get_mark(
    mark_id: str,
    current_user=Depends(get_current_user),
):
    """Get a specific mark"""
    _require_supabase()
    try:
        resp = supabase.table("marks").select("*").eq("id", mark_id).execute()
        if not resp.data:
            raise HTTPException(status_code=404, detail="Mark not found")

        mark = resp.data[0]

        # Students can only view their own marks
        if current_user.get("role") == "student" and mark.get("student_id") != current_user.get("user_id"):
            raise HTTPException(status_code=403, detail="Cannot view other student's marks")

        return mark

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting mark {mark_id}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to get mark")


# ==================== List Marks for Assessment ====================
@router.get("/assessment/{assessment_id}")
async def list_assessment_marks(
    assessment_id: str,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    current_user=Depends(get_current_user),
):
    """List marks for an assessment"""
    _require_supabase()
    try:
        # Verify assessment exists
        assessment_resp = supabase.table("assessments").select("*").eq("id", assessment_id).execute()
        if not assessment_resp.data:
            raise HTTPException(status_code=404, detail="Assessment not found")

        assessment = assessment_resp.data[0]

        # Verify access
        if current_user.get("role") == "lecturer":
            course_resp = supabase.table("courses").select("*").eq("id", assessment["course_id"]).execute()
            if course_resp.data:
                _verify_lecturer_course(course_resp.data[0], current_user)
        elif current_user.get("role") == "student":
            raise HTTPException(status_code=403, detail="Students cannot view all marks for an assessment")

        resp = supabase.table("marks").select("*").eq("assessment_id", assessment_id).range(skip, skip + limit - 1).execute()
        marks = resp.data or []

        count_resp = supabase.table("marks").select("id", count="exact").eq("assessment_id", assessment_id).execute()
        total = count_resp.count if hasattr(count_resp, "count") and count_resp.count else len(marks)

        return {"data": marks, "total": total, "skip": skip, "limit": limit}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error listing marks for assessment {assessment_id}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to list marks")


# ==================== Student Course Marks ====================
@router.get("/course/{course_id}/student/{student_id}")
async def get_student_course_marks(
    course_id: str,
    student_id: str,
    current_user=Depends(get_current_user),
):
    """Get all marks for a student in a course"""
    _require_supabase()
    if current_user.get("role") == "student" and current_user.get("user_id") != student_id:
        raise HTTPException(status_code=403, detail="Cannot view other student's marks")

    try:
        # Verify course exists
        course_resp = supabase.table("courses").select("*").eq("id", course_id).execute()
        if not course_resp.data:
            raise HTTPException(status_code=404, detail="Course not found")

        if current_user.get("role") == "lecturer":
            _verify_lecturer_course(course_resp.data[0], current_user)

        # marks has no course_id — filter via assessments
        a_resp = supabase.table("assessments").select("id").eq("course_id", course_id).execute()
        assessment_ids = [a["id"] for a in (a_resp.data or [])]
        if not assessment_ids:
            return {"data": [], "count": 0}

        resp = (
            supabase.table("marks")
            .select("*")
            .eq("student_id", student_id)
            .in_("assessment_id", assessment_ids)
            .execute()
        )
        marks = resp.data or []
        for m in marks:
            if "score" not in m or m["score"] is None:
                m["score"] = m.get("raw_score")

        return {"data": marks, "count": len(marks)}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting marks for student {student_id} in course {course_id}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to get student marks")


# ==================== Update Mark ====================
@router.put("/{mark_id}")
async def update_mark(
    mark_id: str,
    data: MarkUpdateRequest,
    current_user=Depends(get_current_user),
):
    """Update a mark - requires lecturer or admin role"""
    _require_supabase()
    if not has_effective_role(current_user, "lecturer", "coordinator", "admin"):
        raise HTTPException(status_code=403, detail="Only lecturers and admins can update marks")

    try:
        # Get existing mark
        mark_resp = supabase.table("marks").select("*").eq("id", mark_id).execute()
        if not mark_resp.data:
            raise HTTPException(status_code=404, detail="Mark not found")

        mark = mark_resp.data[0]

        # Cannot update published marks — must be unpublished via coordinator first
        if mark.get("status") == "published":
            raise HTTPException(status_code=400, detail="Cannot update published marks. Ask the coordinator to unpublish first.")

        # Enforce the semester-end grade submission deadline
        a_cid_resp = supabase.table("assessments").select("course_id").eq("id", mark["assessment_id"]).execute()
        if a_cid_resp.data:
            _assert_grade_window_open(a_cid_resp.data[0].get("course_id"))

        # Verify course access for lecturers via assessment
        if current_user.get("role") == "lecturer":
            a_resp = supabase.table("assessments").select("course_id").eq("id", mark["assessment_id"]).execute()
            if a_resp.data:
                cid = a_resp.data[0].get("course_id")
                course_resp = supabase.table("courses").select("*").eq("id", cid).execute()
                if course_resp.data:
                    _verify_lecturer_course(course_resp.data[0], current_user)

        # Use exclude_unset but keep explicit None/0 values (e.g. clearing a score)
        update_data = {k: v for k, v in data.model_dump(exclude_unset=True).items()}
        # Remove None-valued keys only for non-score fields to allow score=0
        update_data = {k: v for k, v in update_data.items() if v is not None or k == "raw_score"}
        if not update_data:
            # Nothing to update — return existing mark
            return mark

        resp = supabase.table("marks").update(update_data).eq("id", mark_id).execute()
        if not resp.data:
            raise HTTPException(status_code=500, detail="Failed to update mark")

        updated = resp.data[0]
        if updated.get("score") is None:
            updated["score"] = updated.get("raw_score")
        return updated

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating mark {mark_id}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to update mark")


# ==================== Publish Marks ====================
@router.post("/publish", status_code=status.HTTP_200_OK)
async def publish_marks(
    request: MarkPublishRequest,
    current_user=Depends(get_current_user),
):
    """Publish multiple marks - requires lecturer or admin role"""
    _require_supabase()
    if not has_effective_role(current_user, "lecturer", "coordinator", "admin"):
        raise HTTPException(status_code=403, detail="Only lecturers and admins can publish marks")

    try:
        if not request.mark_ids:
            return {"message": "No marks to publish", "count": 0}
        resp = (
            supabase.table("marks")
            .update({"status": "published"})
            .in_("id", request.mark_ids)
            .eq("status", "draft")
            .execute()
        )
        count = len(resp.data or [])
        AuditService.log(
            "MARKS_PUBLISHED", current_user.get("user_id"), None,
            metadata={"count": count, "mark_ids": request.mark_ids},
        )
        return {"message": f"Published {count} marks", "count": count}

    except Exception as e:
        logger.error(f"Error publishing marks: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to publish marks")


# ==================== Unpublish Marks (revert to draft) ====================
@router.post("/unpublish", status_code=status.HTTP_200_OK)
async def unpublish_marks(
    request: MarkPublishRequest,
    current_user=Depends(get_current_user),
):
    """Revert published marks back to draft so they can be corrected and re-published.
    Only coordinators or admins can unpublish — lecturers must request it via
    a coordinator to create an audit trail of who reopened the grade."""
    _require_supabase()
    if not has_effective_role(current_user, "coordinator", "admin"):
        raise HTTPException(status_code=403, detail="Only coordinators and admins can unpublish marks")

    reason = (getattr(request, "reason", None) or "").strip() if hasattr(request, "reason") else ""
    try:
        count = 0
        for mark_id in request.mark_ids:
            resp = (
                supabase.table("marks")
                .update({"status": "draft"})
                .eq("id", mark_id)
                .eq("status", "published")
                .execute()
            )
            if resp.data:
                count += 1

        AuditService.log(
            "MARKS_UNPUBLISHED", current_user.get("user_id"), None,
            metadata={"count": count, "mark_ids": request.mark_ids, "reason": reason or None},
        )
        return {"message": f"Reverted {count} mark{'' if count == 1 else 's'} to draft", "count": count}

    except Exception as e:
        logger.error(f"Error unpublishing marks: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to unpublish marks")


# ==================== Flag Mark ====================
@router.post("/{mark_id}/flag")
async def flag_mark(
    mark_id: str,
    reason: str = Query(...),
    current_user=Depends(get_current_user),
):
    """Flag a mark for review"""
    _require_supabase()
    if not has_effective_role(current_user, "lecturer", "coordinator", "admin"):
        raise HTTPException(status_code=403, detail="Only lecturers and admins can flag marks")

    try:
        mark_resp = supabase.table("marks").select("id").eq("id", mark_id).execute()
        if not mark_resp.data:
            raise HTTPException(status_code=404, detail="Mark not found")

        resp = (
            supabase.table("marks")
            .update({"is_flagged": True, "flag_note": reason})
            .eq("id", mark_id)
            .execute()
        )
        if not resp.data:
            raise HTTPException(status_code=500, detail="Failed to flag mark")

        return resp.data[0]

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error flagging mark {mark_id}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to flag mark")


# ==================== Student Course Grade ====================
@router.get("/course/{course_id}/student/{student_id}/grade")
async def get_student_course_grade(
    course_id: str,
    student_id: str,
    current_user=Depends(get_current_user),
):
    """Get final carry mark total for a student in a course"""
    _require_supabase()
    if current_user.get("role") == "student" and current_user.get("user_id") != student_id:
        raise HTTPException(status_code=403, detail="Cannot view other student's grades")

    try:
        # Scope to this course's assessments only
        a_resp = supabase.table("assessments").select("id, name, max_score, weight_percentage").eq("course_id", course_id).execute()
        course_assessments = {a["id"]: a for a in (a_resp.data or [])}
        if not course_assessments:
            return {
                "student_id": student_id, "course_id": course_id,
                "grade": None, "letter_grade": None, "gpa": None,
                "weight_graded": 0, "weight_remaining": 0, "is_at_risk": False,
                "is_final": False, "marks": [],
            }

        marks_resp = (
            supabase.table("marks")
            .select("*")
            .eq("student_id", student_id)
            .eq("status", "published")
            .in_("assessment_id", list(course_assessments.keys()))
            .execute()
        )
        marks = marks_resp.data or []

        total_weight = sum(float(a.get("weight_percentage") or 0) for a in course_assessments.values())
        weighted_sum = 0.0
        weight_graded = 0.0
        breakdown = []

        for mark in marks:
            a = course_assessments.get(mark["assessment_id"])
            if not a:
                continue
            max_score = float(a.get("max_score") or 100)
            weight = float(a.get("weight_percentage") or 0)
            score = float(mark.get("raw_score") or mark.get("score") or 0)
            normalised = (score / max_score) * 100 if max_score > 0 else 0
            contribution = normalised * (weight / 100)
            weighted_sum += contribution
            weight_graded += weight
            breakdown.append({
                "assessment_id": a["id"],
                "name": a.get("name"),
                "score": score,
                "max_score": max_score,
                "weight_percentage": weight,
                "normalised_score": round(normalised, 2),
                "weighted_contribution": round(contribution, 2),
            })

        weight_remaining = max(0.0, total_weight - weight_graded)
        is_final = weight_graded >= total_weight > 0
        # Current total: weighted sum so far. Projected best-case: assume full
        # marks on remaining weight. Projected worst-case: zero on remainder.
        projected_best = weighted_sum + weight_remaining  # 100% of remaining
        # At-risk: if even scoring 100% on every remaining assessment, the
        # student still cannot cross the pass threshold.
        is_at_risk = (not is_final) and projected_best < _PASS_THRESHOLD
        # Final at-risk: already graded everything and still below threshold.
        if is_final and weighted_sum < _PASS_THRESHOLD:
            is_at_risk = True

        final_pct = round(weighted_sum, 2) if is_final else None
        letter_info = _letter_grade(weighted_sum) if is_final else None

        return {
            "student_id": student_id,
            "course_id": course_id,
            "grade": round(weighted_sum, 2),                 # current carry-mark
            "final_percentage": final_pct,                    # only set when is_final
            "letter_grade": letter_info["letter"] if letter_info else None,
            "gpa": letter_info["gpa"] if letter_info else None,
            "weight_graded": round(weight_graded, 2),
            "weight_remaining": round(weight_remaining, 2),
            "projected_maximum": round(projected_best, 2),
            "is_final": is_final,
            "is_at_risk": is_at_risk,
            "pass_threshold": _PASS_THRESHOLD,
            "marks": breakdown,
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error calculating grade: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to calculate grade")
