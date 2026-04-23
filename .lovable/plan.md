

## Quote & Pricing Logic Documentation

Generate `/mnt/documents/Quote_Pricing_Logic_Documentation.md` — a clean, organized reference covering the full quote system, pricing rules, and the students vs. staff (צוות) distinction.

### Contents

1. **Overview** — Snapshot-based quote architecture (state frozen at creation, separate from live group data), versioning, lifecycle (`draft` → `sent` → `approved` → `rejected`/`expired`).

2. **Audience Model** — The two pricing tracks:
   - **Students (תלמידים)** → per-person pricing
   - **Adults / מבוגרים** → per-tent-per-night pricing
   - How `staff` (צוות) fits in: counted in `staffTotal` and `totalPax` but priced under whichever audience track the quote uses (no separate "staff price" — they share the chosen model).

3. **Accommodation Pricing**:
   - **Students activity types**:
     - `day_activity` — 125 ₪/person (no nights)
     - `midweek_lodging` — 190 ₪/person/night
     - `weekend_lodging` — 250 ₪/person/night
   - **Adults tent pricing** (per tent, per night):
     - 3-bed tent — 340 ₪
     - 6/8-bed tent — 250 ₪
   - Nights calculation = `departure_date − arrival_date`

4. **Workshops Catalog** — 9 fixed items, audience-priced:
   - Students: 750 ₪ each
   - Adults: 1,500 ₪ each (3 workshops are students-only)
   - Selected from dropdown, quantity adjustable

5. **Lectures Catalog** — 5 fixed items with lecturer name:
   - 3 lectures: 2,500 ₪ (no VAT)
   - 1 lecture: 1,500 ₪ (no VAT)
   - 1 lecture: 5,000 ₪ + 18% VAT = 5,900 ₪

6. **Add-ons & Extras**:
   - **Coffee Corner** — 15 ₪/person (toggleable, multiplied by total pax)
   - **Custom add-ons** — name + per-person price + quantity
   - **Custom adjustments** — free-text line items (positive = surcharge, negative = discount)
   - **Discount %** — applied to subtotal with optional reason

7. **Totals & Payment Schedule**:
   - `subtotalBeforeDiscount` = accommodation + workshops + lectures (incl. VAT) + coffee + addons + adjustments
   - `discountAmount` = subtotal × discount%
   - `totalAfterDiscount` = subtotal − discount
   - **Advance payment** = 30% of total
   - **Balance payment** = 70% of total

8. **Students vs. Staff (צוות) — Simple Implementation**:
   - **Counts**: `studentsTotal` + `staffTotal` = `totalPax`
   - **Pricing**: Both groups priced together under the chosen audience track
   - **Override flags**: `studentsOverride`, `staffOverride`, `tentCountsOverride` allow manual edits without recomputing from group data
   - **Recommendation for clarity**: When staff need different treatment (e.g. free lodging, separate tent count), use a **custom adjustment** line (negative amount for staff discount) rather than a separate price tier — keeps the model simple

9. **Snapshot vs. Live Data** — Why pricing is frozen at quote creation (`snapshot` JSONB captures dates, pax counts, tent breakdown, nights) and how new versions are created when data changes.

10. **Document Generation** — Client PDF (blue theme #0b2fd6) and Operational PDF, generated via `window.print()` in Hebrew RTL.

11. **Quick Reference Table** — One-page cheat sheet of all prices.

### Technical Details
- Single Markdown file (~350 lines)
- Code references: `src/types/quote.ts`, `src/lib/quoteUtils.ts`, `src/hooks/useQuotes.ts`, `src/pages/AdminQuotes.tsx`
- Includes worked examples: one students quote, one adults quote, showing line-by-line totals

