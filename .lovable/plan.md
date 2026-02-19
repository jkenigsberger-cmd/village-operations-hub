
# Change Quote PDF Color Scheme to Blue

## What Changes

The quote PDF document currently uses a green/olive color scheme (`#4a6741`, `#5a7a51`, `#c5d5a9`, `#f0f4e8`). We'll update it to a blue gradient style similar to the reference image.

## File: `src/lib/quoteUtils.ts`

Update the `commonStyles` block (lines 171-193) with these color swaps:

| Element | Current (Green) | New (Blue) |
|---------|-----------------|------------|
| h1 color | `#4a6741` | `#2c5fa8` |
| h2 color | `#5a7a51` | `#3b6fb7` |
| h2 border-bottom | `#c5d5a9` | `#a8c4e6` |
| header border-bottom | `#4a6741` | `#2c5fa8` |
| th background | `#f0f4e8` | `#e8f0fa` |
| total-row background | `#f8faf5` | `#f0f5fc` |
| grand-total color | `#4a6741` | `#2c5fa8` |
| payment-box background | `#f0f4e8` | `#e8f0fa` |

Additionally, update the `.header` to use a blue gradient background with white text, matching the reference image style:

```css
.header {
  text-align: center;
  margin-bottom: 32px;
  padding: 24px 16px;
  background: linear-gradient(135deg, #3b6fb7, #5b8fd7);
  color: #fff;
  border-radius: 8px;
}
.header .subtitle { color: rgba(255,255,255,0.85); }
```

No other files change. The blue theme will apply to both client and operational PDF documents.
