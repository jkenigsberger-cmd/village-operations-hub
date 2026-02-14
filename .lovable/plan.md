

# Fix: Wrong "Booked by Other Group" Message for Self-Allocated Neighborhoods

## Root Cause

Two issues combine to produce the wrong error message:

1. **Fragile self-exclusion**: `isNeighborhoodAvailableForGroup` identifies the group's own `neighborhood_reservations` by comparing `group_name` strings (line 450). The `neighborhood_reservations` table lacks a `group_id` column. If the group record hasn't loaded yet (race condition) or was renamed after the reservation was created, the name comparison fails -- and the group's own reservation looks like a conflict from "another group."

2. **Wrong check order in click handler**: `handleNeighborhoodClick` checks availability BEFORE checking if the neighborhood is already allocated to this group. So the misleading "booked by other group" error fires before the correct "already allocated" message has a chance.

## Fix

### 1. `handleNeighborhoodClick` in `ParticipantAllocationTab.tsx`
Swap the order of checks: check `existingAllocation` (is this neighborhood already allocated to this group?) FIRST, before checking availability. This ensures the correct message appears.

### 2. `isNeighborhoodAvailableForGroup` in `useGroupAllocation.ts`
Make self-exclusion robust by cross-referencing with the `allocations` table (which HAS `group_id`). Before treating a `neighborhood_reservation` as a conflict, check if there's an allocation record linking it to the current group. This eliminates reliance on fragile name matching.

Logic change:
```text
for each neighborhood_reservation:
  // Primary: check if this group owns a matching allocation for this neighborhood
  if allocations has record with groupId=thisGroup AND resourceId=thisNeighborhood -> skip (self)
  // Fallback: also skip if group_name matches (backward compat)
  if res.group_name === groupName -> skip
  // Otherwise, check date overlap -> conflict
```

## Files to modify

| File | Change |
|---|---|
| `src/components/ParticipantAllocationTab.tsx` | Move `existingAllocation` check before the availability check in `handleNeighborhoodClick` |
| `src/hooks/useGroupAllocation.ts` | In `isNeighborhoodAvailableForGroup`, add allocation-based self-exclusion before the `group_name` check |

