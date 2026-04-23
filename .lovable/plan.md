

## Bathrooms & Showers Documentation

Generate `/mnt/documents/Bathrooms_and_Showers_Documentation.md` covering the full facilities subsystem.

### Contents

1. **Overview** — Two-track model: shared facilities (`facilities` + `facility_areas` tables) vs VIP private facilities (columns on `tents` table).

2. **Inventory & Locations** — All 6 facility areas with their bathrooms/showers:
   - Gendered areas (male/female toilets + showers)
   - Unisex stations
   - Accessible units
   - VIP private facilities (tents 80–89)
   - Total counts (~46 units) and numerical sorting logic (`תא 4` before `תא 13`)

3. **Data Model** — `facilities` table fields (`facility_type`, `gender`, `is_accessible`, `cleaning_status`, `working_status`, `maintenance_image`, `maintenance_notes`), `facility_areas` grouping, and VIP tent columns (`bathroom_working_status`, `shower_working_status`, etc.).

4. **Status Logic** — Cleaning cycle (CLEAN → NEEDS_CLEANING → CLEANING_IN_PROGRESS) and Working cycle (WORKING → BROKEN → MAINTENANCE → CLOSED). Auto-clear of notes/image on resolve.

5. **UI Surfaces**:
   - `/facilities` page — area expansion, FacilityCard/FacilityTile, focus query param
   - Dashboard "Facilities Alert" tile (excludes cleaning, includes maintenance only)
   - `MobileBottomNav` shortcut to `/facilities`
   - VIP maintenance inside `TentDetailModal`

6. **Reservations** — `facility_reservations` table for time-slot bookings (group_name, color, people count, 15-min buffer model).

7. **Photo & Notes Workflow** — `MaintenancePhotoCapture` / `ReportIssueModal`, base64 storage, `compressImageFileToDataUrl` (1280px, 72% JPEG).

8. **Real-time Sync** — Postgres changes subscriptions on `facilities` table; resolution auto-cascades across modules.

9. **Search Integration** — `searchIndex.ts` indexes facilities with area context for `GlobalSearch`.

### Technical Details
- Single Markdown file (~400 lines)
- Code references to: `Facilities.tsx`, `FacilityCard.tsx`, `ReportIssueModal.tsx`, `MaintenancePhotoCapture.tsx`, `useSupabaseVillage.ts`, `initialData.ts`, `searchIndex.ts`
- Includes table of all facility areas with their facility breakdown by type/gender

