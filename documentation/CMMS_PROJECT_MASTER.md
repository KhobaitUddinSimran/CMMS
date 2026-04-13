# Carry Mark Management System (CMMS)
## Comprehensive Project Master Document

**Project**: Carry Mark Management System (CMMS)  
**Course**: SCSJ 3104 – Application Development  
**Institution**: Universiti Teknologi Malaysia (UTM)  
**Author**: Khobait Uddin Simran (A23MJ3006)  
**Document Version**: 3.0 – AI-Enhanced Revised Specification  
**Timeline**: 9 April – 12 June 2026 (8 Weeks → Integration Phase)

---

## 1. Executive Summary

The Carry Mark Management System (CMMS) is a standalone, decentralized web application designed to digitize and automate continuous assessment tracking for university faculties. It replaces manual Excel workflows with a secure, interactive Smart Grid environment built on a modern technology stack.

**Key Characteristics:**
- Operates independently of the university's central API
- Fully containerized via Docker for autonomous deployment
- Five distinct user roles with role-based access control
- Real-time Smart Grid interface for mark entry and grading
- AI-powered anomaly detection for quality assurance
- Comprehensive audit trail for compliance

---

## 2. Technology Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | React / Next.js | Smart Grid UI, student dashboard, all interactive views |
| **Backend** | Python (FastAPI) | REST API, business logic, authentication, file parsing, AI orchestration |
| **Database** | PostgreSQL | Primary data store with row-level security |
| **Deployment** | Docker / Docker Compose | Containerization, multi-service orchestration |
| **Email** | Resend / Mailgun | Transactional email service |
| **Email Service** | Resend/Mailgun | OTP dispatch, notifications, mark publication |
| **AI/Analytics** | NumPy/SciPy | Z-score anomaly detection |
| **Grid UI** | TanStack / AG Grid | Virtual-scrolling high-performance grid |

---

## 3. System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                      CMMS Architecture                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐    │
│  │              │    │              │    │              │    │
│  │  Next.js     │    │   FastAPI    │    │ PostgreSQL   │    │
│  │  Frontend    │───▶│   Backend    │───▶│   Database   │    │
│  │              │    │              │    │              │    │
│  └──────────────┘    └──────────────┘    └──────────────┘    │
│                              │                                 │
│                              ├─▶ Email Service                 │
│                              ├─▶ AI Module                     │
│                              └─▶ File Parser                   │
│                                                                 │
│  ┌────────────────────────────────────────────────────────┐   │
│  │  Docker Compose (Nginx, Frontend, Backend, Database)   │   │
│  └────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 4. User Roles & Access Control

The system supports **5 distinct user roles** with role-based access and row-level security:

### 4.1 Role Hierarchy

| Role | Function | Responsibilities |
|------|----------|------------------|
| **Student** | Assessment participant | View published marks, carry totals, submit queries |
| **Lecturer** | Mark entry & grading | Enter/edit marks, create assessments, publish grades |
| **Course Coordinator** | Course provisioning | Setup courses, manage rosters, upload enrollment data |
| **HOD (Head of Department)** | Oversight & analytics | Monitor metrics, view alerts, approve exports |
| **Admin** | System management | Account management, database backup/restore, schema override |

### 4.2 Access Control Features
- JWT-based authentication with role detection
- Row-level security (RLS) enforced at database level
- Forced password change on first login
- OTP-based password reset via student email
- Protected route guards in frontend
- Role-aware UI shells (sidebar/nav per actor)

---

## 5. Project Timeline: 8 Weeks

### **Phase 1: Foundation (Weeks 1-2)**
- **Dates**: 9 April – 17 April, 2026
- **Focus**: Infrastructure, Authentication, Base UI
- **Duration**: 2 weeks

### **Phase 2: Provisioning (Weeks 3-4)**
- **Dates**: 20 April – 1 May, 2026
- **Focus**: Course Setup, Roster Management
- **Duration**: 2 weeks

### **Phase 3: Grading & Publication (Weeks 5-6)**
- **Dates**: 4 May – 15 May, 2026
- **Focus**: Smart Grid, Assessment Configuration
- **Duration**: 2 weeks

### **Phase 4: Oversight & Export (Weeks 7-8)**
- **Dates**: 18 May – 29 May, 2026
- **Focus**: Dashboards, Analytics, Export, AI
- **Duration**: 2 weeks

### **Integration & Validation Phase**
- **Dates**: 1 June – 12 June, 2026
- **Focus**: System integration, UAT, bug fixes, documentation
- **Duration**: 2 weeks

---

## 6. Detailed Sprint Breakdown

---

## 6.1 SPRINT 1: Foundation, Auth & Base UI
**Duration**: Weeks 1–2 (9 Apr – 17 Apr)

### Objectives
✓ All 5 roles can log in through a real UI
✓ Password flows work end-to-end
✓ Shared components ready for Sprint 2

### 6.1.1 Infrastructure
- [ ] Docker Compose setup (frontend, backend, db, nginx)
- [ ] PostgreSQL schema & migrations (users, courses, enrollments)
- [ ] Environment variables & config

### 6.1.2 Auth System
- [ ] JWT login endpoint with role detection
- [ ] Role-based access & row-level security middleware
- [ ] Forced password change on first login
- [ ] Password reset via OTP → student email

### 6.1.3 Email Infrastructure
- [ ] Transactional email service (Resend/Mailgun) integration
- [ ] Password reset & notification email templates

### 6.1.4 Base UI
- [ ] Next.js project scaffold · global layout & routing
- [ ] Login page · forced password change screen
- [ ] Role-aware shell (sidebar/nav per actor)
- [ ] Reusable component library (buttons, forms, modals, tables)
- [ ] Protected route guards · loading & error states
- [ ] Toast / notification system for API feedback

### 6.1.5 Deliverables
✓ All 5 roles can log in through a real UI
✓ Password flows work end-to-end
✓ Shared components ready for Sprint 2

---

## 6.2 SPRINT 2: Course Setup & Roster Management
**Duration**: Weeks 3–4 (20 Apr – 1 May)

### Objectives
✓ Full course provisioning works
✓ Students seeded and can log in
✓ Assessment schemas configurable

### 6.2.1 Coordinator Flows
- [ ] Create course shells (code, section, year, semester)
- [ ] Assign lecturers to courses · credit hour load tracking

### 6.2.2 Self-Seeding
- [ ] Excel roster upload & in-memory parsing (openpyxl)
- [ ] Student account creation with OTP dispatch
- [ ] Enrollment record linking · seeding report & error handling

### 6.2.3 Assessment Schema
- [ ] Add Assessment form (name, type, max score, weight)
- [ ] Cumulative weight validation (HTTP 422 on breach)
- [ ] Schema lock rule once any mark is saved

### 6.2.4 Roster Operations
- [ ] Manual Add/Drop student · soft-delete with audit trail

### 6.2.5 Deliverables
✓ Full course provisioning works
✓ Students seeded and can log in
✓ Assessment schemas configurable

---

## 6.3 SPRINT 3: Grading & Publication
**Duration**: Weeks 5–6 (4 May – 15 May)

### Objectives
✓ Lecturer can grade a full cohort
✓ Students see published marks
✓ Audit trail active

### 6.3.1 Smart Grid
- [ ] Virtual-scrolling grid UI (TanStack/AG Grid) · all cell states & colours
- [ ] Inline mark entry · score normalisation · DRAFT save
- [ ] Optimistic concurrency check (updated_at / HTTP 409)
- [ ] Immutable audit log trigger on marks table

### 6.3.2 Grading Features
- [ ] DELAYED status (right-click → reason + expected date)
- [ ] Mark flagging for internal review · flag resolution
- [ ] Excel bulk import — two-step preview & confirm flow

### 6.3.3 Publication
- [ ] DRAFT → PUBLISHED transition (per assessment or all)
- [ ] Background email dispatch to enrolled students
- [ ] Student dashboard — view published marks & carry total

### 6.3.4 Deliverables
✓ Lecturer can grade a full cohort
✓ Students see published marks
✓ Audit trail active

---

## 6.4 SPRINT 4: Oversight, Export & AI
**Duration**: Weeks 7–8 (18 May – 29 May)

### Objectives
✓ System production-ready
✓ HOD has full visibility
✓ Export unblocked
✓ AI anomalies surfaced

### 6.4.1 Student Queries
- [ ] Student raises query on published mark cell
- [ ] Lecturer query thread · resolve with note or mark edit

### 6.4.2 HOD Dashboard
- [ ] Aggregated metrics (failure rates, DELAYED overdue, DRAFT %)
- [ ] Alert thresholds (failure ≥ 40%, unpublished near deadline)
- [ ] Read-only query visibility across department

### 6.4.3 Final Export
- [ ] CSV export with precondition checks (no unresolved DELAYED)
- [ ] Blocking UI listing every outstanding cell before export

### 6.4.4 Admin & AI
- [ ] Admin account management · locked schema override (logged)
- [ ] Database backup & restore interface
- [ ] AI anomaly detection (Z-score, numpy/scipy) · purple cell flags

### 6.4.5 Deliverables
✓ System production-ready
✓ HOD has full visibility
✓ Export unblocked
✓ AI anomalies surfaced

---

## 7. Feature Specifications

### 7.1 Authentication & Authorization

**JWT Login Flow**
```
1. User submits credentials (email/password)
2. Backend validates & detects role
3. JWT token issued with role claims
4. Frontend stores token in secure storage
5. Route guards check token & role on navigation
```

**Security Features**
- Forced password change on first login
- OTP-based password reset
- Row-level security (RLS) at database
- Protected API endpoints with middleware validation
- Audit logging for sensitive operations

### 7.2 Smart Grid Interface

**Core Features**
- **Virtual Scrolling**: High-performance rendering for large datasets
- **Cell States**: DRAFT, DELAYED, FLAGGED, PUBLISHED, ANOMALY
- **Color Coding**: Visual status indicators
- **Inline Editing**: Direct mark entry with validation
- **Optimistic Updates**: Immediate UI feedback with concurrency checks
- **Audit Trail**: Immutable change log on marks table

**Mark Entry Process**
```
1. Lecturer opens course grid
2. Enters marks inline (DRAFT state)
3. System normalizes scores to 0-100 scale
4. Optimistic concurrency check (HTTP 409 if conflict)
5. Save triggers audit log entry
6. mark can flag for review
7. Ready for publication when all entries complete
```

### 7.3 Assessment Schema Management

**Configuration Form**
- Assessment name, type (assignment/exam/quiz), max score, weight
- Cumulative weight validation (all assessments must sum to 100%)
- Schema lock rule: once any mark is saved, schema becomes immutable
- Prevents accidental structure changes after grading begins

### 7.4 Publication & Email

**Publication Workflow**
```
Option A: Publish per assessment
├─ Select assessment
├─ Review DRAFT marks
└─ Publish → Status = PUBLISHED

Option B: Publish all at once
├─ Verify no DELAYED status
├─ All DRAFT → PUBLISHED
└─ Trigger background email dispatch

Email to Enrolled Students:
├─ Subject: "Your carry marks are now published"
├─ Body: Published marks + carry total
└─ Link: Dashboard to view full details
```

### 7.5 Student View & Dashboard

**Published Marks Access**
- View by assessment
- Real-time carry total calculation
- Sort by assessment, date, score
- Submit mark query (with reason)

### 7.6 HOD Dashboard & Alerts

**Metrics & Monitoring**
- **Failure Rate**: % of students with carry < 40%
- **DELAYED Overdue**: Assessments past expected date
- **DRAFT %**: % of marks still in draft state
- **Query Status**: Unresolved student queries

**Alert Thresholds**
- Failure ≥ 40%: Red alert
- Unpublished near deadline: Yellow warning
- Unresolved queries > 3 days old: Info notification

### 7.7 Export Functionality

**CSV Export Workflow**
```
1. HOD initiates export
2. System checks preconditions:
   ├─ No unresolved DELAYED marks
   ├─ All assessments published
   └─ No outstanding issues
3. Blocking UI lists every outstanding cell
4. User resolves issues before export allowed
5. Generate CSV with audit trail
6. Download & transmit to central system
```

### 7.8 AI Anomaly Detection

**Z-Score Algorithm**
```
For each assessment:
1. Calculate mean (μ) and std dev (σ)
2. For each mark: z = (x - μ) / σ
3. Flag if |z| > 2.5 (unusual performance)
4. Mark cell with purple background
5. Store anomaly reason in audit log
```

**Use Cases**
- Detect potential data entry errors
- Identify outlier performances
- Flag suspicious patterns
- Assist HOD review process

---

## 8. Database Schema Overview

### 8.1 Core Tables

**users**
```
id (PK)
email (UNIQUE)
password_hash
role (ENUM: student, lecturer, coordinator, hod, admin)
first_name, last_name
created_at, updated_at
```

**courses**
```
id (PK)
code, section, year, semester
lecturer_id (FK → users)
coordinator_id (FK → users)
created_at, updated_at
```

**enrollments**
```
id (PK)
course_id (FK → courses)
student_id (FK → users)
enrollment_date
created_at, updated_at
```

**assessments**
```
id (PK)
course_id (FK → courses)
name, type, max_score, weight
status (ENUM: locked, unlocked)
created_at, updated_at
```

**marks**
```
id (PK)
assessment_id (FK → assessments)
student_id (FK → users)
score
status (ENUM: draft, delayed, flagged, published, anomaly)
delayed_reason, expected_date (nullable)
created_at, updated_at
```

**audit_log** (immutable)
```
id (PK)
table_name
record_id
user_id (FK → users)
action (INSERT, UPDATE, DELETE)
old_values, new_values (JSONB)
timestamp
```

**mark_queries**
```
id (PK)
mark_id (FK → marks)
student_id (FK → users)
query_text
lecturer_response (nullable)
resolved_at (nullable)
created_at, updated_at
```

---

## 9. API Endpoints Summary

### 9.1 Authentication
```
POST   /api/auth/login          # JWT login
POST   /api/auth/password-reset # Request OTP
POST   /api/auth/password-reset/confirm # Confirm OTP & reset
```

### 9.2 Courses & Rosters
```
POST   /api/courses            # Create course shell
POST   /api/courses/:id/roster # Upload Excel roster (self-seeding)
POST   /api/courses/:id/enrollments       # Manual add student
DELETE /api/courses/:id/enrollments/:sid  # Drop student
```

### 9.3 Assessments
```
POST   /api/courses/:id/assessments       # Create assessment
GET    /api/courses/:id/assessments       # List assessments
PUT    /api/courses/:id/assessments/:aid  # Update (if schema unlocked)
```

### 9.4 Marks & Grading
```
GET    /api/courses/:id/marks            # Smart Grid data
PUT    /api/marks/:id                     # Update mark (DRAFT)
POST   /api/assessments/:id/publish       # Publish assessment
PUT    /api/assessments/:id/publish-all   # Publish all
GET    /api/courses/:id/carry-totals      # Aggregated carry scores
```

### 9.5 Queries
```
POST   /api/marks/:id/queries             # Student raises query
PUT    /api/queries/:id                    # Lecturer response
PUT    /api/queries/:id/resolve            # Mark as resolved
```

### 9.6 Admin & Export
```
POST   /api/admin/accounts               # Create/manage accounts
POST   /api/export/csv                    # Generate CSV export
POST   /api/backup/create                 # Database backup
POST   /api/backup/restore                # Database restore
```

### 9.7 Analytics & Dashboards
```
GET    /api/hod/metrics                   # HOD dashboard metrics
GET    /api/hod/alerts                    # Alert summary
GET    /api/ai/anomalies                  # Anomaly detection results
```

---

## 10. Functional Requirements by Role

### 10.1 Student Requirements
- [x] Login with OTP password recovery
- [x] View published marks by assessment
- [x] See real-time carry total
- [x] Submit mark queries with reasons
- [x] Track query resolution status
- [x] Download transcript

### 10.2 Lecturer Requirements
- [x] Login with role-based access
- [x] Create and configure assessments
- [x] Enter and edit marks inline (Smart Grid)
- [x] Flag marks for review
- [x] Mark DELAYED status with reasons
- [x] Publish marks (per assessment or bulk)
- [x] Respond to student queries
- [x] Export roster/marks to Excel
- [x] View audit trail for their course

### 10.3 Coordinator Requirements
- [x] Login with role-based access
- [x] Create course shells (code, section, year, semester)
- [x] Upload Excel rosters for self-seeding
- [x] Assign lecturers to courses
- [x] Track credit hour loads
- [x] Add/drop students manually
- [x] View enrollment reports
- [x] Manage assessment schemas (no override once locked)

### 10.4 HOD Requirements
- [x] Login with read-only access
- [x] View aggregated departmental metrics
- [x] Monitor failure rates by course/year
- [x] Track overdue DELAYED grades
- [x] View student query threads
- [x] Generate and download final export
- [x] Approve export readiness
- [x] Access system audit trail

### 10.5 Admin Requirements
- [x] Account management (create, disable, reset)
- [x] Role assignment & credential management
- [x] Database backup/restore interface
- [x] Locked assessment schema override (logged)
- [x] View system-wide audit logs
- [x] Email service configuration
- [x] System health monitoring

---

## 11. Non-Functional Requirements

### 11.1 Performance
- Smart Grid renders 500+ students with virtual scrolling
- Mark update response time < 200ms
- Email dispatch batch processing for 1000+ students
- Database queries indexed for sub-second response
- CSV export < 5 seconds for 500 records

### 11.2 Reliability
- Optimistic concurrency control on marks (HTTP 409 handling)
- Immutable audit logs for compliance
- Database transaction integrity for roster seeding
- Email retry logic for failed dispatches
- Graceful handling of missing assessment weights

### 11.3 Security
- JWT tokens with 24hr expiry
- Password hashing (bcrypt or argon2)
- Row-level security (RLS) at database
- HTTPS enforcement
- CORS configuration
- Rate limiting on login endpoint
- SQL injection prevention (parameterized queries)
- XSS protection (output encoding)
- CSRF tokens on state-changing requests

### 11.4 Scalability
- Stateless backend (horizontal scaling)
- Database connection pooling
- Caching layer for frequently accessed data (marks, courses)
- CDN for static assets
- Load balancer for multi-instance deployment

### 11.5 Usability
- Responsive design (desktop, tablet, mobile)
- Keyboard navigation & accessibility (WCAG 2.1)
- Intuitive role-specific dashboards
- Inline validation with error messages
- Toast notifications for system feedback
- Undo/redo for mark entry (optional)

### 11.6 Compliance & Audit
- Every mark change logged with timestamp, user, before/after values
- Export audit trail for regulatory inspection
- Date retention policies (configurable)
- Access logging for sensitive operations
- Anonymization support for GDPR

---

## 12. Integration Checklist

### 12.1 Phase Integration (Weeks 9-10)
- [ ] End-to-end flows tested across all sprints
- [ ] API contract validation
- [ ] Database integrity checks
- [ ] Email delivery verification
- [ ] Performance baseline tests
- [ ] Security penetration testing (basic)
- [ ] UAT test scripts prepared

### 12.2 Final Deliverables
- [ ] API Reference Documentation
- [ ] System Architecture Diagram (updated)
- [ ] Database Schema (ER diagram)
- [ ] Deployment Guide (Docker Compose config)
- [ ] User Manual (per role)
- [ ] Troubleshooting Guide
- [ ] Code Quality Report (linting, coverage)

---

## 13. Risk & Mitigation

| Risk | Impact | Likelihood | Mitigation |
|------|--------|-----------|-----------|
| Excel parsing errors | Roster seeding failures | Medium | Robust error handling, dry-run preview |
| Concurrent mark edits | Data inconsistency | Medium | Optimistic locking with HTTP 409 |
| Email delivery failure | Silent notification losses | Low | Retry logic, admin notification |
| Scope creep | Timeline slippage | High | Strict sprint acceptance, change control |
| Performance degradation | Grid lag with large cohorts | Medium | Virtual scrolling, indexed queries |
| Database migration issues | Data loss on upgrade | Low | Backup before migration, rollback plan |

---

## 14. Success Criteria

### 14.1 Sprint Success
- ✓ All acceptance criteria met per sprint
- ✓ Deployable artifact created (Docker image)
- ✓ Zero critical bugs in production tests
- ✓ Code review approval from team lead
- ✓ Documentation updated

### 14.2 Overall Project Success
- ✓ All 4 sprints completed on schedule
- ✓ UAT sign-off from stakeholders
- ✓ Zero critical security vulnerabilities
- ✓ Performance SLAs met (mark entry < 200ms)
- ✓ 100% feature coverage per specification
- ✓ Comprehensive documentation & user guides
- ✓ Deployment to production environment

---

## 15. File Manifest

All project documentation is organized as follows:

```
CMMS/
├── CMMS_PROJECT_MASTER.md (this file - comprehensive overview)
├── CMMS_Specification_v2.txt (detailed requirements)
├── CMMS_Specification_v2.docx (original Word document)
├── project_spec_roadmap.txt (sprint timeline from PDF)
├── cmms_sprint_breakdown_v2.html (interactive sprint view)
├── project_roadmap_visual.png (color-coded timeline)
├── download.png (detailed dark-themed roadmap)
├── README_FILES.md (file conversion summary)
└── .vscode/ (editor configuration)
```

---

## 16. Quick Reference

### Key Technologies
- **Frontend**: React, Next.js, TanStack/AG Grid, TypeScript
- **Backend**: Python, FastAPI, Pydantic, SQLAlchemy
- **Database**: PostgreSQL 14+, PostGIS (optional), Row-Level Security
- **Email**: Resend or Mailgun API
- **AI/ML**: NumPy, SciPy (Z-score anomaly detection)
- **DevOps**: Docker, Docker Compose, Nginx

### Critical Path
```
Sprint 1 (Auth + Base UI)
    ↓
Sprint 2 (Course Setup)
    ↓
Sprint 3 (Smart Grid + Grading)
    ↓
Sprint 4 (HOD Dashboard + Export + AI)
    ↓
Integration Phase (UAT, Fixes, Docs)
    ↓
PRODUCTION LAUNCH
```

### Contact & Support
- **Project Lead**: Khobait Uddin Simran (A23MJ3006)
- **Institution**: Universiti Teknologi Malaysia (UTM)
- **Course**: SCSJ 3104 – Application Development

---

**Document Generated**: 13 April 2026  
**Status**: Active Development  
**Next Milestone**: Sprint 1 Completion (17 April 2026)

---

*End of CMMS Project Master Document*
