

# Fix: Coffee Corner Not Adding Per-Person Cost

## The Problem

When toggling the coffee corner on, the price shows as 0 because `totalPax` (total participants) is not auto-calculated from `studentsTotal + staffTotal`. The coffee corner formula is `15 x totalPax`, but `totalPax` stays at 0 unless manually typed in.

## The Fix

### File: `src/pages/AdminQuotes.tsx`

**Auto-sync `totalPax`** whenever `studentsTotal` or `staffTotal` changes:

- In the `studentsTotal` onChange handler (line 831): also update `totalPax` to `newValue + prev.staffTotal`
- In the `staffTotal` onChange handler (line 839): also update `totalPax` to `prev.studentsTotal + newValue`

This ensures that when participants are entered, the coffee corner (and any other calculation using `totalPax`) automatically gets the correct count.

### No other files change

The calculation in `quoteUtils.ts` is already correct: `coffeeCornerSubtotal = pricePerPerson * totalPax`. The only issue is that `totalPax` was not being kept in sync with the individual counts.

