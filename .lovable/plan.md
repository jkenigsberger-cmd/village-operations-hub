
# Fix: Facilities Page Mobile Layout

## Problems Identified

1. **Area header overflow**: The `flex justify-between` layout crams the area name (right), facility count, attention badge, and chevron (left) into one row. On mobile (~375px), the attention badge ("1 דורש תשומת לב") overlaps the area name text.

2. **Facility tiles grid**: Using `grid-cols-1` on mobile means each small tile takes the full width, creating a long vertical scroll. With 16 facilities, this is excessive.

## Solution

### 1. `src/pages/Facilities.tsx` - Responsive area header

- On mobile, stack the header content vertically: area name on top, stats row (count + attention badge + chevron) below
- Reduce padding from `p-6` to `p-4` on mobile
- Make attention badge text smaller on mobile
- Change facility grid from `grid-cols-1` to `grid-cols-2` on mobile so tiles are compact side-by-side

### 2. `src/components/FacilityCard.tsx` - Compact FacilityTile on mobile

- Reduce padding from `p-4` to `p-3`
- Make the gender icon smaller (`text-xl` instead of `text-2xl`)
- Reduce font size of the label
- Ensure status badges wrap properly and don't overflow

## Files to Modify

| File | Change |
|------|--------|
| `src/pages/Facilities.tsx` | Stack header vertically on mobile, 2-col grid for tiles, smaller padding |
| `src/components/FacilityCard.tsx` | Compact FacilityTile: smaller padding, text, icons on mobile |

## Technical Details

**Facilities.tsx - area header:**
```
// Before: single row that overflows
<button className="w-full p-6 flex items-center justify-between text-right">

// After: stack on mobile, row on desktop
<button className="w-full p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between text-right gap-3">
  <div className="text-right">  {/* area name - always on top on mobile */}
  <div className="flex items-center gap-3 sm:gap-4">  {/* stats row below */}
```

**Facilities.tsx - facility grid:**
```
// Before
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

// After - 2 columns on mobile
<div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
```

**FacilityCard.tsx - compact tile:**
```
// Before
<button className="tile p-4 text-left w-full border-2">
  <span className="text-2xl">{genderIcon}</span>
  <h5 className="font-bold">{facility.label}</h5>

// After
<button className="tile p-3 sm:p-4 text-left w-full border-2">
  <span className="text-lg sm:text-2xl">{genderIcon}</span>
  <h5 className="font-bold text-sm sm:text-base">{facility.label}</h5>
```

Also wrap status badges with `flex-wrap` to prevent overflow in narrow 2-col cells.
