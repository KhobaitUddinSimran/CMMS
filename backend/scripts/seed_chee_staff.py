"""
Seed script: ChEE Academic Staff 2026
--------------------------------------
Inserts all 39 ChEE lecturers into the CMMS users table.

Run from the /backend directory:
    python scripts/seed_chee_staff.py

Default password for every seeded account: Staff@ChEE2026
Each lecturer can change it via Profile → Change Password after first login.
"""

import sys
import os
import uuid

# Ensure backend root is on the path so we can import core modules
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from core.security import hash_password
from core.config import supabase

# ── Staff list (name, email) ──────────────────────────────────────────────────
CHEE_STAFF = [
    ("Prof. Dr. Tomoya Tsuji",                                    "t.tsuji@utm.my"),
    ("Prof. Dr. Mohamed Mahmoud El-Sayed Nasef",                  "mohdmahmoud@utm.my"),
    ("Prof. Ir. Dr. Muhamad Ali b. Muhammad Yuzir",               "muhdaliyuzir@utm.my"),
    ("Prof. Dr. Siti Hamidah Binti Mohd Setapar",                 "siti-h@utm.my"),
    ("Prof. Dr. Azila bt. Abdul Aziz",                            "r-azila@utm.my"),
    ("Assoc. Prof. Dr. Koji Iwamoto",                             "k.iwamoto@utm.my"),
    ("Assoc. Prof. Dr. Shaza Eva bt Mohamad",                     "shaza@utm.my"),
    ("Assoc. Prof. Dr. Norhayati bt. Abdullah",                   "norhayati@utm.my"),
    ("Assoc. Prof. Ir. Ts. Dr. Liew Peng Yen",                   "pyliew@utm.my"),
    ("Assoc. Prof. Dr. Aznah binti Nor Anuar",                    "aznah@utm.my"),
    ("Assoc. Prof. Dr. Roshafima binti Rasit Ali",                "roshafima@utm.my"),
    ("Assoc. Prof. Ir. Dr. Dayang Norulfairuz Abang Zaidel",      "dnorulfairuz@utm.my"),
    ("Assoc. Prof. Ir. Dr. Nurfatehah Wahyuny binti Che Jusoh",   "nurfatehah@utm.my"),
    ("Assoc. Prof. Dr. Sarajul Fikri bin Mohamed",                "sarajul@utm.my"),
    ("Assoc. Prof. Eur. Ing. Ir. Ts. Dr. Syuhaida binti Ismail", "syuhaida.kl@utm.my"),
    ("Assoc. Prof. Dr. Wan Nurul Mardiah binti Wan Mohd Rani",    "wnurul.kl@utm.my"),
    ("Ir. Dr. Tan Lian See",                                      "tan.liansee@utm.my"),
    ("Ir. Ts. Dr. Kiew Peck Loo",                                 "plkiew@utm.my"),
    ("Ir. Ts. Dr. Faizah bt Che Ros",                             "crfaizah@utm.my"),
    ("Ir. Dr. Norhuda binti Abdul Manaf",                         "norhuda.kl@utm.my"),
    ("Ir. Ts. Dr. Vekes Balasundram",                             "vekes@utm.my"),
    ("Sr. Dr. Shuib b. Rambat",                                   "shuibrambat@utm.my"),
    ("Ir. Ts. Dr. Mariam Firdaus bt. Mad Nordin",                 "mariamfirdhaus@utm.my"),
    ("Ts. Dr. Abd Halim Md Ali",                                  "abd.halim@utm.my"),
    ("Ts. Dr. Nor Ruwaida binti Jamian",                          "ruwaida.kl@utm.my"),
    ("Ts. Dr. Pramila Tamunaidu",                                 "pramila@utm.my"),
    ("Ts. Dr. Khairunnisa binti Mohd Paad",                       "khairunnisa.kl@utm.my"),
    ("Ts. Dr. Zatil Izzah binti Ahmad Tarmizi",                   "zatil.izzah@utm.my"),
    ("ChM. Dr. Eleen Dayana binti Mohamed Isa",                   "eleendayana@utm.my"),
    ("LAr. Dr. Rohayah binti Che Amat",                           "rohayah.cheamat@utm.my"),
    ("Ts. Dr. Mohammad Hussaini bin Wahab",                       "hussaini.kl@utm.my"),
    ("Dr. Nurulbahiyah binti Ahmad Khairudin",                    "r-bahiah@utm.my"),
    ("Dr. Fazrena Nadia binti Md Akhir",                          "fazrena@utm.my"),
    ("Dr. Nabilah Binti Zaini",                                   "nabilah.zaini@utm.my"),
    ("Dr. Liew Wai Loan",                                         "wlliew@utm.my"),
    ("Dr. Nurul Zainab binti Along",                              "nurulzainab.along@utm.my"),
    ("Dr. Fatin Syahirah binti Othman",                           "fatin.syahirah@utm.my"),
    ("Dr. Khamarrul Azahari bin Razak",                           "khamarrul.kl@utm.my"),
    ("Dr. Ahmad Aiman bin Azmi",                                  "ahmadaiman.a@utm.my"),
]

DEFAULT_PASSWORD = "Staff@ChEE2026"


def main():
    if not supabase:
        print("❌  Supabase client not initialised. Check your .env / environment variables.")
        sys.exit(1)

    print(f"🔐  Hashing default password …")
    pw_hash = hash_password(DEFAULT_PASSWORD)
    print(f"✅  Hash ready.\n")

    # Fetch all existing emails (case-insensitive check)
    existing_resp = supabase.table("users").select("email").execute()
    existing_emails = {row["email"].lower() for row in (existing_resp.data or [])}

    inserted = 0
    skipped  = 0
    errors   = 0

    for full_name, email in CHEE_STAFF:
        email_lc = email.strip().lower()

        if email_lc in existing_emails:
            print(f"  ⏭  SKIP   {email_lc}  (already exists)")
            skipped += 1
            continue

        user_id = str(uuid.uuid4())
        payload = {
            "id":              user_id,
            "email":           email_lc,
            "full_name":       full_name.strip(),
            "role":            "lecturer",
            "password_hash":   pw_hash,
            "is_active":       True,
            "approval_status": "approved",
            "email_verified":  True,
            "special_roles":   [],
        }

        try:
            supabase.table("users").insert(payload).execute()
            print(f"  ✅  INSERT  {email_lc}  —  {full_name}")
            inserted += 1
        except Exception as exc:
            print(f"  ❌  ERROR   {email_lc}  —  {exc}")
            errors += 1

    print(f"\n{'─'*60}")
    print(f"  Inserted : {inserted}")
    print(f"  Skipped  : {skipped}  (already in DB)")
    print(f"  Errors   : {errors}")
    print(f"{'─'*60}")
    print(f"\n  Default password for all new accounts: {DEFAULT_PASSWORD}")
    print(f"  Staff should change this on first login via Profile → Change Password.")


if __name__ == "__main__":
    main()
