
## Plan: Add Automatic Migration for Facility Hebrew Labels

### The Problem
You're not seeing the new Hebrew facility names because:
1. Your browser has existing facility data stored in LocalStorage
2. The current migration only replaces facilities if they're **completely missing**
3. Old labels like "TOILET-1", "SHOWER-1" are still being shown

### Solution
Add a new migration step in `useVillageData.ts` that:
1. Detects old English facility labels
2. Automatically replaces ALL facility and facility area data with the fresh Hebrew-labeled data
3. Preserves your cleaning/working status for each facility (if possible) or resets them

---

### Option A: Full Facility Reset (Recommended for simplicity)
Replace all facility data with fresh Hebrew labels. This will:
- Show the new Hebrew numbers immediately
- Reset all cleaning/working statuses to default

### Option B: Smart Migration (More complex)
Try to match old facilities to new ones and preserve statuses. However, since the structure changed significantly (dining hall split into 2 areas), this is complex and error-prone.

---

### Technical Implementation (Option A)

**File: `src/hooks/useVillageData.ts`**

Add migration logic around line 45-62 to detect old labels and force refresh:

```text
// Check if facilities need Hebrew label migration
const needsFacilityLabelMigration = Object.values(parsed.facilities).some(
  (f) => f.label.startsWith('TOILET-') || f.label.startsWith('SHOWER-')
);

if (needsFacilityLabelMigration) {
  // Replace all facility data with fresh Hebrew-labeled data
  parsed.facilityAreas = initial.facilityAreas;
  parsed.facilities = initial.facilities;
  needsMigration = true;
  console.log('[migration] Migrated facility labels to Hebrew');
}
```

This will:
1. Check if any facility has old English labels like "TOILET-1" or "SHOWER-1"
2. If found, replace all facilities and areas with the new Hebrew data
3. Persist the migration to LocalStorage

---

### Summary of Changes

| File | Change |
|------|--------|
| `src/hooks/useVillageData.ts` | Add migration check for old facility labels and auto-replace with fresh Hebrew data |

### After Implementation
Once deployed, refresh the page and you'll see:
- חדר אוכל - גברים (with מקלחת 1-12, תא 4 ♿, תא 13-16)
- חדר אוכל - נשים (with תא 17-21 ♿, מקלחת 22-32)
- מתא 33 עד 36, מתא 37 עד 38, etc.
