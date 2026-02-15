

# Remove Polling Fallback

## Problem
The polling fallback we just added is causing disruptive auto-refreshes that interfere with normal usage.

## Solution
Remove the polling interval and the `lastRealtimeEvent` ref from `src/hooks/useSupabaseVillage.ts`, reverting to pure realtime subscriptions only.

## Changes

### File: `src/hooks/useSupabaseVillage.ts`

1. Remove the `useRef` import addition (keep `useState, useEffect, useCallback` only)
2. Remove the `lastRealtimeEvent` ref declaration
3. Remove the `onRealtimeChange` wrapper function -- revert callbacks back to direct `() => loadData()` calls
4. Remove the `setInterval` polling block
5. Remove the `clearInterval(pollInterval)` from the cleanup

This fully reverts the polling fallback while keeping all realtime subscriptions intact.

