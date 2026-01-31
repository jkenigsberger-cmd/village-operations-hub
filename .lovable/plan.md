

## Plan: VIP Tent Planning Without Specific Tent Numbers + Dashboard Sync

### Summary
Modify the VIP Tent Planner to allow planning tent **configurations** (number of tents, beds per tent, gender) without selecting specific VIP tent numbers. The actual tent assignment (80-89) happens later in the VIP dashboard when assigning groups. This syncs with the VIP dashboard to show only "צוות" counts for VIP, keeping staff separate from participants.

---

### Current Problem

1. **Current VIPTentPlanner** forces selection of specific tent numbers (80, 81, etc.) when creating a group
2. The person creating the group often doesn't know which exact tents to use
3. Need: Just specify "I need 5 VIP tents with X beds each" without choosing 80/81/82...
4. Missing: Extra bed option (sometimes tents can have 3+1 = 4 beds)
5. Need: VIP dashboard should show group name but only with staff count, keeping VIP separate from regular neighborhoods

---

### Solution Overview

#### A) Simplified VIP Tent Configuration (No Specific Numbers)

Replace `VIPTentPlan` with a simpler configuration structure:

```typescript
export interface VIPTentConfig {
  id: string;            // Unique identifier for this config entry
  bedsPlanned: number;   // 1, 2, 3, or 4 (with extra bed)
  gender?: 'female' | 'male';
  hasExtraBed?: boolean; // If true, bedsPlanned = 3 + 1 extra
  assignedTentCode?: string; // Filled later in VIP dashboard (80-89)
}
```

Replace `vipTentPlans` field in `GroupRecord`:
```typescript
vipTentConfigs?: VIPTentConfig[]; // Replaces vipTentPlans
```

---

#### B) Modified VIPTentPlanner Component

**Changes:**
- Remove tent number selection (80-89 dropdown)
- Show simple "Add Tent Configuration" button
- Each config card shows:
  - Beds selector: 1 / 2 / 3 buttons
  - Extra bed toggle (adds +1 when enabled)
  - Gender selector (♀️/♂️/None)
  - Remove button
- Display totals: "X אוהלים / Y מיטות מתוכננות"

**Visual:**
```text
┌─────────────────────────────────────────────────────────────────────────┐
│  📋 תצורת אוהלי VIP לצוות                                                │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  נדרש: 14 מיטות צוות                                                    │
│  מתוכנן: 14 מיטות ב-5 אוהלים                                            │
│                                                                         │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌────────────┐        │
│  │  אוהל 1    │  │  אוהל 2    │  │  אוהל 3    │  │  אוהל 4    │        │
│  │  [1][2][3] │  │  [1][2][3] │  │  [1][2][3] │  │  [1][2][3] │        │
│  │  [+מיטה]   │  │  [+מיטה]   │  │  [+מיטה]   │  │  [+מיטה]   │        │
│  │   ♀️/♂️    │  │   ♀️/♂️    │  │   ♀️/♂️    │  │   ♀️/♂️    │        │
│  │   [🗑️]     │  │   [🗑️]     │  │   [🗑️]     │  │   [🗑️]     │        │
│  └────────────┘  └────────────┘  └────────────┘  └────────────┘        │
│                                                                         │
│  [+ הוסף אוהל VIP]                                                      │
│                                                                         │
│  ✓ כל מיטות הצוות מתוכננות                                              │
└─────────────────────────────────────────────────────────────────────────┘
```

---

#### C) VIP Dashboard Integration

When assigning a group to a VIP tent in the dashboard:

1. **Group Selector Enhancement**: 
   - Show groups with unassigned VIP configs
   - Display: "קבוצה X - צוות נשאר: Y" (only staff count, not total pax)

2. **Tent Assignment Flow**:
   - When group is selected, show unassigned VIP configs
   - User picks which config applies to this specific tent (80/81/etc.)
   - System updates `assignedTentCode` in the config
   - Dashboard shows group name + gender color on that tent

3. **Visual Sync**:
   - VIP tent color reflects assigned gender from config
   - Label shows group name
   - Only staff count matters for VIP (not participants)

---

### Technical Implementation

#### File 1: `src/types/adminGroups.ts`

**Replace VIPTentPlan with VIPTentConfig:**

```typescript
export interface VIPTentConfig {
  id: string;                    // Unique ID for this config
  bedsPlanned: number;           // Base beds: 1, 2, or 3
  hasExtraBed?: boolean;         // +1 extra bed option
  gender?: 'female' | 'male';
  assignedTentCode?: string;     // Filled when assigned to specific VIP tent
}
```

**Update GroupRecord:**
```typescript
// Replace vipTentPlans with:
vipTentConfigs?: VIPTentConfig[];
```

---

#### File 2: `src/components/VIPTentPlanner.tsx`

**Complete rewrite:**

- Remove `availableVIPTents` prop (no longer needed for planning)
- Replace tent code display with generic "אוהל 1", "אוהל 2" labels
- Add "Extra Bed" toggle per config
- Calculate total: `sum of (bedsPlanned + (hasExtraBed ? 1 : 0))`
- Simple add/remove without conflict checking (conflicts checked at assignment time)

**New Props:**
```typescript
interface VIPTentPlannerProps {
  staffCount: number;
  vipTentConfigs: VIPTentConfig[];
  onConfigsChange: (configs: VIPTentConfig[]) => void;
  disabled?: boolean;
}
```

---

#### File 3: `src/pages/AdminGroupEdit.tsx`

**Changes:**

- Replace `vipTentPlans` state with `vipTentConfigs`
- Remove `availableVIPTents` computed value (not needed for planning)
- Update form submission to save `vipTentConfigs` instead of `vipTentPlans`
- Update capacity check to use total beds from configs

---

#### File 4: `src/components/TentDetailModal.tsx`

**VIP-specific group handling:**

When `tent.isVIP === true`:
1. Group selector shows only "צוות" remaining count
2. When group selected, show unassigned VIPTentConfigs as options
3. User picks which config to apply to this tent
4. System marks config as assigned with `assignedTentCode = tent.code`
5. Apply gender and bed count from the config

**New UI section for VIP tents:**
```text
┌────────────────────────────────────────────┐
│  🔗 שיבוץ מקבוצה קיימת                      │
│                                            │
│  קבוצה: [▾ נחל 2026 - צוות נשאר: 6]        │
│                                            │
│  תצורה לאוהל זה:                            │
│  [▾ 3 מיטות + מיטה נוספת (♀️)]             │
│  [▾ 3 מיטות (♂️)]                          │
│  [▾ 2 מיטות (♂️)]                          │
│                                            │
│  [שבץ לאוהל VIP 82]                         │
└────────────────────────────────────────────┘
```

---

#### File 5: `src/hooks/useGroupAllocation.ts`

**Updates:**

- Remove `getAvailableVIPTents` function (no longer used for planning)
- Add new function: `getUnassignedVIPConfigs(groupId: string)` - returns configs without `assignedTentCode`
- Update `checkCapacity` to use `vipTentConfigs` for bed calculation
- Add function: `assignVIPConfig(groupId: string, configId: string, tentCode: string)` - marks config as assigned

---

### Files to Modify

| File | Changes |
|------|---------|
| `src/types/adminGroups.ts` | Replace `VIPTentPlan` with `VIPTentConfig`, add `hasExtraBed` field |
| `src/components/VIPTentPlanner.tsx` | Remove tent number selection, add extra bed toggle, use generic labels |
| `src/pages/AdminGroupEdit.tsx` | Use `vipTentConfigs` instead of `vipTentPlans` |
| `src/components/TentDetailModal.tsx` | Add VIP config assignment UI for VIP tents |
| `src/hooks/useGroupAllocation.ts` | Add config assignment functions, update capacity calculations |

---

### Data Flow

```text
GROUP CREATION (AdminGroupEdit):
┌─────────────────────────────────────────────┐
│  User enters: צוות = 14                      │
│  Adds 5 VIP tent configs:                   │
│    - Config 1: 3 beds (♀️)                  │
│    - Config 2: 3 beds (♀️)                  │
│    - Config 3: 3 beds (♂️)                  │
│    - Config 4: 3 beds (♂️)                  │
│    - Config 5: 2 beds (♂️)                  │
│  Total: 14 beds in 5 tents ✓               │
└─────────────────────────────────────────────┘
                    ↓
              Saves group with vipTentConfigs
              (no assignedTentCode yet)
                    ↓
VIP DASHBOARD (TentDetailModal):
┌─────────────────────────────────────────────┐
│  Staff opens VIP tent 82                    │
│  Selects group "נחל 2026"                   │
│  Sees unassigned configs dropdown           │
│  Picks: "3 מיטות (♂️)"                      │
│  Clicks "שבץ לאוהל VIP 82"                  │
│  Config now has assignedTentCode = "82"     │
│  Tent shows group name + male color         │
└─────────────────────────────────────────────┘
```

---

### Acceptance Criteria

| Test | Expected Behavior |
|------|-------------------|
| 1. Create group with staffCount = 14 | VIP config section appears |
| 2. Click "הוסף אוהל VIP" 5 times | 5 generic tent configs appear (no numbers) |
| 3. Set beds and toggle extra bed | Total updates correctly (3+1 = 4 for extra) |
| 4. Save group | vipTentConfigs saved without assignedTentCode |
| 5. Open VIP tent 82 in dashboard | Can select group and pick unassigned config |
| 6. Assign config to tent | Config marked with assignedTentCode="82" |
| 7. View VIP map | Tent 82 shows group name and gender color |
| 8. Same config cannot be assigned twice | Already-assigned configs hidden from dropdown |

---

### Backwards Compatibility

- Migrate existing `vipTentPlans` to `vipTentConfigs` format
- If `vipTentPlans` has `tentCode`, convert to `assignedTentCode`
- Keep `vipPeoplePerTent` as fallback when no configs exist

