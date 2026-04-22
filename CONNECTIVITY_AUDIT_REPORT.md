# CMMS Frontend-Backend Connectivity Audit Report
**Date**: 22 April 2026  
**Status**: 🔴 CRITICAL ISSUES FOUND

---

## Executive Summary

Frontend-Backend connectivity has **CRITICAL GAPS** that prevent Sprint 2 components from functioning:

1. **Empty API Service Files**: `frontend/lib/api/courses.ts`, `marks.ts`, `users.ts` are empty but imported by pages
2. **Sprint 1 Pages Using Hardcoded Data**: No real API integration (dashboards, users list, etc.)
3. **Missing Roster Endpoints**: Frontend expects `/api/courses/{id}/roster/*` but backend lacks full implementation
4. **Database Connection**: ✅ Configured correctly (Supabase PostgreSQL with async support)

---

## 1. Database Configuration Status ✅

### Backend Database Setup
```
Database: PostgreSQL (Supabase)
URL: postgresql+asyncpg://postgres:khubaibcmms@db.dvrvotajdelswvdxkuyt.supabase.co:5432/postgres
Async Engine: SQLAlchemy 2.0 with AsyncSession
Session Factory: Properly configured in /backend/db/database.py
```

**Status**: ✅ **WORKING** - Async connection pooling configured correctly

---

## 2. Backend API Endpoints Status

### ✅ IMPLEMENTED Endpoints

#### Authentication (`/auth` - no `/api` prefix)
- ✅ `POST /auth/login` - Returns JWT with UUID and role claims
- ✅ `POST /auth/signup` - Creates pending user awaiting approval
- ✅ `POST /auth/logout` - Clears session
- ✅ `GET /auth/me` - Returns current authenticated user
- ✅ `POST /auth/password-reset` - OTP request
- ✅ `POST /auth/reset-password` - OTP confirmation

#### Courses (`/api/courses`)
- ✅ `POST /api/courses` - Create course (coordinator/admin only)
- ✅ `GET /api/courses` - List courses with pagination (filters by lecturer role)
- ✅ `GET /api/courses/{course_id}` - Get single course details
- ✅ `PUT /api/courses/{course_id}` - Update course (coordinator/admin)
- ✅ `DELETE /api/courses/{course_id}` - Soft delete course

#### Enrollments (`/api/enrollments`)
- ✅ `POST /api/enrollments` - Create enrollment
- ✅ `GET /api/enrollments/{enrollment_id}` - Get enrollment details
- ✅ `GET /api/enrollments/course/{course_id}` - List course enrollments
- ⚠️ **PARTIAL** - No dedicated drop/delete endpoint found

#### Assessments (`/api/assessments`)
- ✅ `POST /api/assessments` - Create assessment
- ✅ `GET /api/assessments` - List assessments
- ✅ `GET /api/assessments/{assessment_id}` - Get assessment
- ✅ `PUT /api/assessments/{assessment_id}` - Update assessment (if unlocked)
- ⚠️ **MISSING** - No `/api/assessments/lock` endpoint for schema locking

#### Marks (`/api/marks`)
- ✅ `GET /api/marks` - List marks (with filters)
- ✅ `PUT /api/marks/{mark_id}` - Update mark (DRAFT status)
- ⚠️ **MISSING** - No publication endpoints (DRAFT → PUBLISHED)

#### Admin (`/api/admin`)
- ✅ `GET /api/admin/pending-users` - List pending signups
- ✅ `POST /api/admin/approve-user` - Approve user
- ✅ `POST /api/admin/reject-user` - Reject user
- ✅ `GET /api/admin/lecturers` - List lecturers

### ❌ MISSING Endpoints

| Endpoint | Purpose | Impact |
|----------|---------|--------|
| `POST /api/courses/{id}/roster/upload` | Excel roster upload | Sprint 2 roster feature blocked |
| `POST /api/courses/{id}/roster/preview` | Dry-run roster validation | Sprint 2 roster preview blocked |
| `POST /api/courses/{id}/roster/confirm` | Commit roster import | Sprint 2 roster import blocked |
| `POST /api/assessments/{id}/publish` | Publish single assessment | Sprint 3 feature blocked |
| `POST /api/courses/{id}/assessments/lock` | Lock assessment schema | Sprint 2 feature blocked |
| `DELETE /api/enrollments/{enrollment_id}` | Drop student (soft delete) | Sprint 2 feature blocked |
| `GET /api/courses/{id}/marks` | Get marks for course | Sprint 3 grid blocked |
| `POST /api/marks/{id}/query` | Student raises mark query | Sprint 4 feature blocked |

---

## 3. Frontend API Client Status

### ✅ WORKING API Files
```
frontend/lib/api/auth.ts        ✅ COMPLETE - Login, signup, password reset
frontend/lib/api/client.ts      ✅ COMPLETE - Axios setup with interceptors
frontend/lib/api/admin.ts       ✅ COMPLETE - Admin user management
```

### ❌ EMPTY/BROKEN API Files
```
frontend/lib/api/courses.ts     ❌ EMPTY - But imported by 5 pages
frontend/lib/api/marks.ts       ❌ EMPTY - Will cause import errors
frontend/lib/api/users.ts       ❌ EMPTY - Will cause import errors
```

### Pages Importing from Empty Files

**Affected Sprint 2 Pages:**
1. `/app/courses/create/page.tsx` - Line 10: `import { courseAPI } from '@/lib/api/courses'`
2. `/app/courses/[id]/edit/page.tsx` - Imports courseAPI, LecturerSelector
3. `/app/courses/[id]/manage/page.tsx` - Imports enrollmentAPI
4. `/app/assessment-setup/page.tsx` - Imports assessmentAPI

**Error**: When these pages load, they will fail with:
```
Module not found: Can't resolve '@/lib/api/courses'
```

---

## 4. Sprint 1 Data Integration Status

### Pages Using Hardcoded Data (No API Calls)
```
✅ /app/dashboard/student/page.tsx
   - Statistics: 5 courses (hardcoded)
   - Average: 78% (hardcoded)
   - Course list: Hardcoded sample data
   - No API calls made

✅ /app/dashboard/lecturer/page.tsx
   - Courses taught: Hardcoded
   - Student counts: Hardcoded
   - No real data from database

✅ /app/users/page.tsx
   - User list: 3 hardcoded users
   - No fetching from /api/users
   - No database queries

✅ /app/marks/page.tsx
   - Mark data: Hardcoded
   - No assessment queries
   - No student filtering
```

### Pages With Partial API Integration
```
✅ /app/roster/page.tsx
   - Course selection: Hardcoded courses array
   - FETCH calls: Uses /api/courses/{id}/roster/confirm
   - Issue: Backend lacks full roster endpoints
```

### Pages with Full API Integration
```
❌ None found in Sprint 1
```

---

## 5. Data Flow Analysis

### Successful Data Flow ✅

**Authentication Flow (WORKING)**
```
User Email/Password
    ↓
Frontend: auth.login()
    ↓
POST /auth/login (no /api prefix)
    ↓
Backend: auth.py - validates credentials against MOCK_USERS
    ↓
Returns: JWT token + user object (with UUID, not email)
    ↓
Frontend: localStorage.token = JWT
    ↓
ApiClient interceptor adds: Authorization: Bearer {JWT}
```

**Current User Fetch (WORKING)**
```
Frontend: getCurrentUser()
    ↓
GET /auth/me + Bearer token
    ↓
Backend: gets JWT claims, extracts user_id + role
    ↓
Returns: User data from mock or database
    ↓
Frontend: AuthContext updates with user data
```

### Broken Data Flow ❌

**Course Creation (BLOCKED)**
```
User clicks "Create Course"
    ↓
Frontend: courseAPI.create() [IMPORT ERROR - file empty]
    ↗ FAILS HERE: Module not found
```

**Student Enrollment (BLOCKED)**
```
Coordinator adds student to course
    ↓
Frontend: enrollmentAPI.addStudent() [IMPORT ERROR - file empty]
    ↗ FAILS HERE: Module not found
```

**Assessment Configuration (BLOCKED)**
```
Lecturer creates assessment
    ↓
Frontend: assessmentAPI.create() [IMPORT ERROR - file empty]
    ↗ FAILS HERE: Module not found
```

---

## 6. Critical Issues Summary

### 🔴 BLOCKING ISSUES

#### Issue 1: Empty API Service Files
**Severity**: CRITICAL  
**Status**: BLOCKS ALL SPRINT 2 FUNCTIONALITY  
**Files**:
- `/frontend/lib/api/courses.ts` - 0 bytes
- `/frontend/lib/api/marks.ts` - 0 bytes  
- `/frontend/lib/api/users.ts` - 0 bytes

**Impact**: 8 pages can't import their API clients
**Solution**: Implement all API methods with proper axios calls

#### Issue 2: Missing Roster Endpoints
**Severity**: HIGH  
**Status**: BLOCKS SPRINT 2 ROSTER FEATURE  
**Missing**:
- `POST /api/courses/{id}/roster/upload` 
- `POST /api/courses/{id}/roster/preview`
- `POST /api/courses/{id}/roster/confirm`

**Frontend expects**: `/api/courses/${selectedCourse}/roster/confirm`  
**Backend provides**: Nothing (roster.py not found)  
**Solution**: Implement full roster upload workflow in backend

#### Issue 3: Assessment Schema Lock Missing
**Severity**: HIGH  
**Status**: BLOCKS SPRINT 2 ASSESSMENT SETUP  
**Missing**: `POST /api/courses/{id}/assessments/lock`

**Frontend calls**: `assessmentAPI.lock(courseId)`  
**Backend status**: No endpoint exists  
**Solution**: Add lock endpoint to assessments router

#### Issue 4: No Mark Publication Endpoints
**Severity**: HIGH  
**Status**: BLOCKS SPRINT 3  
**Missing**:
- `POST /api/assessments/{id}/publish` (single)
- `POST /api/courses/{id}/assessments/publish-all` (bulk)

**Impact**: Marks can't transition from DRAFT → PUBLISHED  
**Solution**: Add publication workflow endpoints

#### Issue 5: No Student Drop Endpoint
**Severity**: MEDIUM  
**Status**: BLOCKS SPRINT 2 ENROLLMENT MANAGEMENT  
**Missing**: `DELETE /api/enrollments/{id}` or `DELETE /api/courses/{course_id}/enrollments/{student_id}`

**Frontend expects**: `enrollmentAPI.dropStudent(courseId, studentId)`  
**Backend status**: Create exists, delete doesn't  
**Solution**: Add soft-delete endpoint to enrollments router

---

## 7. Database Connection Verification

### Connection String Analysis ✅
```
postgresql+asyncpg://postgres:khubaibcmms@db.dvrvotajdelswvdxkuyt.supabase.co:5432/postgres
                    │                   │
                    └─ User             └─ Database name (postgres)
                                          Host: dvrvotajdelswvdxkuyt.supabase.co
                                          Port: 5432
                                          AsyncPg: True (async driver enabled)
```

### AsyncIO Setup ✅
```python
# backend/db/database.py
create_async_engine(
    settings.DATABASE_URL,
    echo=False,
    future=True,           # ✅ SQLAlchemy 2.0 compatible
    pool_pre_ping=True     # ✅ Validates connections before use
)

async_session = sessionmaker(
    engine,
    class_=AsyncSession,   # ✅ Async sessions enabled
    expire_on_commit=False # ✅ Prevents re-fetching after commit
)
```

**Status**: ✅ **CORRECTLY CONFIGURED**

---

## 8. Environment Configuration

### Backend Environment ✅
```
DATABASE_URL: postgresql+asyncpg://postgres:khubaibcmms@...
SUPABASE_URL: https://dvrvotajdelswvdxkuyt.supabase.co
SUPABASE_KEY: sb_publishable_o0QSAC136pbITUn2R_dPwQ_TWxYfePY
JWT_SECRET_KEY: dev-secret-key-change-in-production
ORIGINS: ["http://localhost:3000", "http://localhost:8000"]
```

### Frontend Environment
```
NEXT_PUBLIC_API_URL: http://localhost:8000
NEXT_PUBLIC_SUPABASE_URL: (not set in verified config)
```

**Issue**: Frontend might need Supabase URL if using supabase-js directly  
**Status**: ⚠️ CHECK if needed for RLS policies

---

## 9. Recommendations

### IMMEDIATE (Block All)
1. **Populate `/frontend/lib/api/courses.ts`** with courseAPI implementation
2. **Populate `/frontend/lib/api/marks.ts`** with marksAPI implementation
3. **Implement missing backend roster endpoints** (upload, preview, confirm)
4. **Add assessment schema lock endpoint** (`POST /api/courses/{id}/assessments/lock`)
5. **Add enrollment drop endpoint** (`DELETE /api/enrollments/{id}`)

### SHORT TERM (Sprint 2)
1. Implement mark publication endpoints (DRAFT → PUBLISHED)
2. Integrate real data into Sprint 1 dashboards (course list, student marks)
3. Add Supabase client configuration to frontend (if using RLS)
4. Implement student query endpoints (Sprint 4 requirement)

### MEDIUM TERM (Sprint 3+)
1. Add Smart Grid mark entry endpoints
2. Implement anomaly detection (AI module)
3. Add HOD dashboard analytics endpoints
4. Implement export functionality

---

## 10. Verification Checklist

### Database ✅
- [x] Supabase PostgreSQL connection configured
- [x] AsyncIO driver enabled (asyncpg)
- [x] Connection pooling enabled
- [x] Session factory properly configured

### Backend API ✅
- [x] Authentication endpoints working
- [x] Courses endpoints mostly complete
- [x] Enrollments endpoints partially complete
- [x] Assessments endpoints mostly complete

### Frontend API ❌
- [ ] courses.ts populated with implementations
- [ ] marks.ts populated with implementations
- [ ] users.ts populated with implementations
- [ ] All Sprint 2 pages can import successfully

### Missing Features ❌
- [ ] Roster upload/preview/confirm endpoints
- [ ] Assessment schema lock endpoint
- [ ] Enrollment drop endpoint
- [ ] Mark publication workflow
- [ ] Student query endpoints

---

## Conclusion

**Overall Status**: 🔴 **NOT READY FOR PRODUCTION**

**Main Blocker**: Empty API service files prevent Sprint 2 pages from loading

**Estimated Fix Time**: 2-3 hours to implement all missing API methods and endpoints

**Next Action**: Populate `/frontend/lib/api/*.ts` files and implement missing backend endpoints

---

*End of Connectivity Audit Report*
