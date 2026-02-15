
# Fix: VIP Tent Unassignment Not Reflecting Immediately

## Problem

When you unassign (delete) a VIP tent in the allocation page, the VIP tent grid and assigned configs list don't update immediately. You have to wait for the realtime subscription to eventually refresh the data.

## Root Cause

The `handleUpdate` callback in `GroupAllocation.tsx` only increments a `refreshKey` counter to force a remount of `VIPAllocationTab`. But the `group` prop passed to it comes from `groups.find(...)`, which still holds stale data because the realtime subscription hasn't fired yet. So the component remounts with the old group data.

```text
User clicks "Release tent"
  -> unassignVIPConfig() writes to DB (async, completes)
  -> onUpdate() called -> refreshKey++ -> VIPAllocationTab remounts
  -> BUT groups array still has OLD data (realtime hasn't arrived yet)
  -> Component shows stale state
  -> ~1-2 seconds later, realtime fires, groups update, UI finally refreshes
```

## Solution

Two small changes:

### 1. `src/hooks/useAdminGroups.ts` -- Expose `loadData` as `refetchGroups`

Add `loadData` to the returned object so callers can trigger an immediate data refetch:

```typescript
return {
  groups, activeGroups, archivedGroups, isLoading,
  addGroup, updateGroup, deleteGroup, getGroup,
  getDayUseGroupsForDate, addLinkedSpaceReservation, addLinkedKitchenSlot,
  archiveGroup, restoreGroup,
  refetchGroups: loadData,  // <-- NEW
};
```

### 2. `src/pages/GroupAllocation.tsx` -- Await refetch before remounting

Update `handleUpdate` to first refetch the groups data, then increment the key:

```typescript
const { groups, updateGroup, refetchGroups } = useAdminGroups();

const handleUpdate = async () => {
  await refetchGroups();       // Wait for fresh data from DB
  setRefreshKey(prev => prev + 1);  // Then remount with updated group
};
```

This ensures that by the time `VIPAllocationTab` remounts, the `group` prop already reflects the latest database state -- no waiting for the realtime subscription.

## Files Changed

| File | Change |
|------|--------|
| `src/hooks/useAdminGroups.ts` | Expose `loadData` as `refetchGroups` in the return object |
| `src/pages/GroupAllocation.tsx` | Destructure `refetchGroups`, make `handleUpdate` async and await the refetch before incrementing key |
