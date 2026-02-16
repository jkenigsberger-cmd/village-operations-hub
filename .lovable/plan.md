
# Auto-Clear Maintenance Data When Issue is Resolved

## Problem

When a facility (bathroom/shower) or activity space is set back to "WORKING" status, the maintenance photo and description (תיאור) remain attached. They should be automatically erased when the issue is resolved.

## Root Cause

In `src/pages/Facilities.tsx`, the `onWorkingChange` handler calls `updateFacilityWorkingStatus()` which only updates the status field. It does not clear `maintenanceImage` or `maintenanceNotes`. The correct function `resolveFacilityIssue()` (which clears everything) exists but is not being used here.

## Changes

### File: `src/pages/Facilities.tsx`

**Line 218-220** -- When working status changes to `WORKING`, call `resolveFacilityIssue` instead of `updateFacilityWorkingStatus`, and also clear the local state for maintenance fields:

```typescript
onWorkingChange={(status) => {
  if (status === 'WORKING') {
    resolveFacilityIssue(selectedFacility.id);
    setSelectedFacility({ 
      ...selectedFacility, 
      workingStatus: status, 
      maintenanceImage: undefined, 
      maintenanceNotes: undefined 
    });
  } else {
    updateFacilityWorkingStatus(selectedFacility.id, status);
    setSelectedFacility({ ...selectedFacility, workingStatus: status });
  }
}}
```

Also need to import `resolveFacilityIssue` from `useVillage()` if not already imported.

### File: `src/context/VillageContext.tsx`

**Line 312-314** -- As a safety net, update `updateFacilityWorkingStatus` itself to automatically clear maintenance data when status changes to `WORKING`:

```typescript
const updateFacilityWorkingStatus = useCallback((facilityId: string, workingStatus: WorkingStatus) => {
  if (workingStatus === 'WORKING') {
    updateFacility(facilityId, { 
      workingStatus, 
      maintenanceNotes: undefined, 
      maintenanceImage: undefined 
    }).catch(console.error);
  } else {
    updateFacility(facilityId, { workingStatus }).catch(console.error);
  }
}, [updateFacility]);
```

Similarly, **line 417-433** -- update `updateActivitySpaceStatus` to clear maintenance data when `workingStatus` changes to `WORKING`:

```typescript
if (workingStatus === 'WORKING') {
  updates.maintenanceNotes = undefined;
  updates.maintenanceImage = undefined;
}
```

| File | Change |
|------|--------|
| `src/pages/Facilities.tsx` | Use `resolveFacilityIssue` when status returns to WORKING; clear local state for maintenance fields |
| `src/context/VillageContext.tsx` | Safety net: `updateFacilityWorkingStatus` and `updateActivitySpaceStatus` auto-clear maintenance data on WORKING |
