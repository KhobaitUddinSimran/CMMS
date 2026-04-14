"""Custom validators"""

def validate_email(email: str) -> bool:
    import re
    return re.match(r"^[^\s@]+@[^\s@]+\.[^\s@]+$", email) is not None

def validate_password_strength(password: str) -> str:
    if len(password) < 8:
        return "Min 8 characters"
    if not any(c.isupper() for c in password):
        return "Needs uppercase letter"
    if not any(c.isdigit() for c in password):
        return "Needs number"
    return ""
