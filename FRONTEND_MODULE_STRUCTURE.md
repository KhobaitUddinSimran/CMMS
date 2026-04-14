# CMMS Frontend Directory Structure & Modules

**Project**: Next.js 14 React Application  
**Build Stage**: Sprint 1 Initialization  
**Status**: Sprint 1 (Weeks 1-2)

---

## 📁 COMPLETE FRONTEND STRUCTURE

```
frontend/
├── app/                                    
│   ├── layout.tsx                         [SPRINT 1] Global layout wrapper
│   ├── page.tsx                           [SPRINT 1] Landing/home page
│   ├── globals.css                        [SPRINT 1] Global styles
│   │
│   ├── (auth)/                            [SPRINT 1] Auth routes group
│   │   ├── layout.tsx                     [SPRINT 1] Auth layout
│   │   ├── login/
│   │   │   └── page.tsx                   [SPRINT 1] Login page
│   │   └── password-change/
│   │       └── page.tsx                   [SPRINT 1] Forced password change page
│   │
│   ├── (dashboard)/                       [SPRINT 2+] Protected routes group
│   │   ├── layout.tsx                     [SPRINT 1] Dashboard layout (shell)
│   │   │
│   │   ├── (student)/                     [SPRINT 2+] Student routes
│   │   │   ├── page.tsx                   Dashboard
│   │   │   ├── my-courses/
│   │   │   │   └── page.tsx
│   │   │   ├── my-marks/
│   │   │   │   └── page.tsx
│   │   │   ├── queries/
│   │   │   │   ├── page.tsx
│   │   │   │   └── [id]/
│   │   │   │       └── page.tsx
│   │   │   └── profile/
│   │   │       └── page.tsx
│   │   │
│   │   ├── (lecturer)/                    [SPRINT 2+] Lecturer routes
│   │   │   ├── page.tsx
│   │   │   ├── my-courses/
│   │   │   │   ├── page.tsx
│   │   │   │   └── [courseId]/
│   │   │   │       ├── page.tsx
│   │   │   │       ├── smart-grid/
│   │   │   │       │   └── page.tsx       [SPRINT 3] Smart Grid
│   │   │   │       ├── assessment-setup/
│   │   │   │       │   └── page.tsx       [SPRINT 2]
│   │   │   │       └── queries/
│   │   │   │           └── page.tsx
│   │   │   └── profile/
│   │   │       └── page.tsx
│   │   │
│   │   ├── (coordinator)/                 [SPRINT 2+] Coordinator routes
│   │   │   ├── page.tsx
│   │   │   ├── courses/
│   │   │   │   ├── page.tsx               [SPRINT 2] List courses
│   │   │   │   ├── create/
│   │   │   │   │   └── page.tsx           [SPRINT 2]
│   │   │   │   └── [courseId]/
│   │   │   │       ├── page.tsx           [SPRINT 2]
│   │   │   │       └── roster/
│   │   │   │           └── page.tsx       [SPRINT 2]
│   │   │   ├── roster-management/
│   │   │   │   └── page.tsx               [SPRINT 2]
│   │   │   ├── assessment-config/
│   │   │   │   └── page.tsx               [SPRINT 2]
│   │   │   ├── reports/
│   │   │   │   └── page.tsx               [SPRINT 3+]
│   │   │   └── profile/
│   │   │       └── page.tsx
│   │   │
│   │   ├── (hod)/                         [SPRINT 4+] HOD routes
│   │   │   ├── page.tsx
│   │   │   ├── analytics/
│   │   │   │   └── page.tsx
│   │   │   ├── export/
│   │   │   │   └── page.tsx
│   │   │   ├── audit-log/
│   │   │   │   └── page.tsx
│   │   │   ├── departments/
│   │   │   │   └── page.tsx
│   │   │   └── profile/
│   │   │       └── page.tsx
│   │   │
│   │   └── (admin)/                       [SPRINT 4+] Admin routes
│   │       ├── page.tsx
│   │       ├── users/
│   │       │   ├── page.tsx
│   │       │   └── [userId]/
│   │       │       └── page.tsx
│   │       ├── roles/
│   │       │   └── page.tsx
│   │       ├── database/
│   │       │   └── page.tsx
│   │       ├── settings/
│   │       │   └── page.tsx
│   │       ├── system-logs/
│   │       │   └── page.tsx
│   │       └── profile/
│   │           └── page.tsx
│   │
│   └── error.tsx                          [SPRINT 1] Error boundary
│
├── components/                             [SPRINT 1] Reusable components
│   │
│   ├── auth/                              [SPRINT 1] Auth components
│   │   ├── LoginForm.tsx                  [SPRINT 1]
│   │   ├── PasswordChangeForm.tsx         [SPRINT 1]
│   │   ├── ProtectedRoute.tsx             [SPRINT 1]
│   │   └── RoleGuard.tsx                  [SPRINT 1]
│   │
│   ├── layout/                            [SPRINT 1] Layout components
│   │   ├── Header.tsx                     [SPRINT 1]
│   │   ├── Sidebar.tsx                    [SPRINT 1]
│   │   ├── Navigation.tsx                 [SPRINT 1]
│   │   ├── MainLayout.tsx                 [SPRINT 1]
│   │   └── AuthLayout.tsx                 [SPRINT 1]
│   │
│   ├── common/                            [SPRINT 1] Common UI components
│   │   ├── Button.tsx                     [SPRINT 1]
│   │   ├── Button.module.css              [SPRINT 1]
│   │   ├── Input.tsx                      [SPRINT 1]
│   │   ├── Input.module.css               [SPRINT 1]
│   │   ├── Select.tsx                     [SPRINT 1]
│   │   ├── Select.module.css              [SPRINT 1]
│   │   ├── Card.tsx                       [SPRINT 1]
│   │   ├── Card.module.css                [SPRINT 1]
│   │   ├── Alert.tsx                      [SPRINT 1]
│   │   ├── Alert.module.css               [SPRINT 1]
│   │   ├── Modal.tsx                      [SPRINT 1]
│   │   ├── Modal.module.css               [SPRINT 1]
│   │   ├── Badge.tsx                      [SPRINT 1]
│   │   ├── Badge.module.css               [SPRINT 1]
│   │   ├── Spinner.tsx                    [SPRINT 1]
│   │   ├── Spinner.module.css             [SPRINT 1]
│   │   ├── Skeleton.tsx                   [SPRINT 1]
│   │   └── Skeleton.module.css            [SPRINT 1]
│   │
│   ├── form/                              [SPRINT 1] Form components
│   │   ├── Form.tsx                       [SPRINT 1]
│   │   ├── FormField.tsx                  [SPRINT 1]
│   │   ├── FormError.tsx                  [SPRINT 1]
│   │   ├── FormLabel.tsx                  [SPRINT 1]
│   │   └── FormField.module.css           [SPRINT 1]
│   │
│   ├── table/                             [SPRINT 3+] Table components
│   │   ├── Table.tsx
│   │   ├── TableHeader.tsx
│   │   ├── TableRow.tsx
│   │   ├── Pagination.tsx
│   │   └── Table.module.css
│   │
│   ├── dashboard/                         [SPRINT 2+] Dashboard components
│   │   ├── DashboardCard.tsx
│   │   ├── StatCard.tsx
│   │   ├── Chart.tsx
│   │   ├── MetricCard.tsx
│   │   └── Dashboard.module.css
│   │
│   ├── smart-grid/                        [SPRINT 3+] Smart Grid components
│   │   ├── SmartGrid.tsx
│   │   ├── GridCell.tsx
│   │   ├── SmartGrid.module.css
│   │   └── useSmartGrid.ts
│   │
│   └── notification/                      [SPRINT 1] Notification components
│       ├── Toast.tsx                      [SPRINT 1]
│       ├── ToastContainer.tsx             [SPRINT 1]
│       ├── Toast.module.css               [SPRINT 1]
│       └── useToast.ts                    [SPRINT 1] (hook)
│
├── hooks/                                  [SPRINT 1] Custom React hooks
│   ├── useAuth.ts                         [SPRINT 1]
│   ├── useToast.ts                        [SPRINT 1]
│   ├── useForm.ts                         [SPRINT 1]
│   ├── useRouter.ts                       [SPRINT 1]
│   ├── useRole.ts                         [SPRINT 1]
│   ├── useFetch.ts                        [SPRINT 2+]
│   ├── useModal.ts                        [SPRINT 2+]
│   ├── useTable.ts                        [SPRINT 3+]
│   ├── usePagination.ts                   [SPRINT 3+]
│   └── useApiClient.ts                    [SPRINT 1]
│
├── stores/                                 [SPRINT 1] Zustand state stores
│   ├── authStore.ts                       [SPRINT 1]
│   ├── toastStore.ts                      [SPRINT 1]
│   ├── userStore.ts                       [SPRINT 1]
│   ├── courseStore.ts                     [SPRINT 2+]
│   ├── markStore.ts                       [SPRINT 3+]
│   ├── dashboardStore.ts                  [SPRINT 4+]
│   └── index.ts                           [SPRINT 1]
│
├── lib/                                    [SPRINT 1] Utilities & helpers
│   ├── api/
│   │   ├── client.ts                      [SPRINT 1] Axios instance
│   │   ├── auth.ts                        [SPRINT 1] Auth API calls
│   │   ├── courses.ts                     [SPRINT 2+]
│   │   ├── marks.ts                       [SPRINT 3+]
│   │   ├── users.ts                       [SPRINT 4+]
│   │   └── index.ts                       [SPRINT 1]
│   │
│   ├── auth/
│   │   ├── jwt.ts                         [SPRINT 1] JWT handling
│   │   ├── tokenStorage.ts                [SPRINT 1] Token persistence
│   │   ├── authService.ts                 [SPRINT 1] Auth service
│   │   └── index.ts                       [SPRINT 1]
│   │
│   ├── utils/
│   │   ├── validation.ts                  [SPRINT 1] Form validation
│   │   ├── formatting.ts                  [SPRINT 1] Data formatting
│   │   ├── date.ts                        [SPRINT 2+]
│   │   ├── string.ts                      [SPRINT 1]
│   │   └── index.ts                       [SPRINT 1]
│   │
│   └── constants/
│       ├── apiEndpoints.ts                [SPRINT 1]
│       ├── userRoles.ts                   [SPRINT 1]
│       ├── errorMessages.ts               [SPRINT 1]
│       ├── validationRules.ts             [SPRINT 1]
│       └── index.ts                       [SPRINT 1]
│
├── types/                                  [SPRINT 1] TypeScript definitions
│   ├── auth.ts                            [SPRINT 1]
│   ├── user.ts                            [SPRINT 1]
│   ├── api.ts                             [SPRINT 1]
│   ├── course.ts                          [SPRINT 2+]
│   ├── mark.ts                            [SPRINT 3+]
│   ├── dashboard.ts                       [SPRINT 4+]
│   ├── common.ts                          [SPRINT 1]
│   └── index.ts                           [SPRINT 1]
│
├── styles/                                 [SPRINT 1] Global styles
│   ├── globals.css                        [SPRINT 1]
│   ├── variables.css                      [SPRINT 1] CSS custom properties
│   ├── tailwind.css                       [SPRINT 1]
│   ├── animations.css                     [SPRINT 1]
│   └── reset.css                          [SPRINT 1]
│
├── __tests__/                              Unit tests (Vitest)
│   ├── components/
│   │   ├── Button.test.tsx                [SPRINT 1]
│   │   ├── Input.test.tsx                 [SPRINT 1]
│   │   ├── Modal.test.tsx                 [SPRINT 1]
│   │   └── ...
│   │
│   ├── hooks/
│   │   ├── useAuth.test.ts                [SPRINT 1]
│   │   ├── useToast.test.ts               [SPRINT 1]
│   │   ├── useForm.test.ts                [SPRINT 1]
│   │   └── ...
│   │
│   ├── stores/
│   │   ├── authStore.test.ts              [SPRINT 1]
│   │   ├── toastStore.test.ts             [SPRINT 1]
│   │   └── ...
│   │
│   └── lib/
│       ├── api/
│       │   └── client.test.ts             [SPRINT 1]
│       ├── auth/
│       │   └── jwt.test.ts                [SPRINT 1]
│       └── utils/
│           ├── validation.test.ts         [SPRINT 1]
│           └── formatting.test.ts         [SPRINT 1]
│
├── cypress/                                E2E tests (Cypress)
│   ├── e2e/
│   │   ├── auth/
│   │   │   ├── login.cy.ts                [SPRINT 1]
│   │   │   ├── password-change.cy.ts      [SPRINT 1]
│   │   │   └── logout.cy.ts               [SPRINT 1]
│   │   ├── dashboard/
│   │   │   └── navigation.cy.ts           [SPRINT 2+]
│   │   ├── smart-grid/
│   │   │   └── marking.cy.ts              [SPRINT 3+]
│   │   └── ...
│   │
│   ├── fixtures/
│   │   ├── users.json                     [SPRINT 1]
│   │   ├── courses.json                   [SPRINT 2+]
│   │   └── ...
│   │
│   ├── support/
│   │   ├── commands.ts                    [SPRINT 1]
│   │   ├── auth.ts                        [SPRINT 1]
│   │   └── helpers.ts                     [SPRINT 1]
│   │
│   └── cypress.config.ts                  [SPRINT 1]
│
├── public/                                 Static assets
│   ├── images/
│   │   ├── logo.png                       [SPRINT 1]
│   │   ├── icons/
│   │   └── illustrations/
│   │
│   ├── fonts/
│   │   └── inter.woff2                    [SPRINT 1]
│   │
│   └── favicon.ico                        [SPRINT 1]
│
├── next.config.js                         [SPRINT 1] Next.js configuration
├── tsconfig.json                          [SPRINT 1] TypeScript config
├── tailwind.config.js                     [SPRINT 1] Tailwind CSS config
├── package.json                           [SPRINT 1] Dependencies
├── .env.example                           [SPRINT 1] Environment template
├── .env.local (gitignored)
├── vitest.config.ts                       [SPRINT 1] Vitest config
└── .eslintrc.json                         [SPRINT 1] ESLint config

```

---

## 🔨 SPRINT 1 MODULES (TO BE CREATED - WEEKS 1-2)

### ✅ **App Router Structure**
- `app/layout.tsx` - Root layout
- `app/page.tsx` - Home page
- `app/(auth)/login/page.tsx` - Login page
- `app/(auth)/password-change/page.tsx` - Password change page
- `app/(dashboard)/layout.tsx` - Dashboard shell (header + sidebar)
- `app/error.tsx` - Error boundary

### ✅ **Components Library - 15+**

#### Common UI (12 components)
1. `Button.tsx` + CSS
2. `Input.tsx` + CSS
3. `Select.tsx` + CSS
4. `Card.tsx` + CSS
5. `Alert.tsx` + CSS
6. `Modal.tsx` + CSS
7. `Badge.tsx` + CSS
8. `Spinner.tsx` + CSS
9. `Skeleton.tsx` + CSS
10. Form components (Form, FormField, FormError, FormLabel)

#### Layout Components (5)
1. `Header.tsx` - Top navbar
2. `Sidebar.tsx` - Navigation sidebar
3. `Navigation.tsx` - Navigation menu (role-aware)
4. `MainLayout.tsx` - Dashboard wrapper
5. `AuthLayout.tsx` - Auth page wrapper

#### Auth Components (4)
1. `LoginForm.tsx` - Login form with validation
2. `PasswordChangeForm.tsx` - Password change form
3. `ProtectedRoute.tsx` - Route protection wrapper
4. `RoleGuard.tsx` - Role-based access wrapper

#### Notification Components (3)
1. `Toast.tsx` - Single toast notification
2. `ToastContainer.tsx` - Toast container
3. Toast styles

### ✅ **Custom Hooks (5)**
1. `useAuth.ts` - Authentication hook
2. `useToast.ts` - Toast notifications
3. `useForm.ts` - Form handling
4. `useRouter.ts` - Router navigation
5. `useRole.ts` - Role detection

### ✅ **Zustand Stores (3)**
1. `authStore.ts` - Authentication state (user, token, role)
2. `toastStore.ts` - Toast notifications state
3. `userStore.ts` - User profile state

### ✅ **API & Auth Utils**
1. `lib/api/client.ts` - Axios instance with interceptors
2. `lib/api/auth.ts` - Auth API calls (login, logout, password reset)
3. `lib/auth/jwt.ts` - JWT parsing & validation
4. `lib/auth/tokenStorage.ts` - Token storage (localStorage/sessionStorage)
5. `lib/auth/authService.ts` - Auth service

### ✅ **Utilities & Constants**
1. `lib/utils/validation.ts` - Form validation rules
2. `lib/utils/formatting.ts` - Data formatting helpers
3. `lib/utils/string.ts` - String manipulation
4. `lib/constants/apiEndpoints.ts` - API routes
5. `lib/constants/userRoles.ts` - Role definitions
6. `lib/constants/errorMessages.ts` - Error messages
7. `lib/constants/validationRules.ts` - Validation rules

### ✅ **TypeScript Types**
1. `types/auth.ts` - Auth types (User, Role, Token)
2. `types/user.ts` - User types
3. `types/api.ts` - API response types
4. `types/common.ts` - Common types
5. `types/index.ts` - Type exports

### ✅ **Styles**
1. `styles/globals.css` - Global reset
2. `styles/variables.css` - CSS variables (colors, spacing)
3. `styles/tailwind.css` - Tailwind imports
4. `styles/animations.css` - Keyframe animations
5. `styles/reset.css` - CSS reset

### ✅ **Tests (Unit & E2E)**
- Button, Input, Modal tests
- useAuth, useToast, useForm tests
- authStore, toastStore tests
- Login flow E2E test
- Password change flow E2E test
- Protected route E2E test

### ✅ **Configuration Files**
- `next.config.js` - Next.js config
- `tsconfig.json` - TypeScript config
- `tailwind.config.js` - Tailwind config
- `vitest.config.ts` - Vitest config
- `.eslintrc.json` - ESLint config
- `package.json` - Dependencies

---

## 📦 SPRINT 2+ MODULES (WILL BE EMPTY/PLACEHOLDER)

### Sprint 2 - Course Setup (Apr 20 - May 1)
- `app/(dashboard)/(coordinator)/courses/` - Course management
- `lib/api/courses.ts` - Courses API
- `types/course.ts` - Course types
- `stores/courseStore.ts` - Course state

### Sprint 3 - Smart Grid & Grading (May 4-15)
- `app/(dashboard)/(lecturer)/**/smart-grid/` - Smart Grid UI
- `components/smart-grid/` - Smart Grid components
- `components/table/` - Table components
- `lib/api/marks.ts` - Marks API
- `stores/markStore.ts` - Mark state
- `hooks/usePagination.ts` - Pagination hook

### Sprint 4 - Dashboards & Analytics (May 18-29)
- `app/(dashboard)/(hod)/` - HOD dashboard
- `app/(dashboard)/(admin)/` - Admin dashboard
- `components/dashboard/` - Dashboard components
- `lib/api/users.ts` - Users API
- `stores/dashboardStore.ts` - Dashboard state

### Sprint 5 - Integration & Deployment (Jun 1-12)
- Comprehensive E2E tests
- Documentation updates
- Performance optimizations

---

## 🎯 DIRECTORY CREATION CHECKLIST (SPRINT 1)

### Create these folders first:
```bash
mkdir -p app/(auth)/login
mkdir -p app/(auth)/password-change
mkdir -p app/(dashboard)
mkdir -p components/{auth,layout,common,form,notification}
mkdir -p hooks
mkdir -p stores
mkdir -p lib/{api,auth,utils,constants}
mkdir -p types
mkdir -p styles
mkdir -p __tests__/{components,hooks,stores,lib}
mkdir -p cypress/{e2e/auth,fixtures,support}
mkdir -p public/{images,fonts}
```

### Create empty folders for future sprints:
```bash
mkdir -p components/{table,dashboard,smart-grid}
mkdir -p app/(dashboard)/(student)
mkdir -p app/(dashboard)/(lecturer)
mkdir -p app/(dashboard)/(coordinator)
mkdir -p app/(dashboard)/(hod)
mkdir -p app/(dashboard)/(admin)
mkdir -p hooks # Additional hooks
mkdir -p cypress/e2e/{dashboard,smart-grid}
```

---

## 📋 FILE CREATION PRIORITY (SPRINT 1)

### Priority 1 (Foundation - Days 1-2)
- [ ] `tsconfig.json`
- [ ] `next.config.js`
- [ ] `tailwind.config.js`
- [ ] `package.json`
- [ ] `app/layout.tsx`
- [ ] `styles/globals.css`
- [ ] `styles/variables.css`
- [ ] `types/auth.ts`
- [ ] `types/common.ts`

### Priority 2 (Auth & Core - Days 2-4)
- [ ] `components/common/Button.tsx` + CSS
- [ ] `components/common/Input.tsx` + CSS
- [ ] `components/common/Spinner.tsx` + CSS
- [ ] `components/form/*` (5 files)
- [ ] `lib/api/client.ts`
- [ ] `lib/auth/jwt.ts`
- [ ] `lib/auth/tokenStorage.ts`
- [ ] `lib/constants/*` (4 files)
- [ ] `stores/authStore.ts`
- [ ] `hooks/useAuth.ts`

### Priority 3 (Forms & Pages - Days 3-5)
- [ ] `components/auth/LoginForm.tsx`
- [ ] `components/auth/PasswordChangeForm.tsx`
- [ ] `app/(auth)/login/page.tsx`
- [ ] `app/(auth)/password-change/page.tsx`
- [ ] `lib/utils/validation.ts`

### Priority 4 (Layout & Navigation - Days 4-6)
- [ ] `components/layout/Header.tsx`
- [ ] `components/layout/Sidebar.tsx`
- [ ] `components/layout/Navigation.tsx`
- [ ] `components/layout/MainLayout.tsx`
- [ ] `app/(dashboard)/layout.tsx`
- [ ] `hooks/useRole.ts`

### Priority 5 (UI Components & Toast - Days 5-7)
- [ ] `components/common/*` (remaining 6 components)
- [ ] `components/notification/Toast.tsx`
- [ ] `components/notification/ToastContainer.tsx`
- [ ] `stores/toastStore.ts`
- [ ] `hooks/useToast.ts`

### Priority 6 (Route Guards & Protection - Days 6-7)
- [ ] `components/auth/ProtectedRoute.tsx`
- [ ] `components/auth/RoleGuard.tsx`
- [ ] `hooks/useRouter.ts`

### Priority 7 (Tests - Days 7+)
- [ ] Unit tests for components
- [ ] Unit tests for hooks
- [ ] Unit tests for stores
- [ ] E2E tests for auth flows

---

## 💡 IMPLEMENTATION NOTES

### Each Module Should Include:

**Components:**
```typescript
// Button.tsx
import styles from './Button.module.css';

interface ButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
}

export const Button: React.FC<ButtonProps> = ({ ... }) => {
  // Implementation
};
```

**Hooks:**
```typescript
// useAuth.ts
import { useCallback } from 'react';
import { useAtom } from 'jotai'; // or Zustand
import { authAtom } from '@/stores/authStore';

export const useAuth = () => {
  const [auth, setAuth] = useAtom(authAtom);
  
  const login = useCallback((email: string, password: string) => {
    // Implementation
  }, []);
  
  return { auth, login };
};
```

**Stores:**
```typescript
// authStore.ts
import { create } from 'zustand';

interface AuthStore {
  user: User | null;
  token: string | null;
  role: UserRole | null;
  login: (user: User, token: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  // Implementation
}));
```

---

## ✅ SPRINT 1 COMPLETION CHECKLIST

- [ ] All 50+ files created with proper structure
- [ ] All components exported in index files
- [ ] All types defined and exported
- [ ] All API client methods typed
- [ ] All stores implemented with Zustand
- [ ] All hooks exported and functional
- [ ] Login flow working end-to-end
- [ ] Password change flow working
- [ ] Protected routes enforcing authentication
- [ ] Role-based navigation rendering correctly
- [ ] All unit tests passing
- [ ] All E2E tests passing
- [ ] Build succeeds (next build)
- [ ] No TypeScript errors
- [ ] ESLint passes
- [ ] Component library documented in Storybook (optional)

---

**Total Files to Create in Sprint 1: ~60+ files**  
**Total Empty/Placeholder Folders for Sprints 2-5: ~25+ folders**

This structure allows for:
- ✅ Clean separation of concerns
- ✅ Scalability across 5 sprints
- ✅ Easy navigation for team members
- ✅ Reusable components across all roles
- ✅ Type-safe development with TypeScript
