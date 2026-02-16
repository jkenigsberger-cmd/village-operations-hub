
# Clean Up Old Maintenance Data

## Problem

The fix to auto-clear maintenance data when setting status to "WORKING" only works going forward. There are **18 records** (13 facilities + 5 activity spaces) that already have leftover maintenance photos and descriptions from before the fix.

## What will change

A one-time data cleanup will erase all old maintenance images and notes from facilities and activity spaces that are currently marked as "WORKING" (תקין). This affects:

**Facilities (13):** תא 33, תא 19, תא 39, מקלחת 2, מקלחת 5, מקלחת 1, תא 41, מקלחת 3, תא 17, תא 35, מקלחת 6, תא 34, מקלחת 7

**Activity spaces (5):** ממ"ד 6, ממ"ד 2, חדר אוכל, אוהל מועד, ממ"ד 4

## Technical Details

Two data update queries will be run:

```sql
-- Clear leftover maintenance data from facilities marked WORKING
UPDATE facilities 
SET maintenance_image = NULL, maintenance_notes = NULL 
WHERE working_status = 'WORKING' 
  AND (maintenance_image IS NOT NULL OR maintenance_notes IS NOT NULL);

-- Clear leftover maintenance data from activity spaces marked WORKING
UPDATE activity_spaces 
SET maintenance_image = NULL, maintenance_notes = NULL 
WHERE working_status = 'WORKING' 
  AND (maintenance_image IS NOT NULL OR maintenance_notes IS NOT NULL);
```

No code changes are needed -- the previous fix already ensures this won't happen again going forward.
