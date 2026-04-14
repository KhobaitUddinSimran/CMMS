"""Application constants"""
from enum import Enum

class UserRole(str, Enum):
    STUDENT = "student"
    LECTURER = "lecturer"
    COORDINATOR = "coordinator"
    HOD = "hod"
    ADMIN = "admin"

class MarkStatus(str, Enum):
    DRAFT = "draft"
    DELAYED = "delayed"
    FLAGGED = "flagged"
    PUBLISHED = "published"
    ANOMALY = "anomaly"
