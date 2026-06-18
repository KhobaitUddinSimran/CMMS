"""Seed script: insert realistic audit/system log entries into Supabase."""
import os, sys, uuid
from datetime import datetime, timedelta, timezone
from pathlib import Path
from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parent.parent / "backend" / ".env")

from supabase import create_client

SUPABASE_URL = os.environ["SUPABASE_URL"]
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_KEY") or os.environ["SUPABASE_KEY"]
sb = create_client(SUPABASE_URL, SUPABASE_KEY)

# ── Fetch real actor UUIDs ────────────────────────────────────────────────────
def get_user(email):
    r = sb.table("users").select("id, full_name").ilike("email", email).execute()
    return (r.data[0]["id"], r.data[0]["full_name"]) if r.data else (None, None)

admin_id,      admin_name      = get_user("admin@utm.my")
lecturer_id,   lecturer_name   = get_user("lecturer@utm.my")
coord_id,      coord_name      = get_user("coordinator@utm.my")
hod_id,        hod_name        = get_user("hod@utm.my")
student_id,    student_name    = get_user("student@graduate.utm.my")

# Fetch first available course id
course_resp = sb.table("courses").select("id, name, code").limit(3).execute()
courses = course_resp.data or []
course_id   = courses[0]["id"]   if len(courses) > 0 else str(uuid.uuid4())
course_name = courses[0]["name"] if len(courses) > 0 else "SECJ3203"
course_id2  = courses[1]["id"]   if len(courses) > 1 else str(uuid.uuid4())
course_id3  = courses[2]["id"]   if len(courses) > 2 else str(uuid.uuid4())

# ── Helper ────────────────────────────────────────────────────────────────────
def ts(days_ago=0, hours_ago=0, minutes_ago=0):
    t = datetime.now(tz=timezone.utc) - timedelta(days=days_ago, hours=hours_ago, minutes=minutes_ago)
    return t.isoformat()

def entry(action, actor_id, entity_type=None, entity_id=None, new_values=None,
          old_values=None, ip="192.168.1.1", days_ago=0, hours_ago=0, minutes_ago=0):
    e = {
        "id": str(uuid.uuid4()),
        "action": action,
        "user_id": actor_id,
        "created_at": ts(days_ago, hours_ago, minutes_ago),
        "ip_address": ip,
    }
    if entity_type: e["entity_type"] = entity_type
    if entity_id:   e["entity_id"]   = str(entity_id)
    if new_values:  e["new_values"]  = new_values
    if old_values:  e["old_values"]  = old_values
    return e

# ── Build log entries ─────────────────────────────────────────────────────────
logs = [
    # ── Auth & signup events
    entry("USER_SIGNED_UP",       lecturer_id, "users", lecturer_id,
          {"email": "lecturer@utm.my", "role": "lecturer"},
          days_ago=14, ip="203.185.90.11"),

    entry("USER_SIGNED_UP",       None, "users", str(uuid.uuid4()),
          {"email": "dr.ali.hassan@utm.my", "role": "lecturer"},
          days_ago=3, ip="203.185.90.55"),

    entry("USER_SIGNED_UP",       None, "users", str(uuid.uuid4()),
          {"email": "siti.rahimah@utm.my", "role": "lecturer"},
          days_ago=2, hours_ago=5, ip="203.185.91.22"),

    entry("USER_SIGNED_UP",       None, "users", str(uuid.uuid4()),
          {"email": "nurul.ain@graduate.utm.my", "role": "student"},
          days_ago=1, hours_ago=3, ip="10.0.4.87"),

    # ── Admin approvals
    entry("USER_APPROVED",        admin_id, "users", lecturer_id,
          {"email": "lecturer@utm.my"},
          days_ago=13, ip="10.0.0.5"),

    entry("USER_APPROVED",        admin_id, "users", coord_id,
          {"email": "coordinator@utm.my"},
          days_ago=12, ip="10.0.0.5"),

    entry("USER_APPROVED",        admin_id, "users", hod_id,
          {"email": "hod@utm.my"},
          days_ago=12, hours_ago=2, ip="10.0.0.5"),

    entry("USER_REJECTED",        admin_id, "users", None,
          {"email": "spam.user@utm.my", "reason": "Unrecognised staff ID", "deleted": True},
          days_ago=5, ip="10.0.0.5"),

    # ── Role management
    entry("SPECIAL_ROLE_ASSIGNED", admin_id, "users", coord_id,
          {"role": "coordinator", "email": "coordinator@utm.my"},
          days_ago=11, ip="10.0.0.5"),

    entry("SPECIAL_ROLE_ASSIGNED", admin_id, "users", hod_id,
          {"role": "hod", "email": "hod@utm.my"},
          days_ago=11, hours_ago=1, ip="10.0.0.5"),

    entry("SPECIAL_ROLE_REVOKED", admin_id, "users", coord_id,
          {"role": "coordinator", "email": "ex.coordinator@utm.my"},
          days_ago=4, ip="10.0.0.5"),

    # ── Account toggles
    entry("USER_ACTIVATED",       admin_id, "users", student_id,
          {"email": "student@graduate.utm.my"},
          days_ago=10, ip="10.0.0.5"),

    entry("USER_DEACTIVATED",     admin_id, "users", str(uuid.uuid4()),
          {"email": "inactive.lecturer@utm.my", "reason": "Contract ended"},
          days_ago=6, ip="10.0.0.5"),

    # ── Course management
    entry("COURSE_CREATED",       coord_id, "courses", course_id,
          {"code": course_name, "name": course_name, "credits": 3},
          days_ago=10, hours_ago=4, ip="172.16.8.3"),

    entry("COURSE_CREATED",       coord_id, "courses", course_id2,
          {"code": "SECJ4233", "name": "Software Testing", "credits": 3},
          days_ago=9, ip="172.16.8.3"),

    entry("COURSE_UPDATED",       coord_id, "courses", course_id,
          {"max_students": 45},
          old_values={"max_students": 40},
          days_ago=7, ip="172.16.8.3"),

    entry("COURSE_UPDATED",       lecturer_id, "courses", course_id2,
          {"description": "Updated syllabus for 2025/2026"},
          days_ago=3, hours_ago=2, ip="172.16.9.11"),

    # ── Enrollment
    entry("ENROLLMENT_ADDED",     coord_id, "enrollments", str(uuid.uuid4()),
          {"student_email": "student@graduate.utm.my", "course": course_name},
          days_ago=8, ip="172.16.8.3"),

    entry("ENROLLMENT_ADDED",     coord_id, "enrollments", str(uuid.uuid4()),
          {"student_email": "nurul.ain@graduate.utm.my", "course": course_name},
          days_ago=7, hours_ago=1, ip="172.16.8.3"),

    entry("ENROLLMENT_DROPPED",   coord_id, "enrollments", str(uuid.uuid4()),
          {"student_email": "dropped.student@graduate.utm.my", "reason": "Withdrawal request"},
          days_ago=5, hours_ago=3, ip="172.16.8.3"),

    # ── Marks
    entry("MARK_UPDATED",         lecturer_id, "marks", str(uuid.uuid4()),
          {"assessment": "Midterm", "score": 72, "previous": 68},
          old_values={"score": 68},
          days_ago=4, hours_ago=5, ip="172.16.9.11"),

    entry("MARK_PUBLISHED",       lecturer_id, "marks", str(uuid.uuid4()),
          {"assessment": "Assignment 1", "published_count": 38, "course": course_name},
          days_ago=3, hours_ago=1, ip="172.16.9.11"),

    entry("MARK_PUBLISHED",       lecturer_id, "marks", str(uuid.uuid4()),
          {"assessment": "Lab Quiz 2", "published_count": 35, "course": "SECJ4233"},
          days_ago=2, hours_ago=2, ip="172.16.9.11"),

    entry("MARK_UNFLAGGED",       lecturer_id, "marks", str(uuid.uuid4()),
          {"student": "student@graduate.utm.my", "note": "Score verified correct"},
          days_ago=1, hours_ago=6, ip="172.16.9.11"),

    # ── Queries
    entry("QUERY_SUBMITTED",      student_id, "course_queries", str(uuid.uuid4()),
          {"course": course_name, "message": "Requesting re-check of midterm Q3"},
          days_ago=3, hours_ago=4, ip="10.0.4.55"),

    entry("QUERY_RESPONDED",      lecturer_id, "course_queries", str(uuid.uuid4()),
          {"response": "Score confirmed after re-marking. +2 marks awarded."},
          days_ago=2, hours_ago=8, ip="172.16.9.11"),

    entry("QUERY_STATUS_CHANGED", lecturer_id, "course_queries", str(uuid.uuid4()),
          {"status": "resolved", "course": course_name},
          days_ago=2, hours_ago=7, ip="172.16.9.11"),

    entry("QUERY_SUBMITTED",      student_id, "course_queries", str(uuid.uuid4()),
          {"course": "SECJ4233", "message": "Assignment 1 grade seems incorrect"},
          days_ago=1, hours_ago=2, ip="10.0.4.55"),

    # ── Roster
    entry("ROSTER_UPLOADED",      coord_id, "enrollments", course_id,
          {"filename": "roster_2025_sem2.xlsx", "rows_imported": 42, "course": course_name},
          days_ago=8, hours_ago=2, ip="172.16.8.3"),

    # ── Password / profile
    entry("PASSWORD_RESET",       student_id, "users", student_id,
          {"email": "student@graduate.utm.my"},
          days_ago=6, hours_ago=7, ip="10.0.4.55"),

    entry("PROFILE_UPDATED",      lecturer_id, "users", lecturer_id,
          {"field": "full_name"},
          days_ago=9, hours_ago=3, ip="172.16.9.11"),

    # ── Recent activity (last few hours)
    entry("USER_SIGNED_UP",       None, "users", str(uuid.uuid4()),
          {"email": "hafiz.zulkifli@graduate.utm.my", "role": "student"},
          hours_ago=2, ip="10.0.4.99"),

    entry("MARK_UPDATED",         lecturer_id, "marks", str(uuid.uuid4()),
          {"assessment": "Final Project", "score": 85},
          hours_ago=1, ip="172.16.9.11"),

    entry("QUERY_RESPONDED",      lecturer_id, "course_queries", str(uuid.uuid4()),
          {"response": "Please re-submit with supporting work shown."},
          minutes_ago=45, ip="172.16.9.11"),
]

# ── Insert ────────────────────────────────────────────────────────────────────
print(f"Inserting {len(logs)} audit log entries...")
sb.table("audit_logs").insert(logs).execute()
print(f"Done: {len(logs)} system log entries seeded.")
