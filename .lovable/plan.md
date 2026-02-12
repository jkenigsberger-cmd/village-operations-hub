

# Unified Group Display in Calendar and Sleeping Tab

## Problem

Right now, in the **Master Calendar**, a group's check-in day shows:
- 1 "group arrival" event (neighborhoods)
- **Separate events for each VIP tent** (e.g., tent 80, tent 81, tent 83 -- each as its own card)

This is confusing. You want **ONE card per group** that shows both neighborhoods and VIP tents together.

Similarly, in the **Sleeping tab**, the card only shows VIP info if allocations already exist. If a group has declared staff but VIP tents aren't assigned yet, there's no indication.

## Solution

### 1. Sleeping Tab: Show staff/VIP status even when unallocated

**File: `src/types/groupStay.ts`**
- Add `staffCount` field (the group's declared staff count from the groups table)

**File: `src/hooks/useGroupStays.ts`**
- Populate `staffCount` from the group record
- This lets the card show "Staff: 3 -- VIP: not assigned" when no allocations exist yet

**File: `src/components/SleepingDashboard.tsx`**
- Show the staff/VIP line when `staffCount > 0` (not just when `staffTotal > 0`)
- If VIP tents allocated: show tent numbers as today
- If no VIP allocated but staff exists: show "VIP: not assigned yet" with a warning badge

**File: `src/components/GroupStayDetailDrawer.tsx`**
- Same logic: show staff count and "not assigned" status when relevant

### 2. Calendar: One unified event per group (merge VIP tents into group event)

**File: `src/components/MasterCalendar.tsx`**

Replace the current approach (individual tent events + separate group arrival/departure) with unified events:

- **Remove** individual tent check-in/check-out events (lines 143-176) for VIP tents that belong to a lodging group
- **Enhance** the group arrival/departure events (lines 214-249) to include VIP tent info in the title and metadata

The unified event will show:
- Title: "Arrival: Group Name (50 people)"
- Subtitle info: "Neighborhoods: 1, 4 | VIP: 3 tents (80, 81, 83)"

This uses data from `useGroupStays` hook (already built) to get the merged neighborhoods + VIP tents per group.

### What stays the same

- No new database tables or columns
- No changes to booking/allocation logic
- No changes to URL routing
- Non-VIP tent events (regular neighborhood tents) stay as-is
- Kitchen, facility, activity, and day-use events are untouched

## Technical Details

### `src/types/groupStay.ts` -- add field
```typescript
staffCount: number; // declared staff from groups table
```

### `src/hooks/useGroupStays.ts` -- populate staffCount
```typescript
staffCount: group?.staffCount || 0,
```

### `src/components/SleepingDashboard.tsx` -- conditional VIP display
```typescript
// Change condition from staffTotal > 0 to:
{(stay.staffCount > 0 || stay.staffTotal > 0) && (
  <span>
    Staff: {stay.staffCount}
    {stay.vipTentCount > 0
      ? ` | VIP: ${stay.vipTentCount} (${stay.vipTents.map(t => t.tentNumber).join(', ')})`
      : ' | VIP: not assigned'}
  </span>
)}
```

### `src/components/MasterCalendar.tsx` -- unified group events

Import and use `useGroupStays` to replace individual tent events with merged group events. For each lodging group:

- One TENT_CHECKIN event on arrival day with title including neighborhoods + VIP count
- One TENT_CHECKOUT event on departure day with same info
- Skip generating individual VIP tent events (they're now inside the group event)

