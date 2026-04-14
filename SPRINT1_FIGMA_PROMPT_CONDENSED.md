CMMS BASE UI & COMPONENT LIBRARY - SPRINT 1 FIGMA PROMPT

PROJECT: University carry-mark tracking platform (CMMS). Design complete Base UI for 5 roles: Student, Lecturer, Coordinator, HOD, Admin.

COLOR PALETTE:
Primary: #3B82F6 | Success: #10B981 | Error: #EF4444 | Warning: #F59E0B | Neutral: #6B7280 | Background: #FFFFFF | Surface: #F9FAFB | Border: #E5E7EB | Text: #111827 | Secondary: #6B7280

TYPOGRAPHY:
Inter Font | Heading XL: 32px bold | Heading L: 24px bold | Heading M: 20px semibold | Body: 16px | Body Small: 14px | Label: 12px medium | Line height: 1.5x (body), 1.2x (headings)

SPACING: 8px base unit | Padding: 16px default | Border-radius: 8px | Grid responsive: 320px mobile, 768px tablet, 1024px+ desktop

PAGE 1: LOGIN SCREEN (All Users)
- Center white card (400px wide, mobile-full) on light gradient background
- CMMS logo (40px) + heading + subtitle
- Email input + Password input (with show/hide toggle)
- "Sign in" button (full-width, primary blue)
- "Forgot password?" link
- Error states: Red borders + error text
- Loading state: Spinner in button, disabled
- Rate limit: Red alert after 5 attempts

PAGE 2: PASSWORD CHANGE (First Login)
- Same card layout
- "Change Your Password" title
- 3 inputs: Old password, New password, Confirm password
- Password strength indicator (bar: weak/fair/good/strong)
- Validation rules shown below input (min 8 chars, uppercase, number)
- "Update Password" button
- Success/error states

PAGE 3: APP SHELL (Main Layout After Login)
HEADER (Fixed top, 56px): Logo + title + user avatar + name + role badge
SIDEBAR (256px, role-specific nav):
  - STUDENT: Dashboard | My Courses | My Marks | Queries | Profile
  - LECTURER: Dashboard | My Courses | Smart Grid | Assessment Setup | Queries | Profile
  - COORDINATOR: Dashboard | Courses | Roster | Assessment Config | Reports | Profile
  - HOD: Dashboard | Departments | Analytics | Export | Audit Log | Profile
  - ADMIN: Dashboard | Users | Roles | Database | Settings | Logs
- Navigation items: Icon + label, 12px padding, active state (blue bg + left border)
- Sidebar scrollable, white background, border-right
- Content area: Remaining space, gray-50 background, 24px padding
- Mobile: Hamburger menu, sidebar overlay

REUSABLE COMPONENTS:

BUTTONS (4 variants):
- Primary: Blue bg, white text, 40px height, 12px border-radius
- Secondary: Gray border, gray text
- Danger: Red bg, white text
- Icon Button: Square, transparent
- States: Normal, hover (darker), active, disabled (gray-300), loading (spinner)

INPUTS (3 types):
- Text Input: 40px height, gray border, 8px radius, label above, error text below (red)
- Password Input: Text input + show/hide toggle icon
- Select Dropdown: Same styling
- Focus: Blue border, gray-50 background
- Error: Red border, red text

CARDS & ALERTS:
- Card: White, shadow-sm, 8px radius, 16px padding
- Alert: Left colored border (4px), icon + title + description
- Info Box: Gray bg, gray left border

TOAST NOTIFICATIONS (Bottom-right):
- Success (green), Error (red), Warning (yellow), Info (blue)
- 16px padding, 12px radius, white text, auto-dismiss 4 sec
- Close button (X) top-right

LOADING & ERROR:
- Spinner: Animated blue circle (16/24/32px)
- Skeleton: Gray placeholder blocks with shimmer
- Error state: Icon + message + retry button
- Empty state: Icon + message + create button

BADGES/STATUS:
- Status badge (pills): Draft (gray), Published (green), Flagged (red), Delayed (yellow), Anomaly (orange)
- Role badge: Blue bg, white text

MODALS:
- Overlay: Black 30% opacity
- Box: White, centered, 400-600px, shadow-2xl, 12px radius
- Header: 20px bold + close button (X)
- Footer: Cancel + Confirm buttons (right-aligned)
- Mobile: Full-width minus 16px margins

TABLES:
- Header: Bold, gray-100 bg, bottom border
- Rows: 48px height, alternating white/gray-50
- Hover: Light gray bg
- Pagination: Prev/Next buttons + page numbers

ADDITIONAL:
- Breadcrumbs: Gray "/" separator, last item bold
- Divider: Thin gray line
- Progress bar: Blue fill on gray, percentage label
- Stepper: Circles (1-5+), active blue, completed green, connected lines
- Tags/Chips: Gray bg, close button

INTERACTION PATTERNS:
1. Form: Submit → Loading → Toast → Redirect/Reset
2. Filter: Select → Nav updates → Content fades in
3. Pagination: Click → Current data fade out → New data fade in
4. Modal: Click → Overlay appears → On confirm, close + toast
5. Loading: Show skeleton 2+ seconds
6. Errors: Toast + inline field errors + retry button

RESPONSIVE:
- Mobile (320px): Single column, full-width cards, bottom sheets
- Tablet (768px): Two columns, collapsible sidebar
- Desktop (1024px+): Full layout

ACCESSIBILITY:
- Focus states: Blue outline, 2px
- Contrast: ≥4.5:1
- Icons with text labels
- Truncate long text with ellipsis

DELIVERABLES:
✓ All 5 role variations
✓ Login + Password change screens
✓ Complete app shell with all nav items
✓ 15+ reusable components (buttons, inputs, cards, modals, etc.)
✓ All interactive states (hover, active, disabled, loading, error)
✓ Mobile/tablet/desktop mockups
✓ Clean Figma structure (pages, components library)
✓ Export specs ready (names, colors, spacing)
✓ Dark mode variants (optional)

GOAL: Production-ready, fully-styled Figma file that developers can immediately use to build Next.js/React components. Every detail specified.
