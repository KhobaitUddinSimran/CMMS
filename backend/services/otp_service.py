"""OTP service"""
import logging
import random
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from datetime import datetime, timedelta
from uuid import UUID
from typing import Optional, Tuple
from ..models.otp import OTP

logger = logging.getLogger(__name__)

class OTPService:
    """Service for OTP generation, validation, and management"""
    
    # OTP expiration times (in minutes)
    EXPIRATION_TIMES = {
        "password_reset": 15,
        "email_verification": 24 * 60,  # 24 hours
        "login": 10,
    }
    
    @staticmethod
    def generate_otp_code(length: int = 6) -> str:
        """Generate a random OTP code"""
        return "".join([str(random.randint(0, 9)) for _ in range(length)])
    
    @staticmethod
    async def create_otp(
        db: AsyncSession,
        email: str,
        otp_type: str = "password_reset",
        expires_in_minutes: Optional[int] = None,
    ) -> OTP:
        """Create a new OTP"""
        if expires_in_minutes is None:
            expires_in_minutes = OTPService.EXPIRATION_TIMES.get(otp_type, 15)
        
        # Delete any existing non-used OTPs for this email and type
        await OTPService.cleanup_old_otps(db, email, otp_type)
        
        # Generate OTP code
        otp_code = OTPService.generate_otp_code()
        
        # Create OTP record
        otp = OTP(
            email=email,
            code=otp_code,
            otp_type=otp_type,
            expires_at=datetime.utcnow() + timedelta(minutes=expires_in_minutes),
        )
        
        db.add(otp)
        await db.commit()
        await db.refresh(otp)
        
        logger.info(f"OTP created for {email} (type: {otp_type})")
        return otp
    
    @staticmethod
    async def verify_otp(
        db: AsyncSession,
        email: str,
        code: str,
        otp_type: str = "password_reset",
    ) -> Tuple[bool, Optional[str]]:
        """Verify OTP code
        
        Returns:
            (is_valid, error_message)
        """
        # Get OTP
        result = await db.execute(
            select(OTP).where(
                (OTP.email == email)
                & (OTP.code == code)
                & (OTP.otp_type == otp_type)
            ).order_by(OTP.created_at.desc())
        )
        otp = result.scalar_one_or_none()
        
        # OTP not found
        if not otp:
            logger.warning(f"Invalid OTP attempt for {email} (type: {otp_type})")
            return False, "Invalid OTP code"
        
        # OTP expired
        if otp.is_expired():
            logger.warning(f"Expired OTP used for {email}")
            return False, "OTP has expired"
        
        # OTP already used
        if otp.is_used:
            logger.warning(f"Already used OTP attempted for {email}")
            return False, "OTP has already been used"
        
        # Too many attempts
        if otp.is_locked:
            logger.warning(f"Locked OTP accessed for {email}")
            return False, "Too many failed attempts. Please request a new OTP"
        
        # Max attempts exceeded
        if otp.attempts >= otp.max_attempts:
            otp.is_locked = True
            db.add(otp)
            await db.commit()
            logger.warning(f"OTP locked for {email} - max attempts exceeded")
            return False, "Too many failed attempts. Please request a new OTP"
        
        # Increment attempts
        otp.attempts += 1
        db.add(otp)
        await db.commit()
        
        # Valid OTP
        logger.info(f"OTP verified successfully for {email}")
        return True, None
    
    @staticmethod
    async def mark_otp_used(db: AsyncSession, email: str, code: str, otp_type: str):
        """Mark OTP as used after successful verification"""
        result = await db.execute(
            select(OTP).where(
                (OTP.email == email)
                & (OTP.code == code)
                & (OTP.otp_type == otp_type)
            ).order_by(OTP.created_at.desc())
        )
        otp = result.scalar_one_or_none()
        
        if otp:
            otp.is_used = True
            otp.used_at = datetime.utcnow()
            db.add(otp)
            await db.commit()
            logger.info(f"OTP marked as used for {email}")
    
    @staticmethod
    async def get_latest_otp(
        db: AsyncSession,
        email: str,
        otp_type: str,
    ) -> Optional[OTP]:
        """Get the latest OTP for an email"""
        result = await db.execute(
            select(OTP).where(
                (OTP.email == email)
                & (OTP.otp_type == otp_type)
            ).order_by(OTP.created_at.desc())
        )
        return result.scalar_one_or_none()
    
    @staticmethod
    async def cleanup_old_otps(
        db: AsyncSession,
        email: str,
        otp_type: str,
    ) -> int:
        """Delete old/expired OTPs for this email and type"""
        stmt = delete(OTP).where(
            (OTP.email == email)
            & (OTP.otp_type == otp_type)
            & ((OTP.is_used == True) | (OTP.expires_at < datetime.utcnow()))
        )
        result = await db.execute(stmt)
        await db.commit()
        return result.rowcount
    
    @staticmethod
    async def cleanup_all_expired_otps(db: AsyncSession) -> int:
        """Delete all expired OTPs from database (maintenance task)"""
        stmt = delete(OTP).where(OTP.expires_at < datetime.utcnow())
        result = await db.execute(stmt)
        await db.commit()
        logger.info(f"Cleaned up {result.rowcount} expired OTPs")
        return result.rowcount
    
    @staticmethod
    async def resend_otp(
        db: AsyncSession,
        email: str,
        otp_type: str,
    ) -> Optional[OTP]:
        """Request a new OTP (invalidates previous attempts)"""
        # Delete old OTP
        await OTPService.cleanup_old_otps(db, email, otp_type)
        
        # Create new OTP
        return await OTPService.create_otp(db, email, otp_type)
