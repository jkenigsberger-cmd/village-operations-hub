

# Move "Upgraded Coffee" Toggle to the Meals Section

## Summary
Move the "☕ קפה משודרג" switch from the general group details card (line ~1172) to the Meals Plan card, placing it right before the "הוסף ארוחה" (Add Meal) button area so kitchen staff see it alongside meal planning.

## Changes

### `src/pages/AdminGroupEdit.tsx`
1. **Remove** the upgraded coffee switch block from the group details card (lines 1171-1181).
2. **Add** it inside the Meals Plan card header area (around line 1467), just before the "הוסף ארוחה" button -- displayed as a row with the switch on the left and the add-meal button on the right, so it's visible at the top of the meals section.

The toggle will appear as: `☕ קפה משודרג [switch]` in the meals card header, making it clear this is a kitchen-related option.

No other files need to change -- the data flow (save/load) already works correctly.
