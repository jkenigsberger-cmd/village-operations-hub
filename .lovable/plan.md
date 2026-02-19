

# Update Quote PDF Color to #0b2fd6

## What Changes

Replace the current blue shades in the quote PDF styles with `#0b2fd6` as the primary color throughout.

## File: `src/lib/quoteUtils.ts`

Update `commonStyles`:

| Element | Current | New |
|---------|---------|-----|
| h1 color | `#2c5fa8` | `#0b2fd6` |
| h2 color | `#3b6fb7` | `#0b2fd6` |
| h2 border-bottom | `#a8c4e6` | `#7a9be6` |
| header gradient | `linear-gradient(135deg, #3b6fb7, #5b8fd7)` | `linear-gradient(135deg, #0b2fd6, #3b5fe6)` |
| header h1 | stays `#fff` | stays `#fff` |
| grand-total color | `#2c5fa8` | `#0b2fd6` |
| th background | `#e8f0fa` | `#e8eefa` |
| total-row background | `#f0f5fc` | `#f0f2fc` |
| payment-box background | `#e8f0fa` | `#e8eefa` |

No other files change.
