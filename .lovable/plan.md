

# Click-to-Enlarge Maintenance Cards

## What will change

When you tap/click on any maintenance card in the Maintenance tab, it will open as a larger, centered modal overlay -- making the image, description, and details much easier to read. The "resolve" button will also be available inside the modal.

## Technical Details

### File: `src/pages/Index.tsx`

1. **Add state** for the selected maintenance item:
   - `expandedMaintenanceItem` -- stores the clicked card's data (facility, activity space, or VIP task) plus its type
   - `setExpandedMaintenanceItem` -- setter to open/close the modal

2. **Make each card clickable**: Wrap the three card types (bathroom/shower facilities, activity spaces, VIP tent tasks) with an `onClick` handler that sets the expanded item state. The "resolve" button inside the card will use `e.stopPropagation()` so it still works without opening the modal.

3. **Add a modal overlay** (reusing the same pattern from the Facilities page -- a fixed overlay with centered content):
   - Shows the card's title, status, full-size image (not cropped to h-32), description/notes, and location
   - Includes the same "resolve" button
   - Close via X button or clicking the backdrop
   - Responsive: full-screen on mobile, max-width centered card on desktop

### Changes summary

| File | Change |
|------|--------|
| `src/pages/Index.tsx` | Add `expandedMaintenanceItem` state, onClick handlers on all 3 card types, and a detail modal overlay at the bottom of the maintenance section |

No new files or components needed -- the modal is simple enough to inline, matching the existing pattern used on the Facilities page.

