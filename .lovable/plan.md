

## Plan: Improve Facility Area Title Aesthetics

### Summary
Enhance the visual presentation of facility area titles and add "שירותים" prefix to dining hall area names.

---

### Changes Required

#### 1. Update Area Names in `src/data/initialData.ts`

| Current Name | New Name |
|--------------|----------|
| חדר אוכל - גברים | שירותים חדר אוכל - גברים |
| חדר אוכל - נשים | שירותים חדר אוכל - נשים |

**Lines to modify:** 406 and 466

---

#### 2. Improve Title Styling in `src/pages/Facilities.tsx`

Current layout shows all text stacked without clear visual hierarchy. New design:

```text
┌─────────────────────────────────────────────────┐
│                                                 │
│                    שירותים חדר אוכל - גברים      │  ← Main title (large, bold)
│                                                 │
│         מקלחות 1-3, 5-12 | תא 4 ♿ | תאים 13-16   │  ← Description (small, muted, lighter)
│                                                 │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│                                                 │
│                      מתא 33 עד 36               │  ← Main title (large, bold)
│                      בין שכונה 1 ל-2            │  ← Location (smaller, lighter gray)
│                                                 │
│                       4 שירותים                 │  ← Description (small, muted)
│                                                 │
└─────────────────────────────────────────────────┘
```

**Styling improvements:**
- Main title: `text-xl font-semibold` (slightly smaller than current)
- Location subtitle: `text-xs text-muted-foreground/70` (smaller and even lighter)
- Description: `text-xs text-muted-foreground/60 mt-1` (very subtle)
- Better spacing between elements

---

### Technical Details

**File 1: `src/data/initialData.ts`**
- Line 406: Change `'חדר אוכל - גברים'` → `'שירותים חדר אוכל - גברים'`
- Line 466: Change `'חדר אוכל - נשים'` → `'שירותים חדר אוכל - נשים'`

**File 2: `src/pages/Facilities.tsx`**
- Lines 110-124: Refine the title rendering with better visual hierarchy
- Use smaller, lighter text for parenthetical location info
- Reduce overall visual weight for cleaner appearance

---

### Data Migration Note
The migration in `useVillageData.ts` already handles facility label updates, so users will see the new names after refresh.

