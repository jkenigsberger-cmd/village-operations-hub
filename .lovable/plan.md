

# Add Common Spaces & Meals Count to Daily Summary Tile

## What Changes

Extend the `DailySummaryCard` to also show:
- Number of **common space reservations** (activity reservations) for the selected date
- Number of **meals** (kitchen time slots) for the selected date

The subtitle will become something like:
`"12 אנשים · 3 קבוצות · 2 לנים · 4 חללים · 6 ארוחות"`

## Technical Changes

### File: `src/components/DailySummaryCard.tsx`

1. Import `useKitchenData` from `@/hooks/useKitchenData` to get `getTimeSlotsForDate`
2. Import `useVillage` from `@/context/VillageContext` to access `state.activityReservations`
3. Inside the `useMemo`, calculate:
   - **spacesUsed**: count of unique activity reservations where `date === dayStr`
   - **mealsCount**: count of kitchen time slots for `dayStr` (using `getTimeSlotsForDate`)
4. Add these two numbers to the subtitle string:
   - `· {spacesUsed} חללים` (common spaces booked)
   - `· {mealsCount} ארוחות` (meals scheduled)

### No other files change

The component already sits in the grid. We are only enriching the data it displays.

