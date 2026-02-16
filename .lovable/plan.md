
# Remove Housekeeping from the "התראת מתקנים" Dashboard Tile

## What will change

The "התראת מתקנים" (Facilities Alert) tile on the dashboard overview and its detail section will only show **maintenance** items (broken/needs repair). Housekeeping (cleaning) notifications will be removed from this tile since they belong in the dedicated Housekeeping tab.

## Technical Changes

### File: `src/pages/Index.tsx`

1. **Dashboard tile (lines 460-482)**: Remove `totalHousekeepingItems` from the count and condition -- only use `totalMaintenanceCount`

2. **Subtitle text (line 474)**: Change from `HE.stats.maintenanceHousekeeping` ("תחזוקה ומשק בית") to just maintenance-related text (e.g., `HE.nav.maintenance`)

3. **Facilities-alert detail section (lines 1397-1411)**: Remove the entire Housekeeping sub-section that shows housekeeping count and "View All" button

### File: `src/lib/translations.ts`

No changes needed -- the existing `HE.nav.maintenance` label can be reused for the subtitle.

### Summary

| File | Change |
|------|--------|
| `src/pages/Index.tsx` | Remove housekeeping count from facilities alert tile badge and condition; remove housekeeping sub-section from facilities-alert detail view; update subtitle to maintenance-only |
