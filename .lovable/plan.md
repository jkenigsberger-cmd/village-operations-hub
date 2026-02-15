
# Add Detail Modal to Daily Summary Card

## What Changes

Make the Daily Summary tile clickable. When clicked, it opens a small informational modal/dialog showing detailed breakdowns for the selected date.

## Modal Content

The modal will display three sections with specific group-level details:

**Header**: "סיכום יומי - {formatted date}"

**Section 1 - Groups (קבוצות)**
- List each active group by name, pax count, and type (lodging/day-only)
- Subtotals: total groups, sleeping groups, day-only groups

**Section 2 - People (אנשים)**
- Total people on site
- Sleeping tonight count
- Day-only count
- CHECK IN today (list group names arriving)
- CHECK OUT today (list group names departing)

**Section 3 - Operations (פעילות)**
- Common spaces booked: count + list of space names/times
- Meals scheduled: count + list of meal types/times

## Technical Changes

### File: `src/components/DailySummaryCard.tsx`

1. Add `useState` for modal open/close
2. Expand `useMemo` to also return the actual group lists (not just counts): `activeGroups`, `sleepingGroups`, `dayOnlyGroups`, `checkInGroups`, `checkOutGroups`
3. Get activity reservation details (space name, time) and kitchen slot details (meal type, time) for the list views
4. Make the tile div clickable with `cursor-pointer hover:shadow-lg transition-all`
5. Use the existing `ResponsiveModal` component (Dialog on desktop, Drawer on mobile) to show the detail view
6. Inside the modal, render the three sections with simple list items -- group name, pax, type labels
7. The modal is read-only, no actions or edit buttons

### No other files change

The tile stays in the same grid position. Only the component itself gains click-to-open behavior and a detail modal.
