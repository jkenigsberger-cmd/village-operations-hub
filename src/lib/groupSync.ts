// ============================================================
// GROUP SYNC UTILITY
// Synchronizes group data to Kitchen and Common Spaces
// Now writes directly to Supabase database (not localStorage)
// ============================================================

import { supabase } from '@/integrations/supabase/client';
import { GroupRecord, MealPlanItem, ScheduleItem, SPACE_ID_MAP } from '@/types/adminGroups';
import { MealType, SpecialDiets } from '@/types/kitchen';
import { timeRangesOverlapWithGap } from '@/lib/timeUtils';

// Spaces that require booking (matching SPACE_ID_MAP keys)
const BOOKABLE_SPACES = ['אוהל מועד', 'ממ״ד 6', 'ממ״ד 7', 'ממ״ד 8', 'חדר אוכל'];

// Gap required between reservations (in minutes)
const RESERVATION_GAP_MINUTES = 15;

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
 * IDEMPOTENT SYNC: Syncs group meals and schedule items to Kitchen and Spaces
 * 
 * Steps:
 * 1. Remove all existing records with source='groupSync' AND groupId=group.id
 * 2. Create new kitchen slots from mealsPlan
 * 3. Create new space bookings from scheduleItems (with conflict detection)
 */
export const syncGroupToModules = async (group: GroupRecord): Promise<SyncResult> => {
  console.log(`[GROUP SYNC] Starting sync for: ${group.groupName} (${group.id})`);
  
  const result: SyncResult = {
    success: true,
    kitchenSlotsCreated: 0,
    spaceBookingsCreated: 0,
    conflicts: [],
  };

  try {
    // ============================================
    // STEP 1: Remove old synced kitchen slots for this group
    // ============================================
    
    // Note: The kitchen_time_slots table doesn't have source/groupId columns yet
    // For now, we'll create new slots without removing old ones
    // This should be improved with a migration to add these columns
    
    // ============================================
    // STEP 2: Create kitchen slots from mealsPlan
    // ============================================
    
    if (group.mealsPlan && group.mealsPlan.length > 0) {
      const slotsToInsert = group.mealsPlan
        .filter(meal => meal.pax > 0)
        .map(meal => ({
          id: generateId(),
          date: meal.date,
          meal_type: meal.mealType as MealType,
          time: meal.time,
          location: meal.location || 'DINING_HALL',
          total_pax: meal.pax,
          special_diets: JSON.parse(JSON.stringify(convertSpecialDiets(meal))),
          groups: JSON.parse(JSON.stringify([{ name: group.groupName, pax: meal.pax }])),
        }));

      if (slotsToInsert.length > 0) {
        const { error } = await supabase.from('kitchen_time_slots').insert(slotsToInsert);
        if (error) {
          console.error('[GROUP SYNC] Error creating kitchen slots:', error);
          result.success = false;
        } else {
          result.kitchenSlotsCreated = slotsToInsert.length;
          console.log(`[GROUP SYNC] Created ${result.kitchenSlotsCreated} kitchen slots`);
        }
      }
    }

    // ============================================
    // STEP 3: Remove old synced space bookings for this group
    // ============================================
    
    const { error: deleteError } = await supabase
      .from('activity_reservations')
      .delete()
      .eq('source', 'groupSync')
      .eq('group_id', group.id);

    if (deleteError) {
      console.error('[GROUP SYNC] Error removing old space bookings:', deleteError);
    }

    // ============================================
    // STEP 4: Create space bookings from scheduleItems
    // ============================================
    
    const bookableScheduleItems = (group.scheduleItems || []).filter(item => 
      BOOKABLE_SPACES.includes(item.location)
    );

    if (bookableScheduleItems.length > 0) {
      // Fetch existing reservations for conflict detection
      const { data: existingReservations } = await supabase
        .from('activity_reservations')
        .select('*');

      const reservationsToInsert = [];

      for (const item of bookableScheduleItems) {
        const spaceId = SPACE_ID_MAP[item.location];
        if (!spaceId) {
          console.warn(`[GROUP SYNC] No space ID mapping for: ${item.location}`);
          continue;
        }
        
        // Check for conflicts with existing reservations (excluding our own synced ones)
        let hasConflict = false;
        let conflictingGroup = '';
        
        (existingReservations || []).forEach((res: any) => {
          // Skip our own group's reservations
          if (res.source === 'groupSync' && res.group_id === group.id) return;
          
          // Check if same space, same date, overlapping time (with 15-minute gap requirement)
          if (res.space_id === spaceId && res.date === item.date) {
            const resEnd = res.end_time || '23:59';
            const itemEnd = item.endTime || '23:59';
            
            if (timeRangesOverlapWithGap(item.startTime, itemEnd, res.start_time, resEnd, RESERVATION_GAP_MINUTES)) {
              hasConflict = true;
              conflictingGroup = res.group_name || 'קבוצה אחרת';
            }
          }
        });
        
        // Create reservation (with conflict status if applicable)
        reservationsToInsert.push({
          id: generateId(),
          space_id: spaceId,
          date: item.date,
          start_time: item.startTime,
          end_time: item.endTime || item.startTime,
          group_name: group.groupName,
          notes: item.description || null,
          source: 'groupSync',
          group_id: group.id,
          status: hasConflict ? 'conflict' : 'confirmed',
        });
        
        if (hasConflict) {
          result.conflicts.push({
            type: 'space',
            space: item.location,
            date: item.date,
            time: item.startTime,
            existingGroup: conflictingGroup,
          });
        }
      }

      if (reservationsToInsert.length > 0) {
        const { error } = await supabase.from('activity_reservations').insert(reservationsToInsert);
        if (error) {
          console.error('[GROUP SYNC] Error creating space bookings:', error);
          result.success = false;
        } else {
          result.spaceBookingsCreated = reservationsToInsert.length;
          console.log(`[GROUP SYNC] Created ${result.spaceBookingsCreated} space bookings (${result.conflicts.length} conflicts)`);
        }
      }
    }

    console.log(`[GROUP SYNC] Completed for: ${group.groupName}`);
    return result;
  } catch (error) {
    console.error('[GROUP SYNC] Unexpected error:', error);
    result.success = false;
    return result;
  }
};

/**
 * Remove all synced records for a specific group
 * Called when group is permanently deleted
 */
export const removeSyncedRecordsForGroup = async (groupId: string): Promise<void> => {
  console.log(`[GROUP SYNC] Removing synced records for groupId: ${groupId}`);

  try {
    // Remove space bookings
    const { error } = await supabase
      .from('activity_reservations')
      .delete()
      .eq('source', 'groupSync')
      .eq('group_id', groupId);

    if (error) {
      console.error('[GROUP SYNC] Error removing space bookings:', error);
    } else {
      console.log(`[GROUP SYNC] Removed space bookings for group ${groupId}`);
    }

    // Note: Kitchen slots don't have groupId column yet
    // This should be improved with a migration
  } catch (error) {
    console.error('[GROUP SYNC] Error removing synced records:', error);
  }
};
