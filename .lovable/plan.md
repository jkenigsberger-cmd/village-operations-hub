

# Keep Pricing Table on Same Page in Quote PDF

## Problem
When printing the client quote as PDF, content can break across pages unpredictably — the pricing table, totals, and payment box may end up split across two pages, making it hard for the client to read.

## Solution
Add CSS `page-break-inside: avoid` rules to keep related sections together on the same page, and use `page-break-after: always` after the first "info" page to create a clean two-page structure:

**Page 1**: Header + Client details + Activity details + Pricing table + Payment box + Version note  
**Page 2**: Terms & conditions + Signature block + Footer photo

## Changes — Single file: `src/lib/quoteUtils.ts`

Update `commonStyles` CSS to add:
- `page-break-inside: avoid` on the pricing table, `.payment-box`, and `.total-row`
- A wrapper class `.pricing-section` around the pricing table + payment box + note, with `page-break-inside: avoid` to keep them together
- `page-break-before: always` on `.terms` so terms start on a new page (keeping all financial info on page 1)
- Reduce some top margins/padding slightly to help everything fit on one A4 page

Wrap the pricing table, payment box, and version note in a `<div class="pricing-section">` in the HTML template.

