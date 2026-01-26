
## Plan: Rename Facilities with Hebrew Numbers + Reorder by Number

### Summary
Update all facility labels and area names to Hebrew with specific numbers, and reorder the areas so they appear in numerical order (dining hall first with numbers 1-32, then outdoor areas 33-46).

---

### Changes to `src/data/initialData.ts`

The `createFacilities()` function will be completely restructured to:
1. **Create areas in numerical order** (lowest numbers first)
2. **Use Hebrew labels** for all facilities
3. **Split dining hall into male/female sections**

---

### New Area Order (by facility numbers)

| Order | Area Name | Facility Numbers |
|-------|-----------|------------------|
| 1 | חדר אוכל - גברים | 1-16 |
| 2 | חדר אוכל - נשים | 17-32 |
| 3 | מתא 33 עד 36 (בין שכונה 1 ל-2) | 33-36 |
| 4 | מתא 37 עד 38 (בין שכונה 3 ל-4) | 37-38 |
| 5 | מתא 39 עד 42 (אוהלים לבנים) | 39-42 |
| 6 | מתא 43 עד 46 (בין שכונה 4 ל-7) | 43-46 |

---

### Detailed Facility Breakdown

#### Area 1: חדר אוכל - גברים (Male Dining Hall Facilities)
| Number | Type | Hebrew Label |
|--------|------|--------------|
| 1 | Shower | מקלחת 1 |
| 2 | Shower | מקלחת 2 |
| 3 | Shower | מקלחת 3 |
| 4 | Toilet (Accessible) | תא 4 ♿ |
| 5 | Shower | מקלחת 5 |
| 6 | Shower | מקלחת 6 |
| 7 | Shower | מקלחת 7 |
| 8 | Shower | מקלחת 8 |
| 9 | Shower | מקלחת 9 |
| 10 | Shower | מקלחת 10 |
| 11 | Shower | מקלחת 11 |
| 12 | Shower | מקלחת 12 |
| 13 | Toilet | תא 13 |
| 14 | Toilet | תא 14 |
| 15 | Toilet | תא 15 |
| 16 | Toilet | תא 16 |

**Description:** `מקלחות 1-3, 5-12 | תא 4 ♿ | תאים 13-16`

---

#### Area 2: חדר אוכל - נשים (Female Dining Hall Facilities)
| Number | Type | Hebrew Label |
|--------|------|--------------|
| 17 | Toilet | תא 17 |
| 18 | Toilet | תא 18 |
| 19 | Toilet | תא 19 |
| 20 | Toilet | תא 20 |
| 21 | Toilet (Accessible) | תא 21 ♿ |
| 22 | Shower | מקלחת 22 |
| 23 | Shower | מקלחת 23 |
| 24 | Shower | מקלחת 24 |
| 25 | Shower | מקלחת 25 |
| 26 | Shower | מקלחת 26 |
| 27 | Shower | מקלחת 27 |
| 28 | Shower | מקלחת 28 |
| 29 | Shower | מקלחת 29 |
| 30 | Shower | מקלחת 30 |
| 31 | Shower | מקלחת 31 |
| 32 | Shower | מקלחת 32 |

**Description:** `תאים 17-20 | תא 21 ♿ | מקלחות 22-32`

---

#### Area 3: מתא 33 עד 36 (בין שכונה 1 ל-2)
| Number | Type | Hebrew Label |
|--------|------|--------------|
| 33 | Toilet (Unisex) | תא 33 |
| 34 | Toilet (Unisex) | תא 34 |
| 35 | Toilet (Unisex) | תא 35 |
| 36 | Toilet (Unisex) | תא 36 |

**Description:** `4 שירותים`

---

#### Area 4: מתא 37 עד 38 (בין שכונה 3 ל-4)
| Number | Type | Hebrew Label |
|--------|------|--------------|
| 37 | Toilet (Unisex) | תא 37 |
| 38 | Toilet (Unisex) | תא 38 |

**Description:** `2 שירותים`

---

#### Area 5: מתא 39 עד 42 (אוהלים לבנים)
| Number | Type | Hebrew Label |
|--------|------|--------------|
| 39 | Toilet (Unisex) | תא 39 |
| 40 | Toilet (Unisex) | תא 40 |
| 41 | Toilet (Unisex) | תא 41 |
| 42 | Toilet (Unisex) | תא 42 |

**Description:** `4 שירותים`

---

#### Area 6: מתא 43 עד 46 (בין שכונה 4 ל-7)
| Number | Type | Hebrew Label |
|--------|------|--------------|
| 43 | Toilet (Unisex) | תא 43 |
| 44 | Toilet (Unisex) | תא 44 |
| 45 | Toilet (Unisex) | תא 45 |
| 46 | Toilet (Unisex) | תא 46 |

**Description:** `4 שירותים`

---

### Technical Implementation

```text
┌─────────────────────────────────────────────┐
│         createFacilities() function         │
├─────────────────────────────────────────────┤
│ 1. Create Male Dining Area (1-16)           │
│    - Showers: מקלחת 1, 2, 3                 │
│    - Accessible: תא 4 ♿                     │
│    - Showers: מקלחת 5-12                    │
│    - Toilets: תא 13-16                      │
├─────────────────────────────────────────────┤
│ 2. Create Female Dining Area (17-32)        │
│    - Toilets: תא 17-20                      │
│    - Accessible: תא 21 ♿                    │
│    - Showers: מקלחת 22-32                   │
├─────────────────────────────────────────────┤
│ 3. Create N1-N2 Area (33-36)                │
│    - Toilets: תא 33, 34, 35, 36             │
├─────────────────────────────────────────────┤
│ 4. Create N3-N4 Area (37-38)                │
│    - Toilets: תא 37, 38                     │
├─────────────────────────────────────────────┤
│ 5. Create White Tents Area (39-42)          │
│    - Toilets: תא 39, 40, 41, 42             │
├─────────────────────────────────────────────┤
│ 6. Create N4-N7 Area (43-46)                │
│    - Toilets: תא 43, 44, 45, 46             │
└─────────────────────────────────────────────┘
```

---

### File Modified
**`src/data/initialData.ts`** - Lines 331-535 (complete rewrite of `createFacilities()` function)

### No Functionality Changes
- All facility types (TOILET/SHOWER) remain correct
- All genders (MALE/FEMALE/UNISEX) remain correct
- Accessible facilities retain `isAccessible: true`
- Only labels, area names, descriptions, and order change

### Data Migration Note
Users with existing data in LocalStorage will see old labels until they clear browser data. New installations will see the updated Hebrew labels immediately.
