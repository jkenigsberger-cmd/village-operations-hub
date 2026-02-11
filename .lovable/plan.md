
# Sort VIP Tent Cards by Ascending Number in Grid View

## What Changes

The VIP tent cards in the grid view appear in whatever order `neighborhood.tentIds` provides. We'll add a sort step so they display in ascending numerical order (80, 81, 82, ... 88, 89) for easier scanning.

## Scope

Only the **grid rendering order** is affected. The map layout, data, and all other logic remain untouched.

## Technical Details

### File: `src/pages/Neighborhood.tsx`

In the `filteredTents` memo (around line 100), add a final `.sort()` step **only for the VIP neighborhood** that extracts the number from the tent code (e.g., "VIP 80" -> 80) and sorts ascending:

```typescript
// At the end of filteredTents memo, before returning:
if (isVIPNeighborhood) {
  result = [...result].sort((a, b) => {
    const numA = parseInt(a.tent.code.match(/\d+/)?.[0] ?? '0');
    const numB = parseInt(b.tent.code.match(/\d+/)?.[0] ?? '0');
    return numA - numB;
  });
}
```

This ensures tent cards appear as: VIP 80, VIP 81, VIP 82, ..., VIP 88, VIP 89.
