

# Fix: "+1 Extra Bed" Badge Not Showing on VIP Tents

## Root Cause

The `assignedTentCode` stored in `vipTentConfigs` is just the number (e.g. `"86"`, `"89"`), but `tent.code` in the tents table is prefixed with "VIP " (e.g. `"VIP 86"`, `"VIP 89"`).

The lookup in `Neighborhood.tsx` does `extraBedByTentCode[tent.code]`, which tries to find key `"VIP 86"` but the map only has key `"86"`. So it always returns `undefined` and the badge never renders.

The same mismatch applies in `Index.tsx` (homepage mini-map).

## Fix

**File: `src/pages/Neighborhood.tsx`** (line ~173)

When building the `extraBedByTentCode` map, prefix the key with `"VIP "`:

```typescript
// Before:
map[config.assignedTentCode] = true;

// After:
map[`VIP ${config.assignedTentCode}`] = true;
```

**File: `src/pages/Index.tsx`**

Apply the same prefix fix in the equivalent `extraBedByTentCode` builder on the homepage.

This is a one-line fix in each file. No other changes needed -- the rest of the chain (TentCard badge, VIPNeighborhoodMap badge, MiniMapVIP badge) already works correctly once the lookup keys match.

