"""Email service using Resend"""
import logging
import os
from pathlib import Path
from typing import Optional
from dotenv import load_dotenv

logger = logging.getLogger(__name__)

# Load environment variables from backend/.env file
# Get the backend directory path
backend_dir = Path(__file__).parent.parent
env_file = backend_dir / '.env'
load_dotenv(env_file)

class EmailConfig:
    def __init__(self):
        self.resend_api_key = os.getenv('RESEND_API_KEY', '')
        self.email_from_address = os.getenv('EMAIL_FROM_ADDRESS', 'noreply@cmms.utm.my')
        self.email_from_name = os.getenv('EMAIL_FROM_NAME', 'CMMS')

email_config = EmailConfig()

class EmailService:
    @staticmethod
    async def send_otp(email: str, otp: str, expires_in_minutes: int = 15):
        """Send OTP via email for password reset"""
        if not email_config.resend_api_key:
            logger.warning(f"Email service not configured. OTP not sent to {email}")
            return False
        
        try:
            import resend
            
            # Set API key
            resend.api_key = email_config.resend_api_key
            
            subject = "Your CMMS Password Reset Code"
            html_content = f"""
            <h2>Password Reset</h2>
            <p>You requested a password reset for your CMMS account.</p>
            <p>Your reset code is:</p>
            <h1 style="font-size: 32px; letter-spacing: 5px; font-weight: bold;">{otp}</h1>
            <p>This code expires in {expires_in_minutes} minutes.</p>
            <p>If you didn't request this, ignore this email.</p>
            <hr/>
            <p style="font-size: 12px; color: #666;">
                Carry Mark Management System (CMMS)<br/>
                Universiti Teknologi Malaysia
            </p>
            """
            
            response = resend.Emails().send({
                "from": f"{email_config.email_from_name} <{email_config.email_from_address}>",
                "to": email,
                "subject": subject,
                "html": html_content,
            })
            
            logger.info(f"OTP email sent to {email}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to send OTP email to {email}: {str(e)}")
            return False
    
    @staticmethod
    async def send_student_otp(email: str, otp: str, student_name: str = "Student"):
        """Send OTP to new student account"""
        if not email_config.resend_api_key:
            logger.warning(f"Email service not configured. OTP not sent to {email}")
            return False
        
        try:
            import resend
            
            resend.api_key = email_config.resend_api_key
            
            subject = "Welcome to CMMS - Your Login Code"
            html_content = f"""
            <h2>Welcome to CMMS!</h2>
            <p>Hi {student_name},</p>
            <p>Your CMMS student account has been created. Use this code to log in:</p>
            <h1 style="font-size: 32px; letter-spacing: 5px; font-weight: bold;">{otp}</h1>
            <p><strong>Steps to log in:</strong></p>
            <ol>
                <li>Go to https://cmms.utm.my/login</li>
                <li>Select your role as "Student"</li>
                <li>Enter your email and the code above</li>
                <li>Set your password on first login</li>
            </ol>
            <p>This code expires in 24 hours.</p>
            <hr/>
            <p style="font-size: 12px; color: #666;">
                Carry Mark Management System (CMMS)<br/>
                Universiti Teknologi Malaysia
            </p>
            """
            
            response = resend.Emails().send({
                "from": f"{email_config.email_from_name} <{email_config.email_from_address}>",
                "to": email,
                "subject": subject,
                "html": html_content,
            })
            
            logger.info(f"Student welcome email sent to {email}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to send student welcome email to {email}: {str(e)}")
            return False
    
    @staticmethod
    async def send_marks_published(email: str, student_name: str, course_name: str):
        """Notify student that marks have been published"""
        if not email_config.resend_api_key:
            logger.warning(f"Email service not configured. Notification not sent to {email}")
            return False
        
        try:
            import resend
            
            resend.api_key = email_config.resend_api_key
            
            subject = f"Marks Published - {course_name}"
            html_content = f"""
            <h2>Marks Published</h2>
            <p>Hi {student_name},</p>
            <p>Marks for <strong>{course_name}</strong> have been published.</p>
            <p><a href="https://cmms.utm.my/marks" style="
                display: inline-block;
                padding: 10px 20px;
                background-color: #C90031;
                color: white;
                text-decoration: none;
                border-radius: 5px;
            ">View Your Marks</a></p>
            <hr/>
            <p style="font-size: 12px; color: #666;">
                Carry Mark Management System (CMMS)<br/>
                Universiti Teknologi Malaysia
            </p>
            """
            
            response = resend.Emails().send({
                "from": f"{email_config.email_from_name} <{email_config.email_from_address}>",
                "to": email,
                "subject": subject,
                "html": html_content,
            })
            
            logger.info(f"Marks notification sent to {email}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to send marks notification to {email}: {str(e)}")
            return False
    
    @staticmethod
    async def send_notification(email: str, subject: str, body: str):
        """Send generic notification email"""
        if not email_config.resend_api_key:
            logger.warning(f"Email service not configured. Notification not sent to {email}")
            return False
        
        try:
            import resend
            
            resend.api_key = email_config.resend_api_key
            
            html_content = f"""
            {body}
            <hr/>
            <p style="font-size: 12px; color: #666;">
                Carry Mark Management System (CMMS)<br/>
                Universiti Teknologi Malaysia
            </p>
            """
            
            response = resend.Emails().send({
                "from": f"{email_config.email_from_name} <{email_config.email_from_address}>",
                "to": email,
                "subject": subject,
                "html": html_content,
            })
            
            logger.info(f"Notification sent to {email}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to send notification to {email}: {str(e)}")
            return False
    
    @staticmethod
    async def send_signup_confirmation(email: str, full_name: str, role: str):
        """Send signup confirmation email"""
        if not email_config.resend_api_key:
            logger.warning(f"Email service not configured. Confirmation not sent to {email}")
            return False
        
        try:
            import resend
            
            resend.api_key = email_config.resend_api_key
            
            role_display = "Student" if role == "student" else "Lecturer"
            subject = "CMMS Account Signup Received - Pending Review"
            html_content = f"""
            <h2>Welcome to CMMS!</h2>
            <p>Hi {full_name},</p>
            <p>Thank you for signing up for the Carry Mark Management System (CMMS).</p>
            <p><strong>Signup Details:</strong></p>
            <ul>
                <li>Email: {email}</li>
                <li>Role: {role_display}</li>
                <li>Status: <span style="color: #FFA500; font-weight: bold;">Pending Admin Review</span></li>
            </ul>
            <p>Your account is currently under review by our administrators. You will receive an email once your account is approved and activated.</p>
            <p>This typically takes 24-48 hours.</p>
            <p><strong>What happens next:</strong></p>
            <ol>
                <li>An admin will review your signup details</li>
                <li>Your account will be verified and activated</li>
                <li>You'll receive a confirmation email with login instructions</li>
                <li>You can then log in and start using CMMS</li>
            </ol>
            <p>If you have any questions, please contact us at support@utm.my</p>
            <hr/>
            <p style="font-size: 12px; color: #666;">
                Carry Mark Management System (CMMS)<br/>
                Universiti Teknologi Malaysia<br/>
                <a href="https://cmms.utm.my" style="color: #C90031;">cmms.utm.my</a>
            </p>
            """
            
            response = resend.Emails().send({
                "from": f"{email_config.email_from_name} <{email_config.email_from_address}>",
                "to": email,
                "subject": subject,
                "html": html_content,
            })
            
            logger.info(f"Signup confirmation sent to {email}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to send signup confirmation to {email}: {str(e)}")
            return False
    
    @staticmethod
    async def send_approval_email(email: str, full_name: str):
        """Send account approval email"""
        if not email_config.resend_api_key:
            logger.warning(f"Email service not configured. Approval email not sent to {email}")
            return False
        
        try:
            import resend
            
            resend.api_key = email_config.resend_api_key
            
            subject = "Your CMMS Account Has Been Approved!"
            html_content = f"""
            <h2>Account Approved! 🎉</h2>
            <p>Hi {full_name},</p>
            <p>Great news! Your CMMS account application has been approved and activated.</p>
            <p>You can now log in to the system using your email and password:</p>
            <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
                <p><strong>Login URL:</strong><br/>
                <a href="https://cmms.utm.my/login" style="color: #C90031;">https://cmms.utm.my/login</a></p>
                <p><strong>Email:</strong> {email}</p>
            </div>
            <p><strong>Next Steps:</strong></p>
            <ol>
                <li>Go to the login page using the link above</li>
                <li>Enter your email and password</li>
                <li>You'll be logged in to your dashboard</li>
            </ol>
            <p>If you have any issues logging in, please contact us at support@utm.my</p>
            <hr/>
            <p style="font-size: 12px; color: #666;">
                Carry Mark Management System (CMMS)<br/>
                Universiti Teknologi Malaysia<br/>
                <a href="https://cmms.utm.my" style="color: #C90031;">cmms.utm.my</a>
            </p>
            """
            
            response = resend.Emails().send({
                "from": f"{email_config.email_from_name} <{email_config.email_from_address}>",
                "to": email,
                "subject": subject,
                "html": html_content,
            })
            
            logger.info(f"Approval email sent to {email}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to send approval email to {email}: {str(e)}")
            return False
    
    @staticmethod
    async def send_rejection_email(email: str, full_name: str, reason: str = "Your application was not approved"):
        """Send account rejection email"""
        if not email_config.resend_api_key:
            logger.warning(f"Email service not configured. Rejection email not sent to {email}")
            return False
        
        try:
            import resend
            
            resend.api_key = email_config.resend_api_key
            
            subject = "CMMS Account Application - Review Complete"
            html_content = f"""
            <h2>Account Application Review</h2>
            <p>Hi {full_name},</p>
            <p>We have reviewed your CMMS account application.</p>
            <div style="background: #fff3cd; padding: 15px; border-left: 4px solid #FFA500; border-radius: 3px; margin: 20px 0;">
                <p><strong>Status:</strong> <span style="color: #C90031; font-weight: bold;">Application Not Approved</span></p>
                <p><strong>Reason:</strong> {reason}</p>
            </div>
            <p><strong>What you can do:</strong></p>
            <ul>
                <li>Contact your department administrator for more information</li>
                <li>Reapply with correct information if needed</li>
                <li>Reach out to support@utm.my for assistance</li>
            </ul>
            <p>We appreciate your interest in CMMS.</p>
            <hr/>
            <p style="font-size: 12px; color: #666;">
                Carry Mark Management System (CMMS)<br/>
                Universiti Teknologi Malaysia<br/>
                <a href="https://cmms.utm.my" style="color: #C90031;">cmms.utm.my</a>
            </p>
            """
            
            response = resend.Emails().send({
                "from": f"{email_config.email_from_name} <{email_config.email_from_address}>",
                "to": email,
                "subject": subject,
                "html": html_content,
            })
            
            logger.info(f"Rejection email sent to {email}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to send rejection email to {email}: {str(e)}")
            return False

    @staticmethod
    async def send_password_reset(email: str, reset_link: str):
        """Send password reset link via email"""
        if not email_config.resend_api_key:
            logger.warning(f"Email service not configured. Password reset link for {email}: {reset_link}")
            return False

        try:
            import resend

            resend.api_key = email_config.resend_api_key

            subject = "Reset Your CMMS Password"
            html_content = f"""
            <h2>Password Reset Request</h2>
            <p>You requested a password reset for your CMMS account.</p>
            <p>Click the button below to set a new password. This link expires in <strong>30 minutes</strong>.</p>
            <p style="margin: 24px 0;">
                <a href="{reset_link}"
                   style="background:#C90031;color:#fff;padding:12px 24px;border-radius:6px;
                          text-decoration:none;font-weight:bold;display:inline-block;">
                    Reset My Password
                </a>
            </p>
            <p style="font-size:13px;color:#555;">
                Or copy this link into your browser:<br/>
                <code style="word-break:break-all;">{reset_link}</code>
            </p>
            <p>If you did not request a password reset, please ignore this email.</p>
            <hr/>
            <p style="font-size:12px;color:#666;">
                Carry Mark Management System (CMMS)<br/>
                Universiti Teknologi Malaysia
            </p>
            """

            resend.Emails().send({
                "from": f"{email_config.email_from_name} <{email_config.email_from_address}>",
                "to": email,
                "subject": subject,
                "html": html_content,
            })

            logger.info(f"Password reset email sent to {email}")
            return True

        except Exception as e:
            logger.error(f"Failed to send password reset email to {email}: {str(e)}")
            return False
