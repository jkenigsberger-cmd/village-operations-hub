
# Fix: Mobile Calendar Design Issues

## Problems Identified

1. **Month view day cells**: Event indicator dots overflow outside the day cell boundaries on mobile. Multiple rows of dots push content below the cell's visible area.

2. **MasterCalendar header bloat**: On mobile, the header area (title, tabs, date navigation, 6 filter buttons, full legend) takes up nearly the entire screen, pushing the actual calendar content below the fold.

3. **Week view columns too narrow**: 7 columns on a 375px screen means each column is ~53px wide, making event cards unreadable and cramped.

4. **Filter buttons wrapping**: The 6 filter buttons wrap into 3 rows on mobile, wasting vertical space.

5. **Legend always visible**: The full legend with 6 items takes another chunk of space on mobile.

## Solution

### 1. `src/components/CalendarMonthView.tsx` - Contain dots inside cells

- Add `overflow-hidden` to each day cell so dots never escape their boundaries
- On mobile, limit dots to a single row (max 4 dots) and hide the rest
- Reduce `min-h-[80px]` to `min-h-[56px]` on mobile (`min-h-[56px] sm:min-h-[100px]`)
- Make the dot wrapper use `flex-wrap` with `max-h` to clip overflow

### 2. `src/components/MasterCalendar.tsx` - Compact mobile header

- **Date navigation row**: On mobile, make the date label button use a smaller font and shorter format (e.g., "13 פבר׳ 2026" instead of "יום שישי, 13 בפברואר 2026")
- **Filter buttons**: On mobile, collapse into a single dropdown/popover button ("סינון") instead of showing all 6 buttons inline. Desktop stays unchanged.
- **Legend**: Hide the legend on mobile by default (add `hidden sm:flex` class). The colored dots in month/week views are self-explanatory with the filter button labels.
- **Title**: Reduce title size on mobile (`text-xl sm:text-2xl`)

### 3. `src/components/CalendarWeekView.tsx` - Mobile-friendly week layout

- On mobile, make the week view horizontally scrollable with a `min-w-[600px]` inner container so columns aren't crushed to 53px
- Add `overflow-x-auto` wrapper

### 4. `src/components/CalendarDayView.tsx` - Stack layout on mobile

- The sidebar (all-day events) and timeline already stack vertically on mobile via `flex-col lg:flex-row` -- this is fine, just verify no overflow on event cards
- Add `overflow-hidden` and `text-ellipsis` on event title containers to prevent horizontal overflow

## Files to Modify

| File | Change |
|------|--------|
| `src/components/CalendarMonthView.tsx` | Contain dots, reduce cell height on mobile |
| `src/components/MasterCalendar.tsx` | Compact date label, collapsible filters, hide legend on mobile |
| `src/components/CalendarWeekView.tsx` | Horizontal scroll wrapper for narrow screens |
| `src/components/CalendarDayView.tsx` | Prevent event card text overflow |

## Technical Details

**CalendarMonthView cell fix:**
```
// Before
className="min-h-[80px] sm:min-h-[100px] ... p-1 sm:p-2"

// After
className="min-h-[56px] sm:min-h-[100px] ... p-1 sm:p-2 overflow-hidden"
```

**MasterCalendar filter collapse on mobile:**
- Wrap filters in a Popover on mobile using `useIsMobile()` hook
- Show a single "סינון" button that opens a popover with all filter toggles
- Desktop: keep current inline layout unchanged

**MasterCalendar date label shortening:**
```
// Mobile-friendly date format
case 'day':
  return isMobile 
    ? format(selectedDate, "d בMMM yyyy", { locale: he })
    : format(selectedDate, "EEEE, d בMMMM yyyy", { locale: he });
```

**CalendarWeekView scroll:**
```
<div className="overflow-x-auto">
  <div className="min-w-[600px]">
    {/* existing grid-cols-7 layout */}
  </div>
</div>
```
