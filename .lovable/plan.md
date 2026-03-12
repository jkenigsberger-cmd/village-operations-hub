

# Fix: Guest Form Link Not Working

## Problem

The guest form at `/guest-form?quote=<id>` fails to load quote data because:

1. The page is **public** (outside `AuthGate` in `App.tsx`)
2. It queries the `quotes` table directly using the Supabase client
3. The `quotes` table has RLS requiring `authenticated` role for SELECT
4. An unauthenticated visitor gets no data back, triggering "הצעת המחיר לא נמצאה"

## Solution

Move the quote-fetching logic to the **edge function** (`submit-guest-form`) or create a **new lightweight edge function** that fetches the quote data server-side using the service role key, bypassing RLS.

**Approach: New edge function `get-quote-for-form`**

This is cleaner because the existing `submit-guest-form` handles POST submissions only.

### 1. Create `supabase/functions/get-quote-for-form/index.ts`
- Accepts GET with `?quote_id=<uuid>`
- Uses service role key to query `quotes` table
- Validates quote exists and status is `approved`
- Returns only the fields needed for prefill: `id`, `status`, `title`, `group_id`, `snapshot`, `client_details`
- No auth required (public endpoint, read-only, returns limited data)

### 2. Update `src/pages/GuestForm.tsx`
- Replace the direct `supabase.from('quotes').select(...)` call with a `fetch()` to the new edge function
- Same error handling, same prefill logic — just a different data source

### Files Changed
- **New**: `supabase/functions/get-quote-for-form/index.ts`
- **Modified**: `src/pages/GuestForm.tsx` (lines ~236-277, swap supabase query for fetch call)

No database or RLS changes needed.

