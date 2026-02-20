

# Fix VIP Neighborhood Showing Departed Groups + Clean Stale Data

## Problem
The VIP bookings list reads directly from the physical `tents` table, which has stale group data left over after checkout. Groups like "pilot" and "hashomer" still appear even though they departed days ago. The correct source of truth (`useVipReservations`, derived from `groups.vip_tent_configs`) is already used by the map and status banner but not by the bookings list.

## Changes

### 1. `src/components/NeighborhoodBookingsList.tsx`
- Add an optional `vipReservations?: VipReservationMap` prop.
- When `neighborhoodId === 'VIP'` and `vipReservations` is provided, skip the tent-level bookings loop (section 2) entirely.
- Instead, build bookings from the `vipReservations` map, grouping entries by group name and using the correct dates/gender from the groups source of truth.

### 2. `src/pages/Neighborhood.tsx`
- Pass the existing `vipReservations` (already computed on line 64) to `NeighborhoodBookingsList` as a new prop.

### 3. Database Cleanup (one-time)
- Run an UPDATE query on the `tents` table to clear stale VIP data: set `group_name = NULL`, `check_in_date = NULL`, `check_out_date = NULL`, `gender = 'MIXED'`, and reset reserved beds to 0 for VIP tents where the checkout date has already passed (before today, Feb 20).
- This prevents any other components that might read physical tent state from showing incorrect data.

## Technical Details

The `NeighborhoodBookingsList` component will be updated to:

```text
Props:
  neighborhoodId: NeighborhoodId
  date: Date
  vipReservations?: VipReservationMap  <-- NEW

Logic:
  If VIP + vipReservations provided:
    - Group vipReservations entries by groupName
    - Build BookingInfo[] from grouped data (tent count, gender, dates)
    - Skip tent-level loop
  Else:
    - Existing logic (neighborhood reservations + tent bookings)
```

DB cleanup query:
```text
UPDATE tents
SET group_name = NULL,
    check_in_date = NULL,
    check_out_date = NULL,
    gender = 'MIXED'
WHERE neighborhood_id = 'VIP'
  AND check_out_date < '2026-02-20';

UPDATE beds
SET status = 'FREE', guest_name = NULL
WHERE tent_id IN (
  SELECT id FROM tents
  WHERE neighborhood_id = 'VIP'
    AND check_out_date < '2026-02-20'
);
```

