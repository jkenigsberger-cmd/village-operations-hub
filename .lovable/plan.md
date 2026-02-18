
# Fix: Maintenance Notifications Not Showing in Facilities Alert Section

## Root Cause

Two issues found:

### Issue 1: General maintenance tasks missing from the "Facilities Alert" check
In `src/pages/Index.tsx`, line 1507, the condition that decides whether to show the maintenance section inside the "Facilities Alert" view does NOT include general maintenance tasks:

```
(maintenanceItems.length > 0 || activitySpaceMaintenanceItems.length > 0 || vipMaintenanceTasks.length > 0)
```

The `generalMaintenanceTasks.length > 0` check is **missing**. So when only a general maintenance report exists (which is exactly the current state of the database), the Facilities Alert section shows completely empty -- no heading, no "View All" button, nothing.

### Issue 2: The "Facilities Alert" section is a stub
When you tap the "Facilities Alert" tile on the overview (which correctly shows the count badge), it navigates to the `facilities-alert` section. But that section only shows a title and a single "View All" button linking to the full `maintenance` tab. It does not render any maintenance items inline, making it feel like the notifications are missing.

## Fix Plan

### File: `src/pages/Index.tsx`

**Change 1** -- Add `generalMaintenanceTasks` to the visibility condition (line 1507):
```
(maintenanceItems.length > 0 || activitySpaceMaintenanceItems.length > 0 || vipMaintenanceTasks.length > 0 || generalMaintenanceTasks.length > 0)
```

**Change 2** -- Make the "Facilities Alert" tile on the overview navigate directly to the `maintenance` tab instead of the intermediate `facilities-alert` stub. Change line 506 from:
```
onClick={() => setActiveSection('facilities-alert')}
```
to:
```
onClick={() => setActiveSection('maintenance')}
```

This way, clicking the alert tile takes the user directly to where all maintenance items (bathrooms, activity spaces, VIP, and general) are listed with full detail and resolve buttons. No intermediate stub page.

## What stays unchanged
- The maintenance tab rendering (bathrooms, activity spaces, VIP, general sections) -- all correct and complete
- The counting logic (totalMaintenanceCount) -- already correctly includes all 4 categories
- The mobile nav badge -- already correct
- All existing resolve/report flows -- untouched
- Database schema and realtime subscriptions -- untouched

## Technical Details
- Single file change: `src/pages/Index.tsx`
- Two line edits (lines 506 and 1507)
- The `facilities-alert` section code can remain as-is (dead code, no harm) or be removed later in cleanup
