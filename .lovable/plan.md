

## Plan: Add Dates to VIP Panel & Group Selectors + Staff Count for VIP

### Summary
Add date visibility across the application for reservations and groups, and ensure VIP-specific views show "צוות" (staff) counts instead of "חניכים" (participants).

---

### Changes Overview

#### 1. VIPPlanningPanel - Add Group Dates

**File:** `src/components/VIPPlanningPanel.tsx`

**Current:** Shows group name and staff counts but NO dates
**After:** Add dates next to group name so users know WHEN the staff needs VIP housing

**Changes:**
- Add dates display: `{groupName} ({startDate} - {endDate})`
- In the group selector dropdown, add dates: `"נחל 2026 (01/31-02/02) - צוות: 14"`
- Format dates in Hebrew-friendly format (DD/MM)

---

#### 2. NeighborhoodReservationModal - VIP Uses Staff Count

**File:** `src/components/NeighborhoodReservationModal.tsx`

**Current Issue (from screenshot):** Shows "חניכים נשאר: 181" even for VIP
**After:** For VIP neighborhood, show "צוות נשאר: X" instead

**Changes:**
- Add `neighborhoodId` awareness - check if it's VIP
- In group selector: 
  - VIP → show "צוות נשאר: X" 
  - Other neighborhoods → show "חניכים נשאר: X"
- In remaining counters section:
  - VIP → emphasize צוות counter, max bedsAssigned = remainingStaff
  - Other → emphasize חניכים counter, max bedsAssigned = remainingParticipants
- Update validation logic to use correct counter based on neighborhood

---

#### 3. TentCard - Add Dates Display

**File:** `src/components/TentCard.tsx`

**Current:** Only shows check-in date
**After:** Show both check-in AND check-out dates for clarity

**Changes:**
- Format: `{checkIn} - {checkOut}` when both exist
- Add date range display so staff can see the full reservation period

---

#### 4. VIPPlanningPanel - Add Group Selector with Dates

**File:** `src/components/VIPPlanningPanel.tsx`

**Current:** Shows group name but selector doesn't show dates clearly
**After:** Selector shows: `"קבוצה: נחל 2026 | 31/01 - 02/02 | צוות: 14"`

---

### Implementation Details

#### File 1: `src/components/VIPPlanningPanel.tsx`

Add dates to group display and selector:

```typescript
// In stats section, add dates
<div className="flex items-center gap-2 text-lg font-semibold">
  <UserCheck className="w-5 h-5 text-primary" />
  <span>קבוצת צוות (VIP):</span>
  <span className="text-primary">{selectedGroup.groupName}</span>
  <span className="text-muted-foreground text-sm">
    ({formatDate(selectedGroup.startDate)} - {formatDate(selectedGroup.endDate)})
  </span>
</div>

// In selector dropdown
<SelectItem key={g.id} value={g.id}>
  {g.groupName} ({formatDate(g.startDate)}-{formatDate(g.endDate)}) • צוות: {g.staffCount}
</SelectItem>
```

---

#### File 2: `src/components/NeighborhoodReservationModal.tsx`

Add VIP-specific logic for staff counts:

**A) Add prop to detect VIP:**
```typescript
// Check if this is VIP neighborhood
const isVIPNeighborhood = neighborhoodId === 'VIP';
```

**B) Update group selector display (lines 473-482):**
```typescript
{availableGroups.map(group => {
  // For VIP use staff count, for others use participants
  const remaining = isVIPNeighborhood 
    ? (group.remainingStaff || 0) 
    : (group.remainingParticipants || 0);
  const label = isVIPNeighborhood ? 'צוות נשאר' : 'חניכים נשאר';
  const startFormatted = group.startDate.slice(5).replace('-', '/');
  const endFormatted = group.endDate.slice(5).replace('-', '/');
  return (
    <SelectItem key={group.id} value={group.id}>
      {group.groupName} ({startFormatted}–{endFormatted}) • {label}: {remaining}
    </SelectItem>
  );
})}
```

**C) Update remaining counters section (lines 496-534):**
- For VIP: Highlight צוות counter, use remainingStaff for max
- For Others: Highlight חניכים counter, use remainingParticipants for max

**D) Update validation in handleSubmit (lines 273-283):**
```typescript
if (selectedGroupId && selectedGroup) {
  const remaining = isVIPNeighborhood 
    ? (selectedGroup.remainingStaff || 0)
    : (selectedGroup.remainingParticipants || 0);
  if (bedsAssigned > remaining) {
    const label = isVIPNeighborhood ? 'צוות' : 'חניכים';
    toast.error(`לא ניתן לשבץ ${bedsAssigned} מיטות - נשאר רק ${remaining} ${label}`);
    return;
  }
}
```

---

#### File 3: `src/components/TentCard.tsx`

Add check-out date display:

```typescript
{/* Dates section */}
{(summary.checkInDate || summary.checkOutDate) && (
  <span className="flex items-center gap-1 text-sm text-muted-foreground">
    <Calendar className="w-4 h-4" />
    {summary.checkInDate && new Date(summary.checkInDate).toLocaleDateString('he-IL')}
    {summary.checkInDate && summary.checkOutDate && ' - '}
    {summary.checkOutDate && new Date(summary.checkOutDate).toLocaleDateString('he-IL')}
  </span>
)}
```

---

### Files to Modify

| File | Changes |
|------|---------|
| `src/components/VIPPlanningPanel.tsx` | Add dates to group display and selector |
| `src/components/NeighborhoodReservationModal.tsx` | Use צוות for VIP, חניכים for others |
| `src/components/TentCard.tsx` | Show both check-in and check-out dates |

---

### Visual Examples

**VIPPlanningPanel after changes:**
```
┌────────────────────────────────────────────────────────────────────┐
│  📋 תכנון VIP - צוות                                               │
│                                                                    │
│  קבוצת צוות (VIP): נחל 2026 (31/01 - 02/02)                       │
│                                                                    │
│  ┌──────────┐  ┌──────────────────┐  ┌─────────────┐  ┌──────────┐│
│  │ צוות סה״כ │  │ צוות נשאר לשיבוץ │  │ אוהלי VIP   │  │ נדרשים   ││
│  │    14    │  │       11        │  │ מתוכננים: 5 │  │    4     ││
│  └──────────┘  └──────────────────┘  └─────────────┘  └──────────┘│
└────────────────────────────────────────────────────────────────────┘
```

**NeighborhoodReservationModal for VIP:**
```
┌─ קשר לקבוצה קיימת ─────────────────────────────────────────────────┐
│                                                                    │
│  [▾ נחל 2026 (31/01-02/02) • צוות נשאר: 14  ]  ← Now shows צוות   │
│                                                                    │
│  ┌──────────────┐  ┌──────────────┐                                │
│  │ צוות נשאר   │  │ חניכים נשאר │                                │
│  │     14      │  │    181      │                                │
│  │  (for VIP)  │  │             │                                │
│  └──────────────┘  └──────────────┘                                │
│                                                                    │
│  כמה מיטות לשבץ מהקבוצה?                                          │
│  [________] (מקסימום: 14)  ← Uses צוות for VIP                    │
│                                                                    │
└────────────────────────────────────────────────────────────────────┘
```

**TentCard after changes:**
```
┌─────────────────────────────────────────┐
│  VIP 82           ⭐ VIP ♂️             │
│  נחל 2026                               │
│                                         │
│  [===========] 3/3                      │
│                                         │
│  🟢 נקי   📅 31/01 - 02/02              │  ← Now shows BOTH dates
└─────────────────────────────────────────┘
```

---

### Acceptance Criteria

| Test | Expected Behavior |
|------|-------------------|
| 1. Open VIP Planning Panel | Shows group name WITH dates (31/01 - 02/02) |
| 2. Group selector in VIP panel | Shows dates and צוות count per group |
| 3. Open reservation modal in VIP neighborhood | Group selector shows "צוות נשאר: X" (not חניכים) |
| 4. Open reservation modal in N1-N7 | Group selector shows "חניכים נשאר: X" (unchanged) |
| 5. Select group in VIP reservation | Max beds = remainingStaff, not remainingParticipants |
| 6. View any tent card with reservation | Shows check-in AND check-out dates |
| 7. Submit VIP reservation | Validation uses צוות counter |

