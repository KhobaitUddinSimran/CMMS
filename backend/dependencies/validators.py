"""Custom validators"""

def validate_email(email: str) -> bool:
    import re
    return re.match(r"^[^\s@]+@[^\s@]+\.[^\s@]+$", email) is not None

def validate_password(password: str) -> bool:
    return (
        len(password) >= 8 and
        any(c.isupper() for c in password) and
        any(c.isdigit() for c in password)
    )
