"""Authentication endpoints — fully database-backed (Supabase)"""
import logging
import asyncio
from fastapi import APIRouter, Depends, HTTPException, status, Request
from pydantic import BaseModel, EmailStr
from slowapi import Limiter
from ..core.security import hash_password, verify_password, create_access_token
from ..core.config import supabase
from ..models.user import User
from ..dependencies.auth import get_current_user
from ..services.email_service import EmailService
from ..utils.shared import require_supabase, get_rate_limit_key as _shared_rate_key
from datetime import datetime, timedelta
import uuid
import os
import secrets

router = APIRouter(prefix="/auth", tags=["auth"])
logger = logging.getLogger(__name__)

limiter = Limiter(key_func=_shared_rate_key)

# ==================== Pydantic Models ====================
class LoginRequest(BaseModel):
    email: EmailStr
    password: str
    role: str

class LoginResponse(BaseModel):
    token: str
    user: dict
    approval_status: str
    special_roles: list[str] = []

class SignupRequest(BaseModel):
    email: EmailStr
    full_name: str
    role: str
    password: str
    matric_number: str | None = None

class SignupResponse(BaseModel):
    user_id: str
    approval_status: str

class PasswordResetRequest(BaseModel):
    email: EmailStr

class PasswordResetResponse(BaseModel):
    message: str
    token_sent_at: str

class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str

class ResetPasswordResponse(BaseModel):
    success: bool
    message: str

class ApprovalStatusResponse(BaseModel):
    approval_status: str
    approved_at: str | None = None
    rejection_reason: str | None = None
    approved_by: str | None = None

class AuthUserResponse(BaseModel):
    id: str
    email: str
    full_name: str
    role: str
    is_active: bool
    email_verified: bool
    approval_status: str
    created_at: str | None = None

# In-memory fallback store (used only if DB write fails): {token: {"email": str, "expires_at": datetime}}
RESET_TOKENS: dict[str, dict] = {}

# ==================== LOGIN ENDPOINT ====================
@router.post("/login", response_model=LoginResponse)
@limiter.limit("50/15minutes")
async def login(request: Request, credentials: LoginRequest):
    """Login — Supabase only."""
    try:
        require_supabase()

        resp = supabase.table("users").select("*").ilike("email", credentials.email.strip()).execute()

        if not resp.data:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")

        db_user = resp.data[0]

        if not db_user.get("password_hash"):
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")

        if not verify_password(credentials.password, db_user["password_hash"]):
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")

        if not db_user.get("is_active", False):
            # Check if student needs email verification
            if db_user.get("role") == "student" and not db_user.get("email_verified"):
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Please verify your email before logging in. Check your inbox for the verification link."
                )
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Account not approved yet. Please wait for admin approval."
            )

        db_role = db_user["role"]
        # Use special_roles from DB if present; fall back to deriving from role for old rows
        db_special = db_user.get("special_roles") or []
        if not db_special and db_role in ("coordinator", "hod"):
            db_special = [db_role]

        token = create_access_token(user_id=db_user["id"], role=db_role, special_roles=db_special)
        logger.info(f"User {credentials.email} logged in (id={db_user['id']}, role={db_role}, special={db_special})")

        return LoginResponse(
            token=token,
            user={
                "id": db_user["id"],
                "email": db_user["email"],
                "full_name": db_user["full_name"],
                "role": db_role,
                "is_active": db_user["is_active"],
                "email_verified": db_user.get("email_verified", False),
                "approval_status": db_user.get("approval_status", "approved"),
                "special_roles": db_special,
            },
            approval_status=db_user.get("approval_status", "approved"),
            special_roles=db_special,
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Login error for {credentials.email}: {e}", exc_info=True)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Authentication service error")

# ==================== SIGNUP ENDPOINT ====================
@router.post("/signup", response_model=SignupResponse, status_code=status.HTTP_202_ACCEPTED)
@limiter.limit("100/1hour")
async def signup(request: Request, signup_data: SignupRequest):
    """Signup — writes directly to Supabase as pending. Admin / coordinator /
    HOD roles are NEVER self-assignable; they must be granted by an existing
    admin via the user-management API."""
    try:
        # Only student and lecturer can self-signup. Admin/coordinator/HOD are
        # privileged roles and cannot be created via the public endpoint.
        if signup_data.role not in ("student", "lecturer"):
            raise HTTPException(
                status_code=400,
                detail="Only student and lecturer roles can self-register. "
                       "Admin, coordinator, and HOD accounts are provisioned by an administrator.",
            )

        email_lc = signup_data.email.strip().lower()
        is_staff_domain = email_lc.endswith("@utm.my")
        is_student_domain = email_lc.endswith("@graduate.utm.my")

        if not (is_staff_domain or is_student_domain):
            raise HTTPException(status_code=400, detail="Email must be from UTM domain (@utm.my or @graduate.utm.my)")

        # Lecturers can only use the staff domain; students can use either.
        if signup_data.role == "lecturer" and not is_staff_domain:
            raise HTTPException(
                status_code=400,
                detail="Lecturer accounts must use the @utm.my staff email domain.",
            )

        if signup_data.role == "student" and not signup_data.matric_number:
            raise HTTPException(status_code=400, detail="Matric number is required for students")

        require_supabase()

        # Check duplicate (case-insensitive)
        existing = supabase.table("users").select("id").ilike("email", email_lc).execute()
        if existing.data:
            raise HTTPException(status_code=409, detail="Email already registered")

        # Different flows for students vs lecturers
        if signup_data.role == "student":
            # Student flow: Magic link verification (no admin approval needed)
            # Use atomic RPC to ensure both user and OTP are created together, or neither
            verification_token = secrets.token_urlsafe(32)
            expires_at = (datetime.now() + timedelta(hours=24)).isoformat()

            try:
                # Call the atomic signup function via RPC
                result = supabase.rpc("signup_student", {
                    "p_email": email_lc,
                    "p_full_name": signup_data.full_name,
                    "p_password_hash": hash_password(signup_data.password),
                    "p_matric_number": signup_data.matric_number or None,
                    "p_role": signup_data.role,
                    "p_verification_token": verification_token,
                    "p_expires_at": expires_at
                }).execute()

                if not result.data:
                    raise HTTPException(status_code=500, detail="Failed to create account")

                user_id = result.data[0]["user_id"]

            except Exception as rpc_err:
                error_str = str(rpc_err)
                logger.error(f"Atomic signup failed: {rpc_err}")
                # Check for specific constraint violations
                if "matric_number" in error_str and ("duplicate" in error_str or "23505" in error_str):
                    raise HTTPException(status_code=409, detail="This matric number is already registered.")
                if "email" in error_str and ("duplicate" in error_str or "23505" in error_str):
                    raise HTTPException(status_code=409, detail="This email is already registered.")
                raise HTTPException(status_code=500, detail="Failed to create account. Please try again.")

            # Send verification email (after successful DB transaction)
            try:
                asyncio.create_task(EmailService.send_verification_email(
                    email_lc, signup_data.full_name, verification_token
                ))
            except Exception as email_err:
                logger.warning(f"Verification email failed for {email_lc}: {email_err}")
                # Note: User record exists but email failed. They can use resend verification.

            logger.info(f"New student signup {email_lc} - verification email sent")
            return SignupResponse(user_id=user_id, approval_status="pending_verification")

        else:
            # Lecturer flow: Admin approval required
            user_id = str(uuid.uuid4())
            supabase.table("users").insert({
                "id": user_id,
                "email": email_lc,
                "full_name": signup_data.full_name,
                "role": signup_data.role,
                "password_hash": hash_password(signup_data.password),
                "is_active": False,
                "approval_status": "pending",
                "email_verified": False,
                "matric_number": signup_data.matric_number or None,
            }).execute()

            # Audit trail
            try:
                supabase.table("audit_logs").insert({
                    "user_id": user_id,
                    "action": "USER_SIGNED_UP",
                    "entity_type": "users",
                    "entity_id": user_id,
                    "new_values": {"email": email_lc, "role": signup_data.role},
                }).execute()
            except Exception:
                pass

            logger.info(f"New lecturer signup {email_lc} persisted to Supabase (pending admin approval)")

            # Send signup confirmation email (pending admin review)
            try:
                asyncio.create_task(EmailService.send_signup_confirmation(
                    email_lc, signup_data.full_name, signup_data.role
                ))
            except Exception as email_err:
                logger.warning(f"Signup confirmation email failed for {email_lc}: {email_err}")

            return SignupResponse(user_id=user_id, approval_status="pending")

    except HTTPException:
        raise
    except Exception as e:
        error_str = str(e)
        logger.error(f"Signup error: {e}")
        # Check for specific database constraint violations
        if "matric_number" in error_str and ("duplicate" in error_str or "23505" in error_str):
            raise HTTPException(status_code=409, detail="This matric number is already registered. Please use a different one or contact support if this is your account.")
        if "email" in error_str and ("duplicate" in error_str or "23505" in error_str):
            raise HTTPException(status_code=409, detail="This email is already registered.")
        raise HTTPException(status_code=500, detail="Signup service error")


# ==================== LOGOUT ENDPOINT ====================
@router.post("/logout")
async def logout(current_user=Depends(get_current_user)):
    logger.info(f"User {current_user.get('user_id')} logged out")
    return {"message": "Logout successful"}


# ==================== GET CURRENT USER ====================
@router.get("/me")
async def get_current_user_info(current_user=Depends(get_current_user)):
    """Get current user info from Supabase."""
    user_id = current_user.get("user_id")
    jwt_role = current_user.get("role")
    jwt_special = current_user.get("special_roles", [])

    if supabase:
        try:
            resp = supabase.table("users").select(
                "id, email, full_name, role, is_active, email_verified, approval_status"
            ).eq("id", user_id).execute()
            if resp.data:
                u = resp.data[0]
                db_role = u.get("role", jwt_role)
                db_special = [db_role] if db_role in ("coordinator", "hod") else []
                return {
                    "id": u["id"],
                    "email": u.get("email", ""),
                    "full_name": u.get("full_name", ""),
                    "role": db_role,
                    "is_active": u.get("is_active", True),
                    "email_verified": u.get("email_verified", False),
                    "approval_status": u.get("approval_status", "approved"),
                    "special_roles": db_special or jwt_special,
                }
        except Exception as e:
            logger.warning(f"/auth/me Supabase lookup failed: {e}")

    # JWT fallback
    return {
        "id": user_id, "email": "", "full_name": "",
        "role": jwt_role, "is_active": True, "email_verified": True,
        "approval_status": "approved", "special_roles": jwt_special,
    }


# ==================== APPROVAL STATUS ENDPOINT ====================
@router.get("/approval-status/{user_id}", response_model=ApprovalStatusResponse)
async def check_approval_status(user_id: str):
    """Check approval status — Supabase only."""
    require_supabase()
    try:
        resp = supabase.table("users").select(
            "approval_status, approved_at, rejection_reason, approved_by"
        ).eq("id", user_id).execute()
        if not resp.data:
            raise HTTPException(status_code=404, detail="User not found")
        u = resp.data[0]
        return ApprovalStatusResponse(
            approval_status=u.get("approval_status", "pending"),
            approved_at=u.get("approved_at"),
            rejection_reason=u.get("rejection_reason"),
            approved_by=u.get("approved_by"),
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Approval status error: {e}")
        raise HTTPException(status_code=500, detail="Failed to check approval status")


# ==================== PASSWORD RESET ====================
@router.post("/password-reset", response_model=PasswordResetResponse)
async def password_reset(request: PasswordResetRequest):
    """Request password reset."""
    email = request.email.lower().strip()

    user_exists = False
    if supabase:
        try:
            r = supabase.table("users").select("id").ilike("email", email).execute()
            user_exists = bool(r.data)
        except Exception:
            pass

    if user_exists:
        token = secrets.token_urlsafe(32)
        expires_at = (datetime.now() + timedelta(minutes=30)).isoformat()
        stored_in_db = False
        if supabase:
            try:
                # Remove any existing unused reset tokens for this email
                supabase.table("otps").delete().eq("email", email).eq("otp_type", "password_reset").eq("is_used", False).execute()
                supabase.table("otps").insert({
                    "id": str(uuid.uuid4()),
                    "email": email,
                    "code": token,
                    "otp_type": "password_reset",
                    "is_used": False,
                    "expires_at": expires_at,
                    "attempts": 0,
                    "max_attempts": 5,
                    "is_locked": False,
                }).execute()
                stored_in_db = True
            except Exception as db_err:
                logger.warning(f"Failed to persist reset token to DB, using in-memory fallback: {db_err}")
        if not stored_in_db:
            RESET_TOKENS[token] = {"email": email, "expires_at": datetime.now() + timedelta(minutes=30)}
        frontend_url = os.getenv("FRONTEND_URL", "http://localhost:3000")
        reset_link = f"{frontend_url}/auth/password-reset?token={token}"
        try:
            await EmailService.send_password_reset(email, reset_link)
        except Exception as email_err:
            logger.warning(f"Failed to send reset email to {email}: {email_err}")

    return PasswordResetResponse(
        message="If an account exists for that email, reset instructions have been sent.",
        token_sent_at=datetime.now().isoformat(),
    )


# ==================== RESET PASSWORD WITH TOKEN ====================
@router.post("/reset-password", response_model=ResetPasswordResponse)
async def reset_password(request: ResetPasswordRequest):
    """Reset password with token."""
    if not request.token or not request.new_password:
        raise HTTPException(status_code=400, detail="Token and new password are required")
    if len(request.new_password) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters")

    email: str | None = None

    # Try DB-persisted token first
    if supabase:
        try:
            otp_resp = supabase.table("otps").select("*").eq("code", request.token).eq("otp_type", "password_reset").limit(1).execute()
            if otp_resp.data:
                otp = otp_resp.data[0]
                if otp.get("is_used"):
                    raise HTTPException(status_code=400, detail="Reset token has already been used.")
                raw_expiry = otp["expires_at"]
                # Normalise timezone suffix for datetime.fromisoformat
                expires_at = datetime.fromisoformat(raw_expiry.replace("Z", "").split("+")[0])
                if datetime.now() > expires_at:
                    supabase.table("otps").update({"is_used": True}).eq("id", otp["id"]).execute()
                    raise HTTPException(status_code=400, detail="Reset token has expired.")
                email = otp["email"]
                supabase.table("otps").update({"is_used": True, "used_at": datetime.now().isoformat()}).eq("id", otp["id"]).execute()
        except HTTPException:
            raise
        except Exception as e:
            logger.warning(f"DB OTP lookup failed, checking in-memory fallback: {e}")

    # Fall back to in-memory store (handles tokens created before DB migration)
    if email is None:
        token_data = RESET_TOKENS.get(request.token)
        if not token_data:
            raise HTTPException(status_code=400, detail="Invalid or expired reset token.")
        if datetime.now() > token_data["expires_at"]:
            RESET_TOKENS.pop(request.token, None)
            raise HTTPException(status_code=400, detail="Reset token has expired.")
        email = token_data["email"]
        RESET_TOKENS.pop(request.token, None)

    new_hash = hash_password(request.new_password)
    require_supabase()

    try:
        resp = supabase.table("users").update({"password_hash": new_hash}).ilike("email", email).execute()
        if not resp.data:
            raise HTTPException(status_code=404, detail="User not found")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Password reset DB error: {e}")
        raise HTTPException(status_code=500, detail="Password reset error")

    logger.info(f"Password reset successful for {email}")
    return ResetPasswordResponse(success=True, message="Password reset successfully. You can now log in.")


# ==================== EMAIL VERIFICATION ====================
class VerifyEmailRequest(BaseModel):
    token: str

class VerifyEmailResponse(BaseModel):
    success: bool
    message: str

@router.post("/verify-email", response_model=VerifyEmailResponse)
async def verify_email(request: VerifyEmailRequest):
    """Verify email address using magic link token (for students)."""
    require_supabase()

    if not request.token:
        raise HTTPException(status_code=400, detail="Verification token is required")

    try:
        # Find the verification token
        otp_resp = supabase.table("otps").select("*").eq("code", request.token).eq("otp_type", "email_verification").limit(1).execute()

        if not otp_resp.data:
            raise HTTPException(status_code=400, detail="Invalid verification token.")

        otp = otp_resp.data[0]

        # Check if already used
        if otp.get("is_used"):
            raise HTTPException(status_code=400, detail="This verification link has already been used.")

        # Check if expired
        raw_expiry = otp["expires_at"]
        expires_at = datetime.fromisoformat(raw_expiry.replace("Z", "").split("+")[0])
        if datetime.now() > expires_at:
            supabase.table("otps").update({"is_used": True}).eq("id", otp["id"]).execute()
            raise HTTPException(status_code=400, detail="This verification link has expired. Please request a new one.")

        email = otp["email"]

        # Get user
        user_resp = supabase.table("users").select("id, full_name, role").ilike("email", email).execute()
        if not user_resp.data:
            raise HTTPException(status_code=404, detail="User not found")

        user = user_resp.data[0]

        # Activate user account
        supabase.table("users").update({
            "email_verified": True,
            "is_active": True,
        }).ilike("email", email).execute()

        # Mark token as used
        supabase.table("otps").update({
            "is_used": True,
            "used_at": datetime.now().isoformat()
        }).eq("id", otp["id"]).execute()

        # Send welcome email
        try:
            asyncio.create_task(EmailService.send_approval_email(email, user.get("full_name", "")))
        except Exception as email_err:
            logger.warning(f"Welcome email failed for {email}: {email_err}")

        logger.info(f"Email verified and account activated for {email}")
        return VerifyEmailResponse(success=True, message="Your email has been verified! You can now log in.")

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Email verification error: {e}")
        raise HTTPException(status_code=500, detail="Email verification failed")


# ==================== RESEND VERIFICATION EMAIL ====================
class ResendVerificationRequest(BaseModel):
    email: EmailStr

class ResendVerificationResponse(BaseModel):
    message: str

@router.post("/resend-verification", response_model=ResendVerificationResponse)
@limiter.limit("5/1hour")
async def resend_verification(request: Request, req_data: ResendVerificationRequest):
    """Resend email verification link (for students)."""
    require_supabase()

    email = req_data.email.lower().strip()

    try:
        # Find user
        user_resp = supabase.table("users").select("id, full_name, role, email_verified").ilike("email", email).execute()
        if not user_resp.data:
            # Don't reveal if email exists or not
            return ResendVerificationResponse(message="If a matching account exists, a verification email has been sent.")

        user = user_resp.data[0]

        # Only for students
        if user.get("role") != "student":
            return ResendVerificationResponse(message="If a matching account exists, a verification email has been sent.")

        # Already verified
        if user.get("email_verified"):
            return ResendVerificationResponse(message="If a matching account exists, a verification email has been sent.")

        # Invalidate old tokens
        try:
            supabase.table("otps").update({"is_used": True}).eq("email", email).eq("otp_type", "email_verification").eq("is_used", False).execute()
        except Exception:
            pass

        # Generate new token
        verification_token = secrets.token_urlsafe(32)
        expires_at = (datetime.now() + timedelta(hours=24)).isoformat()

        # Store new token
        supabase.table("otps").insert({
            "id": str(uuid.uuid4()),
            "email": email,
            "code": verification_token,
            "otp_type": "email_verification",
            "is_used": False,
            "expires_at": expires_at,
            "attempts": 0,
            "max_attempts": 5,
            "is_locked": False,
        }).execute()

        # Send verification email
        try:
            asyncio.create_task(EmailService.send_verification_email(
                email, user.get("full_name", ""), verification_token
            ))
            logger.info(f"Verification email resent to {email}")
        except Exception as email_err:
            logger.warning(f"Failed to resend verification email to {email}: {email_err}")

        return ResendVerificationResponse(message="If a matching account exists, a verification email has been sent.")

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Resend verification error: {e}")
        raise HTTPException(status_code=500, detail="Failed to resend verification email")
