

# Fix: Mobile Bottom Navigation Bar - Enable Horizontal Scrolling

## Problem

The bottom navigation bar has 7 tabs crammed into a fixed-width row using `flex justify-around`. On narrow mobile screens, the items get squished together and there is no way to scroll horizontally to reach all tabs.

## Solution

Make the bottom nav horizontally scrollable so all 7 tabs are comfortably accessible, with visual scroll indicators (fade edges) to hint that more items exist.

## Changes (1 file)

### `src/components/MobileBottomNav.tsx`

1. Change the inner container from `flex justify-around` to `flex overflow-x-auto gap-1` with `scrollbar-hide` to allow horizontal scrolling without a visible scrollbar.
2. Add left/right gradient fade indicators (similar to the AdminLayout nav) so users can see there are more tabs to scroll to.
3. Keep `min-w-[64px]` on each button and add `flex-shrink-0` so items do not compress below their minimum readable size.

### Technical Detail

```
Current:  <div className="flex justify-around items-center py-2">
Updated:  <div className="flex overflow-x-auto scrollbar-hide items-center py-2 px-1 gap-1">

Each button gets: flex-shrink-0 (prevents squishing)
```

Gradient overlays on left and right edges of the nav bar provide a visual cue that the bar is scrollable, matching the pattern already used in the admin navigation.

