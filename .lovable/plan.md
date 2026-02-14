
# Fix Mobile Layout Issues in Admin Group Pages

Based on the screenshots, there are three areas with layout problems on mobile:

## Problem 1: AdminGroupEdit Header (Screenshot 1)
The page title ("קבוצה חדשה") and action buttons ("ביטול", "שמור") are on the same row, causing text overlap and cramped layout on small screens.

**Fix in `src/pages/AdminGroupEdit.tsx` (lines 811-825):**
- Stack the title and buttons vertically on mobile using `flex-col` on small screens
- Title takes full width on mobile, buttons below it
- On desktop (`md:`), keep the current side-by-side layout
- Reduce title size on mobile from `text-3xl` to `text-2xl`

## Problem 2: VIP Tent Planner Cards (Screenshot 2)
The 2-column grid on mobile (`grid-cols-2`) makes each VIP tent card too narrow. The bed toggles (1/2/3), the "+מיטה" switch, gender dropdown, and "סה״כ" text are all cramped and misaligned.

**Fix in `src/components/VIPTentPlanner.tsx`:**
- Change grid from `grid-cols-2 sm:grid-cols-3` to `grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4` so cards go full-width on phones
- Increase card internal padding from `p-3` to `p-4`
- Make the ToggleGroup items slightly larger on mobile (from `h-7 w-7` to `h-8 w-8`)
- Ensure the summary badges ("נדרש" / "מתוכנן") stack vertically on mobile instead of wrapping awkwardly

## Problem 3: AdminGroups List Header (Screenshot 3)
The "קבוצות / הזמנות" title with the settings icon and subtitle are slightly cramped. The admin nav tab labels may also be tight.

**Fix in `src/components/AdminLayout.tsx`:**
- Reduce the title `h1` from `text-3xl` to `text-2xl` on mobile (keep `md:text-4xl` for desktop)
- Reduce the Settings icon from `w-10 h-10` to `w-8 h-8` on mobile
- Ensure the subtitle text wraps cleanly

---

## Technical Details

### File: `src/pages/AdminGroupEdit.tsx`
Lines 811-825: Change the header flex container to stack on mobile:
```
flex-col md:flex-row md:items-center gap-3 md:justify-between
```
Title: `text-2xl md:text-4xl`, icon: `w-8 h-8 md:w-10 md:h-10`
Buttons: `w-full md:w-auto` with `flex-row-reverse` to keep save button prominent

### File: `src/components/VIPTentPlanner.tsx`
Line 106: Change grid to `grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4`
Line 111: Change padding to `p-4`
Line 145: Change toggle items to `h-8 w-8 text-sm md:h-7 md:w-7 md:text-xs`
Line 89: Change summary flex to `flex-col sm:flex-row`

### File: `src/components/AdminLayout.tsx`
Line 32: Change title to `text-2xl md:text-4xl`
Line 30: Change icon to `w-8 h-8 md:w-10 md:h-10`
