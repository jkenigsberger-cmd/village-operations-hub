

## Plan: Group Selection + Remaining Countdown During Reservation

### Summary
Enhance the reservation modal to allow users to select an existing Admin group, view live countdown of remaining people to allocate, specify beds to assign, and automatically update the group's remaining counters when saving.

---

### Current State Analysis

The `NeighborhoodReservationModal` already has:
- Group selector dropdown that shows overlapping groups (lines 395-441)
- Display of remainingStaff and remainingParticipants when a group is selected (lines 428-438)
- Integration with `useGroupAllocation` hook for creating allocation records (lines 287-301)

**What's Missing:**
1. A dedicated "bedsAssigned" input field to specify how many beds to allocate
2. Validation that bedsAssigned does not exceed remainingParticipants
3. Helper text explaining the allocation
4. Update of the group's remaining counters when saving
5. Display of the group selector even when no dates are entered (currently requires dates first)
6. Similar functionality for `TentDetailModal` for individual tent bookings

---

### Changes Required

#### File 1: `src/components/NeighborhoodReservationModal.tsx`

**A) Add bedsAssigned state and input field:**
- Add new state: `bedsAssigned` (number)
- Auto-calculate default value based on mode:
  - FULL mode: `totalNeighborhoodBeds`
  - SPECIFIC mode: `selectedBeds`
- Add input field with label "כמה מיטות לשבץ" after the remaining counters display
- Add helper text: "בחר כמה מקומות לשבץ כאן"

**B) Enhanced group selector display:**
- Show group selector with better formatting:
  - `"{groupName} ({startDate}–{endDate}) • חניכים נשאר: {remaining}"`
- Make group selector more prominent with clear labeling

**C) Validation on submit:**
- Check if bedsAssigned > remainingParticipants when group is selected
- Block submission with clear error: "לא ניתן לשבץ יותר מיטות ממה שנשאר"
- Ensure bedsAssigned is never negative

**D) Update group remaining count on save:**
- When saving with a linked group, call `updateGroup` to reduce remainingParticipants by bedsAssigned
- The existing `addAllocation` in useGroupAllocation already does this - verify it's being called correctly

**E) Default bedsAssigned updates:**
- When mode changes (FULL/SPECIFIC), recalculate default bedsAssigned
- When selected tents change, recalculate bedsAssigned

---

#### File 2: `src/components/TentDetailModal.tsx`

**Add group linking capability for individual tent bookings:**

**A) Import and use hooks:**
- Import `useAdminGroups` and `useGroupAllocation`
- Add group selector dropdown in the "Group Info" section

**B) Add group selection UI:**
- Add "קשר לקבוצה" dropdown with overlapping groups
- Show remaining counters when group is selected
- Add bedsAssigned field (default: tent bed count)

**C) Update on save:**
- When saving tent with a linked group, create allocation record
- Update group's remainingParticipants (or remainingStaff for VIP tents)

---

#### File 3: `src/hooks/useGroupAllocation.ts`

**Minor enhancements:**

- Ensure `addAllocation` properly validates and updates remaining counts (already implemented)
- Add a helper function `canAllocate(groupId, beds, isVIP)` for pre-validation

---

#### File 4: `src/pages/AdminGroups.tsx`

**Display remaining counters in the group list:**

- Add visual display of remainingStaff and remainingParticipants for each group card
- Show progress bar or badge: "נשאר לשבץ: X צוות / Y חניכים"

---

### Technical Implementation Details

**State additions to NeighborhoodReservationModal:**
```typescript
const [bedsAssigned, setBedsAssigned] = useState<number>(0);

// Effect to set default bedsAssigned
useEffect(() => {
  if (mode === 'FULL') {
    setBedsAssigned(totalNeighborhoodBeds);
  } else {
    setBedsAssigned(selectedBeds);
  }
}, [mode, totalNeighborhoodBeds, selectedBeds]);
```

**UI for bedsAssigned input:**
```tsx
{selectedGroup && (
  <div className="space-y-2 mt-3">
    <Label>כמה מיטות לשבץ מהקבוצה?</Label>
    <Input
      type="number"
      min={1}
      max={selectedGroup.remainingParticipants || 0}
      value={bedsAssigned}
      onChange={(e) => setBedsAssigned(parseInt(e.target.value) || 0)}
    />
    <p className="text-xs text-muted-foreground">
      בחר כמה מקומות לשבץ כאן (מקסימום: {selectedGroup.remainingParticipants})
    </p>
  </div>
)}
```

**Validation in handleSubmit:**
```typescript
if (selectedGroupId && selectedGroup) {
  const remaining = selectedGroup.remainingParticipants || 0;
  if (bedsAssigned > remaining) {
    toast.error(`לא ניתן לשבץ ${bedsAssigned} מיטות - נשאר רק ${remaining}`);
    return;
  }
}
```

---

### Visual Summary

```text
┌────────────────────────────────────────────────────────────────────┐
│  הזמנה חדשה - שכונה 3                                              │
├────────────────────────────────────────────────────────────────────┤
│                                                                    │
│  [שכונה מלאה]  [אוהלים ספציפיים]                                   │
│                                                                    │
│  ── מידע בסיסי ──                                                  │
│                                                                    │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ 🔗 קשר לקבוצה קיימת                                          │   │
│  │ ┌─────────────────────────────────────────────────────────┐ │   │
│  │ │ ▾ בחר קבוצה...                                           │ │   │
│  │ │   • נחל 2026 (09-12.02) • חניכים נשאר: 66                │ │   │
│  │ │   • סמינר מנהלים (15-17.02) • חניכים נשאר: 45            │ │   │
│  │ └─────────────────────────────────────────────────────────┘ │   │
│  │                                                             │   │
│  │  ┌──────────────┐  ┌──────────────┐                         │   │
│  │  │  צוות נשאר   │  │ חניכים נשאר │                         │   │
│  │  │     14       │  │     66      │                         │   │
│  │  └──────────────┘  └──────────────┘                         │   │
│  │                                                             │   │
│  │  כמה מיטות לשבץ מהקבוצה?                                    │   │
│  │  ┌─────────────────────────────────────────────────────────┐ │   │
│  │  │ 64                                                      │ │   │
│  │  └─────────────────────────────────────────────────────────┘ │   │
│  │  💡 בחר כמה מקומות לשבץ כאן (מקסימום: 66)                   │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                    │
│  שם הקבוצה *: [נחל 2026          ] (disabled when linked)         │
│                                                                    │
│  צ'ק-אין *: [09/02/2026]    צ'ק-אאוט *: [12/02/2026]              │
│                                                                    │
│                          [ביטול]  [צור הזמנה]                      │
└────────────────────────────────────────────────────────────────────┘
```

---

### Acceptance Test Verification

| Test | Expected Behavior |
|------|-------------------|
| 1. Create group with 70 participants | Group saved with remainingParticipants = 70 |
| 2. Book Neighborhood 1 (64 beds), select group | bedsAssigned defaults to 64 |
| 3. Save with bedsAssigned = 64 | remainingParticipants becomes 6 |
| 4. Book another tent with bedsAssigned = 6 | remainingParticipants becomes 0 |
| 5. Try to allocate 1 more bed | Error: "לא ניתן לשבץ יותר מיטות ממה שנשאר" |
| 6. Refresh page | Counters and reservations persist correctly |
| 7. View Admin groups list | Shows updated remainingParticipants = 0 |

---

### Files to Modify

1. **`src/components/NeighborhoodReservationModal.tsx`** - Add bedsAssigned input, validation, and enhanced group selector display
2. **`src/components/TentDetailModal.tsx`** - Add group linking capability for individual tent bookings  
3. **`src/pages/AdminGroups.tsx`** - Show remaining counters in group list cards
4. **`src/hooks/useGroupAllocation.ts`** - Add `canAllocate` helper (optional optimization)

---

### Impact Assessment

- **No breaking changes** to existing reservations
- **No changes** to map UI, housekeeping, maintenance, kitchen, calendar
- **Preserves** existing LocalStorage data
- **Enhances** existing allocation flow with better UX

