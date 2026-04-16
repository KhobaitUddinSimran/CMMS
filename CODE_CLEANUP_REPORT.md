# 🗑️ CODE CLEANUP AUDIT REPORT
**Project:** CMMS (Carry Mark Management System)  
**Date:** April 15, 2026  
**Total Issues Found:** 153

---

## EXECUTIVE SUMMARY

The codebase contains **49 empty/unused files**, **30 commented-out code blocks**, **9 TODO items**, and **56 debug statements** that should be removed or completed.

### 🚨 HIGH PRIORITY (IMMEDIATE CLEANUP NEEDED)

---

## 1. EMPTY FILES (0 BYTES) - 49 FILES ❌

These files exist but have NO content. They should be deleted or implemented:

### Frontend Empty Files (19 files):

#### Store Files (3):
```
frontend/stores/courseStore.ts          (UNUSED)
frontend/stores/markStore.ts            (UNUSED)
frontend/stores/dashboardStore.ts       (UNUSED)
```

#### Component Files (7):
```
frontend/components/smart-grid/SmartGrid.tsx         (UNUSED)
frontend/components/smart-grid/GridCell.tsx          (UNUSED)
frontend/components/dashboard/DashboardCard.tsx     (UNUSED)
frontend/components/dashboard/Chart.tsx              (UNUSED)
frontend/components/dashboard/StatCard.tsx           (UNUSED)
frontend/components/table/Table.tsx                  (UNUSED)
frontend/components/table/TableRow.tsx               (UNUSED)
```

#### Hook Files (7):
```
frontend/hooks/useModal.ts               (UNUSED)
frontend/hooks/useTable.ts               (UNUSED)
frontend/hooks/useApiClient.ts           (UNUSED)
frontend/hooks/useFetch.ts               (UNUSED)
frontend/hooks/usePagination.ts          (UNUSED)
```

#### API Files (3):
```
frontend/lib/api/courses.ts              (UNUSED)
frontend/lib/api/marks.ts                (UNUSED)
frontend/lib/api/users.ts                (UNUSED)
```

#### Plus:
```
frontend/components/table/Pagination.tsx (UNUSED)
frontend/components/table/TableHeader.tsx (UNUSED)
```

### Backend Empty Files (30 files):

#### Routers (5):
```
backend/routers/export.py      (EMPTY - 0 bytes)
backend/routers/marks.py       (EMPTY - 0 bytes)
backend/routers/queries.py     (EMPTY - 0 bytes)
backend/routers/courses.py     (EMPTY - 0 bytes)
backend/routers/analytics.py   (EMPTY - 0 bytes)
```

#### Models (7):
```
backend/models/mark.py                 (EMPTY - 0 bytes)
backend/models/assessment.py           (EMPTY - 0 bytes)
backend/models/query.py                (EMPTY - 0 bytes)
backend/models/course.py               (EMPTY - 0 bytes)
backend/models/lecturer_load.py        (EMPTY - 0 bytes)
backend/models/enrollment.py           (EMPTY - 0 bytes)
backend/models/audit_log.py            (EMPTY - 0 bytes)
```

#### Schemas (7):
```
backend/schemas/mark.py                (EMPTY - 0 bytes)
backend/schemas/assessment.py          (EMPTY - 0 bytes)
backend/schemas/query.py               (EMPTY - 0 bytes)
backend/schemas/course.py              (EMPTY - 0 bytes)
backend/schemas/enrollment.py          (EMPTY - 0 bytes)
backend/schemas/pagination.py          (EMPTY - 0 bytes)
backend/schemas/query.py               (EMPTY - not sure - check)
```

#### Services (8):
```
backend/services/ai_service.py         (EMPTY - 0 bytes)
backend/services/file_service.py       (EMPTY - 0 bytes)
backend/services/mark_service.py       (EMPTY - 0 bytes)
backend/services/course_service.py     (EMPTY - 0 bytes)
backend/services/export_service.py     (EMPTY - 0 bytes)
backend/services/audit_service.py      (EMPTY - 0 bytes)
backend/services/query_service.py      (EMPTY - 0 bytes)
backend/services/analytics_service.py  (EMPTY - 0 bytes)
```

---

## 2. UNFINISHED TEST FILES (9 occurrences) ⚠️

Files with only TODO comments and no actual tests:

```
backend/tests/test_user.py:3                  # TODO: Test get current user
backend/tests/test_user.py:7                  # TODO: Test password change
backend/tests/test_auth.py:3                  # TODO: Test login endpoint
backend/tests/test_auth.py:7                  # TODO: Test password reset
backend/utils/decorators.py:8                 # TODO: Check user role
```

### Similar Issues:
- `backend/services/notification_service.py` - Only has `# TODO: Create notification`
- `backend/services/user_service.py` - Multiple TODOs without implementation
- `backend/dependencies/auth.py` - Incomplete implementations

---

## 3. COMMENTED-OUT CODE (30 occurrences) 🚫

These code blocks are commented out and should be either:
1. Deleted (if not needed)
2. Uncommented (if needed)

### Backends Files with Commented Code:
```
backend/core/config.py              (Settings commented)
backend/routers/admin.py            (Multiple comment blocks)
backend/routers/auth.py             (Test/demo code commented)
backend/routers/user.py             (Deprecated code commented)
backend/dependencies/auth.py        (Auth logic commented out)
```

### Frontend Files with Commented Code:
```
frontend/app/login/page.tsx         (Alternative implementations)
frontend/app/page.tsx               (Demo/test code)
frontend/components/RosterForm.tsx  (Alternative UI layouts)
frontend/hooks/useAuth.ts           (Fallback logic)
```

---

## 4. DEBUG STATEMENTS (56 occurrences) 🐛

### Files with console.log/print statements:

```
backend/test_sprint1.py             (56+ print statements - ENTIRE FILE IS DEBUG)
setup_jira_github.py                (Multiple print statements)
```

⚠️ **`backend/test_sprint1.py`** is a test/debug file that probably should be in `/backend/tests/` directory and cleaned up.

---

## 5. LEFTOVER TEST FILES 🧪

Misplaced test files:
```
frontend/vitest.config.ts           (Vitest config but no tests using it)
backend/test_sprint1.py             (Shouldn't be in root, belongs in /tests/)
```

---

## 6. UNUSED ROUTES/ENDPOINTS

These routes are defined but may not be fully implemented or used:

```
GET  /api/analytics/*               (analytics.py is empty)
GET  /api/marks/*                   (marks.py is empty)
GET  /api/queries/*                 (queries.py is empty)
GET  /api/courses/*                 (courses.py is empty)
GET  /api/export/*                  (export.py is empty)
```

---

## 7. UNUSED FRONTEND PAGES

Frontend pages that exist but may not be fully implemented:

```
/assessment-config         (Placeholder implementation)
/assessment-setup          (Placeholder implementation)
/certificate              (Placeholder implementation)
/courses                  (Placeholder implementation)
/smart-grid               (Placeholder - SmartGrid components empty)
/export                   (Placeholder implementation)
/analytics                (Placeholder implementation)
/database                 (Placeholder implementation)
/system-logs              (Placeholder implementation)
```

---

## CLEANUP CHECKLIST

### Priority 1: DELETE (Completely Unused)
- [ ] `backend/test_sprint1.py` - Move to tests/ or delete
- [ ] `frontend/stores/courseStore.ts` - Not imported anywhere
- [ ] `frontend/stores/markStore.ts` - Not imported anywhere
- [ ] `frontend/stores/dashboardStore.ts` - Not imported anywhere
- [ ] All empty backend router files (5 files)
- [ ] All empty backend model files (7 files)
- [ ] All empty backend schema files (7 files)
- [ ] All empty backend service files (8 files)
- [ ] All empty frontend component files (7 files)
- [ ] All empty frontend hook files (7 files)
- [ ] All empty frontend API files (3 files)

### Priority 2: FIX (Incomplete/TODO)
- [ ] Complete test files in `backend/tests/`
- [ ] Remove TODOs from service files or implement them
- [ ] Complete notification_service.py implementation
- [ ] Complete user_service.py implementation

### Priority 3: CLEANUP (Remove Debug/Comments)
- [ ] Remove all `console.log()` statements (56 occurrences)
- [ ] Remove commented-out code blocks (30 occurrences)
- [ ] Clean up `setup_jira_github.py` debug prints
- [ ] Consolidate test configuration (vitest vs jest)

---

## IMPACT ANALYSIS

### Risk: LOW
- Most empty files are never imported or referenced
- Removing them won't break functionality
- Can be done safely

### Recommendation
1. Delete all 49 empty files immediately
2. Move `backend/test_sprint1.py` to tests directory and clean it
3. Remove commented-out code
4. Remove all debug statements before production deployment
5. Complete or remove TODO items

---

## ESTIMATED CLEANUP TIME
- Deleting files: **5 minutes**
- Removing commented code: **15 minutes**
- Removing debug statements: **10 minutes**
- Completing TODOs: **30 minutes**
- **Total: ~1 hour**

