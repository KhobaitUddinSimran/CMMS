"""Email service using Resend"""
import logging
from typing import Optional
from pydantic_settings import BaseSettings

logger = logging.getLogger(__name__)

class EmailConfig(BaseSettings):
    resend_api_key: str = ""
    email_from_address: str = "noreply@cmms.utm.my"
    email_from_name: str = "CMMS"
    
    class Config:
        env_file = ".env"

email_config = EmailConfig()

class EmailService:
    @staticmethod
    async def send_otp(email: str, otp: str, expires_in_minutes: int = 15):
        """Send OTP via email for password reset"""
        if not email_config.resend_api_key:
            logger.warning(f"Email service not configured. OTP not sent to {email}")
            return False
        
        try:
            from resend import Resend
            
            client = Resend(api_key=email_config.resend_api_key)
            
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
            
            response = client.emails.send({
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
            from resend import Resend
            
            client = Resend(api_key=email_config.resend_api_key)
            
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
            
            response = client.emails.send({
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
            from resend import Resend
            
            client = Resend(api_key=email_config.resend_api_key)
            
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
            
            response = client.emails.send({
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
            from resend import Resend
            
            client = Resend(api_key=email_config.resend_api_key)
            
            html_content = f"""
            {body}
            <hr/>
            <p style="font-size: 12px; color: #666;">
                Carry Mark Management System (CMMS)<br/>
                Universiti Teknologi Malaysia
            </p>
            """
            
            response = client.emails.send({
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
