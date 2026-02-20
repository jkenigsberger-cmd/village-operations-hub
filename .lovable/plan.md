
# Add Upgraded Coffee Indicator to Calendar Group Events

## Summary
Show a small ☕ coffee emoji/badge on group event cards in the Master Calendar when the group has requested upgraded coffee. This involves passing the flag through event metadata and rendering it in the calendar views.

## Changes

### 1. `src/components/MasterCalendar.tsx` -- Pass `upgradedCoffee` in metadata
- In the group arrival event (line ~246), add `upgradedCoffee: group?.upgradedCoffee` to the metadata object.
- In the group departure event (line ~258 area), add the same.
- In the day-use group events (line ~208 area), add `upgradedCoffee: group.upgradedCoffee` to the metadata.

### 2. `src/components/CalendarDayView.tsx` -- Show coffee indicator
- In the **Check-in** cards (line ~227-236): after the title line, add a small ☕ indicator when `event.metadata?.upgradedCoffee` is true.
- In the **Check-out** cards (line ~264-273): same treatment.
- In the **hourly timeline event pills** (line ~346-349): append a ☕ emoji next to the title when the flag is set.
- In the **active neighborhood cards** (line ~193): add the indicator after the group name.

### 3. `src/components/CalendarWeekView.tsx` and `src/components/CalendarMonthView.tsx`
- If group events render with enough detail (title text), append ☕ to visible text when `event.metadata?.upgradedCoffee` is true. These views are more compact, so a simple emoji suffix on the title is sufficient.

## Visual Design
The indicator will be a small `☕` emoji displayed inline next to the group name or title -- keeping it minimal and consistent with the existing amber badge on the groups list page.
