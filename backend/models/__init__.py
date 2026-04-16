from .base_model import BaseModel, Base
from .user import User
from .course import Course
from .assessment import Assessment
from .mark import Mark
from .enrollment import Enrollment
from .otp import OTP

__all__ = [
    "BaseModel",
    "Base",
    "User",
    "Course",
    "Assessment",
    "Mark",
    "Enrollment",
    "OTP",
]
