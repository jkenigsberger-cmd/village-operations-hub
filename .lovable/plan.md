
# Add שיבוצים (Allocations) to Mobile Navigation

## Problem Identified
The mobile bottom navigation (`MobileBottomNav.tsx`) is missing the "שיבוצים" (Allocations) section that exists in the desktop menu. This is an important feature for staff to manage pending group assignments.

## Solution
Add the allocations item to the mobile bottom navigation with its notification badge showing the count of pending allocations.

## Changes Required

### File: `src/components/MobileBottomNav.tsx`

**Current state (5 items):**
- overview (סקירה)
- calendar (יומן)
- neighborhoods (שכונות)
- housekeeping (ניקיון)
- maintenance (תחזוקה)

**Updated state (6 items):**
- overview (סקירה)
- calendar (יומן)
- allocations (שיבוצים) ← **NEW**
- neighborhoods (שכונות)
- housekeeping (ניקיון)
- maintenance (תחזוקה)

**Technical changes:**
1. Import `ClipboardList` icon from lucide-react
2. Add `allocationsCount` prop to show pending allocations badge
3. Add the allocations nav item between calendar and neighborhoods
4. Display the count badge when there are pending allocations

### File: `src/pages/Index.tsx`

Pass the `pendingAllocationGroups.length` count to the `MobileBottomNav` component so the badge displays correctly on mobile.

## Visual Result
The mobile bottom navigation will have 6 items instead of 5, with the שיבוצים section accessible via a single tap. When there are pending allocations, a red badge will show the count (matching the desktop behavior).
