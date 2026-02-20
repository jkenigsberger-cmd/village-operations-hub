
# Fix Duplicate "by" Text on Login Screen

## Problem
The login screen shows "by:" twice — once as a standalone span and once inside "By: Glow Glamping". In RTL layout this renders as: `By: Glow Glamping [GLOW logo] :by`

## Fix
In `src/components/AuthGate.tsx` (lines 53-56), replace the two separate text spans with a single line reading **"By: Glow Glamping"** next to the GLOW logo.

The updated attribution row will be:
```
[GLOW logo]  By: Glow Glamping
```

### Changes
**File: `src/components/AuthGate.tsx`** (lines 53-56)
- Remove the first `<span>by:</span>`
- Keep the GLOW logo image
- Keep the second span with "By: Glow Glamping"
