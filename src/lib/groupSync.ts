// ============================================================
// GROUP SYNC UTILITY
// Synchronizes group data to Kitchen and Common Spaces
// Idempotent: removes old synced records, then recreates
// ============================================================

import { GroupRecord, MealPlanItem, ScheduleItem, SPACE_ID_MAP } from '@/types/adminGroups';
import { TimeSlot, MealType, SpecialDiets } from '@/types/kitchen';
import { ActivityReservation } from '@/types/village';

const VILLAGE_STORAGE_KEY = 'aharonson_farm_village_state';
const KITCHEN_STORAGE_KEY = 'aharonson_farm_kitchen_state';

// Spaces that require booking (matching SPACE_ID_MAP keys)
const BOOKABLE_SPACES = ['אוהל מועד', 'ממ״ד 6', 'ממ״ד 7', 'ממ״ד 8', 'חדר אוכל'];

export interface SyncResult {
  success: boolean;
  kitchenSlotsCreated: number;
  spaceBookingsCreated: number;
  conflicts: SyncConflict[];
}

export interface SyncConflict {
  type: 'space';
  space: string;
  date: string;
  time: string;
  existingGroup: string;
}

const generateId = () => Math.random().toString(36).substring(2, 11);

/**
 * Convert MealPlanItem special diets to kitchen SpecialDiets format
 */
const convertSpecialDiets = (meal: MealPlanItem): SpecialDiets => ({
  vegetarian: meal.specialDiets?.vegetarian || 0,
  vegan: meal.specialDiets?.vegan || 0,
  glutenFree: meal.specialDiets?.glutenFree || 0,
  lactoseFree: meal.specialDiets?.lactoseFree || 0,
  allergies: meal.specialDiets?.allergies || 0,
  notes: meal.specialDiets?.allergiesNotes || '',
});

/**
 * Check if two time ranges overlap
 */
const timeRangesOverlap = (
  start1: string,
  end1: string,
  start2: string,
  end2: string
): boolean => {
  return start1 < end2 && start2 < end1;
};

/**
 * IDEMPOTENT SYNC: Syncs group meals and schedule items to Kitchen and Spaces
 * 
 * Steps:
 * 1. Remove all existing records with source='groupSync' AND groupId=group.id
 * 2. Create new kitchen slots from mealsPlan
 * 3. Create new space bookings from scheduleItems (with conflict detection)
 */
export const syncGroupToModules = (group: GroupRecord): SyncResult => {
  console.log(`[GROUP SYNC] Starting sync for: ${group.groupName} (${group.id})`);
  
  const result: SyncResult = {
    success: true,
    kitchenSlotsCreated: 0,
    spaceBookingsCreated: 0,
    conflicts: [],
  };

  // ============================================
  // STEP 1: Remove old synced records
  // ============================================
  
  // Remove old kitchen slots for this group
  try {
    const kitchenData = localStorage.getItem(KITCHEN_STORAGE_KEY);
    if (kitchenData) {
      const state = JSON.parse(kitchenData);
      if (state.timeSlots) {
        const toRemove: string[] = [];
        Object.entries(state.timeSlots).forEach(([slotId, slot]: [string, any]) => {
          if (slot.source === 'groupSync' && slot.groupId === group.id) {
            toRemove.push(slotId);
          }
        });
        toRemove.forEach(slotId => {
          delete state.timeSlots[slotId];
        });
        if (toRemove.length > 0) {
          localStorage.setItem(KITCHEN_STORAGE_KEY, JSON.stringify(state));
          console.log(`[GROUP SYNC] Removed ${toRemove.length} old kitchen slots`);
        }
      }
    }
  } catch (e) {
    console.error('[GROUP SYNC] Error removing old kitchen slots:', e);
  }

  // Remove old space bookings for this group
  try {
    const villageData = localStorage.getItem(VILLAGE_STORAGE_KEY);
    if (villageData) {
      const state = JSON.parse(villageData);
      if (state.activityReservations) {
        const toRemove: string[] = [];
        Object.entries(state.activityReservations).forEach(([resId, res]: [string, any]) => {
          if (res.source === 'groupSync' && res.groupId === group.id) {
            toRemove.push(resId);
          }
        });
        toRemove.forEach(resId => {
          delete state.activityReservations[resId];
        });
        if (toRemove.length > 0) {
          localStorage.setItem(VILLAGE_STORAGE_KEY, JSON.stringify(state));
          console.log(`[GROUP SYNC] Removed ${toRemove.length} old space bookings`);
        }
      }
    }
  } catch (e) {
    console.error('[GROUP SYNC] Error removing old space bookings:', e);
  }

  // ============================================
  // STEP 2: Create kitchen slots from mealsPlan
  // ============================================
  
  if (group.mealsPlan && group.mealsPlan.length > 0) {
    try {
      const kitchenData = localStorage.getItem(KITCHEN_STORAGE_KEY);
      const state = kitchenData ? JSON.parse(kitchenData) : { timeSlots: {} };
      
      group.mealsPlan.forEach(meal => {
        if (meal.pax > 0) { // Only sync meals with diners
          const slotId = generateId();
          const newSlot: TimeSlot = {
            id: slotId,
            date: meal.date,
            mealType: meal.mealType as MealType,
            time: meal.time,
            location: meal.location,
            totalPax: meal.pax,
            specialDiets: convertSpecialDiets(meal),
            groups: [{ name: group.groupName, pax: meal.pax }],
            updatedAt: new Date().toISOString(),
            source: 'groupSync',
            groupId: group.id,
            groupName: group.groupName,
          };
          
          state.timeSlots[slotId] = newSlot;
          result.kitchenSlotsCreated++;
        }
      });
      
      localStorage.setItem(KITCHEN_STORAGE_KEY, JSON.stringify(state));
      console.log(`[GROUP SYNC] Created ${result.kitchenSlotsCreated} kitchen slots`);
    } catch (e) {
      console.error('[GROUP SYNC] Error creating kitchen slots:', e);
      result.success = false;
    }
  }

  // ============================================
  // STEP 3: Create space bookings from scheduleItems
  // ============================================
  
  const bookableScheduleItems = (group.scheduleItems || []).filter(item => 
    BOOKABLE_SPACES.includes(item.location)
  );

  if (bookableScheduleItems.length > 0) {
    try {
      const villageData = localStorage.getItem(VILLAGE_STORAGE_KEY);
      if (!villageData) {
        console.error('[GROUP SYNC] Village state not found');
        return result;
      }
      
      const state = JSON.parse(villageData);
      if (!state.activityReservations) {
        state.activityReservations = {};
      }
      
      bookableScheduleItems.forEach(item => {
        const spaceId = SPACE_ID_MAP[item.location];
        if (!spaceId) {
          console.warn(`[GROUP SYNC] No space ID mapping for: ${item.location}`);
          return;
        }
        
        // Check for conflicts with existing reservations (excluding our own synced ones)
        let hasConflict = false;
        let conflictingGroup = '';
        
        Object.values(state.activityReservations).forEach((res: any) => {
          // Skip our own group's reservations
          if (res.source === 'groupSync' && res.groupId === group.id) return;
          
          // Check if same space, same date, overlapping time
          if (res.spaceId === spaceId && res.date === item.date) {
            const resEnd = res.endTime || '23:59';
            const itemEnd = item.endTime || '23:59';
            
            if (timeRangesOverlap(item.startTime, itemEnd, res.startTime, resEnd)) {
              hasConflict = true;
              conflictingGroup = res.groupName || 'קבוצה אחרת';
            }
          }
        });
        
        // Create reservation (with conflict status if applicable)
        const resId = generateId();
        const newReservation: ActivityReservation = {
          id: resId,
          spaceId,
          date: item.date,
          startTime: item.startTime,
          endTime: item.endTime || item.startTime,
          groupName: group.groupName,
          notes: item.description,
          createdAt: new Date().toISOString(),
          source: 'groupSync',
          groupId: group.id,
          status: hasConflict ? 'conflict' : 'confirmed',
        };
        
        state.activityReservations[resId] = newReservation;
        result.spaceBookingsCreated++;
        
        if (hasConflict) {
          result.conflicts.push({
            type: 'space',
            space: item.location,
            date: item.date,
            time: item.startTime,
            existingGroup: conflictingGroup,
          });
        }
      });
      
      localStorage.setItem(VILLAGE_STORAGE_KEY, JSON.stringify(state));
      console.log(`[GROUP SYNC] Created ${result.spaceBookingsCreated} space bookings (${result.conflicts.length} conflicts)`);
    } catch (e) {
      console.error('[GROUP SYNC] Error creating space bookings:', e);
      result.success = false;
    }
  }

  console.log(`[GROUP SYNC] Completed for: ${group.groupName}`);
  return result;
};

/**
 * Remove all synced records for a specific group
 * Called when group is permanently deleted
 */
export const removeSyncedRecordsForGroup = (groupId: string): void => {
  console.log(`[GROUP SYNC] Removing synced records for groupId: ${groupId}`);

  // Remove kitchen slots
  try {
    const kitchenData = localStorage.getItem(KITCHEN_STORAGE_KEY);
    if (kitchenData) {
      const state = JSON.parse(kitchenData);
      if (state.timeSlots) {
        const toRemove: string[] = [];
        Object.entries(state.timeSlots).forEach(([slotId, slot]: [string, any]) => {
          if (slot.source === 'groupSync' && slot.groupId === groupId) {
            toRemove.push(slotId);
          }
        });
        toRemove.forEach(slotId => delete state.timeSlots[slotId]);
        if (toRemove.length > 0) {
          localStorage.setItem(KITCHEN_STORAGE_KEY, JSON.stringify(state));
          console.log(`[GROUP SYNC] Removed ${toRemove.length} kitchen slots`);
        }
      }
    }
  } catch (e) {
    console.error('[GROUP SYNC] Error removing kitchen slots:', e);
  }

  // Remove space bookings
  try {
    const villageData = localStorage.getItem(VILLAGE_STORAGE_KEY);
    if (villageData) {
      const state = JSON.parse(villageData);
      if (state.activityReservations) {
        const toRemove: string[] = [];
        Object.entries(state.activityReservations).forEach(([resId, res]: [string, any]) => {
          if (res.source === 'groupSync' && res.groupId === groupId) {
            toRemove.push(resId);
          }
        });
        toRemove.forEach(resId => delete state.activityReservations[resId]);
        if (toRemove.length > 0) {
          localStorage.setItem(VILLAGE_STORAGE_KEY, JSON.stringify(state));
          console.log(`[GROUP SYNC] Removed ${toRemove.length} space bookings`);
        }
      }
    }
  } catch (e) {
    console.error('[GROUP SYNC] Error removing space bookings:', e);
  }
};
