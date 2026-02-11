

# Fix: VIP Tents Stay Colored After Checkout

## Problem

VIP 87 ("השומר החדש") has `check_out_date: 2026-02-10` but today is 2026-02-11. The tent still appears colored (blue/male) on the map because the `hasReservation` flag only checks if `groupName`/`checkInDate`/`checkOutDate` are non-null -- it never checks whether the current date is actually within the reservation window.

**Line 175 of `src/pages/Neighborhood.tsx`:**
```typescript
const hasReservation = !!(tent.groupName || tent.checkInDate || tent.checkOutDate);
```

This returns `true` even for past reservations.

## Solution

### 1. Fix `hasReservation` logic in `src/pages/Neighborhood.tsx` (line 175)

Replace the naive non-null check with proper hotel-logic date comparison using the existing `getBookingStatus` helper from `src/lib/bookingStatusColors.ts`:

```typescript
import { getBookingStatus } from '@/lib/bookingStatusColors';
import { format } from 'date-fns';

// Inside the useMemo where nodes are built:
const today = format(new Date(), 'yyyy-MM-dd');
const hasReservation = !!(
  tent.checkInDate && tent.checkOutDate &&
  getBookingStatus(tent.checkInDate, tent.checkOutDate, today)
);
```

This ensures:
- A tent is "reserved" only if `start_date <= today < end_date` (sleeping/check-in) OR `end_date == today` (check-out day)
- After checkout day passes, the tent shows as neutral/empty

### 2. Same fix for `VIPNeighborhoodMap` color logic

The `VIPNeighborhoodMap` component receives `hasReservation` from the same `Neighborhood.tsx` node builder, so fixing the source fixes both the large map and mini-map.

### 3. Clean up the orphaned VIP 87 tent data

Run a one-time database cleanup to clear VIP 87's stale group data (since "השומר החדש" already checked out):

```sql
UPDATE tents SET group_name = NULL, check_in_date = NULL, check_out_date = NULL, gender = 'MIXED'
WHERE id = '4sm0ac191';

UPDATE beds SET status = 'FREE', guest_name = NULL
WHERE tent_id = '4sm0ac191' AND status = 'RESERVED';
```

This addresses the immediate visual issue. Combined with the code fix, future checkouts will automatically stop showing colored tents once the checkout date has passed.

## Files Changed

- `src/pages/Neighborhood.tsx` -- import `getBookingStatus` and `format`, update `hasReservation` computation to use hotel-logic date check
- Database: one-time cleanup of VIP 87 orphaned data

