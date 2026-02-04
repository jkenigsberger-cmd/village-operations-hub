
## Plan: Add Allergies Numeric Count to Group Meals Block

### Problem Identified
The Kitchen module has **6 special diet fields** including a separate **numeric count for allergies** (`allergies: number`) plus a **notes field** (`notes: string`).

But the Group's `MealPlanItem` interface only has 5 fields with `allergiesNotes` combining both into just a text field - **missing the allergies count**.

**Kitchen SpecialDiets (correct):**
| Field | Type | Hebrew Label |
|-------|------|--------------|
| vegetarian | number | 🌱 צמחוני |
| vegan | number | 🥬 טבעוני |
| glutenFree | number | 🚫 ללא גלוטן |
| lactoseFree | number | 🥛 ללא לקטוז |
| allergies | number | 🥜 אלרגיות |
| notes | string | ✏️ דרישות מיוחדות |

**Current Group MealPlanItem (missing allergies count):**
| Field | Type | Issue |
|-------|------|-------|
| vegetarian | number | ✓ |
| vegan | number | ✓ |
| glutenFree | number | ✓ |
| lactoseFree | number | ✓ |
| allergiesNotes | string | ❌ Missing numeric count |

---

### Solution

Update the `MealPlanItem.specialDiets` interface to match the Kitchen's structure exactly, then add the missing allergies numeric input field in the UI.

---

### Changes

#### 1. Update `src/types/adminGroups.ts`

Change the `specialDiets` structure in `MealPlanItem`:

**Before:**
```typescript
specialDiets?: {
  vegetarian: number;
  vegan: number;
  glutenFree: number;
  lactoseFree: number;
  allergiesNotes: string;  // Only text
};
```

**After:**
```typescript
specialDiets?: {
  vegetarian: number;
  vegan: number;
  glutenFree: number;
  lactoseFree: number;
  allergies: number;       // NEW: Numeric count
  allergiesNotes: string;  // Keep for backwards compatibility
};
```

---

#### 2. Update `src/pages/AdminGroupEdit.tsx` - Add Allergies Count Field

Add a 5th numeric input for "🥜 אלרגיות" in the special needs grid (currently has 4 inputs in a 2x2 or 4-column grid):

**Current layout (4 fields):**
```
┌──────────────┬──────────────┐
│ 🌱 צמחוני    │ 🥬 טבעוני    │
├──────────────┼──────────────┤
│ 🚫 ללא גלוטן │ 🥛 ללא לקטוז │
└──────────────┴──────────────┘
🥜 אלרגיות / הערות [textarea]
```

**New layout (5 numeric + 1 text):**
```
┌──────────────┬──────────────┬──────────────┐
│ 🌱 צמחוני    │ 🥬 טבעוני    │ 🚫 ללא גלוטן │
├──────────────┼──────────────┼──────────────┤
│ 🥛 ללא לקטוז │ 🥜 אלרגיות   │              │
└──────────────┴──────────────┴──────────────┘
✏️ הערות נוספות [textarea]
```

---

### Implementation Details

#### File 1: `src/types/adminGroups.ts`

Update lines 18-24:

```typescript
specialDiets?: {
  vegetarian: number;
  vegan: number;
  glutenFree: number;
  lactoseFree: number;
  allergies: number;        // Add this line
  allergiesNotes: string;
};
```

---

#### File 2: `src/pages/AdminGroupEdit.tsx`

**A) Add allergies field in the grid (around line 1263):**

Insert a new input between lactoseFree and the allergiesNotes textarea:

```tsx
<div className="space-y-1">
  <label className="text-xs text-muted-foreground">🥜 אלרגיות</label>
  <NumericInput
    value={meal.specialDiets?.allergies || 0}
    onChange={(val) => updateMealPlanItem(meal.id, { 
      specialDiets: { 
        ...meal.specialDiets, 
        vegetarian: meal.specialDiets?.vegetarian || 0,
        vegan: meal.specialDiets?.vegan || 0,
        glutenFree: meal.specialDiets?.glutenFree || 0,
        lactoseFree: meal.specialDiets?.lactoseFree || 0,
        allergies: val,
        allergiesNotes: meal.specialDiets?.allergiesNotes || ''
      } 
    })}
    min={0}
    max={meal.pax}
  />
</div>
```

**B) Update grid to accommodate 5 fields:**

Change from `grid-cols-2 md:grid-cols-4` to `grid-cols-2 md:grid-cols-5` or keep as 4 with 5 items (wrapping one).

**C) Update all existing specialDiets updates to include the new `allergies` field:**

Each update call needs to preserve `allergies: meal.specialDiets?.allergies || 0`.

**D) Rename the notes label:**

Change `"🥜 אלרגיות / הערות"` to `"✏️ הערות נוספות"` since allergies now has its own numeric field.

---

### Visual Result

After implementation, the special needs section will show:

```
┌─────────────────────────────────────────────────────────────────┐
│ צרכים מיוחדים                                                  │
├─────────────────────────────────────────────────────────────────┤
│ 🌱 צמחוני  🥬 טבעוני  🚫 ללא גלוטן  🥛 ללא לקטוז  🥜 אלרגיות  │
│   [ 12 ]     [ 5 ]       [ 3 ]        [ 2 ]        [ 4 ]      │
├─────────────────────────────────────────────────────────────────┤
│ ✏️ הערות נוספות                                                │
│ ┌─────────────────────────────────────────────────────────────┐│
│ │ בוטנים - 2 אנשים, ביצים - 1 איש                            ││
│ └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
```

---

### Migration

Existing data with `allergiesNotes` but no `allergies` count will continue to work - the count defaults to 0 and the notes remain.

---

### Files to Modify

| File | Change |
|------|--------|
| `src/types/adminGroups.ts` | Add `allergies: number` to specialDiets interface |
| `src/pages/AdminGroupEdit.tsx` | Add allergies numeric input, update grid, rename notes label |

---

### Acceptance Tests

| # | Test | Expected |
|---|------|----------|
| 1 | Add meal with pax > 0 | Special needs section shows 5 numeric fields (צמחוני, טבעוני, ללא גלוטן, ללא לקטוז, אלרגיות) |
| 2 | Enter allergies count (e.g., 4) | Value persists in field |
| 3 | Enter notes in "הערות נוספות" | Notes persist separately from allergies count |
| 4 | Save group and refresh | All special diet values including allergies count are preserved |
| 5 | Old groups without allergies field | Display correctly with allergies = 0 by default |
