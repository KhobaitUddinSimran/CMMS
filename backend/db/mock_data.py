"""Shared mock data storage for development"""

# Mock users storage - all users with credentials and metadata
MOCK_USERS = {
    "uddinsimran@graduate.utm.my": {
        "password": "password@cmms",
        "role": "student",
        "full_name": "Uddin Simran",
        "approval_status": "approved",
        "is_active": True,
        "email_verified": True,
    },
    "khobaituddinsimran@gmail.com": {
        "password": "password@cmms",
        "role": "lecturer",
        "full_name": "Dr. Khobaituddinsimran",
        "approval_status": "approved",
        "is_active": True,
        "email_verified": True,
    },
    "lecturer@utm.my": {
        "password": "password@cmms",
        "role": "lecturer",
        "full_name": "Dr. Lecturer",
        "approval_status": "approved",
        "is_active": True,
        "email_verified": True,
    },
    "coordinator@utm.my": {
        "password": "password@cmms",
        "role": "coordinator",
        "full_name": "Coordinator",
        "approval_status": "approved",
        "is_active": True,
        "email_verified": True,
    },
    "hod@utm.my": {
        "password": "password@cmms",
        "role": "hod",
        "full_name": "HOD",
        "approval_status": "approved",
        "is_active": True,
        "email_verified": True,
    },
    "admin@utm.my": {
        "password": "password@cmms",
        "role": "admin",
        "full_name": "Admin",
        "approval_status": "approved",
        "is_active": True,
        "email_verified": True,
    },
}

# Pending users awaiting admin approval
PENDING_USERS = {}
