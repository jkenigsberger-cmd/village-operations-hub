

# Fix Daily Summary Card Subtitle Layout

## Problem

The subtitle line on the tile is a single long string (`"12 אנשים · 3 קבוצות · 2 לנים · 4 חללים · 6 ארוחות"`) that can wrap awkwardly, causing numbers to separate from their labels -- especially on narrower screens.

## Solution

Replace the single `<p>` subtitle with a `flex flex-wrap` container of individual `<span>` elements, each containing one metric (number + label) as a non-breaking unit. A small dot separator sits between them.

## Technical Changes

### File: `src/components/DailySummaryCard.tsx`

**Line 74** -- Replace the subtitle `<p>` tag:

From:
```tsx
<p className="text-sm text-muted-foreground">{subtitle}</p>
```

To:
```tsx
<div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-sm text-muted-foreground">
  <span className="whitespace-nowrap">{summary.totalPeople} אנשים</span>
  <span>·</span>
  <span className="whitespace-nowrap">{summary.totalGroups} קבוצות</span>
  <span>·</span>
  <span className="whitespace-nowrap">{summary.sleepingPeople} לנים</span>
  <span>·</span>
  <span className="whitespace-nowrap">{summary.spacesUsed} חללים</span>
  <span>·</span>
  <span className="whitespace-nowrap">{summary.mealsCount} ארוחות</span>
</div>
```

Each metric pair (number + word) uses `whitespace-nowrap` so they never split across lines. The `flex-wrap` allows the whole row to wrap cleanly between metrics if the tile is narrow.

The `subtitle` variable on line 58 can be removed since it will no longer be used.

