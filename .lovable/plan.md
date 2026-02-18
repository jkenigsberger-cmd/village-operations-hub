

# Fix: Archived Groups Not Persisting to Database

## Root Cause

In `src/hooks/useAdminGroups.ts`, the `updateGroup` function maps every `GroupRecord` field to its corresponding database column -- except `isArchived`. The line that converts `isArchived` to the database `status` column is simply missing.

When you archive a group:
1. `archiveGroup(id)` calls `updateGroup(id, { isArchived: true })`
2. `updateGroup` builds `dbUpdates` but skips `isArchived` (no mapping exists)
3. Local state updates via `setGroups(...)` so it looks archived in the UI
4. The database never receives the change
5. On page reload, the group loads from the database with its original status -- not archived

The sister hook `useSupabaseGroups.ts` has the correct mapping at line 143, but `useAdminGroups.ts` (which is actually used by the app) does not.

## Fix

### File: `src/hooks/useAdminGroups.ts`

Add the missing `isArchived` mapping inside the `updateGroup` function, after the `girlsCount` line (line 127):

```typescript
if (updates.boysCount !== undefined) dbUpdates.boys_count = updates.boysCount ?? null;
if (updates.girlsCount !== undefined) dbUpdates.girls_count = updates.girlsCount ?? null;
// ADD THIS LINE:
if (updates.isArchived !== undefined) dbUpdates.status = updates.isArchived ? 'archived' : updates.status || 'PLANNED';
```

This ensures that when `archiveGroup` or `restoreGroup` is called, the `status` column in the database is set to `'archived'` or restored to `'PLANNED'`, making the change persistent.

Also need to update the `mapDbRowToGroup` function to derive `isArchived` from the database `status` field (it currently does not set it). Around line 27, add:

```typescript
isArchived: row.status === 'archived',
```

This is a two-line fix in a single file. No schema or other file changes needed.

