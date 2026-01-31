

## Plan: VIP Tent Planner with Per-Tent Bed Count and Double-Booking Prevention

### Summary
Replace the simple "אנשים לאוהל VIP" numeric field with an interactive VIP Tent Planner that:
1. Allows specifying different bed counts (1-3) for each VIP tent individually
2. Supports optional gender assignment per tent (for separated accommodation)
3. **Prevents double-booking** by checking if VIP tents are already allocated to other groups for overlapping dates

---

### Current State Analysis

**Current UI (`src/pages/AdminGroupEdit.tsx` lines 666-679)**:
- Single numeric input for "אנשים לאוהל VIP"
- Sets a global default (1-3) for ALL tents
- Cannot specify different occupancy per tent
- No visibility into which VIP tents are already booked

**Problem**: Groups needing gender separation require different occupancy per tent (e.g., 3 females in tent 80, 2 males in tent 81). Also, no protection against double-booking VIP tents.

---

### Solution Overview

#### A) New Data Structure

**File: `src/types/adminGroups.ts`**

Add new interface for individual VIP tent plans:

```typescript
export interface VIPTentPlan {
  tentCode: string;        // "80" through "89"
  bedsPlanned: number;     // 1, 2, or 3
  gender?: 'female' | 'male';  // Optional gender designation
}
```

Add to `GroupRecord` interface:
```typescript
vipTentPlans?: VIPTentPlan[];  // Array of planned VIP tent assignments
```

---

#### B) VIP Tent Availability Checker

**File: `src/hooks/useGroupAllocation.ts`**

Add new function to check which VIP tents are available for a date range:

```typescript
getAvailableVIPTents(
  startDate: string, 
  endDate: string, 
  excludeGroupId?: string
): { tentCode: string; available: boolean; conflictingGroup?: string }[]
```

**Logic**:
1. Iterate through VIP tent codes (80-89)
2. For each tent, check:
   - Existing `AllocationRecord` entries with `allocationType === 'VIP_TENT'` and overlapping dates
   - Existing tent bookings in `VillageContext` with overlapping dates
3. Return availability status and conflicting group name if blocked

---

#### C) Interactive VIP Tent Planner UI

**File: `src/pages/AdminGroupEdit.tsx`**

Replace the single input with a visual tent planner section:

```text
┌─────────────────────────────────────────────────────────────────────────┐
│  📋 תכנון אוהלי VIP לצוות                                                │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  נדרש: 14 מיטות צוות                                                    │
│  מתוכנן: 11 מיטות ב-4 אוהלים                                            │
│                                                                         │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │                                                                    │ │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐            │ │
│  │  │  VIP 80  │  │  VIP 81  │  │  VIP 82  │  │  VIP 83  │            │ │
│  │  │   ⚪⚪⚪  │  │   ⚪⚪⚪  │  │   ⚪⚪⚪  │  │   ⚪⚪🔵  │            │ │
│  │  │  [1][2][3]│  │  [1][2][3]│  │  [1][2][3]│  │  [1][2][3]│            │ │
│  │  │    ♀️    │  │    ♀️    │  │    ♂️    │  │    ♂️    │            │ │
│  │  │   [🗑️]   │  │   [🗑️]   │  │   [🗑️]   │  │   [🗑️]   │            │ │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────┘            │ │
│  │                                                                    │ │
│  │  ┌───────────────────────────────────────────────────────────────┐ │ │
│  │  │  הוסף אוהל VIP:  [▾ בחר אוהל פנוי...      ]  ← Only shows     │ │ │
│  │  │                     VIP 84 ✓ פנוי           available tents   │ │ │
│  │  │                     VIP 85 ✓ פנוי                              │ │ │
│  │  │                     VIP 86 ❌ תפוס - נחל 2026                  │ │ │
│  │  │                     VIP 87 ✓ פנוי                              │ │ │
│  │  │                     ...                                        │ │ │
│  │  └───────────────────────────────────────────────────────────────┘ │ │
│  │                                                                    │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                                                         │
│  ⚠️ נשאר 3 מיטות צוות לא מתוכננות                                       │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

### Implementation Details

#### File 1: `src/types/adminGroups.ts`

**Add new type** after line 17:

```typescript
export interface VIPTentPlan {
  tentCode: string;        // "80", "81", ..., "89"
  bedsPlanned: number;     // 1, 2, or 3
  gender?: 'female' | 'male';
}
```

**Add to GroupRecord interface** (around line 39):

```typescript
vipTentPlans?: VIPTentPlan[];
```

---

#### File 2: `src/hooks/useGroupAllocation.ts`

**Add new function** to check VIP tent availability:

```typescript
// Get available VIP tents for a date range
const getAvailableVIPTents = useCallback((
  startDate: string, 
  endDate: string, 
  excludeGroupId?: string
): { tentCode: string; available: boolean; conflictingGroup?: string }[] => {
  
  return VIP_TENT_CODES.map(tentCode => {
    // Check allocations for this tent code
    const conflictingAlloc = allocations.find(alloc => 
      alloc.allocationType === 'VIP_TENT' &&
      alloc.resourceId === tentCode &&
      alloc.groupId !== excludeGroupId &&
      dateRangesOverlap(startDate, endDate, alloc.dateRangeStart, alloc.dateRangeEnd)
    );
    
    if (conflictingAlloc) {
      const conflictGroup = groups.find(g => g.id === conflictingAlloc.groupId);
      return { 
        tentCode, 
        available: false, 
        conflictingGroup: conflictGroup?.groupName || 'קבוצה אחרת' 
      };
    }
    
    // Check village state for existing bookings
    if (state) {
      const tentId = `VIP_${tentCode}`;
      const tent = state.tents[tentId];
      if (tent && tent.checkInDate && tent.checkOutDate && tent.groupName) {
        if (dateRangesOverlap(startDate, endDate, tent.checkInDate, tent.checkOutDate)) {
          const tentGroup = groups.find(g => g.groupName === tent.groupName);
          if (!excludeGroupId || tentGroup?.id !== excludeGroupId) {
            return { 
              tentCode, 
              available: false, 
              conflictingGroup: tent.groupName 
            };
          }
        }
      }
    }
    
    return { tentCode, available: true };
  });
}, [allocations, groups, state, dateRangesOverlap]);
```

**Add to return object**:
```typescript
return {
  // ...existing exports
  getAvailableVIPTents,
};
```

---

#### File 3: `src/pages/AdminGroupEdit.tsx`

**A) Add state for VIP tent plans** (after existing state declarations):

```typescript
const [vipTentPlans, setVipTentPlans] = useState<VIPTentPlan[]>([]);
```

**B) Add effect to load plans from formData**:

```typescript
useEffect(() => {
  if (formData.vipTentPlans) {
    setVipTentPlans(formData.vipTentPlans);
  }
}, [formData.vipTentPlans]);
```

**C) Add computed values**:

```typescript
// Calculate totals
const plannedVIPBeds = vipTentPlans.reduce((sum, t) => sum + t.bedsPlanned, 0);
const staffCount = formData.staffCount || 0;
const remainingToPlan = staffCount - plannedVIPBeds;

// Get available tents based on group dates
const availableVIPTents = useMemo(() => {
  if (!formData.startDate || !formData.endDate) return [];
  return getAvailableVIPTents(formData.startDate, formData.endDate, isNew ? undefined : id);
}, [formData.startDate, formData.endDate, getAvailableVIPTents, isNew, id]);
```

**D) Replace single input (lines 666-679) with VIP Tent Planner UI**:

New component renders:
- Summary header: "נדרש: X מיטות צוות / מתוכנן: Y מיטות ב-Z אוהלים"
- Grid of planned tent cards, each showing:
  - Tent code (VIP 80, VIP 81, etc.)
  - Bed count selector (1/2/3 toggle buttons)
  - Optional gender selector (♀️/♂️/-)
  - Remove button
- Dropdown to add new tent (only shows available tents, with conflict indicators)
- Warning if planned beds are less than staffCount

**E) Update handleSave** to include vipTentPlans in saved data:

```typescript
const dataToSave: GroupRecord = {
  ...formData,
  vipTentPlans,
  // ... rest of fields
};
```

---

### Double-Booking Prevention Logic

When adding a VIP tent to the plan:
1. Call `getAvailableVIPTents()` with the group's date range
2. Only allow selecting tents where `available === true`
3. Show conflict message for blocked tents: "VIP 86 ❌ תפוס - נחל 2026"
4. If dates change after tents are already planned, re-validate and show warnings

---

### Files to Modify

| File | Changes |
|------|---------|
| `src/types/adminGroups.ts` | Add `VIPTentPlan` interface and `vipTentPlans` field to `GroupRecord` |
| `src/hooks/useGroupAllocation.ts` | Add `getAvailableVIPTents()` function for conflict detection |
| `src/pages/AdminGroupEdit.tsx` | Replace single input with interactive VIP Tent Planner UI |

---

### Acceptance Criteria

| Test | Expected Behavior |
|------|-------------------|
| 1. Create group with staffCount = 14 | VIP Tent Planner section appears |
| 2. Click "הוסף אוהל VIP" dropdown | Shows VIP 80-89 with availability status |
| 3. Select VIP 80, set beds to 3 | Card appears with 3 beds, total shows "3 מיטות ב-1 אוהלים" |
| 4. Add more tents until 14 beds planned | Warning disappears, all tents shown |
| 5. Try to add tent already used by another group | Dropdown shows "❌ תפוס - [groupName]", blocked |
| 6. Save and re-open group | Tent plans persist correctly |
| 7. Create second group with overlapping dates | Cannot select tents already planned by first group |
| 8. Change dates on existing group | Re-validates tent availability |

---

### Backwards Compatibility

- Keep `vipPeoplePerTent` as fallback default when `vipTentPlans` is empty
- Existing groups without `vipTentPlans` continue to work normally
- Capacity check uses `vipTentPlans` if present, otherwise falls back to `staffCount / vipPeoplePerTent`

