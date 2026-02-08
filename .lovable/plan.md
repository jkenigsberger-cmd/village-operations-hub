

# Filter Day-Use Groups from Allocation

## Problem
Day-use groups (`יום ללא לינה`) don't sleep in the complex, so they shouldn't require allocation. While the notification system already correctly excludes them, the allocation page itself (`/allocation/{groupId}`) doesn't prevent navigation to a day-use group's allocation view.

## Solution
Add a simple check in `GroupAllocation.tsx` to detect day-use groups and show an appropriate message (or redirect back), instead of displaying the allocation interface.

## Changes Required

### File: `src/pages/GroupAllocation.tsx`

Add a check after finding the group:

```tsx
// After line 21: const group = groups.find(g => g.id === id);

// Day-use groups don't need allocation
if (group && group.groupType === 'יום ללא לינה') {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardContent className="pt-6 text-center">
          <Sun className="w-12 h-12 mx-auto mb-4 text-amber-500" />
          <h2 className="text-xl font-bold mb-2">פעילות יום</h2>
          <p className="text-muted-foreground mb-6">
            קבוצות יום ללא לינה אינן דורשות שיבוץ מיטות כיוון שאינן לנות במתחם
          </p>
          <Button onClick={() => navigate('/')}>
            חזור לדשבורד
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
```

## Summary
| File | Change |
|------|--------|
| `src/pages/GroupAllocation.tsx` | Add early return for day-use groups showing message that they don't need allocation |

## What Stays the Same
- All allocation logic unchanged
- Sleeping groups continue to work normally
- Notification system already correct (excludes day-use)
- No database changes needed

