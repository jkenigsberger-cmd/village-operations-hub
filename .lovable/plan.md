## Dashboard, Tabs, Calendars & Neighborhood Maps — Reference Document

Generate `/mnt/documents/Dashboard_Tabs_Calendars_Maps_Reference.md`: a single Markdown reference (~600 lines) that exhaustively documents every dashboard surface, every tab, the calendar logic, and the neighborhood visual maps — including the exact logic, data sources, and rules behind them.

### Sections

1. **Overview** — Single-page architecture: navigation between sections is driven by React Router `location.state` (never URL routes for tabs). RTL Hebrew throughout. All data is realtime via Supabase subscriptions, no polling.

2. **Top-level Layout** (`AdminLayout.tsx`, `MobileBottomNav.tsx`, `BreadcrumbNav.tsx`, `GlobalSearch.tsx`)
   - Sidebar/topbar nav, mobile bottom bar, global Hebrew search index (`searchIndex.ts`).
   - Auth gating (`AuthGate.tsx`) with Google OAuth + `allowed_users` whitelist.

3. **Today / Home Dashboard** (`pages/Today.tsx`, `Index.tsx`, `DailySummaryCard.tsx`, `ActionTile.tsx`)
   - Daily summary tile: counts active groups today (excludes archived).
   - Quick-action tiles routing to Sleeping, Kitchen, Activities, Facilities.
   - Sleeping dashboard summary (`SleepingDashboard.tsx`): per-day Check-in (green) / Sleeping (blue) / Check-out (orange) sections, filter switches, mini calendar with month counts via `useGroupStays.getMonthCounts`.

4. **Main Tabs / Sections** — for each: purpose, data source hook, key logic.
   - **Sleeping** (`SleepingDashboard`, `SleepingCalendar`, `SleepingDetailDrawer`, `useGroupStays`, `useSleepingData`) — Hotel Rule (`start ≤ day < end`), unified group stays aggregating `neighborhood_reservations` + `groups.vip_tent_configs`.
   - **Neighborhoods** (`pages/Neighborhood.tsx`, `NeighborhoodTile`, `NeighborhoodMap`, `NeighborhoodMiniMap`, `NeighborhoodBookingsList`, `NeighborhoodReservationModal`, `NeighborhoodBulkActions`, `NeighborhoodDatePicker`) — 8 neighborhoods, 51 tents, 335 beds; bookings list with dedup; per-neighborhood occupancy prioritizes group total pax over physical bed assignments.
   - **Tent Detail** (`pages/TentDetail.tsx`, `TentDetailModal`, `BedTile`, `tentColors.ts`) — gender colors (Women green / Men blue / Mixed orange), dual-check visibility gating for tent metadata based on date validity.
   - **Kitchen** (`pages/Kitchen.tsx`, `KitchenWeekView`, `KitchenMonthView`, `MealSection`, `TimeSlotCard`, `AddTimeSlotModal`, `KitchenEventDetailModal`, `useKitchenData`) — strictly meals, 8 dietary categories, upgraded coffee amber marker.
   - **Activities** (`pages/Activities.tsx`, `ActivitySpaceReportModal`, `TimeSlotDetailModal`) — common-space bookings via `activity_reservations`, mandatory 15-min gap enforced by RPC `create_activity_reservation_safe` + client `preValidateScheduleConflicts`.
   - **Facilities** (`pages/Facilities.tsx`, `FacilityCard`, `MaintenancePhotoCapture`, `ReportIssueModal`, `GeneralMaintenanceModal`) — Housekeeping vs Maintenance separation; resolving a task clears status + deletes media everywhere.
   - **Group Allocation** (`pages/GroupAllocation.tsx`, `ParticipantAllocationTab`, `VIPAllocationTab`, `VIPPlanningPanel`, `VIPTentPlanner`, `PendingAllocationCard`, `DistributionRequirementsPanel`, `useGroupAllocation`, `useVipReservations`, `useVipCleanup`) — manual allocation only for sleeping groups; greedy descending feasibility match; VIP dual-write to JSONB + tents table with manual await refetch; auto-creates `neighborhood_reservations` to lock neighborhood.
   - **Admin Groups / Group Edit** (`AdminGroups.tsx`, `AdminGroupEdit.tsx`, `GroupItineraryModal`, `useAdminGroups`, `useSupabaseGroups`) — date coherence validation, archive boolean → `status` column, async cascade cleanup on delete (`groupLinkedRecords.ts`).
   - **Admin Quotes** (`AdminQuotes.tsx`, `QuoteAvailabilityCalendar`, `useQuotes`, `quoteUtils.ts`) — snapshot-based JSON versioning, fixed catalog pricing, night-based student totals, browser `window.print()` PDF.
   - **Admin Income / Expenses / Outsourced / Reports** (`AdminIncome.tsx`, `AdminExpenses.tsx`, `AdminOutsourced.tsx`, `AdminReports.tsx`, `AdminDateRangeFilter`, `useAdminFinance`, `useSupabaseFinance`).
   - **Admin Guest Forms** (`AdminGuestForms.tsx`, `GuestFormResponseView`, `useGuestFormSubmissions`) — 4-step prefilled wizard via public `pages/GuestForm.tsx`, JSON-serialized itineraries/diets, hardcoded Lovable base URL.
   - **Settings & User Management** (`Settings.tsx`, `UserManagement.tsx`) — RBAC admin/viewer via `allowed_users` whitelist + `user_roles`.

5. **Calendar System** — for each calendar surface: file, data source, view modes, color rules, capacity logic.
   - **Master Calendar** (`MasterCalendar.tsx` + `CalendarMonthView/WeekView/DayView.tsx`) — 3 view modes, RTL reversed chevrons (Right=Forward, Left=Backward), shows lodging stays, VIP allocations, common-space bookings, kitchen meals (amber). Capacity strip from `useCalendarCapacity` (FREE = total beds − sleeping). Pending/unassigned groups visible. Per-group neighborhood reservation suppressed when unified stay shown.
   - **Sleeping Calendar** (`SleepingCalendar.tsx`) — horizontal date grid driven by `useGroupStays`.
   - **Kitchen Calendars** (`KitchenWeekView`, `KitchenMonthView`) — strictly `kitchen_time_slots`; default durations BREAKFAST 60m, LUNCH/DINNER 90m; highlights special diets.
   - **Daily Tasks Calendar** (`DailyTasksCalendar.tsx`) — Housekeeping vs Maintenance.
   - **Quote Availability Calendar** (`QuoteAvailabilityCalendar.tsx`) — embedded in Quote create/edit; monthly bed availability.
   - **Mini calendars** in Activities, Neighborhood, TentDetail.
   - **Capacity rule worked example** showing Hotel Rule application across a multi-day stay.

6. **Neighborhood Visual Maps**
   - **NeighborhoodMap** (`NeighborhoodMap.tsx`) — generic SVG map of tent nodes; gender-colored fills (women green / men blue / mixed orange / unassigned cream), gender stroke variants, click handlers, `+1` extra-bed badge.
   - **VIPNeighborhoodMap** (`VIPNeighborhoodMap.tsx`) — fixed VIP layout with central fireplace and 10 numbered cabins (88, 89, 80, 81 / 87, 82 / 86, 85, 84, 83), dashed connection lines, premium cabin SVG with roof + door, Hebrew gender legend.
   - **MiniMapCircular** + **MiniMapVIP** + **NeighborhoodMiniMap** — compact previews for tiles/cards.
   - VIP source-of-truth: dynamically derived from `groups.vip_tent_configs`, dual-synced with `tents` table; sorting via numerical extraction.

7. **Synchronization / Realtime Logic**
   - `groupSync.syncGroupToModules` idempotent — meals → `kitchen_time_slots`, schedule items in `BOOKABLE_SPACES` → `activity_reservations` via RPC. Dual-layer conflict detection.
   - VIP allocation dual write + manual `await refetch`.
   - Neighborhood lock automation via `neighborhood_reservations`.
   - Realtime hooks: `useSupabaseVillage`, `useSupabaseKitchen`, `useSupabaseGroups`, `useSupabaseAllocations`, `useSupabaseFinance` subscribe to `postgres_changes`. No polling anywhere.
   - Cascade cleanup on group delete via `groupLinkedRecords.ts` (wildcard whitespace matching).

8. **Color & Style Rules**
   - Booking status: Check-in green / Sleeping blue / Check-out orange.
   - Gender: Women green / Men blue / Mixed orange.
   - Main bg `#F7F3ED`. Kitchen meal events amber. Upgraded coffee amber marker.
   - RTL Hebrew with English exceptions ('CHECK IN', 'CHECK OUT', 'By: Glow Glamping').

9. **Quick Reference Tables**
   - Tab → page file → primary hook → main DB tables.
   - Calendar → source tables → sync hook → realtime channel.
   - Neighborhood map component → use case.

### Technical Details

- Single Markdown file, ~500–650 lines, written to `/mnt/documents/`.
- Sources read during exploration: `Today.tsx`, `Index.tsx`, `SleepingDashboard.tsx`, `Neighborhood.tsx`, `NeighborhoodMap.tsx`, `VIPNeighborhoodMap.tsx` (already shown), `MasterCalendar.tsx`, `useCalendarCapacity.ts` (already shown), `useGroupStays.ts`, `groupSync.ts`, plus tab pages enumerated above.
- No code is modified — this is a documentation-only deliverable. After generation, file is delivered via `<lov-artifact>` tag.
