

# Fix Group Type Buttons Overflow on Mobile

## Problem
The "סוג קבוצה" (Group Type) toggle buttons overflow on mobile. The "פעילות יום ללא לינה" button text is too long, causing it to get cut off or push outside the card boundary on small screens.

## Fix in `src/pages/AdminGroupEdit.tsx` (lines 839-861)

### 1. Stack buttons vertically on mobile
Change the button container from `flex gap-4` to `flex flex-col sm:flex-row gap-2 sm:gap-4` so the two buttons stack on phones and sit side-by-side on wider screens.

### 2. Reduce button text size on mobile
Add `text-sm` to both buttons so the longer Hebrew text fits comfortably even when side-by-side on tablets.

### 3. Allow text wrapping
Add `whitespace-normal text-center` to the buttons so that if they are side-by-side, long text wraps instead of overflowing.

## Technical Details

**File:** `src/pages/AdminGroupEdit.tsx`
- Line 839: Change `<div className="flex gap-4">` to `<div className="flex flex-col sm:flex-row gap-2 sm:gap-4">`
- Lines 840-861: Add `whitespace-normal text-center h-auto py-3` to both Button components to allow text wrapping and adequate height

No other files or logic affected.
