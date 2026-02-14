
# Fix: Surface Conflict Errors Clearly to Users

## Problem
When saving a group with schedule items that conflict with existing reservations, the system:
1. Correctly detects and blocks conflicting reservations (server-side RPC works)
2. Shows toast warnings -- but immediately navigates away to `/admin/groups` (line 649), so the user never sees them
3. The group is saved with schedule items that look like they were booked, but the actual reservations were silently skipped

The user thinks the reservation was created, but it was not.

## Solution

### 1. Stop navigating away when there are conflicts
In `AdminGroupEdit.tsx`, when `syncResult.conflicts.length > 0`:
- Do NOT call `navigate('/admin/groups')` immediately
- Instead, stay on the page and show a persistent conflict summary
- Mark the conflicting schedule items visually with red borders and inline error messages

### 2. Add conflict state tracking to schedule items
- Add a `conflictErrors` state map (`Record<string, string>`) keyed by schedule item ID
- After sync, populate this map with conflict messages for each failed item
- Render inline error text below each conflicting schedule item: "תפוס בזמן הזה (כולל 15 דק׳ ניקיון). בחרו שעה אחרת."
- Red border on the conflicting item's container

### 3. Return item-level conflict info from syncGroupToModules
- Update `SyncConflict` type in `groupSync.ts` to include the schedule item's `id` field
- Pass the `item.id` through so `AdminGroupEdit` can map conflicts back to specific schedule items

### 4. Show a persistent alert banner (not just a toast)
- When conflicts exist after save, show an Alert component at the top of the schedule section:
  "חלק מהשריונים לא נשמרו בגלל התנגשות בזמן. תקנו את הפריטים המסומנים ושמרו שוב."
- Add a "חזור לרשימה" button so the user can still navigate away manually after reviewing

## Files to modify

| File | Change |
|---|---|
| `src/lib/groupSync.ts` | Add `scheduleItemId` to `SyncConflict` interface; pass `item.id` when creating conflict entries |
| `src/pages/AdminGroupEdit.tsx` | Add `conflictErrors` state; after sync, populate it and conditionally block navigation; render inline errors on conflicting items; show persistent alert banner |

## Technical Details

**groupSync.ts changes:**
- `SyncConflict` gets a new field: `scheduleItemId?: string`
- In the loop at line 137, pass `item.id` to the conflict entry

**AdminGroupEdit.tsx changes:**
- New state: `const [conflictErrors, setConflictErrors] = useState<Record<string, string>>({});`
- After `syncGroupToModules` returns, if conflicts exist:
  - Build the error map from `syncResult.conflicts` using `scheduleItemId` as key
  - Call `setConflictErrors(errorMap)`
  - Do NOT call `navigate()`
  - Show persistent alert
- If no conflicts, navigate as before
- In the schedule item render (around line 1197), check `conflictErrors[item.id]` and show red border + inline error text
- Clear `conflictErrors` when user modifies a conflicting item (in `updateScheduleItem`)
