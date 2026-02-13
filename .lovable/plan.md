

# Sync Mobile Bottom Nav with Desktop Navigation

## Problem

The mobile bottom navigation bar shows only 7 of the 10 sections available on desktop, and some icons differ. This creates confusion when switching between devices.

**Missing from mobile:**
- Facilities (מתקנים משותפים) - Flame icon
- Bathrooms (שירותים ומקלחות) - ShowerHead icon
- Notes (הערות חשובות) - StickyNote icon

**Icon mismatches:**
- Desktop uses `Flame` for facilities, mobile has no equivalent

## Solution

Update `MobileBottomNav.tsx` to include all 10 sections with the same icons and labels as the desktop menu, and pass the missing badge counts.

## Changes

### 1. `src/components/MobileBottomNav.tsx`

Update the `navItems` array to match all 10 desktop items in the same order:

| # | Key | Label | Icon |
|---|-----|-------|------|
| 1 | overview | דף הבית | Home |
| 2 | sleeping | לינה | Moon |
| 3 | calendar | לוח שנה | CalendarDays |
| 4 | allocations | שיבוצים | ClipboardList |
| 5 | neighborhoods | שכונות | Tent |
| 6 | facilities | מתקנים משותפים | Flame |
| 7 | bathrooms | שירותים ומקלחות | ShowerHead |
| 8 | maintenance | תחזוקה | Wrench |
| 9 | housekeeping | משק בית | Sparkles |
| 10 | notes | הערות חשובות | StickyNote |

- Import `Flame`, `ShowerHead`, `StickyNote` from lucide-react (replacing unused icons)
- Add `bathroomsCount` and `notesCount` to the props interface (optional, default 0) so badges can be shown for bathrooms too
- Labels will be shortened slightly for mobile readability (e.g., "מתקנים" instead of "מתקנים משותפים", "שירותים" instead of "שירותים ומקלחות", "הערות" instead of "הערות חשובות")

### 2. `src/pages/Index.tsx`

Pass the `bathroomsCount` prop (count of facilities needing attention) to the `MobileBottomNav` component.

## Technical Notes

- The horizontal scrolling already implemented will accommodate 10 items comfortably
- No structural changes needed -- only updating the items list, icons, and one extra prop
- Desktop menu item order is preserved exactly

