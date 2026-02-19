

# Make Quote PDF Header Text Blue

## What Changes

The PDF header currently has a blue gradient background with white text. We need to remove the gradient and make the text blue (#0b2fd6) instead, matching the screenshot.

## File: `src/lib/quoteUtils.ts`

Update three CSS rules in the `commonStyles` block:

1. **`.header`** -- Remove the gradient background, keep the layout:
   - Before: `background: linear-gradient(135deg, #0b2fd6, #3b5fe6); color: #fff; border-radius: 8px;`
   - After: `background: none; color: #333;`

2. **`.header h1`** -- Change from white to blue:
   - Before: `color: #fff;`
   - After: `color: #0b2fd6;`

3. **`.header .subtitle`** -- Change from semi-transparent white to a lighter blue/gray:
   - Before: `color: rgba(255,255,255,0.85);`
   - After: `color: #666;`

No other files change.
