# 3-Step Signup Flow Implementation

## Overview

This document describes the complete implementation of a secure 3-step user registration flow with email verification and administrative approval.

**Flow:** User Sign Up → Email Verification via OTP → Administrator Approval → Account Activation

## Architecture

### State Machine

```
START
  ↓
┌─────────────────────────────────────────────┐
│ STEP 1: Signup Form Submission             │
│ POST /api/auth/signup                      │
│ - Create inactive user                     │
│ - Generate OTP                             │
│ - Send email with OTP                      │
└─────────────────────────────────────────────┘
  ↓ (success) → User(is_active=false, email_verified=false)
┌─────────────────────────────────────────────┐
│ STEP 2: Email Verification via OTP         │
│ POST /api/auth/signup/verify-otp           │
│ - Verify 6-digit OTP                       │
│ - Mark email as verified                   │
│ - Await admin review                       │
└─────────────────────────────────────────────┘
  ↓ (success) → User(is_active=false, email_verified=true, approval_status=pending)
┌─────────────────────────────────────────────┐
│ STEP 3: Admin Review & Approval            │
│ POST /api/admin/signup-requests/{id}/...   │
│ - Admin reviews verified signups           │
│ - Approve: activate account (is_active=t)  │
│ - Reject: mark as rejected                 │
└─────────────────────────────────────────────┘
  ↓ (approved) → User(is_active=true, approval_status=approved)
```

## Database Schema

### User Model Enhancement

Added 6 new fields to support the signup flow:

```python
class User(Base):
    # ... existing fields ...
    
    # New approval workflow fields
    email_verified: bool = False  # Step 2: OTP verified
    approval_status: str = "pending"  # pending | approved | rejected
    matric_number: str = None  # Unique, required for students
    approved_by: UUID = None  # Admin who approved
    approved_at: DateTime = None  # Approval timestamp
    rejection_reason: str = None  # Rejection details
```

**Status Combinations:**

| is_active | email_verified | approval_status | Meaning |
|-----------|---|---|---|
| false | false | pending | Form submitted, awaiting OTP verification |
| false | true | pending | Email verified, awaiting admin approval |
| true | true | approved | Account approved and active |
| false | true | rejected | Account rejected |

## API Endpoints

### 1. Signup Form Submission (Step 1)

**Endpoint:** `POST /api/auth/signup`

**Request:**
```json
{
  "email": "student@graduate.utm.my",
  "full_name": "John Doe",
  "password": "SecurePassword123",
  "confirm_password": "SecurePassword123",
  "role": "student",
  "matric_number": "A123456"
}
```

**Response (202 Accepted):**
```json
{
  "email": "student@graduate.utm.my",
  "message": "Signup form received. OTP sent to your email. Please verify to continue.",
  "next_step": "email_verification"
}
```

**Validation:**
- Email domain: @utm.my or @graduate.utm.my
- Password: minimum 8 characters
- Confirm password must match
- Matric number: required for students, must be unique
- Rate limit: 10 requests per hour

**Side Effects:**
- Creates inactive User in database
- Generates 24-hour OTP
- Sends OTP email (Resend API)

### 2. Email Verification (Step 2)

**Endpoint:** `POST /api/auth/signup/verify-otp`

**Request:**
```json
{
  "email": "student@graduate.utm.my",
  "code": "123456"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Email verified successfully. Your account is now awaiting administrator approval.",
  "next_step": "admin_approval"
}
```

**Validation:**
- OTP must be valid and not expired (24 hours)
- Email must have pending signup
- Rate limit: 10 requests per hour

**Side Effects:**
- Sets `email_verified = true`
- User now visible to admins for approval

### 3. Signup Status Check

**Endpoint:** `GET /api/auth/signup/status/{email}`

**Response:**
```json
{
  "email": "student@graduate.utm.my",
  "full_name": "John Doe",
  "role": "student",
  "approval_status": "pending",
  "email_verified": true,
  "message": "Your account is verified and awaiting administrator approval. Please check back soon."
}
```

**Possible Messages:**
- `"Awaiting email verification..."` - Form submitted, OTP sent
- `"Your account is verified and awaiting administrator approval..."` - Email verified
- `"Your account has been approved..."` - Approved
- `"Your application was not approved: <reason>"` - Rejected

### 4. Admin: List Pending Signups

**Endpoint:** `GET /api/admin/signup-requests`

**Query Parameters:**
- `skip`: 0 (default) - Pagination offset
- `limit`: 50 (default) - Items per page
- `approval_status`: "pending" (default) - Filter by status

**Response:**
```json
{
  "total": 5,
  "skip": 0,
  "limit": 50,
  "approval_status": "pending",
  "users": [
    {
      "user_id": "550e8400-e29b-41d4-a716-446655440000",
      "email": "student@graduate.utm.my",
      "full_name": "John Doe",
      "role": "student",
      "matric_number": "A123456",
      "email_verified": true,
      "approval_status": "pending",
      "submitted_at": "2024-01-15T10:30:00"
    }
  ]
}
```

**Requirements:**
- Admin role required
- Only shows users with `email_verified=true, approval_status=pending`

### 5. Admin: Approve Signup

**Endpoint:** `POST /api/admin/signup-requests/{user_id}/approve`

**Request:**
```json
{
  "message": ""
}
```

**Response:**
```json
{
  "success": true,
  "message": "Signup request for student@graduate.utm.my has been approved",
  "user_email": "student@graduate.utm.my"
}
```

**Side Effects:**
- Sets `is_active = true` (user can now login)
- Sets `approval_status = "approved"`
- Records `approved_by` (admin user ID)
- Records `approved_at` (timestamp)
- Sends approval email

**Requirements:**
- Admin role required

### 6. Admin: Reject Signup

**Endpoint:** `POST /api/admin/signup-requests/{user_id}/reject`

**Request:**
```json
{
  "reason": "Matric number not found in student records"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Signup request for student@graduate.utm.my has been rejected",
  "user_email": "student@graduate.utm.my",
  "reason": "Matric number not found in student records"
}
```

**Side Effects:**
- Sets `approval_status = "rejected"`
- Records `rejection_reason` (from request)
- Does NOT keep user in system (optional deletion)
- Sends rejection email with reason

**Requirements:**
- Admin role required

## Backend Implementation

### Service Layer (auth_service.py)

**Methods:**

#### 1. signup_step1_form()
```python
async def signup_step1_form(
    db: AsyncSession,
    email: str,
    full_name: str,
    password: str,
    role: str,
    matric_number: Optional[str] = None
) -> Tuple[bool, dict]
```

**Logic:**
- Validates email, password, matric uniqueness
- Creates User with is_active=false, email_verified=false
- Returns success status and user info

#### 2. signup_step2_verify_otp()
```python
async def signup_step2_verify_otp(
    db: AsyncSession,
    email: str,
    otp_code: str
) -> Tuple[bool, dict]
```

**Logic:**
- Validates OTP (calls OTPService.verify_otp)
- Sets email_verified=true on user
- Returns success status

#### 3. get_signup_status()
```python
async def get_signup_status(
    db: AsyncSession,
    email: str
) -> dict
```

**Returns:**
- email, full_name, role, email_verified, approval_status
- Human-readable status message

#### 4. approve_signup()
```python
async def approve_signup(
    db: AsyncSession,
    user_id: UUID,
    admin_id: UUID
) -> Tuple[bool, dict]
```

**Effects:**
- Sets is_active=true, approval_status=approved
- Records approve admin and timestamp

#### 5. reject_signup()
```python
async def reject_signup(
    db: AsyncSession,
    user_id: UUID,
    reason: str
) -> Tuple[bool, dict]
```

**Effects:**
- Sets approval_status=rejected, rejection_reason

#### 6. get_pending_signups()
```python
async def get_pending_signups(
    db: AsyncSession,
    skip: int = 0,
    limit: int = 50
) -> Tuple[List[User], int]
```

**Returns:**
- Users with email_verified=true, approval_status=pending
- Total count for pagination

### Email Service

The EmailService (email_service.py) provides email delivery via Resend API:

**New Methods for 3-Step Flow:**

```python
@staticmethod
async def send_approval_email(email: str, full_name: str):
    """Send account approval notification"""
    
@staticmethod
async def send_rejection_email(email: str, full_name: str, reason: str):
    """Send account rejection notification with reason"""
```

**Email Templates:**

- OTP: 6-digit code, 24-hour expiration
- Approval: Login instructions, account activated
- Rejection: Reason provided, contact support

### OTP Integration

The signup flow reuses the existing OTP system:

- **OTP Type:** `email_verification`
- **Duration:** 24 hours
- **Digits:** 6 character code
- **Delivery:** Resend API via EmailService.send_otp()

## Frontend Integration

### Step 1: Signup Form Component

```typescript
export function SignupForm() {
  const [formData, setFormData] = useState({
    email: '',
    fullName: '',
    password: '',
    confirmPassword: '',
    role: 'student',
    matricNumber: ''
  });
  
  const handleSubmit = async () => {
    const response = await fetch('/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify(formData)
    });
    
    if (response.ok) {
      // Navigate to OTP verification with email
      navigate(`/signup/verify-otp?email=${formData.email}`);
    }
  };
  
  return (
    // Form with email, password, role selection
    // Conditional matric_number field for students
  );
}
```

### Step 2: OTP Verification Component

Integration with existing OTPInput component:

```typescript
export function SignupOTPVerification({ email }) {
  const [otpCode, setOtpCode] = useState('');
  
  const handleVerify = async () => {
    const response = await fetch('/api/auth/signup/verify-otp', {
      method: 'POST',
      body: JSON.stringify({
        email,
        code: otpCode
      })
    });
    
    if (response.ok) {
      // Navigate to status checking page
      navigate(`/signup/status?email=${email}`);
    }
  };
  
  return (
    // OTPInput component (6 digits, auto-progression)
    // Resend OTP button
  );
}
```

### Step 3: Signup Status Page

```typescript
export function SignupStatus({ email }) {
  const [status, setStatus] = useState(null);
  const [polling, setPolling] = useState(true);
  
  useEffect(() => {
    const fetchStatus = async () => {
      const response = await fetch(`/api/auth/signup/status/${email}`);
      const data = await response.json();
      setStatus(data);
      
      // Stop polling when approved or rejected
      if (data.approval_status !== 'pending') {
        setPolling(false);
      }
    };
    
    if (polling) {
      fetchStatus();
      const timer = setInterval(fetchStatus, 5000); // Poll every 5 seconds
      return () => clearInterval(timer);
    }
  }, [polling]);
  
  return (
    // Show current status with message
    // If approved: login button
    // If rejected: retry signup button
    // If pending: "Awaiting approval..." with refresh button
  );
}
```

### Step 4: Admin Approval Dashboard

```typescript
export function AdminApprovalDashboard() {
  const [signups, setSignups] = useState([]);
  
  const loadPendingSignups = async () => {
    const response = await fetch('/api/admin/signup-requests?approval_status=pending');
    const data = await response.json();
    setSignups(data.users);
  };
  
  const handleApprove = async (userId) => {
    await fetch(`/api/admin/signup-requests/${userId}/approve`, {
      method: 'POST',
      body: JSON.stringify({ message: '' })
    });
    loadPendingSignups();
  };
  
  const handleReject = async (userId, reason) => {
    await fetch(`/api/admin/signup-requests/${userId}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reason })
    });
    loadPendingSignups();
  };
  
  return (
    // List pending signups in table format
    // Approve/Reject buttons for each
    // Rejection reason textarea
    // Auto-refresh indicator
  );
}
```

## Data Flow

### Complete Example Flow

1. **User submits form:**
   ```
   Student → POST /api/auth/signup
   → Service: Creates User(is_active=false, email_verified=false)
   → Service: Creates OTP(type=email_verification, expires_in=1440min)
   → Email: Sends {"code": "123456"}
   ```

2. **User verifies OTP:**
   ```
   Student → POST /api/auth/signup/verify-otp (code="123456")
   → Service: Validates OTP
   → Service: Sets User.email_verified = true
   → Response: next_step="admin_approval"
   ```

3. **User checks status:**
   ```
   Student → GET /api/auth/signup/status/their@email.com
   → Service: Returns status with message
   → Response: "Awaiting administrator approval..."
   ```

4. **Admin reviews:**
   ```
   Admin → GET /api/admin/signup-requests
   → Returns: [User{email_verified=true, approval_status=pending}]
   ```

5. **Admin approves:**
   ```
   Admin → POST /api/admin/signup-requests/{user_id}/approve
   → Service: Sets User.is_active=true, approval_status=approved
   → Email: Sends approval email
   → User can now login
   ```

## Security Considerations

### Email Verification
- **OTP Validity:** 24 hours per email_verification OTP type
- **OTP Format:** 6 digit random code
- **Resend Attempts:** Limited to 10/hour per endpoint

### Admin Approval
- **Role Requirement:** `admin` role enforced on all approval endpoints
- **Audit Trail:** Records `approved_by` and `approved_at`
- **Rate Limiting:** Standard admin endpoint limits

### Password Requirements
- **Minimum Length:** 8 characters
- **Hashing:** bcrypt with passlib
- **Confirmation:** Must match on signup

### Email Domain Validation
- **Allowed Domains:** @utm.my, @graduate.utm.my
- **Validation Location:** Both request body validation and service layer
- **Enforcement:** Prevents non-UTM email addresses

## Testing Checklist

### Backend Tests
- [ ] Signup form validation (invalid email, password mismatch)
- [ ] OTP generation and email sending
- [ ] OTP verification (valid, expired, invalid codes)
- [ ] Email verification state transitions
- [ ] Admin list pending signups
- [ ] Admin approve user (sets is_active=true)
- [ ] Admin reject user (sets rejection reason)
- [ ] User can login only after approval
- [ ] Matric number uniqueness for students
- [ ] Rate limiting on signup endpoints

### Frontend Tests
- [ ] Signup form rendering and validation
- [ ] OTP input component integration
- [ ] Status checking with polling
- [ ] Status page messages match backend
- [ ] Admin dashboard pagination
- [ ] Approve/reject buttons functionality
- [ ] Rejection reason textarea display

### Integration Tests
- [ ] Full 3-step flow from signup to login
- [ ] Email delivery verification (Resend API)
- [ ] Database state consistency
- [ ] Admin audit trail tracking
- [ ] Session management after approval

## Deployment Notes

### Environment Variables
```bash
RESEND_API_KEY=re_...          # Required for email
EMAIL_FROM_ADDRESS=noreply@cmms.utm.my
EMAIL_FROM_NAME=CMMS
DATABASE_URL=postgresql://...  # Must have user table with new fields
```

### Database Migration
The User model includes new fields for this feature. Database migration required:
- email_verified (boolean)
- approval_status (string, default 'pending')
- matric_number (string, unique)
- approved_by (UUID, nullable)
- approved_at (datetime, nullable)
- rejection_reason (text, nullable)

### Rate Limiting
- Development: Shared pool (10 req/hour applies to all dev users)
- Production: Per-IP limiting (10 req/hour per IP)

## Troubleshooting

### User stuck in "Awaiting Approval"
- Check admin endpoint: `GET /api/admin/signup-requests`
- Verify user record: `email_verified=true, approval_status=pending`
- Admin may need to approve manually

### OTP Not Received
- Check Resend API key configuration
- Verify email in spam/junk folder
- Check email service logs
- Resend OTP via admin endpoint or app

### Admin Cannot See Pending Signups
- Verify admin role assigned to user
- Check database: user should have `email_verified=true`
- Ensure `approval_status='pending'` not changed

### Approval Email Not Sent
- EmailService.send_approval_email failure is logged but non-blocking
- Check email service logs
- Manually verify user is activated (can login)

## Future Enhancements

### Possible Improvements
1. **Email Validation:** Verify real email addresses during signup
2. **Department Verification:** Auto-approve based on matric number validation
3. **Multi-Level Approval:** Department head → Admin approval chain
4. **Signup Notifications:** Notify admin immediately when user verifies email
5. **Approval Workflow:** Custom approval templates per role
6. **Bulk Operations:** Admin bulk approve/reject from dashboard
7. **Audit Dashboard:** View all approval history and timeline
8. **Custom Rejection Reasons:** Predefined rejection reason templates

## Code Files

- Backend Models: [backend/models/user.py](../backend/models/user.py)
- Backend Schemas: [backend/schemas/auth.py](../backend/schemas/auth.py)
- Auth Service: [backend/services/auth_service.py](../backend/services/auth_service.py)
- Auth Router: [backend/routers/auth.py](../backend/routers/auth.py)
- Admin Router: [backend/routers/admin.py](../backend/routers/admin.py)
- Email Service: [backend/services/email_service.py](../backend/services/email_service.py)
- OTP Service: [backend/services/otp_service.py](../backend/services/otp_service.py)

## Version History

| Date | Version | Status |
|------|---------|--------|
| 2024-01-15 | 1.0 | ✅ Backend Complete |
| TBD | 2.0 | Frontend Implementation |
| TBD | 3.0 | Admin Dashboard |
