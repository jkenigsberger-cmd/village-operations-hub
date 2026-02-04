# Group Data Synchronization - COMPLETED

## Summary
Implemented idempotent synchronization from Admin Groups to Kitchen and Common Spaces modules.

## Changes Made

### 1. New Types Added
- **TimeSlot** (src/types/kitchen.ts): Added `source`, `groupId`, `groupName` fields
- **ActivityReservation** (src/types/village.ts): Added `source`, `groupId`, `status` fields

### 2. New Module: src/lib/groupSync.ts
- `syncGroupToModules(group)`: Idempotent sync that:
  1. Removes all existing records with `source='groupSync'` AND `groupId=group.id`
  2. Creates new kitchen slots from `mealsPlan`
  3. Creates new space bookings from `scheduleItems` (with conflict detection)
- `removeSyncedRecordsForGroup(groupId)`: Cleanup on group delete

### 3. Integration in AdminGroupEdit.tsx
- On group save, calls `syncGroupToModules()` 
- Shows toast warnings for booking conflicts
- Shows sync summary (X meals, Y space bookings)

### 4. Calendar Updates (MasterCalendar.tsx)
- Added lodging group arrival/departure markers
- Excluded archived groups from day-use events
- Calendar derives all events from existing stores (no separate calendar storage)

### 5. Cascade Delete Updated (groupLinkedRecords.ts)
- Added `removeSyncedRecordsForGroup()` call to cascade delete

## Sync Behavior

### On Group SAVE:
1. Remove old synced records for this group
2. Create kitchen slots from `mealsPlan[]` (where pax > 0)
3. Create space bookings from `scheduleItems[]` (for bookable locations)
4. If conflict exists → booking saved with `status='conflict'` + toast warning

### On Group DELETE:
- All records with `source='groupSync'` and matching `groupId` are removed
- Manual records (no source or different source) are preserved

## Bookable Spaces
- אוהל מועד
- ממ״ד 6
- ממ״ד 7
- ממ״ד 8
- חדר אוכל

## Acceptance Criteria Met
✅ Create group with meals → Kitchen shows meals
✅ Edit group, add meal → Kitchen updates without duplicates (idempotent)
✅ Remove meal → Kitchen removes it
✅ Add itinerary item in ממ״ד 7 → Spaces shows booking
✅ If conflict exists → booking flagged, warning shown
✅ Calendar shows arrival + meals + space items from same data
✅ Delete group → synced kitchen + space items removed

## Files Modified
- src/types/kitchen.ts
- src/types/village.ts
- src/lib/groupSync.ts (NEW)
- src/lib/groupLinkedRecords.ts
- src/pages/AdminGroupEdit.tsx
- src/components/MasterCalendar.tsx
