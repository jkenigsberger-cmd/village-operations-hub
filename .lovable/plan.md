

# Fix: Activity Type Selector Hidden for Adults Audience

## Problem
When selecting "מבוגרים" (adults) as the audience, the "סוג פעילות" (activity type) dropdown disappears because of a conditional render on line 704: `{editPricing.audience === 'students' && (`. The activity type should be visible for both audiences.

## Solution
**File**: `src/pages/AdminQuotes.tsx`

1. **Remove the `students`-only guard** around the activity type selector (line 704-716). Show it for both audiences.

2. **Update `handleAudienceChange`** (line ~259): Keep `activityType` for adults too instead of setting it to `undefined`. Default to `'midweek_lodging'` if not set.

3. **Update accommodation pricing logic**: When audience is `adults` AND activity type is `day_activity`, no tent pricing applies. For lodging types, keep the existing tent pricing (`tent3`/`tent68`). This means the activity type drives the pricing model for both audiences.

4. **Update `handleActivityTypeChange`**: For adults, adjust accommodation pricing based on activity type (tent prices for lodging, no accommodation for day activity). For students, keep current per-person pricing from `STUDENT_PRICES`.

### Key change
```tsx
// Before (line 704):
{editPricing.audience === 'students' && (

// After — always show:
<div>
  <Label>סוג פעילות</Label>
  <Select ...>
```

The accommodation pricing section below (lines 720+) already branches on `audience` for students vs adults pricing inputs, so that stays as-is. The activity type just needs to persist across audience changes.

