

# Add Terms & Conditions to Client Quote PDF

## What
Insert a full "תנאי ההסכם" section into the client quote HTML document, placed **after** the payment box and notes, but **before** the footer photo.

## Where
**File:** `src/lib/quoteUtils.ts` — `buildClientDocHTML()` function, lines ~331–340.

## Changes

1. **Add CSS** in `commonStyles` for the terms section:
   - `.terms` section with proper spacing, RTL text
   - `.terms h2` styled consistently with existing headers
   - `.terms ul` / `.terms li` for bullet points
   - `.signature-block` for the signature lines at the bottom

2. **Insert HTML block** between the current `.note` paragraphs (line ~332) and the `.postcard` div (line ~334):

   The block will contain:
   - **Header**: "תנאי ההסכם"
   - **Quote validity**: 14 days
   - **Signed return = booking confirmation**
   - **Payment terms**: 30% advance one month before, 70% on arrival
   - **Cancellation policy**: 7+ days = 5% or ₪100 (lower); <7 days = 25%
   - **Changes policy**: up to 10 days before; billing based on higher of reported vs actual count; dietary updates up to 10 days
   - **House rules**: no outside food; damage charges
   - **Signature block**: Full name, role, signature lines + paying entity name and registration number

3. **Update the existing note** on line 331 — change "30 יום" to "14 יום" to match the terms, or remove the old note since the terms section now covers validity.

4. **Print styling**: Add `page-break-before: auto` on the terms section so it flows naturally in A4 print.

## Implementation Detail

The terms text is static (not data-driven), so it will be a hardcoded HTML string inserted into the template. No new types or data changes needed.

| Line Range | Change |
|------------|--------|
| ~176-205 (`commonStyles`) | Add `.terms`, `.signature-line`, `.signature-block` CSS |
| ~331-340 (between notes and postcard) | Replace old validity note + insert full terms HTML + signature block |

