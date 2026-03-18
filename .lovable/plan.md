

# Coffee Corner: Charge Only for Staff Members

## Current Behavior
Coffee corner is calculated as `15₪ × totalPax` (students + staff).

## New Behavior
Coffee corner will be calculated as `15₪ × staffTotal` (team/staff only).

## Change
**`src/lib/quoteUtils.ts`** — In `computeQuoteTotals`, change `snapshot.totalPax` to `snapshot.staffTotal` in the coffee corner calculation line.

One-line change, no other files affected.

