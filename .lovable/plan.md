

# Fix: VIP Tent Cards Not Reflecting Selected Date

## Changes

### 1. `src/components/TentCard.tsx`
- Add `selectedDate?: string` (YYYY-MM-DD) to `TentCardProps`
- Use `selectedDate || today` as the date for the `hasReservation` check

### 2. `src/pages/Neighborhood.tsx`
- Pass `selectedDate={format(viewDate, 'yyyy-MM-dd')}` to TentCard in:
  - The VIP grid rendering
  - The grouped view rendering

## What stays unchanged
- `useVipReservations` hook
- Realtime subscriptions
- Database/schema
- All other TentCard usages (Index.tsx, Today.tsx) -- they don't pass `selectedDate`, so they default to today

## Technical Details

**TentCard.tsx** -- prop addition and logic change:
```typescript
interface TentCardProps {
  summary: TentSummary;
  to: string;
  showGrouped?: boolean;
  hasExtraBed?: boolean;
  selectedDate?: string; // YYYY-MM-DD
}

// Inside component:
const today = format(new Date(), 'yyyy-MM-dd');
const checkDate = selectedDate || today;
const hasReservation = !!(
  summary.checkInDate && summary.checkOutDate && summary.groupName &&
  getBookingStatus(summary.checkInDate, summary.checkOutDate, checkDate)
);
```

**Neighborhood.tsx** -- pass the prop in both grid and grouped view TentCard renders:
```typescript
<TentCard
  ...
  selectedDate={format(viewDate, 'yyyy-MM-dd')}
/>
```

