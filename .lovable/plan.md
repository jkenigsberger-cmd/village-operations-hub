

# Polish GuestFormResponseView Design

## Goal
Redesign the response viewer to match the guest form's visual language — bordered rounded cards with subtotal bars, consistent spacing, and the same structural feel as the form's Step 3 (participants) layout.

## Changes — `src/components/GuestFormResponseView.tsx` only

### 1. Participants section — match form's card-per-group style
Replace the flat 4-column grid with 3 bordered card groups matching the form:
- **תלמידים** card: boys + girls counts side-by-side, subtotal bar below, lodging notes if present
- **צוות / מלווים** card: staff count, subtotal bar, lodging notes
- **נהגים, אבטחה ואחרים** card: count, subtotal bar, lodging notes
- **Grand total** bar: blue bg, same style as form's `bg-blue-50 border border-blue-200 rounded-xl`

Parse `tent_distribution_notes` to extract per-group notes (they're stored with prefixes like "צרכי לינה תלמידים:").

### 2. Section cards — use rounded-xl with amber accent divider
- Keep `SectionCard` but add the amber accent line (`h-0.5 w-12 bg-amber-500`) under section title, matching form's step header style
- Use `border-gray-200` consistently

### 3. ReadOnlyField — styled like form inputs
Render read-only fields with a light `bg-gray-50 rounded-lg px-4 py-2.5` container (similar to form's subtotal bars) so they look like disabled form fields rather than plain text.

### 4. CountField — use subtotal bar style
Replace the centered box style with the form's `bg-gray-50 rounded-lg px-4 py-2.5 flex justify-between` pattern showing label on the right and value on the left.

### 5. Overall container
- Match max-width (`max-w-2xl`) to form
- Card wrapper with `shadow-md` like the form's `Card` component

No data/logic changes. Same fields, same parsing, same sections.

