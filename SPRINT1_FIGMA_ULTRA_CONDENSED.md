PROJECT: CMMS (University carry-mark system). Design Base UI for 5 roles: Student, Lecturer, Coordinator, HOD, Admin. Must include login, password change, app shell, and 15+ reusable components.

COLORS: Primary #3B82F6 | Success #10B981 | Error #EF4444 | Warning #F59E0B | Neutral #6B7280 | BG #FFFFFF | Surface #F9FAFB | Border #E5E7EB | Text #111827

TYPOGRAPHY: Inter | Heading XL: 32px bold | Heading L: 24px bold | Heading M: 20px semibold | Body: 16px | Body Small: 14px | Label: 12px | Line height: 1.5x

SPACING: 8px base | Padding 16px | Border-radius 8px | Responsive: 320px mobile, 768px tablet, 1024px+ desktop

PAGE 1 - LOGIN: White centered card (400px, mobile-full) on gradient | CMMS logo + heading | Email & password inputs | Show/hide toggle | "Sign in" button (full-width, primary) | Forgot password link | Error states (red) | Loading spinner | Rate limit alert (5 attempts)

PAGE 2 - PASSWORD CHANGE: Same card | Title "Change Your Password" | 3 inputs (old, new, confirm) | Password strength meter (weak/fair/good/strong) | Validation hints (8 chars, uppercase, number) | Update button | Error/success states

PAGE 3 - APP SHELL: 
HEADER (56px fixed): Logo + page title + user avatar + name + role
SIDEBAR (256px):
  - STUDENT: Dashboard | My Courses | My Marks | Queries | Profile
  - LECTURER: Dashboard | My Courses | Smart Grid | Assessment Setup | Queries | Profile
  - COORDINATOR: Dashboard | Courses | Roster | Assessment Config | Reports | Profile
  - HOD: Dashboard | Departments | Analytics | Export | Audit Log | Profile
  - ADMIN: Dashboard | Users | Roles | Database | Settings | Logs
Items: Icon + label, 12px pad, active (blue bg + left border)
CONTENT: Gray-50 bg, 24px padding
Mobile: Hamburger menu, sidebar overlay

COMPONENTS:
BUTTONS: Primary (blue, white text, 40px, 12px radius) | Secondary (gray border) | Danger (red) | Icon (square) | States: hover, active, disabled (gray-300), loading (spinner)

INPUTS: Text (40px, gray border, label above, error below red) | Password (+ toggle) | Select | Focus (blue border, gray-50 bg) | Error (red)

CARDS: White, shadow-sm, 8px radius, 16px padding | Alerts (left border 4px, colored by type)

TOAST: Bottom-right, 4 types (success/error/warning/info) | 16px padding, white text, auto-dismiss 4s

LOADING: Spinner (blue, 16-32px) | Skeleton (gray blocks, shimmer) | Error (icon + message + retry)

STATUS BADGES: Draft (gray) | Published (green) | Flagged (red) | Delayed (yellow) | Anomaly (orange)

MODAL: White box centered, 400-600px, 12px radius, shadow-2xl | Header 20px bold + close X | Footer (Cancel + Confirm buttons)

TABLE: 48px rows, gray-100 header, alternating white/gray-50, pagination (Prev/Next + pages)

OTHER: Breadcrumbs (gray /) | Dividers (thin gray line) | Progress bar (blue fill) | Stepper (circles 1-5, blue active, green done) | Chips (gray, close button)

INTERACTIONS: Form submit → loading → toast → redirect | Filter → nav updates → content fades in | Modal → overlay → confirm closes + toast | Errors → toast + inline field errors + retry

ACCESSIBILITY: Focus (blue outline 2px) | Contrast ≥4.5:1 | Icons with labels | Truncate long text

DELIVERABLES: ✓ All 5 role variations ✓ Login + password change ✓ App shell complete ✓ 15+ reusable components ✓ All states (hover, active, disabled, loading, error) ✓ Mobile/tablet/desktop mockups ✓ Clean Figma structure with pages + components library ✓ Export specs ready

GOAL: Production-ready Figma that developers immediately use for React/Next.js components. Every pixel, color, spacing, and interaction specified.
