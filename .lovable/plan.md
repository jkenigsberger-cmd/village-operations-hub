

# Fix: Gender-Aware Automatic Tent Distribution

## Problem
When "הפרדה לפי מגדר" (gender separation) is toggled ON, the "חלק אוטומטית" (auto-distribute) button completely ignores gender. It distributes all participants evenly across tents and leaves every tent tagged as "מעורב" (MIXED). This defeats the purpose of the toggle.

## Solution
Rewrite the `autoDistribute` function in `SleepingTentDistributionSection.tsx` to be gender-aware:

1. **When gender separation is OFF** -- keep current behavior (even split, no gender tags).
2. **When gender separation is ON** (and `boysCount`/`girlsCount` are available):
   - Calculate boys tents: `ceil(boysCount / capacity)` tents, distribute boys evenly across them, tag each as `BOYS`.
   - Calculate girls tents: `ceil(girlsCount / capacity)` tents, distribute girls evenly across them, tag each as `GIRLS`.
   - Combine into a single tent array (boys first, then girls), re-index sequentially.
   - Total tent count = boys tents + girls tents.

### Example (from screenshot)
- 25 participants: 10 boys, 15 girls, capacity 8
- Boys: `ceil(10/8) = 2` tents -> 5, 5
- Girls: `ceil(15/8) = 2` tents -> 8, 7
- Result: 4 tents total, tents 1-2 tagged BOYS, tents 3-4 tagged GIRLS

## File to modify

| File | Change |
|---|---|
| `src/components/SleepingTentDistributionSection.tsx` | Rewrite `autoDistribute` (lines 149-172) to split by gender when `genderSeparation` is on and counts are available |

## Technical Details

```text
autoDistribute() {
  if genderSeparation AND boysCount AND girlsCount:
    boysTentCount = ceil(boysCount / capacity)
    girlsTentCount = ceil(girlsCount / capacity)
    
    boysTents = distribute(boysCount, boysTentCount, gender=BOYS)
    girlsTents = distribute(girlsCount, girlsTentCount, gender=GIRLS)
    
    allTents = [...boysTents, ...girlsTents]  // re-index 1..N
    totalCount = boysTentCount + girlsTentCount
  else:
    // current logic (no gender tags)
}
```

The `updatePreference` call at the end already handles recalculating `totalPax` and `isValid`, and the existing gender validation display will automatically show correct results.
