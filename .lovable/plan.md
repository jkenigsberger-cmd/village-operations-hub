

# Fix VIP Allocation Bug: remainingStaff Drifts When Editing Group Configs

## Problem

When you create or edit a group and add/change VIP tent configs (especially adding extra beds), the `remainingStaff` counter stored in the database does not get recalculated. The allocation page then uses this stale counter to decide if you can assign a VIP config to a tent -- and blocks the assignment when the numbers don't match.

**Example scenario:**
- Group has `staffCount = 27`, 9 VIP configs each with 3 beds = 27 planned
- You go back to the group edit form and toggle "extra bed" on one config, making it 3+1 = 4
- Total planned is now 28, but `remainingStaff` is still based on the old calculation
- When assigning the last config, the system says "Not enough remaining staff"

## Root Cause

Two issues work together:

1. **AdminGroupEdit.tsx** (line 646): When saving an existing group, it uses the old stored `formData.remainingStaff` instead of recalculating from current configs
2. **useGroupAllocation.ts** (lines 621-626): The `assignVIPConfig` function trusts the stored `remainingStaff` counter as absolute truth, rather than computing it dynamically from the actual assigned configs

## Solution

Fix both the save logic and the allocation check:

### 1. `src/pages/AdminGroupEdit.tsx` -- Recalculate on save

When saving an existing group, compute `remainingStaff` dynamically:

```
remainingStaff = staffCount - (sum of beds in already-assigned VIP configs)
```

This ensures that adding/removing extra beds or changing `bedsPlanned` in the edit form always produces a correct counter on save.

### 2. `src/hooks/useGroupAllocation.ts` -- Dynamic check in assignVIPConfig

Replace the stored-counter check with a live calculation:

- Compute `alreadyAssignedBeds` = sum of `bedsPlanned + hasExtraBed` for configs that already have an `assignedTentCode`
- `dynamicRemaining = staffCount - alreadyAssignedBeds`
- Use `dynamicRemaining` for the guard check instead of `group.remainingStaff`
- After assignment, set `remainingStaff = dynamicRemaining - bedsBeingAssigned`

### 3. `src/hooks/useGroupAllocation.ts` -- Same fix in unassignVIPConfig

After unassigning, recalculate `remainingStaff` from the updated configs rather than adding to the stored value. This prevents accumulation errors.

## Files Changed

| File | Change |
|------|--------|
| `src/pages/AdminGroupEdit.tsx` | Recalculate `remainingStaff` on save for existing groups based on assigned VIP configs |
| `src/hooks/useGroupAllocation.ts` | Replace stored counter checks with dynamic calculation in both `assignVIPConfig` and `unassignVIPConfig` |

