
# Fix: Stale VIP Tent Colors on Dashboard

## Problem
The VIP mini-map on the dashboard still shows colorful (occupied) tents for groups that have checked out today ("pilot", "hashomer", etc.). Two root causes:

1. **MiniMap fallback reads stale physical data**: When `useVipReservations` correctly excludes a departed group, the code falls back to checking the physical `tents` table -- which still has old `group_name` and dates. Since `getBookingStatus` returns `CHECKOUT` for checkout-day records, tents appear colored.

2. **Cleanup function misses checkout-day tents**: The `cleanup_stale_vip_tents()` database function uses `check_out_date < CURRENT_DATE` (strictly less than). Tents checking out **today** are not cleaned until **tomorrow**. Meanwhile the cron runs at 03:00 so there's a full-day gap.

3. **TentDetailModal reads raw physical tent data**: It shows the stale "pilot" group name because it never consults the groups-based source of truth.

---

## Solution (3 changes)

### 1. Remove physical-tent fallback for VIP nodes
In `src/components/NeighborhoodMiniMap.tsx`, when `vipReservations` is provided, do NOT fall back to physical tent state. If there's no `vipRes` for a tent, treat it as empty (no reservation).

```text
Current (line 74-79):
  const hasReservation = vipRes
    ? true
    : (() => {
        const today = format(new Date(), 'yyyy-MM-dd');
        return !!(tent.checkInDate && ... getBookingStatus(...));
      })();

Fixed:
  const hasReservation = vipReservations
    ? !!vipRes       // Groups source of truth: no vipRes = empty
    : (() => { ... physical fallback for non-VIP ... })();
```

Gender will also default to `undefined` (empty) when no `vipRes` exists.

### 2. Fix cleanup function to include checkout-day tents
Update the database function `cleanup_stale_vip_tents()` to use `check_out_date <= CURRENT_DATE` instead of `< CURRENT_DATE`. By hotel rule, checkout day is NOT a sleeping night, so these tents should be cleared immediately.

```sql
-- Change: < CURRENT_DATE  -->  <= CURRENT_DATE
WHERE neighborhood_id = 'VIP'
  AND check_out_date IS NOT NULL
  AND check_out_date <= CURRENT_DATE;
```

### 3. Override stale data in TentDetailModal for VIP
Pass `todayVipReservations` through to `TentDetailModal` (or use `useVipReservations` inside it) so that when a VIP tent is opened, it shows the group from the groups source of truth rather than the stale physical record. If no active VIP reservation exists for that tent, display it as empty.

---

## Technical Details

**Files modified:**
- `src/components/NeighborhoodMiniMap.tsx` -- remove physical fallback when `vipReservations` is provided
- `src/components/TentDetailModal.tsx` -- use `useVipReservations` to override stale physical tent data for VIP tents
- Database migration -- update `cleanup_stale_vip_tents()` to use `<=` instead of `<`
- Run cleanup immediately after migration to clear today's stale records

**No schema changes.** Only the existing function body is updated.
