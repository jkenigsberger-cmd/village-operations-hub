

# Hide Checked-Out Groups from Allocation Tab

## Problem

Groups that have already checked out (their `endDate` is in the past) still appear in the Sleeping/Allocation tab. Once a group has departed, there's no reason to keep showing it in the allocation view.

## Solution

Add a date filter to `getSleepingGroups` in `src/lib/allocationStatus.ts` to exclude groups whose `endDate` is strictly before today.

## Technical Change

### File: `src/lib/allocationStatus.ts` (function `getSleepingGroups`, line 111-114)

**Before:**
```typescript
export function getSleepingGroups(groups: GroupRecord[]): GroupRecord[] {
  return groups.filter(g => 
    g.groupType !== 'יום ללא לינה' && !g.isArchived
  );
}
```

**After:**
```typescript
export function getSleepingGroups(groups: GroupRecord[]): GroupRecord[] {
  const todayStr = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  return groups.filter(g => 
    g.groupType !== 'יום ללא לינה' && !g.isArchived && g.endDate >= todayStr
  );
}
```

This uses the existing "Hotel Rule" logic: a group is still relevant on its checkout day (`endDate === today`) since checkout happens during that day. Only groups whose `endDate` is strictly before today are hidden.

Similarly, update `groupNeedsAllocation` to also skip past groups from the notification section:

### Same file, function `groupNeedsAllocation` (line 93-105)

Add the same date check so checked-out groups don't appear in the "Pending Allocation" notifications on the overview tab either.

```typescript
export function groupNeedsAllocation(
  group: GroupRecord,
  allocations: AllocationRecord[]
): boolean {
  if (group.groupType === 'יום ללא לינה') return false;
  if (group.isArchived) return false;
  const todayStr = new Date().toISOString().split('T')[0];
  if (group.endDate < todayStr) return false;
  
  const status = computeAllocationStatus(group, allocations);
  return status.status !== 'fully_allocated';
}
```

## Files Changed

| File | Change |
|------|--------|
| `src/lib/allocationStatus.ts` | Add `endDate >= today` filter to `getSleepingGroups` and `groupNeedsAllocation` |

