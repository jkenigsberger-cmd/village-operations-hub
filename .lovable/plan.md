
# Database Migration Plan: localStorage to Cloud Backend

## Overview

This plan migrates all operational data from browser localStorage to the Cloud backend, enabling:
- **Multi-device access**: Same data across PCs and mobiles
- **Real-time updates**: All users see live changes instantly
- **Data persistence**: No data loss when clearing browser storage
- **Foundation for user roles**: Required for future Owner/Worker permissions

## Current Data Architecture

The application currently stores data in **6 localStorage keys**:

| Storage Key | Purpose | Data Type |
|-------------|---------|-----------|
| `aharonson_farm_village_state` | Tents, beds, facilities, reservations | Large JSON (~2MB potential) |
| `aharonson_admin_groups` | Group reservations with meals/schedules | Array of group records |
| `aharonson_farm_kitchen_state` | Kitchen time slots | Record of time slots |
| `aharonson_allocations` | Bed/tent assignments | Array of allocations |
| `af_admin_income` | Income entries | Array |
| `af_admin_expenses` | Expense entries | Array |
| `af_admin_outsourced` | Outsourced worker hours | Array |

---

## Database Schema Design

### Phase 1: Core Tables

```text
+------------------+     +------------------+     +------------------+
|   neighborhoods  |     |      tents       |     |       beds       |
+------------------+     +------------------+     +------------------+
| id (PK)          |     | id (PK)          |     | id (PK)          |
| name             |<--->| neighborhood_id  |<--->| tent_id          |
| display_name     |     | code             |     | label            |
| has_double_tents |     | cleaning_status  |     | bed_type         |
| is_white_tent    |     | group_name       |     | status           |
+------------------+     | check_in_date    |     | guest_name       |
                         | check_out_date   |     +------------------+
                         | ...              |
                         +------------------+
```

### Tables Overview

1. **Static Structure** (rarely changes):
   - `neighborhoods` - 8 neighborhoods (N1-N7 + VIP)
   - `tents` - ~50 tents with configuration
   - `beds` - ~335 beds linked to tents
   - `facilities` - Toilets/showers with location
   - `facility_areas` - Facility groupings
   - `activity_spaces` - Common spaces (אוהל מועד, etc.)

2. **Operational Data** (changes frequently):
   - `neighborhood_reservations` - Group bookings for neighborhoods
   - `activity_reservations` - Space bookings
   - `facility_reservations` - Facility time slots
   - `daily_tasks` - Cleaning/maintenance tasks
   - `kitchen_time_slots` - Meal schedules

3. **Admin Data**:
   - `groups` - Group records with all details
   - `allocations` - Bed/tent assignments
   - `income` - Financial income entries
   - `expenses` - Financial expense entries
   - `outsourced` - External worker hours

---

## Migration Strategy

### Approach: Parallel Operation (Recommended)

```text
┌─────────────────────────────────────────────────────────────┐
│                     MIGRATION PHASES                         │
├─────────────────────────────────────────────────────────────┤
│  Phase 1: Create Database Schema                             │
│  ├── Create all tables with proper relationships            │
│  ├── Enable Row Level Security (RLS)                         │
│  └── Set policies for public read (no auth yet)             │
├─────────────────────────────────────────────────────────────┤
│  Phase 2: Add Database Hooks                                 │
│  ├── Create new hooks: useSupabaseVillage, useSupabaseGroups│
│  ├── Implement CRUD operations via Supabase client          │
│  └── Add real-time subscriptions for live updates           │
├─────────────────────────────────────────────────────────────┤
│  Phase 3: Replace Context Providers                          │
│  ├── Update VillageContext to use Supabase hooks            │
│  ├── Update useAdminGroups to use Supabase                   │
│  ├── Update useKitchenData to use Supabase                   │
│  └── Update useGroupAllocation to use Supabase               │
├─────────────────────────────────────────────────────────────┤
│  Phase 4: Data Import & Cleanup                              │
│  ├── Create import tool in Settings page                     │
│  ├── Import existing localStorage data                       │
│  └── Remove localStorage dependencies                        │
└─────────────────────────────────────────────────────────────┘
```

---

## Technical Implementation Details

### Database Tables SQL (Phase 1)

**Table 1: Neighborhoods**
- Stores the 8 neighborhood definitions
- Static data, populated once from initialData.ts

**Table 2: Tents**
- Links to neighborhood via foreign key
- Stores dynamic fields: cleaning_status, group_name, dates, notes
- Includes VIP-specific fields (private bathroom/shower status)

**Table 3: Beds**
- Links to tent via foreign key
- Stores: status (FREE/RESERVED/OCCUPIED/BLOCKED), guest_name

**Table 4: Groups**
- Main group reservation records
- JSON columns for complex nested data (meal_plan, schedule_items, vip_tent_configs)
- This approach avoids excessive normalization for rarely-queried nested structures

**Table 5: Allocations**
- Links groups to resources (VIP tents, neighborhoods, tents)
- Tracks bed assignments

**Table 6-8: Facilities, FacilityAreas, ActivitySpaces**
- Static structure with dynamic status fields

**Table 9-11: Reservations (neighborhood, activity, facility)**
- Time-based bookings with conflict detection

**Table 12: KitchenTimeSlots**
- Meal scheduling with special diets as JSON

**Table 13: DailyTasks**
- Cleaning and maintenance tracking

**Table 14-16: Finance (income, expenses, outsourced)**
- Financial record keeping

### Real-time Subscriptions

Enable real-time updates so all devices see changes instantly:

```text
Tables with realtime enabled:
├── tents (status changes, cleaning updates)
├── beds (occupancy changes)
├── groups (new bookings)
├── allocations (assignment changes)
├── kitchen_time_slots (meal updates)
└── daily_tasks (task completion)
```

### Hook Modifications

Each current localStorage hook will be modified to:
1. Fetch data from database on mount
2. Subscribe to real-time changes
3. Update database instead of localStorage
4. Handle offline gracefully (queue changes)

Example transformation for `useVillageData`:
- Current: Reads/writes to localStorage
- New: Reads from Supabase, subscribes to changes, writes to Supabase

### Data Import Tool

A one-time import feature in Settings will:
1. Read existing localStorage data
2. Transform to database format
3. Insert into Supabase tables
4. Verify data integrity
5. Optionally clear localStorage after success

---

## Unchanged Functionality

The following will remain exactly the same:
- All UI components
- All page layouts
- All business logic in VillageContext
- Calendar views and calculations
- Occupancy calculations
- Group sync logic (will write to DB instead of localStorage)

---

## Files to Create

| File | Purpose |
|------|---------|
| `src/hooks/useSupabaseVillage.ts` | Database CRUD + realtime for village state |
| `src/hooks/useSupabaseGroups.ts` | Database CRUD for admin groups |
| `src/hooks/useSupabaseKitchen.ts` | Database CRUD for kitchen data |
| `src/hooks/useSupabaseAllocations.ts` | Database CRUD for allocations |
| `src/hooks/useSupabaseFinance.ts` | Database CRUD for finance data |
| `src/lib/dataImport.ts` | Import utility from localStorage |

## Files to Modify

| File | Changes |
|------|---------|
| `src/hooks/useVillageData.ts` | Replace localStorage with Supabase calls |
| `src/hooks/useAdminGroups.ts` | Replace localStorage with Supabase calls |
| `src/hooks/useKitchenData.ts` | Replace localStorage with Supabase calls |
| `src/hooks/useGroupAllocation.ts` | Replace localStorage with Supabase calls |
| `src/hooks/useAdminFinance.ts` | Replace localStorage with Supabase calls |
| `src/lib/groupSync.ts` | Update to use database instead of localStorage |
| `src/pages/Settings.tsx` | Add data import/export for database |

---

## Row Level Security (RLS)

Initial setup (before authentication):
- All tables: Public read/write access
- This allows the app to work without login initially

After authentication is added:
- Read: All authenticated users
- Write: Only authenticated users
- Admin actions: Only Owner role

---

## Risks and Mitigations

| Risk | Mitigation |
|------|------------|
| Data loss during migration | Keep localStorage as backup, import tool verifies data |
| Network latency | Optimistic updates with rollback on error |
| Real-time sync conflicts | Last-write-wins with timestamp comparison |
| Large initial load | Load minimal data first, lazy load details |

---

## Implementation Order

1. **Create database schema** (SQL migration)
2. **Seed static data** (neighborhoods, tents, beds, facilities)
3. **Create new hooks** with Supabase integration
4. **Update contexts** to use new hooks
5. **Add import tool** in Settings
6. **Test with existing localStorage data**
7. **Enable real-time** on key tables
8. **Remove localStorage fallbacks** after verification

---

## Success Criteria

- All existing data accessible across devices
- Changes visible in real-time on all connected clients
- No changes to user-facing functionality
- Export/import working with database
- Graceful handling of network issues
