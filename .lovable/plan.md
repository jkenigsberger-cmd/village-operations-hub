
# Sync Neighborhood Card Occupancy with Booking Pax Count

## Problem

The `NeighborhoodMiniMap` card header shows `summary.occupiedBeds/summary.totalBeds` (e.g., "0/32"), where `occupiedBeds` is derived from counting individual bed records marked as OCCUPIED or RESERVED. When a neighborhood reservation exists but individual beds haven't been marked, this shows 0 -- even though the booking banner correctly shows "32 איש".

## Solution

Update `NeighborhoodMiniMap` to accept an optional `bookingPax` prop. When provided and greater than `summary.occupiedBeds`, use it instead for the occupancy display and progress bar. This keeps the existing bed-level data as a fallback while showing the reservation-level pax count when available.

## Changes

### 1. `src/components/NeighborhoodMiniMap.tsx`

- Add optional `bookingPax?: number` prop
- Compute `displayedOccupied = Math.max(summary.occupiedBeds, bookingPax ?? 0)`
- Use `displayedOccupied` in the header ("X/32") and the occupancy bar percentage

### 2. `src/pages/Index.tsx`

- Pass `bookingPax={booking?.totalPax}` to `NeighborhoodMiniMap` in the overview section (where the booking data is already computed)

No new files, hooks, or dependencies needed.
