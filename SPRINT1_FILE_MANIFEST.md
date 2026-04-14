# SPRINT 1 COMPLETE FILE MANIFEST

**Sprint**: Foundation, Auth & Base UI  
**Duration**: April 9-17, 2026 (2 weeks)  
**Total Files to Create**: ~100 files  
**Total Folders to Create**: ~45 folders  

---

## 📊 SPRINT 1 FILE SUMMARY

| Section | Frontend | Backend | Total |
|---------|----------|---------|-------|
| **App/Core Setup** | 6 | 8 | 14 |
| **Models/Schemas** | — | 8 | 8 |
| **Components/Services** | 40 | 15 | 55 |
| **Routes/Endpoints** | 4 | 6 | 10 |
| **Tests** | 8 | 6 | 14 |
| **Config/Utils** | 12 | 8 | 20 |
| **Total** | **70** | **51** | **~121 files** |

---

## 🎯 FRONTEND FILES TO CREATE (70 files)

### App Directory (6 files)
```
frontend/app/
├── layout.tsx                              [Global layout]
├── page.tsx                                [Home page]
├── globals.css                             [Global styles]
├── error.tsx                               [Error boundary]
├── (auth)/layout.tsx                       [Auth group layout]
└── (dashboard)/layout.tsx                  [Dashboard shell: header + sidebar]
```

### Components (24 component files + 12 CSS modules = 36 files)
```
frontend/components/
├── auth/
│   ├── LoginForm.tsx
│   ├── PasswordChangeForm.tsx
│   ├── ProtectedRoute.tsx
│   └── RoleGuard.tsx
├── layout/
│   ├── Header.tsx
│   ├── Sidebar.tsx
│   ├── Navigation.tsx
│   ├── MainLayout.tsx
│   └── AuthLayout.tsx
├── common/
│   ├── Button.tsx + Button.module.css
│   ├── Input.tsx + Input.module.css
│   ├── Select.tsx + Select.module.css
│   ├── Card.tsx + Card.module.css
│   ├── Alert.tsx + Alert.module.css
│   ├── Modal.tsx + Modal.module.css
│   ├── Badge.tsx + Badge.module.css
│   ├── Spinner.tsx + Spinner.module.css
│   ├── Skeleton.tsx + Skeleton.module.css
│   └── Divider.tsx
├── form/
│   ├── Form.tsx
│   ├── FormField.tsx
│   ├── FormError.tsx
│   ├── FormLabel.tsx
│   └── FormField.module.css
└── notification/
    ├── Toast.tsx
    ├── ToastContainer.tsx
    └── Toast.module.css
```

### Hooks (5 files)
```
frontend/hooks/
├── useAuth.ts
├── useToast.ts
├── useForm.ts
├── useRouter.ts
└── useRole.ts
```

### Stores (3 files)
```
frontend/stores/
├── authStore.ts
├── toastStore.ts
└── userStore.ts
```

### Lib Directory (11 files)
```
frontend/lib/
├── api/
│   ├── client.ts
│   ├── auth.ts
│   └── index.ts
├── auth/
│   ├── jwt.ts
│   ├── tokenStorage.ts
│   ├── authService.ts
│   └── index.ts
├── utils/
│   ├── validation.ts
│   ├── formatting.ts
│   ├── string.ts
│   └── index.ts
└── constants/
    ├── apiEndpoints.ts
    ├── userRoles.ts
    ├── errorMessages.ts
    ├── validationRules.ts
    └── index.ts
```

### Types (5 files)
```
frontend/types/
├── auth.ts
├── user.ts
├── api.ts
├── common.ts
└── index.ts
```

### Styles (5 files)
```
frontend/styles/
├── globals.css
├── variables.css
├── tailwind.css
├── animations.css
└── reset.css
```

### Tests (8 files)
```
frontend/__tests__/
├── components/
│   ├── Button.test.tsx
│   ├── Input.test.tsx
│   └── Modal.test.tsx
├── hooks/
│   ├── useAuth.test.ts
│   ├── useToast.test.ts
│   └── useForm.test.ts
├── stores/
│   └── authStore.test.ts
└── lib/
    ├── auth/
    │   └── jwt.test.ts
    └── utils/
        └── validation.test.ts

frontend/cypress/
├── e2e/auth/
│   ├── login.cy.ts
│   ├── password-change.cy.ts
│   └── logout.cy.ts
├── fixtures/
│   └── users.json
├── support/
│   ├── commands.ts
│   ├── auth.ts
│   └── helpers.ts
└── cypress.config.ts
```

### Configuration (5 files)
```
frontend/
├── next.config.js
├── tsconfig.json
├── tailwind.config.js
├── vitest.config.ts
├── .eslintrc.json
└── package.json
```

---

## 🎯 BACKEND FILES TO CREATE (51 files)

### Core Setup (4 files)
```
backend/core/
├── __init__.py
├── config.py
├── security.py
├── constants.py
└── exceptions.py
```

### Database (3 files)
```
backend/db/
├── __init__.py
├── database.py
├── session.py
└── base.py
```

### Models (2 files - Sprint 1 only)
```
backend/models/
├── __init__.py
├── base_model.py
├── user.py
└── lecturer_load.py
```

### Schemas (5 files)
```
backend/schemas/
├── __init__.py
├── auth.py
├── user.py
├── pagination.py
└── error.py
```

### Routers (3 files)
```
backend/routers/
├── __init__.py
├── auth.py
├── user.py
└── health.py
```

### Services (4 files)
```
backend/services/
├── __init__.py
├── auth_service.py
├── user_service.py
├── email_service.py
└── notification_service.py
```

### Dependencies (3 files)
```
backend/dependencies/
├── __init__.py
├── auth.py
├── database.py
└── validators.py
```

### Middleware (4 files)
```
backend/middleware/
├── __init__.py
├── cors.py
├── error_handler.py
├── logging.py
└── rate_limit.py
```

### Migrations (3 files)
```
backend/migrations/
├── alembic.ini
├── env.py
└── versions/
    └── 001_create_users_table.py
```

### Utils (4 files)
```
backend/utils/
├── __init__.py
├── validators.py
├── email_templates.py
└── decorators.py
```

### Tests (6 files)
```
backend/tests/
├── conftest.py
├── test_auth.py
├── test_user.py
├── fixtures/
│   └── users.py
└── integration/
    └── test_auth_flow.py
```

### Configuration (3 files)
```
backend/
├── main.py
├── pyproject.toml
├── requirements.txt
├── requirements-dev.txt
└── .env.example
```

---

## 📁 FOLDER STRUCTURE CHECKLIST

### Frontend Folders (22 total)
- [ ] frontend/app/(auth)/login
- [ ] frontend/app/(auth)/password-change
- [ ] frontend/app/(dashboard)
- [ ] frontend/app/(dashboard)/(student)
- [ ] frontend/app/(dashboard)/(lecturer)
- [ ] frontend/app/(dashboard)/(coordinator)
- [ ] frontend/app/(dashboard)/(hod)
- [ ] frontend/app/(dashboard)/(admin)
- [ ] frontend/components/auth
- [ ] frontend/components/layout
- [ ] frontend/components/common
- [ ] frontend/components/form
- [ ] frontend/components/notification
- [ ] frontend/components/table (placeholder)
- [ ] frontend/components/dashboard (placeholder)
- [ ] frontend/components/smart-grid (placeholder)
- [ ] frontend/hooks
- [ ] frontend/stores
- [ ] frontend/lib/api
- [ ] frontend/lib/auth
- [ ] frontend/lib/utils
- [ ] frontend/lib/constants
- [ ] frontend/types
- [ ] frontend/styles
- [ ] frontend/__tests__/components
- [ ] frontend/__tests__/hooks
- [ ] frontend/__tests__/stores
- [ ] frontend/__tests__/lib
- [ ] frontend/cypress/e2e/auth
- [ ] frontend/cypress/e2e/dashboard
- [ ] frontend/cypress/fixtures
- [ ] frontend/cypress/support
- [ ] frontend/public/images
- [ ] frontend/public/fonts

### Backend Folders (15 total)
- [ ] backend/core
- [ ] backend/db
- [ ] backend/models
- [ ] backend/schemas
- [ ] backend/routers
- [ ] backend/services
- [ ] backend/dependencies
- [ ] backend/middleware
- [ ] backend/migrations/versions
- [ ] backend/utils
- [ ] backend/prompts
- [ ] backend/tests/fixtures
- [ ] backend/tests/integration

---

## 🚀 FILE CREATION SEQUENCE (By Days)

### DAY 1: Foundation
**Frontend**:
- [ ] next.config.js, tsconfig.json, tailwind.config.js
- [ ] app/layout.tsx, app/globals.css
- [ ] styles/{globals, variables, tailwind, reset, animations}.css
- [ ] types/{auth, user, api, common, index}.ts

**Backend**:
- [ ] main.py, pyproject.toml, requirements.txt
- [ ] core/{config, constants, exceptions, security}.py
- [ ] db/{database, session, base}.py
- [ ] models/{base_model, user}.py

### DAY 2: Authentication
**Frontend**:
- [ ] lib/api/client.ts, lib/api/auth.ts
- [ ] lib/auth/{jwt, tokenStorage, authService}.ts
- [ ] hooks/{useAuth, useForm}.ts
- [ ] stores/{authStore, userStore}.ts

**Backend**:
- [ ] schemas/{auth, user, error, pagination}.py
- [ ] services/{auth_service, user_service}.py
- [ ] routers/{auth, health}.py
- [ ] dependencies/{auth, database}.py

### DAY 3: Components (Part 1)
**Frontend**:
- [ ] components/common/{Button, Input, Spinner} + CSS
- [ ] components/form/{Form, FormField, FormError, FormLabel} + CSS
- [ ] components/auth/{LoginForm, PasswordChangeForm}.tsx
- [ ] lib/utils/{validation, formatting, string}.ts

**Backend**:
- [ ] services/{email_service, notification_service}.py
- [ ] utils/{validators, email_templates, decorators}.py
- [ ] middleware/{cors, error_handler, logging, rate_limit}.py

### DAY 4: Layout & Forms
**Frontend**:
- [ ] components/layout/{Header, Sidebar, Navigation}.tsx
- [ ] components/layout/{MainLayout, AuthLayout}.tsx
- [ ] app/(auth)/login/page.tsx
- [ ] app/(auth)/password-change/page.tsx
- [ ] lib/constants/*.ts

**Backend**:
- [ ] routers/user.py
- [ ] models/lecturer_load.py
- [ ] dependencies/validators.py
- [ ] migrations/{alembic.ini, env.py, versions/001}.py

### DAY 5: Components (Part 2) & Routes
**Frontend**:
- [ ] components/common/{Select, Card, Alert, Modal, Badge}.tsx
- [ ] components/notification/{Toast, ToastContainer}.tsx
- [ ] hooks/{useRouter, useRole, useToast}.ts
- [ ] app/(dashboard)/layout.tsx (shell)

**Backend**:
- [ ] schemas/{pagination}.py (if separate)
- [ ] Tests: conftest.py, fixtures/users.py

### DAY 6: Advanced Components & Testing
**Frontend**:
- [ ] components/common/{Skeleton, Divider}.tsx
- [ ] components/auth/{ProtectedRoute, RoleGuard}.tsx
- [ ] __tests__/{components, hooks, stores}/*.test.tsx
- [ ] cypress/support/{commands, auth, helpers}.ts

**Backend**:
- [ ] tests/{test_auth, test_user, test_integration}.py
- [ ] .env.example
- [ ] vitest/eslint configs

### DAY 7-9: Testing & Polish
**Frontend**:
- [ ] cypress/e2e/auth/*.cy.ts
- [ ] cypress/fixtures/users.json
- [ ] package.json dependencies
- [ ] All remaining CSS modules

**Backend**:
- [ ] All test files complete
- [ ] requirements-dev.txt
- [ ] Documentation comments

### DAY 10-14: Integration & Review
- [ ] All files created and linked
- [ ] Verify no broken imports
- [ ] Run build: `npm run build` (frontend)
- [ ] Run lint: `make lint` (backend)
- [ ] Run all tests: `make test`
- [ ] End-to-end: Login flow working

---

## 📝 QUICK FILE CREATION COMMANDS

### Create Frontend Structure
```bash
cd frontend
# Folders
mkdir -p app/{,\(auth\)/{login,password-change},\(dashboard\)/{,\(student\),\(lecturer\),\(coordinator\),\(hod\),\(admin\)}}
mkdir -p components/{auth,layout,common,form,notification,{table,dashboard,smart-grid}}
mkdir -p hooks stores
mkdir -p lib/{api,auth,utils,constants} types styles
mkdir -p __tests__/{components,hooks,stores,lib} cypress/{e2e/{auth,dashboard},fixtures,support}
mkdir -p public/{images,fonts}

# Initialize config files
touch next.config.js tsconfig.json tailwind.config.js vitest.config.ts .eslintrc.json
```

### Create Backend Structure
```bash
cd backend
# Folders
mkdir -p core db models schemas routers services dependencies middleware migrations/versions
mkdir -p utils prompts tests/{fixtures,integration}

# Initialize config files
touch main.py pyproject.toml requirements.txt requirements-dev.txt .env.example
```

---

## ✅ COMPLETION CRITERIA

- [ ] All 100+ files exist in correct locations
- [ ] All imports resolve without errors
- [ ] TypeScript compilation succeeds (frontend)
- [ ] Pytest discovers all tests (backend)
- [ ] FastAPI app starts: `uvicorn main:app --reload`
- [ ] Next.js app builds: `npm run build`
- [ ] Login flow works end-to-end
- [ ] Password change flow works
- [ ] Protected routes enforce authentication
- [ ] Role-based navigation renders correctly
- [ ] All unit tests pass
- [ ] All E2E tests pass
- [ ] No linting errors
- [ ] No TypeScript errors
- [ ] No unused imports
- [ ] Code consistently formatted

---

## 📊 SPRINT 1 METRICS

| Metric | Target | Status |
|--------|--------|--------|
| **Files Created** | 100+ | ⏳ |
| **Backend Test Coverage** | ≥70% | ⏳ |
| **Frontend Test Coverage** | ≥60% | ⏳ |
| **Build Time** | <60 sec | ⏳ |
| **E2E Test Success** | 100% | ⏳ |
| **Zero Breaking Imports** | 100% | ⏳ |

---

This manifest gives you a complete checklist to execute Sprint 1 without missing a single file! 🚀
