"""Comprehensive email service test — covers every EmailService method."""
import asyncio
import os
import sys
from pathlib import Path

backend_dir = Path(__file__).parent
sys.path.insert(0, str(backend_dir))

from services.email_service import EmailService, _get_brevo_config

TO = "khobaituddinsimran@gmail.com"

CASES = [
    # (label, coroutine_factory)
    (
        "1. Auth — Student signup (send_verification_email)",
        lambda: EmailService.send_verification_email(TO, "Test Student", "tok_abc123"),
    ),
    (
        "2. Auth — Lecturer signup (send_signup_confirmation)",
        lambda: EmailService.send_signup_confirmation(TO, "Test Lecturer", "lecturer"),
    ),
    (
        "3. Auth — Password reset link (send_password_reset)",
        lambda: EmailService.send_password_reset(TO, "http://localhost:3000/auth/password-reset?token=tok_xyz"),
    ),
    (
        "4. Auth — Email verified / welcome (send_approval_email via verify-email)",
        lambda: EmailService.send_approval_email(TO, "Test Student"),
    ),
    (
        "5. Auth — Resend verification email (send_verification_email again)",
        lambda: EmailService.send_verification_email(TO, "Test Student", "tok_resend999"),
    ),
    (
        "6. Admin — Approve user (send_approval_email)",
        lambda: EmailService.send_approval_email(TO, "Test Lecturer"),
    ),
    (
        "7. Admin — Reject user (send_rejection_email)",
        lambda: EmailService.send_rejection_email(TO, "Test Lecturer", "Insufficient credentials provided."),
    ),
    (
        "8. Marks — Publish marks (send_marks_published)",
        lambda: EmailService.send_marks_published(TO, "Test Student", "SECP3113 – Software Engineering"),
    ),
    (
        "9. Marks — Flag mark, single (send_flagged_mark_notification)",
        lambda: EmailService.send_flagged_mark_notification(
            TO, "Dr. Lecturer", "Test Student",
            "SECP3113", "Software Engineering", "Assignment 1",
            raw_score=45.0, max_score=50.0, flag_reason="Score unusually high relative to class average",
        ),
    ),
    (
        "10. Marks — Flag mark, bulk path (send_flagged_mark_notification)",
        lambda: EmailService.send_flagged_mark_notification(
            TO, "Dr. Lecturer", "Another Student",
            "SCSV3483", "Data Structures", "Quiz 2",
            raw_score=2.0, max_score=20.0, flag_reason="AI anomaly detected — score is 3 SD below mean",
        ),
    ),
    (
        "11. Queries — Student submits query (send_query_submitted)",
        lambda: EmailService.send_query_submitted(
            TO, "Dr. Lecturer", "Test Student",
            "SECP3113 – Software Engineering",
            "I believe my Assignment 1 mark is incorrect. I scored full marks in the demo.",
        ),
    ),
    (
        "12. Queries — Lecturer responds (send_query_response_notification)",
        lambda: EmailService.send_query_response_notification(
            TO, "Test Student", "Dr. Lecturer",
            "SECP3113", "Software Engineering",
            "I have reviewed your submission and updated the mark. Please check your updated score.",
        ),
    ),
    (
        "13. Queries — Manual resend response email (send_query_response_notification)",
        lambda: EmailService.send_query_response_notification(
            TO, "Test Student", "Dr. Lecturer",
            "SECP3113", "Software Engineering",
            "[Resent] I have reviewed your submission and updated the mark.",
        ),
    ),
    (
        "14. Enrollments — Roster import creates student (send_student_otp)",
        lambda: EmailService.send_student_otp(TO, "OTP_INVITE_TOKEN_123", "Test Student"),
    ),
    (
        "15. Semester — Manual deadline reminder (send_deadline_reminder)",
        lambda: EmailService.send_deadline_reminder(
            TO, "Dr. Lecturer",
            academic_year="2024/2025", semester=2,
            start_date="2025-03-01", end_date="2025-07-31",
            grade_submission_deadline="2025-07-15",
            notes="Please ensure all marks are submitted before the deadline.",
            courses=["SECP3113 – Software Engineering", "SCSV3483 – Data Structures"],
        ),
    ),
]


async def run_all():
    cfg = _get_brevo_config()
    print("=" * 60)
    print("  CMMS Email Service — Full Test Suite")
    print("=" * 60)
    print(f"  From : {cfg.from_address or '(not set)'}")
    print(f"  To   : {TO}")
    print(f"  Brevo configured: {'YES ✓' if cfg.is_configured else 'NO — set BREVO_API_KEY + EMAIL_FROM_ADDRESS'}")
    print("=" * 60)
    print()

    passed = failed = skipped = 0

    for label, factory in CASES:
        print(f"  {label}")
        try:
            result = await factory()
            if result:
                print(f"    ✅  SENT\n")
                passed += 1
            else:
                print(f"    ⚠️   SKIPPED (Brevo not configured or returned False)\n")
                skipped += 1
        except Exception as exc:
            print(f"    ❌  FAILED — {type(exc).__name__}: {exc}\n")
            failed += 1

    total = len(CASES)
    print("=" * 60)
    print(f"  Results: {passed}/{total} sent  |  {skipped} skipped  |  {failed} failed")
    print("=" * 60)

    if not cfg.is_configured:
        print()
        print("  ℹ  To actually send emails, add to backend/.env:")
        print("     BREVO_API_KEY=<your-key>")
        print("     EMAIL_FROM_ADDRESS=khobaituddinsimran@gmail.com")


if __name__ == "__main__":
    asyncio.run(run_all())
