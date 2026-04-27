## Calendars & Synchronization Documentation

Generate `/mnt/documents/Calendars_and_Sync_Documentation.md` — a single reference covering every calendar surface in the app, what each one displays, the data sources behind it, and how the underlying synchronization keeps them all in agreement.

### Contents

1. **Overview** — Calendars are read-only views built on top of three live data streams: lodging (groups + neighborhood reservations + VIP configs), kitchen meals (`kitchen_time_slots`), and common-space bookings (`activity_reservations`). All synchronization is realtime via Supabase subscriptions — no polling.

2. **Master Calendar** (`MasterCalendar.tsx` + `CalendarMonth/Week/DayView.tsx`)
   - Three view modes: Month, Week, Day. RTL Hebrew with reversed chevrons.
   - Shows: lodging stays (Check-in green / Sleeping blue / Check-out orange), VIP allocations, common-space bookings, kitchen meals (amber).
   - Capacity strip per day from `useCalendarCapacity` (FREE pax = total beds − sleeping guests, computed via `useGroupStays` + Hotel Rule `start ≤ day < end`).
   - Deduplication: per-group neighborhood reservations are suppressed when a unified group stay is already shown.
   - Pending allocations (groups without physical assignment) are still rendered.

3. **Sleeping Calendar** (`SleepingCalendar.tsx`) — Lodging-only horizontal date grid driven by `useGroupStays` (aggregates `neighborhood_reservations` + `groups.vip_tent_configs`).

4. **Kitchen Calendars** (`KitchenWeekView.tsx`, `KitchenMonthView.tsx`)
   - Strictly meal events from `kitchen_time_slots` via `kitchenSlotsToCalendarEvents` (`kitchenCalendarEvents.ts`).
   - Excludes lodging and spaces. Default meal durations: BREAKFAST 60m, LUNCH/DINNER 90m. Highlights special-diet counts.

5. **Daily Tasks Calendar** (`DailyTasksCalendar.tsx`) — Pulls from `daily_tasks`, separated into Housekeeping vs Maintenance categories.

6. **Quote Availability Calendar** (`QuoteAvailabilityCalendar.tsx`) — Decision-support calendar embedded in the Quote create/edit screen; reads same lodging stream and shows monthly bed availability.

7. **Activities / Neighborhood / TentDetail mini-calendars** — Date pickers and per-resource availability strips driven by `activity_reservations` and `neighborhood_reservations`.

### Synchronization Flows

8. **Group → Kitchen + Spaces sync** (`src/lib/groupSync.ts`)
   - `syncGroupToModules(group)` is idempotent: deletes prior rows tagged `source='groupSync'` + `group_id`, then re-inserts.
   - Meals → `kitchen_time_slots` (mapped via `convertSpecialDiets`, 8 dietary categories).
   - Schedule items in `BOOKABLE_SPACES` → `activity_reservations` via RPC `create_activity_reservation_safe` (15-min buffer, advisory lock).
   - `preValidateScheduleConflicts` runs client-side before save; RPC enforces server-side. Dual-layer conflict protection.
   - `removeSyncedRecordsForGroup(id)` cleans both tables on group deletion.

9. **VIP allocation sync** — Dual write: updates `groups.vip_tent_configs` JSONB (source of truth) AND physical `tents` table; `useVipReservations` does manual `await refetch` to avoid race with realtime.

10. **Neighborhood lock automation** — Manual lodging allocation auto-creates/updates a `neighborhood_reservations` row to lock the neighborhood for the date range.

11. **Realtime subscriptions** — `useSupabaseVillage`, `useSupabaseKitchen`, `useSupabaseGroups`, `useSupabaseAllocations` subscribe to `postgres_changes` on their tables. Every calendar re-renders automatically when underlying rows change. No setInterval/polling anywhere.

12. **Maintenance realtime** — Resolving a maintenance task clears facility/tent status across all surfaces (Facilities page, TentDetail, Master Calendar tile counters).

13. **Group cascade cleanup** — Deleting a group asynchronously removes its synced kitchen slots, activity reservations, neighborhood reservations, and allocations (`groupLinkedRecords.ts`).

### Quick Reference Table
A table mapping each calendar → source tables → sync hook → realtime channel.

### Technical Details
- Single Markdown file (~450 lines)
- Code references: `MasterCalendar.tsx`, `CalendarMonth/Week/DayView.tsx`, `SleepingCalendar.tsx`, `KitchenWeekView.tsx`, `KitchenMonthView.tsx`, `DailyTasksCalendar.tsx`, `QuoteAvailabilityCalendar.tsx`, `useCalendarCapacity.ts`, `useGroupStays.ts`, `groupSync.ts`, `reservationConflict.ts`, `kitchenCalendarEvents.ts`, `useSupabaseVillage.ts`, `useSupabaseKitchen.ts`, RPC `create_activity_reservation_safe`.
- Includes one worked example: a group is saved → preValidate → groupSync writes kitchen slots + activity reservations → realtime fires → Master Calendar, Kitchen Week View, and Activities page all refresh without reload.
