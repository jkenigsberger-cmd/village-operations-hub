
# Move "פרטי פעילות" Between Pricing and Workshops

## What Changes

The "פרטי פעילות" (Activity Details) card will be repositioned to appear **after** the accommodation pricing section and **before** the workshops section. This requires splitting the current "תמחור" card into two separate cards.

## Current Layout Order
1. **תמחור Card** (single large card containing):
   - Audience + Activity type
   - Accommodation pricing
   - Workshops
   - Lectures
   - Coffee corner, Addons, Adjustments, Discount
2. **פרטי פעילות Card** (group name, dates, nights, participants)
3. **סיכום Card** (totals)

## New Layout Order
1. **תמחור Card** (trimmed -- only top-level pricing config):
   - Audience + Activity type
   - Accommodation pricing
2. **פרטי פעילות Card** (moved here -- group name, dates, nights, participants)
3. **תוכן Card** (new card title -- the rest of the pricing content):
   - Workshops
   - Lectures
   - Coffee corner
   - Addons
   - Custom adjustments
   - Discount
4. **סיכום Card** (totals -- unchanged)

## Technical Details

### File: `src/pages/AdminQuotes.tsx`

1. **Close the תמחור Card early** -- after the accommodation pricing section (line 655), close `</CardContent>` and `</Card>`.

2. **Move the פרטי פעילות Card block** (lines 859-936) to appear right after the closed תמחור card.

3. **Open a new Card** for the remaining content (workshops, lectures, coffee, addons, adjustments, discount) with a title like "תוכן ותוספות" (Content and Extras).

4. The Separator before workshops (line 657) becomes unnecessary since they will be in a new card.

No logic changes -- purely a JSX restructuring.
