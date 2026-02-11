

# Fix: VIP 87 Still Shows as Occupied

## Problem

The previous database cleanup for VIP 87 did not take effect. The tent still has:
- `group_name: "השומר החדש  "` (with trailing spaces)
- `check_in_date: 2026-02-09`, `check_out_date: 2026-02-10`
- `gender: MALE`
- 3 beds in `RESERVED` status

VIP 88 also has stale dates (`2026-02-09` to `2026-02-10`) with `gender: MALE`.

The map color fix (`hasReservation` via `getBookingStatus`) is logically correct -- it should show neutral colors for past reservations. But the tent cards still display group name and occupied bed counts because the underlying data was never cleaned.

## Fix

### 1. Database Cleanup (one-time)

Clear stale data from VIP 87 and VIP 88:

```sql
-- VIP 87: clear all stale group data
UPDATE tents 
SET group_name = NULL, check_in_date = NULL, check_out_date = NULL, gender = 'MIXED'
WHERE id = '4sm0ac191';

-- VIP 87: reset beds to FREE
UPDATE beds 
SET status = 'FREE', guest_name = NULL 
WHERE tent_id = '4sm0ac191' AND status = 'RESERVED';

-- VIP 88: clear stale dates (no group_name but has old dates)
UPDATE tents 
SET check_in_date = NULL, check_out_date = NULL, gender = 'MIXED'
WHERE id = '7kc6aojuh' AND group_name IS NULL;
```

### 2. Harden the cascade delete to also use `.or()` with trimmed+padded variants

The previous cleanup likely failed because the group name `"השומר החדש  "` has **two** trailing spaces, while our `.or()` query only tried one trailing space. Update `cascadeDeleteGroupRecords` in `src/lib/groupLinkedRecords.ts` to use a broader match:

- Use `.ilike('group_name', trimmedName)` combined with `.like('group_name', trimmedName + '%')` to catch any amount of trailing whitespace
- This prevents future mismatches regardless of how many trailing spaces exist

### Files Changed

- `src/lib/groupLinkedRecords.ts` -- broaden whitespace matching in cascade delete
- Database -- one-time cleanup of VIP 87 and VIP 88 stale data
