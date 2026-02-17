

# Show "+1 Extra Bed" Indicator on VIP Neighborhood Tents

## Problem
When a VIP tent config has the "+1 extra bed" (מיטה נוספת) toggle enabled, there is no visual indication of this on the VIP neighborhood map, mini-map, or tent cards. Staff can't tell which physical tents have been requested with an extra bed.

## How It Will Work

The `hasExtraBed` flag already exists in `VIPTentConfig` and is linked to a physical tent via `assignedTentCode`. We will:

1. Look up assigned VIP configs for each tent and pass `hasExtraBed` through to the display components
2. Show a small "+1" badge on the map icons, mini-map icons, and tent cards for tents that have the extra bed flag

## Changes

### 1. Add `hasExtraBed` to `TentNode` type
**File:** `src/components/NeighborhoodMap.tsx`

Add an optional `hasExtraBed?: boolean` field to the `TentNode` type so map components can receive this info.

### 2. Pass `hasExtraBed` from Neighborhood page
**File:** `src/pages/Neighborhood.tsx`

When building `mapNodes`, look up the current group's `vipTentConfigs` to find if the config assigned to each tent has `hasExtraBed: true`. Pass it as a prop on each `TentNode`.

### 3. Show "+1" badge on VIP map tent icons
**File:** `src/components/VIPNeighborhoodMap.tsx`

When `node.hasExtraBed` is true, render a small "+1" text or badge next to the tent icon on the SVG map.

### 4. Show "+1" badge on VIP mini-map tent icons
**File:** `src/components/MiniMapVIP.tsx`

Same as above but scaled down for the mini-map. A small "+1" indicator near the tent.

### 5. Show "+1" badge on TentCard
**File:** `src/components/TentCard.tsx`

Add a small badge (like the existing VIP sparkle or gender badges) showing "+1" when the tent has an extra bed assigned.

### 6. Also update `MiniVIPTentNode` type
**File:** `src/components/MiniMapVIP.tsx`

Add `hasExtraBed?: boolean` to the `MiniVIPTentNode` type.

## Visual Result

- **Map view:** Each VIP tent with +1 will show a small orange/amber "+1" label below or beside the tent number
- **Grid view (TentCard):** A small "+1" badge appears alongside existing badges (VIP sparkle, gender)
- **Mini-map:** A tiny "+1" near the tent icon

No database or schema changes needed -- this is purely a UI display feature reading existing data.
