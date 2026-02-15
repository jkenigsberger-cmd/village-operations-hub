

# Redesign Daily Summary Card as a Compact Overview Tile

## What Changes

Replace the current full-width "סיכום יומי" card (which sits in its own section below the grid) with a compact tile that matches the exact visual style of the Kitchen tile and other overview tiles, placed inside the same grid row.

## New Design

The tile will look like the other overview tiles:
- Left-colored border (purple/indigo accent)
- 14x14 icon circle with a Briefcase or Users icon
- Title: "סיכום יומי"
- Subtitle showing key numbers inline: e.g. "12 אנשים · 3 קבוצות · 2 לנים"
- Clicking it does nothing (informational only) -- or optionally navigates to calendar
- Same `tile p-6` class pattern as Kitchen/Check-in tiles

## Technical Changes

### 1. `src/components/DailySummaryCard.tsx` -- Rewrite
- Remove the full Card/CardHeader/CardContent structure
- Replace with a simple tile div matching the kitchen tile pattern
- Keep the same `useAdminGroups` data logic
- Display a compact one-line summary: total people count, sleeping count, and group count
- Show today's date as subtitle text

### 2. `src/pages/Index.tsx` -- Move into the grid
- Remove the standalone `<section>` wrapper (lines 496-499)
- Place the `<DailySummaryCard>` as a new tile inside the existing `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4` (line 373), right after the Kitchen tile (line 492)
- The grid will now have 6 tiles total, flowing naturally in the responsive grid

## Visual Result

The overview grid will contain:
1. Check-ins tile (green border)
2. Check-outs tile (blue border)  
3. Needs Cleaning tile (yellow border)
4. Facilities Alert tile (red border)
5. Kitchen tile (amber border)
6. Daily Summary tile (indigo/purple border) -- NEW position

All tiles share the same height, padding, and visual language.

