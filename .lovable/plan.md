

## Plan: Fix Group Selector Visibility in Neighborhood Reservation Modal

### Problem Summary
The group selector (dropdown to link a reservation to an existing admin group) is not visible because it only appears when:
1. Both check-in **and** check-out dates are entered
2. At least one saved group's dates overlap with the booking dates

Since the check-out date starts empty, users never see the group selector until they fill in dates that happen to overlap with existing groups.

---

### Root Cause (Technical Details)

**File: `src/components/NeighborhoodReservationModal.tsx`**

```typescript
// Lines 119-127: Only populates groups when BOTH dates are valid
useEffect(() => {
  if (form.checkInDate && form.checkOutDate && form.checkInDate < form.checkOutDate) {
    const overlapping = getOverlappingGroups(form.checkInDate, form.checkOutDate);
    setAvailableGroups(overlapping);
  } else {
    setAvailableGroups([]);  // <-- Always empty if dates incomplete
  }
}, [form.checkInDate, form.checkOutDate, getOverlappingGroups]);

// Line 426: Group selector only renders if list is non-empty
{availableGroups.length > 0 && (
  // ...group selector UI
)}
```

---

### Solution

#### File 1: `src/components/NeighborhoodReservationModal.tsx`

**A) Show ALL lodging groups initially, then filter by dates**

Modify the useEffect to:
- Load all lodging groups from `useAdminGroups` when modal opens
- When dates are entered, filter to only overlapping groups
- Add a visual indicator showing "X קבוצות תואמות" (X matching groups) based on date filter

**B) Always show the group linking section**

Instead of hiding the entire section when `availableGroups.length === 0`, show:
- The dropdown with available groups
- A helpful message when no groups exist yet: "אין קבוצות במערכת - צור קבוצה באזור הניהול"
- A message when groups exist but don't match dates: "אין קבוצות בתאריכים אלו"

**C) Allow selecting groups before dates are fully entered**

When a group is selected, auto-fill the dates from the group's date range (if user hasn't entered dates yet).

---

### Updated Logic Flow

```text
┌──────────────────────────────────────────────────────────────────┐
│  Modal Opens                                                      │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. Load ALL lodging groups (groupType = 'לינה')                 │
│                                                                  │
│  2. Show group selector section ALWAYS:                          │
│     ┌────────────────────────────────────────────────────────┐   │
│     │  🔗 קשר לקבוצה קיימת                                    │   │
│     │  ┌──────────────────────────────────────────────────┐  │   │
│     │  │ ▾ בחר קבוצה...                                    │  │   │
│     │  │   • נחל 2026 (09-12.02)                          │  │   │
│     │  │   • סמינר מנהלים (15-17.02)                      │  │   │
│     │  └──────────────────────────────────────────────────┘  │   │
│     │                                                        │   │
│     │  💡 בחר תאריכים לסינון לפי זמינות                      │   │
│     └────────────────────────────────────────────────────────┘   │
│                                                                  │
│  3. When dates entered, filter groups by overlap and show badge: │
│     "3 קבוצות תואמות" or "אין קבוצות בתאריכים אלו"              │
│                                                                  │
│  4. When group selected, show remaining counters + bedsAssigned  │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

---

### Code Changes Summary

| Location | Change |
|----------|--------|
| Line 71 | Initialize `availableGroups` from all lodging groups, not empty |
| Lines 119-127 | Modify useEffect to always show groups, only filter when dates entered |
| Line 426 | Remove `availableGroups.length > 0 &&` condition - always render section |
| New | Add fallback UI when no groups exist ("אין קבוצות במערכת") |
| New | Add helper text explaining date filtering |

---

### Visual Comparison

**BEFORE (Current Behavior)**
```text
┌─────────────────────────────────────┐
│  הזמנה חדשה - שכונה 2               │
├─────────────────────────────────────┤
│                                     │
│  שם הקבוצה: [____________]          │
│  צ'ק-אין:   [2026-01-31]            │
│  צ'ק-אאוט:  [____________]  ← Empty │
│                                     │
│  (Group selector HIDDEN because     │
│   checkOutDate is empty)            │
│                                     │
└─────────────────────────────────────┘
```

**AFTER (Fixed Behavior)**
```text
┌─────────────────────────────────────┐
│  הזמנה חדשה - שכונה 2               │
├─────────────────────────────────────┤
│                                     │
│  🔗 קשר לקבוצה קיימת                │
│  ┌────────────────────────────────┐ │
│  │ ▾ בחר קבוצה...                  │ │
│  │   • נחל 2026 (09-12.02)        │ │
│  │   • סמינר מנהלים (15-17.02)    │ │
│  └────────────────────────────────┘ │
│  💡 הזן תאריכים לסינון אוטומטי      │
│                                     │
│  שם הקבוצה: [____________]          │
│  צ'ק-אין:   [2026-01-31]            │
│  צ'ק-אאוט:  [____________]          │
│                                     │
└─────────────────────────────────────┘
```

---

### Files to Modify

1. **`src/components/NeighborhoodReservationModal.tsx`** - Fix group selector visibility and filtering logic

---

### Acceptance Criteria

1. Open any neighborhood reservation modal
2. Group selector section is visible immediately (even without dates entered)
3. All saved lodging groups appear in the dropdown
4. When dates are entered, groups are filtered to those with overlapping dates
5. Selecting a group shows remaining counters and bedsAssigned input
6. When no groups exist, helpful message is shown

