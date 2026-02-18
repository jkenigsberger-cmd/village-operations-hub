

# Exclude Archived Groups from Daily Summary Counts

## Current State

The allocation system **already correctly filters** archived groups in all the right places:
- Pending allocation notifications (dashboard overview)
- "Sleeping groups" list in the allocations tab  
- Group stays (sleeping calendar, check-in/check-out)
- Master calendar day-use events

## Gap Found

**`DailySummaryCard.tsx`** -- the daily summary widget that shows total people, check-ins, and check-outs does **not** filter out archived groups. This means an archived group still gets counted in "total people on site today" and "check-ins/check-outs today."

## Fix

### File: `src/components/DailySummaryCard.tsx`

Change the hook usage from `{ groups }` to `{ activeGroups }` (which already excludes archived groups), then use `activeGroups` instead of `groups` throughout the summary calculation.

Specifically:
- Line 16: Change `const { groups } = useAdminGroups()` to `const { activeGroups } = useAdminGroups()`
- Lines 23-36: Replace all references to `groups` with `activeGroups` so that:
  - `activeGroups` date-range filter excludes archived
  - `dayOnlyGroups` excludes archived
  - `checkInGroups` / `checkOutGroups` exclude archived

This is a single-file change -- no schema, database, or other component modifications needed. The rest of the allocation architecture is already correctly excluding archived groups.

