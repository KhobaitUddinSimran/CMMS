# Test Basis Documentation
## Carry Mark Management System (CMMS)

**Project:** Carry Mark Management System  
**Version:** 1.0  
**Date:** 10 May 2026  
**Prepared By:** Tanjim Shadman Saad (A23MJ4008), Khobait Uddin Simran (A23MJ3006)  
**Organization:** Universiti Teknologi Malaysia (UTM), Section 16  
**Lecturer:** Madam Mazliza Aini Binti Abdul Majid

---

## 1. Introduction

### 1.1 Purpose
This Test Basis document defines the foundation, scope, and approach for testing the Carry Mark Management System (CMMS). It establishes the testing framework based on project specifications, requirements, and stakeholder expectations. This document serves as the reference for test planning, design, and execution.

### 1.2 Scope
The CMMS is a comprehensive academic mark management platform designed for Universiti Teknologi Malaysia (UTM) with the following primary users:
- **Students**: View marks, submit queries, manage profiles
- **Lecturers**: Enter marks, respond to queries, manage assessments
- **Coordinators**: Manage courses, rosters, timelines, reporting
- **HOD**: Department-level analytics, override permissions
- **Admin**: System configuration, user management, approvals

### 1.3 Document Structure
1. Requirements Overview
2. Functional Specifications Summary
3. Test Scope & Exclusions
4. Test Approach & Methodology
5. Test Design Principles
6. Test Execution Framework
7. Quality Metrics & Success Criteria

---

## 2. Requirements Overview

### 2.1 Business Requirements

#### 2.1.1 Functional Areas
The CMMS must support:

**Authentication & Authorization**
- Multi-role authentication with JWT-based session management
- Email domain validation for role-based registration
- OTP verification for email confirmation
- Role-based access control (RBAC) with fine-grained permissions

**Course Management**
- Flexible course creation with optional lecturer assignment
- 9-credit per-semester workload cap for lecturers
- HOD override capability for workload exceptions
- Bulk import from institutional curriculum library
- Soft archival for courses with historical data

**Student Enrollment**
- Bulk roster upload via Excel
- Cryptographically secure invitation tokens (14-day expiration)
- Soft enrollment status tracking
- Manual single-student enrollment

**Assessment & Grading**
- Multi-component assessment configuration with weight validation
- Assessment schema locking (100% weight validation)
- Raw mark entry with automatic normalization
- Deadline-driven publication workflow
- Elevated-role unpublishing with audit trails

**Grade Calculation & Display**
- Weighted percentage calculation based on assessment weights
- Letter grade mapping per UTM regulations
- GPA calculation per UTM standards
- At-risk student flagging (< 50% or multiple flagged marks)

**Student Queries & Appeals**
- Thread-based query system for published marks only
- Lecturer response tracking with timestamps
- Query resolution status management

**Semester Timeline Management**
- Configurable academic calendars per semester
- Grade submission deadline enforcement
- Deadline extension by coordinators
- UNIQUE constraint on (academic_year, semester)

**Internal Messaging**
- Point-to-point messaging with threading (parent_message_id)
- Role-based recipient filtering
- Rate limiting (default: 60 messages/hour)
- Read status tracking with badge notifications

**Audit & Compliance**
- Immutable audit logs for all mutations
- Capture of user ID, IP address, user agent, timestamp
- JSON storage of old/new values for delta tracking
- Action classification (CREATE, UPDATE, DELETE, PUBLISH, LOGIN, etc.)

**Reporting & Analytics**
- Departmental analytics dashboard for HOD
- Grade report export (CSV/JSON/DOCX)
- At-risk student identification and tracking
- Flagged marks review interface

#### 2.1.2 Non-Functional Requirements

**Security**
- JWT tokens stored in secure SameSite=Strict cookies
- Role-level Row-Level Security (RLS) policies in Supabase
- No default/weak preset passwords
- Password hashing with modern algorithms

**Performance**
- API response time target: < 2 seconds (95th percentile)
- Support for 1000+ concurrent users
- Bulk operations (roster upload) must complete within 5 seconds

**Availability**
- 99.5% uptime SLA (planned maintenance excluded)
- Graceful error handling and user feedback
- Transaction rollback on constraint violations

**Maintainability**
- Complete audit trail for all academic data mutations
- Version tracking for schema changes
- Clear error messages for constraint violations

**Scalability**
- Database query optimization for large student cohorts
- Asynchronous background jobs for bulk operations
- Caching strategy for frequently accessed data

### 2.2 Stakeholder Requirements

| Stakeholder | Primary Needs | Key Concerns |
|-------------|---------------|--------------|
| **Students** | Easy mark viewing, fair query mechanism | Data privacy, grade accuracy |
| **Lecturers** | Efficient mark entry, workload management | Assessment flexibility, deadline enforcement |
| **Coordinators** | Course oversight, roster management | Data integrity, audit trails |
| **HOD** | Department analytics, academic oversight | Budget forecasting, performance metrics |
| **Admin** | System stability, user provisioning | Security, compliance, backup |
| **MJIIT** | Academic excellence, institutional compliance | Legal audit compliance, data retention |

---

## 3. Functional Specifications Summary

### 3.1 Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    CMMS Architecture                     │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  ┌──────────┐              ┌──────────────┐             │
│  │ Frontend │◄─────────────►│  FastAPI BE  │             │
│  │(Next.js) │              │  (Python)    │             │
│  └──────────┘              └──────┬───────┘             │
│       ▲                            │                      │
│       │ Zustand                    │ SQLAlchemy           │
│       │ Auth Store                 │                      │
│       └────────────────────┬───────▼──────┐              │
│                            │              │              │
│                      ┌─────▼──┐     ┌─────▼──┐          │
│                      │Supabase│     │ Audit  │          │
│                      │ Auth   │     │ Logs   │          │
│                      └────────┘     └────────┘          │
│                            │                             │
│                      ┌─────▼──────────┐                 │
│                      │  PostgreSQL DB │                 │
│                      │  + RLS Policies│                 │
│                      └────────────────┘                 │
│                                                           │
└─────────────────────────────────────────────────────────┘
```

### 3.2 Key Entities & Relationships

**Core Tables:**
- `users`: Role (student, lecturer, coordinator, hod, admin), approval_status
- `courses`: Code, credits, semester, academic_year, lecturer_id
- `enrollments`: student_id, course_id, semester, status
- `assessments`: name, type, max_score, weight_percentage, is_locked
- `marks`: student_id, assessment_id, raw_score, normalised_score, status (draft/published)
- `semester_timelines`: academic_year, semester, grade_submission_deadline
- `course_queries`: student_id, mark_id, query_text, lecturer_response, resolved_at
- `messages`: sender_id, recipient_id, parent_message_id, subject, body, is_read
- `audit_logs`: user_id, action, entity_type, entity_id, old_values, new_values, ip_address

### 3.3 Critical Constraints & Business Rules

| Rule ID | Rule | Enforcement | Test Cases |
|---------|------|-------------|-----------|
| BR-001 | Student domain restricted to @graduate.utm.my | DB constraint + API validation | TC08 |
| BR-002 | Lecturer domain restricted to @utm.my | DB constraint + API validation | TC09 |
| BR-003 | Only student/lecturer roles can self-register | API logic + DB check | TC10 |
| BR-004 | Lecturer workload ≤ 9 credits per semester | Application logic | TC19 |
| BR-005 | Assessment weights must sum to 100% before lock | Application validation | TC30 |
| BR-006 | No update to assessment after marks entered | DB trigger + API check | TC29 |
| BR-007 | Cannot query unpublished marks | API validation | TC44 |
| BR-008 | Cannot publish marks past deadline | API validation + session helper | TC36, TC46 |
| BR-009 | Grade submission deadline from active timeline | Session derivation | TC46 |
| BR-010 | All DML operations audit logged | DB trigger + application logic | TC55-57 |
| BR-011 | Only coordinator/admin can unpublish marks | Role-based authorization | TC37 |
| BR-012 | Soft archival for courses with academic records | Application logic + hard delete constraint | TC16 |

---

## 4. Test Scope & Exclusions

### 4.1 In Scope

✅ **Functional Testing:**
- All 11 test suites (65 test cases total)
- CRUD operations on all entities
- Workflow transitions and state machines
- Business rule enforcement

✅ **Integration Testing:**
- Frontend ↔ Backend API integration
- Backend ↔ Database integration
- Third-party services (Supabase Auth, SMTP/OTP)
- Cross-module dependencies

✅ **Security Testing:**
- JWT validation and expiration
- RLS policy enforcement
- Role-based access control
- SQL injection prevention
- XSS protection
- CSRF token validation

✅ **Performance Testing:**
- API response times (target: < 2s for 95th percentile)
- Database query optimization
- Bulk operations (roster upload with 500+ students)
- Concurrent user load (1000 simultaneous)

✅ **Usability Testing:**
- Dashboard navigation per role
- Form validation and error messaging
- Mobile responsiveness
- Accessibility (WCAG 2.1 AA)

✅ **Regression Testing:**
- All TC suite combinations
- Edge cases and boundary conditions
- Backwards compatibility

### 4.2 Out of Scope

❌ **Not Tested:**
- Network infrastructure (firewalls, DNS, CDN)
- Cloud provider SLA compliance (Supabase uptime)
- Third-party email service reliability
- Hardware-level security
- Browser-specific rendering (only core functionality)
- Legacy system migration
- Disaster recovery & business continuity procedures
- Load balancing and auto-scaling infrastructure

---

## 5. Test Approach & Methodology

### 5.1 Testing Strategy

**1. Risk-Based Testing**
```
Priority 1 (Critical):
  - Authentication failures → System access denied
  - Mark calculation errors → Academic integrity
  - Deadline enforcement bypass → Grade deadline violations
  - Audit trail gaps → Compliance violations

Priority 2 (High):
  - Course assignment errors → Workload misallocation
  - Enrollment issues → Student enrollment loss
  - Message delivery failures → Communication breakdown

Priority 3 (Medium):
  - UI rendering bugs → User experience degradation
  - Report generation delays → Reporting delays
  - Analytics accuracy → Decision-making impact

Priority 4 (Low):
  - Badge count delays → Visual feedback lag
  - Timeline deletion → Historical cleanup
```

**2. Test Level Strategy**

| Level | Scope | Tools | Entry Criteria | Exit Criteria |
|-------|-------|-------|---|---|
| **Unit** | Individual functions | pytest | Code complete | 80% code coverage |
| **Integration** | Component interactions | pytest-asyncio | Unit tests pass | All APIs functional |
| **System** | End-to-end workflows | Cypress/Playwright | Integration pass | All BRs validated |
| **UAT** | Business acceptance | Manual + TestRail | System pass | Stakeholder approval |

**3. Test Design Techniques**

- **Equivalence Partitioning**: Valid/invalid/boundary email domains, role values
- **Boundary Value Analysis**: Max students (max_students), credit limits (9 credits)
- **State Transition Testing**: Enrollment status, mark publication, query resolution
- **Decision Table Testing**: Role + action → permission matrix
- **Pairwise Testing**: Role × semester × course combinations
- **Error Guessing**: Common validation failures, edge cases

### 5.2 Test Execution Approach

**Phase-Based Execution:**

| Phase | Duration | Focus | Exit Gate |
|-------|----------|-------|-----------|
| Phase 1: Smoke | 2 days | Core paths (TC01, TC14, TC22, TC33) | No blockers |
| Phase 2: Functional | 5 days | All 65 test cases | 90% pass rate |
| Phase 3: Integration | 3 days | Cross-suite workflows | No interface issues |
| Phase 4: Regression | 2 days | Sample re-testing of Phase 2 | No regressions |
| Phase 5: UAT | 3 days | End-user validation | Stakeholder sign-off |

### 5.3 Defect Management

**Severity Levels:**
- **P1 (Critical)**: System down, data loss, security breach → Hotfix required
- **P2 (High)**: Major functionality broken → Fix in current sprint
- **P3 (Medium)**: Feature partially broken → Fix in next sprint
- **P4 (Low)**: Cosmetic/documentation issue → Backlog

**Defect Tracking:**
- Tool: JIRA or GitHub Issues
- Template: ID, Title, Severity, Steps to Reproduce, Expected vs Actual, Logs
- Resolution Time SLA: P1 ≤ 24h, P2 ≤ 48h, P3 ≤ 1 week, P4 ≤ 2 weeks

---

## 6. Test Design Principles

### 6.1 Test Design Standards

**1. Comprehensive Coverage**
- Coverage target: 100% of functional requirements
- Every decision point (if/else) tested for true/false paths
- All error scenarios tested (400, 403, 404, 409, 429, 500)

**2. Traceability**
```
Requirement → Test Case → Test Step → Assertion
Example:
BR-004 (Workload cap) → TC19 → Step 60 → Assert: 409 CONFLICT
```

**3. Independence**
- Each test case independent (no shared state)
- Test data cleanup post-execution
- No dependency between execution order

**4. Clarity & Maintainability**
- Descriptive test case names (What + When + Expected)
- Clear preconditions and expected results
- Reusable test data fixtures

### 6.2 Test Data Management

**Test Data Strategy:**
```
Environment | Dataset | Users | Courses | Records | Purpose |
Dev         | Mini    | 20    | 10      | 500     | Development
Staging     | Full    | 500   | 50      | 50K     | Pre-prod validation
Prod-like   | Mirror  | 1000  | 100     | 100K    | Performance testing
```

**Data Cleanup:**
- Reset database post-test-run
- Archive test results with data snapshot
- Anonymize any production data used in testing

---

## 7. Test Execution Framework

### 7.1 Tools & Technologies

| Component | Tool/Framework | Rationale |
|-----------|---|---|
| **Test Management** | TestRail / Qase.io | Centralized test case & result tracking |
| **Functional Testing** | Cypress / Playwright | Modern, reliable frontend automation |
| **Backend Testing** | pytest + pytest-asyncio | Python async testing, fixture management |
| **Load Testing** | Apache JMeter / k6 | Concurrent user simulation |
| **API Testing** | Postman / REST Assured | HTTP request/response validation |
| **Database Testing** | SQL scripts + DBeaver | Query validation, audit log verification |
| **CI/CD Integration** | GitHub Actions / Jenkins | Automated test execution on commits |
| **Reporting** | Allure / HTML Reports | Rich, visual test execution reports |

### 7.2 Test Automation Strategy

**High Automation Priority (ROI > 3x):**
- TC01-TC07: Authentication flows (often run, low maintenance)
- TC14-TC21: Course management CRUD (stable, high reuse)
- TC27-TC32: Assessment configuration (complex logic)
- TC33-TC36: Mark publication workflow (critical, frequent)
- TC60-TC65: Dashboard navigation (low flakiness)

**Medium Automation Priority (ROI = 1-3x):**
- TC08-TC13: Registration/approval (moderate stability)
- TC22-TC26: Roster management (bulk operations)
- TC38-TC40: Flagging & at-risk detection (data-dependent)

**Low Automation Priority (Manual Only):**
- TC43, TC44: Query resolution (exploratory)
- TC54: Badge count updates (UI-dependent, visual verification)
- TC58: Analytics visualization (human interpretation)

### 7.3 Continuous Testing Pipeline

```
Git Commit
    ↓
┌─ GitHub Actions Trigger ─┐
│                           │
├─→ Unit Tests (pytest)     │ Parallel
├─→ Lint Check (flake8)     │ Execution
├─→ Security Scan (bandit)  │
│                           │
└─────────────→ if all pass │
                ↓
        Integration Tests
        (Cypress on staging)
                ↓
        if all pass
                ↓
        Deploy to staging
                ↓
        Run full test suite
        (65 test cases)
                ↓
        Generate report (Allure)
                ↓
        Notify team
```

---

## 8. Quality Metrics & Success Criteria

### 8.1 Test Coverage Metrics

| Metric | Target | Threshold | Measurement |
|--------|--------|-----------|---|
| Requirements Coverage | 100% | ≥ 95% | # Requirements tested / total |
| Code Coverage | ≥ 80% | ≥ 75% | Coverage tools (Coverage.py) |
| Test Case Coverage | 65/65 | 100% | Test cases executed |
| Decision Coverage | 100% | ≥ 90% | All branches tested |

### 8.2 Quality Gates

**Release Ready Criteria:**

```
✓ 100% test cases executed
✓ ≥ 95% test pass rate (≤ 3 failures acceptable as known issues)
✓ Zero P1 defects
✓ ≤ 5 P2 defects (must document workarounds)
✓ ≥ 90% requirements traceability
✓ ≥ 80% code coverage
✓ Performance: 95th percentile < 2s
✓ Security scan: 0 critical vulnerabilities
✓ Audit trail: 100% mutation logging
✓ UAT sign-off: MJIIT stakeholders approved
```

### 8.3 KPIs & Reporting

**Dashboard Metrics (Updated Daily):**

| KPI | Formula | Target | Current |
|-----|---------|--------|---------|
| Test Pass Rate | Passed / Total | 95% | TBD |
| Defect Density | # Defects / 1000 LOC | ≤ 3 | TBD |
| Defect Escape Rate | Defects found in prod / total | 0% | TBD |
| Requirement Traceability | Traced / Total requirements | 100% | TBD |
| Test Execution Coverage | Tests executed / planned | 100% | TBD |

**Weekly Status Report Template:**
```
Week of: [Date Range]

Metrics:
  Total Tests Planned:    65
  Tests Executed:         XX
  Tests Passed:           XX
  Tests Failed:           XX
  Tests Blocked:          XX
  Pass Rate:              XX%

Defects:
  P1 (Critical):          0
  P2 (High):              0
  P3 (Medium):            0
  Total:                  0

Risks:
  1. [Risk description] → Mitigation: [Plan]
  
Blockers:
  1. [Issue] → Dependent on [Activity]

Next Week Plan:
  - [Test execution focus]
  - [Defect resolution]
  - [Stakeholder reviews]
```

### 8.4 Performance Benchmarks

**API Response Time Targets:**

| Endpoint | Operation | Target | 95th %ile |
|----------|-----------|--------|-----------|
| /auth/login | POST | 500ms | 1s |
| /courses | GET (list) | 200ms | 500ms |
| /assessments | POST (create) | 300ms | 750ms |
| /marks | POST (bulk) | 2s (500 records) | 5s |
| /reports/grades | GET (export) | 3s | 10s |

---

## 9. Roles & Responsibilities

| Role | Responsibility | Workload |
|------|---|---|
| **Test Lead** | Planning, coordination, reporting | 100% |
| **QA Automation Engineer** | Automation framework, CI/CD, script development | 80% |
| **QA Manual Tester** | Manual test execution, UAT support, edge cases | 80% |
| **Developer** | Unit testing, bug fixing, code review | 20% |
| **Product Owner** | Requirements clarity, UAT facilitation | 10% |

---

## 10. Risk & Mitigation Plan

| Risk | Probability | Impact | Mitigation |
|------|-----------|--------|-----------|
| Incomplete requirements | Medium | High | Weekly requirements review meetings |
| Test environment instability | Low | High | Dedicated staging environment refresh daily |
| Scope creep | Medium | Medium | Formal change control process |
| Resource unavailability | Low | High | Cross-training on test automation |
| Third-party service failures (Supabase) | Low | Medium | Staging environment with fallback data |

---

## 11. Approval & Sign-Off

This Test Basis Document has been prepared and is subject to approval by:

| Role | Name | Signature | Date |
|------|------|-----------|------|
| Test Lead | Khobait Uddin Simran | _________________ | 10 May 2026 |
| QA Lead | Tanjim Shadman Saad | _________________ | 10 May 2026 |
| Project Manager | [TBD] | _________________ | [TBD] |
| Lecturer/Supervisor | Madam Mazliza Aini | _________________ | [TBD] |
| Product Owner | [TBD] | _________________ | [TBD] |

---

## 12. Appendices

### 12.1 Test Case Template

```
Test Case ID:    TC-XXX
Title:           [Clear, action-oriented description]
Priority:        [High/Medium/Low]
Module:          [Test Suite Name]

Preconditions:
  • [Setup requirement 1]
  • [Setup requirement 2]

Steps:
  1. [Action]
  2. [Action]
  3. [Assertion]

Expected Result:
  • [System should do X]
  • [Data should show Y]
  • [User should see Z]

Postconditions:
  • [Cleanup action 1]
  • [State after execution]
```

### 12.2 Defect Report Template

```
Defect ID:       DEF-XXX
Title:           [Brief description]
Severity:        [P1/P2/P3/P4]
Found in TC:     [TC-XXX]
Environment:     [Dev/Staging/Prod]

Steps to Reproduce:
  1. ...

Expected Result:
  ...

Actual Result:
  ...

Attachments:
  • [Screenshots/logs]
```

### 12.3 Test Environment Configuration

**Frontend:**
- Node.js 18+
- Next.js 13.4
- Zustand 4.3+
- Tailwind CSS 3.3

**Backend:**
- Python 3.10+
- FastAPI 0.100+
- SQLAlchemy 2.0+
- Supabase Python client

**Database:**
- PostgreSQL 14+
- Supabase (managed PostgreSQL)
- RLS policies enabled

**Testing:**
- pytest 7.2+
- Cypress 12+
- pytest-asyncio 0.20+

---

**Document Version:** 1.0  
**Last Updated:** 10 May 2026  
**Next Review:** [Upon completion of Phase 2 testing]

