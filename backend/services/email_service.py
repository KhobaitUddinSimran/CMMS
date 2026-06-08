"""Email service using Resend API"""
import logging
import os
import asyncio
from pathlib import Path
from dotenv import load_dotenv

logger = logging.getLogger(__name__)

backend_dir = Path(__file__).parent.parent
load_dotenv(backend_dir / '.env')

_resend_api_key: str | None = None
_resend_from: str | None = None

def _get_resend_config() -> tuple[str | None, str]:
    """Lazy-load Resend config from env vars."""
    global _resend_api_key, _resend_from
    if _resend_api_key is None:
        _resend_api_key = os.getenv('RESEND_API_KEY', '').strip() or None
        _resend_from = os.getenv('RESEND_FROM_EMAIL', 'CMMS <onboarding@resend.dev>').strip()
        logger.info(f"Resend config: from={_resend_from}, configured={bool(_resend_api_key)}")
    return _resend_api_key, _resend_from or 'CMMS <onboarding@resend.dev>'

def _is_configured() -> bool:
    key, _ = _get_resend_config()
    return bool(key)

_FOOTER = """
<hr style="margin:32px 0 16px;border:none;border-top:1px solid #E5E7EB;"/>
<p style="font-size:12px;color:#9CA3AF;margin:0;">
    Carry Mark Management System (CMMS) &nbsp;·&nbsp; Universiti Teknologi Malaysia
</p>
"""

def _get_frontend_url() -> str:
    """Get the frontend URL from environment or config."""
    # Try to extract first URL if CORS_ORIGINS is a comma-separated list
    cors_origins = os.getenv('CORS_ORIGINS', '')
    if cors_origins:
        # Take the first URL if multiple are provided
        first_url = cors_origins.split(',')[0].strip()
        if first_url:
            return first_url
    return os.getenv('FRONTEND_URL', 'http://localhost:3000')

def _send_resend(to: str, subject: str, html: str) -> bool:
    """Blocking Resend API call — runs in asyncio.to_thread."""
    import resend as resend_sdk
    api_key, from_addr = _get_resend_config()
    resend_sdk.api_key = api_key
    resend_sdk.Emails.send({
        "from": from_addr,
        "to": [to],
        "subject": subject,
        "html": html,
    })
    return True

async def _send(to: str, subject: str, html: str) -> bool:
    """Async wrapper around Resend API send."""
    if not _is_configured():
        logger.warning(f"RESEND_API_KEY not set — skipping email to {to}")
        return False
    try:
        logger.info(f"Sending email '{subject}' to {to}...")
        await asyncio.to_thread(_send_resend, to, subject, html)
        logger.info(f"✓ Email '{subject}' sent to {to}")
        return True
    except Exception as exc:
        logger.error(f"✗ Failed to send '{subject}' to {to}: {type(exc).__name__}: {exc}", exc_info=True)
        return False


class EmailService:
    @staticmethod
    async def send_otp(email: str, otp: str, expires_in_minutes: int = 15):
        """Send OTP via email for password reset"""
        subject = "Your CMMS Password Reset Code"
        html = f"""
        <h2 style="color:#0F172A;">Password Reset Code</h2>
        <p>You requested a password reset for your CMMS account.</p>
        <p>Your one-time code is:</p>
        <div style="font-size:36px;font-weight:bold;letter-spacing:10px;color:#C90031;
                    background:#FFF1F2;padding:16px 24px;border-radius:8px;
                    display:inline-block;margin:12px 0;">
            {otp}
        </div>
        <p style="color:#6B7280;font-size:13px;">This code expires in <strong>{expires_in_minutes} minutes</strong>.</p>
        <p>If you didn't request this, you can safely ignore this email.</p>
        {_FOOTER}
        """
        return await _send(email, subject, html)

    @staticmethod
    async def send_student_otp(email: str, otp: str, student_name: str = "Student"):
        """Send OTP to new student account"""
        subject = "Welcome to CMMS – Your Login Code"
        html = f"""
        <h2 style="color:#0F172A;">Welcome to CMMS!</h2>
        <p>Hi {student_name},</p>
        <p>Your CMMS student account has been created. Use this one-time code to log in for the first time:</p>
        <div style="font-size:36px;font-weight:bold;letter-spacing:10px;color:#C90031;
                    background:#FFF1F2;padding:16px 24px;border-radius:8px;
                    display:inline-block;margin:12px 0;">
            {otp}
        </div>
        <p style="color:#6B7280;font-size:13px;">This code expires in <strong>24 hours</strong>.</p>
        {_FOOTER}
        """
        return await _send(email, subject, html)

    @staticmethod
    async def send_marks_published(email: str, student_name: str, course_name: str):
        """Notify student that marks have been published"""
        frontend_url = _get_frontend_url()
        subject = f"Marks Published – {course_name}"
        html = f"""
        <h2 style="color:#0F172A;">Marks Published</h2>
        <p>Hi {student_name},</p>
        <p>Your marks for <strong>{course_name}</strong> have been published and are now available.</p>
        <p style="margin:24px 0;">
            <a href="{frontend_url}/marks"
               style="background:#C90031;color:#fff;padding:12px 24px;border-radius:6px;
                      text-decoration:none;font-weight:bold;display:inline-block;">
                View My Marks
            </a>
        </p>
        {_FOOTER}
        """
        return await _send(email, subject, html)

    @staticmethod
    async def send_notification(email: str, subject: str, body: str):
        """Send generic notification email"""
        html = f"{body}{_FOOTER}"
        return await _send(email, subject, html)

    @staticmethod
    async def send_signup_confirmation(email: str, full_name: str, role: str):
        """Send signup confirmation email (for lecturers - admin approval flow)"""
        role_display = "Student" if role == "student" else "Lecturer"
        subject = "CMMS Account Signup Received – Pending Review"
        html = f"""
        <h2 style="color:#0F172A;">Signup Received!</h2>
        <p>Hi {full_name},</p>
        <p>Thank you for registering with the <strong>Carry Mark Management System (CMMS)</strong>.</p>
        <table style="border-collapse:collapse;margin:16px 0;">
            <tr>
                <td style="padding:6px 12px;font-weight:bold;color:#374151;">Email</td>
                <td style="padding:6px 12px;color:#111827;">{email}</td>
            </tr>
            <tr style="background:#F9FAFB;">
                <td style="padding:6px 12px;font-weight:bold;color:#374151;">Role</td>
                <td style="padding:6px 12px;color:#111827;">{role_display}</td>
            </tr>
            <tr>
                <td style="padding:6px 12px;font-weight:bold;color:#374151;">Status</td>
                <td style="padding:6px 12px;color:#D97706;font-weight:bold;">Pending Admin Review</td>
            </tr>
        </table>
        <p>An administrator will review your account within <strong>24–48 hours</strong>.
           You will receive another email once your account is approved.</p>
        {_FOOTER}
        """
        return await _send(email, subject, html)

    @staticmethod
    async def send_verification_email(email: str, full_name: str, token: str):
        """Send email verification magic link (for students - OTP flow)"""
        frontend_url = os.getenv("FRONTEND_URL", "http://localhost:3000")
        verification_link = f"{frontend_url}/auth/verify-email?token={token}"

        subject = "Verify Your CMMS Student Account"
        html = f"""
        <h2 style="color:#0F172A;">Welcome to CMMS!</h2>
        <p>Hi {full_name},</p>
        <p>Thank you for registering with the <strong>Carry Mark Management System (CMMS)</strong>.</p>
        <p>Please click the button below to verify your email address and activate your account:</p>
        <p style="margin:24px 0;">
            <a href="{verification_link}"
               style="background:#C90031;color:#fff;padding:12px 24px;border-radius:6px;
                      text-decoration:none;font-weight:bold;display:inline-block;">
                Verify My Account
            </a>
        </p>
        <p style="font-size:13px;color:#6B7280;">
            Or copy this link into your browser:<br/>
            <code style="word-break:break-all;color:#374151;">{verification_link}</code>
        </p>
        <p style="color:#6B7280;font-size:13px;">This link expires in <strong>24 hours</strong>.</p>
        <p>If you didn't create this account, you can safely ignore this email.</p>
        {_FOOTER}
        """
        return await _send(email, subject, html)

    @staticmethod
    async def send_approval_email(email: str, full_name: str):
        """Send account approval email"""
        frontend_url = _get_frontend_url()
        subject = "Your CMMS Account Has Been Approved!"
        html = f"""
        <h2 style="color:#0F172A;">Account Approved!</h2>
        <p>Hi {full_name},</p>
        <p>Your CMMS account has been reviewed and <strong style="color:#16A34A;">approved</strong>.
           You can now log in using your registered email and password.</p>
        <p style="margin:24px 0;">
            <a href="{frontend_url}/auth/login"
               style="background:#C90031;color:#fff;padding:12px 24px;border-radius:6px;
                      text-decoration:none;font-weight:bold;display:inline-block;">
                Log In to CMMS
            </a>
        </p>
        <p style="color:#6B7280;font-size:13px;">Login email: <strong>{email}</strong></p>
        {_FOOTER}
        """
        return await _send(email, subject, html)

    @staticmethod
    async def send_rejection_email(email: str, full_name: str, reason: str = "Your application was not approved"):
        """Send account rejection email"""
        subject = "CMMS Account Application – Review Complete"
        html = f"""
        <h2 style="color:#0F172A;">Account Application Update</h2>
        <p>Hi {full_name},</p>
        <p>We have reviewed your CMMS account application.</p>
        <div style="background:#FFF7ED;border-left:4px solid #F97316;padding:12px 16px;
                    border-radius:4px;margin:16px 0;">
            <p style="margin:0;font-weight:bold;color:#C2410C;">Application Not Approved</p>
            <p style="margin:8px 0 0;color:#374151;">{reason}</p>
        </div>
        <p>Please contact <a href="mailto:support@utm.my" style="color:#C90031;">support@utm.my</a>
           if you believe this was a mistake or need further assistance.</p>
        {_FOOTER}
        """
        return await _send(email, subject, html)

    @staticmethod
    async def send_query_submitted(
        email: str,
        lecturer_name: str,
        student_name: str,
        course_name: str,
        query_text: str,
    ):
        """Notify lecturer that a student has submitted a mark query"""
        frontend_url = _get_frontend_url()
        subject = f"New Mark Query – {course_name}"
        html = f"""
        <h2 style="color:#0F172A;">New Mark Query Received</h2>
        <p>Hi {lecturer_name},</p>
        <p>A student has submitted a query about their marks in <strong>{course_name}</strong>.</p>
        <div style="background:#F9FAFB;border-left:4px solid #C90031;padding:12px 16px;
                    margin:16px 0;border-radius:4px;">
            <p style="margin:0;font-weight:bold;color:#374151;">{student_name} writes:</p>
            <p style="margin:8px 0 0;color:#111827;">{query_text}</p>
        </div>
        <p style="margin:24px 0;">
            <a href="{frontend_url}/queries"
               style="background:#C90031;color:#fff;padding:12px 24px;border-radius:6px;
                      text-decoration:none;font-weight:bold;display:inline-block;">
                View &amp; Respond
            </a>
        </p>
        {_FOOTER}
        """
        return await _send(email, subject, html)

    @staticmethod
    async def send_deadline_reminder(
        email: str,
        lecturer_name: str,
        academic_year: str,
        semester: int,
        start_date: str,
        end_date: str,
        grade_submission_deadline: str | None,
        notes: str | None,
        courses: list[str],
    ):
        """Send semester deadline reminder to a lecturer"""
        frontend_url = _get_frontend_url()
        def _fmt(d: str | None) -> str:
            return d if d else "—"

        course_rows = "".join(f"<li>{c}</li>" for c in courses) if courses else "<li>No courses assigned</li>"
        subject = f"Semester Deadlines – {academic_year} Semester {semester}"
        html = f"""
        <h2 style="color:#0F172A;">Semester Deadline Reminder</h2>
        <p>Hi {lecturer_name},</p>
        <p>Here are the key dates for <strong>{academic_year} Semester {semester}</strong>:</p>
        <table style="border-collapse:collapse;width:100%;max-width:480px;margin:16px 0;">
            <tr style="background:#F3F4F6;">
                <td style="padding:8px 12px;font-weight:bold;border:1px solid #E5E7EB;">Semester Start</td>
                <td style="padding:8px 12px;border:1px solid #E5E7EB;">{_fmt(start_date)}</td>
            </tr>
            <tr>
                <td style="padding:8px 12px;font-weight:bold;border:1px solid #E5E7EB;">Semester End</td>
                <td style="padding:8px 12px;border:1px solid #E5E7EB;">{_fmt(end_date)}</td>
            </tr>
            <tr style="background:#FFF1F2;">
                <td style="padding:8px 12px;font-weight:bold;border:1px solid #E5E7EB;">Grade Submission</td>
                <td style="padding:8px 12px;border:1px solid #E5E7EB;color:#C90031;font-weight:bold;">{_fmt(grade_submission_deadline)}</td>
            </tr>
        </table>
        <p><strong>Your assigned course(s):</strong></p>
        <ul style="margin:8px 0 16px 20px;">{course_rows}</ul>
        {f'<p><strong>Notes:</strong> {notes}</p>' if notes else ''}
        <p style="margin:24px 0;">
            <a href="{frontend_url}/course-management"
               style="background:#C90031;color:#fff;padding:12px 24px;border-radius:6px;
                      text-decoration:none;font-weight:bold;display:inline-block;">
                Open Course Management
            </a>
        </p>
        {_FOOTER}
        """
        return await _send(email, subject, html)

    @staticmethod
    async def send_password_reset(email: str, reset_link: str):
        """Send password reset link via email"""
        subject = "Reset Your CMMS Password"
        html = f"""
        <h2 style="color:#0F172A;">Password Reset Request</h2>
        <p>You requested a password reset for your CMMS account.</p>
        <p>Click the button below to set a new password.
           This link expires in <strong>30 minutes</strong>.</p>
        <p style="margin:24px 0;">
            <a href="{reset_link}"
               style="background:#C90031;color:#fff;padding:12px 24px;border-radius:6px;
                      text-decoration:none;font-weight:bold;display:inline-block;">
                Reset My Password
            </a>
        </p>
        <p style="font-size:13px;color:#6B7280;">
            Or copy this link into your browser:<br/>
            <code style="word-break:break-all;color:#374151;">{reset_link}</code>
        </p>
        <p>If you did not request a password reset, please ignore this email.</p>
        {_FOOTER}
        """
        return await _send(email, subject, html)

    @staticmethod
    async def send_flagged_mark_notification(
        email: str,
        lecturer_name: str,
        student_name: str,
        course_code: str,
        course_name: str,
        assessment_name: str,
        raw_score: float | None,
        max_score: float | None,
        flag_reason: str | None,
    ):
        """Send notification to lecturer when a mark is flagged"""
        frontend_url = _get_frontend_url()
        subject = f"Mark Flagged for Review – {course_code}"
        score_display = f"{raw_score}/{max_score}" if raw_score is not None and max_score else "—"
        html = f"""
        <h2 style="color:#0F172A;">Mark Flagged for Review</h2>
        <p>Hi {lecturer_name},</p>
        <p>A mark has been flagged for your attention:</p>
        <table style="border-collapse:collapse;width:100%;max-width:480px;margin:16px 0;">
            <tr style="background:#F3F4F6;">
                <td style="padding:8px 12px;font-weight:bold;border:1px solid #E5E7EB;">Course</td>
                <td style="padding:8px 12px;border:1px solid #E5E7EB;">{course_code} – {course_name}</td>
            </tr>
            <tr>
                <td style="padding:8px 12px;font-weight:bold;border:1px solid #E5E7EB;">Student</td>
                <td style="padding:8px 12px;border:1px solid #E5E7EB;">{student_name}</td>
            </tr>
            <tr style="background:#FFF1F2;">
                <td style="padding:8px 12px;font-weight:bold;border:1px solid #E5E7EB;">Assessment</td>
                <td style="padding:8px 12px;border:1px solid #E5E7EB;">{assessment_name}</td>
            </tr>
            <tr>
                <td style="padding:8px 12px;font-weight:bold;border:1px solid #E5E7EB;">Score</td>
                <td style="padding:8px 12px;border:1px solid #E5E7EB;color:#C90031;font-weight:bold;">{score_display}</td>
            </tr>
        </table>
        {f'<p><strong>Flag Reason:</strong> {flag_reason}</p>' if flag_reason else ''}
        <p style="margin:24px 0;">
            <a href="{frontend_url}/flagged-marks"
               style="background:#C90031;color:#fff;padding:12px 24px;border-radius:6px;
                      text-decoration:none;font-weight:bold;display:inline-block;">
                Review Flagged Marks
            </a>
        </p>
        {_FOOTER}
        """
        return await _send(email, subject, html)

    @staticmethod
    async def send_query_response_notification(
        email: str,
        student_name: str,
        lecturer_name: str,
        course_code: str,
        course_name: str,
        response_text: str,
    ):
        """Send notification to student when lecturer responds to their query"""
        frontend_url = _get_frontend_url()
        subject = f"Response to Your Query – {course_code}"
        html = f"""
        <h2 style="color:#0F172A;">Your Query Has Been Answered</h2>
        <p>Hi {student_name},</p>
        <p><strong>{lecturer_name}</strong> has responded to your query about <strong>{course_code} – {course_name}</strong>:</p>
        <div style="background:#F9FAFB;border-left:4px solid #C90031;padding:12px;margin:16px 0;border-radius:4px;">
            <p style="margin:0;color:#374151;font-size:14px;line-height:1.5;">{response_text}</p>
        </div>
        <p style="margin:24px 0;">
            <a href="{frontend_url}/queries"
               style="background:#C90031;color:#fff;padding:12px 24px;border-radius:6px;
                      text-decoration:none;font-weight:bold;display:inline-block;">
                View Your Queries
            </a>
        </p>
        {_FOOTER}
        """
        return await _send(email, subject, html)
