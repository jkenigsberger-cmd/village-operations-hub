// ============================================================
// ADMIN GROUPS DATA TYPES - Group Reservations Management
// ============================================================

export type GroupStatus = 'PLANNED' | 'ON_SITE' | 'COMPLETED';
export type ScheduleCategory = 'MEAL' | 'ACTIVITY' | 'OTHER';

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
  createdAt: string;
  updatedAt: string;
}

// Storage key for localStorage
export const ADMIN_GROUPS_STORAGE_KEY = 'aharonson_admin_groups';

// Location options for schedule items
export const SCHEDULE_LOCATIONS = [
  'אוהל מועד',
  'ממ״ד 6',
  'ממ״ד 7',
  'ממ״ד 8',
  'חדר אוכל',
  'בחוץ',
  'אחר',
] as const;

// Category labels in Hebrew
export const SCHEDULE_CATEGORY_LABELS: Record<ScheduleCategory, string> = {
  MEAL: 'ארוחה',
  ACTIVITY: 'פעילות',
  OTHER: 'אחר',
};
