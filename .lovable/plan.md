

# Fix Admin Mobile Navigation Layout

## Problems Identified
1. **Admin sub-navigation tabs** (הכנסות, הוצאות, עובדים חיצוניים, etc.) are squeezed together with overlapping text on mobile. The tabs don't have enough spacing and the horizontal scroll isn't working properly.
2. **Breadcrumb navigation** at the top has items crowding together on mobile screens.

## Solution

### 1. Fix Admin Sub-Navigation Tabs (AdminLayout.tsx)
- Add `flex-shrink-0` to each tab button so they maintain their full width instead of compressing
- Increase horizontal padding on mobile for better touch targets and readability
- Ensure the scrollable container works properly with `min-w-max` on the inner flex container

### 2. Fix Breadcrumb Navigation (BreadcrumbNav.tsx)
- Add `flex-wrap` to allow breadcrumb items to wrap on narrow screens
- Reduce text size on mobile for breadcrumbs so they fit better

### Technical Details

**AdminLayout.tsx** - Update the nav tab styles:
- Add `flex-shrink-0` to each `NavLink` so tabs don't compress
- Add `min-w-max` to the inner flex container to force horizontal scroll instead of text overlap
- Slightly increase padding for mobile readability

**BreadcrumbNav.tsx** - Update breadcrumb container:
- Add `flex-wrap` so items wrap instead of overlapping
- Add smaller text on mobile with `text-base md:text-lg`

These are minimal CSS-only changes that follow the existing patterns in the codebase (similar approach used in `MobileBottomNav`).

