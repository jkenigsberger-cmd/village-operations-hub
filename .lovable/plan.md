

# Adjust Logo Size and Postcard Image Style

## File: `src/lib/quoteUtils.ts`

Two CSS changes in the `commonStyles` block:

### 1. Logo -- Make bigger
- Change `.header-logo` height from `72px` to `96px`

### 2. Footer image -- Clean, borderless, centered
- Update `.postcard-img`:
  - Remove `border`, `box-shadow`, `background`, `padding`, `border-radius`
  - Set `object-fit: contain`
  - Increase height to `200px`
- Remove `.postcard-container` max-width constraint (set to `100%`)

### Before / After

| Property | Before | After |
|----------|--------|-------|
| `.header-logo` height | 72px | 96px |
| `.postcard-img` border | 1px solid rgba(...) | none |
| `.postcard-img` box-shadow | 0 1px 4px ... | none |
| `.postcard-img` background | #f9f9f7 | transparent |
| `.postcard-img` padding | 8px | 0 |
| `.postcard-img` border-radius | 14px | 0 |
| `.postcard-img` height | 150px | 200px |
| `.postcard-container` max-width | 520px | 100% |

No logic, pricing, or DB changes.
