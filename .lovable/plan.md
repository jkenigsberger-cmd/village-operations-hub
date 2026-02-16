
# Sort Facilities Numerically Within Each Area Group

## What will change

On the Bathrooms & Showers page (`/facilities`), facilities within each area group will be sorted in ascending numeric order (small to big). The area groups themselves stay in their current order.

For example, if an area has facilities labeled "תא 13", "תא 4", "מקלחת 1", "מקלחת 12", they will be sorted as: 1, 4, 12, 13.

## Technical Details

### File: `src/pages/Facilities.tsx`

**Line 114** -- After mapping `facilityIds` to facility objects, sort them by extracting the numeric portion from `facility.label`:

```typescript
// Before:
const facilities = area.facilityIds.map(id => state.facilities[id]).filter(Boolean);

// After:
const facilities = area.facilityIds
  .map(id => state.facilities[id])
  .filter(Boolean)
  .sort((a, b) => {
    const numA = parseInt(a.label.match(/\d+/)?.[0] || '0', 10);
    const numB = parseInt(b.label.match(/\d+/)?.[0] || '0', 10);
    return numA - numB;
  });
```

Also apply the same sort in `getAreaStats` (line 74) for consistency, though it only affects counting so it is optional.

| File | Change |
|------|--------|
| `src/pages/Facilities.tsx` | Sort facilities array numerically by label after mapping from `facilityIds` (line 114) |
