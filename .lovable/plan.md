

# Fix: VIP Tents Still Showing Stale Group Data

## Root Causes

Two issues remain:

1. **Database cleanup never took effect** -- VIP 87 and 88 still have `group_name: "השומר החדש  "`, old dates (Feb 9-10), and 6 beds in RESERVED status. The previous UPDATE statements were approved but the data persists.

2. **TentCard has its own `hasReservation` check (line 55)** that still uses the naive non-null logic:
   ```
   const hasReservation = !!(summary.groupName || summary.checkInDate || summary.checkOutDate);
   ```
   This means even if the map colors are fixed, the **tent cards** still show gender colors, group names, and dates for past reservations.

## Fix Plan

### 1. Retry database cleanup for VIP 87 and VIP 88

Clear all stale group data and reset beds:

```sql
UPDATE tents 
SET group_name = NULL, check_in_date = NULL, check_out_date = NULL, gender = 'MIXED'
WHERE id IN ('4sm0ac191', '7kc6aojuh');

UPDATE beds 
SET status = 'FREE', guest_name = NULL 
WHERE tent_id IN ('4sm0ac191', '7kc6aojuh') AND status = 'RESERVED';
```

### 2. Fix TentCard.tsx -- use date-aware `hasReservation`

Update `src/components/TentCard.tsx` line 55 to use `getBookingStatus` instead of a naive non-null check. This ensures:
- Past reservations show neutral/empty card styling
- Group names and dates for past reservations are hidden
- Gender colors only appear for active reservations

### 3. Consider a broader systemic fix

The real long-term fix: when a group checks out, the system should automatically clear the tent's `group_name`, dates, and reset beds to FREE. Currently this only happens during cascade delete, not on natural checkout. For now, the date-aware `hasReservation` check in TentCard will visually hide past reservations even if the underlying data hasn't been cleaned.

## Files Changed

- `src/components/TentCard.tsx` -- import `getBookingStatus` and `format`, replace naive `hasReservation` with hotel-logic date check
- Database -- retry cleanup of VIP 87 and VIP 88 stale data
