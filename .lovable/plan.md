
# Automatic Database Storage Plan

## Goal
Replace all localStorage storage with direct database storage so data is automatically saved to the cloud without any manual import step.

## Current State
The application currently has two parallel systems:
- **Old hooks** (in use): `useVillageData`, `useAdminGroups`, `useKitchenData`, `useAdminFinance`, `useGroupAllocation` - all use localStorage
- **New hooks** (not used yet): `useSupabaseVillage`, `useSupabaseGroups`, `useSupabaseKitchen`, `useSupabaseAllocations`, `useSupabaseFinance` - ready for database

## Changes Required

### Phase 1: Update VillageContext to Use Database
Replace the localStorage-based `useVillageData` hook with the Supabase-based `useSupabaseVillage` hook inside VillageContext.

**File: `src/context/VillageContext.tsx`**
- Change import from `useVillageData` to `useSupabaseVillage`
- Update all save operations to call database update functions instead of localStorage

### Phase 2: Update Admin Groups Hook
Replace the localStorage logic in `useAdminGroups` with calls to the database.

**File: `src/hooks/useAdminGroups.ts`**
- Replace localStorage read/write with Supabase queries
- Keep the same public API (addGroup, updateGroup, deleteGroup, etc.)

### Phase 3: Update Kitchen Data Hook
Replace the localStorage logic in `useKitchenData` with database calls.

**File: `src/hooks/useKitchenData.ts`**
- Replace localStorage with Supabase queries for time slots
- Maintain the same interface

### Phase 4: Update Finance Hook
Replace localStorage in `useAdminFinance` with database calls.

**File: `src/hooks/useAdminFinance.ts`**
- Replace localStorage with Supabase queries for income, expenses, outsourced

### Phase 5: Update Allocations Hook
Replace localStorage in `useGroupAllocation` with database calls.

**File: `src/hooks/useGroupAllocation.ts`**
- Replace localStorage with Supabase for allocations table

### Phase 6: Update Group Sync Utility
Update `groupSync.ts` to write to database instead of localStorage.

**File: `src/lib/groupSync.ts`**
- Replace direct localStorage manipulation with Supabase operations

### Phase 7: Automatic Data Seeding
When the database is empty (first load), automatically seed it with initial data from `initialData.ts`.

**File: `src/hooks/useSupabaseVillage.ts`**
- Add logic to detect empty database and seed initial neighborhoods, tents, beds, facilities, activity spaces

### Phase 8: Clean Up Settings Page
Remove the manual "Upload to Cloud" button since data is now automatic.

**File: `src/pages/Settings.tsx`**
- Remove the cloud import section
- Update text to reflect that data is stored in the cloud automatically

## Files to Modify

| File | Change |
|------|--------|
| `src/context/VillageContext.tsx` | Use `useSupabaseVillage` instead of `useVillageData` |
| `src/hooks/useAdminGroups.ts` | Replace localStorage with Supabase calls |
| `src/hooks/useKitchenData.ts` | Replace localStorage with Supabase calls |
| `src/hooks/useAdminFinance.ts` | Replace localStorage with Supabase calls |
| `src/hooks/useGroupAllocation.ts` | Replace localStorage with Supabase allocations |
| `src/lib/groupSync.ts` | Use Supabase instead of localStorage |
| `src/pages/Settings.tsx` | Remove manual import button, update info text |
| `src/hooks/useSupabaseVillage.ts` | Add auto-seeding when database is empty |

## Technical Details

### Auto-Seeding Logic
When `loadData()` returns no neighborhoods:
1. Call `generateInitialVillageState()` from `initialData.ts`
2. Insert all neighborhoods, tents, beds, facilities, activity spaces to database
3. This happens automatically on first load - no user action needed

### Real-time Sync
All hooks already have real-time subscriptions set up in the Supabase hooks, so changes will propagate automatically to all connected devices.

### Unchanged Functionality
- All UI components remain exactly the same
- All business logic stays the same
- VillageContext public API stays identical
- Calendar views, occupancy calculations work the same way

## Benefits After Implementation
- Data automatically saved to cloud on every change
- No manual "Upload to Cloud" button needed
- Real-time sync across all devices
- First-time users get seeded data automatically
- Existing users continue working seamlessly
