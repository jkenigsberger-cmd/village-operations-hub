
# Add Polling Fallback for Multi-Device Data Sync

## Problem
Maintenance data (and other village data) doesn't update across devices unless the page is manually refreshed. Realtime subscriptions can silently disconnect.

## Solution
Add a smart polling fallback alongside the existing realtime subscriptions in `useSupabaseVillage.ts`. This ensures every connected device stays up-to-date even if its realtime channel drops.

## Changes

### File: `src/hooks/useSupabaseVillage.ts` (lines 363-389)

Update the realtime subscription `useEffect` block to add polling:

1. Add a `useRef` to track the last time a realtime event was received
2. Inside each realtime callback, update that ref timestamp (in addition to calling `loadData()`)
3. Add a `setInterval` that polls `loadData()` every 15 seconds
4. If a realtime event was received within the last 30 seconds, skip the poll (realtime is healthy)
5. If no realtime event was received recently, execute the poll to catch up
6. Clean up the interval on unmount alongside the existing channel cleanup

### Logic summary:

```text
Realtime event --> loadData() + mark lastRealtimeEvent = now
Every 15s poll --> if (now - lastRealtimeEvent > 30s) then loadData()
Unmount --> clear interval + remove channels
```

This keeps network usage minimal when realtime is working (polls are skipped), but catches silent disconnections within 15 seconds. All devices benefit independently.

### No other files changed
- No UI changes
- No database changes
- No new dependencies
