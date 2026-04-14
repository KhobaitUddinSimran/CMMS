# CMMS Backend Directory Structure & Modules

**Project**: FastAPI Python Application  
**Build Stage**: Sprint 1 Initialization  
**Status**: Sprint 1 (Weeks 1-2)

---

## 📁 COMPLETE BACKEND STRUCTURE

```
backend/
├── main.py                                 [SPRINT 1] FastAPI app entry point
├── requirements.txt                        [SPRINT 1] Production dependencies
├── requirements-dev.txt                    [SPRINT 1] Development dependencies
├── .env.example                            [SPRINT 1] Environment template
├── .env.local (gitignored)
│
├── core/                                   [SPRINT 1] Configuration & security
│   ├── __init__.py
│   ├── config.py                          [SPRINT 1] Settings (env vars, app config)
│   ├── security.py                        [SPRINT 1] JWT, password hashing (bcrypt)
│   ├── constants.py                       [SPRINT 1] App constants
│   └── exceptions.py                      [SPRINT 1] Custom exceptions
│
├── db/                                     [SPRINT 1] Database
│   ├── __init__.py
│   ├── database.py                        [SPRINT 1] SQLAlchemy async session
│   ├── session.py                         [SPRINT 1] Session management
│   └── base.py                            [SPRINT 1] declarative_base
│
├── models/                                 [SPRINT 1+] SQLAlchemy ORM models
│   ├── __init__.py
│   ├── user.py                            [SPRINT 1] User model + relationships
│   ├── course.py                          [SPRINT 2] Course model
│   ├── enrollment.py                      [SPRINT 2] Enrollment model
│   ├── assessment.py                      [SPRINT 2] Assessment model
│   ├── mark.py                            [SPRINT 3] Mark model
│   ├── audit_log.py                       [SPRINT 3] Audit log model
│   ├── query.py                           [SPRINT 3] Student query model
│   ├── lecturer_load.py                   [SPRINT 1] Lecturer workload tracking
│   └── base_model.py                      [SPRINT 1] Base model with timestamps
│
├── schemas/                                [SPRINT 1+] Pydantic validation schemas
│   ├── __init__.py
│   ├── auth.py                            [SPRINT 1] AuthRequest, AuthResponse, TokenRequest
│   ├── user.py                            [SPRINT 1] UserResponse, UserCreate, UserUpdate
│   ├── course.py                          [SPRINT 2] CourseRequest, CourseResponse
│   ├── enrollment.py                      [SPRINT 2] EnrollmentRequest, EnrollmentResponse
│   ├── assessment.py                      [SPRINT 2] AssessmentRequest, AssessmentResponse
│   ├── mark.py                            [SPRINT 3] MarkRequest, MarkResponse
│   ├── audit_log.py                       [SPRINT 3] AuditLogResponse
│   ├── query.py                           [SPRINT 3] QueryRequest, QueryResponse
│   ├── pagination.py                      [SPRINT 2] PaginationParams, PagedResponse
│   └── error.py                           [SPRINT 1] ErrorResponse, ValidationError
│
├── routers/                                [SPRINT 1+] API endpoints (routes)
│   ├── __init__.py
│   ├── auth.py                            [SPRINT 1] POST /login, /logout, /password-reset
│   ├── user.py                            [SPRINT 1] GET /me, PUT /profile, POST /password-change
│   ├── courses.py                         [SPRINT 2] CRUD courses
│   ├── enrollment.py                      [SPRINT 2] Manage enrollments, roster
│   ├── assessment.py                      [SPRINT 2] Assessment schema config
│   ├── marks.py                           [SPRINT 3] Smart Grid marks (GET, PATCH)
│   ├── queries.py                         [SPRINT 3] Student queries
│   ├── analytics.py                       [SPRINT 4] HOD analytics/metrics
│   ├── export.py                          [SPRINT 4] Export data (CSV)
│   ├── admin.py                           [SPRINT 4] Admin user management
│   └── health.py                          [SPRINT 1] GET /health
│
├── services/                               [SPRINT 1+] Business logic
│   ├── __init__.py
│   ├── auth_service.py                    [SPRINT 1] JWT, password, login logic
│   ├── user_service.py                    [SPRINT 1] User operations (CRUD)
│   ├── course_service.py                  [SPRINT 2] Course operations
│   ├── enrollment_service.py              [SPRINT 2] Enrollment/roster operations
│   ├── assessment_service.py              [SPRINT 2] Assessment schema logic
│   ├── mark_service.py                    [SPRINT 3] Mark operations, locking
│   ├── email_service.py                   [SPRINT 1] Email dispatch (OTP, notifications)
│   ├── query_service.py                   [SPRINT 3] Query handling
│   ├── audit_service.py                   [SPRINT 3] Audit logging
│   ├── analytics_service.py               [SPRINT 4] Metrics calculation
│   ├── export_service.py                  [SPRINT 4] CSV/Excel generation
│   ├── ai_service.py                      [SPRINT 4] Z-score anomaly detection
│   ├── file_service.py                    [SPRINT 2] Excel parsing, file upload
│   └── notification_service.py            [SPRINT 1] Toast/notification logic
│
├── dependencies/                           [SPRINT 1] FastAPI dependency injection
│   ├── __init__.py
│   ├── auth.py                            [SPRINT 1] get_current_user (JWT validation)
│   ├── role.py                            [SPRINT 1] Role-based dependencies (student, lecturer, etc)
│   ├── database.py                        [SPRINT 1] get_db session
│   ├── query_params.py                    [SPRINT 2] Pagination, filtering params
│   └── validators.py                      [SPRINT 1] Custom validators
│
├── middleware/                             [SPRINT 1] FastAPI middleware
│   ├── __init__.py
│   ├── cors.py                            [SPRINT 1] CORS configuration
│   ├── error_handler.py                   [SPRINT 1] Exception handlers
│   ├── logging.py                         [SPRINT 1] Request/response logging
│   ├── rate_limit.py                      [SPRINT 1] Rate limiting (login, password reset)
│   └── audit.py                           [SPRINT 3] Audit trail middleware
│
├── migrations/                             [SPRINT 1] Alembic DB migrations
│   ├── alembic.ini                        [SPRINT 1] Alembic config
│   ├── env.py                             [SPRINT 1] Alembic env config
│   └── versions/                          [SPRINT 1] Migration files
│       ├── 001_create_users_table.py      [SPRINT 1]
│       ├── 002_create_courses_table.py    [SPRINT 2]
│       ├── 003_create_enrollments.py      [SPRINT 2]
│       ├── 004_create_assessments.py      [SPRINT 2]
│       ├── 005_create_marks_table.py      [SPRINT 3]
│       └── ...
│
├── tests/                                  Unit & integration tests
│   ├── conftest.py                        [SPRINT 1] pytest fixtures
│   ├── test_auth.py                       [SPRINT 1] Auth endpoint tests
│   ├── test_user.py                       [SPRINT 1] User endpoint tests
│   ├── test_courses.py                    [SPRINT 2] Course endpoint tests
│   ├── test_enrollment.py                 [SPRINT 2] Enrollment tests
│   ├── test_assessment.py                 [SPRINT 2] Assessment tests
│   ├── test_marks.py                      [SPRINT 3] Marks endpoint tests
│   ├── test_queries.py                    [SPRINT 3] Query endpoint tests
│   ├── test_analytics.py                  [SPRINT 4] Analytics tests
│   ├── test_export.py                     [SPRINT 4] Export tests
│   ├── fixtures/
│   │   ├── users.py                       [SPRINT 1] User fixtures
│   │   ├── courses.py                     [SPRINT 2] Course fixtures
│   │   ├── marks.py                       [SPRINT 3] Mark fixtures
│   │   └── ...
│   └── integration/
│       ├── test_auth_flow.py              [SPRINT 1] Full auth workflow
│       ├── test_course_flow.py            [SPRINT 2] Full course workflow
│       ├── test_marking_flow.py           [SPRINT 3] Full marking workflow
│       └── ...
│
├── utils/                                  [SPRINT 1] Utilities & helpers
│   ├── __init__.py
│   ├── validators.py                      [SPRINT 1] Custom validators (fields)
│   ├── email_templates.py                 [SPRINT 1] HTML email templates
│   ├── excel_parser.py                    [SPRINT 2] Excel file parsing (openpyxl)
│   ├── formatting.py                      [SPRINT 1] Data formatting helpers
│   ├── pagination.py                      [SPRINT 2] Pagination helpers
│   ├── date_utils.py                      [SPRINT 2] Date/time utilities
│   └── decorators.py                      [SPRINT 1] Custom decorators (role check, etc)
│
├── prompts/                                [SPRINT 1] LangChain prompts (AI)
│   ├── __init__.py
│   ├── anomaly_detection.py               [SPRINT 4] Anomaly detection prompt
│   └── ai_helpers.py                      [SPRINT 4] AI orchestration
│
└── pyproject.toml                          [SPRINT 1] Python project config (black, pytest, mypy)

```

---

## 🔨 SPRINT 1 BACKEND MODULES (TO BE CREATED - WEEKS 1-2)

### ✅ **FastAPI App Setup**
- `main.py` - FastAPI application factory, CORS middleware, exception handlers
- `core/config.py` - Settings from environment variables
- `core/security.py` - JWT token utilities, password hashing with bcrypt
- `core/constants.py` - App-level constants (JWT settings, pagination defaults)
- `core/exceptions.py` - Custom exceptions (InvalidToken, InvalidCredentials, etc)

### ✅ **Database Layer**
- `db/database.py` - SQLAlchemy async engine, session factory
- `db/session.py` - Dependency for getting DB sessions
- `db/base.py` - DeclarativeBase for ORM models

### ✅ **Core Models (User & Supporting)**
- `models/base_model.py` - Base model with id, created_at, updated_at
- `models/user.py` - User model (id, email, password_hash, role, name, is_active)
- `models/lecturer_load.py` - Lecturer workload tracking (for Sprint 1 basic setup)

### ✅ **Pydantic Schemas (Validation)**
- `schemas/auth.py`:
  - LoginRequest (email, password)
  - LoginResponse (user, token, role)
  - TokenResponse (access_token, token_type)
- `schemas/user.py`:
  - UserResponse (id, email, name, role, created_at)
  - UserCreate (email, password, name, role)
  - UserUpdate (name, email)
  - PasswordChangeRequest (old_password, new_password)
- `schemas/pagination.py` - PaginationParams (skip, limit, sort)
- `schemas/error.py` - ErrorResponse, ValidationErrorResponse

### ✅ **API Routers (Endpoints)**
1. **Health Check** (`routers/health.py`)
   - GET /health → {"status": "healthy", "version": "1.0.0"}

2. **Authentication** (`routers/auth.py`)
   - POST /api/auth/login → JWT token + role
   - POST /api/auth/password-reset → OTP generation
   - POST /api/auth/password-reset/confirm → Password update
   - POST /api/auth/logout → Token blacklist (optional)

3. **User** (`routers/user.py`)
   - GET /api/users/me → Current user info
   - PUT /api/users/me → Update profile
   - POST /api/users/password-change → Force password change
   - POST /api/users/send-otp → Send OTP via email

### ✅ **Services (Business Logic)**
1. **AuthService** (`services/auth_service.py`)
   - `create_access_token(user_id, role)`
   - `verify_password(plain, hashed)`
   - `hash_password(password)`
   - `decode_token(token)`

2. **UserService** (`services/user_service.py`)
   - `get_user_by_id(user_id)`
   - `get_user_by_email(email)`
   - `create_user(user_data)`
   - `update_user(user_id, update_data)`
   - `change_password(user_id, old_password, new_password)`

3. **EmailService** (`services/email_service.py`)
   - `send_otp(email, otp)`
   - `send_password_reset(email, reset_link)`
   - `send_notification(email, subject, body)`

4. **NotificationService** (`services/notification_service.py`)
   - `create_notification(user_id, message, type)`
   - `get_notifications(user_id)`

### ✅ **Dependencies (FastAPI DI)**
- `dependencies/auth.py`:
  - `get_current_user()` - Extract & validate JWT token
  - `get_current_active_user()` - Ensure user is active
  - `verify_role(required_role: UserRole)` - Role validation

- `dependencies/database.py`:
  - `get_db()` - Yield DB session

- `dependencies/validators.py`:
  - Email validator
  - Password complexity validator

### ✅ **Middleware**
- `middleware/cors.py` - CORS config (localhost:3000)
- `middleware/error_handler.py` - Global exception handlers
- `middleware/logging.py` - Request/response logging
- `middleware/rate_limit.py` - Rate limiting (login endpoint: 5 attempts/15 min)

### ✅ **Database Migrations (Alembic)**
- `migrations/alembic.ini` - Alembic configuration
- `migrations/env.py` - Alembic environment
- `migrations/versions/001_create_users_table.py` - Initial schema

### ✅ **Utils & Helpers**
- `utils/validators.py` - Custom field validators
- `utils/email_templates.py` - HTML templates for OTP, password reset emails
- `utils/formatting.py` - Data formatting (camelCase → snake_case)
- `utils/decorators.py` - Custom decorators (role_required, admin_only)

### ✅ **Testing**
- `tests/conftest.py` - pytest fixtures (db_session, test_client, auth_headers)
- `tests/test_auth.py` - Login endpoint tests
- `tests/test_user.py` - User endpoint tests
- `tests/fixtures/users.py` - User test data
- `tests/integration/test_auth_flow.py` - Full auth workflow test

### ✅ **Configuration Files**
- `pyproject.toml` - Python tool configs (black, pytest, mypy)
- `.env.example` - Safe environment template

---

## 📦 SPRINT 2+ MODULES (WILL BE EMPTY/PLACEHOLDER)

### Sprint 2 - Course Setup (Apr 20 - May 1)
- `models/course.py` - Course model
- `models/enrollment.py` - Enrollment model
- `models/assessment.py` - Assessment model
- `schemas/course.py` - Course schemas
- `services/course_service.py` - Course logic
- `services/file_service.py` - Excel parsing
- `routers/courses.py` - Course CRUD endpoints
- `tests/test_courses.py` - Course tests
- `migrations/versions/002_create_courses_table.py`

### Sprint 3 - Marking & Publication (May 4-15)
- `models/mark.py` - Mark model
- `models/audit_log.py` - Audit trail model
- `models/query.py` - Student query model
- `schemas/mark.py` - Mark schemas
- `services/mark_service.py` - Mark operations
- `services/audit_service.py` - Audit logging
- `routers/marks.py` - Smart Grid endpoints
- `middleware/audit.py` - Audit middleware
- `tests/test_marks.py` - Marking tests
- `migrations/versions/005_create_marks_table.py`

### Sprint 4 - Analytics & AI (May 18-29)
- `services/analytics_service.py` - Metrics calculation
- `services/export_service.py` - CSV/Excel export
- `services/ai_service.py` - Z-score anomaly detection
- `routers/analytics.py` - Analytics endpoints
- `routers/export.py` - Export endpoints
- `routers/admin.py` - Admin endpoints
- `prompts/anomaly_detection.py` - AI prompts
- `tests/test_analytics.py` - Analytics tests
- `tests/test_export.py` - Export tests

### Sprint 5 - Integration (Jun 1-12)
- Full E2E test suite
- Performance optimization
- API documentation

---

## 🎯 FILE CREATION PRIORITY (SPRINT 1)

### Priority 1 (Core Setup - Days 1-2)
- [ ] `main.py` - FastAPI app
- [ ] `pyproject.toml` - Config
- [ ] `requirements.txt` - Dependencies
- [ ] `requirements-dev.txt` - Dev dependencies
- [ ] `.env.example` - Environment template
- [ ] `core/config.py` - Settings
- [ ] `core/constants.py` - Constants
- [ ] `core/exceptions.py` - Exceptions
- [ ] `db/database.py` - Database setup
- [ ] `db/base.py` - Declarative base
- [ ] `models/base_model.py` - Base model with timestamps

### Priority 2 (Authentication - Days 2-4)
- [ ] `core/security.py` - JWT, password hashing
- [ ] `models/user.py` - User model
- [ ] `schemas/auth.py` - Auth schemas
- [ ] `schemas/user.py` - User schemas
- [ ] `services/auth_service.py` - Auth logic
- [ ] `services/user_service.py` - User logic
- [ ] `routers/auth.py` - Auth endpoints
- [ ] `routers/user.py` - User endpoints
- [ ] `dependencies/auth.py` - JWT validation
- [ ] `dependencies/database.py` - DB session

### Priority 3 (Email & Notifications - Days 4-5)
- [ ] `services/email_service.py` - Email service
- [ ] `services/notification_service.py` - Notifications
- [ ] `utils/email_templates.py` - Email templates
- [ ] `schemas/error.py` - Error schemas

### Priority 4 (Middleware & Utils - Days 5-6)
- [ ] `middleware/cors.py` - CORS setup
- [ ] `middleware/error_handler.py` - Exception handlers
- [ ] `middleware/logging.py` - Request logging
- [ ] `middleware/rate_limit.py` - Rate limiting
- [ ] `utils/validators.py` - Custom validators
- [ ] `utils/decorators.py` - Custom decorators
- [ ] `utils/formatting.py` - Formatting helpers

### Priority 5 (Database Migrations - Day 6)
- [ ] `migrations/alembic.ini` - Alembic config
- [ ] `migrations/env.py` - Migration env
- [ ] `migrations/versions/001_create_users_table.py` - Initial migration

### Priority 6 (Testing - Days 6-7)
- [ ] `tests/conftest.py` - Test fixtures
- [ ] `tests/test_auth.py` - Auth tests
- [ ] `tests/test_user.py` - User tests
- [ ] `tests/fixtures/users.py` - User fixtures
- [ ] `tests/integration/test_auth_flow.py` - Integration tests

### Priority 7 (Health & Documentation - Day 7)
- [ ] `routers/health.py` - Health check endpoint
- [ ] API documentation (auto-generated by FastAPI)

---

## 💡 IMPLEMENTATION NOTES

### User Model Example:
```python
# models/user.py
from sqlalchemy import Column, String, Integer, Boolean, Enum
from sqlalchemy.orm import relationship
from core.constants import UserRole
from .base_model import BaseModel

class User(BaseModel):
    __tablename__ = "users"
    
    email: str = Column(String(255), unique=True, nullable=False)
    password_hash: str = Column(String(255), nullable=False)
    name: str = Column(String(255), nullable=False)
    role: str = Column(Enum(UserRole), nullable=False)
    is_active: bool = Column(Boolean, default=True)
    must_change_password: bool = Column(Boolean, default=True)
    
    # Relationships
    enrollments = relationship("Enrollment", back_populates="user")
    courses = relationship("Course", back_populates="lecturer", foreign_keys="Course.lecturer_id")
```

### Auth Service Example:
```python
# services/auth_service.py
from datetime import datetime, timedelta
from jose import jwt
from passlib.context import CryptContext

class AuthService:
    def __init__(self):
        self.pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
    
    def hash_password(self, password: str) -> str:
        return self.pwd_context.hash(password)
    
    def verify_password(self, plain: str, hashed: str) -> bool:
        return self.pwd_context.verify(plain, hashed)
    
    def create_access_token(self, user_id: int, role: str) -> str:
        payload = {
            "sub": str(user_id),
            "role": role,
            "exp": datetime.utcnow() + timedelta(hours=24)
        }
        return jwt.encode(payload, settings.JWT_SECRET_KEY, algorithm="HS256")
```

### Auth Endpoint Example:
```python
# routers/auth.py
from fastapi import APIRouter, Depends, HTTPException, status
from schemas.auth import LoginRequest, LoginResponse
from services.auth_service import AuthService
from dependencies.database import get_db

router = APIRouter(prefix="/api/auth", tags=["auth"])

@router.post("/login", response_model=LoginResponse)
async def login(request: LoginRequest, db = Depends(get_db)):
    user_service = UserService(db)
    user = user_service.get_user_by_email(request.email)
    
    if not user or not auth_service.verify_password(request.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    token = auth_service.create_access_token(user.id, user.role)
    
    return LoginResponse(
        user=UserResponse.from_orm(user),
        token=token,
        role=user.role
    )
```

---

## ✅ SPRINT 1 COMPLETION CHECKLIST

- [ ] All 30+ files created with proper structure
- [ ] FastAPI app runs without errors (`uvicorn main:app --reload`)
- [ ] All models created with relationships
- [ ] All schemas validated with Pydantic
- [ ] Login endpoint working (test with Postman)
- [ ] Password reset flow working
- [ ] Protected routes enforcing JWT
- [ ] Email service sending OTP
- [ ] Rate limiting on login endpoint
- [ ] All unit tests passing (pytest tests/)
- [ ] All integration tests passing
- [ ] Database migrations working (alembic upgrade head)
- [ ] API docs available (/docs endpoint)
- [ ] No SQLAlchemy errors
- [ ] All dependencies properly typed
- [ ] Error handling comprehensive

---

**Total Files to Create in Sprint 1: ~40+ files**  
**Total Empty/Placeholder Folders for Sprints 2-5: ~20+ folders**

This structure ensures:
- ✅ Clean separation of concerns
- ✅ Easy scaling for new endpoints
- ✅ Type-safe with Python
- ✅ Comprehensive testing
- ✅ Production-ready code
