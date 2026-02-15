

# Fix: Deduplicate Group Cards in Master Calendar

## Problem

On February 17th (and any day with lodging groups), the calendar shows up to 4 cards for the same group:
- 1 card per neighborhood reservation (e.g., 2 neighborhoods = 2 cards)
- 1 arrival card from the unified GroupStay
- 1 departure card from the unified GroupStay (if applicable)

These are redundant because the GroupStay arrival/departure cards already display the neighborhood names, VIP tents, and pax count in their subtitle.

## Solution

Skip generating individual `NEIGHBORHOOD` events (Section 1 in MasterCalendar) for groups that already have a unified GroupStay entry. This is the same pattern already used for individual tent check-in/check-out events (Section 4, line 152).

## Technical Change

### File: `src/components/MasterCalendar.tsx`

In the `allEvents` memo, filter out neighborhood reservations whose `groupName` already appears in the `groupStayGroupNames` set (which is already computed on line 148).

**Before (lines 86-105):**
```typescript
// 1. Neighborhood reservations (multi-day)
Object.values(state.neighborhoodReservations || {}).forEach(reservation => {
  events.push({ ... });
});
```

**After:**
```typescript
// 1. Neighborhood reservations (multi-day) -- skip groups handled by GroupStay
Object.values(state.neighborhoodReservations || {}).forEach(reservation => {
  if (groupStayGroupNames.has(reservation.groupName)) return; // already shown in unified arrival/departure
  events.push({ ... });
});
```

One additional ordering change: move the `groupStayGroupNames` set computation (currently line 148) to before Section 1, so it is available for the neighborhood filter.

### Result

Each group will appear at most twice on any given day: once for arrival (check-in day) and once for departure (check-out day). The neighborhood and VIP details are already visible in the subtitle of those cards.

## Files Changed

| File | Change |
|------|--------|
| `src/components/MasterCalendar.tsx` | Move `groupStayGroupNames` set computation earlier; add skip condition for neighborhood reservations belonging to grouped stays |

