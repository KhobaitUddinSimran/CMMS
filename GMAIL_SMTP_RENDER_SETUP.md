# Gmail SMTP Setup for Render Deployment

## 🔧 Fixes Applied

The email service has been **enhanced for Render compatibility** with the following fixes:

### 1. **SSL/TLS Configuration**
- **Old (Broken on Render):** Port 587 with STARTTLS
- **New (Works on Render):** Port 465 with implicit SSL in production, 587 with STARTTLS on localhost
- **Why:** Port 465 with implicit SSL is more reliable on cloud platforms like Render

### 2. **Proper SSL Context**
- Added `ssl.create_default_context()` for certificate verification
- Prevents SSL certificate validation errors
- Improves security on Render

### 3. **Connection Timeouts**
- Added 15-second timeout to prevent hanging connections
- Better handling of network delays on Render infrastructure

### 4. **Improved Error Handling**
- Specific error messages for authentication, SMTP, and network issues
- Better logging for debugging on Render logs console

### 5. **Gmail App Password Support**
- Code now properly validates and strips whitespace from credentials
- Works with Gmail App Passwords (recommended over regular passwords)

---

## ✅ Setup Instructions for Render

### Step 1: Generate Gmail App Password
1. Go to: **https://myaccount.google.com/apppasswords**
2. Select **Mail** and **Windows Computer** (or your device)
3. Click **Generate**
4. Copy the **16-character password** (this is your `SMTP_PASSWORD`)

### Step 2: Configure Environment Variables on Render

Go to **Render Dashboard → cmms-backend → Environment → Environment Variables**

Add/Update these variables:

| Variable | Value | Example |
|----------|-------|---------|
| `SMTP_HOST` | `smtp.gmail.com` | `smtp.gmail.com` |
| `SMTP_PORT` | `465` | `465` |
| `SMTP_LOGIN` | Your Gmail email | `your-email@gmail.com` |
| `SMTP_PASSWORD` | **App Password (16 chars)** | `abcd efgh ijkl mnop` |
| `EMAIL_FROM_ADDRESS` | Sender email | `noreply@cmms.utm.my` or Gmail address |
| `EMAIL_FROM_NAME` | Display name | `CMMS – UTM` |
| `ENVIRONMENT` | `production` | `production` |

**⚠️ Important:** Use your **Gmail App Password**, NOT your regular Gmail password

### Step 3: Deploy

Push your changes to trigger a new deployment:
```bash
git push origin main
```

Render will automatically rebuild and deploy with the new email configuration.

---

## 🧪 Testing the Email on Render

### Via Render Logs Console

1. Go to **Render Dashboard → cmms-backend → Logs**
2. Look for email configuration on startup:
   ```
   Email config: host=smtp.gmail.com, port=465, tls=False, ssl=True, configured=True
   ```

### Send a Test Email

Trigger an action that sends an email:
- **Sign up a new user** (receives welcome email)
- **Request password reset** (receives OTP)
- **Admin approves user** (user receives approval email)

### Check for Errors in Logs

**Successful send:**
```
INFO: ✓ Email 'Welcome to CMMS!' successfully sent to user@example.com
```

**Common Error Messages:**

| Error | Solution |
|-------|----------|
| `SMTP Authentication Error: Check SMTP_LOGIN and SMTP_PASSWORD` | Wrong Gmail email or App Password. Regenerate App Password. |
| `Connection Error to SMTP server` | Render's network firewall blocking Gmail. Contact Render support. |
| `SSLError: certificate_verify_failed` | SSL certificate issue. Verify `SMTP_HOST=smtp.gmail.com`. |
| `Email not configured` | Missing `SMTP_LOGIN`, `SMTP_PASSWORD`, or `EMAIL_FROM_ADDRESS`. |

---

## 📝 Testing Checklist

- [ ] Gmail App Password generated and copied
- [ ] All 6 SMTP variables set on Render
- [ ] `SMTP_PORT` set to `465` (not 587)
- [ ] Deployment completed successfully
- [ ] Check Render logs for "Email config: ... configured=True"
- [ ] Trigger a test email (signup, password reset, etc.)
- [ ] Verify email received in inbox
- [ ] Check email has correct sender name and formatting

---

## 🔍 Debugging Commands (SSH into Render)

If emails still don't work, run these diagnostic tests:

```bash
# Test SMTP connection
python3 -c "
import smtplib, ssl
context = ssl.create_default_context()
server = smtplib.SMTP_SSL('smtp.gmail.com', 465, context=context, timeout=15)
print('✓ SMTP connection successful')
server.quit()
"

# Verify environment variables
echo "SMTP_LOGIN: $SMTP_LOGIN"
echo "SMTP_PORT: $SMTP_PORT"
echo "ENVIRONMENT: $ENVIRONMENT"
```

---

## 📚 Related Files

- **Email Service Code:** `backend/services/email_service.py`
- **Configuration:** `backend/core/config.py`
- **Render Config:** `render.yaml`
- **Local Development:** `.env` file (port 587, localhost)

---

## 🎯 Key Differences: Localhost vs Render

| Aspect | Localhost | Render |
|--------|-----------|--------|
| SMTP Port | 587 (STARTTLS) | 465 (Implicit SSL) |
| SSL Context | Optional | Required |
| Timeout | Not critical | 15 seconds enforced |
| Environment | `development` | `production` |
| Gmail App Password | Optional | **Required** |

---

## ⚠️ Common Issues & Solutions

### **Issue 1: "Email not configured"**
**Solution:** Ensure all SMTP variables are set on Render (don't use `sync: false` if values are missing)

### **Issue 2: Authentication fails**
**Solution:** 
- Verify Gmail App Password (not regular password)
- Check for accidental spaces in credentials
- Regenerate App Password if unsure

### **Issue 3: Connection timeout**
**Solution:**
- Verify Render can reach `smtp.gmail.com:465` (contact Render support if blocked)
- Check network logs on Render console

### **Issue 4: Works on localhost but not on Render**
**Solution:**
1. Verify `ENVIRONMENT=production` on Render
2. Check port 465 is configured (not 587)
3. Verify SSL context is initialized
4. Enable debug logging and check Render logs

---

## 🚀 After Successful Deployment

Once emails work:
1. Monitor **Render Logs** for any email errors
2. Test each email type:
   - OTP codes
   - Welcome emails
   - Approval notifications
   - Query replies
3. Update `README_DEPLOYMENT.md` if needed

---

**Need help?** Check Render Dashboard Logs or contact your deployment team.
