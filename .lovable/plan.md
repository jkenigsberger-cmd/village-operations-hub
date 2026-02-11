

# Show 15-Minute Buffer Visually in Hourly Grid

## What Changes

When a reservation is booked from 09:00 to 15:30, the colored block currently spans 09:00-15:00 (or 16:00). With this change, the colored block will visually extend to include the 15-minute buffer on both sides, so it covers 08:00-16:00 (the hour rows that contain 08:45 and 15:45).

The reservation text inside the block still shows the actual booked times (09:00 - 15:30). Only the visual coloring extends to reflect the buffer.

## Technical Details

### File: `src/pages/Activities.tsx`

Modify the three helper functions to use buffered times for visual rendering:

**1. `getReservationForHour`** - Check if an hour falls within the buffered range (startTime - 15min to endTime + 15min):

```typescript
const getReservationForHour = (hour: string): ActivityReservation | null => {
  const BUFFER = 15; // minutes
  return spaceReservations.find(r => {
    const hourMin = timeToMinutes(hour);
    const bufferedStart = timeToMinutes(r.startTime) - BUFFER;
    const bufferedEnd = timeToMinutes(r.endTime) + BUFFER;
    return hourMin >= bufferedStart && hourMin < bufferedEnd;
  }) || null;
};
```

**2. `isReservationStart`** - The start row is now the hour containing (startTime - 15min):

```typescript
const isReservationStart = (hour: string): boolean => {
  const BUFFER = 15;
  return spaceReservations.some(r => {
    const bufferedStartHour = Math.floor((timeToMinutes(r.startTime) - BUFFER) / 60);
    const hourValue = parseInt(hour.split(':')[0]);
    return hourValue === bufferedStartHour;
  });
};
```

**3. `getReservationSpanForRow`** - Calculate span using buffered times:

```typescript
const getReservationSpanForRow = (reservation: ActivityReservation): number => {
  const BUFFER = 15;
  const bufferedStart = timeToMinutes(reservation.startTime) - BUFFER;
  const bufferedEnd = timeToMinutes(reservation.endTime) + BUFFER;
  return Math.max(1, Math.ceil((bufferedEnd - bufferedStart) / 60));
};
```

**4. Visual distinction for buffer zones** (optional but recommended): The buffer portions of the block will use a slightly different style (striped/hatched pattern or reduced opacity) so staff can visually distinguish "setup/cleanup time" from actual booking time. The reservation info text (group name, times, notes) remains positioned in the main block area.

### What stays the same
- The reservation data and actual times are unchanged
- The text inside the colored block still shows actual times (e.g., "09:00 - 15:30")
- The 15-minute gap validation logic is unchanged
- Click-to-book on empty hours still works
- The map and all other pages are untouched

### Import needed
`timeToMinutes` is already imported from `@/lib/timeUtils`.
