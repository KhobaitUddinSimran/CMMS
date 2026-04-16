"""Authentication service"""
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from ..core.security import hash_password, verify_password, create_access_token
from ..models.user import User
from ..services.otp_service import OTPService
from uuid import UUID
from typing import Optional, Tuple
import uuid

class AuthService:
    @staticmethod
    def hash_password(password: str) -> str:
        return hash_password(password)
    
    @staticmethod
    def verify_password(plain: str, hashed: str) -> bool:
        return verify_password(plain, hashed)
    
    @staticmethod
    def create_token(user_id: str, role: str) -> str:
        return create_access_token(user_id, role)
    
    # ============ Step 1: Signup Form ============
    @staticmethod
    async def signup_step1_form(
        db: AsyncSession,
        email: str,
        full_name: str,
        password: str,
        role: str,
        matric_number: Optional[str] = None,
    ) -> Tuple[bool, dict]:
        """
        Step 1: Handle signup form submission
        - Create user account (not active)
        - Return status for OTP verification
        """
        try:
            # Validate email domain
            if not (email.endswith("@utm.my") or email.endswith("@graduate.utm.my")):
                return False, {
                    "error": "Email must be from UTM domain (@utm.my or @graduate.utm.my)",
                    "status": 400
                }
            
            # Check if user already exists
            stmt = select(User).where(User.email == email)
            existing_user = await db.execute(stmt)
            if existing_user.scalar():
                return False, {
                    "error": "Email already registered",
                    "status": 409
                }
            
            # Check matric number if student
            if role == "student" and matric_number:
                matric_check = select(User).where(User.matric_number == matric_number)
                existing_matric = await db.execute(matric_check)
                if existing_matric.scalar():
                    return False, {
                        "error": "Matric number already registered",
                        "status": 409
                    }
            
            # Create new user (pending approval)
            password_hash = hash_password(password)
            new_user = User(
                email=email,
                password_hash=password_hash,
                full_name=full_name,
                role=role,
                matric_number=matric_number if role == "student" else None,
                is_active=False,  # Not active until admin approves
                email_verified=False,  # Not verified until OTP confirmed
                approval_status="pending",
            )
            
            db.add(new_user)
            await db.commit()
            
            return True, {
                "success": True,
                "email": email,
                "message": "Signup form received. Please verify your email.",
                "next_step": "email_verification",
            }
        except Exception as e:
            await db.rollback()
            return False, {
                "error": str(e),
                "status": 500
            }
    
    # ============ Step 2: OTP Verification ============
    @staticmethod
    async def signup_step2_verify_otp(
        db: AsyncSession,
        email: str,
        otp_code: str,
    ) -> Tuple[bool, dict]:
        """
        Step 2: Verify OTP
        - Verify OTP code
        - Mark email as verified
        - User now awaits admin approval
        """
        try:
            # Get user
            stmt = select(User).where(User.email == email)
            result = await db.execute(stmt)
            user = result.scalar_one_or_none()
            
            if not user:
                return False, {
                    "error": "User not found",
                    "status": 404
                }
            
            # Verify OTP
            is_valid, error_msg = await OTPService.verify_otp(
                db,
                email=email,
                code=otp_code,
                otp_type="email_verification"
            )
            
            if not is_valid:
                return False, {
                    "error": error_msg,
                    "status": 400
                }
            
            # Mark OTP as used
            await OTPService.mark_otp_used(db, email, otp_code, "email_verification")
            
            # Update user: mark email as verified
            user.email_verified = True
            db.add(user)
            await db.commit()
            
            return True, {
                "success": True,
                "email": email,
                "message": "Email verified successfully. Awaiting admin approval.",
                "next_step": "admin_approval",
                "approval_status": "pending",
            }
        except Exception as e:
            await db.rollback()
            return False, {
                "error": str(e),
                "status": 500
            }
    
    # ============ Step 3: Check Status ============
    @staticmethod
    async def get_signup_status(
        db: AsyncSession,
        email: str,
    ) -> Optional[dict]:
        """
        Check signup status (form submitted, OTP verified, awaiting admin approval, approved, rejected)
        """
        try:
            stmt = select(User).where(User.email == email)
            result = await db.execute(stmt)
            user = result.scalar_one_or_none()
            
            if not user:
                return None
            
            return {
                "email": user.email,
                "full_name": user.full_name,
                "role": user.role,
                "approval_status": user.approval_status,  # pending, approved, rejected
                "email_verified": user.email_verified,
                "is_active": user.is_active,
                "rejection_reason": user.rejection_reason,
                "message": AuthService._get_status_message(user),
            }
        except Exception as e:
            return None
    
    @staticmethod
    def _get_status_message(user: User) -> str:
        """Generate human-readable status message"""
        if not user.email_verified:
            return "Awaiting email verification. Check your inbox for OTP."
        elif user.approval_status == "pending":
            return "Email verified. Awaiting administrator approval."
        elif user.approval_status == "approved":
            if user.is_active:
                return "Account approved. You can now log in."
            else:
                return "Account approved. Initializing..."
        elif user.approval_status == "rejected":
            return f"Account rejected. Reason: {user.rejection_reason}"
        else:
            return "Processing your signup request..."
    
    # ============ Admin Functions ============
    @staticmethod
    async def approve_signup(
        db: AsyncSession,
        user_id: UUID,
        admin_id: UUID,
    ) -> Tuple[bool, dict]:
        """
        Admin approves signup request
        - Update approval status
        - Activate account
        """
        try:
            stmt = select(User).where(User.id == user_id)
            result = await db.execute(stmt)
            user = result.scalar_one_or_none()
            
            if not user:
                return False, {"error": "User not found"}
            
            if not user.email_verified:
                return False, {"error": "User email not verified"}
            
            # Approve user
            user.approval_status = "approved"
            user.is_active = True
            user.approved_by = admin_id
            from datetime import datetime
            user.approved_at = datetime.utcnow()
            
            db.add(user)
            await db.commit()
            
            return True, {
                "success": True,
                "message": f"User {user.email} approved",
                "user_email": user.email,
            }
        except Exception as e:
            await db.rollback()
            return False, {"error": str(e)}
    
    @staticmethod
    async def reject_signup(
        db: AsyncSession,
        user_id: UUID,
        reason: str,
    ) -> Tuple[bool, dict]:
        """
        Admin rejects signup request
        """
        try:
            stmt = select(User).where(User.id == user_id)
            result = await db.execute(stmt)
            user = result.scalar_one_or_none()
            
            if not user:
                return False, {"error": "User not found"}
            
            # Reject user
            user.approval_status = "rejected"
            user.rejection_reason = reason
            
            db.add(user)
            await db.commit()
            
            return True, {
                "success": True,
                "message": f"User {user.email} rejected",
                "user_email": user.email,
            }
        except Exception as e:
            await db.rollback()
            return False, {"error": str(e)}
    
    @staticmethod
    async def get_pending_signups(
        db: AsyncSession,
        skip: int = 0,
        limit: int = 50,
    ) -> Tuple[list, int]:
        """
        Get all pending signup requests
        """
        try:
            # Count total pending
            count_stmt = select(User).where(User.approval_status == "pending")
            count_result = await db.execute(count_stmt)
            total = len(count_result.scalars().all())
            
            # Get paginated pending signups
            stmt = (
                select(User)
                .where(User.approval_status == "pending")
                .offset(skip)
                .limit(limit)
            )
            result = await db.execute(stmt)
            users = result.scalars().all()
            
            return users, total
        except Exception as e:
            return [], 0
