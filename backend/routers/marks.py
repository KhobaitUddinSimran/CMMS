"""Mark endpoints - Supabase Edition"""
import logging
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status, Query
from pydantic import BaseModel
from typing import Optional, List
from ..core.config import supabase
from ..dependencies.auth import get_current_user, has_effective_role

router = APIRouter(prefix="/api/marks", tags=["marks"])
logger = logging.getLogger(__name__)


# ==================== Request Models ====================
class MarkCreateRequest(BaseModel):
    student_id: str
    course_id: str
    assessment_id: str
    score: Optional[float] = None
    is_delayed: str = "no"
    is_flagged: str = "no"
    flag_reason: Optional[str] = None


class MarkUpdateRequest(BaseModel):
    score: Optional[float] = None
    is_delayed: Optional[str] = None
    is_flagged: Optional[str] = None
    flag_reason: Optional[str] = None
    status: Optional[str] = None


class MarkPublishRequest(BaseModel):
    mark_ids: List[str]


class MarkBulkCreateRequest(BaseModel):
    assessment_id: str
    marks: List[dict]  # List of {student_id, score}


# ==================== Helpers ====================
def _verify_lecturer_course(course: dict, current_user: dict):
    """Verify lecturer is assigned to this course"""
    if current_user.get("role") == "lecturer" and course.get("lecturer_id") != current_user.get("user_id"):
        raise HTTPException(status_code=403, detail="You are not assigned to this course")


# ==================== Create Mark ====================
@router.post("", status_code=status.HTTP_201_CREATED)
async def create_mark(
    data: MarkCreateRequest,
    current_user=Depends(get_current_user),
):
    """Create a new mark - requires lecturer or admin role"""
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
            "course_id": data.course_id,
            "assessment_id": data.assessment_id,
            "score": data.score,
            "is_delayed": data.is_delayed,
            "is_flagged": data.is_flagged,
            "flag_reason": data.flag_reason,
            "status": "draft",
            "modified_by": current_user.get("user_id"),
        }

        resp = supabase.table("marks").insert(new_mark).execute()
        if not resp.data:
            raise HTTPException(status_code=500, detail="Failed to create mark")

        return resp.data[0]

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating mark: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to create mark")


# ==================== Get Mark ====================
@router.get("/{mark_id}")
async def get_mark(
    mark_id: str,
    current_user=Depends(get_current_user),
):
    """Get a specific mark"""
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
    if current_user.get("role") == "student" and current_user.get("user_id") != student_id:
        raise HTTPException(status_code=403, detail="Cannot view other student's marks")

    try:
        # Verify course exists
        course_resp = supabase.table("courses").select("*").eq("id", course_id).execute()
        if not course_resp.data:
            raise HTTPException(status_code=404, detail="Course not found")

        if current_user.get("role") == "lecturer":
            _verify_lecturer_course(course_resp.data[0], current_user)

        resp = (
            supabase.table("marks")
            .select("*")
            .eq("student_id", student_id)
            .eq("course_id", course_id)
            .execute()
        )
        marks = resp.data or []

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
    if not has_effective_role(current_user, "lecturer", "coordinator", "admin"):
        raise HTTPException(status_code=403, detail="Only lecturers and admins can update marks")

    try:
        # Get existing mark
        mark_resp = supabase.table("marks").select("*").eq("id", mark_id).execute()
        if not mark_resp.data:
            raise HTTPException(status_code=404, detail="Mark not found")

        mark = mark_resp.data[0]

        # Cannot update published marks
        if mark.get("status") == "published":
            raise HTTPException(status_code=400, detail="Cannot update published marks")

        # Verify course access
        if current_user.get("role") == "lecturer":
            course_resp = supabase.table("courses").select("*").eq("id", mark["course_id"]).execute()
            if course_resp.data:
                _verify_lecturer_course(course_resp.data[0], current_user)

        update_data = {k: v for k, v in data.model_dump(exclude_unset=True).items() if v is not None}
        update_data["modified_by"] = current_user.get("user_id")
        update_data["modified_at"] = datetime.utcnow().isoformat()

        resp = supabase.table("marks").update(update_data).eq("id", mark_id).execute()
        if not resp.data:
            raise HTTPException(status_code=500, detail="Failed to update mark")

        return resp.data[0]

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
    if not has_effective_role(current_user, "lecturer", "coordinator", "admin"):
        raise HTTPException(status_code=403, detail="Only lecturers and admins can publish marks")

    try:
        count = 0
        for mark_id in request.mark_ids:
            resp = (
                supabase.table("marks")
                .update({"status": "published", "modified_by": current_user.get("user_id"), "modified_at": datetime.utcnow().isoformat()})
                .eq("id", mark_id)
                .eq("status", "draft")
                .execute()
            )
            if resp.data:
                count += 1

        return {"message": f"Published {count} marks", "count": count}

    except Exception as e:
        logger.error(f"Error publishing marks: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to publish marks")


# ==================== Flag Mark ====================
@router.post("/{mark_id}/flag")
async def flag_mark(
    mark_id: str,
    reason: str = Query(...),
    current_user=Depends(get_current_user),
):
    """Flag a mark for review"""
    if not has_effective_role(current_user, "lecturer", "coordinator", "admin"):
        raise HTTPException(status_code=403, detail="Only lecturers and admins can flag marks")

    try:
        mark_resp = supabase.table("marks").select("id").eq("id", mark_id).execute()
        if not mark_resp.data:
            raise HTTPException(status_code=404, detail="Mark not found")

        resp = (
            supabase.table("marks")
            .update({"is_flagged": "yes", "flag_reason": reason})
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
    if current_user.get("role") == "student" and current_user.get("user_id") != student_id:
        raise HTTPException(status_code=403, detail="Cannot view other student's grades")

    try:
        # Get published marks with assessment info
        marks_resp = (
            supabase.table("marks")
            .select("*")
            .eq("student_id", student_id)
            .eq("course_id", course_id)
            .eq("status", "published")
            .execute()
        )
        marks = marks_resp.data or []

        if not marks:
            return {"student_id": student_id, "course_id": course_id, "grade": None}

        total_grade = 0.0
        for mark in marks:
            assessment_resp = supabase.table("assessments").select("max_score, weight_percentage").eq("id", mark["assessment_id"]).execute()
            if assessment_resp.data:
                a = assessment_resp.data[0]
                max_score = a.get("max_score", 100)
                weight = a.get("weight_percentage", 0)
                score = mark.get("score", 0) or 0
                normalized = (score / max_score) * 100 if max_score > 0 else 0
                total_grade += normalized * (weight / 100)

        return {
            "student_id": student_id,
            "course_id": course_id,
            "grade": round(total_grade, 2),
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error calculating grade: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to calculate grade")
