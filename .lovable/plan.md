

# Fix: TentCard Still Shows Group Name and Occupancy for Past Reservations

## Problem

Two separate issues:

1. **Database cleanup keeps failing to persist** -- VIP 87 and 88 still have stale `group_name`, dates, and RESERVED beds despite multiple approved UPDATE attempts.

2. **TentCard only uses `hasReservation` for colors/badges** -- The group name (line 79), occupancy bar (line 51 `usedBeds`), and date display (line 134) all render unconditionally based on raw data. Even if the color fix works, the text "השומר החדש" and "3/3" occupancy still appear.

## Fix

### 1. Retry database cleanup (again)

Execute the same cleanup SQL. If it fails again, we will verify by querying immediately after.

```sql
UPDATE tents 
SET group_name = NULL, check_in_date = NULL, check_out_date = NULL, gender = 'MIXED'
WHERE id IN ('4sm0ac191', '7kc6aojuh');

UPDATE beds 
SET status = 'FREE', guest_name = NULL 
WHERE tent_id IN ('4sm0ac191', '7kc6aojuh') AND status = 'RESERVED';
```

### 2. Make TentCard fully respect `hasReservation`

In `src/components/TentCard.tsx`, gate ALL reservation-related display on `hasReservation`:

**Group name** (line 79): Change from `summary.groupName &&` to `hasReservation && summary.groupName &&`

**Occupancy count** (line 51): When `!hasReservation`, treat `usedBeds` as 0 so the bar shows empty and the count shows "0/N"

**Dates** (line 134): Change from `summary.checkInDate || summary.checkOutDate` to `hasReservation && (summary.checkInDate || summary.checkOutDate)`

This ensures that even if stale data remains in the database, past reservations show a completely clean, neutral tent card with 0 occupancy and no group name.

## Files Changed

- `src/components/TentCard.tsx` -- gate group name, occupancy, and dates behind `hasReservation`
- Database -- retry cleanup of VIP 87 and VIP 88

