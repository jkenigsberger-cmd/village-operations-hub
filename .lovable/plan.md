

# Fix: Feasibility Check Compares Wrong Scope

## Problem

The warning dialog shows "requested distribution: [8,8,8,8,...26 tents]" vs "available: [8,8,8,8,8,8,8,8]". The check is comparing ALL virtual tents from the group's distribution preference against just one neighborhood's physical tents. Since the group needs 26 tents total but N1 only has 8, the check always fails -- even though the 8 tents in N1 perfectly match 8 of the requested tent sizes.

## Root Cause

In `ParticipantAllocationTab.tsx`, line 143:

```typescript
const requestedSizes = pref.tents.map(t => t.pax).sort((a, b) => b - a);
```

This takes ALL virtual tents from the distribution preference. It should only take enough tents to fill the beds being assigned to this specific neighborhood.

## Fix

In `checkTentFeasibility`, instead of comparing all requested tents, slice only the number of tents that match the neighborhood's tent count. The logic should be:

1. Get the number of physical tents in the neighborhood
2. Take only that many virtual tents from the requested distribution (sorted descending, so we pick the largest ones first -- or better, pick the ones that best match)
3. Compare those against the neighborhood's available capacities

Updated logic in `src/components/ParticipantAllocationTab.tsx` (~lines 132-170):

```typescript
const checkTentFeasibility = (neighborhoodId: NeighborhoodId): { feasible: boolean; requestedSizes: number[]; availableCapacities: number[] } => {
  const pref = group.distributionPreference as DistributionPreference | null;
  if (!pref?.tents || pref.tents.length === 0) {
    return { feasible: true, requestedSizes: [], availableCapacities: [] };
  }

  const neighborhood = state.neighborhoods[neighborhoodId];
  if (!neighborhood) return { feasible: true, requestedSizes: [], availableCapacities: [] };

  // Get available tent capacities (sorted descending)
  const availableCapacities = neighborhood.tentIds
    .map(tentId => state.tents[tentId]?.beds.length || 0)
    .filter(c => c > 0)
    .sort((a, b) => b - a);

  // Only compare as many requested tents as this neighborhood has physical tents
  const allRequestedSizes = pref.tents.map(t => t.pax).sort((a, b) => b - a);
  const requestedSizes = allRequestedSizes.slice(0, availableCapacities.length);

  // Greedy descending match
  const usedIndices = new Set<number>();
  let feasible = true;

  for (const reqSize of requestedSizes) {
    let matched = false;
    for (let i = 0; i < availableCapacities.length; i++) {
      if (!usedIndices.has(i) && availableCapacities[i] >= reqSize) {
        usedIndices.add(i);
        matched = true;
        break;
      }
    }
    if (!matched) {
      feasible = false;
      break;
    }
  }

  return { feasible, requestedSizes, availableCapacities };
};
```

## What this fixes

- N1 has 8 tents of 8 beds. The group requests tents of size 8. The check now compares 8 requested tents vs 8 available tents -- a perfect match, no warning.
- If a neighborhood has 5 tents of 6 beds but the requested sizes include tents of 8, only 5 tents are compared and the warning correctly fires for the mismatched ones.

## What stays unchanged

- The override flow (logging to activity_log)
- The warning dialog UI
- VIP allocation
- Database schema

