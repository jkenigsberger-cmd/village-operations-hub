

# Fix: Read VIP Assignments from Group's vipTentConfigs (Not Just Allocations Table)

## Root Cause

The VIP allocation flow (`assignVIPConfig` in `useGroupAllocation.ts`) stores VIP tent assignments in **two places**:
1. `groups.vip_tent_configs` JSON column (with `assignedTentCode` field) -- this is the primary source
2. `tents` table (setting `group_name`, dates on the physical tent)

It does **NOT** write to the `allocations` table for VIP tents.

However, `useGroupStays` only looks at the `allocations` table (filtering by `allocationType === 'VIP_TENT'`), which is empty for this group. That's why VIP shows as "not allocated" even though tents 80 and 89 are assigned.

## Fix

### File: `src/hooks/useGroupStays.ts`

Change the VIP data source from the `allocations` table to the `groups.vip_tent_configs` JSON field:

- Instead of iterating `allocations.filter(a => a.allocationType === 'VIP_TENT')`, iterate over each group's `vipTentConfigs` array
- Only include configs where `assignedTentCode` is set (meaning the tent is actually assigned)
- Calculate `staffTotal` from the configs' `bedsPlanned` + `hasExtraBed`
- Build the `vipTents` array from assigned tent codes

This way, the hook reads from the same source that the allocation UI writes to.

### What changes in the code

Replace the "VIP allocations" section (currently iterating `allocations.filter(...)`) with:

```typescript
// 2) VIP from group's vipTentConfigs
groups.forEach(group => {
  if (archivedGroupNames.has(group.groupName)) return;
  const configs = group.vipTentConfigs || [];
  const assignedConfigs = configs.filter(c => c.assignedTentCode);
  if (assignedConfigs.length === 0) return;

  const entry = getOrCreate(group.id, group.groupName, group.startDate, group.endDate);
  assignedConfigs.forEach(config => {
    const beds = config.bedsPlanned + (config.hasExtraBed ? 1 : 0);
    entry.vipTents.set(config.assignedTentCode, {
      tentNumber: config.assignedTentCode,
      bedsAssigned: beds,
    });
    entry.staffTotal += beds;
  });
});
```

### File: `src/components/MasterCalendar.tsx`

Same fix applies here if it also reads VIP from the allocations table -- update to use the `allGroupStays` data from `useGroupStays` (which will now be correct).

### No other changes needed

- The `allocations` table dependency can be removed from `useGroupStays` if it's only used for VIP (neighborhood data comes from `neighborhood_reservations`)
- The `useSupabaseAllocations` hook remains unchanged -- it's still used by other parts of the app
- No database changes, no new tables

