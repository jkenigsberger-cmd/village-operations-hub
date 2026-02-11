

# Add Booking Status and Pax Info to Home Page (דף הבית) Neighborhood Section

## What Changes

The Neighborhoods section on the home page (overview) currently shows mini-maps without any booking/occupancy status information. The "neighborhoods" tab already has colored status bars (check-in/sleeping/check-out), group names, and pax counts on each tile -- but the home page does not.

## Plan

### 1. Add booking data to the overview neighborhood section

The overview section (lines 486-532 in `Index.tsx`) renders `NeighborhoodMiniMap` components. We will enrich each mini-map card with:

- **A colored status indicator** (green for check-in, blue for sleeping, orange for check-out) -- a small banner or border matching the `bookingStatusColors` system
- **Group name** when a neighborhood is booked
- **Number of people** (total pax) for the reservation

This data is already available via `useNeighborhoodBookings` (line 106), which is called with `neighborhoodsSelectedDate`. For the home page we need today's date, so we'll use the existing `neighborhoodBookings` and `vipBooking` data (since `neighborhoodsSelectedDate` defaults to today).

### 2. Implementation approach

In `src/pages/Index.tsx`, in the overview section where `NeighborhoodMiniMap` is rendered (lines 512-531):

- After each `NeighborhoodMiniMap`, add a small footer/overlay showing:
  - Booking status badge (icon + label + color) from `BOOKING_STATUS_COLORS`
  - Group name (truncated)
  - Pax count ("X איש")
- Wrap the mini-map in a container with a top border color matching the booking status (same pattern as `NeighborhoodTile`)

### 3. Files to modify

- **`src/pages/Index.tsx`** -- Add booking status info below/around the `NeighborhoodMiniMap` cards in the overview section. Use the existing `neighborhoodBookings` and `vipBooking` data that's already computed.

No new components or hooks needed -- all data and styling utilities already exist.
