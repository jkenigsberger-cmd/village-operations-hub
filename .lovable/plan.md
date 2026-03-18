

# Plan: 4 Changes to Quotes + Guest Form

## 1. Fix email/ח.פ confusion
**Problem**: The `clientEmail` field in `QuoteClientDetails` is being used for ח.פ/ע.מ in AdminQuotes but then prefilled as email in the guest form.

**Solution**: Add a new `clientTaxId` field to `QuoteClientDetails` type. In AdminQuotes, use `clientTaxId` for ח.פ/ע.מ and add a separate `clientEmail` field for email (optional). In the guest form, stop prefilling email from the quote — leave it blank for the client to fill. Show ח.פ/ע.מ as read-only info if present.

**Files**: `src/types/quote.ts`, `src/pages/AdminQuotes.tsx`, `src/pages/GuestForm.tsx`, `src/lib/quoteUtils.ts` (quote doc HTML)

## 2. Rename coffee corner to "פינת קפה ועוגיות"
**Solution**: Update label everywhere:
- `AdminQuotes.tsx` line 1074: "פינת קפה" → "פינת קפה ועוגיות"  
- `AdminQuotes.tsx` line 628: summary label
- `quoteUtils.ts` lines 283, 470: HTML doc labels
- `GuestForm.tsx` line 655: "פינת קפה משודרגת" → "פינת קפה ועוגיות"

**Files**: `src/pages/AdminQuotes.tsx`, `src/lib/quoteUtils.ts`, `src/pages/GuestForm.tsx`

## 3. Split staff into 2 groups in the guest form
**Problem**: Currently one "צוות / מלווים / אחרים" field.

**Solution**: Split into two sections:
- **צוות** (staff/escorts) — one count field
- **נהגים, אבטחה ואחרים** (drivers, security, others) — separate count field

Update the form state to have `staff_count` and `drivers_security_count`. The grand total sums both. Submission sends both values (can combine into staff_count or add a new field in the payload).

**Files**: `src/pages/GuestForm.tsx`

## 4. Add arrival time field to schedule step in guest form
**Solution**: At the top of Step 4 (schedule/activities), add a "שעת הגעה" (arrival time) input field before the activity items list.

**Files**: `src/pages/GuestForm.tsx`

## Migration
The `QuoteClientDetails` type change (adding `clientTaxId`) is backward-compatible since existing quotes store data in JSONB. Old quotes with ח.פ in `clientEmail` will show it in email until re-saved — but the guest form will no longer prefill email from quote data regardless, so no breakage.

