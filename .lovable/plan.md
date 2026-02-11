

# Fix Activity Space Hourly Grid - Reservation Block Spanning Wrong Hours

## Problem

The colored reservation block extends far beyond its actual end time. For example, a 09:00-15:30 reservation shows color all the way to 21:00 instead of stopping at ~16:00.

## Root Cause

When a reservation occupies a time range, the code skips the **entire table row** (`<tr>`) for intermediate hours (lines 369-371). The reservation cell uses `rowSpan` to visually span multiple rows -- but `rowSpan` counts only **rendered** rows in the DOM. Since intermediate rows are removed entirely, the `rowSpan` bleeds into the hours that follow the reservation, painting them with the reservation color.

```text
Current (broken):                    Fixed:
09:00 | [reservation rowSpan=7]      09:00 | [reservation rowSpan=7]
      | (rows 10-15 MISSING)         10:00 |   (covered by rowSpan)
16:00 | ...extends here...           11:00 |   (covered by rowSpan)
17:00 | ...extends here...           12:00 |   (covered by rowSpan)
18:00 | ...extends here...           13:00 |   (covered by rowSpan)
19:00 | ...extends here...           14:00 |   (covered by rowSpan)
20:00 | ...extends here...           15:00 |   (covered by rowSpan)
21:00 | ...extends here...           16:00 | empty
                                     17:00 | empty
```

## Fix

**File: `src/pages/Activities.tsx`** (lines 369-371)

Instead of returning `null` for the entire `<tr>`, render the row with just the hour label cell (the reservation cell is already covered by `rowSpan`):

```typescript
// Was: return null (removes entire row)
// Fix: render the hour label but skip the reservation cell
if (reservation && !isStart) {
  return (
    <tr key={hour} className="border-t">
      <td className="p-3 font-mono text-sm font-semibold text-muted-foreground border-r bg-muted/20">
        {hour}
      </td>
      {/* No second <td> -- covered by rowSpan from start row */}
    </tr>
  );
}
```

This ensures:
- All hour labels remain visible on the left column
- The reservation color block spans exactly the correct hours
- Click-to-book on empty hours still works correctly
