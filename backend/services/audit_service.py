"""Audit logging service - Supabase Edition"""
import logging
from typing import Optional
from ..core.config import supabase

logger = logging.getLogger(__name__)


class AuditService:
    """Service for writing audit log entries to Supabase"""

    @staticmethod
    def log(action: str, actor_id: str, target_id: Optional[str] = None, metadata: Optional[dict] = None):
        """Write an audit log entry.
        
        Args:
            action: Action name (e.g. COURSE_CREATED, ROSTER_UPLOADED, USER_APPROVED)
            actor_id: UUID of the user performing the action
            target_id: UUID of the target entity (optional)
            metadata: Additional JSON metadata stored as new_values (optional)
        """
        try:
            entry = {
                "action": action,
                "user_id": actor_id,
            }
            if target_id:
                entry["entity_id"] = target_id
            if metadata:
                entry["new_values"] = metadata

            supabase.table("audit_logs").insert(entry).execute()
            logger.debug(f"Audit: {action} by {actor_id}")
        except Exception as e:
            # Never let audit logging break the main flow
            logger.warning(f"Failed to write audit log ({action}): {e}")
