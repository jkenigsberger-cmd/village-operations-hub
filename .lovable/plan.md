

# Fix: VIP Tent Card Colors and Bed Numbers Must Match Allocations

## Problem

Two bugs prevent VIP tent cards from correctly reflecting allocation data:

1. **No gender colors**: Database stores gender as lowercase (`'female'`, `'male'`), but TentCard expects uppercase (`'FEMALE'`, `'MALE'`, `'MIXED'`). The hook passes it through without converting, so the color logic never matches.

2. **Wrong bed numbers**: TentCard computes `usedBeds = occupiedBeds + reservedBeds`. The augmented summary correctly sets `occupiedBeds` from VIP allocation data, but `reservedBeds` still carries stale values from the physical tent state, inflating the displayed count.

## Changes

### 1. `src/hooks/useVipReservations.ts` (line 63)

Normalize gender to uppercase so it matches TentCard expectations:

```typescript
// Before:
gender: config.gender as TentGender | undefined,

// After:
gender: config.gender
  ? (config.gender.toUpperCase() as TentGender)
  : undefined,
```

### 2. `src/pages/Neighborhood.tsx` (line ~521-533)

Add `reservedBeds: 0` to the augmented summary so TentCard only counts the allocation-derived beds:

```typescript
const augmentedSummary = isVIPNeighborhood && vipRes
  ? {
      ...summary,
      groupName: vipRes.groupName,
      checkInDate: vipRes.startDate,
      checkOutDate: vipRes.endDate,
      gender: vipRes.gender || summary.gender,
      occupiedBeds: vipRes.bedsPlanned,
      reservedBeds: 0,           // prevent stale physical tent data from inflating count
      freeBeds: Math.max(0, summary.totalBeds - vipRes.bedsPlanned),
    }
  : isVIPNeighborhood && !vipRes
    ? { ...summary, groupName: undefined, checkInDate: undefined, checkOutDate: undefined }
    : summary;
```

## What stays unchanged

- TentCard component (no changes needed, it already supports the selectedDate prop)
- useVipReservations hook logic (date filtering, hotel rule)
- Realtime subscriptions
- Database / schema
- All non-VIP tent card behavior
- Index.tsx, Today.tsx usages

## Result

After this fix, VIP tent cards will show:
- Correct gender-based color borders (pink for female, blue for male, purple for mixed)
- Correct bed occupancy numbers matching exactly what was allocated in vip_tent_configs

