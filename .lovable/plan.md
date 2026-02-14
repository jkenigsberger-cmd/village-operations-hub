

# Split Admin Navigation into Two Sections

## Overview
Currently all 5 admin tabs (קבוצות, הכנסות, הוצאות, עובדים חיצוניים, דוחות) are crammed into one horizontal scrolling nav bar, which looks bad on mobile. The solution is to separate them into two distinct sections accessible from Settings.

## Changes

### 1. Settings Page (`src/pages/Settings.tsx`)
Add a second tile for "הנהלה" (Management) below the existing "ניהול קבוצות והזמנות" tile. This new tile will link to `/admin/income` (the first financial page) and include a description about finances, reports, and external workers.

### 2. AdminLayout (`src/components/AdminLayout.tsx`)
Make the nav items configurable by accepting a `section` prop (`"groups"` or `"management"`):
- **groups section**: Shows only the "קבוצות / הזמנות" tab (single tab, no clutter)
- **management section**: Shows הכנסות, הוצאות, עובדים חיצוניים, דוחות

The breadcrumb will also update accordingly:
- Groups: הגדרות > קבוצות / הזמנות
- Management: הגדרות > הנהלה

The header icon will change per section (Users for groups, Settings/Briefcase for management).

### 3. Page Updates
- `AdminGroups.tsx`: Pass `section="groups"` to AdminLayout
- `AdminIncome.tsx`, `AdminExpenses.tsx`, `AdminOutsourced.tsx`, `AdminReports.tsx`: Pass `section="management"` to AdminLayout

### 4. No Route Changes
All existing routes (`/admin/groups`, `/admin/income`, etc.) stay the same. Only the nav tabs shown within AdminLayout change based on context.

## Technical Details

### File: `src/components/AdminLayout.tsx`
- Add `section?: 'groups' | 'management'` prop to `AdminLayoutProps`
- Define two separate nav item arrays:
  - `groupNavItems`: just `[{ path: '/admin/groups', label: 'קבוצות / הזמנות', icon: Users }]`
  - `managementNavItems`: `[income, expenses, outsourced, reports]`
- Select the correct array based on `section` prop
- Update breadcrumb label based on section

### File: `src/pages/Settings.tsx`
- Add a new "הנהלה" section tile (with Briefcase icon from lucide) that navigates to `/admin/income`
- Import `Briefcase` from lucide-react

### Files: `AdminGroups.tsx`
- Add `section="groups"` prop to `<AdminLayout>`

### Files: `AdminIncome.tsx`, `AdminExpenses.tsx`, `AdminOutsourced.tsx`, `AdminReports.tsx`
- Add `section="management"` prop to `<AdminLayout>`

## Result
- Settings page shows two clear entry points: "קבוצות / הזמנות" and "הנהלה"
- Each section only shows its own relevant tabs in the nav bar
- Mobile nav is no longer crowded -- groups page has just 1 tab, management has 4 tabs (much better than 5 all together)
- No database or routing changes needed
