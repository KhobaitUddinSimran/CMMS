# OTP (One-Time Password) System Implementation

## Overview
Complete OTP system for secure verification of user actions (password reset, email verification, login). Includes backend API endpoints, frontend components, and database models.

## Architecture

### Backend Components

#### 1. **OTP Model** (`backend/models/otp.py`)
- Stores OTP codes with metadata
- Tracks expiration, usage, and failed attempts
- Supports multiple OTP types

**Fields:**
- `email`: User's email address
- `code`: 6-digit OTP code
- `otp_type`: Type of OTP (password_reset, email_verification, login)
- `is_used`: Whether OTP has been used
- `is_locked`: Locked after max failed attempts
- `attempts`: Current verification attempt count
- `expires_at`: Expiration timestamp

**Methods:**
- `is_valid()`: Check if OTP is still valid
- `is_expired()`: Check if OTP is expired

#### 2. **OTP Service** (`backend/services/otp_service.py`)
Core business logic for OTP operations.

**Key Methods:**
- `generate_otp_code()`: Generate random 6-digit code
- `create_otp()`: Create new OTP record
- `verify_otp()`: Validate OTP code with error messages
- `mark_otp_used()`: Mark OTP as consumed
- `resend_otp()`: Create new OTP (invalidates old attempts)
- `cleanup_old_otps()`: Delete expired/used OTPs
- `cleanup_all_expired_otps()`: Maintenance cleanup

**OTP Expiration Times:**
- `password_reset`: 15 minutes
- `email_verification`: 24 hours
- `login`: 10 minutes

**Security Features:**
- Max 5 verification attempts before lockout
- Automatic expiration times
- Cleanup of old OTPs
- Type-based isolation (can't reuse OTP across types)

#### 3. **OTP Router** (`backend/routers/otp.py`)
RESTful API endpoints for OTP operations.

**Endpoints:**

```
POST /api/otp/send
├─ Request: { email, otp_type }
├─ Response: { email, otp_type, expires_at, attempts_remaining, message }
└─ Description: Request OTP to be sent to email

POST /api/otp/verify
├─ Request: { email, code, otp_type }
├─ Response: { success, message, error? }
└─ Description: Verify OTP code for user

POST /api/otp/resend
├─ Request: { email, otp_type }
├─ Response: { email, otp_type, expires_at, attempts_remaining, message }
└─ Description: Request new OTP (with 60-second cooldown)

GET /api/otp/status
├─ Query: ?email=...&otp_type=...
├─ Response: { is_valid, is_expired, is_used, attempts, max_attempts }
└─ Description: Debug endpoint to check OTP status
```

### Frontend Components

#### 1. **OTPInput Component** (`frontend/components/OTPInput.tsx`)
Reusable input component for OTP entry.

**Features:**
- 6-digit input with auto-focus progression
- Paste support for full OTP
- Keyboard navigation (arrow keys, backspace)
- Digit-only validation
- Callback on complete

**Props:**
```typescript
{
  length?: number;           // Default: 6
  onComplete?: (otp) => void;
  onChange?: (otp) => void;
  disabled?: boolean;
  placeholder?: string;      // Default: "0"
  className?: string;
}
```

**Usage:**
```tsx
<OTPInput 
  length={6}
  onComplete={(otp) => handleVerify(otp)}
  disabled={loading}
/>
```

#### 2. **OTPVerification Component** (`frontend/components/OTPVerification.tsx`)
Full-page component for email + OTP verification flow.

**Props:**
```typescript
{
  purpose?: 'password-reset' | 'email-verification' | 'login';
  email?: string;
  onSuccess?: () => void;
}
```

**Features:**
- Two-stage flow: email entry → OTP verification
- Resend with cooldown timer
- Error/success notifications
- Automatic redirects on success
- Session storage for verification state

#### 3. **useOTP Hook** (`frontend/hooks/useOTP.ts`)
Custom React hook for OTP logic management.

**Returns:**
```typescript
{
  email: string;
  otp: string;
  loading: boolean;
  error: string;
  success: boolean;
  stage: 'email' | 'otp';
  resendCooldown: number;
  expiresAt: Date | null;
  
  // Methods
  setEmail(email: string): void;
  setOTP(otp: string): void;
  clearError(): void;
  sendOTP(email?: string): Promise<boolean>;
  verifyOTP(code?: string): Promise<boolean>;
  resendOTP(): Promise<boolean>;
  reset(): void;
  
  // Computed
  canResend: boolean;
  isOTPExpired: boolean;
}
```

**Usage:**
```tsx
const otp = useOTP('password_reset', {
  onSuccess: () => router.push('/reset-password'),
  onError: (error) => console.error(error),
});

// Send OTP
await otp.sendOTP('user@utm.my');

// Verify OTP
await otp.verifyOTP('123456');

// Resend OTP
await otp.resendOTP();
```

## Integration Guide

### Backend Integration

#### 1. Update Database
```bash
# Run migration to create OTP table
# The OTP model uses the Base model, so it will be created with other tables
```

#### 2. Use OTPService in your endpoints
```python
from services.otp_service import OTPService
from services.email_service import EmailService

# In your password reset endpoint
otp = await OTPService.create_otp(db, email, 'password_reset')
await EmailService.send_otp(email, otp.code)

# In your verification endpoint
is_valid, error = await OTPService.verify_otp(db, email, otp_code)
if is_valid:
    await OTPService.mark_otp_used(db, email, otp_code)
```

### Frontend Integration

#### 1. Password Reset Flow
```tsx
'use client';
import OTPVerification from '@/components/OTPVerification';

export default function PasswordResetPage() {
  return (
    <OTPVerification
      purpose="password-reset"
      onSuccess={() => {
        // Redirect to set new password
        window.location.href = '/set-new-password';
      }}
    />
  );
}
```

#### 2. Custom Implementation with Hook
```tsx
'use client';
import { useOTP } from '@/hooks/useOTP';

export default function LoginPage() {
  const otp = useOTP('login');

  if (otp.stage === 'otp') {
    return (
      <div>
        <OTPInput onComplete={(code) => otp.verifyOTP(code)} />
      </div>
    );
  }

  return (
    <form onSubmit={(e) => {
      e.preventDefault();
      otp.sendOTP();
    }}>
      <input
        type="email"
        value={otp.email}
        onChange={(e) => otp.setEmail(e.target.value)}
      />
      <button disabled={otp.loading}>Send OTP</button>
    </form>
  );
}
```

## Security Considerations

### ✅ Implemented
- 6-digit random codes (1M combinations)
- Expiration times (15 min, 24h, 10 min)
- Rate limiting: Max 5 attempts before lockout
- Used OTP cannot be reused
- Cooldown timer on resend (60 seconds)
- Database cleanup of expired OTPs
- HTTPS required in production
- Email verification via Resend API

### ⚠️ Recommended for Production
- Add IP-based rate limiting on `/api/otp/send`
- Implement email verification (domain verification)
- Use secure session/JWT for post-OTP verification
- Add logging for all OTP operations
- Enable database encryption at rest
- Regular cleanup job for expired OTPs (daily)

### 🔒 Best Practices
- Never log OTP codes
- Use HTTPS only
- Store in secure database
- Set appropriate expiration times per use case
- Implement CAPTCHA for repeated failures
- Add optional 2FA for sensitive operations

## Testing

### Backend Testing
```python
from services.otp_service import OTPService

# Create OTP
otp = await OTPService.create_otp(db, "test@utm.my", "password_reset")
print(f"OTP Code: {otp.code}")

# Verify OTP
is_valid, error = await OTPService.verify_otp(db, "test@utm.my", otp.code)
assert is_valid

# Mark as used
await OTPService.mark_otp_used(db, "test@utm.my", otp.code)

# Resend (creates new OTP)
new_otp = await OTPService.resend_otp(db, "test@utm.my", "password_reset")
assert new_otp.code != otp.code
```

### Frontend Testing
```tsx
// Test OTPInput component
it('auto-focuses next input after digit entry', () => {
  // Type "1" in first input → should focus second input
});

it('handles paste of full OTP code', () => {
  // Paste "123456" into first input → all fields should fill
});

// Test useOTP hook
it('sends OTP with email', async () => {
  const { sendOTP } = renderHook(() => useOTP('password_reset'));
  await sendOTP('test@utm.my');
  // Should call /api/otp/send
});
```

## API Response Examples

### Send OTP
```bash
curl -X POST http://localhost:8000/api/otp/send \
  -H "Content-Type: application/json" \
  -d '{"email":"user@utm.my","otp_type":"password_reset"}'
```

**Response:**
```json
{
  "email": "user@utm.my",
  "otp_type": "password_reset",
  "expires_at": "2024-04-15T12:15:00",
  "attempts_remaining": 5,
  "message": "OTP sent successfully to your email"
}
```

### Verify OTP
```bash
curl -X POST http://localhost:8000/api/otp/verify \
  -H "Content-Type: application/json" \
  -d '{"email":"user@utm.my","code":"123456","otp_type":"password_reset"}'
```

**Response:**
```json
{
  "success": true,
  "message": "OTP verified successfully",
  "error": null
}
```

### Error Response
```json
{
  "detail": "OTP has expired"
}
```

## Troubleshooting

### OTP not sent
- Check RESEND_API_KEY is set in `.env`
- Check email domain is verified on Resend dashboard
- Check email service logs: `backend/logs/email.log`

### OTP verification fails
- Verify 6-digit code is correct
- Check OTP hasn't expired
- Check OTP hasn't exceeded max attempts
- Use `/api/otp/status` endpoint to debug

### Rate limiting issues
- Wait 60 seconds before resending
- Implement exponential backoff on frontend
- Use CAPTCHA for repeated failures

## Maintenance

### Scheduled Tasks
```python
# Run daily cleanup job
@scheduler.scheduled_job('cron', hour=0)  # Daily at midnight
async def cleanup_expired_otps():
    await OTPService.cleanup_all_expired_otps(db)
    logger.info("Cleaned up expired OTPs")
```

### Monitoring
- Track failed verification attempts
- Monitor email sending success rate
- Alert on unusual OTP patterns
- Log all security events

## Files Created/Modified

**New Files:**
- `backend/models/otp.py` - OTP model
- `backend/services/otp_service.py` - OTP service
- `backend/schemas/otp.py` - OTP schemas
- `backend/routers/otp.py` - OTP endpoints
- `frontend/components/OTPInput.tsx` - OTP input component
- `frontend/components/OTPVerification.tsx` - Full OTP page
- `frontend/hooks/useOTP.ts` - OTP hook

**Modified Files:**
- `backend/models/__init__.py` - Added OTP import
- `backend/schemas/__init__.py` - Added OTP schemas
- `backend/services/__init__.py` - Added OTP service
- `backend/routers/__init__.py` - Added OTP router
- `backend/main.py` - Registered OTP router
