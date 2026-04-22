"""Shared mock data storage for development"""

# Mock users storage - all users with credentials and metadata
# UUIDs match those in Supabase database for consistency
MOCK_USERS = {
    "uddinsimran@graduate.utm.my": {
        "id": "829f88f0-52ba-4bf6-b426-049bc8f5605f",  # Student from Supabase
        "password": "password@cmms",
        "role": "student",
        "full_name": "Uddin Simran",
        "approval_status": "approved",
        "is_active": True,
        "email_verified": True,
        "special_roles": [],
    },
    "khobaituddinsimran@gmail.com": {
        "id": "64b6d12e-feb9-49e8-80e3-42052e31f399",  # Lecturer from Supabase
        "password": "password@cmms",
        "role": "lecturer",
        "full_name": "Dr. Khobaituddinsimran",
        "approval_status": "approved",
        "is_active": True,
        "email_verified": True,
        "special_roles": [],
    },
    "lecturer@utm.my": {
        "id": "d7b9e2a4-8c1f-4a2e-9d5e-3b6c7f8a9c0d",  # Lecturer UUID
        "password": "password@cmms",
        "role": "lecturer",
        "full_name": "Dr. Lecturer",
        "approval_status": "approved",
        "is_active": True,
        "email_verified": True,
        "special_roles": [],
    },
    "coordinator@utm.my": {
        "id": "e8c0f3b5-9d2g-5b3f-0e6f-4c7d8g9b0d1e",  # Coordinator UUID
        "password": "password@cmms",
        "role": "lecturer",
        "full_name": "Coordinator",
        "approval_status": "approved",
        "is_active": True,
        "email_verified": True,
        "special_roles": ["coordinator"],
    },
    "hod@utm.my": {
        "id": "f9d1g4c6-0e3h-6c4g-1f7g-5d8e9h0c1e2f",  # HOD UUID
        "password": "password@cmms",
        "role": "lecturer",
        "full_name": "HOD",
        "approval_status": "approved",
        "is_active": True,
        "email_verified": True,
        "special_roles": ["hod"],
    },
    "admin@utm.my": {
        "id": "a0e2h5d7-1f4i-7d5h-2g8h-6e9f0i1d2e3f",  # Admin UUID
        "password": "password@cmms",
        "role": "admin",
        "full_name": "Admin",
        "approval_status": "approved",
        "is_active": True,
        "email_verified": True,
        "special_roles": [],
    },
}

# Pending users awaiting admin approval
PENDING_USERS = {}
