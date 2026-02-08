

# Add Edit/Remove Functionality for Allocations

## Problem Identified
The allocation view shows assigned VIP tents and neighborhoods as read-only display. While the backend hooks have `unassignVIPConfig` and `removeAllocation` functions ready, the UI doesn't expose any buttons or controls to actually use them.

Users can see what's allocated but cannot:
- Remove a VIP tent assignment
- Remove a neighborhood allocation
- Change the number of beds in a neighborhood allocation

## Solution
Add interactive edit/remove functionality to both allocation tabs so users can modify existing allocations.

## Changes Required

### 1. VIPAllocationTab.tsx - Add Remove Button for Assigned Configs

**Current:** Shows assigned configs as static green badges
**Updated:** Each assigned config will have a remove button that calls `unassignVIPConfig`

Changes:
- Import `unassignVIPConfig` from the hook
- Add state for confirmation modal when removing
- Replace static badges with interactive cards showing:
  - VIP tent number (e.g., "VIP 80")
  - Bed count and gender
  - Remove button (trash icon)
- Confirmation modal before removing to prevent accidental clicks
- On remove: call `unassignVIPConfig(groupId, configId)` and show success toast

### 2. ParticipantAllocationTab.tsx - Add Remove Button for Allocated Neighborhoods

**Current:** Shows allocated neighborhoods as static green spans
**Updated:** Each allocated neighborhood will have edit/remove options

Changes:
- Import `removeAllocation` from the hook
- Add state for edit modal (to change bed count) and remove confirmation
- Replace static spans with interactive cards showing:
  - Neighborhood name
  - Bed count
  - Edit button (pencil icon) - opens modal to change bed count
  - Remove button (trash icon)
- On edit: Update allocation with new bed count (requires delete + re-add, or add updateAllocation function)
- On remove: call `removeAllocation(allocationId)` and show success toast

### 3. useGroupAllocation.ts - Add Update Allocation Function (Optional)

If we want true "edit" capability for bed counts:
- Add `updateAllocation(allocationId, newBedsAssigned)` function
- Updates the allocation record in Supabase
- Recalculates remaining counts on the group

Alternative simpler approach: Remove + Re-add (less code, same result)

## UI Design

### VIP Section - Assigned Configs
```
┌──────────────────────────────────────────────┐
│  תצורות שובצו (2)                             │
│                                               │
│  ┌─────────────────┐  ┌─────────────────┐   │
│  │ VIP 80          │  │ VIP 81          │   │
│  │ 3 מיטות • ♂️    │  │ 2 מיטות • ♀️    │   │
│  │         [🗑️]    │  │         [🗑️]    │   │
│  └─────────────────┘  └─────────────────┘   │
└──────────────────────────────────────────────┘
```

### Neighborhoods Section - Allocated List
```
┌──────────────────────────────────────────────┐
│  שכונות שובצו (2)                             │
│                                               │
│  ┌─────────────────────────────────────────┐ │
│  │ 🏠 שכונה 1                               │ │
│  │ 32 מיטות                     [✏️] [🗑️]  │ │
│  └─────────────────────────────────────────┘ │
│  ┌─────────────────────────────────────────┐ │
│  │ 🏠 שכונה 2                               │ │
│  │ 24 מיטות                     [✏️] [🗑️]  │ │
│  └─────────────────────────────────────────┘ │
└──────────────────────────────────────────────┘
```

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/VIPAllocationTab.tsx` | Add remove buttons for assigned configs, confirmation modal, call `unassignVIPConfig` |
| `src/components/ParticipantAllocationTab.tsx` | Add remove buttons for allocated neighborhoods, edit modal for bed count, call `removeAllocation` |

## Technical Implementation

### VIPAllocationTab Changes

```tsx
// Add to imports
import { Trash2 } from 'lucide-react';

// Add to hook destructuring
const { ..., unassignVIPConfig } = useGroupAllocation();

// Add state for remove confirmation
const [configToRemove, setConfigToRemove] = useState<VIPTentConfig | null>(null);
const [removeModalOpen, setRemoveModalOpen] = useState(false);

// Add remove handler
const handleRemoveConfig = async () => {
  if (!configToRemove) return;
  
  const success = await unassignVIPConfig(group.id, configToRemove.id);
  if (success) {
    toast.success(`אוהל VIP ${configToRemove.assignedTentCode} שוחרר`);
    setRemoveModalOpen(false);
    setConfigToRemove(null);
    onUpdate();
  } else {
    toast.error('שגיאה בשחרור האוהל');
  }
};

// Replace static badges with interactive cards
{assignedConfigs.map(config => (
  <div key={config.id} className="...interactive card...">
    <span>VIP {config.assignedTentCode} • {beds} מיטות</span>
    <Button 
      variant="ghost" 
      size="icon"
      onClick={() => { setConfigToRemove(config); setRemoveModalOpen(true); }}
    >
      <Trash2 className="w-4 h-4 text-destructive" />
    </Button>
  </div>
))}
```

### ParticipantAllocationTab Changes

```tsx
// Add to imports
import { Trash2, Pencil } from 'lucide-react';

// Add to hook destructuring
const { ..., removeAllocation } = useGroupAllocation();

// Add state for edit/remove
const [allocationToRemove, setAllocationToRemove] = useState<AllocationRecord | null>(null);
const [removeModalOpen, setRemoveModalOpen] = useState(false);

// Add remove handler
const handleRemoveAllocation = async () => {
  if (!allocationToRemove) return;
  
  await removeAllocation(allocationToRemove.id);
  toast.success(`${allocationToRemove.resourceLabel} שוחרר`);
  setRemoveModalOpen(false);
  loadAvailability(); // Refresh availability
  onUpdate();
};

// Replace static spans with interactive cards showing edit/remove buttons
```

## What Stays the Same
- All allocation logic remains unchanged
- Database operations stay the same
- VIP tent availability checking works identically
- Neighborhood locking (Goal 3) continues to work - `removeAllocation` already handles neighborhood_reservations deletion
- Real-time sync continues to work

## Expected Result
1. Users can click a trash icon on any assigned VIP tent to free it
2. Users can click a trash icon on any allocated neighborhood to release it
3. Confirmation modal prevents accidental deletions
4. Removing allocations properly updates:
   - The `allocations` table
   - The group's remaining counts (`remainingStaff`, `remainingParticipants`)
   - The `neighborhood_reservations` table (for neighborhoods)
   - The physical tent state (for VIP - clears group name, dates, gender)
5. After removal, the VIP/neighborhood becomes available for re-assignment

