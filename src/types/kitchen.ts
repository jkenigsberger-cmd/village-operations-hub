// ============================================================
// KITCHEN / MEALS DATA TYPES
// ============================================================

export type MealType = 'BREAKFAST' | 'LUNCH' | 'DINNER';

export interface SpecialDiets {
  vegetarian: number;
  vegan: number;
  glutenFree: number;
  lactoseFree: number;
  allergies: number;
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

// Hebrew labels
export const MEAL_LABELS: Record<MealType, string> = {
  BREAKFAST: 'ארוחת בוקר',
  LUNCH: 'ארוחת צהריים',
  DINNER: 'ארוחת ערב',
};

export const LOCATION_LABELS = {
  DINING_HALL: 'חדר אוכל',
  OUTSIDE: 'מחוץ לחדר אוכל',
};

export const DIET_LABELS = {
  vegetarian: '🌱 צמחוני',
  vegan: '🥬 טבעוני',
  glutenFree: '🚫 ללא גלוטן',
  lactoseFree: '🥛 ללא לקטוז',
  allergies: '🥜 אלרגיות',
  notes: '✏️ דרישות מיוחדות',
};
