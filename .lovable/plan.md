
# Fix: Nights Logic in Quote System

## The Problem

Currently, the nights calculation uses a raw date difference (`endDate - startDate`) which counts the departure day as a night. But in the farm's business model:

- **Nights (for pricing)** = only the nights they sleep = `endDate - startDate - 1` (the departure day is NOT a sleeping night)
- **Date range (for display)** = `startDate` to `endDate` inclusive (departure day still has activities)

Example: Group arrives Jan 12, departs Jan 15.
- They sleep nights of: 12th, 13th, 14th = **3 nights**
- Current code: `differenceInCalendarDays(Jan 15, Jan 12) = 3` -- this is actually correct!

Wait -- re-reading the user's request more carefully: "if they want 3 nights it must be using a logic also in the starting date and the ending date." The issue is about **bidirectional sync**:

1. When user sets dates, nights auto-calculates correctly
2. When user changes nights manually, the end date should adjust accordingly
3. The pricing must use nights (sleeping nights only), not total days

Currently `differenceInCalendarDays(endDate, startDate)` already gives the correct number of sleeping nights (arrival to departure). The real issues are:

- The date calculation uses `new Date()` which can cause timezone bugs (the stack overflow warning)
- Changing nights manually doesn't update the end date
- The students pricing doesn't multiply by nights for lodging stays

## Changes

### 1. `src/pages/AdminQuotes.tsx` - Fix date/nights sync

**Date calculation**: Replace the timezone-unsafe `new Date().getTime() / 86400000` with proper `differenceInCalendarDays` from date-fns using parsed local dates.

**Bidirectional sync**:
- Changing `startDate` or `endDate` recalculates `nights` using `differenceInCalendarDays(endDate, startDate)`
- Changing `nights` manually recalculates `endDate` by adding days to `startDate` using `addDays(parseISO(startDate), nights)`

### 2. `src/lib/quoteUtils.ts` - Fix students lodging pricing

Currently students lodging pricing does NOT multiply by nights:
```
accommodationSubtotal = pricePerPerson * snapshot.studentsTotal; // Price already per-stay
```

This needs to be fixed: for lodging types (midweek/weekend), multiply by nights:
```
accommodationSubtotal = pricePerPerson * snapshot.studentsTotal * snapshot.nights;
```

For `day_activity`, keep it as-is (no nights multiplier).

### 3. `src/lib/quoteUtils.ts` - Fix snapshot builder

Use `differenceInCalendarDays` with properly parsed dates (already using `parseISO` -- this is fine since date-fns `parseISO` handles YYYY-MM-DD correctly as local dates).

## Technical Details

### File: `src/pages/AdminQuotes.tsx`

- Import `addDays` from date-fns
- **startDate onChange**: Use `differenceInCalendarDays(parseISO(endDate), parseISO(sd))` instead of raw ms math
- **endDate onChange**: Same pattern with `differenceInCalendarDays`
- **nights NumericInput onChange**: Add logic to compute `endDate = format(addDays(parseISO(startDate), newNights), 'yyyy-MM-dd')` and update both `nights` and `endDate`

### File: `src/lib/quoteUtils.ts`

- In `computeQuoteTotals`, for students lodging:
  - `day_activity`: `pricePerPerson * studentsTotal` (no nights)
  - `midweek_lodging` / `weekend_lodging`: `pricePerPerson * studentsTotal * nights`

### Documents

- Client doc already shows nights and dates separately -- no change needed
- The pricing table will naturally reflect the correct subtotal since it reads from `totals`
