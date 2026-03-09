

# Add Organization & Bank Details to Client Quote

## What
Insert two static information blocks after the payment box + version note (line 345) and before the terms section (line 347):

1. **ח.פ**: קרן שמש הדור הבא (ע"ר) — 580786812
2. **פרטי חשבון הבנק**: קרן שמש הדור הבא (ע"ר) בנק הפועלים- 12 סניף- 170 חשבון- 368365

## Where
**File:** `src/lib/quoteUtils.ts`, between lines 345 and 347.

## Changes

1. **Add CSS** in `commonStyles`: a `.org-details` class with styled box (matching the existing `.payment-box` look — bordered, padded, RTL).

2. **Insert HTML** after `</div>` (closing `.pricing-section`, line 345) and before `<div class="terms">` (line 347):

```html
<div class="org-details">
  <p><strong>ח.פ:</strong> קרן שמש הדור הבא (ע"ר) — 580786812</p>
  <p><strong>פרטי חשבון הבנק:</strong> קרן שמש הדור הבא (ע"ר) בנק הפועלים- 12 סניף- 170 חשבון- 368365</p>
</div>
```

Single file change, static content only.

