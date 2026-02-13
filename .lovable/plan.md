
# Fix: Maintenance Not Updating in Real-Time

## Root Cause

Two tables that store maintenance data -- `facilities` and `activity_spaces` -- are missing from both the database realtime publication and the code's realtime subscriptions. Changes to these tables only appear after a full page refresh.

## Changes

### 1. Database Migration

Add both tables to the `supabase_realtime` publication so the database broadcasts changes:

```sql
ALTER PUBLICATION supabase_realtime ADD TABLE public.facilities;
ALTER PUBLICATION supabase_realtime ADD TABLE public.activity_spaces;
```

### 2. `src/hooks/useSupabaseVillage.ts`

Add two more channel subscriptions alongside the existing ones (around line 376):

```typescript
supabase.channel('facilities-changes')
  .on('postgres_changes', { event: '*', schema: 'public', table: 'facilities' }, () => loadData()),
supabase.channel('activity-spaces-changes')
  .on('postgres_changes', { event: '*', schema: 'public', table: 'activity_spaces' }, () => loadData()),
```

This matches the exact same pattern already used for the other 6 tables.

## Result

After this fix, any maintenance status change (marking broken, resolving issues, cleaning updates) on facilities and activity spaces will automatically appear on all open browsers without needing to refresh.
