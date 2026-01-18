// ============================================================
// VILLAGE DATA TYPES - Aharonson Farm Glamping Operations
// ============================================================

// Bed status cycle: FREE -> RESERVED -> OCCUPIED -> BLOCKED -> FREE
export type BedStatus = 'FREE' | 'RESERVED' | 'OCCUPIED' | 'BLOCKED';

// Cleaning states
export type CleaningStatus = 'CLEAN' | 'NEEDS_CLEANING' | 'CLEANING_IN_PROGRESS';

// Working status for facilities
export type WorkingStatus = 'WORKING' | 'BROKEN' | 'MAINTENANCE' | 'CLOSED';

// Tent overall availability
export type TentAvailability = 'AVAILABLE' | 'PARTIAL' | 'FULL' | 'BLOCKED' | 'MAINTENANCE';

// Bed types
export type BedType = 'SINGLE' | 'BUNK_TOP' | 'BUNK_BOTTOM';

// Neighborhood IDs
export type NeighborhoodId = 'N1' | 'N2' | 'N3' | 'N4' | 'N5' | 'N6' | 'N7' | 'VIP';

// ============================================================
// CORE DATA STRUCTURES
// ============================================================

export interface Bed {
  id: string;
  tentId: string;
  label: string; // e.g., "BUNK1_TOP", "BED3"
  type: BedType;
  bunkNumber?: number; // 1-4 for bunk beds
  status: BedStatus;
  guestName?: string;
}

export interface Tent {
  id: string;
  code: string; // Display code like "11 Alef", "VIP 83"
  neighborhoodId: NeighborhoodId;
  doubleTentId?: string; // For N1-N3 double tents (e.g., "11" groups "11 Alef" + "11 Bet")
  isAlef?: boolean; // For N1-N3 double tent identification
  beds: Bed[];
  groupName?: string;
  checkInDate?: string; // ISO date string
  checkOutDate?: string;
  notes?: string;
  cleaningStatus: CleaningStatus;
  hasPrivateBathroom?: boolean;
  hasPrivateShower?: boolean;
  isAccessible?: boolean;
  isVIP?: boolean;
  lastUpdated: string;
}

export interface Neighborhood {
  id: NeighborhoodId;
  name: string;
  displayName: string;
  description?: string;
  tentIds: string[];
  hasDoubleTents?: boolean; // N1, N2, N3
  isWhiteTent?: boolean; // N5, N6
}

// ============================================================
// FACILITIES
// ============================================================

export type FacilityType = 'TOILET' | 'SHOWER';
export type FacilityGender = 'UNISEX' | 'MALE' | 'FEMALE';

export interface Facility {
  id: string;
  areaId: string;
  label: string;
  type: FacilityType;
  gender: FacilityGender;
  isAccessible?: boolean;
  cleaningStatus: CleaningStatus;
  workingStatus: WorkingStatus;
  notes?: string;
  maintenanceImage?: string; // Base64 image for maintenance issues
  maintenanceNotes?: string; // Notes specifically for maintenance issues
  lastUpdated: string;
}

export interface FacilityArea {
  id: string;
  name: string;
  description: string;
  facilityIds: string[];
}

// ============================================================
// FACILITY RESERVATIONS
// ============================================================

export interface FacilityReservation {
  id: string;
  facilityId: string;
  date: string; // ISO date YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  groupName: string;
  notes?: string;
  createdAt: string;
}

// ============================================================
// ACTIVITY SPACES
// ============================================================

export interface ActivitySpace {
  id: string;
  name: string;
  description?: string;
}

export interface ActivityReservation {
  id: string;
  spaceId: string;
  date: string; // ISO date
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  groupName: string;
  notes?: string;
  createdAt: string;
}

// ============================================================
// ACTIVITY LOG
// ============================================================

export interface ActivityLogEntry {
  id: string;
  timestamp: string;
  action: string;
  entityType: 'BED' | 'TENT' | 'FACILITY' | 'ACTIVITY';
  entityId: string;
  details: string;
}

// ============================================================
// COMPLETE VILLAGE STATE
// ============================================================

export interface VillageState {
  version: number;
  lastModified: string;
  neighborhoods: Record<string, Neighborhood>;
  tents: Record<string, Tent>;
  beds: Record<string, Bed>;
  facilityAreas: Record<string, FacilityArea>;
  facilities: Record<string, Facility>;
  activitySpaces: Record<string, ActivitySpace>;
  activityReservations: Record<string, ActivityReservation>;
  facilityReservations: Record<string, FacilityReservation>;
  neighborhoodReservations: Record<string, NeighborhoodReservation>;
  dailyTasks: Record<string, DailyTask>;
  activityLog: ActivityLogEntry[];
}

// ============================================================
// HELPER TYPES
// ============================================================

export interface TentSummary {
  tentId: string;
  code: string;
  totalBeds: number;
  freeBeds: number;
  reservedBeds: number;
  occupiedBeds: number;
  blockedBeds: number;
  cleaningStatus: CleaningStatus;
  groupName?: string;
  checkInDate?: string;
  checkOutDate?: string;
  isVIP?: boolean;
  hasPrivateBathroom?: boolean;
  isAccessible?: boolean;
}

export interface NeighborhoodSummary {
  id: NeighborhoodId;
  name: string;
  displayName: string;
  totalBeds: number;
  occupiedBeds: number;
  freeBeds: number;
  dirtyTents: number;
  checkInsToday: number;
  checkOutsToday: number;
}

export interface TodaySummary {
  checkIns: TentSummary[];
  checkOuts: TentSummary[];
  tentsToCleaning: TentSummary[];
  facilitiesNeedAttention: Facility[];
}

// ============================================================
// NEIGHBORHOOD RESERVATIONS (for large groups)
// ============================================================

export interface NeighborhoodReservation {
  id: string;
  neighborhoodId: NeighborhoodId;
  groupName: string;
  checkInDate: string; // ISO date YYYY-MM-DD
  checkOutDate: string; // ISO date YYYY-MM-DD
  notes?: string;
  createdAt: string;
}

// ============================================================
// DAILY TASKS
// ============================================================

export type DailyTaskType = 'CLEANING' | 'CHECKOUT' | 'CHECKIN' | 'MAINTENANCE' | 'CUSTOM';
export type DailyTaskStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';

export interface DailyTask {
  id: string;
  date: string; // ISO date YYYY-MM-DD
  type: DailyTaskType;
  title: string;
  description?: string;
  entityType?: 'TENT' | 'FACILITY' | 'NEIGHBORHOOD';
  entityId?: string;
  status: DailyTaskStatus;
  assignedTo?: string;
  createdAt: string;
  completedAt?: string;
}
