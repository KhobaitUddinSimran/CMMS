"""Email templates"""

def otp_email_template(otp: str) -> str:
    return f"""
    <h2>Your OTP</h2>
    <p>Your One-Time Password is: <strong>{otp}</strong></p>
    <p>Valid for 10 minutes</p>
    """

def password_reset_template(reset_link: str) -> str:
    return f"""
    <h2>Reset Your Password</h2>
    <p><a href="{reset_link}">Click here to reset password</a></p>
    """
