# Render Email (Gmail SMTP) Deployment Guide

## Overview

The CMMS application uses Gmail SMTP to send emails (OTP, notifications, marks published, etc.). This guide ensures email works correctly when deployed on Render.

## Configuration

### Local Development (port 587 - STARTTLS)

**File:** `.env`

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_LOGIN=your-email@gmail.com
SMTP_PASSWORD=your-app-password
EMAIL_FROM_ADDRESS=your-email@gmail.com
EMAIL_FROM_NAME=CMMS – UTM
ENVIRONMENT=development
```

**Behavior:**
- Connects to Gmail SMTP on port 587 with STARTTLS
- Good for localhost development
- Requires proper SSL certificates (installed via Python certificate utility)

### Render Production (port 465 - Implicit SSL)

**File:** `render.yaml`

```yaml
- key: SMTP_HOST
  value: smtp.gmail.com
- key: SMTP_PORT
  value: "465"
- key: SMTP_LOGIN
  sync: false          # Set in Render Dashboard
- key: SMTP_PASSWORD
  sync: false          # Set in Render Dashboard
- key: EMAIL_FROM_ADDRESS
  sync: false          # Set in Render Dashboard
- key: EMAIL_FROM_NAME
  value: CMMS – UTM
- key: ENVIRONMENT
  value: production
```

**Behavior:**
- Connects to Gmail SMTP on port 465 with implicit SSL
- More reliable for cloud deployments
- Requires Gmail App Password (not regular password)

## Gmail Setup Instructions

### 1. Enable 2-Factor Authentication (Required)

1. Go to [myaccount.google.com](https://myaccount.google.com)
2. Click **Security** (left sidebar)
3. Scroll to **2-Step Verification** and enable it
4. Complete the verification process

### 2. Generate App Password

1. Return to [myaccount.google.com](https://myaccount.google.com)
2. Click **Security** (left sidebar)
3. Scroll to **App passwords** (appears only if 2FA is enabled)
4. Select:
   - App: **Mail**
   - Device: **Windows Computer** (or your device)
5. Google generates a 16-character password
6. **Copy this password** (you'll need it for Render)

### 3. Set Render Environment Variables

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Select your **CMMS Backend** service
3. Click **Environment** (left sidebar)
4. Add/update these variables:

| Key | Value | Type |
|-----|-------|------|
| `SMTP_LOGIN` | your-email@gmail.com | String |
| `SMTP_PASSWORD` | (16-char app password from step 2) | String |
| `EMAIL_FROM_ADDRESS` | your-email@gmail.com | String |
| `CORS_ORIGINS` | https://cmms-frontend.onrender.com | String |

5. Click **Save Changes**
6. Redeploy the backend service

## Automatic Configuration

The email service automatically selects the correct configuration:

```python
# From backend/services/email_service.py
use_implicit_ssl = os.getenv('ENVIRONMENT', 'development') == 'production'
self.smtp_port = int(os.getenv('SMTP_PORT', '465' if use_implicit_ssl else '587'))
```

| Environment | Port | SSL Type | File |
|-------------|------|----------|------|
| `development` | 587 | STARTTLS | `.env` |
| `production` | 465 | Implicit SSL | `render.yaml` |

## Testing Email on Render

### Method 1: Trigger Email via API

Sign up as a new user → Check email for verification code

```bash
curl -X POST https://cmms-backend.onrender.com/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "full_name": "Test User",
    "password": "password123",
    "role": "student"
  }'
```

### Method 2: Check Backend Logs

1. Go to Render Dashboard
2. Select **CMMS Backend** service
3. Click **Logs** (top-right)
4. Look for email-related log messages:
   - ✅ `Sending email` - Email attempt started
   - ✅ `successfully sent` - Email sent successfully
   - ❌ `SMTP Authentication Error` - Wrong password
   - ❌ `Connection Error` - Network/firewall issue

Example successful logs:
```
2026-06-03 10:15:30 - backend.services.email_service - INFO - Sending email 'Your CMMS Password Reset Code' to user@example.com...
2026-06-03 10:15:32 - backend.services.email_service - INFO - ✓ Email 'Your CMMS Password Reset Code' successfully sent to user@example.com
```

## Troubleshooting

### ❌ SMTP Authentication Error

**Error Message:**
```
SMTP Authentication failed for khobaituddinsimran@gmail.com: 535 b'5.7.8 Username and password not accepted'
```

**Causes & Solutions:**

1. **Using regular Gmail password instead of App Password**
   - Solution: Generate new App Password (see Gmail Setup section)

2. **2-Factor Authentication not enabled**
   - Solution: Enable 2FA in Gmail security settings (required for App Passwords)

3. **Email/password has extra spaces**
   - Solution: Copy-paste carefully or use env var editor to verify no spaces

4. **App Password revoked**
   - Solution: Generate a new App Password

### ❌ Connection Error

**Error Message:**
```
Connection Error to SMTP server: [Errno 110] Connection timed out
```

**Causes & Solutions:**

1. **Port 587 blocked on Render** (why we use port 465)
   - Solution: Ensure `SMTP_PORT=465` in Render environment variables

2. **Gmail SMTP server unreachable**
   - Solution: Check internet connectivity, check if Gmail SMTP is available (rare)

3. **Firewall blocking outbound email**
   - Solution: Render allows SMTP; if blocked, contact Render support

### ❌ Email Not Received

**Error:** Email sent successfully but never arrives

**Causes & Solutions:**

1. **Email goes to spam/promotions folder**
   - Solution: Check spam folder, add sender to contacts

2. **Wrong email address in template**
   - Solution: Verify EMAIL_FROM_ADDRESS matches Gmail account

3. **Email not configured (skipped)**
   - Error log: `Email not configured... skipping send`
   - Solution: Check all email variables are set (SMTP_LOGIN, SMTP_PASSWORD, EMAIL_FROM_ADDRESS)

## Email Service Architecture

```
┌─────────────────────────────────────┐
│   Frontend (Next.js)                │
│   - User signup/login form          │
│   - Password reset request          │
└────────────┬────────────────────────┘
             │ API Call
             ▼
┌─────────────────────────────────────┐
│   Backend (FastAPI)                 │
│   - /auth/signup                    │
│   - /auth/password-reset            │
│   - /marks/publish (coordinator)    │
└────────────┬────────────────────────┘
             │ Calls EmailService
             ▼
┌─────────────────────────────────────┐
│   Email Service                     │
│   - Validates config (SMTP_LOGIN)   │
│   - Renders email HTML template     │
│   - Sends via Gmail SMTP            │
└────────────┬────────────────────────┘
             │ SMTP Connection (port 465)
             ▼
┌─────────────────────────────────────┐
│   Gmail SMTP (smtp.gmail.com:465)   │
│   - Implicit SSL connection         │
│   - Authenticates with App Password │
│   - Routes email to recipient       │
└─────────────────────────────────────┘
```

## Email Types Sent by CMMS

| Email Type | Trigger | Recipients |
|-----------|---------|-----------|
| **OTP Code** | Password reset request | User email |
| **Student Welcome OTP** | Student account created | Student email |
| **Marks Published** | Coordinator publishes marks | Student email |
| **Signup Confirmation** | New user registration | User email |
| **Email Verification Link** | Student email verification | Student email |
| **Query Submitted** | Student submits mark query | Coordinator email |

All templates include:
- Professional HTML formatting
- CMMS logo/branding
- Contact information
- "Do not reply" instruction
- Mobile-friendly responsive design

## Environment Variables Summary

| Variable | Dev Value | Render Value | Required |
|----------|-----------|--------------|----------|
| `SMTP_HOST` | smtp.gmail.com | smtp.gmail.com | ✅ Yes |
| `SMTP_PORT` | 587 | 465 | ✅ Yes |
| `SMTP_LOGIN` | user@gmail.com | user@gmail.com | ✅ Yes |
| `SMTP_PASSWORD` | app-password | app-password | ✅ Yes |
| `EMAIL_FROM_ADDRESS` | user@gmail.com | user@gmail.com | ✅ Yes |
| `EMAIL_FROM_NAME` | CMMS – UTM | CMMS – UTM | ✅ Yes |
| `ENVIRONMENT` | development | production | ✅ Yes |
| `FRONTEND_URL` | http://localhost:3000 | (auto-wired) | ⚠️ For links |

## Deployment Checklist

- [ ] Gmail 2-Factor Authentication enabled
- [ ] App Password generated (16 characters)
- [ ] Render SMTP_LOGIN set to Gmail address
- [ ] Render SMTP_PASSWORD set to App Password
- [ ] Render EMAIL_FROM_ADDRESS set to Gmail address
- [ ] Render SMTP_PORT explicitly set to "465"
- [ ] Render ENVIRONMENT set to "production"
- [ ] Backend service redeployed after env changes
- [ ] Test email sent successfully via API
- [ ] Check backend logs for success messages
- [ ] Verify email received in inbox (check spam too)

## Support

If email still doesn't work after following this guide:

1. **Check backend logs** for specific error messages
2. **Verify all Gmail credentials** are correct
3. **Ensure 2FA and App Password** are properly set up
4. **Verify SMTP_PORT=465** (not 587) on Render
5. **Check CORS_ORIGINS** includes your frontend URL

For additional help, refer to:
- [Gmail App Passwords Guide](https://support.google.com/accounts/answer/185833)
- [Render Environment Variables](https://render.com/docs/environment-variables)
- [Gmail SMTP Documentation](https://support.google.com/mail/answer/7126229)
