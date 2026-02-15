

# Fix: Last VIP Config Cannot Be Assigned Due to Over-Strict Guard

## Problem

The last VIP config cannot be assigned to a tent. The error says:
```
Not enough remaining staff for VIP assignment: need 3, have 2 (staffCount=27, alreadyAssigned=25)
```

The group has `staffCount = 27` but the total planned beds across all 9 VIP configs sum to more than 27 (e.g., one config has an extra bed making the total 28). The dynamic guard correctly computes `27 - 25 = 2` remaining, but the last config needs 3 beds, so it gets blocked.

## Root Cause

The `remainingStaff` guard in `assignVIPConfig` prevents assignment when the total planned beds across all VIP configs exceeds `staffCount`. But the user explicitly created these configs -- if they added an extra bed, they intended for all configs to be assignable. The guard is too strict.

## Solution

Remove the `remainingStaff` guard check entirely from `assignVIPConfig`. The only validation needed is whether the physical tent is available (not occupied by another group). The user already defined the configs they want -- the system should not second-guess the totals.

The `remainingStaff` field will still be updated for display purposes on the summary counters, but it will no longer block assignment.

## Technical Change

### File: `src/hooks/useGroupAllocation.ts` (lines 621-631)

Remove the dynamic remaining check block and simplify:

**Before:**
```typescript
// Dynamic check: compute remaining staff from actual assigned configs
const alreadyAssignedBeds = group.vipTentConfigs
  .filter(c => c.assignedTentCode && c.id !== configId)
  .reduce((sum, c) => sum + c.bedsPlanned + (c.hasExtraBed ? 1 : 0), 0);
const staffCount = group.staffCount ?? 0;
const dynamicRemaining = staffCount - alreadyAssignedBeds;

if (bedsBeingAssigned > dynamicRemaining) {
  console.warn(`Not enough remaining staff...`);
  return false;
}
```

**After:**
```typescript
// Compute remaining staff for display purposes (no blocking)
const alreadyAssignedBeds = group.vipTentConfigs
  .filter(c => c.assignedTentCode && c.id !== configId)
  .reduce((sum, c) => sum + c.bedsPlanned + (c.hasExtraBed ? 1 : 0), 0);
const staffCount = group.staffCount ?? 0;
const dynamicRemaining = staffCount - alreadyAssignedBeds;
```

The guard `if (bedsBeingAssigned > dynamicRemaining)` and its `console.warn` + `return false` are removed. The `dynamicRemaining` variable is kept since it is used on line 639 to compute `newRemainingStaff` for the counter display.

### No other files change

Only the guard logic in `assignVIPConfig` needs updating.

