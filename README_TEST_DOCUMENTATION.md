# CMMS Test Documentation Package
**Carry Mark Management System - Complete Test Suite & Management Framework**

**Date Generated:** 10 May 2026  
**Contributors:** Khobait Uddin Simran (A23MJ3006), Tanjim Shadman Saad (A23MJ4008)  
**Institution:** Universiti Teknologi Malaysia (UTM), Section 16  
**Lecturer:** Madam Mazliza Aini Binti Abdul Majid

---

## 📋 Document Overview

This package contains comprehensive test documentation for the Carry Mark Management System (CMMS), converted from the PDF test case specification into structured, actionable formats. All documentation is organized, searchable, and ready for implementation with test management platforms.

### Package Contents

| Document | File | Purpose | Audience |
|----------|------|---------|----------|
| **Test Case Report** | `TEST_CASE_REPORT.md` | Executive summary of all 65 test cases across 11 suites | Stakeholders, QA |
| **Test Basis** | `TEST_BASIS.md` | Comprehensive testing foundation, requirements, and methodology | QA, Developers |
| **Test Execution Plan** | `TEST_EXECUTION_PLAN.md` | Detailed timeline, resource allocation, quality gates | Test Lead, PM |
| **Test Cases Inventory** | `TEST_CASES_INVENTORY.csv` | Structured test case data (importable to TestRail/Qase) | QA Tools |
| **TestRail Config** | `testrail_config.json` | Pre-configured TestRail project structure | Test Management |
| **This File** | `README.md` | Navigation and setup guide | All Team Members |

---

## 📊 Test Coverage Summary

**Total Test Cases:** 65  
**Test Suites:** 11  
**Priority Breakdown:** 44 High | 18 Medium | 3 Low

### Test Suites

1. ✅ **Authentication & Session Management** (7 tests) - User login, logout, session handling
2. ✅ **User Registration & Approval Workflow** (6 tests) - Signup, OTP, approval process
3. ✅ **Course Management** (8 tests) - Course CRUD, lecturer assignment, workload cap
4. ✅ **Enrollment & Roster Management** (5 tests) - Student enrollment, bulk roster upload
5. ✅ **Assessment Configuration** (6 tests) - Assessment creation, locking, weight validation
6. ✅ **Mark Entry & Grade Calculation** (8 tests) - Mark entry, publication, GPA calculation
7. ✅ **Student Queries & Appeals** (4 tests) - Mark queries, resolution workflow
8. ✅ **Semester Timeline Management** (4 tests) - Academic calendar, deadline enforcement
9. ✅ **Messaging & Notifications** (6 tests) - Internal messaging, threading, rate limiting
10. ✅ **Audit Logs & Reporting** (5 tests) - Audit trails, analytics, grade reports
11. ✅ **Dashboard & Role-Based Access Control** (6 tests) - Role-based routing, sidebar nav

---

## 🚀 Quick Start Guide

### For QA/Test Leads

**Step 1: Review Test Basis** (2 hours)
```bash
# Read the foundational document
cat TEST_BASIS.md | head -100

# Sections to focus on:
# - Section 3: Functional Specifications
# - Section 6: Test Design Principles
# - Section 8: Test Execution Framework
```

**Step 2: Import Test Cases into TestRail** (1 hour)
```bash
# Convert CSV to TestRail format using testrail_config.json
# Use TEST_CASES_INVENTORY.csv as data source
# Or use testrail_config.json for bulk project setup

# TestRail API import:
curl -X POST https://testrail.utm.my/api/v2/projects \
  -H "Content-Type: application/json" \
  -d @testrail_config.json
```

**Step 3: Review Execution Plan** (1 hour)
```bash
# Review timeline and resource allocation
cat TEST_EXECUTION_PLAN.md | grep -A 50 "Phase 1"
```

**Step 4: Execute Tests** (Follow TEST_EXECUTION_PLAN.md timeline)

### For Developers

**Step 1: Understand Test Requirements**
```bash
# Read relevant test cases for your module
grep -A 5 "TC01:" TEST_CASE_REPORT.md  # Auth
grep -A 5 "TC14:" TEST_CASE_REPORT.md  # Courses
grep -A 5 "TC33:" TEST_CASE_REPORT.md  # Marks
```

**Step 2: Review Business Rules**
```bash
# Check TEST_BASIS.md Section 3.3 for constraints
# Map requirements to your code
```

**Step 3: Set Up Testing Framework**
```bash
# Create pytest fixtures for test data
# Implement audit logging triggers
# Configure RLS policies
```

### For Project Managers

**Step 1: Review Success Criteria**
```bash
grep -A 20 "Release Ready" TEST_EXECUTION_PLAN.md
```

**Step 2: Set Up Reporting Dashboard**
- Use TEST_EXECUTION_PLAN.md daily/weekly report templates
- Connect TestRail to JIRA for defect tracking
- Configure email notifications for status updates

---

## 🔧 Setting Up Test Management Tools

### Option 1: TestRail (Recommended)

**Installation:**
```bash
# Prerequisites: TestRail account & API token

# Import project configuration
curl -X POST https://testrail.utm.my/api/v2/projects \
  -H "Authorization: Bearer YOUR_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d @testrail_config.json

# Import test cases from CSV
# 1. Navigate to TestRail > Import Test Cases
# 2. Upload TEST_CASES_INVENTORY.csv
# 3. Map columns: Test ID → ID, Title → Title, etc.
# 4. Review and confirm import
```

**Configuration:**
- Project: CMMS (ID: 1)
- Test Suites: 11 (as per config)
- Custom Fields: Module, Automation Status
- Users: Khobait, Tanjim, Madam Mazliza

**First Test Run:**
```bash
# Create new test run
# Select all 65 test cases
# Assign to Khobait (Phase 1) & Tanjim (Phase 2)
# Set milestone: Phase 1 Complete (12 May 2026)
```

### Option 2: Qase.io (Cloud-Based)

**Setup:**
1. Go to https://app.qase.io
2. Create new project: CMMS
3. Import TEST_CASES_INVENTORY.csv via bulk import
4. Configure test runs per phase
5. Set up integrations: GitHub, Slack, Jira

### Option 3: Open Source - OpenTest

**Installation:**
```bash
docker run -d -p 8080:8080 opentest/opentest:latest

# Access: http://localhost:8080
# Import test cases via UI
```

---

## 📈 Key Metrics & KPIs

### Test Execution Metrics
```
Target Metrics (Release Criteria):
├─ Test Pass Rate:           ≥95% (≤3 failures acceptable)
├─ Requirements Coverage:    100% (all 65 cases executed)
├─ Code Coverage:            ≥80%
├─ P1 Defects:              0 (all fixed & verified)
├─ P2 Defects:              ≤5 (with documented workarounds)
├─ Performance (95th %ile):  <2 seconds
└─ Security Scan:           0 critical vulnerabilities
```

### Quality Gates
- [ ] Phase 1 (28 tests): ≥90% pass → Proceed to Phase 2
- [ ] Phase 2 (18 tests): ≥90% pass → Proceed to Phase 3
- [ ] Phase 3 (15 tests): ≥90% pass → Proceed to Phase 4
- [ ] Phase 4 (65 tests): ≥95% pass → **PRODUCTION READY**

---

## 📝 Document Navigation

### Quick Access by Document

**TEST_CASE_REPORT.md** - Read First
- Executive summary of all test cases
- Test suite overview tables
- Test execution strategy (4-week plan)
- Risk assessment & sign-off section

**TEST_BASIS.md** - Read Second (Reference)
- Business requirements (Section 2)
- Functional specifications (Section 3)
- Critical business rules (Section 3.3)
- Test approach & methodology (Section 5)
- Quality metrics (Section 8)

**TEST_EXECUTION_PLAN.md** - Use Daily
- Detailed timeline (Section 1)
- Test execution roles (Section 2)
- Test data setup (Section 3)
- Defect management (Section 5)
- Daily/weekly reporting templates (Section 7)

**TEST_CASES_INVENTORY.csv** - Import to Tools
- 65 rows of structured test case data
- Direct import to TestRail/Qase/Excel
- Columns: Test_ID, Suite, Title, Priority, Status, etc.

**testrail_config.json** - Configuration
- Pre-built TestRail project structure
- 11 test suites defined
- 4 milestones configured
- Custom fields and priorities set

---

## 🔄 Test Lifecycle

### Pre-Testing Phase (9-10 May)
```
1. Review all documentation
2. Set up test environment
3. Configure test management tool
4. Prepare test data
5. Brief test team
→ SUCCESS CRITERIA: All tools ready, test data loaded
```

### Testing Phases (10-18 May)
```
Phase 1: Core (TC01-26)       → Authentication, Courses, Enrollment
Phase 2: Grading (TC27-48)    → Assessment, Marks, Timeline
Phase 3: Advanced (TC49-59)   → Queries, Messaging, Audit
→ SUCCESS CRITERIA: ≥90% pass rate each phase
```

### Validation Phase (18-24 May)
```
Regression Testing    → 20 critical tests re-executed
Performance Testing   → 95th percentile < 2s
Security Scanning     → 0 critical vulnerabilities
UAT & Stakeholder     → MJIIT sign-off
→ SUCCESS CRITERIA: ≥95% overall pass, UAT approved
```

### Post-Testing
```
Final Report Generation
Lessons Learned Documentation
Test Artifacts Archive
Handoff to Operations
```

---

## 🐛 Defect Management

### How to Log a Defect

**Using JIRA Template:**
```
Project: CMMS-TEST
Type: Bug
Summary: [Test Suite] [Brief description]
Severity: [P1-P4]
Found in TC: TC-XXX
Steps to Reproduce:
  1. [Step]
  2. [Step]
  3. [Step]
Expected Result: [What should happen]
Actual Result: [What actually happened]
Environment: [Staging]
Attachments: [Screenshot/logs]
```

### Defect Triage Schedule
- **Daily @ 4:00 PM:** Triage meeting (15 min)
- **Participants:** QA Lead, Dev Lead, Test Lead
- **Decisions:** Assign fixes, prioritize retests

---

## 📞 Team Contacts

| Role | Name | Email | Phone |
|------|------|-------|-------|
| Test Lead | Khobait Uddin Simran | khobait@mjiit.utm.my | +60-3-89250403 |
| QA Lead | Tanjim Shadman Saad | tanjim@mjiit.utm.my | +60-3-89250403 |
| Lecturer/Supervisor | Madam Mazliza Aini | mazliza@utm.my | +60-3-89250403 |
| Backend Lead | [TBD] | [TBD] | [TBD] |
| DevOps/Infra | [TBD] | [TBD] | [TBD] |

---

## 📚 Related Documentation

### External References
- [CMMS Project Specification](./documents/CMMS_Specification_v2.txt)
- [API Documentation](./documents/README.md)
- [Database Schema](./supabase/migrations/)
- [Authentication Flow](./docs/THREE_STEP_SIGNUP_FLOW.md)

### Internal Documents
- [OTP System Implementation](./docs/OTP_SYSTEM.md)
- [Supabase Setup Guide](./documents/SUPABASE_COMPLETE_SETUP.md)
- [Architecture Overview](./documents/CMMS_MONOREPO_STRUCTURE.md)

---

## ✅ Checklist: Before Starting Testing

- [ ] All 4 documents reviewed
- [ ] Test environment verified operational
- [ ] Test management tool configured
- [ ] Test data loaded in database
- [ ] Team briefed on plan
- [ ] Contact list shared
- [ ] Daily standup scheduled (9:15 AM)
- [ ] Defect triage scheduled (4:00 PM)
- [ ] Status reporting template prepared
- [ ] Git repository access verified

---

## 🎯 Success Criteria Summary

### Phase 1 (End of 12 May)
- 28/28 tests executed
- ≥90% pass rate
- 0 P1 defects

### Phase 2 (End of 18 May)
- 18/18 tests executed
- ≥90% pass rate
- All P1 defects fixed

### Phase 3 (End of 18 May)
- 15/15 tests executed
- ≥90% pass rate
- Audit logs verified

### Final (End of 24 May)
- 65/65 tests executed
- ≥95% pass rate
- 0 P1, ≤5 P2 defects
- **UAT APPROVED** ✅

---

## 📧 Getting Help

**Questions about Test Cases?**
- Email: khobait@mjiit.utm.my
- Refer to: TEST_CASE_REPORT.md + TEST_BASIS.md

**Questions about Execution Timeline?**
- Email: khobait@mjiit.utm.my
- Refer to: TEST_EXECUTION_PLAN.md

**Questions about Test Setup?**
- Email: tanjim@mjiit.utm.my
- Refer to: README.md + Setup Section

**Urgent Issues During Testing?**
- Slack: #cmms-testing (if available)
- Phone: [Contact Test Lead]
- Escalate: [Contact QA Lead]

---

## 📄 Document Version Control

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 10 May 2026 | Khobait & Tanjim | Initial creation from PDF |
| 1.1 | [TBD] | [TBD] | Post-Phase 1 updates |
| 1.2 | [TBD] | [TBD] | Final testing report |

---

## License & Attribution

**Project:** Carry Mark Management System (CMMS)  
**Institution:** Universiti Teknologi Malaysia (MJIIT)  
**Created:** 10 May 2026  
**For:** Academic Assessment & Grading Management

---

**Last Updated:** 10 May 2026  
**Status:** ✅ READY FOR TESTING  
**Approval:** Pending stakeholder review

---

## Quick Links

- [Test Case Report](./TEST_CASE_REPORT.md)
- [Test Basis](./TEST_BASIS.md)
- [Execution Plan](./TEST_EXECUTION_PLAN.md)
- [Test Inventory (CSV)](./TEST_CASES_INVENTORY.csv)
- [TestRail Config](./testrail_config.json)

---

**🎉 Ready to begin testing! Contact Test Lead with questions.**

