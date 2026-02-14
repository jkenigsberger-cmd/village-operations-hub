

# Block Group Save When Schedule Conflicts Exist

## Problem
Currently the group is saved to the database first, and then the sync process detects conflicts. This means:
- The group record contains schedule items that appear valid but have no matching reservations
- Users see schedule items in the group that were never actually booked
- This creates confusion about what is actually reserved

## Solution: Pre-validate Before Saving

### 1. Add a pre-validation function in `groupSync.ts`
Create a new `preValidateScheduleConflicts` function that:
- Takes the group's schedule items (without needing a saved group)
- For each bookable schedule item, queries `activity_reservations` for the same space + date
- Runs the client-side conflict check (using existing `checkActivityReservationConflict`)
- Excludes the current group's own synced reservations (so editing a group doesn't conflict with itself)
- Returns the list of conflicts (same `SyncConflict[]` format)

### 2. Call pre-validation before saving in `AdminGroupEdit.tsx`
Change the save flow:
- **Before** calling `addGroup` or `updateGroup`, run `preValidateScheduleConflicts`
- If conflicts are found: populate `conflictErrors`, show the alert banner, scroll to schedule section, and **do not save**
- If no conflicts: proceed with saving the group and then run `syncGroupToModules` as before

### 3. Update toast message
Change the conflict toast to: "לא ניתן לשמור – יש התנגשות בלוח הזמנים. תקנו את הפריטים המסומנים."

## Files to modify

| File | Change |
|---|---|
| `src/lib/groupSync.ts` | Add `preValidateScheduleConflicts(scheduleItems, groupName, groupId?)` function that checks conflicts without inserting anything |
| `src/pages/AdminGroupEdit.tsx` | Move conflict check before the save call; block save entirely on conflicts; update toast wording |

## Technical Details

**groupSync.ts** -- new function:
- Query existing `activity_reservations` for each bookable item's space_id + date
- Use `checkActivityReservationConflict` from `reservationConflict.ts` for overlap detection
- When editing an existing group, pass `excludeGroupId` so the group's own old reservations don't trigger false conflicts
- Returns `SyncConflict[]` with `scheduleItemId` populated

**AdminGroupEdit.tsx** -- save handler changes:
- Before line 620 (the `dataToSave` construction), call `preValidateScheduleConflicts`
- If conflicts exist: set `conflictErrors`, show error toast, return early (no save)
- If no conflicts: save group, then sync as before
- The existing conflict handling after sync remains as a safety net but should rarely trigger

