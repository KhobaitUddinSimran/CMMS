# CMMS - Jira Project Management Structure
**Project Name**: Carry Mark Management System (CMMS)  
**Project Key**: CMMS  
**Project Type**: Scrum (with Kanban board for Integration Phase)  
**Timeline**: 9 April – 12 June 2026

---

## 1. Project Overview & Setup

### 1.1 Jira Project Details

| Field | Value |
|-------|-------|
| **Project Name** | Carry Mark Management System |
| **Project Key** | CMMS |
| **Project Type** | Scrum |
| **Visibility** | Private |
| **Team Lead** | Khobait Uddin Simran (A23MJ3006) |
| **Board Type** | Scrum Board |
| **Sprint Duration** | 2 weeks (biweekly) |
| **Estimation** | Story Points (Fibonacci scale) |

### 1.2 Board Configuration

**Column Names** (Workflow):
1. **Backlog** → Ready for sprint planning
2. **To Do** → Sprint tasks not started
3. **In Progress** → Currently being worked on
4. **In Review** → Code/design review pending
5. **Done** → Completed (Definition of Done met)

---

## 2. Epic Structure

### 2.1 Epics (4 Main Sprints)

```
CMMS Project (Parent Epic)
├── EPIC-1: Sprint 1 - Foundation, Auth & Base UI
├── EPIC-2: Sprint 2 - Course Setup & Roster Management
├── EPIC-3: Sprint 3 - Grading & Publication
├── EPIC-4: Sprint 4 - Oversight, Export & AI
└── EPIC-5: Integration Phase - UAT & Production Launch
```

---

## 3. Sprint Planning

### 3.1 Sprint Schedule

| Sprint | Epic | Dates | Duration | Stories | Points |
|--------|------|-------|----------|---------|--------|
| **Sprint 1** | EPIC-1 | 9 Apr - 17 Apr | 2 weeks | 12-15 | 40-50 |
| **Sprint 2** | EPIC-2 | 20 Apr - 1 May | 2 weeks | 10-12 | 35-45 |
| **Sprint 3** | EPIC-3 | 4 May - 15 May | 2 weeks | 12-14 | 40-50 |
| **Sprint 4** | EPIC-4 | 18 May - 29 May | 2 weeks | 10-12 | 35-45 |
| **Sprint 5** | EPIC-5 | 1 Jun - 12 Jun | 2 weeks | 8-10 | 25-35 |

### 3.2 Velocity Target
- **Target Velocity**: 40 story points/sprint (baseline)
- **Adjusted Range**: 35-50 points based on team capacity
- **Burn-down**: Daily tracking on board

---

## 4. EPIC-1: Sprint 1 - Foundation, Auth & Base UI

**Dates**: 9 Apr – 17 Apr | **Status**: Not Started | **Epic Lead**: TBD

### 4.1 User Stories & Tasks

#### Story: CMMS-1 Infrastructure Setup
**Type**: Task | **Story Points**: 13 | **Priority**: Blocker | **Assignee**: Backend Lead

**Description**: 
Set up complete Docker Compose infrastructure with all services (frontend, backend, database, nginx) and environment configuration.

**Acceptance Criteria**:
- [ ] `docker-compose.yml` created with all 4 services (frontend, backend, db, nginx)
- [ ] All environment variables documented in `.env.example`
- [ ] PostgreSQL schema initialized with migrations
- [ ] Nginx configured as reverse proxy
- [ ] All services start successfully with `docker-compose up`
- [ ] Health check endpoints functional

**Subtasks**:
- [ ] Create docker-compose.yml (5 pts)
- [ ] PostgreSQL migrations (5 pts)
- [ ] Nginx configuration (3 pts)

**Definition of Done**: Code reviewed, CI passes, documented

---

#### Story: CMMS-2 JWT Authentication & Login
**Type**: Story | **Story Points**: 8 | **Priority**: Blocker | **Assignee**: Backend Lead

**Description**: 
Implement JWT-based login endpoint with role detection for all 5 user roles.

**Acceptance Criteria**:
- [ ] POST `/api/auth/login` endpoint accepts email + password
- [ ] User role correctly detected from database
- [ ] JWT token issued with role claims + 24hr expiry
- [ ] Failed login returns 401 Unauthorized
- [ ] Rate limiting on login endpoint (5 attempts/15 min)
- [ ] Unit tests cover happy path & error cases
- [ ] Integration test with real database

**Definition of Done**: Tested, documented, code reviewed

---

#### Story: CMMS-3 Role-Based Access Control (RBAC)
**Type**: Story | **Story Points**: 8 | **Priority**: Blocker | **Assignee**: Backend Lead

**Description**: 
Implement role-based access control at application and database level.

**Acceptance Criteria**:
- [ ] Role enum defined (student, lecturer, coordinator, hod, admin)
- [ ] FastAPI dependency for role verification
- [ ] Row-level security (RLS) policies created in PostgreSQL
- [ ] Protected endpoints return 403 Forbidden for unauthorized roles
- [ ] Unit tests for all role combinations
- [ ] Database policies verified with SELECT queries

**Definition of Done**: Tested, documented, code reviewed

---

#### Story: CMMS-4 Password Reset & OTP System
**Type**: Story | **Story Points**: 8 | **Priority**: High | **Assignee**: Backend Lead

**Description**: 
Implement OTP-based password reset flow with email dispatch.

**Acceptance Criteria**:
- [ ] POST `/api/auth/password-reset` generates OTP (6 digits, 10min validity)
- [ ] OTP stored in cache with TTL
- [ ] Email sent to student email with OTP
- [ ] POST `/api/auth/password-reset/confirm` validates OTP
- [ ] Password updated on successful validation
- [ ] OTP marked used (single-use only)
- [ ] Error messages for expired/invalid OTP

**Definition of Done**: Tested, documented, code reviewed

---

#### Story: CMMS-5 Email Service Integration
**Type**: Story | **Story Points**: 5 | **Priority**: High | **Assignee**: Backend Lead

**Description**: 
Integrate Resend or Mailgun for transactional email dispatch.

**Acceptance Criteria**:
- [ ] Email service provider selected (Resend or Mailgun)
- [ ] API credentials configured in `.env`
- [ ] Email sending wrapper class created
- [ ] OTP email template created
- [ ] Notification email template created
- [ ] Retry logic for failed sends (up to 3 attempts)
- [ ] Email logging for auditing

**Definition of Done**: Tested in dev environment, documented

---

#### Story: CMMS-6 Forced Password Change on Login
**Type**: Story | **Story Points**: 5 | **Priority**: High | **Assignee**: Frontend + Backend

**Description**: 
Implement forced password change flow for first login (new user accounts).

**Acceptance Criteria**:
- [ ] User table has `password_changed_at` timestamp field
- [ ] Backend returns special flag if password never changed
- [ ] Frontend intercepted login → redirect to change password screen
- [ ] Change password form requires old password + new password (2x)
- [ ] Password updated & redirected to dashboard on success
- [ ] All 5 roles work end-to-end

**Definition of Done**: E2E tested, code reviewed

---

#### Story: CMMS-7 Next.js Project Setup & Routing
**Type**: Story | **Story Points**: 5 | **Priority**: Blocker | **Assignee**: Frontend Lead

**Description**: 
Initialize Next.js project with app-based routing, global layout, and configuration.

**Acceptance Criteria**:
- [ ] Next.js 14+ project scaffold created with TypeScript
- [ ] `app/layout.tsx` global layout created
- [ ] Routing structure defined per role (app/student/, app/lecturer/, etc.)
- [ ] Environment variables configured (`NEXT_PUBLIC_API_URL`, etc.)
- [ ] Tailwind CSS or CSS Modules configured
- [ ] ESLint & Prettier configured
- [ ] CI/CD build pipeline passing

**Definition of Done**: Builds successfully, no errors in console

---

#### Story: CMMS-8 Login & Forced Password Change UI
**Type**: Story | **Story Points**: 8 | **Priority**: Blocker | **Assignee**: Frontend Lead

**Description**: 
Create login page and forced password change screen.

**Acceptance Criteria**:
- [ ] Login page displays email + password inputs
- [ ] Form validation (email format, password length ≥ 8)
- [ ] Login button submits to backend
- [ ] Error messages display (invalid credentials, server error)
- [ ] Loading state during submission
- [ ] Success redirects to dashboard
- [ ] Password change form: old password + new (2x)
- [ ] Form resets after successful password change

**Definition of Done**: Responsive, accessible, E2E tested

---

#### Story: CMMS-9 Protected Route Guards & Redirects
**Type**: Story | **Story Points**: 5 | **Priority**: Blocker | **Assignee**: Frontend Lead

**Description**: 
Implement route protection based on JWT and role.

**Acceptance Criteria**:
- [ ] Custom `useAuthGuard()` hook created
- [ ] Token stored in secure httpOnly cookie (or secure storage)
- [ ] Unauthenticated users redirected to login
- [ ] Role mismatch redirects to 403 Forbidden page
- [ ] Public routes (login, 404, 500) accessible without auth
- [ ] Route guards integrated into all protected pages
- [ ] Tested across all user roles

**Definition of Done**: All routes protected, tested

---

#### Story: CMMS-10 Role-Aware UI Shell & Navigation
**Type**: Story | **Story Points**: 8 | **Priority**: High | **Assignee**: Frontend Lead

**Description**: 
Create dynamic sidebar/navigation that changes per user role.

**Acceptance Criteria**:
- [ ] Sidebar component created with role-based menu items
- [ ] Student nav: Dashboard, My Marks, My Queries
- [ ] Lecturer nav: Dashboard, Courses, Grades, Queries
- [ ] Coordinator nav: Courses, Rosters, Assessments
- [ ] HOD nav: Dashboard, Metrics, Alerts, Export
- [ ] Admin nav: Accounts, Backup, Logs, Settings
- [ ] User info dropdown (name, role, logout)
- [ ] Responsive on mobile (collapse to hamburger)

**Definition of Done**: All roles tested, responsive

---

#### Story: CMMS-11 Reusable Component Library
**Type**: Story | **Story Points**: 8 | **Priority**: High | **Assignee**: Frontend Lead

**Description**: 
Build component library for consistent UI across application.

**Acceptance Criteria**:
- [ ] Button component (variants: primary, secondary, danger)
- [ ] Form inputs (text, email, password, select, checkbox, radio)
- [ ] Modal/dialog component
- [ ] Table component with basic sorting
- [ ] Card component for layout
- [ ] Badge component for status
- [ ] All components documented in Storybook or README
- [ ] TypeScript types for all props

**Definition of Done**: All components tested, documented

---

#### Story: CMMS-12 Toast/Notification System
**Type**: Story | **Story Points**: 5 | **Priority**: High | **Assignee**: Frontend Lead

**Description**: 
Implement toast notifications for API feedback and user actions.

**Acceptance Criteria**:
- [ ] Toast component created (success, error, warning, info)
- [ ] Custom `useToast()` hook for triggering
- [ ] Auto-dismiss after 4 seconds
- [ ] Manual dismiss button
- [ ] Multiple toasts stacked vertically
- [ ] Integration with API error handling
- [ ] No accessibility violations (ARIA labels)

**Definition of Done**: Tested, integrated with API

---

#### Story: CMMS-13 Loading & Error State Components
**Type**: Story | **Story Points**: 5 | **Priority**: High | **Assignee**: Frontend Lead

**Description**: 
Create reusable loading & error state components.

**Acceptance Criteria**:
- [ ] Loading skeleton component for data fetch
- [ ] Spinner component for async operations
- [ ] 404 Not Found error page
- [ ] 403 Forbidden error page
- [ ] 500 Server Error page
- [ ] Generic error boundary component
- [ ] All with appropriate messaging & styling

**Definition of Done**: Tested, styled consistently

---

### 4.2 Epic Summary

| Metric | Value |
|--------|-------|
| **Total Stories** | 13 |
| **Total Story Points** | 50 |
| **Critical Path** | CMMS-1 → CMMS-2 → CMMS-3 (dependency order) |
| **Definition of Done** | Code reviewed, tested, documented, CI passing |
| **Success Criteria** | All 5 roles can log in through real UI, password flows end-to-end |

---

## 5. EPIC-2: Sprint 2 - Course Setup & Roster Management

**Dates**: 20 Apr – 1 May | **Status**: Planned | **Epic Lead**: TBD

### 5.1 Key Stories

#### Story: CMMS-14 Create Course Shells
**Type**: Story | **Story Points**: 5 | **Priority**: Blocker | **Assignee**: Backend Lead

**Description**: 
Create course management endpoints for coordinators to provision new courses.

**Acceptance Criteria**:
- [ ] POST `/api/courses` accepts (code, section, year, semester)
- [ ] Fields validated (code 6 char max, year 4 digits, etc.)
- [ ] Lecturer/coordinator assignment supported
- [ ] Course created with ACTIVE status
- [ ] Returns course ID and codes
- [ ] Authorization: coordinator-only

**Definition of Done**: Tested, code reviewed

---

#### Story: CMMS-15 Lecturer Assignment & Load Tracking
**Type**: Story | **Story Points**: 5 | **Priority**: High | **Assignee**: Backend Lead

**Description**: 
Track lecturer-to-course assignments and credit hour loads.

**Acceptance Criteria**:
- [ ] PUT `/api/courses/:id/assign-lecturer` endpoint
- [ ] Lecturer credit hours tracked (sum by lecturer)
- [ ] Override protection: warn if exceeds max load
- [ ] Assignment history logged
- [ ] Authorization: coordinator-only

**Definition of Done**: Tested, documented

---

#### Story: CMMS-16 Excel Roster Upload & Parsing
**Type**: Story | **Story Points**: 8 | **Priority**: Blocker | **Assignee**: Backend Lead

**Description**: 
Implement Excel roster upload with validation and dry-run preview.

**Acceptance Criteria**:
- [ ] POST `/api/courses/:id/roster` accepts Excel file (openpyxl)
- [ ] Parse columns: student_id, email, first_name, last_name
- [ ] Validate all required fields present
- [ ] Check for duplicates & invalid emails
- [ ] Return dry-run preview before committing
- [ ] PUT confirmation endpoint to finalize
- [ ] Error report with line-by-line feedback
- [ ] All uploaded data in single transaction

**Definition of Done**: E2E tested with sample data

---

#### Story: CMMS-17 Auto-Create Student Accounts & OTP
**Type**: Story | **Story Points**: 8 | **Priority**: Blocker | **Assignee**: Backend Lead

**Description**: 
Automatically create student accounts from roster with OTP email dispatch.

**Acceptance Criteria**:
- [ ] For each student in roster, create user account
- [ ] Generate temporary password (random, hashed)
- [ ] Set `password_changed_at = null` (force change on first login)
- [ ] Send OTP email to student with login instructions
- [ ] Create enrollment record linking student to course
- [ ] Rollback entire roster if any account creation fails
- [ ] Report success/failure counts

**Definition of Done**: Tested with mock email, transaction integrity verified

---

#### Story: CMMS-18 Assessment Schema Configuration
**Type**: Story | **Story Points**: 5 | **Priority**: Blocker | **Assignee**: Backend Lead

**Description**: 
Create assessment form and schema for each course.

**Acceptance Criteria**:
- [ ] POST `/api/assessments` accepts (name, type, max_score, weight)
- [ ] Types: assignment, exam, quiz
- [ ] Weight validation: cumulative ≤ 100%
- [ ] Return HTTP 422 if weight validation fails
- [ ] Assessment locked after first mark saved
- [ ] Authorization: lecturer-only

**Definition of Done**: Tested, documentation with examples

---

#### Story: CMMS-19 Roster Add/Drop Student
**Type**: Story | **Story Points**: 5 | **Priority**: High | **Assignee**: Backend Lead

**Description**: 
Manual add/drop student from course with soft-delete.

**Acceptance Criteria**:
- [ ] POST `/api/enrollments` manual add
- [ ] DELETE `/api/enrollments/:id` soft-delete (set `deleted_at`)
- [ ] Audit log entry for add/drop events
- [ ] Dropped students don't appear in grids
- [ ] Can reactivate dropped enrollment
- [ ] Authorization: coordinator-only

**Definition of Done**: Tested, audit trail verified

---

#### Story: CMMS-20 Course Provisioning UI (Coordinator)
**Type**: Story | **Story Points**: 8 | **Priority**: High | **Assignee**: Frontend Lead

**Description**: 
Create course management interface for coordinators.

**Acceptance Criteria**:
- [ ] Coordinator dashboard lists courses
- [ ] Create course form (code, section, year, semester)
- [ ] Assign lecturer dropdown
- [ ] Upload roster modal (Excel file picker)
- [ ] Dry-run preview display before confirmation
- [ ] Confirmation dialog with row count
- [ ] Success/error messages with details
- [ ] Toast notifications for actions

**Definition of Done**: E2E tested, responsive

---

#### Story: CMMS-21 Assessment Configuration UI (Lecturer)
**Type**: Story | **Story Points**: 5 | **Priority**: High | **Assignee**: Frontend Lead

**Description**: 
Create assessment configuration form for lecturers.

**Acceptance Criteria**:
- [ ] Lecturer course dashboard shows assessments
- [ ] Add assessment form (name, type, max_score, weight)
- [ ] Real-time cumulative weight display
- [ ] Validation error if weight > 100%
- [ ] Locked assessment indication (read-only)
- [ ] Delete assessment button (if unlocked)
- [ ] Responsive form layout

**Definition of Done**: Tested, validation working

---

### 5.2 Epic Summary

| Metric | Value |
|--------|-------|
| **Total Stories** | 8 |
| **Total Story Points** | 49 |
| **Dependency** | EPIC-1 must complete first |
| **Success Criteria** | Full course provisioning, students seeded and can log in |

---

## 6. EPIC-3: Sprint 3 - Grading & Publication

**Dates**: 4 May – 15 May | **Status**: Planned | **Epic Lead**: TBD

### 6.1 Key Stories

#### Story: CMMS-22 Smart Grid Backend (API)
**Type**: Story | **Story Points**: 8 | **Priority**: Blocker | **Assignee**: Backend Lead

**Description**: 
Provide Smart Grid data endpoint with marks and student info.

**Acceptance Criteria**:
- [ ] GET `/api/courses/:id/marks` returns grid data (students, assessments, marks)
- [ ] Include cell metadata (status, last_updated, updated_by)
- [ ] Optimized query (indexes on course_id, assessment_id, student_id)
- [ ] Response < 200ms for 500 students × 10 assessments
- [ ] Authorization: lecturer-only for own course, HOD read-only all

**Definition of Done**: Performance tested, indexed

---

#### Story: CMMS-23 Smart Grid Frontend (React)
**Type**: Story | **Story Points**: 13 | **Priority**: Blocker | **Assignee**: Frontend Lead

**Description**: 
Build high-performance Smart Grid UI with virtual scrolling.

**Acceptance Criteria**:
- [ ] Grid renders 500+ rows with TanStack/AG Grid virtual scrolling
- [ ] Columns: Student ID, Name, Assessment 1, 2, 3... Carry Total
- [ ] Cell colors: DRAFT (gray), PUBLISHED (green), DELAYED (yellow), FLAGGED (orange), ANOMALY (purple)
- [ ] Inline cell click to edit
- [ ] Header freeze on scroll
- [ ] Sort by student name, ID, carry total
- [ ] No lag with keyboard navigation
- [ ] Mobile-responsive (may hide some assessments)

**Definition of Done**: Performance baseline met, tested across devices

---

#### Story: CMMS-24 Inline Mark Entry & Validation
**Type**: Story | **Story Points**: 8 | **Priority**: Blocker | **Assignee**: Backend + Frontend

**Description**: 
Enable inline mark entry with validation and DRAFT save.

**Acceptance Criteria**:
- [ ] Click cell → edit mode (input field)
- [ ] Validate: 0 ≤ score ≤ max_score
- [ ] Auto-normalize to 0-100 scale
- [ ] Save to DRAFT status (not PUBLISHED)
- [ ] Tab to next cell or click elsewhere to save
- [ ] Show score normalizing feedback
- [ ] PUT `/api/marks/:id` updates with DRAFT status
- [ ] Error messages for invalid input

**Definition of Done**: E2E tested, validation working

---

#### Story: CMMS-25 Optimistic Concurrency Control
**Type**: Story | **Story Points**: 5 | **Priority**: High | **Assignee**: Backend Lead

**Description**: 
Prevent concurrent mark edits with optimistic locking.

**Acceptance Criteria**:
- [ ] Mark table has `updated_at` timestamp
- [ ] PUT request includes `updated_at` for comparison
- [ ] If mark changed by another user: return HTTP 409 Conflict
- [ ] Frontend shows conflict dialog: "Another user edited. Refresh to see."
- [ ] Allow force-update on user confirmation
- [ ] Tested with concurrent requests

**Definition of Done**: Tested with concurrent API calls

---

#### Story: CMMS-26 Immutable Audit Log
**Type**: Story | **Story Points**: 8 | **Priority**: Blocker | **Assignee**: Backend Lead

**Description**: 
Record all mark changes in immutable audit log.

**Acceptance Criteria**:
- [ ] Database trigger on marks table INSERT/UPDATE
- [ ] Log entry: table, record_id, user_id, action, old_values, new_values, timestamp
- [ ] Audit log table immutable (no DELETE/UPDATE allowed)
- [ ] User ID from JWT token
- [ ] Timestamp in UTC
- [ ] Query for full history of a mark
- [ ] Integration test verifies trigger fires

**Definition of Done**: Trigger tested, audit query tested

---

#### Story: CMMS-27 Mark Flagging for Review
**Type**: Story | **Story Points**: 5 | **Priority**: High | **Assignee**: Backend + Frontend

**Description**: 
Allow lecturers to flag marks for internal review.

**Acceptance Criteria**:
- [ ] Right-click on grid cell → "Flag for Review" option
- [ ] Mark status changes to FLAGGED
- [ ] Cell color changes to orange
- [ ] Flag reason optional (text field)
- [ ] PUT `/api/marks/:id/flag` endpoint
- [ ] Show flagged marks summary
- [ ] Resolve flag (back to DRAFT or PUBLISHED)

**Definition of Done**: E2E tested, context menu working

---

#### Story: CMMS-28 DELAYED Status & Expected Date
**Type**: Story | **Story Points**: 5 | **Priority**: High | **Assignee**: Backend + Frontend

**Description**: 
Mark grades as DELAYED with expected submission date.

**Acceptance Criteria**:
- [ ] Right-click mark → "Mark as DELAYED"
- [ ] Form: delay reason + expected date picker
- [ ] Status changes to DELAYED (yellow cell)
- [ ] PUT `/api/marks/:id/delay` endpoint
- [ ] Track days overdue (if expected date passed)
- [ ] Can update reason or expected date
- [ ] Resolve DELAYED → assign actual mark

**Definition of Done**: Date picker tested, overdue logic verified

---

#### Story: CMMS-29 Excel Bulk Import (2-Step)
**Type**: Story | **Story Points**: 8 | **Priority**: High | **Assignee**: Backend + Frontend

**Description**: 
Support bulk mark import from Excel with preview & confirm.

**Acceptance Criteria**:
- [ ] Upload Excel → parse all marks
- [ ] Step 1: Show preview (students, assessments, scores)
- [ ] Validate: student exists, assessment exists, score 0-max_score
- [ ] Error report: line, field, error message
- [ ] Allow user to fix errors & re-upload OR confirm as-is
- [ ] Step 2: Confirm batch update
- [ ] All marks saved in single transaction
- [ ] Success report: X rows imported, Y skipped

**Definition of Done**: E2E tested with sample CSV

---

#### Story: CMMS-30 Publish Assessment (Single & Bulk)
**Type**: Story | **Story Points**: 8 | **Priority**: Blocker | **Assignee**: Backend + Frontend

**Description**: 
Transition DRAFT marks to PUBLISHED status.

**Acceptance Criteria**:
- [ ] POST `/api/assessments/:id/publish` single assessment
- [ ] PUT `/api/assessments/:id/publish-all` all assessments
- [ ] Preconditions: all DELAYED marks must have expected_date
- [ ] Validate: no DRAFT marks without scores
- [ ] Status: DRAFT → PUBLISHED for all marks
- [ ] Trigger email dispatch to students
- [ ] Return email job ID for tracking
- [ ] Show success message with count

**Definition of Done**: Tested, email dispatch verified

---

#### Story: CMMS-31 Email Dispatch to Students
**Type**: Story | **Story Points**: 5 | **Priority**: High | **Assignee**: Backend Lead

**Description**: 
Send batch emails to students when marks published.

**Acceptance Criteria**:
- [ ] Triggered on mark publication
- [ ] Async background job (Celery or similar)
- [ ] Email template: "Your marks for [Course] [Assessment] are published"
- [ ] Include student's carry total
- [ ] Link to student dashboard
- [ ] Retry failed emails (3 attempts, 1hr apart)
- [ ] Log email deliveries & failures

**Definition of Done**: Tested with mock email service

---

#### Story: CMMS-32 Student Dashboard & Carry View
**Type**: Story | **Story Points**: 8 | **Priority**: High | **Assignee**: Frontend Lead

**Description**: 
Create student dashboard to view published marks and carry total.

**Acceptance Criteria**:
- [ ] Student dashboard lists courses
- [ ] For each course: assessments with published marks
- [ ] Calculate carry total in real-time (Σ of published × weights)
- [ ] Sort options: by course, by date, by score
- [ ] Historical view (previous terms if available)
- [ ] Download transcript as PDF (optional)
- [ ] Responsive on mobile

**Definition of Done**: Tested, calculations verified

---

### 6.2 Epic Summary

| Metric | Value |
|--------|-------|
| **Total Stories** | 11 |
| **Total Story Points** | 81 |
| **Dependency** | EPIC-2 must complete first |
| **Success Criteria** | Lecturer grades cohort, students see marks, audit trail active |

---

## 7. EPIC-4: Sprint 4 - Oversight, Export & AI

**Dates**: 18 May – 29 May | **Status**: Planned | **Epic Lead**: TBD

### 7.1 Key Stories

#### Story: CMMS-33 Student Mark Queries
**Type**: Story | **Story Points**: 5 | **Priority**: High | **Assignee**: Backend + Frontend

**Description**: 
Allow students to query published marks with lecturer responses.

**Acceptance Criteria**:
- [ ] Student clicks mark cell → "Raise Query"
- [ ] Form: query_text (mandatory), optional reason
- [ ] POST `/api/marks/:id/queries` endpoint
- [ ] Lecturer receives notification
- [ ] Lecturer can respond: note OR edit mark
- [ ] Student sees response in query history
- [ ] Mark as resolved when student acknowledges
- [ ] Thread history visible to both

**Definition of Done**: E2E tested, notifications working

---

#### Story: CMMS-34 HOD Dashboard - Metrics & Alerts
**Type**: Story | **Story Points**: 8 | **Priority**: Blocker | **Assignee**: Backend + Frontend

**Description**: 
Build HOD dashboard with departmental metrics and alerts.

**Acceptance Criteria**:
- [ ] GET `/api/hod/metrics` returns:
  - Failure rate % (students with carry < 40%)
  - Overdue DELAYED count
  - DRAFT % (unpublished marks)
  - Unresolved query count
- [ ] Alert thresholds: failure ≥40% (red), unpublished near deadline (yellow)
- [ ] Dashboard displays metrics with color coding
- [ ] Drilldown: click metric → filtered list
- [ ] Refresh button + auto-refresh every 5 min
- [ ] Exportable summary report

**Definition of Done**: Dashboard tested, metrics verified

---

#### Story: CMMS-35 Query Management Interface
**Type**: Story | **Story Points**: 5 | **Priority**: High | **Assignee**: Frontend Lead

**Description**: 
HOD can view and track student queries across department.

**Acceptance Criteria**:
- [ ] HOD sees all student queries (read-only)
- [ ] Filter: by course, status (open/resolved), date range
- [ ] Show: student name, query text, lecturer response, status
- [ ] Click to expand full thread
- [ ] No direct HOD intervention (lecturer responds)
- [ ] Escalation flag if unresolved > 3 days

**Definition of Done**: Tested, filtering works

---

#### Story: CMMS-36 CSV Export with Precondition Checks
**Type**: Story | **Story Points**: 8 | **Priority**: Blocker | **Assignee**: Backend + Frontend

**Description**: 
Export marks to CSV for submission to central system.

**Acceptance Criteria**:
- [ ] POST `/api/export/csv` triggered by HOD
- [ ] Preconditions (HTTP 422 if any fail):
  - No DELAYED marks without expected_date passed
  - All marks PUBLISHED (no DRAFT)
  - No unresolved queries > 7 days old
- [ ] Return CSV with: student_id, course_code, assessment, score, carry_total
- [ ] Include metadata header: export_date, lecturer, course
- [ ] Audit log: who exported, when, row count
- [ ] Blocking UI lists each unmet precondition with resolution

**Definition of Done**: Tested with various precondition failures

---

#### Story: CMMS-37 Export Blocking UI
**Type**: Story | **Story Points**: 5 | **Priority**: High | **Assignee**: Frontend Lead

**Description**: 
Show blocking issues preventing export in clear UI.

**Acceptance Criteria**:
- [ ] Export button → checker runs
- [ ] If preconditions fail: show detailed list
  - Each unresolved DELAYED: student, assessment, reason
  - Each DRAFT mark: student, assessment
  - Each unresolved query: student, message, days old
- [ ] Direct links to resolve each issue
- [ ] Checkbox to ack each resolved issue
- [ ] Re-check button after resolutions
- [ ] Export button enabled only when all clear

**Definition of Done**: All blocking scenarios tested

---

#### Story: CMMS-38 Admin Account Management
**Type**: Story | **Story Points**: 5 | **Priority**: High | **Assignee**: Backend + Frontend

**Description**: 
Admin interface for user account management.

**Acceptance Criteria**:
- [ ] POST `/api/admin/accounts` create user (admin-only)
- [ ] PUT `/api/admin/accounts/:id` edit role, disable/enable
- [ ] DELETE `/api/admin/accounts/:id` (soft delete)
- [ ] Force password reset link (sends OTP email)
- [ ] Audit log all admin changes
- [ ] Authorization: admin-only
- [ ] Admin UI: list, create, edit, disable users

**Definition of Done**: Tested, audit trail verified

---

#### Story: CMMS-39 Database Backup & Restore
**Type**: Story | **Story Points**: 8 | **Priority**: High | **Assignee**: Backend Lead

**Description**: 
Admin interface for database backup and restore.

**Acceptance Criteria**:
- [ ] POST `/api/admin/backup/create` triggers backup
- [ ] Backup stored in secure location (S3 or local mount)
- [ ] Filename: `cmms_backup_YYYY-MM-DD_HHmmss.sql.gz`
- [ ] POST `/api/admin/backup/restore/:backupid` restores
- [ ] Restore requires confirmation + password
- [ ] System offline during restore (maintenance mode)
- [ ] Audit log: who backed up, when, file size
- [ ] Tested restore from backup

**Definition of Done**: Backup/restore tested end-to-end

---

#### Story: CMMS-40 AI Anomaly Detection (Z-Score)
**Type**: Story | **Story Points**: 13 | **Priority**: High | **Assignee**: Backend Lead

**Description**: 
Implement Z-score anomaly detection on mark distributions.

**Acceptance Criteria**:
- [ ] Algorithm: for each assessment, calculate mean (μ), std dev (σ)
- [ ] For each mark: z = (score - μ) / σ
- [ ] Flag if |z| > 2.5 (unusual performance)
- [ ] Trigger on: mark publish, bulk import, daily scheduled check
- [ ] Mark anomaly marks with ANOMALY status
- [ ] Store anomaly reason in audit log
- [ ] GET `/api/ai/anomalies` returns flagged marks
- [ ] Optional: check for data entry errors (e.g., 999)
- [ ] Tested with synthetic data distributions

**Definition of Done**: Algorithm tested with known datasets, endpoint working

---

#### Story: CMMS-41 Anomaly Visualization (Frontend)
**Type**: Story | **Story Points**: 5 | **Priority**: High | **Assignee**: Frontend Lead

**Description**: 
Display anomalies in Smart Grid and anomaly dashboard.

**Acceptance Criteria**:
- [ ] ANOMALY cell colored purple in Student Grid
- [ ] Hover tooltip: "Anomaly detected: Z-score = X.XX"
- [ ] Anomaly dashboard page (HOD/Admin only)
- [ ] List: assessment, student, score, z-score, reason
- [ ] Filter: by course, assessment, z-score range
- [ ] Can dismiss anomaly or flag for manual review
- [ ] Explanation of Z-score for users

**Definition of Done**: Dashboard tested, visualizations verified

---

#### Story: CMMS-42 Locked Assessment Schema Override
**Type**: Story | **Story Points**: 3 | **Priority**: Low | **Assignee**: Backend Lead

**Description**: 
Admin capability to override locked assessment schema.

**Acceptance Criteria**:
- [ ] Admin only: PUT `/api/admin/assessments/:id/unlock`
- [ ] Unlock assessment (allow schema edit)
- [ ] Mandatory comment field explaining override
- [ ] Audit log: admin, timestamp, reason, before/after values
- [ ] Loud warning if attempted while marks exist

**Definition of Done**: Tested, audit trail verified

---

### 7.2 Epic Summary

| Metric | Value |
|--------|-------|
| **Total Stories** | 10 |
| **Total Story Points** | 65 |
| **Dependency** | EPIC-3 must complete first |
| **Success Criteria** | System production-ready, HOD visibility, export unblocked, AI anomalies surfaced |

---

## 8. EPIC-5: Integration Phase - UAT & Production

**Dates**: 1 Jun – 12 Jun | **Status**: Planned | **Epic Lead**: TBD

### 8.1 Integration Stories

#### Story: CMMS-43 End-to-End Testing & UAT Scripts
**Type**: Story | **Story Points**: 8 | **Priority**: Blocker | **Assignee**: QA Lead

**Description**: 
Create comprehensive UAT test scripts covering all user journeys.

**Acceptance Criteria**:
- [ ] Student journey: Login → View marks → Submit query
- [ ] Lecturer journey: View roster → Enter marks → Publish
- [ ] Coordinator journey: Create course → Upload roster
- [ ] HOD journey: View metrics → Export marks
- [ ] Admin journey: Create accounts → Backup database
- [ ] All scenarios pass on staging environment
- [ ] UAT documentation & sign-off template

**Definition of Done**: All scripts documented, traced to requirements

---

#### Story: CMMS-44 Performance Baseline & Load Testing
**Type**: Story | **Story Points**: 8 | **Priority**: Blocker | **Assignee**: Backend Lead

**Description**: 
Verify performance targets met under realistic load.

**Acceptance Criteria**:
- [ ] Smart Grid: 500 students × 10 assessments renders < 1s
- [ ] Mark entry: PUT response < 200ms p95
- [ ] Email dispatch: 1000 emails sent < 30s
- [ ] CSV export: 500 records < 5s
- [ ] JMeter/K6 load test @ 50 concurrent users
- [ ] Database queries indexed, execution plans reviewed
- [ ] Results documented with recommendations

**Definition of Done**: Load test report completed, SLAs met

---

#### Story: CMMS-45 Security Penetration Testing
**Type**: Story | **Story Points**: 10 | **Priority**: Blocker | **Assignee**: Security Lead

**Description**: 
Basic security testing to identify vulnerabilities.

**Acceptance Criteria**:
- [ ] SQL injection testing on all endpoints (OWASP)
- [ ] XSS testing on user input fields
- [ ] CSRF token verification
- [ ] Authentication bypass attempts
- [ ] Authorization boundary testing (role access)
- [ ] Sensitive data exposure (logs, responses)
- [ ] No critical/high severity findings
- [ ] Security report with mitigations

**Definition of Done**: Security audit report completed

---

#### Story: CMMS-46 API Documentation Generation
**Type**: Story | **Story Points**: 5 | **Priority**: High | **Assignee**: Backend Lead

**Description**: 
Generate and publish API reference documentation.

**Acceptance Criteria**:
- [ ] OpenAPI/Swagger spec created for all endpoints
- [ ] Each endpoint: method, path, params, request/response examples
- [ ] Error codes documented (401, 403, 422, 500)
- [ ] Authentication header requirements
- [ ] Rate limiting documented
- [ ] Generated from code (FastAPI auto-docs)
- [ ] Published to: `/api/docs` and GitHub wiki

**Definition of Done**: OpenAPI spec validated, docs hosted

---

#### Story: CMMS-47 Database Schema ER Diagram
**Type**: Story | **Story Points**: 3 | **Priority**: High | **Assignee**: Backend Lead

**Description**: 
Create ER diagram for database schema.

**Acceptance Criteria**:
- [ ] Entity-relationship diagram (ERDPlus, Lucidchart, or draw.io)
- [ ] All 7 tables with relationships
- [ ] Primary keys, foreign keys, indexes marked
- [ ] Included in documentation

**Definition of Done**: Diagram generated, reviewed

---

#### Story: CMMS-48 Deployment Guide & Runbook
**Type**: Story | **Story Points**: 5 | **Priority**: High | **Assignee**: DevOps Lead

**Description**: 
Create deployment and operational documentation.

**Acceptance Criteria**:
- [ ] Docker Compose deployment steps
- [ ] Environment variable setup (production .env)
- [ ] Database migration procedures
- [ ] Health check endpoints
- [ ] Rollback procedures
- [ ] Troubleshooting guide
- [ ] Emergency contacts & escalation

**Definition of Done**: Runbook tested by another team member

---

#### Story: CMMS-49 System Architecture Diagram Update
**Type**: Story | **Story Points**: 3 | **Priority**: High | **Assignee**: Tech Lead

**Description**: 
Update and finalize system architecture diagram.

**Acceptance Criteria**:
- [ ] High-level architecture (components & flows)
- [ ] Data flow diagram
- [ ] Deployment topology
- [ ] Security boundaries marked
- [ ] Included in documentation

**Definition of Done**: Diagrams reviewed and approved

---

#### Story: CMMS-50 User Manual (By Role)
**Type**: Story | **Story Points**: 8 | **Priority**: High | **Assignee**: Documentation Lead

**Description**: 
Create user manuals for each role.

**Acceptance Criteria**:
- [ ] Student manual: view marks, submit queries, download transcript
- [ ] Lecturer manual: create courses, enter grades, publish marks
- [ ] Coordinator manual: setup courses, upload rosters, manage students
- [ ] HOD manual: view metrics, export data, resolve issues
- [ ] Admin manual: manage accounts, backup, system settings
- [ ] Screenshots for key workflows
- [ ] PDF format with table of contents
- [ ] Plain language (non-technical)

**Definition of Done**: All manuals proofread, formatted

---

#### Story: CMMS-51 Code Quality Review
**Type**: Story | **Story Points**: 5 | **Priority**: High | **Assignee**: Tech Lead

**Description**: 
Verify code quality standards met.

**Acceptance Criteria**:
- [ ] Linting: ESLint (frontend), pylint/black (backend) passing
- [ ] Code coverage: backend ≥ 70%, frontend ≥ 60%
- [ ] No XXX/TODO comments (resolved or logged as issues)
- [ ] Type hints: Python 100%, TypeScript 100%
- [ ] No hardcoded credentials in code
- [ ] SOLID principles reviewed
- [ ] Code quality report generated

**Definition of Done**: Report completed, no blockers

---

#### Story: CMMS-52 Stakeholder Signoff & UAT Approval
**Type**: Story | **Story Points**: 5 | **Priority**: Blocker | **Assignee**: Project Manager

**Description**: 
Obtain UAT signoff from stakeholders before production.

**Acceptance Criteria**:
- [ ] UAT conducted by assigned stakeholders
- [ ] Test results documented (pass/fail per scenario)
- [ ] Any issues logged and resolved
- [ ] Signoff form signed (digital or printed)
- [ ] Known limitations acknowledged
- [ ] Go/no-go decision documented

**Definition of Done**: Signed signoff received

---

#### Story: CMMS-53 Production Deployment
**Type**: Story | **Story Points**: 5 | **Priority**: Blocker | **Assignee**: DevOps Lead

**Description**: 
Deploy system to production environment.

**Acceptance Criteria**:
- [ ] Backup of existing data (if any)
- [ ] Database migrations run successfully
- [ ] All services start and health checks pass
- [ ] DNS/load balancer configured
- [ ] SSL certificate installed
- [ ] First login works for all 5 roles
- [ ] Monitor for 24hrs before declaring stable

**Definition of Done**: Deployment successful, system stable

---

### 8.2 Epic Summary

| Metric | Value |
|--------|-------|
| **Total Stories** | 11 |
| **Total Story Points** | 66 |
| **Dependency** | All prior 4 sprints must complete |
| **Success Criteria** | All 4 sprints complete on schedule, UAT signed off, zero critical security issues, production live |

---

## 9. Custom Fields & Workflow Configuration

### 9.1 Custom Fields

| Field Name | Field Type | Used In | Possible Values |
|------------|-----------|---------|-----------------|
| **Story Points** | Number | All issues | 1, 2, 3, 5, 8, 13, 21 (Fibonacci) |
| **Role** | Select | All stories | Student, Lecturer, Coordinator, HOD, Admin, Multiple |
| **Component** | Select | Tasks | Backend, Frontend, Database, DevOps, QA, Security |
| **Browser/Device** | Select | Frontend bugs | Chrome, Firefox, Safari, Mobile (iOS/Android) |
| **Environment** | Select | All | Dev, Staging, Production |
| **Test Coverage** | Select | Backend tasks | Unit, Integration, E2E |
| **Blocked By** | Link | All issues | Link to blocking issue |
| **Related To** | Link | All issues | Link to related issues |

### 9.2 Workflow States

```
BACKLOG
   ↓
TO DO
   ├─→ IN PROGRESS
   │      ├─→ IN REVIEW
   │      │      ├─→ DONE
   │      │      └─→ IN PROGRESS (changes requested)
   │      └─→ DONE (without review)
   └─→ BLOCKED (waiting on external dependency)
         └─→ TO DO (unblocked)
```

---

## 10. Issue Labels

```
## Priority Labels
- priority/critical (P0 - project blocker)
- priority/high (P1 - sprint blocker)
- priority/medium (P2 - nice to have)
- priority/low (P3 - backlog)

## Type Labels
- type/feature
- type/bug
- type/technical-debt
- type/documentation
- type/spike (research)

## Domain Labels
- domain/auth
- domain/database
- domain/api
- domain/ui
- domain/email
- domain/ai
- domain/grid
- domain/export

## Status Labels
- status/blocked
- status/in-review
- status/testing
- status/deployed

## Quality Labels
- quality/needs-tests
- quality/refactor-candidate
- quality/tech-debt

## Help Needed
- help-wanted/backend
- help-wanted/frontend
- help-wanted/qa
```

---

## 11. Components (Team Assignments)

```
## Backend Components
- component/auth
- component/courses
- component/rosters
- component/assessments
- component/marks
- component/email
- component/ai
- component/export
- component/admin

## Frontend Components
- component/login
- component/dashboard
- component/smart-grid
- component/forms
- component/navigation

## Infrastructure Components
- component/docker
- component/database
- component/api-gateway
```

---

## 12. Release & Version Management

### 12.1 Release Planning

| Release | Sprint | Version | Target Date | Type |
|---------|--------|---------|------------|------|
| **v0.1-alpha** | Sprint 1 | 0.1.0 | 17 Apr | Auth + Base UI |
| **v0.2-alpha** | Sprint 2 | 0.2.0 | 1 May | Course Setup |
| **v0.3-beta** | Sprint 3 | 0.3.0 | 15 May | Grading |
| **v0.4-rc** | Sprint 4 | 0.4.0 | 29 May | Oversight |
| **v1.0** | Integration | 1.0.0 | 12 Jun | Production Release |

### 12.2 Release Notes Template

```markdown
## v[X.X.X] - [Date]

### Features
- Feature 1 (issue #XXX)
- Feature 2 (issue #XXX)

### Bug Fixes
- Bug fix 1 (issue #XXX)
- Bug fix 2 (issue #XXX)

### Refactoring
- Refactor 1 (issue #XXX)

### Documentation
- Doc 1 (issue #XXX)

### Known Issues
- Issue 1 (workaround: ...)

### Migration Notes
- Database changes: ...
- Deployment: ...
```

---

## 13. Velocity & Burndown

### 13.1 Sprint Velocity Targets

```
Sprint 1: 50 points (baseline)
Sprint 2: 45 points (slight adjustment)
Sprint 3: 50 points (maintain)
Sprint 4: 45 points (some uncertainty on AI)
Sprint 5: 35 points (integration focus, not story-driven)

Total: ~225 story points
```

### 13.2 Burndown Metrics

**Daily Burndown Chart**:
- X-axis: Days in sprint (1-10)
- Y-axis: Remaining story points
- Ideal line: linear from sprint total to 0
- Actual line: team progress

**Sprint Goals Tracking**:
- % stories completed
- % acceptance criteria met
- % Definition of Done items met
- Any blockers or risks

---

## 14. Backlog Grooming Schedule

**Weekly Backlog Refinement**:
- **Monday 2 PM**: 1 hour backlog grooming session
- **Participants**: Product Owner, Tech Lead, 1-2 developers
- **Focus**: Upcoming 2-week sprint + next sprint lookahead
- **Output**: Groomed issues with estimates, acceptance criteria clear

**Sprint Planning**:
- **First day of sprint (Monday)**: 2 hours
- **Participants**: Full team
- **Output**: Issues committed to sprint, capacity allocated

**Sprint Review & Retrospective**:
- **Last day of sprint (Friday)**: 2 hours total
- **Review (1 hr)**: Demo completed work, stakeholder feedback
- **Retro (1 hr)**: What went well, what to improve, action items

---

## 15. Board Views & Filters

### 15.1 Active Sprint Board

**Default View**:
- Scrum board showing: Backlog, To Do, In Progress, In Review, Done
- WIP limits: To Do (10), In Progress (5), In Review (3)
- Swimlanes: By Assignee
- Due dates: Show on cards

**Filter Presets**:
1. "My Issues": assigned to current user
2. "Blocked": has `blocked` label
3. "Ready to Review": in "In Review" column
4. "Testing": has `testing` label
5. "By Component": grouped by backend/frontend/database

### 15.2 Backlog View

- Shows all unstarted work by priority
- Drag to reorder priority
- Click to open detailed view
- Filter by epic, label, component

### 15.3 Release View

- Shows issues across multiple sprints
- Grouped by epic and version
- Burndown by release
- Forecast completion date

---

## 16. Automation & Integration

### 16.1 Jira Automation Rules

```
Rule 1: Auto-comment on PR mention
IF: Issue number mentioned in GitHub PR
THEN: Auto-comment with PR link

Rule 2: Auto-transition In Review
IF: Pull request opened
THEN: Auto-transition issue to "In Review"

Rule 3: Auto-transition Done
IF: Pull request merged to main branch
THEN: Auto-transition issue to "Done"

Rule 4: Sprint start notification
IF: Sprint starts
THEN: Notify team on Slack with sprint goals

Rule 5: Daily standup reminder
IF: Weekday 9 AM
THEN: Remind team to update status
```

### 16.2 Integration Points

- **GitHub**: Link commits/PRs to issues
- **Slack**: Sprint notifications, blocker alerts
- **Confluence**: Link documentation to issues
- **Docker Hub**: Built image linked to release version

---

## 17. Monitoring & Reporting

### 17.1 Key Metrics

**Sprint Health**:
- Velocity trend (actual vs. planned)
- Burndown trajectory
- % stories completed
- New issues added mid-sprint
- Blockers & risks escalated

**Quality Metrics**:
- Bug escape rate (issues found post-launch)
- Technical debt backlog size
- Code review turnaround (avg days)
- Test coverage trend

**Team Metrics**:
- Issues per developer
- Cycle time (To Do → Done)
- Time in review
- Unresolved blockers > 2 days

### 17.2 Reporting Cadence

| Report | Frequency | Owner | Audience |
|--------|-----------|-------|----------|
| Sprint Dashboard | Daily | Scrum Master | Team |
| Sprint Forecast | Mid-sprint | Tech Lead | Team |
| Sprint Summary | End of sprint | Scrum Master | Stakeholders |
| Velocity Trend | Monthly | Scrum Master | Management |
| Release Forecast | Per epic | Product Manager | Stakeholders |

---

## 18. Jira Board Configuration Summary

```yaml
Project: CMMS
Key: CMMS
Type: Scrum

Board:
  Name: CMMS Development
  Type: Scrum
  Columns:
    - Backlog
    - To Do
    - In Progress
    - In Review
    - Done
  
Sprints:
  - Sprint 1: Apr 9-17 (50 pts)
  - Sprint 2: Apr 20 - May 1 (45 pts)
  - Sprint 3: May 4-15 (50 pts)
  - Sprint 4: May 18-29 (45 pts)
  - Sprint 5: Jun 1-12 (35 pts)

Epics:
  - EPIC-1: Foundation (13 stories)
  - EPIC-2: Course Setup (8 stories)
  - EPIC-3: Grading (11 stories)
  - EPIC-4: Oversight (10 stories)
  - EPIC-5: Integration (11 stories)

Estimation: Story Points (1, 2, 3, 5, 8, 13, 21)

Issue Types:
  - Epic
  - Story
  - Task
  - Bug
  - Sub-task

Custom Fields:
  - Role (Student/Lecturer/Coordinator/HOD/Admin)
  - Component (Backend/Frontend/Database/DevOps)
  - Environment (Dev/Staging/Production)
  - Story Points (number)

Labels: 50+ labels across priority, domain, type, quality
Components: 20+ components by functional area
```

---

## 19. Setup Checklist

### 19.1 Pre-Launch Checklist

- [ ] Jira project created with key CMMS
- [ ] Scrum board configured with 5 columns
- [ ] 5 sprints created with dates and point targets
- [ ] 5 epics created (EPIC-1 through EPIC-5)
- [ ] 53 stories created with acceptance criteria
- [ ] All custom fields added
- [ ] Labels created & documented
- [ ] Components created & assigned to team
- [ ] Automation rules configured
- [ ] GitHub/Slack integration connected
- [ ] Team members added & roles assigned
- [ ] Permissions configured (viewing, editing)
- [ ] Filters & saved views created
- [ ] Reporting dashboard configured

### 19.2 Team Onboarding

- [ ] Team trained on Jira workflow
- [ ] Definition of Done agreement signed
- [ ] Sprint planning process documented
- [ ] Daily standup time confirmed (9 AM daily)
- [ ] Sprint review/retro time confirmed (Friday 3 PM)
- [ ] Backlog grooming time confirmed (Monday 2 PM)
- [ ] Escalation procedures documented
- [ ] On-call rotation established

---

## 20. Quick Reference Links

- **Jira Board**: https://[instance].atlassian.net/software/c/projects/CMMS/boards
- **Backlog**: https://[instance].atlassian.net/software/c/projects/CMMS/backlog
- **Roadmap**: https://[instance].atlassian.net/software/c/projects/CMMS/roadmap
- **Reports**: https://[instance].atlassian.net/software/c/projects/CMMS/reports
- **Project Settings**: https://[instance].atlassian.net/secure/project/EditProject.jspa?pid=10000

---

**Document Generated**: 13 April 2026  
**Last Updated**: 13 April 2026  
**Status**: Ready for Implementation  
**Next Step**: Create Jira project and import issues

---

*End of CMMS Jira Project Management Structure*
