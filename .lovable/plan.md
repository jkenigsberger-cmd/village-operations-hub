

# Fix Day-Use Group Detection - Add Missing Database Column

## Root Cause Identified

The `groups` table in the database is **missing the `group_type` column**. The `useAdminGroups` hook hardcodes every group to `'לינה'` (lodging):

```typescript
// useAdminGroups.ts line 14
groupType: 'לינה' as GroupType,  // Always hardcoded!
```

This means day-use groups (`יום ללא לינה`) are never properly identified because the type is never saved to or read from the database.

## Solution

### 1. Add `group_type` Column to Database

Add a new column to the `groups` table:
- Column name: `group_type`
- Type: `text`
- Default: `'לינה'` (so existing groups remain as lodging groups)
- Not nullable

### 2. Update `useAdminGroups.ts`

Modify the hook to read and write the `group_type` field:

**In `mapDbRowToGroup` function:**
```typescript
// Change from:
groupType: 'לינה' as GroupType,

// To:
groupType: (row.group_type as GroupType) || 'לינה',
```

**In `addGroup` function - add to insert object:**
```typescript
group_type: group.groupType || 'לינה',
```

**In `updateGroup` function - add mapping:**
```typescript
if (updates.groupType !== undefined) dbUpdates.group_type = updates.groupType;
```

## Summary

| Change | Details |
|--------|---------|
| Database migration | Add `group_type TEXT DEFAULT 'לינה' NOT NULL` to `groups` table |
| `src/hooks/useAdminGroups.ts` | Read `group_type` from DB, write it on insert/update |

## What This Fixes
- Day-use groups will be properly saved with `groupType = 'יום ללא לינה'`
- The allocation page check `group.groupType === 'יום ללא לינה'` will work correctly
- Existing groups default to `'לינה'` (no data migration needed)

## What Stays the Same
- All existing allocation logic unchanged
- Group edit form already has the UI for selecting group type
- Filtering logic in various components already checks `groupType`

