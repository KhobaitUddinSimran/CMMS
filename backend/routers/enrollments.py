"""Enrollment endpoints - Supabase Edition
Handles student enrollment, roster upload, and add/drop operations.
"""
import logging
import io
import random
import string
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status, Query, UploadFile, File
from pydantic import BaseModel
from typing import Optional
from ..core.config import supabase
from ..core.security import hash_password
from ..dependencies.auth import get_current_user, has_effective_role
from ..services.email_service import EmailService

router = APIRouter(prefix="/api/courses", tags=["enrollments"])
logger = logging.getLogger(__name__)


# ==================== Request Models ====================
class AddStudentRequest(BaseModel):
    student_email: str


# ==================== Helper Functions ====================
def _generate_otp(length: int = 6) -> str:
    """Generate a random numeric OTP"""
    return ''.join(random.choices(string.digits, k=length))


def _verify_course_access(course: dict, current_user: dict):
    """Verify user has access to the course.
    Admins, coordinators, and HODs have full access.
    Lecturers can only access courses they are assigned to.
    """
    user_role = current_user.get("role")
    user_id = current_user.get("user_id")
    special = set(current_user.get("special_roles", []) or [])
    # Full access for elevated roles (check both role and special_roles for JWT compatibility)
    if user_role in ("admin", "coordinator", "hod") or "coordinator" in special or "hod" in special:
        return
    # Lecturers: scope to their own assigned courses only
    if user_role == "lecturer" and course.get("lecturer_id") != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not assigned to this course"
        )


def _get_course_or_404(course_id: str) -> dict:
    """Fetch course from Supabase or raise 404"""
    response = supabase.table("courses").select("*").eq("id", course_id).execute()
    if not response.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Course not found")
    return response.data[0]


# ==================== List Enrolled Students ====================
@router.get("/{course_id}/students")
async def list_enrolled_students(
    course_id: str,
    current_user=Depends(get_current_user),
):
    """Get all students enrolled in a course (joined with user info)"""
    try:
        course = _get_course_or_404(course_id)
        _verify_course_access(course, current_user)

        # Get enrollments for this course
        enroll_resp = (
            supabase.table("enrollments")
            .select("*")
            .eq("course_id", course_id)
            .eq("status", "active")
            .execute()
        )
        enrollments = enroll_resp.data or []

        # Fetch user details for each enrolled student
        students = []
        for e in enrollments:
            user_resp = supabase.table("users").select("id, email, full_name").eq("id", e["student_id"]).execute()
            user = user_resp.data[0] if user_resp.data else {}
            students.append({
                "id": e.get("student_id"),
                "email": user.get("email", ""),
                "full_name": user.get("full_name", ""),
                "enrollment_date": e.get("enrolled_at") or e.get("created_at"),
                "status": e.get("status", "active"),
            })

        return students

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error listing students for course {course_id}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to list enrolled students")


# ==================== Get Course Enrollments (paginated) ====================
@router.get("/{course_id}/enrollments")
async def get_course_enrollments(
    course_id: str,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    status_filter: Optional[str] = Query(None, alias="status"),
    current_user=Depends(get_current_user),
):
    """List enrollments for a course with pagination"""
    try:
        course = _get_course_or_404(course_id)
        _verify_course_access(course, current_user)

        query = supabase.table("enrollments").select("*").eq("course_id", course_id)
        if status_filter:
            query = query.eq("status", status_filter)

        response = query.range(skip, skip + limit - 1).execute()
        enrollments = response.data or []

        # Get count
        count_query = supabase.table("enrollments").select("id", count="exact").eq("course_id", course_id)
        if status_filter:
            count_query = count_query.eq("status", status_filter)
        count_resp = count_query.execute()
        total = count_resp.count if hasattr(count_resp, "count") and count_resp.count else len(enrollments)

        return {"data": enrollments, "total": total, "skip": skip, "limit": limit}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error listing enrollments for course {course_id}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to list enrollments")


# ==================== Add Student to Course ====================
@router.post("/{course_id}/enrollments", status_code=status.HTTP_201_CREATED)
async def add_student_to_course(
    course_id: str,
    data: AddStudentRequest,
    current_user=Depends(get_current_user),
):
    """Add a student to a course by email"""
    if not has_effective_role(current_user, "lecturer", "coordinator", "admin"):
        raise HTTPException(status_code=403, detail="Insufficient permissions")

    try:
        course = _get_course_or_404(course_id)
        _verify_course_access(course, current_user)

        # Find student by email
        user_resp = supabase.table("users").select("*").eq("email", data.student_email).execute()
        if not user_resp.data:
            raise HTTPException(status_code=404, detail="Student not found with that email")

        student = user_resp.data[0]

        # Check not already enrolled
        existing = (
            supabase.table("enrollments")
            .select("id")
            .eq("student_id", student["id"])
            .eq("course_id", course_id)
            .eq("status", "active")
            .execute()
        )
        if existing.data:
            raise HTTPException(status_code=400, detail="Student is already enrolled in this course")

        # Create enrollment — include semester/academic_year to satisfy NOT NULL
        # constraints that exist in the base schema (pre-sprint2 migration)
        enrollment = {
            "student_id": student["id"],
            "course_id": course_id,
            "status": "active",
            "semester": course.get("semester") or 1,
            "academic_year": course.get("academic_year") or str(datetime.utcnow().year),
        }
        resp = supabase.table("enrollments").insert(enrollment).execute()

        enrolled_record = resp.data[0] if resp.data else {}
        return {
            "id": student["id"],
            "email": student["email"],
            "full_name": student.get("full_name", ""),
            "enrollment_date": enrolled_record.get("enrolled_at") or enrolled_record.get("created_at"),
            "status": "active",
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error adding student to course {course_id}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to add student")


# ==================== Drop Student from Course ====================
@router.delete("/{course_id}/enrollments/{student_id}")
async def drop_student_from_course(
    course_id: str,
    student_id: str,
    current_user=Depends(get_current_user),
):
    """Drop (soft-delete) a student from a course"""
    if not has_effective_role(current_user, "lecturer", "coordinator", "admin"):
        raise HTTPException(status_code=403, detail="Insufficient permissions")

    try:
        course = _get_course_or_404(course_id)
        _verify_course_access(course, current_user)

        # Update enrollment status to dropped
        resp = (
            supabase.table("enrollments")
            .update({"status": "dropped"})
            .eq("student_id", student_id)
            .eq("course_id", course_id)
            .eq("status", "active")
            .execute()
        )

        if not resp.data:
            raise HTTPException(status_code=404, detail="Active enrollment not found")

        return {"message": "Student dropped from course"}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error dropping student {student_id} from course {course_id}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to drop student")


# ==================== Roster Upload (Preview) ====================
@router.post("/{course_id}/roster/preview")
async def preview_roster_upload(
    course_id: str,
    file: UploadFile = File(...),
    current_user=Depends(get_current_user),
):
    """Upload Excel roster file for dry-run preview (no DB changes)"""
    if not has_effective_role(current_user, "lecturer", "coordinator", "hod", "admin"):
        raise HTTPException(status_code=403, detail="Only lecturers, coordinators, and admins can upload rosters")

    try:
        course = _get_course_or_404(course_id)
        _verify_course_access(course, current_user)

        # Validate file
        if not file.filename or not file.filename.endswith(('.xlsx', '.xls')):
            raise HTTPException(status_code=400, detail="File must be .xlsx or .xls")

        contents = await file.read()
        if len(contents) > 5 * 1024 * 1024:
            raise HTTPException(status_code=413, detail="File size exceeds 5MB limit")

        # Parse Excel
        import openpyxl
        wb = openpyxl.load_workbook(io.BytesIO(contents), read_only=True)
        ws = wb.active
        rows = list(ws.iter_rows(min_row=1, values_only=True))
        wb.close()

        if len(rows) < 2:
            raise HTTPException(status_code=400, detail="File must have a header row and at least one data row")

        # Parse headers (case-insensitive)
        headers = [str(h).strip().lower() if h else "" for h in rows[0]]
        
        # Map column indices
        col_map = {}
        for i, h in enumerate(headers):
            if h in ("student_id", "matric_number", "matric"):
                col_map["student_id"] = i
            elif h in ("email",):
                col_map["email"] = i
            elif h in ("first_name", "firstname"):
                col_map["first_name"] = i
            elif h in ("last_name", "lastname"):
                col_map["last_name"] = i
            elif h in ("full_name", "name"):
                col_map["full_name"] = i

        if "email" not in col_map:
            raise HTTPException(status_code=400, detail="Missing required column: email")

        # Process rows for preview
        students = []
        new_count = 0
        existing_count = 0
        error_count = 0

        for row_idx, row in enumerate(rows[1:], start=2):
            try:
                # Skip fully empty rows silently
                if not row or all(cell is None or str(cell).strip() == "" for cell in row):
                    continue

                email = str(row[col_map["email"]]).strip().lower() if row[col_map.get("email", 0)] else ""

                # Skip rows with empty email silently
                if not email:
                    continue

                # Validate email domain
                if not (email.endswith("@utm.my") or email.endswith("@graduate.utm.my")):
                    students.append({"student_id": "", "email": email, "first_name": "", "last_name": "", "status": "error", "error": f"Invalid email domain: {email}"})
                    error_count += 1
                    continue

                # Get name
                if "full_name" in col_map:
                    full_name = str(row[col_map["full_name"]]).strip() if row[col_map["full_name"]] else ""
                    parts = full_name.split(" ", 1)
                    first_name = parts[0]
                    last_name = parts[1] if len(parts) > 1 else ""
                else:
                    first_name = str(row[col_map.get("first_name", 0)]).strip() if col_map.get("first_name") is not None and row[col_map["first_name"]] else ""
                    last_name = str(row[col_map.get("last_name", 0)]).strip() if col_map.get("last_name") is not None and row[col_map["last_name"]] else ""

                matric = str(row[col_map.get("student_id", 0)]).strip() if col_map.get("student_id") is not None and row[col_map["student_id"]] else ""

                # Check if user exists in DB
                user_resp = supabase.table("users").select("id").eq("email", email).execute()
                if user_resp.data:
                    students.append({"student_id": matric, "email": email, "first_name": first_name, "last_name": last_name, "status": "existing"})
                    existing_count += 1
                else:
                    students.append({"student_id": matric, "email": email, "first_name": first_name, "last_name": last_name, "status": "new"})
                    new_count += 1

            except Exception as row_err:
                students.append({"student_id": "", "email": "", "first_name": "", "last_name": "", "status": "error", "error": f"Row {row_idx}: {str(row_err)}"})
                error_count += 1

        return {
            "students": students,
            "new_count": new_count,
            "existing_count": existing_count,
            "error_count": error_count,
            "summary": f"{new_count} new accounts will be created, {existing_count} existing linked",
            "total_rows": len(students),
        }

    except HTTPException:
        raise
    except ImportError:
        raise HTTPException(status_code=500, detail="openpyxl not installed. Run: pip install openpyxl")
    except Exception as e:
        logger.error(f"Error previewing roster for course {course_id}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to preview roster: {str(e)}")


# ==================== Roster Upload (Actual Import) ====================
@router.post("/{course_id}/roster/upload")
async def upload_roster(
    course_id: str,
    file: UploadFile = File(...),
    current_user=Depends(get_current_user),
):
    """Upload Excel roster and create accounts + enrollments.
    
    For each student row:
    - If email exists → link enrollment
    - If email is new → create user with OTP, send email, link enrollment
    """
    if not has_effective_role(current_user, "lecturer", "coordinator", "hod", "admin"):
        raise HTTPException(status_code=403, detail="Only lecturers, coordinators, and admins can upload rosters")

    try:
        course = _get_course_or_404(course_id)
        _verify_course_access(course, current_user)

        # Validate and parse file
        if not file.filename or not file.filename.endswith(('.xlsx', '.xls')):
            raise HTTPException(status_code=400, detail="File must be .xlsx or .xls")

        contents = await file.read()
        if len(contents) > 5 * 1024 * 1024:
            raise HTTPException(status_code=413, detail="File size exceeds 5MB limit")

        import openpyxl
        wb = openpyxl.load_workbook(io.BytesIO(contents), read_only=True)
        ws = wb.active
        rows = list(ws.iter_rows(min_row=1, values_only=True))
        wb.close()

        if len(rows) < 2:
            raise HTTPException(status_code=400, detail="File must have header + data rows")

        # Parse headers
        headers = [str(h).strip().lower() if h else "" for h in rows[0]]
        col_map = {}
        for i, h in enumerate(headers):
            if h in ("student_id", "matric_number", "matric"):
                col_map["student_id"] = i
            elif h in ("email",):
                col_map["email"] = i
            elif h in ("first_name", "firstname"):
                col_map["first_name"] = i
            elif h in ("last_name", "lastname"):
                col_map["last_name"] = i
            elif h in ("full_name", "name"):
                col_map["full_name"] = i

        if "email" not in col_map:
            raise HTTPException(status_code=400, detail="Missing required column: email")

        created_count = 0
        linked_count = 0
        errors = []
        student_emails_created = []

        for row_idx, row in enumerate(rows[1:], start=2):
            try:
                # Skip fully empty rows silently
                if not row or all(cell is None or str(cell).strip() == "" for cell in row):
                    continue

                email = str(row[col_map["email"]]).strip().lower() if row[col_map.get("email", 0)] else ""

                # Skip rows with empty email silently
                if not email:
                    continue

                if not (email.endswith("@utm.my") or email.endswith("@graduate.utm.my")):
                    errors.append(f"Row {row_idx}: Invalid email domain: {email}")
                    continue

                # Get name
                if "full_name" in col_map:
                    full_name = str(row[col_map["full_name"]]).strip() if row[col_map["full_name"]] else email.split("@")[0]
                else:
                    first = str(row[col_map.get("first_name", 0)]).strip() if col_map.get("first_name") is not None and row[col_map["first_name"]] else ""
                    last = str(row[col_map.get("last_name", 0)]).strip() if col_map.get("last_name") is not None and row[col_map["last_name"]] else ""
                    full_name = f"{first} {last}".strip() or email.split("@")[0]

                matric = str(row[col_map.get("student_id", 0)]).strip() if col_map.get("student_id") is not None and row[col_map["student_id"]] else None

                # Check if user exists
                user_resp = supabase.table("users").select("id").eq("email", email).execute()

                if user_resp.data:
                    # Existing user → just enroll
                    student_id = user_resp.data[0]["id"]
                    linked_count += 1
                else:
                    # New user → create account with OTP
                    otp = _generate_otp()
                    hashed = hash_password(otp)

                    new_user = {
                        "email": email,
                        "full_name": full_name,
                        "password_hash": hashed,
                        "role": "student",
                        "is_active": True,
                        "email_verified": False,
                        "approval_status": "approved",
                    }
                    if matric:
                        new_user["matric_number"] = matric

                    create_resp = supabase.table("users").insert(new_user).execute()
                    if not create_resp.data:
                        errors.append(f"Row {row_idx}: Failed to create account for {email}")
                        continue

                    student_id = create_resp.data[0]["id"]
                    created_count += 1
                    student_emails_created.append(email)

                    # Send OTP email (fire-and-forget)
                    try:
                        await EmailService.send_student_otp(email, otp, full_name)
                    except Exception as email_err:
                        logger.warning(f"Failed to send OTP email to {email}: {email_err}")

                # Create enrollment (skip if already active)
                existing_enroll = (
                    supabase.table("enrollments")
                    .select("id")
                    .eq("student_id", student_id)
                    .eq("course_id", course_id)
                    .eq("status", "active")
                    .execute()
                )
                if not existing_enroll.data:
                    supabase.table("enrollments").insert({
                        "student_id": student_id,
                        "course_id": course_id,
                        "status": "active",
                        "semester": course.get("semester") or 1,
                        "academic_year": course.get("academic_year") or str(datetime.utcnow().year),
                    }).execute()

            except Exception as row_err:
                errors.append(f"Row {row_idx}: {str(row_err)}")

        # Log audit
        try:
            supabase.table("audit_log").insert({
                "action": "ROSTER_UPLOADED",
                "actor_id": current_user.get("user_id"),
                "target_id": course_id,
                "metadata": {
                    "created": created_count,
                    "linked": linked_count,
                    "errors": len(errors),
                    "total": created_count + linked_count,
                },
            }).execute()
        except Exception:
            logger.warning("Failed to write audit log for roster upload")

        return {
            "success": len(errors) == 0,
            "accounts_created": created_count,
            "enrollments_linked": linked_count,
            "errors": len(errors),
            "error_details": errors,
            "message": f"Roster processed: {created_count} accounts created, {linked_count} existing linked, {len(errors)} errors",
            "student_emails": student_emails_created,
            "total_rows": created_count + linked_count + len(errors),
            "created_students": created_count,
            "existing_students": linked_count,
            "failed_students": len(errors),
        }

    except HTTPException:
        raise
    except ImportError:
        raise HTTPException(status_code=500, detail="openpyxl not installed. Run: pip install openpyxl")
    except Exception as e:
        logger.error(f"Error uploading roster for course {course_id}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to upload roster: {str(e)}")


# ==================== Roster Confirm (alias for upload) ====================
@router.post("/{course_id}/roster/confirm")
async def confirm_roster_import(
    course_id: str,
    current_user=Depends(get_current_user),
):
    """Confirm a previously previewed roster import. 
    In this implementation, the actual upload endpoint handles everything,
    so this just returns a success acknowledgement."""
    return {"message": "Import confirmed", "status": "complete"}
