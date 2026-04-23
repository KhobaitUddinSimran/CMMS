"""Shared mock data storage for development"""

# Mock users storage - all users with credentials and metadata
# UUIDs match those in Supabase database for consistency
MOCK_USERS = {
    "student@graduate.utm.my": {
        "id": "829f88f0-52ba-4bf6-b426-049bc8f5605f",
        "password": "password@cmsss",
        "role": "student",
        "full_name": "Ahmad Student",
        "approval_status": "approved",
        "is_active": True,
        "email_verified": True,
        "special_roles": [],
    },
    "uddinsimran@graduate.utm.my": {
        "id": "eeba9a9f-d493-4e55-88d8-8a866f6bc029",  # Khobait Uddin Simran from Supabase
        "password": "password@cmsss",
        "role": "student",
        "full_name": "Uddin Simran",
        "approval_status": "approved",
        "is_active": True,
        "email_verified": True,
        "special_roles": [],
    },
    "khobaituddinsimran@gmail.com": {
        "id": "64b6d12e-feb9-49e8-80e3-42052e31f399",
        "password": "password@cmsss",
        "role": "lecturer",
        "full_name": "Dr. Khobaituddinsimran",
        "approval_status": "approved",
        "is_active": True,
        "email_verified": True,
        "special_roles": [],
    },
    "lecturer@utm.my": {
        "id": "64b6d12e-feb9-49e8-80e3-42052e31f399",  # Real Supabase UUID
        "password": "password@cmsss",
        "role": "lecturer",
        "full_name": "Dr. Lecturer",
        "approval_status": "approved",
        "is_active": True,
        "email_verified": True,
        "special_roles": [],
    },
    "coordinator@utm.my": {
        "id": "ea572608-60dc-4916-af97-65e25b91b911",
        "password": "password@cmsss",
        "role": "coordinator",
        "full_name": "Prof. Coordinator",
        "approval_status": "approved",
        "is_active": True,
        "email_verified": True,
        "special_roles": ["coordinator"],
    },
    "hod@utm.my": {
        "id": "34dd057d-5ccd-44e1-bd4b-af4514f4e636",
        "password": "password@cmsss",
        "role": "hod",
        "full_name": "Dr. HOD",
        "approval_status": "approved",
        "is_active": True,
        "email_verified": True,
        "special_roles": ["hod"],
    },
    "admin@utm.my": {
        "id": "49cfa18a-fef1-4c1a-8589-31a99f094bdd",
        "password": "password@cmsss",
        "role": "admin",
        "full_name": "System Admin",
        "approval_status": "approved",
        "is_active": True,
        "email_verified": True,
        "special_roles": [],
    },
}

# Pending users awaiting admin approval
PENDING_USERS = {}
