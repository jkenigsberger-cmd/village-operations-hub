

# Add Upgraded Coffee Indicator to Group Itinerary Modal

## Summary
Add the ☕ indicator to the Group Itinerary Modal (the daily schedule popup shown when clicking a group event). It should appear in the "פרטי קבוצה" (Group Details) section when the group has `upgradedCoffee` enabled.

## Changes

### `src/components/GroupItineraryModal.tsx`
- In the group summary section (around line 173), add a row showing "☕ קפה משודרג" when `group.upgradedCoffee` is true.
- Place it in the grid alongside group type, pax, staff, and dates -- as a `col-span-2` row with a coffee icon and label, styled with amber tones to match the existing badge on the groups list page.

