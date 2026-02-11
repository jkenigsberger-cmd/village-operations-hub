

# Fix: Cascade Delete Not Clearing VIP Tents and Beds

## Problem Found

When a group is deleted, orphaned data remains in the database:

1. **VIP tents still show deleted groups**: Tents VIP 87 (group "השומר החדש"), VIP 83 (group "ddd") still have `group_name`, `check_in_date`, `check_out_date`, and `gender` set even though those groups no longer exist.

2. **Beds stay RESERVED**: Beds in those VIP tents remain in `RESERVED` status instead of being reset to `FREE`.

3. **Neighborhood reservations not deleted**: An orphaned reservation for "השומר החדש" still exists in `neighborhood_reservations`.

**Root cause**: The cascade delete matches tents/reservations using exact string equality (`.eq('group_name', groupName)`), but some group names were stored with trailing whitespace (e.g., "השומר החדש " vs "השומר החדש"). This caused the cleanup queries to silently match zero rows.

## Plan

### 1. Fix `cascadeDeleteGroupRecords` in `src/lib/groupLinkedRecords.ts`

- **Trim group name** before using it in queries to handle whitespace mismatches
- **Use `.ilike()` or `.or()` with trimmed variant** as a safety net for matching
- **Add beds cleanup step**: After clearing tents, also reset all beds in those tents from `RESERVED` to `FREE`
- The updated cascade flow:
  1. Delete allocations (by group_id) -- already works
  2. Delete neighborhood_reservations (by group_name, trimmed) -- fix matching
  3. Delete activity_reservations (by group_id OR group_name) -- fix matching
  4. Clear tents: first **fetch matching tent IDs**, then update tents AND reset their beds to FREE
  5. Update kitchen_time_slots -- already works

### 2. Fix `getLinkedRecordsSummary` in the same file

- Apply the same trimmed matching to the count queries so the "linked records" warning accurately detects orphaned data before deletion.

### 3. Clean up existing orphaned data

- Run a one-time database migration to:
  - Clear the 4 orphaned VIP tents (reset group_name, dates, gender)
  - Reset their beds to FREE
  - Delete the orphaned neighborhood reservation

### Technical Detail: Beds Cleanup Logic

Currently, step 4 only does:
```
update tents set group_name=null, dates=null, gender='MIXED' where group_name = X
```

It will be changed to:
```
1. SELECT id FROM tents WHERE group_name matches (trimmed)
2. UPDATE tents SET group_name=null, dates=null, gender='MIXED' WHERE id IN (...)
3. UPDATE beds SET status='FREE', guest_name=null WHERE tent_id IN (...) AND status='RESERVED'
```

This ensures both the tent metadata AND the individual bed statuses are fully reset.

