

# Move Availability Calendar to the Top

## Changes in `src/pages/AdminQuotes.tsx`

### 1. List View (lines ~416-508)
Move `<QuoteAvailabilityCalendar />` from the bottom (line 507) to right after the action buttons (after line ~435), so it appears at the top of the page before the quotes list.

### 2. Edit View (lines ~697-701)
The calendar is currently at the bottom of the left sidebar (line 697-701). Move it to the top of the sidebar, right after the sticky top actions bar — before the summary/actions cards. This way the booking person sees availability first when creating/editing a quote.

Both moves are simple cut-paste of the existing JSX — no logic changes.

