"""Active-session helpers — derive the current academic year / semester
from semester_timelines instead of guessing from the system clock.

An academic session is defined as a row in `semester_timelines` whose
(start_date, end_date) bracket today's date. If none is active, we fall
back to the most recent timeline row by (academic_year, semester) desc,
and only as a last resort do we synthesise from the calendar year.
"""
from __future__ import annotations

import logging
from datetime import date, datetime
from typing import Optional

from ..core.config import supabase

logger = logging.getLogger(__name__)


def _synthesise_academic_year(today: date) -> str:
    """Last-resort fallback when no semester_timelines rows exist.

    UTM sessions run ~Oct → Sep, so if the current month is ≥ Sept we are
    in session starting `YYYY/YYYY+1`, otherwise the session that started
    the previous September (`YYYY-1/YYYY`)."""
    if today.month >= 9:
        return f"{today.year}/{today.year + 1}"
    return f"{today.year - 1}/{today.year}"


def get_active_session(today: Optional[date] = None) -> dict:
    """Return `{academic_year, semester, source, timeline_id?}` for today.

    `source` is one of:
      - `"active"`       – we landed inside a start_date/end_date window
      - `"latest"`       – no window matched, used the newest configured row
      - `"synthesised"`  – no timelines configured; guessed from the clock
    """
    today = today or date.today()

    if supabase is not None:
        try:
            resp = (
                supabase.table("semester_timelines")
                .select("id, academic_year, semester, start_date, end_date")
                .lte("start_date", today.isoformat())
                .gte("end_date", today.isoformat())
                .order("start_date", desc=True)
                .limit(1)
                .execute()
            )
            if resp.data:
                row = resp.data[0]
                return {
                    "academic_year": row["academic_year"],
                    "semester": int(row["semester"]),
                    "source": "active",
                    "timeline_id": row["id"],
                }

            # fallback: latest configured session
            latest = (
                supabase.table("semester_timelines")
                .select("id, academic_year, semester")
                .order("academic_year", desc=True)
                .order("semester", desc=True)
                .limit(1)
                .execute()
            )
            if latest.data:
                row = latest.data[0]
                return {
                    "academic_year": row["academic_year"],
                    "semester": int(row["semester"]),
                    "source": "latest",
                    "timeline_id": row["id"],
                }
        except Exception as e:
            logger.warning(f"get_active_session: DB lookup failed ({e}); synthesising")

    return {
        "academic_year": _synthesise_academic_year(today),
        "semester": 1 if today.month >= 9 or today.month < 2 else 2,
        "source": "synthesised",
    }


def get_timeline_for(academic_year: str, semester: int) -> Optional[dict]:
    """Return the configured timeline row for a specific session, if any."""
    if supabase is None:
        return None
    try:
        resp = (
            supabase.table("semester_timelines")
            .select("*")
            .eq("academic_year", academic_year)
            .eq("semester", int(semester))
            .limit(1)
            .execute()
        )
        return resp.data[0] if resp.data else None
    except Exception as e:
        logger.warning(f"get_timeline_for({academic_year},{semester}) failed: {e}")
        return None


def is_grade_window_closed(academic_year: str, semester: int, today: Optional[date] = None) -> bool:
    """True when today > grade_submission_deadline for the given session.

    Used to lock mark edits once grades have been officially submitted.
    Returns False if no timeline configured (fail-open for developer setup)."""
    today = today or date.today()
    tl = get_timeline_for(academic_year, semester)
    if not tl or not tl.get("grade_submission_deadline"):
        return False
    try:
        deadline = datetime.fromisoformat(str(tl["grade_submission_deadline"])).date()
    except Exception:
        return False
    return today > deadline
