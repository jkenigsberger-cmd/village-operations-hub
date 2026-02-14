
# Remove +/- Buttons from Boys/Girls Inputs

## What Changes

The boys and girls numeric inputs currently use the `NumericInput` component with `showStepper` enabled, adding +/- buttons that clutter the mobile view. We will simplify them to clean, large inputs with a live total display.

## Changes to `src/pages/AdminGroupEdit.tsx`

### 1. Remove `showStepper` from Boys and Girls inputs
Remove the `showStepper` prop from both `NumericInput` components (lines ~1085 and ~1094).

### 2. Stack vertically on mobile, side-by-side on desktop
Change the grid from `grid-cols-2` to `grid-cols-1 sm:grid-cols-2` so the fields stack on small screens.

### 3. Add a live total line
Below the gender fields (before the existing validation warning), add a simple line:
```
סה"כ חניכים: X
```
This shows `(formData.boysCount || 0) + (formData.girlsCount || 0)` and updates live as the user types. This is separate from the existing validation check (which compares the sum to `participantCount`).

### 4. Make inputs larger on mobile
Add `className="h-14 text-lg md:h-12 md:text-base"` to both NumericInput components for a more touch-friendly size.

## No other files affected
- `NumericInput` component already has auto-select on focus (from previous change) -- no modifications needed there.
- VIP staff count keeps its `showStepper` as requested.
- No database or logic changes.
