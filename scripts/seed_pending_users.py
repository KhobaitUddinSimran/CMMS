"""Seed script: insert pending-approval users into Supabase for admin testing."""
import os, sys, uuid
from pathlib import Path

# Load backend .env
from dotenv import load_dotenv
load_dotenv(Path(__file__).resolve().parent.parent / "backend" / ".env")

from supabase import create_client

SUPABASE_URL = os.environ["SUPABASE_URL"]
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_KEY") or os.environ["SUPABASE_KEY"]

sb = create_client(SUPABASE_URL, SUPABASE_KEY)

# bcrypt hash for "password@cmsss"
import bcrypt
PWD_HASH = bcrypt.hashpw(b"password@cmsss", bcrypt.gensalt()).decode()

PENDING_USERS = [
    {
        "id": str(uuid.uuid4()),
        "email": "dr.ali.hassan@utm.my",
        "full_name": "Dr. Ali Hassan",
        "role": "lecturer",
        "password_hash": PWD_HASH,
        "is_active": False,
        "approval_status": "pending",
        "email_verified": False,
    },
    {
        "id": str(uuid.uuid4()),
        "email": "siti.rahimah@utm.my",
        "full_name": "Siti Rahimah Binti Yusof",
        "role": "lecturer",
        "password_hash": PWD_HASH,
        "is_active": False,
        "approval_status": "pending",
        "email_verified": False,
    },
    {
        "id": str(uuid.uuid4()),
        "email": "prof.rajesh.kumar@utm.my",
        "full_name": "Prof. Rajesh Kumar",
        "role": "lecturer",
        "password_hash": PWD_HASH,
        "is_active": False,
        "approval_status": "pending",
        "email_verified": False,
    },
    {
        "id": str(uuid.uuid4()),
        "email": "nurul.ain@graduate.utm.my",
        "full_name": "Nurul Ain Binti Mohd",
        "role": "student",
        "password_hash": PWD_HASH,
        "is_active": False,
        "approval_status": "pending",
        "email_verified": True,
        "matric_number": "A24EC9001",
    },
    {
        "id": str(uuid.uuid4()),
        "email": "hafiz.zulkifli@graduate.utm.my",
        "full_name": "Muhammad Hafiz Bin Zulkifli",
        "role": "student",
        "password_hash": PWD_HASH,
        "is_active": False,
        "approval_status": "pending",
        "email_verified": True,
        "matric_number": "A24EC9002",
    },
]

inserted = 0
skipped = 0
for user in PENDING_USERS:
    existing = sb.table("users").select("id").ilike("email", user["email"]).execute()
    if existing.data:
        print(f"  SKIP  {user['email']} (already exists)")
        skipped += 1
        continue
    sb.table("users").insert(user).execute()
    print(f"  INSERT {user['email']} ({user['role']}, pending)")
    inserted += 1

print(f"\nDone: {inserted} inserted, {skipped} skipped.")
