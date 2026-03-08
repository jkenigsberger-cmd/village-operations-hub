

# Fix: Guest Form Link Uses Published URL

## Problem
The "שאלון לקוח" button copies the preview URL (`cb53f979...lovableproject.com/guest-form`), which requires a Lovable account to access. It should copy the published URL (`glowhadorhaba.lovable.app/guest-form`).

## Solution
Hardcode the published base URL for the guest form link in `AdminQuotes.tsx`. This ensures the copied link always points to the public published site.

### Change in `src/pages/AdminQuotes.tsx` (line ~414)
Replace:
```ts
navigator.clipboard.writeText(`${window.location.origin}/guest-form`);
```
With:
```ts
const base = window.location.hostname.includes('lovableproject.com')
  ? 'https://glowhadorhaba.lovable.app'
  : window.location.origin;
navigator.clipboard.writeText(`${base}/guest-form`);
```

This way:
- In the preview/dev environment, it copies the published URL
- In production (published site), it copies the current origin as expected

| File | Change |
|------|--------|
| `src/pages/AdminQuotes.tsx` | Use published URL for clipboard copy |

