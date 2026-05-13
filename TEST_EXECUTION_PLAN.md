# Test Execution Plan
## Carry Mark Management System (CMMS)

**Document Date:** 10 May 2026  
**Project:** Carry Mark Management System (CMMS)  
**Contributors:** Khobait Uddin Simran (A23MJ3006), Tanjim Shadman Saad (A23MJ4008)  
**Test Lead:** Khobait Uddin Simran  
**QA Lead:** Tanjim Shadman Saad  
**Environment:** Staging (Supabase)  
**Target Release Date:** 15 May 2026

---

## 1. Test Execution Timeline

### Overall Schedule
```
Week 1 (10-12 May):   Phase 1 - Core Functionality (TC01-TC13, TC14-TC21, TC22-TC26)
Week 2 (13-17 May):   Phase 2 - Grading Pipeline (TC27-TC36, TC45-TC48)
Week 3 (18-20 May):   Phase 3 - Advanced Features (TC37-TC44, TC49-TC59)
Week 4 (21-24 May):   Phase 4 - Integration & UAT (Full regression)
```

### Detailed Schedule

#### Phase 1: Core Functionality (Monday 10 May - Wednesday 12 May)

**Day 1 (Monday, 10 May) - Smoke Testing & Authentication**
- Time: 9:00 AM - 5:00 PM
- Test Cases: TC01-TC07 (7 cases, 2h)
- Focus: Authentication across all roles
- Tester: Khobait Uddin Simran
- Success Criteria: 100% pass rate for login flows

| Time | Test Suite | Cases | Tester | Status |
|------|-----------|-------|--------|--------|
| 09:00-11:00 | Auth & Session (Smoke) | TC01-TC07 | Khobait | Pending |
| 11:00-12:00 | Build verification, issues triage | - | Both | Pending |
| 13:00-17:00 | Initial bug fixes & retesting | - | Dev + QA | Pending |

**Day 2 (Tuesday, 11 May) - Registration & Approval Workflow**
- Test Cases: TC08-TC13 (6 cases, 1.5h)
- Focus: User registration, OTP, approval workflow
- Tester: Tanjim Shadman Saad

| Time | Test Suite | Cases | Tester | Status |
|------|-----------|-------|--------|--------|
| 09:00-10:30 | Registration & Approval | TC08-TC13 | Tanjim | Pending |
| 10:30-12:00 | Defect logging & impact analysis | - | Both | Pending |
| 13:00-15:00 | Course Management (PT1) | TC14-TC17 | Khobait | Pending |
| 15:00-17:00 | Course Assignment & Workload | TC18-TC21 | Tanjim | Pending |

**Day 3 (Wednesday, 12 May) - Enrollment & Roster**
- Test Cases: TC22-TC26 (5 cases, 1.5h)
- Focus: Bulk roster upload, invitation tokens
- Testers: Both

| Time | Test Suite | Cases | Tester | Status |
|------|-----------|-------|--------|--------|
| 09:00-10:30 | Enrollment & Roster | TC22-TC26 | Khobait | Pending |
| 10:30-12:00 | Test results consolidation | - | Both | Pending |
| 13:00-15:00 | Defect verification & fixes | - | Dev + QA | Pending |
| 15:00-17:00 | Phase 1 readiness review | - | Both | Pending |

**Phase 1 Success Criteria:**
- [ ] 28 test cases executed
- [ ] ≥90% pass rate (≤3 failures acceptable)
- [ ] Zero P1 defects blocking
- [ ] Test data verified in database
- [ ] Audit logs intact

---

#### Phase 2: Grading Pipeline (Thursday 13 May - Friday 17 May)

**Day 1 (Thursday, 13 May) - Assessment Configuration**
- Test Cases: TC27-TC32 (6 cases, 1.5h)
- Focus: Assessment creation, locking, weight validation
- Tester: Tanjim Shadman Saad

| Time | Test Suite | Cases | Tester | Status |
|------|-----------|-------|--------|--------|
| 09:00-10:30 | Assessment Config | TC27-TC32 | Tanjim | Pending |
| 10:30-12:00 | Edge case testing | - | Khobait | Pending |
| 13:00-15:00 | Test data review | - | Both | Pending |

**Day 2 (Friday, 14 May) - Mark Entry & Publication**
- Test Cases: TC33-TC40 (8 cases, 2h)
- Focus: Mark entry, normalization, publication, at-risk detection
- Testers: Both

| Time | Test Suite | Cases | Tester | Status |
|------|-----------|-------|--------|--------|
| 09:00-11:00 | Mark Entry & Calculation | TC33-TC36 | Khobait | Pending |
| 11:00-12:30 | Mark Flags & At-Risk | TC37-TC40 | Tanjim | Pending |
| 13:30-15:00 | Integration testing (Cross-suite) | TC14+TC27+TC33 | Both | Pending |
| 15:00-17:00 | Defect triage & validation | - | Dev + QA | Pending |

**Phase 2 Continuation (Monday 15 May)**
- Test Cases: TC45-TC48 (4 cases, 1h)
- Focus: Semester timeline management
- Tester: Khobait Uddin Simran

---

#### Phase 3: Advanced Features (Tuesday 16 May - Thursday 18 May)

**Day 1 (Tuesday, 16 May) - Student Queries**
- Test Cases: TC41-TC44 (4 cases, 1h)
- Focus: Query creation, resolution, blocked queries
- Tester: Tanjim Shadman Saad

**Day 2 (Wednesday, 17 May) - Messaging & Notifications**
- Test Cases: TC49-TC54 (6 cases, 1.5h)
- Focus: Message threading, rate limiting, read tracking
- Testers: Both

**Day 3 (Thursday, 18 May) - Audit & Reporting**
- Test Cases: TC55-TC59 (5 cases, 1.5h)
- Focus: Audit logs, analytics, grade reports
- Tester: Khobait Uddin Simran

---

#### Phase 4: Dashboard & RBAC (Friday 19 May)

**Test Cases: TC60-TC65 (6 cases, 1.5h)**
- Focus: Role-based dashboard routing, sidebar navigation
- Testers: Both

---

#### Phase 5: Regression & UAT (Week of 20-24 May)

**Regression Testing (Monday 20 - Wednesday 22 May)**
- Re-run sample of 20 critical tests from each suite
- Focus: No new regressions introduced
- Estimated Time: 8 hours

**UAT & Stakeholder Sign-Off (Thursday 23 - Friday 24 May)**
- MJIIT faculty walkthrough
- End-user acceptance testing
- Final bug fixes
- Production deployment readiness

---

## 2. Test Execution Roles & Responsibilities

### Primary Test Team

**Khobait Uddin Simran (Test Lead - 40 hours/week)**
- Overall test planning and coordination
- TC01-TC26, TC45-TC48, TC55, TC59-TC65 execution
- Defect triage and prioritization
- Status reporting to stakeholders

**Tanjim Shadman Saad (QA Lead - 40 hours/week)**
- QA strategy and automation setup
- TC08-TC13, TC27-TC44, TC49-TC54 execution
- Test data management
- Regression testing coordination

**Developer (20 hours/week)**
- Unit testing and code review
- Bug reproduction and fixing
- Database schema verification
- Test environment troubleshooting

---

## 3. Test Data Setup

### Data Preparation (Timeline: 9-10 May)

**User Accounts:**
```
Student Accounts:
  - student1@graduate.utm.my (Test course enrollment)
  - student2@graduate.utm.my (Query testing)
  - student3@graduate.utm.my (At-risk detection)
  - [Bulk: 50 students for roster upload TC22]

Lecturer Accounts:
  - lecturer1@utm.my (Standard lecturer)
  - lecturer2@utm.my (Workload cap testing)
  - lecturer3@utm.my (Query response testing)

Coordinator Accounts:
  - coordinator1@utm.my

HOD Account:
  - hod1@utm.my

Admin Accounts:
  - admin@utm.my (System admin)
```

**Course Data:**
```
Courses for Testing:
  - KKK212: Chemical Engineering (3 credits) - Semester 1
  - KKK313: Process Design (4 credits) - Semester 1
  - KKK401: Capstone Project (2 credits) - Semester 2
  - [Bulk: 50 courses for curriculum import TC21]

Assessment Data:
  - Midterm Exam (30% weight)
  - Quiz (20% weight)
  - Assignment (20% weight)
  - Final Exam (30% weight)
```

**Enrollment Data:**
```
Enrollment Records:
  - 100 students × 3 courses = 300 enrollments
  - Various status transitions (pending → accepted → enrolled)
```

**Database Reset Script:**
```sql
-- Run before each test phase to ensure clean state
DELETE FROM messages;
DELETE FROM course_queries;
DELETE FROM marks;
DELETE FROM audit_logs;
DELETE FROM assessments;
DELETE FROM enrollments;
DELETE FROM courses WHERE created_at > NOW() - INTERVAL '1 day';
DELETE FROM users WHERE email LIKE '%@test%' AND created_at > NOW() - INTERVAL '1 day';
COMMIT;
```

---

## 4. Test Execution Environment

### Staging Environment Configuration

**Frontend:**
- URL: https://cmms-staging.utm.my
- Node Version: 18.16.0
- Next.js: 13.4.12
- Build Command: `npm run build`
- Deployment: Vercel

**Backend:**
- URL: https://api-staging.utm.my
- Python: 3.10.12
- FastAPI: 0.100.0
- Database: Supabase Staging (cmms_staging_db)
- Deployment: Docker on AWS ECS

**Database:**
- PostgreSQL 14
- Supabase Project: cmms-staging
- RLS Policies: Enabled
- Audit Triggers: Enabled
- Backup: Daily snapshots

**Test Tools:**
- Test Case Management: TestRail (testrail.utm.my)
- Automation: Cypress 12.x (frontend), pytest (backend)
- Performance: Apache JMeter
- Bug Tracking: JIRA (cmms-testing project)

### Environment Verification Checklist

- [ ] Frontend accessible at https://cmms-staging.utm.my
- [ ] Backend APIs responsive (< 1s latency)
- [ ] Database connectivity verified
- [ ] Test user accounts created
- [ ] Test data loaded
- [ ] Email service (OTP) functional
- [ ] Audit logging enabled
- [ ] RLS policies active
- [ ] Git repository access available
- [ ] CI/CD pipeline active

---

## 5. Defect Management & Escalation

### Defect Severity Levels

| Level | Impact | TTR (Target) | Example |
|-------|--------|------|---------|
| **P1 (Critical)** | System down, data loss, security | ≤ 24h | Authentication bypass, mark calculation error |
| **P2 (High)** | Major feature broken, cannot workaround | ≤ 48h | Deadline enforcement fails, workload cap bypass |
| **P3 (Medium)** | Feature partially broken, workaround exists | ≤ 1 week | UI rendering bug, message delay |
| **P4 (Low)** | Minor issue, cosmetic or documentation | ≤ 2 weeks | Badge count off-by-one, typo |

### Defect Logging Process

**Immediate (During Test Execution):**
1. Pause test case execution
2. Log defect in JIRA with:
   - Title: Concise description
   - Severity: P1-P4
   - Environment: Staging
   - Steps to Reproduce: 1-2-3 format
   - Expected vs. Actual
   - Screenshots/logs
   - Environment details (browser, OS, etc.)

**Daily (End of Day):**
- Triage meeting: 4:00 PM - 4:30 PM
- Review new defects with dev team
- Prioritize fixes
- Assign developers
- Update status in JIRA

### Escalation Path
```
Developer Fix Attempt
        ↓ (8 hours max)
Issue Reproducible?
    ├─ Yes: Create defect, add to backlog
    └─ No: Mark as "Cannot Reproduce"
        ↓
    Is P1 or P2?
    ├─ Yes: Emergency fix required
    │   └─ Escalate to tech lead
    └─ No: Schedule for next sprint
```

### Defect Retry Testing

After developer fixes defect:
1. QA re-executes failed test case
2. Verifies fix in staging
3. Runs related regression tests
4. Updates test result in TestRail
5. Closes defect in JIRA (if passed)

---

## 6. Quality Gates & Exit Criteria

### Phase Exit Criteria

**Phase 1 Complete:** (End of Day 12 May)
- [ ] 28/28 test cases executed
- [ ] ≥90% pass rate
- [ ] Zero P1 defects
- [ ] ≤3 P2 defects (all documented)
- [ ] Test database verified
- [ ] Test data cleanup completed

**Phase 2 Complete:** (End of Day 18 May)
- [ ] 18/18 test cases executed (27-44)
- [ ] ≥90% pass rate
- [ ] All P1 defects fixed and verified
- [ ] Cross-suite integration tested
- [ ] Performance benchmarks met

**Phase 3 Complete:** (End of Day 18 May)
- [ ] 15/15 test cases executed (41-59)
- [ ] ≥90% pass rate
- [ ] Audit logs verified complete
- [ ] Report generation validated

**Phase 4 Complete:** (End of Day 24 May)
- [ ] All 65 test cases executed minimum 1x
- [ ] ≥95% overall pass rate
- [ ] Zero P1 defects open
- [ ] ≤5 P2 defects (all with workarounds documented)
- [ ] Regression suite (20 tests) all pass
- [ ] Performance testing baseline established
- [ ] Security scan passed (0 critical vulns)
- [ ] UAT sign-off from MJIIT stakeholders obtained

### Release Readiness Checklist
```
Test Execution:
  [ ] 100% test cases executed
  [ ] ≥95% pass rate
  [ ] All high-priority defects resolved
  
Code Quality:
  [ ] Code coverage ≥80%
  [ ] All automated tests passing
  [ ] No lint violations
  [ ] Security scan clean
  
Documentation:
  [ ] Test report completed
  [ ] Known issues documented
  [ ] User guides reviewed
  [ ] API documentation current
  
Deployment:
  [ ] Release notes prepared
  [ ] Database migrations verified
  [ ] Rollback plan in place
  [ ] Monitoring alerts configured
  [ ] Stakeholder sign-off obtained
```

---

## 7. Reporting & Communication

### Daily Status Report

**Format:** Email to stakeholders @ 5:00 PM daily

```
CMMS Testing - Daily Status
Date: [Day], [Date]

Summary:
- Tests Executed Today: XX
- Passed: XX (XX%)
- Failed: XX
- Blocked: XX

Critical Issues:
- [P1] Issue description → Assigned to [Dev]
- [P2] Issue description → Status: In progress

Metrics:
- Cumulative Pass Rate: XX%
- Total Defects: XX (P1: X, P2: X, P3: X, P4: X)
- On Schedule: Yes/No

Next Steps:
- Tomorrow's focus: [Test suites]
- Blockers: [If any]

Test Lead: [Name]
```

### Weekly Status Report

**Format:** Presentation + JIRA dashboard @ Friday 3:00 PM

```
Week of: [Date Range]

Metrics Summary:
  Tests Planned:    65
  Tests Executed:   XX
  Pass Rate:        XX%
  Defects Found:    XX
  
By Priority:
  P1 (Critical):    X (Target: 0)
  P2 (High):        X (Target: ≤5)
  P3 (Medium):      X
  P4 (Low):         X
  
Progress vs. Plan:
  Phase 1: XX% complete
  Phase 2: XX% complete
  Phase 3: XX% complete
  
Risk Assessment:
  Status: Green/Yellow/Red
  Risks: [List top 3]
  Mitigations: [In progress/planned]
  
Upcoming Week:
  Focus areas: [Suites]
  Dependencies: [Items needed]
```

### Test Summary Report (Final - 24 May)

**Executive Summary:**
- Project overview
- Test scope coverage
- Overall pass/fail statistics
- Risk assessment
- Recommendations

**Detailed Results:**
- Per-suite results
- Defect summary
- Performance metrics
- Security assessment

**Appendices:**
- Test case matrix
- Defect register
- Performance baseline
- Lessons learned

---

## 8. Risk Management

### Known Risks & Mitigation

| Risk | Probability | Impact | Mitigation | Owner |
|------|---|---|---|---|
| Test environment downtime | Low | High | Daily backup, redundant DB | DevOps |
| Incomplete requirements | Medium | High | Weekly requirements sync | QA Lead |
| Third-party service failure (Supabase, email) | Low | Medium | Staging with fallback data | Backend |
| Resource unavailability | Low | Medium | Cross-training documentation | Test Lead |
| Test automation delays | Medium | Medium | Prioritize critical paths | QA Lead |
| Scope creep / new requirements | Medium | High | Change control board | PM |

### Contingency Plans

**If test environment crashes:**
1. Restore from daily backup (5 min)
2. Verify test data integrity (10 min)
3. Resume testing from last checkpoint

**If key tester unavailable:**
1. Activate cross-training documentation
2. Other tester assumes backlog
3. Reschedule non-critical tests

**If P1 defect found near deadline:**
1. Immediate escalation to tech lead
2. Hotfix development (24h max)
3. Regression testing of critical paths
4. Decision: ship vs. delay

---

## 9. Approvals & Sign-Off

### Test Plan Approval

| Role | Name | Status | Date | Signature |
|------|------|--------|------|-----------|
| Test Lead | Khobait Uddin Simran | Pending | 10 May 2026 | _________ |
| QA Lead | Tanjim Shadman Saad | Pending | 10 May 2026 | _________ |
| Project Manager | [TBD] | Pending | [TBD] | _________ |
| Technical Lead | [TBD] | Pending | [TBD] | _________ |
| Product Owner | [TBD] | Pending | [TBD] | _________ |

### Execution Sign-Off (Post-Testing)

| Milestone | Completion Date | Pass/Fail | Comments |
|-----------|---|---|---|
| Phase 1 Complete | 12 May 2026 | Pending | - |
| Phase 2 Complete | 18 May 2026 | Pending | - |
| Phase 3 Complete | 18 May 2026 | Pending | - |
| Phase 4 Complete | 24 May 2026 | Pending | - |
| UAT Complete | 24 May 2026 | Pending | - |
| Release Ready | 24 May 2026 | Pending | - |

---

## Appendix: Test Execution Checklist

### Pre-Test Execution (By 9 AM Daily)

- [ ] Environment health check (frontend, backend, DB)
- [ ] Test data verification
- [ ] Test tools functionality (TestRail, JIRA, browser)
- [ ] Team ready & briefed
- [ ] Test cases reviewed & prioritized

### During Test Execution

- [ ] Log all test results in real-time
- [ ] Screenshot failures immediately
- [ ] Log defects with full details
- [ ] Communicate blockers within 30 min
- [ ] Hourly status updates to Test Lead

### Post-Test Execution (Daily @ 4:30 PM)

- [ ] Test results consolidated in TestRail
- [ ] Defect triage meeting completed
- [ ] Daily status report sent
- [ ] Test data backed up
- [ ] Environment state verified for next day

---

**Document Status:** Ready for Approval  
**Last Updated:** 10 May 2026  
**Next Review:** Upon completion of Phase 1 (12 May 2026)

