
# Fix: Tents Always Return to Neutral When Group Leaves

## Problem

When a VIP tent allocation is removed (or a group is unassigned), the physical tent record in the database sometimes retains stale `check_in_date`, `check_out_date`, and `gender` fields even though the `group_name` is cleared. This causes "ghost" colors on the neighborhood map.

**Current stale data:** VIP 81 has dates (2026-02-17 to 2026-02-18) and gender (FEMALE) but no group_name.

## What Will Change

### 1. Fix `removeAllocation` for VIP tents (code fix)

**File:** `src/hooks/useGroupAllocation.ts`

The `removeAllocation` function currently handles NEIGHBORHOOD allocations (clears neighborhood_reservations) but does nothing to the physical tent when a VIP_TENT allocation is removed. We will add tent cleanup logic:

- Find the tent by `resourceId` or `resourceLabel`
- Clear `group_name`, `check_in_date`, `check_out_date`, `gender`
- Reset reserved beds to FREE
- Also clear `vip_tent_configs` entry for the group

### 2. Harden `hasReservation` check (code fix)

**Files:** `src/pages/Neighborhood.tsx`, `src/components/NeighborhoodMiniMap.tsx`, `src/components/TentCard.tsx`

Currently `hasReservation` only checks for valid dates. We will also require `groupName` to be present:

```
hasReservation = !!(
  tent.checkInDate && tent.checkOutDate && tent.groupName &&
  getBookingStatus(...)
)
```

This acts as a safety net so even if stale dates remain, no colors appear without an assigned group.

### 3. Clean up existing stale data (data fix)

Run a one-time database update to clear VIP 81's orphaned fields:

```sql
UPDATE tents
SET check_in_date = NULL, check_out_date = NULL, gender = 'MIXED'
WHERE is_vip = true
  AND group_name IS NULL
  AND (check_in_date IS NOT NULL OR check_out_date IS NOT NULL);
```

## Summary

- **2 code files** modified (useGroupAllocation.ts + Neighborhood.tsx and related)
- **1 data cleanup** query
- No database schema changes
- All future tent releases (via unassign, remove allocation, or group delete) will fully reset the tent to neutral
