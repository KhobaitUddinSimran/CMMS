"""Test script for email service - local development"""
import asyncio
import sys
from pathlib import Path

# Add backend to path
backend_dir = Path(__file__).parent
sys.path.insert(0, str(backend_dir))

from services.email_service import EmailService

async def test_email():
    """Test email sending"""
    print("Testing Email Service...")
    print("=" * 50)
    
    # Test with a simple notification
    test_email = "khobaituddinsimran@gmail.com"
    subject = "CMMS Email Test - Local Development"
    body = """
    <h2>Email Test Successful</h2>
    <p>This is a test email from the CMMS application running in local development mode.</p>
    <p>If you received this email, the Gmail SMTP configuration is working correctly.</p>
    <p><strong>Configuration:</strong></p>
    <ul>
        <li>SMTP Host: smtp.gmail.com</li>
        <li>SMTP Port: 587 (STARTTLS)</li>
        <li>Environment: development</li>
    </ul>
    """
    
    print(f"Sending test email to: {test_email}")
    print(f"Subject: {subject}")
    print()
    
    result = await EmailService.send_notification(test_email, subject, body)
    
    if result:
        print("✅ Email sent successfully!")
        print(f"Check your inbox at {test_email}")
    else:
        print("❌ Email failed to send")
        print("Check the console logs above for error details")
    
    return result

if __name__ == "__main__":
    asyncio.run(test_email())
