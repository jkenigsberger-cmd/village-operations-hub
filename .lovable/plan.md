

# Update Special Diets: Rename "Allergies" + Add "Mehadrin Kosher" and "Sensitivities"

## Summary
Three changes to the dietary requirements system:
1. **Rename** "אלרגיות" (allergies) to "סכנת חיים" (life-threatening) -- marks dangerous allergies
2. **Add** "כשר למהדרין" (Mehadrin Kosher) -- new numeric field
3. **Add** "רגישויות" (Sensitivities) -- new numeric field

These changes apply everywhere special diets appear: the Kitchen page, the Admin Group Edit meal plan, and the Master Calendar event detail.

## No Database Migration Needed
The `special_diets` column in `kitchen_time_slots` is stored as `jsonb`, so adding new fields requires no schema change -- the new keys will simply be included in the JSON object.

---

## Technical Changes

### 1. `src/types/kitchen.ts` -- Core type + labels
- **`SpecialDiets` interface**: rename `allergies` to `lifeThreatening`, add `mehadrinKosher: number` and `sensitivities: number`
- **`DIET_LABELS`**: update to reflect new names/emojis:
  - `lifeThreatening: '⚠️ סכנת חיים'`
  - `mehadrinKosher: '✡️ כשר למהדרין'`
  - `sensitivities: '🤧 רגישויות'`

### 2. `src/types/adminGroups.ts` -- Group meal plan type
- In the `MealPlanItem.specialDiets` interface: rename `allergies` to `lifeThreatening`, add `mehadrinKosher` and `sensitivities` fields (numbers, default 0)

### 3. Default value helpers (3 files)
- `src/hooks/useKitchenData.ts` -- `getDefaultSpecialDiets()`
- `src/hooks/useSupabaseKitchen.ts` -- `getDefaultSpecialDiets()`
- `src/components/AddTimeSlotModal.tsx` -- `DEFAULT_SPECIAL_DIETS`
- Add `lifeThreatening: 0, mehadrinKosher: 0, sensitivities: 0` and remove old `allergies: 0`

### 4. `src/lib/groupSync.ts` -- Sync converter
- `convertSpecialDiets()`: map `meal.specialDiets?.lifeThreatening`, `mehadrinKosher`, and `sensitivities` instead of `allergies`

### 5. Kitchen UI components (3 files)
- `src/components/TimeSlotCard.tsx` -- update `totalSpecial` sum to use `lifeThreatening` + `mehadrinKosher` + `sensitivities` instead of `allergies`
- `src/components/TimeSlotDetailModal.tsx` -- uses `DIET_LABELS` dynamically, will auto-pick up new fields; update the initial state default
- `src/components/AddTimeSlotModal.tsx` -- same dynamic rendering, update default state

### 6. `src/components/KitchenEventDetailModal.tsx` -- Calendar detail modal
- Replace `specialDiets.allergies` reference with `specialDiets.lifeThreatening`, add blocks for `mehadrinKosher` and `sensitivities`

### 7. `src/pages/AdminGroupEdit.tsx` -- Group meal plan form
- Replace all "אלרגיות" diet field references with "סכנת חיים" (`lifeThreatening`)
- Add two new `NumericInput` blocks for "כשר למהדרין" and "רגישויות"
- Update all the spread patterns where `specialDiets` is reconstructed to include the new fields
- The grid will go from 5 columns to accommodate 7 diet fields (will use responsive grid)

### 8. Backward Compatibility
- Existing `kitchen_time_slots` rows in the DB still have `allergies` in their JSON. The code will gracefully handle this: when reading `specialDiets` from DB, if `lifeThreatening` is missing but `allergies` exists, map `allergies` to `lifeThreatening`. This will be done in the data loading functions in `useKitchenData.ts` and `useSupabaseKitchen.ts`.

