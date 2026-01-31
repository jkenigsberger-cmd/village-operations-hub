// ============================================================
// ADMIN GROUPS DATA TYPES - Group Reservations Management
// ============================================================

export type GroupStatus = 'PLANNED' | 'ON_SITE' | 'COMPLETED';
export type GroupType = 'לינה' | 'יום ללא לינה';
export type ScheduleCategory = 'MEAL' | 'ACTIVITY' | 'SPACE' | 'OTHER';

export interface ScheduleItem {
  id: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime?: string; // HH:mm (optional)
  category: ScheduleCategory;
  location: string;
  description: string;
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
  MEAL: 'ארוחה',
  ACTIVITY: 'פעילות',
  SPACE: 'מרחב',
  OTHER: 'אחר',
};

// Group type labels
export const GROUP_TYPE_LABELS: Record<GroupType, string> = {
  'לינה': 'לינה',
  'יום ללא לינה': 'פעילות יום ללא לינה',
};
