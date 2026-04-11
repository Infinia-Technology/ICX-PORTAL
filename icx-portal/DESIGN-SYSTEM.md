# ICX Portal Design System Documentation

## 1. Introduction

### Overview

The ICX Portal Design System is a comprehensive set of design standards, components, and guidelines that ensure consistency, usability, and accessibility across the entire ICX Portal platform. This system serves as the single source of truth for all design and development decisions.

### Purpose

- **Consistency:** Maintain visual and interaction consistency across all user-facing components
- **Efficiency:** Accelerate development by providing pre-built, tested components
- **Scalability:** Enable rapid feature development without compromising design quality
- **Accessibility:** Ensure the platform is usable by all users, regardless of ability
- **Documentation:** Provide clear guidelines for designers and developers

### How to Use This Documentation

- **Designers:** Reference component variants, color usage, and layout patterns
- **Developers:** Use component specifications and code examples for implementation
- **Product Managers:** Understand design constraints and capabilities
- **Stakeholders:** See the visual language and interaction patterns

---

## 2. Color System

### Primary Colors

| Name | Hex Value | Usage | RGB |
|------|-----------|-------|-----|
| Primary | `#1a1a2e` | Active states, primary buttons, brand | rgb(26, 26, 46) |
| Primary Hover | `#0f3460` | Hover effects on primary elements | rgb(15, 52, 96) |
| Primary Light | `#16213e` | Secondary backgrounds | rgb(22, 33, 62) |

**Usage Guidelines:**
- Use Primary for call-to-action buttons
- Apply Primary Hover on interactive elements when users hover
- Primary Light for subtle backgrounds

---

### Secondary & Accent Colors

| Name | Hex Value | Usage | RGB |
|------|-----------|-------|-----|
| Accent | `#e94560` | Emphasis, alerts, status indicators | rgb(233, 69, 96) |
| Accent Hover | `#c73e54` | Hover state for accent elements | rgb(199, 62, 84) |

**Usage Guidelines:**
- Use Accent for important alerts and warnings
- Apply for unread notifications or urgent actions
- Maintain contrast with backgrounds (minimum 4.5:1 ratio)

---

### Neutral & Background Colors

| Name | Hex Value | Usage | Notes |
|------|-----------|-------|-------|
| Background (Page BG) | `#f8f9fc` | Main page backgrounds | Light, non-white |
| Surface (Card/Modal BG) | `#ffffff` | Cards, modals, surfaces | Pure white |
| Border | `#e2e8f0` | Borders, dividers, separators | Light gray |
| Text (Primary) | `#1e293b` | Main body text | Dark gray |
| Text (Secondary) | `#64748b` | Subheadings, secondary info | Medium gray |
| Text (Muted) | `#94a3b8` | Disabled text, placeholders | Light gray |

---

### Status Colors

#### Success
- **Color:** `#16a34a`
- **Background:** `#f0fdf4`
- **Usage:** Approved, completed, saved status
- **Text Color:** Green-800 (`text-green-800`)

#### Error
- **Color:** `#dc2626`
- **Background:** `#fef2f2`
- **Usage:** Errors, rejections, failures
- **Text Color:** Red-800 (`text-red-800`)

#### Warning
- **Color:** `#d97706`
- **Background:** `#fffbeb`
- **Usage:** Warnings, pending actions, cautions
- **Text Color:** Yellow-800 (`text-yellow-800`)

#### Info
- **Color:** `#2563eb`
- **Background:** `#eff6ff`
- **Usage:** Information, new items, notices
- **Text Color:** Blue-800 (`text-blue-800`)

---

### Color Usage Guidelines

**Do's:**
- Use Primary for main CTAs and navigation
- Apply Status colors for form validation feedback
- Maintain consistent background usage throughout sections
- Test color contrast for accessibility (WCAG AA: 4.5:1 minimum)

**Don'ts:**
- Don't use Accent for more than 10% of screen content
- Don't apply both Primary and Accent in the same component
- Don't assume colors work without testing on various backgrounds
- Don't use color as the sole indicator of status (add icons/text)

---

## 3. Typography System

### Font Family

**Primary Font:** Inter

```css
font-family: 'Inter', system-ui, -apple-system, sans-serif;
```

**Fallback Stack:**
- system-ui (San Francisco on iOS, Segoe UI on Windows)
- -apple-system (macOS fallback)
- sans-serif (universal fallback)

### Font Sizes & Hierarchy

| Element | Size | Weight | Line Height | Usage |
|---------|------|--------|-------------|-------|
| H1 (Page Title) | 2xl (28px) | bold (700) | 1.2 | Main page headings |
| H2 (Section Header) | lg (18px) | bold (700) | 1.3 | Section titles, modal titles |
| H3 (Subsection) | base (16px) | semibold (600) | 1.4 | Card headers, list section titles |
| H4 (Subheading) | sm (14px) | semibold (600) | 1.5 | Form group headers |
| Body (Regular) | sm (14px) | regular (400) | 1.5 | All body text, descriptions |
| Body (Small) | xs (12px) | regular (400) | 1.4 | Secondary text, captions |
| Caption | 10px | regular (400) | 1.3 | Micro text, timestamps |

### Font Weight Usage

| Weight | Value | Usage |
|--------|-------|-------|
| Bold | 700 | Page titles, main headings |
| Semibold | 600 | Section headers, emphasis |
| Medium | 500 | Form labels, navigation active |
| Regular | 400 | Body text, descriptions |

### Text Color Hierarchy

```css
Primary Text:     color: var(--color-text);           /* #1e293b */
Secondary Text:   color: var(--color-text-secondary); /* #64748b */
Muted Text:       color: var(--color-text-muted);     /* #94a3b8 */
Interactive Text: color: var(--color-primary);        /* #1a1a2e */
```

### Typography Best Practices

**Do's:**
- Use H1 only once per page
- Maintain proper heading hierarchy (H1 → H2 → H3)
- Use semibold for emphasis within body text
- Apply secondary text color for helper text and descriptions

**Don'ts:**
- Don't skip heading levels (e.g., H1 → H3)
- Don't use more than 2 font weights in the same section
- Don't apply small text to critical information
- Don't underline text (reserve for links only)

---

## 4. Spacing & Layout

### Spacing Scale

ICX Portal uses Tailwind CSS spacing scale (multiples of 4px):

| Scale | Pixels | CSS Class | Usage |
|-------|--------|-----------|-------|
| xs | 4px | gap-1 | Minimal spacing |
| sm | 8px | gap-2 | Tight spacing |
| md | 12px | gap-3 | Standard spacing |
| lg | 16px | gap-4 | Comfortable spacing |
| xl | 24px | gap-6 | Large spacing |
| 2xl | 32px | gap-8 | Extra large spacing |

### Component Sizing

**Buttons:**
- Large button: height 44px (`h-11`)
- Standard button: height 40px (`h-10`)
- Small button: height 36px (`h-9`)
- Horizontal padding: 20px (`px-5`)

**Form Inputs:**
- All input fields: height 40px (`h-10`)
- Search input: height 36px (`h-9`)
- Horizontal padding: 12px (`px-3`)
- Vertical padding: 8px (`py-2`)

**Cards & Containers:**
- Default padding: 24px (`p-6`)
- Content gap: 12px (`gap-3`) or 24px (`gap-6`)
- Border radius: 12px (`rounded-lg`)

**Data Table:**
- Cell padding: 16px horizontal, 12px vertical (`px-4 py-3`)
- Row height: 50px approx.

**Icons:**
- Small icons (UI controls): 16px (`w-4 h-4`)
- Medium icons (status): 24px (`w-6 h-6`)
- Large icons (hero): 32px (`w-8 h-8`)

### Grid System

**Responsive Grid:**
```css
/* Single column on mobile */
grid

/* 2 columns on tablets (640px+) */
sm:grid-cols-2

/* 3-4 columns on desktop (1024px+) */
lg:grid-cols-4
```

### Layout Dimensions

| Element | Dimension | CSS Variable |
|---------|-----------|---|
| Sidebar Width | 320px | `--sidebar-width` |
| Topbar Height | 64px | `--topbar-height` |
| Modal Max Width | 512px | max-w-lg |
| Container Max Width | 1280px | max-w-4xl (typical) |

### Responsive Breakpoints

| Breakpoint | Width | CSS Prefix | Use Case |
|------------|-------|-----------|----------|
| Mobile | <640px | none | Default (mobile-first) |
| Tablet | ≥640px | `sm:` | Medium screens |
| Desktop | ≥1024px | `lg:` | Large screens |

### Layout Structure

**Dashboard Layout:**
```
┌─────────────────────────────────────┐
│ Topbar (height: 64px)               │
├──────────┬──────────────────────────┤
│ Sidebar  │                          │
│ (320px)  │ Main Content (p-6)       │
│          │ bg: var(--color-bg)      │
│          │                          │
│          │                          │
└──────────┴──────────────────────────┘
```

---

## 5. Components

### Button Component

**File:** `client/src/components/ui/Button.jsx`

#### Variants

##### Primary Button
```
Background: var(--color-primary) (#1a1a2e)
Text Color: white
Hover: var(--color-primary-hover) (#0f3460)
Height: 44px (h-11)
Padding: 20px (px-5)
Border Radius: 8px (rounded-md)
```

**Usage:** Main call-to-action buttons, form submission

##### Secondary Button
```
Background: white
Border: 1px solid var(--color-border)
Text Color: var(--color-primary)
Hover: bg-gray-50
Height: 40px (h-10)
Padding: 16px (px-4)
```

**Usage:** Alternative actions, cancel buttons

##### Tertiary Button
```
Background: transparent
Text Color: var(--color-primary)
Hover: bg-gray-100
Height: 36px (h-9)
Padding: 12px (px-3)
```

**Usage:** Low-priority actions, links within content

##### Danger Button
```
Background: var(--color-error) (#dc2626)
Text Color: white
Hover: red-700
Height: 44px (h-11)
Padding: 20px (px-5)
```

**Usage:** Delete, remove, or destructive actions

#### States

| State | Styling | Behavior |
|-------|---------|----------|
| Default | Standard colors | Interactive |
| Hover | Darkened background | Cursor pointer |
| Active/Pressed | Even darker shade | Immediate feedback |
| Disabled | opacity-50, cursor-not-allowed | Non-interactive |
| Loading | Shows spinner icon | Disabled interaction |
| Focus | Ring outline (2px) | Keyboard navigation |

#### Props

```javascript
<Button
  variant="primary"      // primary, secondary, tertiary, danger
  loading={false}        // Shows spinner when true
  disabled={false}       // Disables interaction
  className="custom"     // Additional Tailwind classes
  onClick={handler}      // Click callback
>
  Button Label
</Button>
```

#### Usage Guidelines

**Do's:**
- Use Primary for main CTAs (1 per screen when possible)
- Use Secondary for alternatives
- Keep button text short and action-focused
- Use loading state for async operations

**Don'ts:**
- Don't use multiple Primary buttons
- Don't make disabled buttons interactive-looking
- Don't use button text smaller than 14px
- Don't place buttons without hover visual feedback

---

### Form Components

#### Input Field

**File:** `client/src/components/ui/Input.jsx`

**Specifications:**
- Height: 40px
- Padding: 12px horizontal
- Border: 1px solid var(--color-border)
- Border Radius: 8px (rounded-md)
- Focus: 2px ring, var(--color-primary)

**States:**

| State | Styling |
|-------|---------|
| Default | Gray border, normal text |
| Hover | Subtle shadow/border darken |
| Focus | Blue ring (4px), blue border |
| Error | Red border, red ring on focus |
| Disabled | Gray background, opacity-50 |
| Required | Red asterisk `*` label indicator |

**Error Display:**
```
• Red border: border-var(--color-error)
• Red focus ring: focus:ring-red-100
• Error message below input: text-sm text-var(--color-error)
```

**Props:**
```javascript
<Input
  label="Email"           // Label text above input
  type="email"            // HTML input type
  value={value}           // Input value
  onChange={handler}      // Change callback
  error="Invalid email"   // Error message (shows in red)
  required={true}         // Shows required indicator
  placeholder="you@example.com"
  className="custom"      // Additional classes
/>
```

---

#### TextArea Component

**File:** `client/src/components/ui/TextArea.jsx`

**Specifications:**
- Min Height: 80px
- Padding: 12px horizontal, 8px vertical
- Resizable: Vertical only
- Max Length: Optional character limit indicator

**Character Counter:**
- Position: Bottom right
- Format: "150 / 500 characters"
- Color: var(--color-text-muted)

---

#### Select/Dropdown

**File:** `client/src/components/ui/Select.jsx`

**Specifications:**
- Height: 40px
- Custom chevron icon (right side)
- All style properties same as Input
- Options mapped from array

**Props:**
```javascript
<Select
  label="Category"
  options={[
    { value: 'option1', label: 'Option 1' },
    { value: 'option2', label: 'Option 2' }
  ]}
  value={selected}
  onChange={handler}
  error="Required field"
  required={true}
/>
```

---

#### Date & Time Picker

**File:** `client/src/components/ui/DatePicker.jsx`

**Specifications:**
- Height: 40px
- Supports: date, datetime-local, time, month
- Native HTML5 input
- Same styling as Input component

**Props:**
```javascript
<DatePicker
  label="Start Date"
  type="date"              // date, datetime-local, time, month
  value={dateValue}
  onChange={handler}
  error="Invalid date"
  required={true}
/>
```

---

#### Phone Input

**File:** `client/src/components/ui/PhoneInput.jsx`

**Features:**
- Two-part: Country code dropdown + phone number
- 50+ countries with flag emojis
- Phone field: numeric only
- Searchable country dropdown

**Countries Included:**
UAE, KSA, Qatar, Bahrain, Oman, Kuwait, USA, UK, India, etc.

**Props:**
```javascript
<PhoneInput
  label="Contact Number"
  value={phone}              // String or {country, number}
  onChange={handler}
  name="contactNumber"
/>
```

---

#### Checkbox Component

**File:** `client/src/components/ui/Checkbox.jsx`

**Two Modes:**

**Single Checkbox:**
```javascript
<Checkbox
  label="I agree to terms"
  checked={true}
  onChange={handler}
/>
```

**Multi-Select (Group):**
```javascript
<Checkbox
  label="Select options"
  options={[
    { value: 'opt1', label: 'Option 1' },
    { value: 'opt2', label: 'Option 2' }
  ]}
  selected={['opt1']}
  onChange={handler}
/>
```

**Styling:**
- Size: 16px × 16px
- Border: 1px solid var(--color-border)
- Checked: var(--color-primary) background
- Multi layout: flex wrap, gap-3

---

#### File Upload

**File:** `client/src/components/ui/FileUpload.jsx`

**Features:**
- Drag & drop area
- Click to browse files
- Max 10MB per file
- Multiple file upload (default 5 files max)
- Accepted: PDF, DOC, DOCX, JPG, JPEG, PNG

**Drag States:**
- Default: dashed border
- Drag Over: blue border, blue background
- Active: var(--color-primary) border, blue-50 background

**Props:**
```javascript
<FileUpload
  label="Upload Documents"
  maxFiles={5}
  maxSize={10}              // MB
  onFilesSelected={handler}
  disabled={false}
/>
```

---

### Data Display Components

#### Card Component

**File:** `client/src/components/ui/Card.jsx`

**Variants:**

**Default (Bordered):**
```css
background: var(--color-surface) (#ffffff)
border: 1px solid var(--color-border)
border-radius: 12px (rounded-lg)
padding: 24px (p-6)
```

**Elevated:**
```css
background: var(--color-surface)
box-shadow: 0 4px 6px rgba(0,0,0,0.1)
hover: box-shadow increased
border-radius: 12px
transition: shadow 200ms
```

**Props:**
```javascript
<Card elevated={true}>
  Card content
</Card>
```

---

#### Badge Component

**File:** `client/src/components/ui/Badge.jsx`

**Auto Status Colors:**

| Status | Background Color | Text Color |
|--------|------------------|-----------|
| DRAFT | Gray | Gray-800 |
| PENDING | Yellow/Amber | Yellow-800 |
| KYC_SUBMITTED | Blue | Blue-800 |
| IN_REVIEW | Purple | Purple-800 |
| REVISION_REQUESTED | Orange | Orange-800 |
| APPROVED | Green | Green-800 |
| REJECTED | Red | Red-800 |
| MATCHED | Teal | Teal-800 |
| CLOSED | Gray | Gray-800 |

**Manual Color Variants:**
- info (blue)
- success (green)
- error (red)
- warning (orange)
- default (gray)

**Styling:**
- Padding: 10px horizontal, 4px vertical (`px-2.5 py-0.5`)
- Border Radius: Fully rounded (`rounded-full`)
- Text Size: 12px (xs)
- Font Weight: 500 (medium)
- Display: inline-block

**Props:**
```javascript
<Badge status="APPROVED" />
<Badge variant="success" label="Active" />
```

---

#### DataTable Component

**File:** `client/src/components/ui/DataTable.jsx`

**Features:**
- Sortable columns (click header)
- Built-in search toolbar
- Pagination with prev/next
- Loading state with spinner
- Empty state message
- Row hover effects

**Structure:**
```
Search Bar (optional)
Filter Section (optional)
┌─────────────────────────────┐
│ Column 1 | Column 2 | Col 3 │  (Sortable headers)
├─────────────────────────────┤
│ Row 1    | Data    | Data   │  (Hover: bg-gray-50)
│ Row 2    | Data    | Data   │
│ Row 3    | Data    | Data   │
├─────────────────────────────┤
│ Prev | Page 1 of 5 | Next  │  (Pagination)
└─────────────────────────────┘
```

**Cell Padding:** 16px horizontal, 12px vertical (`px-4 py-3`)

**Column Configuration:**
```javascript
const columns = [
  { key: 'email', label: 'Email', width: '30%', sortable: true },
  { key: 'status', label: 'Status', width: '20%', render: (value) => <Badge status={value} /> },
  { key: 'date', label: 'Date', sortable: true }
];
```

**Props:**
```javascript
<DataTable
  columns={columns}
  data={rowData}
  pagination={{ page, totalPages, limit, total, hasPrev, hasNext }}
  sortField="email"
  sortDirection="asc"
  onSort={(field, direction) => {}}
  searchValue={search}
  onSearchChange={setSearch}
  onPageChange={setPage}
  loading={false}
  emptyMessage="No data found"
/>
```

---

### Modal & Overlay Components

#### Modal Dialog

**File:** `client/src/components/ui/Modal.jsx`

**Specifications:**
- Backdrop: 40% black overlay (`bg-black/40`)
- Max Width: 512px (`max-w-lg`)
- Responsive: Full width with 16px margins on mobile (`mx-4`)
- Max Height: 90vh with vertical scroll
- Padding: 24px (`p-6`)
- Border Radius: 12px (`rounded-lg`)
- Box Shadow: Large (`shadow-xl`)

**Structure:**
```
Backdrop (fixed, 100% viewport)
  └── Modal Container
      ├── Header (Title + Close Button)
      ├── Divider (optional)
      ├── Body (Content)
      └── Footer (optional, for actions)
```

**Close Button:**
- Icon: X (Lucide React)
- Position: Top right
- Size: 24px (`w-6 h-6`)
- Hover: Gray background

**Props:**
```javascript
<Modal
  open={isOpen}
  onClose={handleClose}
  title="Confirm Action"
>
  Modal content here
</Modal>
```

**Body Scroll:**
- Disabled when modal open: `body overflow-hidden`
- Modal scrolls internally if content exceeds max-height

---

#### Toast Notification System

**File:** `client/src/components/ui/Toast.jsx`

**Provider Setup:**
```javascript
<ToastProvider>
  <App />
</ToastProvider>
```

**Usage in Components:**
```javascript
const { addToast } = useToast();
addToast({ type: 'success', message: 'Action completed!' });
```

**Toast Types & Colors:**

| Type | BG Color | Border Color | Text Color |
|------|----------|--------------|-----------|
| success | var(--color-success-bg) | var(--color-success) | green-800 |
| error | var(--color-error-bg) | var(--color-error) | red-800 |
| warning | var(--color-warning-bg) | var(--color-warning) | yellow-800 |
| info | var(--color-info-bg) | var(--color-info) | blue-800 |

**Specifications:**
- Position: Bottom right, fixed (`fixed bottom-4 right-4`)
- Z-Index: 100 (`z-[100]`)
- Animation: Slide in 200ms ease-out
- Auto-dismiss: 4 seconds (default, configurable)
- Layout: Flex with icon, message, close button
- Padding: 12px horizontal, 12px vertical (`px-4 py-3`)
- Border Radius: 8px (`rounded-md`)
- Border: 1px solid

**Props:**
```javascript
addToast({
  type: 'success',        // success, error, warning, info
  message: 'Saved!',      // Toast message text
  duration: 4000          // Duration in milliseconds (default 4000)
});
```

---

### Progress & Loading Components

#### Spinner

**File:** `client/src/components/ui/Spinner.jsx`

**Sizes:**

| Size | Pixels | CSS |
|------|--------|-----|
| Small | 16px | w-4 h-4 |
| Medium (default) | 32px | w-8 h-8 |
| Large | 48px | w-12 h-12 |

**Specifications:**
- Icon: Loader2 (Lucide React)
- Color: var(--color-primary)
- Animation: Continuous spin (`animate-spin`)

**Props:**
```javascript
<Spinner size="md" />
```

---

#### Stepper Component

**File:** `client/src/components/ui/Stepper.jsx`

**Step States:**

| State | Background | Icon | Text Color |
|-------|-----------|------|-----------|
| Completed | var(--color-success) | Check | white |
| Current | var(--color-primary) | Number | white |
| Pending | Gray-200 | Number | Gray-500 |

**Specifications:**
- Circle Size: 32px (`w-8 h-8`)
- Connector Line: 32px width, 2px height (`h-0.5`)
- Border Radius: Full (circle)
- Responsive: Hides labels on mobile (`hidden sm:inline`)

**Props:**
```javascript
<Stepper
  steps={['Step 1', 'Step 2', 'Step 3']}
  currentStep={1}
/>
```

---

#### AutoSave Indicator

**File:** `client/src/components/ui/AutoSaveIndicator.jsx`

**States:**

| State | Icon | Text | Color |
|-------|------|------|-------|
| idle | Cloud | - | Hidden |
| saving | Loader2 (spin) | Saving... | Gray |
| saved | Check | Saved | Green |
| error | CloudOff | Save failed | Red |

**Position:** Typically top right or inline with form

---

### Layout Components

#### DashboardLayout

**File:** `client/src/components/layout/DashboardLayout.jsx`

**Composition:**
- Topbar (fixed, top)
- Sidebar (fixed, left)
- Main content area (rest of screen)

**Spacing:**
- Sidebar width offset: `pl-[var(--sidebar-width)]` on main
- Topbar height offset: `pt-[var(--topbar-height)]` on main
- Content padding: 24px (`p-6`)
- Content background: var(--color-bg)

**Responsive:** Fixed on all sizes (no collapse)

---

#### Topbar

**File:** `client/src/components/layout/Topbar.jsx`

**Elements:**
1. **Logo:** "ICX Portal" text
2. **Spacer:** Flexible space in middle
3. **Notification Bell:** Icon with unread badge
4. **User Info:** Email + role
5. **Logout Button:** Primary button

**Notification Dropdown:**
- Width: 320px (`w-80`)
- Max Height: 384px (`max-h-96`)
- Position: Right-aligned
- Scrollable content
- Unread indicator: Blue dot
- Time formatting: "just now", "5m ago", "2h ago"

**Specifications:**
- Height: 64px
- Padding: 24px horizontal (`px-6`)
- Background: white
- Border Bottom: 1px solid var(--color-border)
- Fixed position (`fixed top-0 left-0 right-0 z-40`)

---

#### Sidebar

**File:** `client/src/components/layout/Sidebar.jsx`

**Specifications:**
- Width: 320px
- Fixed position
- Scrollable content
- Background: white
- Z-Index: 30

**Navigation Items:**
- Icon + Label
- Active state: `bg-var(--color-primary) text-white`
- Hover state: `hover:bg-gray-100 text-var(--color-text)`
- Padding: 12px horizontal, 10px vertical (`px-3 py-2.5`)
- Border Radius: 8px (`rounded-md`)

**Coming Soon Badge:**
- Yellow background
- Text: "Coming Soon"
- Position: Right side of item

**Roles Supported:**
- Supplier
- Broker
- Customer
- Admin
- Superadmin
- Reader
- Viewer

**Icons Used:** Lucide React (LayoutDashboard, Building2, Server, Users, Settings, Eye, Zap, Database, etc.)

---

## 6. UX Patterns

### Form Validation

**Real-time Validation:**
- Validate on blur (after user leaves field)
- Show error immediately on blur
- Clear error on valid input
- Error message below field in red text

**Submit Validation:**
- Show all errors at once on submit
- Highlight fields with errors (red border)
- Focus first errored field
- Block submission if errors exist

**Error Message Format:**
```
[Field Label]: [Error description]
Example: "Email: Invalid email address"
```

---

### Error Handling

**Form Errors:**
- Display at field level (red border + message below)
- Display at form level (alert/toast at top)

**API Errors:**
- Toast notification with error message
- Fallback: "Something went wrong. Please try again."

**Network Errors:**
- Toast notification
- Retry button (if applicable)
- Graceful degradation (show cached data if available)

---

### Loading States

**Button Loading:**
- Show spinner icon
- Disable interactions
- Text remains or changes to "Loading..."

**Page Loading:**
- Full-page spinner in center
- Or skeleton loaders for content

**DataTable Loading:**
- Spinner overlay on table
- Disable pagination and sorting

---

### Empty States

**DataTable Empty:**
```
[Search Icon]
No data found
Try adjusting your filters
```

**Search No Results:**
```
[Search Icon]
No results for "your query"
Try different keywords
```

---

### Navigation Patterns

**Primary Navigation:** Sidebar (always visible on desktop)

**Secondary Navigation:** Topbar (notifications, user menu)

**Breadcrumbs:** Not consistently used; rely on page titles

**Active Indicator:** Highlighted nav item in primary color

---

## 7. Accessibility

### Color Contrast

**WCAG AA Compliance (Minimum 4.5:1 ratio):**

| Combination | Ratio | Status |
|-------------|-------|--------|
| #1a1a2e (Primary) on white | 8.5:1 | ✓ Pass |
| #e94560 (Accent) on white | 3.5:1 | ⚠ Caution |
| #16a34a (Success) on white | 5.2:1 | ✓ Pass |
| #dc2626 (Error) on white | 5.0:1 | ✓ Pass |

**Note:** Accent color only used on large areas; context ensures readability

### Focus States

**Keyboard Navigation:**
- All interactive elements receive focus ring
- Focus ring: 2px solid, var(--color-primary)
- Focus ring color on light backgrounds: blue-100
- Visible outline with minimum 2px

**Focus Order:**
- Left to right, top to bottom
- Logical tab order maintained
- Form inputs in order of appearance

### Semantic HTML

**Usage:**
- `<button>` for buttons (not `<div>` or `<a>`)
- `<nav>` for navigation regions
- `<form>` for form sections
- `<label>` for form inputs (with `for` attribute)
- Proper heading hierarchy (H1, H2, H3)

### ARIA Labels

**Requirements:**
- Icon-only buttons: `aria-label="Action name"`
- Form labels: Associated with inputs via `id` and `for`
- Navigation regions: `aria-label="Navigation"`
- Live regions: `aria-live="polite"` for notifications

### Screen Reader Considerations

**Do's:**
- Use semantic HTML
- Provide text alternatives for icons
- Use proper heading structure
- Label form fields clearly

**Don'ts:**
- Don't rely on color alone to convey information
- Don't use decorative elements with screen reader exposure
- Don't skip heading levels

---

## 8. Design Tokens

### JSON Token Export

```json
{
  "colors": {
    "primary": {
      "base": "#1a1a2e",
      "light": "#16213e",
      "hover": "#0f3460"
    },
    "accent": {
      "base": "#e94560",
      "hover": "#c73e54"
    },
    "neutral": {
      "bg": "#f8f9fc",
      "surface": "#ffffff",
      "border": "#e2e8f0",
      "text": "#1e293b",
      "text-secondary": "#64748b",
      "text-muted": "#94a3b8"
    },
    "status": {
      "success": "#16a34a",
      "success-bg": "#f0fdf4",
      "error": "#dc2626",
      "error-bg": "#fef2f2",
      "warning": "#d97706",
      "warning-bg": "#fffbeb",
      "info": "#2563eb",
      "info-bg": "#eff6ff"
    }
  },
  "typography": {
    "fontFamily": "'Inter', system-ui, -apple-system, sans-serif",
    "sizes": {
      "h1": "28px",
      "h2": "18px",
      "h3": "16px",
      "body": "14px",
      "caption": "10px"
    },
    "weights": {
      "bold": 700,
      "semibold": 600,
      "medium": 500,
      "regular": 400
    }
  },
  "spacing": {
    "xs": "4px",
    "sm": "8px",
    "md": "12px",
    "lg": "16px",
    "xl": "24px",
    "2xl": "32px"
  },
  "radius": {
    "sm": "4px",
    "md": "8px",
    "lg": "12px",
    "full": "9999px"
  },
  "layout": {
    "sidebar-width": "320px",
    "topbar-height": "64px"
  },
  "shadows": {
    "sm": "0 1px 2px rgba(0,0,0,0.05)",
    "md": "0 4px 6px rgba(0,0,0,0.1)",
    "lg": "0 10px 15px rgba(0,0,0,0.1)",
    "xl": "0 20px 25px rgba(0,0,0,0.1)"
  },
  "breakpoints": {
    "sm": "640px",
    "lg": "1024px"
  }
}
```

---

## 9. Best Practices

### Component Usage

**Button Usage:**
```javascript
// ✓ Good
<Button variant="primary">Save</Button>

// ✗ Avoid
<Button variant="primary">Save</Button>
<Button variant="primary">Cancel</Button>  // Use secondary
```

**Form Input Grouping:**
```javascript
// ✓ Good
<div className="flex flex-col gap-3">
  <Input label="Email" />
  <Input label="Password" />
</div>

// ✗ Avoid
<Input label="Email" />
<Input label="Password" style={{ marginTop: '10px' }} />
```

### Color Usage

**Do's:**
- Use Primary for main CTAs
- Use Status colors for feedback
- Test contrast before shipping
- Use accent sparingly

**Don'ts:**
- Don't use Accent for main content
- Don't rely on color alone for meaning
- Don't apply custom colors without design approval

### Typography

**Do's:**
- Maintain heading hierarchy
- Use semibold for emphasis
- Keep body text at 14px minimum
- Use secondary color for helper text

**Don'ts:**
- Don't use multiple font families
- Don't skip heading levels
- Don't underline text (except links)
- Don't use text smaller than 12px for body

### Spacing

**Do's:**
- Use spacing scale (4px multiples)
- Maintain consistent gaps between elements
- Use larger spacing for visual separation

**Don'ts:**
- Don't use arbitrary pixel values
- Don't mix spacing scales
- Don't create visual confusion with inconsistent gaps

### Responsive Design

**Do's:**
- Design mobile-first
- Test on actual devices
- Use responsive classes (sm:, lg:)
- Hide non-essential content on mobile

**Don'ts:**
- Don't assume all users have large screens
- Don't use fixed pixel widths on containers
- Don't forget about landscape orientation

---

## 10. File Structure Reference

```
client/src/
├── components/
│   ├── ui/
│   │   ├── Button.jsx
│   │   ├── Input.jsx
│   │   ├── TextArea.jsx
│   │   ├── Select.jsx
│   │   ├── Checkbox.jsx
│   │   ├── DatePicker.jsx
│   │   ├── PhoneInput.jsx
│   │   ├── LocationInput.jsx
│   │   ├── FileUpload.jsx
│   │   ├── Card.jsx
│   │   ├── Badge.jsx
│   │   ├── DataTable.jsx
│   │   ├── Modal.jsx
│   │   ├── Toast.jsx
│   │   ├── Spinner.jsx
│   │   ├── Stepper.jsx
│   │   └── AutoSaveIndicator.jsx
│   ├── layout/
│   │   ├── DashboardLayout.jsx
│   │   ├── PublicLayout.jsx
│   │   ├── Sidebar.jsx
│   │   └── Topbar.jsx
│   └── [feature-specific components]
├── pages/
│   ├── admin/
│   ├── supplier/
│   ├── customer/
│   └── public/
├── hooks/
├── config/
├── lib/
└── index.css (Global styles & CSS variables)
```

---

## 11. Implementation Guide

### Using Design Tokens

**In JavaScript:**
```javascript
const primaryColor = 'var(--color-primary)';
className={`bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-hover)]`}
```

**In CSS:**
```css
.custom-element {
  background-color: var(--color-primary);
  color: var(--color-text);
  border-radius: var(--radius-md);
  padding: var(--spacing-md);
}
```

### Creating New Components

1. **Follow naming convention:** PascalCase, descriptive name
2. **Use existing tokens:** Colors, spacing, typography
3. **Implement variants:** Provide flexibility for different use cases
4. **Support state management:** Default, hover, active, disabled, error
5. **Add accessibility:** ARIA labels, semantic HTML, focus states
6. **Document props:** Clear prop types and usage examples

### Extending the System

**Adding New Colors:**
- Define in index.css as CSS custom property
- Add to token JSON export
- Document usage guidelines

**Adding New Component:**
- Create in components/ui/ directory
- Implement all states (default, hover, active, disabled)
- Test accessibility (keyboard, screen reader, contrast)
- Document variants and props

---

## 12. Quick Reference Guide

### Common Classes

```
Text Styles:
  text-2xl font-bold      H1/Page Title
  text-lg font-bold       H2/Section Header
  text-base font-semibold H3/Subheading
  text-sm                 Body text
  text-xs                 Caption/Small text

Spacing:
  p-6   Padding (24px all sides)
  px-4  Horizontal padding (16px)
  gap-3 Gap between flex items (12px)
  gap-6 Large gap (24px)

Colors:
  bg-[var(--color-primary)]        Primary background
  text-[var(--color-text)]         Main text
  border-[var(--color-border)]     Border color

Button Sizing:
  h-11  Large button (44px)
  h-10  Standard button (40px)
  h-9   Small button (36px)
```

---

## 13. Changelog & Version History

**Version 1.0** (Current)
- Initial design system documentation
- 15+ UI components documented
- Color system defined
- Typography hierarchy established
- Spacing and layout specifications
- Accessibility guidelines
- Best practices documented

---

## 14. Support & Contact

**Design System Maintainers:**
- For component updates: Development team
- For design questions: Design team
- For accessibility concerns: A11y lead

**Documentation Updates:**
This design system documentation is living and evolves with the product. Regular reviews ensure accuracy and relevance.

---

**Last Updated:** April 2026  
**Version:** 1.0  
**Status:** Active
