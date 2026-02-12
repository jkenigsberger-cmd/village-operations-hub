

# Add New Common Spaces to Group Schedule & Sync

## What Changes

The new bunkers (1, 2, 4, 5) need to appear as location options when creating/editing group schedules, and must sync correctly to the reservation calendar.

## Changes Required

### 1. Update `src/types/adminGroups.ts` - Add new locations

**SCHEDULE_LOCATIONS** array: Add the 4 new bunkers in numeric order:
- `'ממ״ד 1'`, `'ממ״ד 2'`, `'ממ״ד 4'`, `'ממ״ד 5'`

**SPACE_ID_MAP** object: Add mappings for the new bunkers:
- `'ממ״ד 1': 'bunker_1'`
- `'ממ״ד 2': 'bunker_2'`
- `'ממ״ד 4': 'bunker_4'`
- `'ממ״ד 5': 'bunker_5'`

### 2. Update `src/lib/groupSync.ts` - Add new bookable spaces

**BOOKABLE_SPACES** array: Add the 4 new bunker names so that schedule items at these locations trigger reservation creation and conflict detection.

### No other changes needed

- The group form (`AdminGroupEdit.tsx`) already renders from `SCHEDULE_LOCATIONS` dynamically, so new entries appear automatically.
- The sync engine (`syncGroupToModules`) already uses `SPACE_ID_MAP` for lookups, so new mappings work automatically.
- Calendar display already reads from `activity_reservations` table, so synced bookings appear automatically.
- Conflict detection logic is generic and applies to all spaces in `BOOKABLE_SPACES`.

## Files Modified

| File | Change |
|------|--------|
| `src/types/adminGroups.ts` | Add 4 entries to `SCHEDULE_LOCATIONS` and `SPACE_ID_MAP` |
| `src/lib/groupSync.ts` | Add 4 entries to `BOOKABLE_SPACES` |

