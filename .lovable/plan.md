

# Move "+1 Extra Bed" Badge to a Distinct Position on TentCard

## Problem
The "+1" badge on the TentCard is grouped with other small badges (VIP sparkle, accessibility, bathroom, gender) in the top-right corner, making it hard to distinguish.

## Solution
Move the "+1" badge out of the badges row and place it as a **floating absolute-positioned badge** in the **top-left corner** of the card, similar to a notification dot. This makes it immediately stand out and not get confused with the other feature badges.

## Changes

### File: `src/components/TentCard.tsx`

1. Add `relative` to the card's outer `<Link>` className (needed for absolute positioning of the badge)
2. Remove the `hasExtraBed` badge from the badges `<div>` (lines 102-106)
3. Add a new floating "+1" badge as a direct child of the `<Link>`, positioned at the top-left corner using `absolute -top-2 -left-2`:

```tsx
{hasExtraBed && (
  <span className="absolute -top-2 -right-2 z-10 inline-flex items-center justify-center w-7 h-7 rounded-full bg-amber-500 text-white text-xs font-bold shadow-md border-2 border-white">
    +1
  </span>
)}
```

This creates a bold, circular floating badge that is clearly separated from other indicators.
