# Pydantic schemas
from .user import UserCreate, UserResponse, PasswordChangeRequest
from .course import CourseCreate, CourseUpdate, CourseResponse, CourseDetailResponse
from .assessment import AssessmentCreate, AssessmentUpdate, AssessmentResponse, AssessmentDetailResponse
from .mark import MarkCreate, MarkUpdate, MarkResponse, MarkDetailResponse, MarkPublishRequest, MarkBulkCreateRequest
from .enrollment import EnrollmentCreate, EnrollmentUpdate, EnrollmentResponse, EnrollmentDetailResponse
from .otp import OTPRequest, OTPVerify, OTPResponse, OTPVerifyResponse, OTPResendRequest

__all__ = [
    # User schemas
    "UserCreate",
    "UserResponse",
    "PasswordChangeRequest",
    # Course schemas
    "CourseCreate",
    "CourseUpdate",
    "CourseResponse",
    "CourseDetailResponse",
    # Assessment schemas
    "AssessmentCreate",
    "AssessmentUpdate",
    "AssessmentResponse",
    "AssessmentDetailResponse",
    # Mark schemas
    "MarkCreate",
    "MarkUpdate",
    "MarkResponse",
    "MarkDetailResponse",
    "MarkPublishRequest",
    "MarkBulkCreateRequest",
    # Enrollment schemas
    "EnrollmentCreate",
    "EnrollmentUpdate",
    "EnrollmentResponse",
    "EnrollmentDetailResponse",
    # OTP schemas
    "OTPRequest",
    "OTPVerify",
    "OTPResponse",
    "OTPVerifyResponse",
    "OTPResendRequest",
]
