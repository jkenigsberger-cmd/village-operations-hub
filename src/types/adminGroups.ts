// ============================================================
// ADMIN GROUPS DATA TYPES - Group Reservations Management
// ============================================================

export type GroupStatus = 'PLANNED' | 'ON_SITE' | 'COMPLETED';
export type GroupType = 'לינה' | 'יום ללא לינה';
// Updated itinerary categories: פעילות, סדנה, הרצאה, אחר
export type ScheduleCategory = 'ACTIVITY' | 'WORKSHOP' | 'LECTURE' | 'OTHER';

// Meal plan item stored inside group
export interface MealPlanItem {
  id: string;
  date: string; // YYYY-MM-DD
  mealType: 'BREAKFAST' | 'LUNCH' | 'DINNER';
  time: string; // HH:mm
  location: 'DINING_HALL' | 'OUTSIDE';
  pax: number;
  specialDiets?: {
    vegetarian: number;
    vegan: number;
    glutenFree: number;
    lactoseFree: number;
    allergiesNotes: string;
  };
}

export interface ScheduleItem {
  id: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime?: string; // HH:mm (optional)
  category: ScheduleCategory;
  location: string;
  description: string;
}

// Legacy type - kept for migration
export interface VIPTentPlan {
  tentCode: string;        // "80", "81", ..., "89"
  bedsPlanned: number;     // 1, 2, or 3
  gender?: 'female' | 'male';
}

// New simplified VIP tent configuration (no specific tent numbers)
export interface VIPTentConfig {
  id: string;              // Unique ID for this config
  bedsPlanned: number;     // Base beds: 1, 2, or 3
  hasExtraBed?: boolean;   // +1 extra bed option
  gender?: 'female' | 'male';
  assignedTentCode?: string; // Filled when assigned to specific VIP tent (80-89)
}

export interface GroupRecord {
  id: string;
  groupName: string;
  reservedBy: string;
  contactPhone?: string;
  pax: number;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  notes?: string;
  scheduleItems: ScheduleItem[];
  status: GroupStatus;
  groupType: GroupType; // לינה = lodging, יום ללא לינה = day-use
  arrivalTime?: string; // HH:mm for day-use groups
  departureTime?: string; // HH:mm for day-use groups
  // Linked IDs for day-use integrations
  linkedSpaceReservationIds?: string[]; // IDs of activity reservations
  linkedKitchenSlotIds?: string[]; // IDs of kitchen time slots
  // Staff/Participant allocation tracking
  staffCount?: number; // צוות - VIP tents
  participantCount?: number; // חניכים - auto = pax - staffCount
  vipPeoplePerTent?: number; // default 3 (fallback when vipTentConfigs empty)
  vipTentPlans?: VIPTentPlan[]; // Legacy - individual VIP tent assignments
  vipTentConfigs?: VIPTentConfig[]; // New - generic VIP tent configurations
  remainingStaff?: number; // init = staffCount
  remainingParticipants?: number; // init = participantCount
  // Meals plan stored inside group form
  mealsPlan?: MealPlanItem[];
  // Archive support
  isArchived?: boolean; // If true, group is archived and hidden by default
  createdAt: string;
  updatedAt: string;
}

// Storage key for localStorage
export const ADMIN_GROUPS_STORAGE_KEY = 'aharonson_admin_groups';

// Location options for schedule items (common spaces)
export const SCHEDULE_LOCATIONS = [
  'אוהל מועד',
  'ממ״ד 6',
  'ממ״ד 7',
  'ממ״ד 8',
  'חדר אוכל',
  'בחוץ',
  'אחר',
] as const;

// Space IDs mapping for booking integration
export const SPACE_ID_MAP: Record<string, string> = {
  'אוהל מועד': 'ohel_moed',
  'ממ״ד 6': 'mamad_6',
  'ממ״ד 7': 'mamad_7',
  'ממ״ד 8': 'mamad_8',
  'חדר אוכל': 'dining_hall',
};

// Category labels in Hebrew
export const SCHEDULE_CATEGORY_LABELS: Record<ScheduleCategory, string> = {
  ACTIVITY: 'פעילות',
  WORKSHOP: 'סדנה',
  LECTURE: 'הרצאה',
  OTHER: 'אחר',
};

// Group type labels
export const GROUP_TYPE_LABELS: Record<GroupType, string> = {
  'לינה': 'לינה',
  'יום ללא לינה': 'פעילות יום ללא לינה',
};
