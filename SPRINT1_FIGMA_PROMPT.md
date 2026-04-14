# Sprint 1 Base UI & Component Library - Figma Design Brief

**Copy everything below into Figma Claude Opus prompt**

---

## PROJECT CONTEXT
CMMS (Carry Mark Management System): University carry-mark tracking platform with 5 roles (Student, Lecturer, Coordinator, HOD, Admin). Build the complete Base UI supporting all roles with reusable components.

## DESIGN SYSTEM

### Color Palette
- **Primary**: #3B82F6 (Tailwind blue-500)
- **Success**: #10B981 (green-500)
- **Error**: #EF4444 (red-500)
- **Warning**: #F59E0B (amber-500)
- **Alert/Anomaly**: #FBBF24 (yellow-400)
- **Neutral**: #6B7280 (gray-500)
- **Background**: #FFFFFF (white)
- **Surface**: #F9FAFB (gray-50)
- **Border**: #E5E7EB (gray-200)
- **Text Primary**: #111827 (gray-900)
- **Text Secondary**: #6B7280 (gray-500)

### Typography
- **Font Family**: Inter (default system)
- **Heading XL**: 32px/bold (page titles)
- **Heading L**: 24px/bold (section headers)
- **Heading M**: 20px/semibold (subsections)
- **Body**: 16px/regular (main text)
- **Body Small**: 14px/regular (secondary text)
- **Label**: 12px/medium (labels, badges)
- **Line Height**: 1.5x for body, 1.2x for headings

### Spacing & Grid
- **Layout Grid**: 8px base unit
- **Padding**: 16px (default), 24px (large), 8px (small)
- **Gaps**: 8px (compact), 16px (normal), 24px (spacious)
- **Border Radius**: 8px (components), 4px (inputs)
- **Responsive**: Mobile (320px), Tablet (768px), Desktop (1024px+)

---

## PAGE FLOWS

### 1. LOGIN PAGE (First Screen - All Users)
**Layout**: Centered card on gradient background
- Background gradient: White to light blue (6% opacity blue)
- Card: White, shadow-lg, border-radius 12px, 400px wide, mobile-full
- Logo/Brand: 40px top (+48px padding)
- "Carry Mark Management System" heading M
- "Sign in to your account" body small, text-secondary
- Form inputs: Email + Password (with show/hide toggle)
- "Sign in" button: Full-width, primary blue, 12px border-radius
- "Forgot password?" link: Small, text-blue below form
- Error state: Red border + red error text below field
- Rate limit warning: Red alert box after 5 attempts
- Loading state: Spinner in button, button disabled

### 2. FORCED PASSWORD CHANGE PAGE (First Login Only)
**Layout**: Same card as login
- Title: "Change Your Password"
- Subtitle: "You must change your password on first login"
- 3 Input fields: Old Password, New Password, Confirm New Password
- Password strength indicator: Bar showing strength (weak/fair/good/strong) with color
- "Update Password" button (primary)
- Validation: Match check, min 8 chars, require uppercase + number
- Success: Toast notification, redirect to role dashboard
- Error states: Mismatch, weak password, field errors

### 3. ROLE-AWARE DASHBOARD SHELL (Main App Container)
**Layout**: Sidebar + Header + Content Area
- Header: Fixed top, 56px height, white background, shadow-sm
  - Left: Logo (32x32) + "CMMS" text
  - Center: Page title (context-aware)
  - Right: User avatar (32x32, initials) + Name + Role label
- Sidebar: 256px fixed, scrollable, white background, border-right
  - Top: User info card (mini, 40x40 avatar, name, role)
  - Navigation menu (role-specific - see below)
  - Icons + labels, 12px left padding, 8px vertical padding
  - Active state: Light blue background + blue left border (4px)
  - Hover state: Gray-50 background
  - Bottom (optional): Settings + Logout
- Content Area: Remaining width, gray-50 background, padding 24px
- Mobile: Hamburger menu, sidebar slides in as overlay

### NAVIGATION BY ROLE (in Sidebar):
1. **STUDENT Role**:
   - Dashboard (home icon)
   - My Courses (book icon)
   - My Marks (chart icon)
   - Queries (message icon)
   - Profile (user icon)

2. **LECTURER Role**:
   - Dashboard (home icon)
   - My Courses (book icon)
   - Smart Grid (table icon) 
   - Assessment Setup (settings icon)
   - Queries (message icon)
   - Profile (user icon)

3. **COORDINATOR Role**:
   - Dashboard (home icon)
   - Courses (book icon)
   - Roster Management (users icon)
   - Assessment Config (settings icon)
   - Reports (chart icon)
   - Profile (user icon)

4. **HOD Role**:
   - Dashboard (home icon)
   - Departments (building icon)
   - Analytics (bar-chart icon)
   - Export (download icon)
   - Audit Log (log icon)
   - Profile (user icon)

5. **ADMIN Role**:
   - Dashboard (home icon)
   - Users (users icon)
   - Roles & Permissions (lock icon)
   - Database (database icon)
   - Settings (settings icon)
   - System Logs (log icon)

---

## REUSABLE COMPONENT LIBRARY

### Buttons
- **Primary Button**: Blue background, white text, 12px border-radius, 12px padding (vertical/horizontal)
  - Hover: Darker blue
  - Active: Even darker
  - Disabled: Gray-300, cursor-not-allowed
- **Secondary Button**: Gray border, gray text, light gray background
  - Hover: Gray-100 background
- **Danger Button**: Red background, white text (for destructive actions)
- **Icon Button**: Square, transparent, colored icon (for compact spaces)
- **Loading State**: Spinner icon in button, text hidden

### Input Fields
- **Text Input**: 40px height, gray-200 border, 8px border-radius
  - Focus: Blue border (2px), gray-50 background
  - Error: Red border, red error text below (12px)
  - Label above: 12px, bold, gray-900
  - Placeholder: Gray-400
  - Icon left (optional): 8px left padding
- **Password Input**: Text input + show/hide toggle icon on right
- **Select Dropdown**: Same styling as text input
- **Multi-select**: Chips inside input field (removable)

### Cards & Containers
- **Card**: White background, shadow-sm, border-radius 8px, 16px padding
- **Alert Card**: Colored left border (4px) based on type (blue/green/red/yellow)
  - Icon + Title + Description + Action button (optional)
- **Info Box**: light gray background, gray border-left

### Toast Notifications
- **Position**: Bottom-right corner, 16px margin from edges
- **Variants**: 
  - Success: Green background, check icon
  - Error: Red background, X icon
  - Warning: Yellow background, warning icon
  - Info: Blue background, info icon
- **Styling**: White text, 12px border-radius, 16px padding, auto-dismiss (4 sec)
- **Close button**: X icon, top-right

### Loading & Error States
- **Spinner**: Animated circular loader (16px/24px/32px sizes), blue primary
- **Skeleton Screen**: Gray placeholder blocks, shimmer animation
- **Error State**: 
  - Error icon (red)
  - "Something went wrong" message
  - "Retry" button
- **Empty State**: 
  - Empty icon (gray)
  - "No data" message
  - "Create new" button (if applicable)

### Badges & Labels
- **Status Badge**: 
  - Small: 6px padding, 4px border-radius
  - Ring background, colored text
  - Variants: Draft (gray), Published (green), Flagged (red), Delayed (yellow), Anomaly (warning-yellow)
- **Role Badge**: Small pill, blue background, white text

### Modal / Dialog
- **Overlay**: Transparent black (30% opacity)
- **Modal Box**: White, centered, 400px-600px wide, shadow-2xl, border-radius 12px
- **Header**: 20px bold, title + close button (X top-right)
- **Body**: 16px text, 24px padding
- **Footer**: Buttons (Cancel, Confirm) aligned right
- **Mobile**: Full-width minus 16px margins

### Tables & Grids
- **Header Row**: Bold text, gray-100 background, border-bottom
- **Data Rows**: Alternating white/gray-50 (very light)
- **Row Height**: 48px
- **Hover**: Slight gray background
- **Pagination**: "Prev/Next" buttons + page numbers (bottom center)

---

## SPECIFIC UI REQUIREMENTS

### Form Validation
- Real-time feedback: Red border + error text immediately on blur
- Success: Green checkmark on right side (when valid)
- Tooltip hints: Small gray text below label ("Min 8 characters, must include uppercase")

### Accessibility
- All buttons/inputs must have visible focus states (blue outline, 2px)
- Contrast ratio ≥4.5:1 for all text
- Icons with text labels (not icon-only except obvious cases like close, menu)

### Responsiveness
- **Mobile** (320px): Single column, full-width cards, bottom sheets for modals
- **Tablet** (768px): Two-column for some cards, sidebar collapsible
- **Desktop** (1024px+): Full layout with all components visible

### Edge Cases
- Very long names (sidebar): Truncate with ellipsis
- Very long titles: Wrap to 2 lines
- Input errors: Stack below input (not hidden)
- Empty page: Always show empty state illustration + message

---

## ADDITIONAL COMPONENTS

### Breadcrumb Navigation
- Gray text, "/" separator, last item bold
- Example: "Courses / CS101 / Assessment Setup"

### Tags/Chips
- Inline tags, gray background, close button (X)
- Used for filtering, multi-select results

### Progress Bar
- Blue fill on gray background
- Percentage label or step indicator (1/5) inside/above

### Divider
- Thin gray horizontal line (border-gray-200)
- Optional: Text label in center

### Stepper (for multi-step forms)
- Circles with numbers, connected by lines
- Active: Blue circle, bold number
- Completed: Green circle, check mark
- Disabled: Gray circle

---

## INTERACTION PATTERNS

1. **Form Submission**: Button loads → Success/Error toast → Redirect or clear form
2. **Filtering**: Select role → Sidebar updates → Content area updates (smooth transition)
3. **Pagination**: Click page → Fade out current data → Fade in new data
4. **Modal Actions**: Click button → Modal overlay appears → On confirm, modal closes + toast shows
5. **Loading**: Show skeleton/spinner for 2+ seconds of data fetching
6. **Errors**: Show error toast + inline field errors + optional retry button

---

## SUCCESS CRITERIA FOR DESIGNS

✓ All 5 roles have unique, appropriate navigation
✓ Components are production-ready (no wireframes, fully styled)
✓ Color palette applied consistently
✓ Mobile, tablet, desktop mockups for each page
✓ Hover/active/disabled states for all interactive elements
✓ Dark mode variants (optional but appreciated)
✓ Component library includes 50+ variations
✓ Clean Figma file structure (pages per role, components tab)
✓ Export specs ready: Component names, colors, spacing

---

**END OF PROMPT**
