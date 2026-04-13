# CMMS Comprehensive Development Plan

**Project**: Carry Mark Management System (CMMS)  
**Duration**: 8 weeks (5 sprints × 2 weeks)  
**Team Size**: 5 developers (3 Frontend + 2 Backend)  
**Timeline**: 9 April – 12 June 2026  
**Status**: Not Started  

---

## 📋 EXECUTIVE SUMMARY

This document provides a detailed sprint-by-sprint development plan for 5 team members working on the CMMS project. The plan includes:
- Team structure and role assignments
- 53 user stories divided into 5 two-week sprints
- Detailed story allocation to individual developers
- Dependencies and integration points
- Testing schedule
- Deliverables and success criteria
- Risk mitigation strategies

---

## 👥 TEAM STRUCTURE

### Frontend Team (3 Developers)
**Responsibility**: React components, UI/UX, state management, E2E testing

| Developer | Role | Focus Areas | Stories |
|-----------|------|-----------|---------|
| **Frontend Lead** | Team Lead + Senior Dev | Architecture, complex features, code review | CMMS-7, 8, 9, 10, 11, 23, 32, 43 |
| **Frontend Dev 2** | Full Stack Frontend | Components, forms, validation | CMMS-12, 13, 20, 21, 24, 35, 41, 50 |
| **Frontend Dev 3** | UI/UX Specialist | Components, styling, responsive design | CMMS-13, 20, 21, 23, 24, 37, 46, 50 |

### Backend Team (2 Developers)
**Responsibility**: APIs, business logic, database, infrastructure, AI

| Developer | Role | Focus Areas | Stories |
|-----------|------|-----------|---------|
| **Backend Lead** | Team Lead + Infrastructure | Infrastructure, auth, core APIs, DevOps | CMMS-1, 2, 3, 4, 5, 6, 22, 25, 26, 48, 51, 53 |
| **Backend Dev 2** | Full Stack Backend | Database, schemas, business logic, AI | CMMS-14, 16, 17, 18, 19, 27, 28, 29, 30, 31, 34, 36, 38, 39, 40, 42, 44, 45, 47, 49, 52 |

### Project Lead
**Khobait Uddin Simran** - Overall project management, stakeholder communication, risk mitigation

---

## 🎯 SPRINT OVERVIEW

| Sprint | Period | Epic | Focus | Stories | Est. Points |
|--------|--------|------|-------|---------|------------|
| **Sprint 1** | Apr 9-17 | Foundation | Auth, Infrastructure, Base UI | 12-13 | 45-50 |
| **Sprint 2** | Apr 20-May 1 | Provisioning | Courses, Rosters, Assessments | 10-12 | 38-45 |
| **Sprint 3** | May 4-15 | Grading | Smart Grid, Publication, Email | 12-14 | 42-48 |
| **Sprint 4** | May 18-29 | Oversight | HOD Dashboard, Export, AI | 10-12 | 35-42 |
| **Sprint 5** | Jun 1-12 | Integration | Testing, Documentation, Launch | 8-10 | 28-35 |

---

## 🚀 SPRINT 1: FOUNDATION (April 9-17)

**Goal**: Complete authentication system, infrastructure, and base UI  
**Deliverables**: Login screen, role-based routing, Docker stack running  
**Stories**: 13 stories, 45-50 points

### Backend Team Assignments (7 stories)

#### CMMS-1: Infrastructure Setup ⭐ BLOCKER
- **Assignee**: Backend Lead
- **Story Points**: 13
- **Priority**: Blocker
- **Subtasks**:
  1. Docker Compose with 5 services (3 days)
  2. PostgreSQL migrations setup (2 days)
  3. Nginx reverse proxy config (1 day)
  4. Environment variable templating (1 day)
  5. Health checks & documentation (1 day)
- **Deliverables**: All services running, health endpoints working
- **Dependencies**: None (start first)
- **Definition of Done**: 
  - ✅ `docker-compose up` launches all services
  - ✅ All environment variables documented
  - ✅ Database migrations execute cleanly
  - ✅ PR approved by project lead

---

#### CMMS-2: JWT Authentication & Login
- **Assignee**: Backend Lead
- **Story Points**: 8
- **Priority**: Blocker
- **Subtasks**:
  1. User model & password hashing (1 day)
  2. JWT token generation (1 day)
  3. Login endpoint `/api/auth/login` (1 day)
  4. Rate limiting middleware (1 day)
  5. Unit tests (1 day)
- **Deliverables**: Working login endpoint with 5 roles
- **Dependencies**: CMMS-1 (infrastructure must be ready)
- **Integration Point**: Frontend CMMS-8 consumes this API

---

#### CMMS-3: Role-Based Access Control (RBAC)
- **Assignee**: Backend Lead
- **Story Points**: 8
- **Priority**: Blocker
- **Subtasks**:
  1. Role enum creation (4 hours)
  2. FastAPI dependency decorators (4 hours)
  3. PostgreSQL RLS policies (1 day)
  4. Unit tests (1 day)
  5. Integration tests (1 day)
- **Deliverables**: Protected endpoints enforcing roles
- **Dependencies**: CMMS-2 (JWT must exist)
- **Integration Point**: All backend APIs use this

---

#### CMMS-4: Password Reset & OTP System
- **Assignee**: Backend Dev 2
- **Story Points**: 8
- **Priority**: High
- **Subtasks**:
  1. OTP generation & storage (1 day)
  2. Email dispatch integration (1 day)
  3. OTP validation endpoint (1 day)
  4. Password update logic (4 hours)
  5. Tests (1 day)
- **Deliverables**: Full password reset flow
- **Dependencies**: CMMS-2 (login), CMMS-5 (email service)
- **Definition of Done**: E2E password reset working

---

#### CMMS-5: Email Service Integration
- **Assignee**: Backend Dev 2
- **Story Points**: 5
- **Priority**: High
- **Subtasks**:
  1. Resend/Mailgun account setup (4 hours)
  2. Email wrapper class (4 hours)
  3. Templates (OTP, notification) (4 hours)
  4. Retry logic (4 hours)
  5. Tests (4 hours)
- **Deliverables**: Email sending capability
- **Dependencies**: Infrastructure (CMMS-1) for env vars
- **Integration Point**: Used by CMMS-4, 6, 31

---

#### CMMS-6: Forced Password Change on Login
- **Assignee**: Backend Dev 2 (API) + Frontend Lead (UI)
- **Story Points**: 5
- **Priority**: High
- **Subtasks**:
  - Backend (2 days): Password changed flag, endpoint
  - Frontend (2 days): Password change form
- **Deliverables**: New users forced to change password
- **Dependencies**: CMMS-2 (login), CMMS-8 (UI)
- **Integration Point**: First-time user flow

---

#### CMMS-15: Lecturer Assignment & Load Tracking
- **Assignee**: Backend Dev 2
- **Story Points**: 5
- **Priority**: Medium
- **Subtasks**:
  1. Lecturer workload model (1 day)
  2. Course assignment endpoint (1 day)
  3. Load calculation logic (1 day)
  4. Tests (1 day)
- **Deliverables**: Track lecturer course loads
- **Dependencies**: None (setup data)
- **Integration Point**: Admin/HOD dashboard

---

### Frontend Team Assignments (6 stories)

#### CMMS-7: Next.js Project Setup & Routing
- **Assignee**: Frontend Lead
- **Story Points**: 5
- **Priority**: Blocker
- **Subtasks**:
  1. Next.js 14 scaffold (4 hours)
  2. App-based routing structure (4 hours)
  3. Global layout & CSS (4 hours)
  4. Build configuration (4 hours)
  5. Documentation (4 hours)
- **Deliverables**: Running Next.js app with routing
- **Dependencies**: None (start first)
- **Definition of Done**:
  - ✅ `npm run dev` works
  - ✅ Routes defined for each role
  - ✅ TypeScript config correct
  - ✅ README updated

---

#### CMMS-8: Login & Forced Password Change UI
- **Assignee**: Frontend Lead
- **Story Points**: 8
- **Priority**: Blocker
- **Subtasks**:
  1. Login form component (1 day)
  2. Password change form (1 day)
  3. Form validation (1 day)
  4. Error handling UI (1 day)
  5. Tests (1 day)
- **Deliverables**: Complete login flow UI
- **Dependencies**: CMMS-7 (routing), CMMS-2 (API)
- **Integration Point**: Consumes backend login API

---

#### CMMS-9: Protected Route Guards & Redirects
- **Assignee**: Frontend Dev 2
- **Story Points**: 5
- **Priority**: Blocker
- **Subtasks**:
  1. Route guard middleware (1 day)
  2. Token validation (1 day)
  3. Role-based page access (1 day)
  4. Tests (1 day)
- **Deliverables**: Routes protected by role
- **Dependencies**: CMMS-8 (login), CMMS-3 (roles)
- **Definition of Done**: Cannot access page without proper role

---

#### CMMS-10: Role-Aware UI Shell & Navigation
- **Assignee**: Frontend Dev 2
- **Story Points**: 8
- **Priority**: High
- **Subtasks**:
  1. Main layout component (1 day)
  2. Navigation menu (role-aware) (1 day)
  3. Sidebar/header component (1 day)
  4. Mobile responsive nav (1 day)
  5. Tests & styling (1 day)
- **Deliverables**: Consistent layout for all roles
- **Dependencies**: CMMS-9 (route guards)
- **Integration Point**: Used by all role-specific pages

---

#### CMMS-11: Reusable Component Library
- **Assignee**: Frontend Dev 3
- **Story Points**: 8
- **Priority**: High
- **Subtasks**:
  1. Button, Input, Select components (1 day)
  2. Card, Modal, Drawer components (1 day)
  3. Table & Grid components (1 day)
  4. Styling system (Tailwind) (1 day)
  5. Storybook documentation (1 day)
- **Deliverables**: 15+ reusable components
- **Dependencies**: None
- **Definition of Done**: All components typed, tested, documented

---

#### CMMS-12: Toast/Notification System
- **Assignee**: Frontend Dev 3
- **Story Points**: 5
- **Priority**: Medium
- **Subtasks**:
  1. Toast component (1 day)
  2. Context/store for toast state (1 day)
  3. Hooks for easy usage (1 day)
  4. Tests (1 day)
- **Deliverables**: Global notification system
- **Dependencies**: Zustand setup
- **Integration Point**: Used throughout app

---

#### CMMS-13: Loading & Error State Components
- **Assignee**: Frontend Dev 3 + Frontend Dev 2
- **Story Points**: 5
- **Priority**: Medium
- **Subtasks**:
  1. Loading spinner components (1 day)
  2. Skeleton screens (1 day)
  3. Error boundary component (1 day)
  4. Error state UI (1 day)
- **Deliverables**: Consistent loading/error UX
- **Dependencies**: CMMS-11 (component library)
- **Definition of Done**: All async operations show loading state

---

### ⚙️ Integration Points (Sprint 1)

```
Frontend:                    Backend:
┌──────────────────────┐    ┌──────────────────────┐
│ CMMS-7: Setup        │◄──►│ CMMS-1: Infrastructure│
│ CMMS-8: Login UI     │◄──►│ CMMS-2: Auth API     │
│ CMMS-9: Guards       │◄──►│ CMMS-3: RBAC         │
│ CMMS-10: Nav         │◄──►│                      │
│ CMMS-11: Components  │    │                      │
│ CMMS-12: Toast       │    │                      │
│ CMMS-13: Loading     │    │                      │
└──────────────────────┘    └──────────────────────┘
         ↓
    Docker Network
         ↓
    http://localhost:3000 ←────► http://localhost:8000
```

### ✅ Sprint 1 Success Criteria
- [ ] User can login with all 5 roles
- [ ] Wrong password shows error
- [ ] Rate limiting blocks 6th attempt
- [ ] First-time users see password change screen
- [ ] Routes protected by role
- [ ] Navigation shows correct menu for role
- [ ] All forms have validation
- [ ] Toast notifications work
- [ ] No console errors
- [ ] All tests passing

---

## 🚀 SPRINT 2: PROVISIONING (April 20 - May 1)

**Goal**: Course creation, roster management, assessment configuration  
**Deliverables**: Coordinator can create courses and upload rosters  
**Stories**: 10-12 stories, 38-45 points

### Backend Team Assignments

#### CMMS-14: Create Course Shells
- **Assignee**: Backend Dev 2
- **Story Points**: 5
- **Priority**: Blocker
- **Tasks**:
  1. Course model & migrations
  2. POST `/api/courses` endpoint
  3. Validation (course code, name)
  4. Audit logging
  5. Tests
- **Deliverables**: Course creation API
- **Dependencies**: CMMS-1 (infrastructure)
- **Integration**: CMMS-20 (coordinator UI)

---

#### CMMS-16: Excel Roster Upload & Parsing
- **Assignee**: Backend Dev 2
- **Story Points**: 8
- **Priority**: Blocker
- **Tasks**:
  1. Excel parsing library (openpyxl)
  2. Validation & error handling
  3. POST `/api/courses/{id}/roster/upload`
  4. Dry-run feature
  5. Tests
- **Deliverables**: Roster import endpoint
- **Dependencies**: CMMS-14 (courses)
- **Integration**: CMMS-21 (roster UI)

---

#### CMMS-17: Auto-Create Student Accounts & OTP
- **Assignee**: Backend Dev 2
- **Story Points**: 5
- **Priority**: High
- **Tasks**:
  1. Bulk student creation logic
  2. Auto-generate emails
  3. Temporary passwords
  4. OTP delivery
  5. Tests
- **Deliverables**: Student accounts auto-created from roster
- **Dependencies**: CMMS-16 (roster upload), CMMS-5 (email)
- **Integration**: Students receive email with OTP

---

#### CMMS-18: Assessment Schema Configuration
- **Assignee**: Backend Dev 2
- **Story Points**: 8
- **Priority**: Blocker
- **Tasks**:
  1. Assessment schema model
  2. Validation (weights = 100%)
  3. Lock schema once marking starts
  4. PUT `/api/courses/{id}/assessment-schema`
  5. Tests
- **Deliverables**: Assessment configuration API
- **Dependencies**: CMMS-14 (courses)
- **Integration**: CMMS-21 (config UI)

---

#### CMMS-19: Roster Add/Drop Student
- **Assignee**: Backend Dev 2
- **Story Points**: 5
- **Priority**: Medium
- **Tasks**:
  1. Add/drop endpoints
  2. Audit trail
  3. Email notification
  4. Validation
  5. Tests
- **Deliverables**: Manage roster API
- **Dependencies**: CMMS-17 (students)
- **Integration**: CMMS-20 (roster management UI)

---

### Frontend Team Assignments

#### CMMS-20: Course Provisioning UI (Coordinator)
- **Assignee**: Frontend Dev 2 + Frontend Dev 3
- **Story Points**: 8
- **Priority**: Blocker
- **Tasks**:
  1. Course creation form (Frontend Dev 2)
  2. Roster upload modal (Frontend Dev 3)
  3. Student add/drop UI (Frontend Dev 2)
  4. Confirmation dialogs
  5. Tests
- **Deliverables**: Coordinator course management page
- **Dependencies**: CMMS-14, 16, 19 (backend APIs)
- **Integration**: Uses CMMS-10 (navigation)

---

#### CMMS-21: Assessment Configuration UI (Lecturer)
- **Assignee**: Frontend Lead
- **Story Points**: 8
- **Priority**: High
- **Tasks**:
  1. Assessment schema form builder
  2. Add/edit assessment components
  3. Weight validation UI
  4. Lock schema toggle
  5. Tests
- **Deliverables**: Lecturer can configure assessments
- **Dependencies**: CMMS-18 (backend API)
- **Integration**: Used in Smart Grid workflow

---

### ✅ Sprint 2 Success Criteria
- [ ] Coordinator creates courses with code, name, semester
- [ ] Coordinator uploads Excel roster (at least 50 students)
- [ ] Students auto-created with email addresses
- [ ] Assessment schema configuration works
- [ ] Weights validated (must sum to 100%)
- [ ] Schema locked when marking begins
- [ ] Roster add/drop works
- [ ] Email notifications sent to students
- [ ] All tests passing

---

## 🏆 SPRINT 3: GRADING (May 4-15)

**Goal**: Smart Grid mark entry, publication, email dispatch  
**Deliverables**: Lecturers can enter marks and publish  
**Stories**: 12-14 stories, 42-48 points

### Backend Team Assignments

#### CMMS-22: Smart Grid Backend (API)
- **Assignee**: Backend Lead
- **Story Points**: 13
- **Priority**: Blocker
- **Tasks**:
  1. Mark model & schema
  2. GET `/api/marks/grid` (paginated, prefetch)
  3. POST/PATCH mark endpoints
  4. Filtering & sorting
  5. Performance optimization
  6. Tests
- **Deliverables**: High-performance mark retrieval API
- **Dependencies**: CMMS-18 (assessments)
- **Integration**: CMMS-23 (frontend grid)

---

#### CMMS-25: Optimistic Concurrency Control
- **Assignee**: Backend Lead
- **Story Points**: 8
- **Priority**: High
- **Tasks**:
  1. Version field on Mark model
  2. Conflict detection logic
  3. HTTP 409 conflict response
  4. Retry guidance to client
  5. Tests
- **Deliverables**: Prevent concurrent edit conflicts
- **Dependencies**: CMMS-22 (marks)
- **Integration**: Frontend handles 409 response

---

#### CMMS-26: Immutable Audit Log
- **Assignee**: Backend Lead
- **Story Points**: 5
- **Priority**: High
- **Tasks**:
  1. AuditLog model
  2. Trigger on mark insert/update
  3. Log user, timestamp, old/new values
  4. Immutable storage (append-only)
  5. Tests
- **Deliverables**: Complete audit trail
- **Dependencies**: All mark operations
- **Integration**: HOD dashboard views audit logs

---

#### CMMS-27: Mark Flagging for Review
- **Assignee**: Backend Dev 2
- **Story Points**: 5
- **Priority**: Medium
- **Tasks**:
  1. Flag model & status enum
  2. Flag/unflag endpoints
  3. Flag reason tracking
  4. Tests
- **Deliverables**: Mark flagging
- **Dependencies**: CMMS-22 (marks)
- **Integration**: CMMS-23 (UI flag button)

---

#### CMMS-28: DELAYED Status & Expected Date
- **Assignee**: Backend Dev 2
- **Story Points**: 5
- **Priority**: Medium
- **Tasks**:
  1. Add status field (draft, delayed, published, flagged, anomaly)
  2. Expected date field
  3. Status validation
  4. Tests
- **Deliverables**: Mark status tracking
- **Dependencies**: CMMS-22 (marks)
- **Integration**: Status shown in grid

---

#### CMMS-29: Excel Bulk Import (2-Step)
- **Assignee**: Backend Dev 2
- **Story Points**: 8
- **Priority**: High
- **Tasks**:
  1. Step 1: Upload & validate (dry-run)
  2. Step 2: Confirm & import
  3. Error reporting
  4. Batch creation
  5. Tests
- **Deliverables**: Bulk mark import
- **Dependencies**: CMMS-22 (marks)
- **Integration**: CMMS-24 (upload UI)

---

#### CMMS-30: Publish Assessment (Single & Bulk)
- **Assignee**: Backend Dev 2
- **Story Points**: 8
- **Priority**: Blocker
- **Tasks**:
  1. Publish single assessment endpoint
  2. Publish bulk endpoint
  3. Precondition checks (all marked, no overrides)
  4. Email dispatch trigger
  5. Tests
- **Deliverables**: Publication workflow
- **Dependencies**: CMMS-22 (marks), CMMS-5 (email)
- **Integration**: CMMS-31 (email dispatch)

---

#### CMMS-31: Email Dispatch to Students
- **Assignee**: Backend Dev 2
- **Story Points**: 5
- **Priority**: High
- **Tasks**:
  1. Email template for mark notification
  2. Background job for dispatch
  3. Retry on failure
  4. Logging
  5. Tests
- **Deliverables**: Students notified of published marks
- **Dependencies**: CMMS-30 (publish), CMMS-5 (email)
- **Integration**: Async email delivery

---

### Frontend Team Assignments

#### CMMS-23: Smart Grid Frontend (React)
- **Assignee**: Frontend Lead + Frontend Dev 2
- **Story Points**: 13
- **Priority**: Blocker
- **Tasks**:
  - Frontend Lead: Architecture, virtualization (4 days)
  - Frontend Dev 2: Cell components, styling (3 days)
  1. Virtual scrolling (500+ students)
  2. Column headers (assessments)
  3. Cell rendering
  4. Loading & error states
  5. Performance optimization
  6. Tests
- **Deliverables**: Interactive Smart Grid UI
- **Dependencies**: CMMS-22 (API)
- **Integration**: CMMS-24 (inline entry)

---

#### CMMS-24: Inline Mark Entry & Validation
- **Assignee**: Frontend Dev 3
- **Story Points**: 8
- **Priority**: Blocker
- **Tasks**:
  1. Inline edit mode for cells
  2. Real-time validation (0-100)
  3. Error highlighting
  4. Keyboard navigation
  5. "Unsaved" indicator
  6. Tests
- **Deliverables**: Lecturers can edit marks inline
- **Dependencies**: CMMS-23 (grid), CMMS-29 (Excel import)
- **Integration**: CMMS-25 (conflict handling)

---

#### CMMS-27 (Frontend): Mark Flagging UI
- **Assignee**: Frontend Dev 2
- **Story Points**: 3
- **Priority**: Medium
- **Tasks**:
  1. Flag button in grid cell
  2. Flag reason modal
  3. Flag indicator (red cell background)
  4. Tests
- **Deliverables**: Lecturers can flag marks
- **Dependencies**: CMMS-23 (grid), CMMS-27 (API)

---

#### CMMS-30 (Frontend): Publish UI
- **Assignee**: Frontend Lead
- **Story Points**: 5
- **Priority**: High
- **Tasks**:
  1. Publish dialog with precondition checks
  2. Show invalid cells (red)
  3. Confirmation dialog
  4. Success indicators (green)
  5. Tests
- **Deliverables**: Publish workflow UI
- **Dependencies**: CMMS-22, 30 (APIs)
- **Integration**: Shows feedback to lecturer

---

#### CMMS-32: Student Dashboard & Carry View
- **Assignee**: Frontend Dev 3
- **Story Points**: 8
- **Priority**: High
- **Tasks**:
  1. Student dashboard layout
  2. Enrolled courses list
  3. Carry total calculation visualization
  4. Mark breakdown (assessment scores)
  5. Responsive design
  6. Tests
- **Deliverables**: Students view their marks
- **Dependencies**: CMMS-8 (login)
- **Integration**: Shows published marks

---

#### CMMS-33: Student Mark Queries
- **Assignee**: Frontend Dev 2
- **Story Points**: 5
- **Priority**: Medium
- **Tasks**:
  1. Query creation form
  2. Query list & detail view
  3. Lecturer response messaging
  4. Status tracking (open, answered)
  5. Tests
- **Deliverables**: Students can query marks
- **Dependencies**: CMMS-32 (student dashboard)

---

### ✅ Sprint 3 Success Criteria
- [ ] Lecturers can enter marks for 500+ students (no lag)
- [ ] Virtual scrolling works smoothly
- [ ] Inline validation prevents invalid marks (>100)
- [ ] Marks save optimistically with loading state
- [ ] Concurrent edit shows conflict dialog
- [ ] Can bulk import 500 marks in Excel
- [ ] Can publish assessment (single or bulk)
- [ ] Students receive email when marks published
- [ ] Students see marks in dashboard
- [ ] All tests passing

---

## 📊 SPRINT 4: OVERSIGHT (May 18-29)

**Goal**: HOD dashboard, export functionality, AI anomaly detection  
**Deliverables**: HOD can view metrics and export data  
**Stories**: 10-12 stories, 35-42 points

### Backend Team Assignments

#### CMMS-34: HOD Dashboard - Metrics & Alerts
- **Assignee**: Backend Dev 2
- **Story Points**: 8
- **Priority**: High
- **Tasks**:
  1. Course overview metrics (pass rate, avg score)
  2. Failure rate alerts (>40%)
  3. Overdue delayed marks (>3 days)
  4. Student risk forecasting
  5. Tests
- **Deliverables**: Analytics data API
- **Dependencies**: CMMS-22 (marks)
- **Integration**: CMMS-34 (frontend visualization)

---

#### CMMS-36: CSV Export with Precondition Checks
- **Assignee**: Backend Dev 2
- **Story Points**: 8
- **Priority**: High
- **Tasks**:
  1. CSV generation from marks
  2. Include audit trail
  3. Precondition validation (no flags, all marked)
  4. Streaming response (large datasets)
  5. Tests
- **Deliverables**: Export endpoint
- **Dependencies**: CMMS-22 (marks), CMMS-26 (audit log)
- **Integration**: CMMS-37 (export UI)

---

#### CMMS-38: Admin Account Management
- **Assignee**: Backend Dev 2
- **Story Points**: 5
- **Priority**: Medium
- **Tasks**:
  1. User CRUD endpoints
  2. Role assignment
  3. Account deactivation
  4. Audit logging
  5. Tests
- **Deliverables**: Admin user management
- **Dependencies**: CMMS-3 (RBAC)
- **Integration**: Admin dashboard

---

#### CMMS-39: Database Backup & Restore
- **Assignee**: Backend Dev 2
- **Story Points**: 5
- **Priority**: Medium
- **Tasks**:
  1. Automated backup script (daily)
  2. Restore procedure
  3. Backup verification
  4. Documentation
  5. Tests
- **Deliverables**: Backup strategy
- **Dependencies**: CMMS-1 (infrastructure)
- **Integration**: DevOps procedure

---

#### CMMS-40: AI Anomaly Detection (Z-Score)
- **Assignee**: Backend Dev 2
- **Story Points**: 13
- **Priority**: High
- **Tasks**:
  1. Z-score calculation (NumPy/SciPy)
  2. Threshold definition (>2.5 SD = anomaly)
  3. Batch detection (after publication)
  4. Anomaly storage & tracking
  5. Tests
- **Deliverables**: Anomaly detection algorithm
- **Dependencies**: CMMS-30 (published marks)
- **Integration**: CMMS-41 (frontend visualization)

---

#### CMMS-42: Locked Assessment Schema Override
- **Assignee**: Backend Dev 2
- **Story Points**: 5
- **Priority**: Medium
- **Tasks**:
  1. HOD override endpoint (admin only)
  2. Reason field (required)
  3. Immutable override audit trail
  4. Email notification to coordinator
  5. Tests
- **Deliverables**: Override capability for HOD
- **Dependencies**: CMMS-18 (schema)
- **Integration**: Admin-only feature

---

### Frontend Team Assignments

#### CMMS-34 (Frontend): HOD Dashboard
- **Assignee**: Frontend Dev 3
- **Story Points**: 8
- **Priority**: High
- **Tasks**:
  1. Dashboard layout with cards
  2. Metrics visualization (failure rate, pass rate)
  3. Alert component (failures >40%)
  4. Overdue list
  5. Responsive & interactive
  6. Tests
- **Deliverables**: HOD dashboard UI
- **Dependencies**: CMMS-34 (API)
- **Integration**: CMMS-10 (navigation)

---

#### CMMS-35: Query Management Interface
- **Assignee**: Frontend Dev 2
- **Story Points**: 5
- **Priority**: Medium
- **Tasks**:
  1. Query list view
  2. Detail modal with response
  3. Mark resolution toggle
  4. Status filtering
  5. Tests
- **Deliverables**: Manage student queries
- **Dependencies**: CMMS-33 (queries)
- **Integration**: Lecturer workflow

---

#### CMMS-36 (Frontend): Export Blocking UI
- **Assignee**: Frontend Dev 2
- **Story Points**: 5
- **Priority**: High
- **Tasks**:
  1. Export button
  2. Precondition check modal
  3. Error display (flagged cells)
  4. Success indicator with download
  5. Tests
- **Deliverables**: Export workflow
- **Dependencies**: CMMS-36 (API)
- **Integration**: Uses CMMS-27 (flag status)

---

#### CMMS-37: Export Blocking UI (Detail)
- **Assignee**: Frontend Dev 3
- **Story Points**: 3
- **Priority**: High
- **Tasks**:
  1. Show reasons export blocked
  2. Highlight problematic cells
  3. Guidance on resolution
  4. Retry button
- **Deliverables**: User-friendly export blocking
- **Dependencies**: CMMS-36 (export)

---

#### CMMS-41: Anomaly Visualization (Frontend)
- **Assignee**: Frontend Dev 2
- **Story Points**: 5
- **Priority**: Medium
- **Tasks**:
  1. Anomaly indicator in Smart Grid (yellow background)
  2. Anomaly detail modal (Z-score value, avg, SD)
  3. Recommendation text
  4. Drill-down view
  5. Tests
- **Deliverables**: Visualize anomalies
- **Dependencies**: CMMS-40 (detection), CMMS-23 (grid)

---

### ✅ Sprint 4 Success Criteria
- [ ] HOD dashboard shows course metrics
- [ ] Failure rate alerts trigger at >40%
- [ ] Lecturer can query why marks flagged
- [ ] HOD can view queried marks & respond
- [ ] CSV export works with 1000+ marks
- [ ] Export blocks if flagged cells exist
- [ ] AI detects unusual mark distributions
- [ ] Anomalies highlighted in Smart Grid
- [ ] Admin can manage users
- [ ] All tests passing

---

## 🎯 SPRINT 5: INTEGRATION & UAT (June 1-12)

**Goal**: Final testing, documentation, production deployment  
**Deliverables**: Ready for production launch  
**Stories**: 8-10 stories, 28-35 points

### Backend Team Assignments

#### CMMS-44: Performance Baseline & Load Testing
- **Assignee**: Backend Lead
- **Story Points**: 8
- **Priority**: High
- **Tasks**:
  1. Apache JMeter setup
  2. Load test script (500+ students, 50 marks/sec)
  3. Measure latency, throughput
  4. Database query optimization
  5. Report
- **Deliverables**: Performance baseline documented
- **Dependencies**: All APIs complete
- **Integration**: Identify optimization needs

---

#### CMMS-45: Security Penetration Testing
- **Assignee**: Backend Lead
- **Story Points**: 8
- **Priority**: High
- **Tasks**:
  1. OWASP Top 10 review
  2. SQL injection testing
  3. Authentication bypass attempts
  4. Authorization testing
  5. Report & fixes
- **Deliverables**: Security audit report
- **Dependencies**: All APIs complete
- **Integration**: Fix critical issues before launch

---

#### CMMS-47: Database Schema ER Diagram
- **Assignee**: Backend Dev 2
- **Story Points**: 3
- **Priority**: Medium
- **Tasks**:
  1. Generate ER diagram (pgAdmin or dbdiagram.io)
  2. Document relationships
  3. Include in docs
- **Deliverables**: Schema documentation
- **Dependencies**: CMMS-1 (schema complete)

---

#### CMMS-48: Deployment Guide & Runbook
- **Assignee**: Backend Lead
- **Story Points**: 5
- **Priority**: High
- **Tasks**:
  1. Docker production deployment
  2. Environment setup
  3. Database backup recovery
  4. Rollback procedure
  5. Troubleshooting guide
- **Deliverables**: Runbook for operations
- **Dependencies**: All infrastructure complete

---

#### CMMS-49: System Architecture Diagram Update
- **Assignee**: Backend Dev 2
- **Story Points**: 3
- **Priority**: Medium
- **Tasks**:
  1. Update architecture diagram
  2. Show all services & connections
  3. Add to docs
- **Deliverables**: Architecture documentation
- **Dependencies**: All systems complete

---

#### CMMS-51: Code Quality Review
- **Assignee**: Backend Lead
- **Story Points**: 5
- **Priority**: High
- **Tasks**:
  1. Review all PRs for standards
  2. Check test coverage
  3. Refactor technical debt
  4. Update lint/format configs
- **Deliverables**: Code quality metrics
- **Dependencies**: All code complete

---

#### CMMS-52: Stakeholder Signoff & UAT Approval
- **Assignee**: Project Lead (Khobait) + Backend Lead
- **Story Points**: 5
- **Priority**: Blocker
- **Tasks**:
  1. UAT sign-off from faculty
  2. Address final feedback
  3. Get approval from university
- **Deliverables**: UAT approval document
- **Dependencies**: All features tested

---

#### CMMS-53: Production Deployment
- **Assignee**: Backend Lead
- **Story Points**: 5
- **Priority**: Blocker
- **Tasks**:
  1. Production environment setup
  2. SSL/TLS certificates
  3. Database backup strategy
  4. Monitoring setup
  5. Go-live checklist
- **Deliverables**: System live in production
- **Dependencies**: All UAT complete

---

### Frontend Team Assignments

#### CMMS-43: End-to-End Testing & UAT Scripts
- **Assignee**: Frontend Lead + Frontend Dev 2
- **Story Points**: 8
- **Priority**: High
- **Tasks**:
  - Frontend Lead: Cypress E2E tests (3 days)
  - Frontend Dev 2: UAT scripts (2 days)
  1. Login workflow test
  2. Mark entry workflow test
  3. Publication workflow test
  4. Student dashboard test
  5. HOD export test
  6. Performance test (500 students, rapid entry)
- **Deliverables**: UAT scripts & automated tests
- **Dependencies**: All features complete

---

#### CMMS-46: API Documentation Generation
- **Assignee**: Frontend Dev 3
- **Story Points**: 3
- **Priority**: Medium
- **Tasks**:
  1. Generate SwaggerUI from backend
  2. Document all endpoints
  3. Add example requests/responses
  4. Include in repo docs
- **Deliverables**: API documentation
- **Dependencies**: All APIs complete

---

#### CMMS-50: User Manual (By Role)
- **Assignee**: Frontend Dev 3 + Frontend Dev 2
- **Story Points**: 5
- **Priority**: Medium
- **Tasks**:
  1. Student manual (view marks, query, dashboard)
  2. Lecturer manual (entry, publication, review)
  3. Coordinator manual (roster, course setup)
  4. HOD manual (metrics, export, override)
  5. Admin manual (user management, backup)
- **Deliverables**: User documentation
- **Dependencies**: All features complete

---

### ✅ Sprint 5 Success Criteria (UAT)
- [ ] System handles 500+ students without lag
- [ ] All security tests pass
- [ ] Load test shows >100 marks/sec throughput
- [ ] No critical bugs found
- [ ] Faculty sign-off obtained
- [ ] All documentation complete
- [ ] Database backup/restore tested
- [ ] Monitoring & alerts configured
- [ ] Production environment ready
- [ ] Team confident system is production-ready

---

## 🔄 DEPENDENCIES & INTEGRATION SCHEDULE

### Critical Path (Must Finish First)
```
CMMS-1 (Infrastructure)
    ↓
CMMS-2 (Auth) ←→ CMMS-7 (Frontend Setup)
    ↓                ↓
CMMS-3 (RBAC)   CMMS-8 (Login UI)
    ↓                ↓
CMMS-6 (Password)  CMMS-9 (Route Guards)
              ↓
All Gateway functionality working with 2 roles
              ↓
CMMS-14 (Courses) - Backend CMMS-20 (Courses UI) - Frontend
              ↓
CMMS-16 (Roster) - Backend
              ↓
CMMS-22 (Smart Grid API) ←→ CMMS-23 (Smart Grid UI)
              ↓
All functionality working end-to-end
```

### Parallel Workstreams
**While Frontend waits for Backend APIs:**
- CMMS-11: Component library
- CMMS-12: Toast system
- CMMS-13: Loading states

**While Backend develops Core APIs:**
- CMMS-15: Lecturer load tracking (independent)
- CMMS-38: Admin management (independent)

---

## 👥 DETAILED TEAM ROLES

### Frontend Lead (Developer 1)
**Focus**: Architecture, complex features, code review

| Sprint | Primary Stories | Secondary | Code Review |
|--------|---|---|---|
| 1 | CMMS-7, 8, 9 | CMMS-6 | All frontend |
| 2 | CMMS-21 | CMMS-20 | All frontend |
| 3 | CMMS-23 (part), 30 | CMMS-24 | All frontend |
| 4 | — | — | All frontend |
| 5 | CMMS-43 (part) | — | All frontend |

**Weekly Tasks:**
- Daily: Code review PRs (max 1 day turnaround)
- Daily: Pairing with teammates (30 min)
- Sprint Planning: Story estimation
- Sprint Retrospective: Team feedback

---

### Frontend Dev 2 (Developer 2)
**Focus**: Forms, validation, state management

| Sprint | Primary Stories | Integration |
|--------|---|---|
| 1 | CMMS-9, 10 | Routing, navigation |
| 2 | CMMS-20 (part) | Course creation |
| 3 | CMMS-24 (part), 27, 33 | Mark entry, queries |
| 4 | CMMS-35, 36, 41 | Export, anomalies |
| 5 | CMMS-43 (part), 50 (part) | E2E tests, docs |

---

### Frontend Dev 3 (Developer 3)
**Focus**: Components, styling, UI/UX

| Sprint | Primary Stories | Design System |
|--------|---|---|
| 1 | CMMS-11, 12, 13 | Component library |
| 2 | CMMS-20 (part), 21 (part) | Course UI |
| 3 | CMMS-32 | Student dashboard |
| 4 | CMMS-34, 37, 41 | HOD dashboard |
| 5 | CMMS-46, 50 (part) | Documentation |

---

### Backend Lead (Developer 4)
**Focus**: Infrastructure, auth, core APIs, DevOps

| Sprint | Primary Stories | Blocker |
|--------|---|---|
| 1 | CMMS-1, 2, 3, 6 | Infrastructure |
| 2 | — | Supports frontend |
| 3 | CMMS-22, 25, 26 | Smart Grid |
| 4 | — | Code review |
| 5 | CMMS-44, 45, 48, 51, 52, 53 | Production |

**Weekly Tasks:**
- Daily: Code review PRs (max 1 day)
- Daily: Pairing with Backend Dev 2 (30 min)
- Sprint Planning: Story estimation
- Performance monitoring
- Database backup verification

---

### Backend Dev 2 (Developer 5)
**Focus**: Business logic, database, schemas, AI

| Sprint | Primary Stories | Integration |
|--------|---|---|
| 1 | CMMS-4, 5, 15 | Auth flow |
| 2 | CMMS-14, 16, 17, 18, 19 | Course workflow |
| 3 | CMMS-27, 28, 29, 30, 31 | Grading workflow |
| 4 | CMMS-34, 36, 38, 39, 40, 42 | Admin, AI |
| 5 | CMMS-47, 49 | Documentation |

---

## 📈 SPRINT METRICS & TRACKING

### Daily Stand-up (15 min, 9:30 AM)
- What did you complete yesterday?
- What are you working on today?
- Any blockers?

### Sprint Velocity Calculation
```
Sprint 1 Target: 45-50 pts
Sprint 2 Target: 38-45 pts
Sprint 3 Target: 42-48 pts
Sprint 4 Target: 35-42 pts
Sprint 5 Target: 28-35 pts
```

### Repository Tracking
```
JIRA Board: https://your-jira-instance/software/c/projects/CMMS
GitHub Org: https://github.com/KhobaitUddinSimran/CMMS
Slack: #cmms-development
```

### Code Quality Gates
- ✅ All tests passing (backend ≥70%, frontend ≥60%)
- ✅ No merge without PR review
- ✅ CI/CD pipeline green
- ✅ No linting errors
- ✅ Code formatted (black, prettier)

---

## ⚠️ RISK MANAGEMENT

| Risk | Impact | Mitigation |
|------|--------|-----------|
| **Frontend blocks on API** | High | Mock APIs early, design contracts |
| **Database performance** | High | Load testing from Sprint 3 |
| **Scope creep** | High | Strict sprint planning, LET IT GO |
| **Team member illness** | Medium | Documentation, pair programming |
| **Integration issues** | Medium | Frequent integration testing |
| **AI accuracy poor** | Low | Fallback to threshold alerting |
| **Email delivery failures** | Low | Retry logic, fallback to console |

---

## ✅ SUCCESS CRITERIA

### Technical
- ✅ 100% API endpoints implemented
- ✅ All stories completed on time
- ✅ Backend test coverage ≥70%
- ✅ Frontend test coverage ≥60%
- ✅ Zero critical bugs at launch
- ✅ Performance target: 100 marks/sec
- ✅ System uptime: 99.5%

### Business
- ✅ Faculty able to manage marks efficiently
- ✅ Students can view marks in real-time
- ✅ Compliance audit trail maintained
- ✅ AI anomaly detection working
- ✅ Faculty member satisfaction ≥4/5
- ✅ Zero data loss events

### Team
- ✅ All deliverables on schedule
- ✅ Code quality consistent
- ✅ Knowledge shared across team
- ✅ Team velocity stable
- ✅ Zero unplanned rework

---

## 📞 COMMUNICATION PLAN

### Weekly Meetings
- **Monday 10:00 AM**: Sprint Planning (2 hours)
- **Daily 9:30 AM**: Stand-up (15 min)
- **Friday 4:00 PM**: Sprint Review & Retro (1.5 hours)

### Async Communication
- **Slack**: #cmms-development for questions
- **GitHub**: PR discussions
- **JIRA**: Comment on stories for context
- **Email**: Weekly status update to stakeholders

### Escalation Path
1. Talk to your team (same role)
2. Talk to team lead (if still blocked)
3. Talk to project lead (if still blocked)

---

## 📋 CHECKLIST FOR LAUNCH

- [ ] All 53 stories completed & tested
- [ ] Code review completed on all PRs
- [ ] Integration testing done
- [ ] UAT scripts executed successfully
- [ ] Performance load testing done
- [ ] Security penetration testing done
- [ ] Database backup/restore tested
- [ ] Documentation complete
- [ ] User manuals reviewed by faculty
- [ ] Production environment ready
- [ ] Monitoring & alerts configured
- [ ] Support team trained
- [ ] Go-live checklist signed off
- [ ] Team ready for on-call

---

## 🎓 FINAL NOTES

### For Your Success
1. **Communicate early**: Don't wait until you're stuck
2. **Test manually first**: Don't rely solely on automation
3. **Document as you go**: Future you will thank present you
4. **Code review seriously**: This is how we maintain quality
5. **Help your teammates**: A rising tide lifts all boats

### For Your Team
- You have a clear roadmap
- You know exactly what needs to be built
- You understand dependencies
- You can work independently
- You support each other

**You've got this! Ship it! 🚀**

---

**Last Update**: 13 April 2026  
**Project Lead**: Khobait Uddin Simran  
**Team**: 3 Frontend + 2 Backend developers  
**Status**: Ready for Sprint 1 kickoff
