

# Fix: Participant (Student) Double-Allocation Bug

## Problem

When you edit a group or re-open the allocation page, the system "forgets" how many students were already allocated and lets you allocate the full number again. This only affects participant/student allocation — VIP works correctly.

## Root Cause

In `AdminGroupEdit.tsx` (line 510), whenever pax or staff count changes, a `useEffect` resets `remainingParticipants` back to the full participant count, erasing the record of existing allocations:

```typescript
remainingParticipants: participantCount,  // <-- wipes out allocated count
```

Both `GroupAllocation.tsx` (line 64) and `ParticipantAllocationTab.tsx` (line 65) then read this stale counter from the group record instead of computing it from actual allocations.

## Fix: Compute Remaining Students Dynamically

Three files need small changes. No database or schema changes required.

### 1. `src/pages/AdminGroupEdit.tsx` (line 510)

Stop resetting `remainingParticipants` when recalculating participant count:

```typescript
// Before:
setFormData(prev => ({
  ...prev,
  participantCount,
  remainingParticipants: participantCount,  // REMOVE this line
}));

// After:
setFormData(prev => ({
  ...prev,
  participantCount,
}));
```

### 2. `src/pages/GroupAllocation.tsx` (line 64)

Replace stale counter with dynamic computation from allocations:

```typescript
// Before:
const remainingParticipants = group.remainingParticipants ?? participantCount;

// After:
const { allocations } = useGroupAllocation();
const participantAllocatedBeds = allocations
  .filter(a => a.groupId === group.id && (a.allocationType === 'NEIGHBORHOOD' || a.allocationType === 'TENT'))
  .reduce((sum, a) => sum + a.bedsAssigned, 0);
const remainingParticipants = Math.max(0, participantCount - participantAllocatedBeds);
```

Note: `useGroupAllocation` is already imported and used elsewhere in this component's children, so we just need to use its `allocations` array here too.

### 3. `src/components/ParticipantAllocationTab.tsx` (line 65)

Same dynamic computation:

```typescript
// Before:
const remainingParticipants = group.remainingParticipants ?? group.participantCount ?? (group.pax - (group.staffCount || 0));

// After:
const participantAllocatedBeds = allocations
  .filter(a => a.groupId === group.id && (a.allocationType === 'NEIGHBORHOOD' || a.allocationType === 'TENT'))
  .reduce((sum, a) => sum + a.bedsAssigned, 0);
const participantCount = group.participantCount ?? (group.pax - (group.staffCount || 0));
const remainingParticipants = Math.max(0, participantCount - participantAllocatedBeds);
```

The `allocations` array is already available in this component via `useGroupAllocation()`.

## What stays unchanged

- VIP allocation (already working correctly)
- Database schema
- Realtime subscriptions
- `allocationStatus.ts` (already uses the correct dynamic pattern)
- The `allocations` table remains the single source of truth

## Result

After this fix, the remaining student count will always be computed from the actual allocations in the database. Editing a group, changing pax, or re-opening the allocation page cannot reset or inflate the count.
