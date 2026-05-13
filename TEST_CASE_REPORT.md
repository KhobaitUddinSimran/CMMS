# CMMS Test Case Report
**Project:** Carry Mark Management System (CMMS)  
**Generated:** 10 May 2026  
**Contributors:** Tanjim Shadman Saad (A23MJ4008), Khobait Uddin Simran (A23MJ3006)  
**Lecturer:** Madam Mazliza Aini Binti Abdul Majid  
**Institution:** Universiti Teknologi Malaysia (UTM)  
**Section:** 16

---

## Executive Summary

This document provides a comprehensive test case report for the CMMS project covering 65 test cases distributed across 11 functional test suites. The test cases are organized by priority level and functional domain, ensuring complete coverage of authentication, course management, enrollment, assessment, grading, and reporting functionalities.

**Total Test Cases:** 65  
**Test Suites:** 11  
**High Priority:** 44  
**Medium Priority:** 15  
**Low Priority:** 6

---

## Test Suite Overview

| Suite # | Test Suite Name | Test Cases | High | Medium | Low |
|---------|-----------------|-----------|------|--------|-----|
| 1 | Authentication & Session Management | 7 | 6 | 1 | 0 |
| 2 | User Registration & Approval Workflow | 6 | 5 | 1 | 0 |
| 3 | Course Management | 8 | 6 | 1 | 1 |
| 4 | Enrollment & Roster Management | 5 | 3 | 2 | 0 |
| 5 | Assessment Configuration | 6 | 5 | 1 | 0 |
| 6 | Mark Entry & Grade Calculation | 8 | 6 | 2 | 0 |
| 7 | Student Queries & Appeals | 4 | 2 | 2 | 0 |
| 8 | Semester Timeline Management | 4 | 2 | 1 | 1 |
| 9 | Messaging & Notifications | 6 | 2 | 3 | 1 |
| 10 | Audit Logs & Reporting | 5 | 3 | 2 | 0 |
| 11 | Dashboard & Role-Based Access Control | 6 | 4 | 2 | 0 |
| **TOTAL** | | **65** | **44** | **18** | **3** |

---

## Test Suite 1: Authentication & Session Management (7 Tests)

### Overview
Validates user login, logout, and session management across all role types (Student, Lecturer, Coordinator, HOD, Admin).

| ID | Test Case | Priority | Status |
|----|-----------|----------|--------|
| TC01 | Student Login with Valid Credentials | High | Pending |
| TC02 | Lecturer Login with Valid Credentials | High | Pending |
| TC03 | Coordinator Login with Valid Credentials | High | Pending |
| TC04 | HOD Login with Valid Credentials | High | Pending |
| TC05 | Admin Login with Valid Credentials | High | Pending |
| TC06 | Login with Invalid Credentials | High | Pending |
| TC07 | Logout Functionality | Medium | Pending |

### Key Test Objectives
- Verify JWT token generation and storage (localStorage + secure cookie)
- Validate role-based dashboard redirection
- Test session persistence and cleanup
- Verify Zustand authStore state management

---

## Test Suite 2: User Registration & Approval Workflow (6 Tests)

### Overview
Tests user registration flows, OTP verification, and approval workflows for different user roles.

| ID | Test Case | Priority | Status |
|----|-----------|----------|--------|
| TC08 | Student Self-Registration | High | Pending |
| TC09 | Lecturer Self-Registration (Staff Domain) | High | Pending |
| TC10 | Admin/Coordinator/HOD Self-Registration Blocked | High | Pending |
| TC11 | OTP Verification Required | High | Pending |
| TC12 | Admin Approves Pending Lecturer | High | Pending |
| TC13 | Admin Rejects Pending User | Medium | Pending |

### Key Test Objectives
- Verify email domain validation (@graduate.utm.my for students, @utm.my for lecturers)
- Test OTP generation, delivery, and verification
- Validate approval/rejection workflow with audit trails
- Ensure privileged roles (admin, coordinator, hod) cannot self-register

---

## Test Suite 3: Course Management (8 Tests)

### Overview
Validates course creation, editing, archival, deletion, and lecturer assignment with workload cap enforcement.

| ID | Test Case | Priority | Status |
|----|-----------|----------|--------|
| TC14 | Create a New Course | High | Pending |
| TC15 | Edit Existing Course | High | Pending |
| TC16 | Archive Course with Academic Records | High | Pending |
| TC17 | Delete Course Without Academic Records | Medium | Pending |
| TC18 | Assign Lecturer to Course | High | Pending |
| TC19 | Enforce 9-Credit Workload Cap | High | Pending |
| TC20 | HOD Override for Workload Cap | Medium | Pending |
| TC21 | Bulk Import from Curriculum Library | High | Pending |

### Key Test Objectives
- Verify lecturer_id remains nullable on course creation
- Test soft archival (no hard delete with academic records)
- Validate 9-credit per-semester workload limit
- Test HOD override capability with audit logging

---

## Test Suite 4: Enrollment & Roster Management (5 Tests)

### Overview
Tests student roster management, bulk import, invitation token generation, and enrollment tracking.

| ID | Test Case | Priority | Status |
|----|-----------|----------|--------|
| TC22 | Upload Student Roster via Excel | High | Pending |
| TC23 | Invitation Token Generation for New Students | High | Pending |
| TC24 | Student Accepts Invitation | High | Pending |
| TC25 | Manual Single Student Enrollment | Medium | Pending |
| TC26 | Drop Student from Course | Medium | Pending |

### Key Test Objectives
- Verify cryptographically secure invitation token generation
- Test 14-day token expiration
- Validate enrollment status transitions (pending → accepted)
- Ensure audit logging of roster operations

---

## Test Suite 5: Assessment Configuration (6 Tests)

### Overview
Tests assessment component creation, schema locking, and integrity preservation through mark entry lifecycle.

| ID | Test Case | Priority | Status |
|----|-----------|----------|--------|
| TC27 | Create Assessment Components | High | Pending |
| TC28 | Update Assessment Before Marks Exist | High | Pending |
| TC29 | Block Assessment Update When Marks Exist | High | Pending |
| TC30 | Lock Assessment Schema (100% Weight Check) | High | Pending |
| TC31 | Delete Assessment with No Marks | Medium | Pending |
| TC32 | Block Delete Assessment with Marks | High | Pending |

### Key Test Objectives
- Verify assessment weights sum to 100% before locking
- Test immutability of assessments once marks are entered
- Validate cascading constraints (cannot delete assessment with marks)
- Ensure audit logging of schema changes

---

## Test Suite 6: Mark Entry & Grade Calculation (8 Tests)

### Overview
Tests mark entry, normalization, publication, and GPA calculation according to UTM regulations.

| ID | Test Case | Priority | Status |
|----|-----------|----------|--------|
| TC33 | Lecturer Enters Raw Marks | High | Pending |
| TC34 | Normalised Score Auto-Calculation | High | Pending |
| TC35 | Publish Marks for an Assessment | High | Pending |
| TC36 | Block Publish Past Grade Submission Deadline | High | Pending |
| TC37 | Unpublish Marks (Coordinator/Admin Only) | High | Pending |
| TC38 | Flag a Mark for Review | Medium | Pending |
| TC39 | Student Views Own Grade & GPA | High | Pending |
| TC40 | At-Risk Student Detection | Medium | Pending |

### Key Test Objectives
- Verify normalised_score = (raw_score / max_score) × 100
- Test deadline enforcement from semester_timelines
- Validate role-based unpublish permissions
- Test at-risk detection (total < 50 or multiple flagged marks)

---

## Test Suite 7: Student Queries & Appeals (4 Tests)

### Overview
Tests student mark query workflow, lecturer responses, and resolution tracking.

| ID | Test Case | Priority | Status |
|----|-----------|----------|--------|
| TC41 | Student Raises a Query on a Mark | High | Pending |
| TC42 | Lecturer Responds to Query | High | Pending |
| TC43 | Query Resolution and Closure | Medium | Pending |
| TC44 | Query on Unpublished Mark Blocked | Medium | Pending |

### Key Test Objectives
- Verify students can only query published marks
- Test threading and notification triggers
- Validate timestamp recording of responses
- Ensure audit logging of query activity

---

## Test Suite 8: Semester Timeline Management (4 Tests)

### Overview
Tests academic calendar timeline creation, deadline enforcement, and editing.

| ID | Test Case | Priority | Status |
|----|-----------|----------|--------|
| TC45 | Create Semester Timeline | High | Pending |
| TC46 | Grade Submission Deadline Enforcement | High | Pending |
| TC47 | Edit Active Timeline | Medium | Pending |
| TC48 | Delete Past Timeline | Low | Pending |

### Key Test Objectives
- Verify UNIQUE constraint on (academic_year, semester) pairs
- Test deadline derivation for active semester
- Validate coordinator ability to extend deadlines
- Ensure timeline is immutable reference for enrollments

---

## Test Suite 9: Messaging & Notifications (6 Tests)

### Overview
Tests internal messaging system, threading, rate limiting, and notification badges.

| ID | Test Case | Priority | Status |
|----|-----------|----------|--------|
| TC49 | Send Message to Single Recipient | High | Pending |
| TC50 | Message Threading (Reply to Parent) | Medium | Pending |
| TC51 | Role-Based Messaging Restrictions | High | Pending |
| TC52 | Rate Limiting on Message Send | Medium | Pending |
| TC53 | Mark Message as Read | Medium | Pending |
| TC54 | Unread Message Badge Count | Low | Pending |

### Key Test Objectives
- Verify role-based recipient filtering (students cannot message HOD directly)
- Test parent_message_id threading mechanism
- Validate rate limiting (60 messages/hour default)
- Test optimistic UI updates for badge counts

---

## Test Suite 10: Audit Logs & Reporting (5 Tests)

### Overview
Tests audit trail completeness, reporting capabilities, and analytics generation.

| ID | Test Case | Priority | Status |
|----|-----------|----------|--------|
| TC55 | Audit Log Captures Course Creation | High | Pending |
| TC56 | Audit Log Captures Mark Publish | High | Pending |
| TC57 | Audit Log Captures Login Events | Medium | Pending |
| TC58 | HOD Views Department Analytics | Medium | Pending |
| TC59 | Coordinator Generates Grade Report | High | Pending |

### Key Test Objectives
- Verify audit_logs captures action, entity_type, user_id, ip_address, user_agent
- Test old_values and new_values JSONB storage
- Validate report generation (CSV/JSON/DOCX formats)
- Ensure KPI calculations (average GPA, workload distribution)

---

## Test Suite 11: Dashboard & Role-Based Access Control (6 Tests)

### Overview
Tests role-based dashboard routing and sidebar navigation visibility.

| ID | Test Case | Priority | Status |
|----|-----------|----------|--------|
| TC60 | Role-Based Dashboard Redirect | High | Pending |
| TC61 | Student Sidebar Navigation | Medium | Pending |
| TC62 | Lecturer Sidebar Navigation | Medium | Pending |
| TC63 | Coordinator Sidebar Navigation | Medium | Pending |
| TC64 | HOD Sidebar Navigation | Medium | Pending |
| TC65 | Admin Sidebar Navigation | Medium | Pending |

### Key Test Objectives
- Verify correct route redirection post-login
- Test visibility/hiding of menu items per role
- Validate highest-privilege role routing (if user has multiple roles)
- Ensure UI elements reflect authorization levels

---

## Test Execution Strategy

### Phase 1: Core Functionality (Week 1)
- Test Suites 1-2: Authentication & Registration
- Test Suites 3-4: Course & Enrollment Management
- **Critical Path:** User creation → Course setup → Student enrollment

### Phase 2: Grading Pipeline (Week 2)
- Test Suites 5-6: Assessment & Mark Entry
- Test Suite 8: Timeline Management
- **Critical Path:** Assessment config → Mark entry → Publication

### Phase 3: Advanced Features (Week 3)
- Test Suite 7: Student Queries
- Test Suite 9: Messaging
- Test Suite 10: Audit & Reporting
- Test Suite 11: Dashboard & RBAC

### Phase 4: End-to-End & Regression (Week 4)
- Cross-suite integration tests
- Performance & load testing
- Security penetration testing
- User acceptance testing (UAT)

---

## Test Environment Requirements

| Component | Requirement | Details |
|-----------|-------------|---------|
| **Frontend** | Next.js 13+ | Zustand for state, Tailwind CSS |
| **Backend** | FastAPI | Python 3.10+, async support |
| **Database** | Supabase/PostgreSQL | RLS policies, audit triggers |
| **Authentication** | Supabase Auth + JWT | SameSite=Strict cookies |
| **Email** | SMTP/OTP Service | SendGrid or similar |
| **Test Data** | Mock Faculty Data | UTM institution baseline |

---

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|-----------|
| Deadline enforcement bugs | High | Comprehensive TC36, TC46 testing |
| Mark recalculation errors | High | Unit + integration tests for TC34 |
| RLS policy failures | High | Security audit TC51 messaging |
| Performance degradation | Medium | Load test with 1000+ students |
| Audit trail gaps | Medium | Verify all DML operations logged |

---

## Success Criteria

- [x] All 65 test cases documented
- [ ] 90%+ test case pass rate required for production release
- [ ] 100% audit trail coverage (all DML operations logged)
- [ ] Zero P1 bugs on 10 May 2026 deadline
- [ ] UAT sign-off from MJIIT stakeholders
- [ ] Performance baseline: <2s response time for 95th percentile

---

## Sign-Off

| Role | Name | Date | Status |
|------|------|------|--------|
| Test Lead | Khobait Uddin Simran | 10 May 2026 | Pending |
| QA Lead | Tanjim Shadman Saad | 10 May 2026 | Pending |
| Lecturer | Madam Mazliza Aini | 10 May 2026 | Pending |

