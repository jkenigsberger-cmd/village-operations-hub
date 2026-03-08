// ============================================================
// KITCHEN / MEALS DATA TYPES
// ============================================================

export type MealType = 'BREAKFAST' | 'LUNCH' | 'DINNER';

export interface SpecialDiets {
  vegetarian: number;
  vegan: number;
  glutenFree: number;
  lactoseFree: number;
  lifeThreatening: number;
  mehadrinKosher: number;
  eggFree: number;
  nutFree: number;
  notes: string;
}

export interface MealGroup {
  name: string;
  pax: number;
}

export interface TimeSlot {
  id: string;
  date: string; // YYYY-MM-DD
  mealType: MealType;
  time: string; // HH:mm
  location: 'DINING_HALL' | 'OUTSIDE';
  totalPax: number;
  specialDiets: SpecialDiets;
  groups: MealGroup[];
  updatedAt: string;
  // Sync tracking fields
  source?: 'manual' | 'groupSync'; // Origin of the slot
  groupId?: string; // Linked admin group ID (for groupSync slots)
  groupName?: string; // Group name for display
}

export interface KitchenState {
  timeSlots: Record<string, TimeSlot>;
}

// ============================================================
// SINGLE SOURCE OF TRUTH — Dietary categories
// All UI components MUST import from here instead of hardcoding.
// ============================================================

export interface DietaryCategory {
  key: keyof Omit<SpecialDiets, 'notes'>;
  label: string;
  icon: string;
}

/**
 * Canonical list of the 8 dietary categories.
 * Order here = display order everywhere.
 */
export const DIETARY_CATEGORIES: DietaryCategory[] = [
  { key: 'vegetarian',      label: 'צמחוני',       icon: '🥬' },
  { key: 'vegan',           label: 'טבעוני',       icon: '🌱' },
  { key: 'glutenFree',      label: 'צליאק',        icon: '🌾' },
  { key: 'mehadrinKosher',  label: 'מהדרין',       icon: '✡️' },
  { key: 'lifeThreatening', label: 'מסכן חיים',    icon: '⚠️' },
  { key: 'nutFree',         label: 'ללא אגוזים',   icon: '🥜' },
  { key: 'eggFree',         label: 'ללא ביצים',    icon: '🥚' },
  { key: 'lactoseFree',     label: 'ללא לקטוז',    icon: '🥛' },
];

/**
 * Compute the total count of special-diet counters (excludes notes).
 */
export const getTotalSpecialCount = (diets: SpecialDiets): number =>
  DIETARY_CATEGORIES.reduce((sum, c) => sum + (diets[c.key] || 0), 0);

// Hebrew labels (kept for backward compat but now derived from DIETARY_CATEGORIES)
export const MEAL_LABELS: Record<MealType, string> = {
  BREAKFAST: 'ארוחת בוקר',
  LUNCH: 'ארוחת צהריים',
  DINNER: 'ארוחת ערב',
};

export const LOCATION_LABELS = {
  DINING_HALL: 'חדר אוכל',
  OUTSIDE: 'מחוץ לחדר אוכל',
};

// DIET_LABELS — derived from DIETARY_CATEGORIES for backward compat
export const DIET_LABELS: Record<string, string> = Object.fromEntries([
  ...DIETARY_CATEGORIES.map(c => [c.key, `${c.icon} ${c.label}`]),
  ['notes', '✏️ הערות / דרישות מיוחדות'],
]);
