

# Fix: Include Common Spaces in Facilities Alert Detail View

## Problem

The "התראת מתקנים" dashboard tile badge correctly counts common space (activity space) maintenance issues via `totalMaintenanceCount`, but when you click into the detail view, the condition on line 1382 only checks for `maintenanceItems` (bathrooms/showers) and `vipMaintenanceTasks` -- it completely ignores `activitySpaceMaintenanceItems`. So if a bunker or dining hall is broken, you see the red badge but the detail section appears empty.

## Fix

### File: `src/pages/Index.tsx`

**Line 1382** -- Add `activitySpaceMaintenanceItems` to the display condition:
```
// Before:
{(maintenanceItems.length > 0 || vipMaintenanceTasks.length > 0) &&

// After:
{(maintenanceItems.length > 0 || activitySpaceMaintenanceItems.length > 0 || vipMaintenanceTasks.length > 0) &&
```

**Line 1386** -- Include activity spaces in the count:
```
// Before:
{HE.nav.maintenance} ({maintenanceItems.length + vipMaintenanceTasks.length})

// After:
{HE.nav.maintenance} ({totalMaintenanceCount})
```

These are two small line changes in the same file. No new components or files needed.

| File | Change |
|------|--------|
| `src/pages/Index.tsx` | Add `activitySpaceMaintenanceItems` to the condition on line 1382; use `totalMaintenanceCount` in the count display on line 1386 |
