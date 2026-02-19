
# Move "תמחור" Section Above "פרטי פעילות"

## What Changes
The "תמחור" (Pricing) card -- containing audience selector, activity type, and per-person price -- will be moved to appear **before** the "פרטי פעילות" (Activity Details) card in the quote editor layout.

## Technical Details

### File: `src/pages/AdminQuotes.tsx`

The two `<Card>` blocks will be swapped in order:

1. **Current order** (lines 582-659, then 661+):
   - "פרטי פעילות" card (group name, dates, nights, participants)
   - "תמחור" card (audience, activity type, price per person)

2. **New order**:
   - "תמחור" card (audience, activity type, price per person) -- moved up
   - "פרטי פעילות" card (group name, dates, nights, participants) -- moved down

No logic changes -- just reordering the two card blocks in the JSX.
