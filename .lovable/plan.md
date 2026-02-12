
# Fix: Reservations Starting at Non-Exact Hours Not Displaying

## Problem

The hourly grid in the Common Spaces (Activities) page fails to render reservations that start at non-exact hours (e.g., 19:50). This is because:
- `getReservationForHour` checks if the hour falls within `[startTime, endTime)` using minute precision
- `isReservationStartHour` compares only the integer hour
- These two checks become inconsistent when a reservation starts mid-hour (e.g., 19:50 is in hour 19 but 19:00 is NOT >= 19:50)

## Fix (2 changes in `src/pages/Activities.tsx` only)

### Change 1: `getReservationForHour` (line ~138-142)

Add a fallback check: if the hour matches the reservation's start hour, include it.

```typescript
// BEFORE
const getReservationForHour = (hour: string): ActivityReservation | null => {
  return spaceReservations.find(r => 
    isHourInReservation(hour, r.startTime, r.endTime)
  ) || null;
};

// AFTER
const getReservationForHour = (hour: string): ActivityReservation | null => {
  return spaceReservations.find(r => 
    isHourInReservation(hour, r.startTime, r.endTime) || isReservationStartHour(hour, r.startTime)
  ) || null;
};
```

### Change 2: `getReservationSpanForRow` (line ~150-152)

Calculate the span from the floored start hour (not the exact start minute) to the end time, so the rowSpan covers all necessary rows.

```typescript
// BEFORE
const getReservationSpanForRow = (reservation: ActivityReservation): number => {
  return getReservationSpan(reservation.startTime, reservation.endTime);
};

// AFTER
const getReservationSpanForRow = (reservation: ActivityReservation): number => {
  const startHour = parseInt(reservation.startTime.split(':')[0]);
  const hourStart = `${startHour.toString().padStart(2, '0')}:00`;
  return getReservationSpan(hourStart, reservation.endTime);
};
```

## Why This Works

For a reservation at 19:50-21:10:
- **Row 19:00**: `getReservationForHour` now returns the reservation (via `isReservationStartHour`). `isReservationStart` is true. Block renders with rowSpan = ceil((21:10 - 19:00) / 60) = 3.
- **Rows 20:00, 21:00**: Covered by the rowSpan from 19:00. Only hour cell rendered (correct).

## Files Modified

| File | Change |
|------|--------|
| `src/pages/Activities.tsx` | 2 small edits (~4 lines total) |

No changes to `timeUtils.ts`, `groupSync.ts`, or any other file. Existing reservation logic, conflict detection, and sync remain untouched.
