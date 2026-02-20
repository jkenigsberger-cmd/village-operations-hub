// ============================================================
// GROUP SYNC UTILITY
// Synchronizes group data to Kitchen and Common Spaces
// Now writes directly to Supabase database (not localStorage)
// ============================================================

import { supabase } from '@/integrations/supabase/client';
import { GroupRecord, MealPlanItem, ScheduleItem, SPACE_ID_MAP } from '@/types/adminGroups';
import { MealType, SpecialDiets } from '@/types/kitchen';
import { createActivityReservationSafe, checkActivityReservationConflict } from '@/lib/reservationConflict';

// Spaces that require booking (matching SPACE_ID_MAP keys)
const BOOKABLE_SPACES = ['אוהל מועד', 'ממ״ד 1', 'ממ״ד 2', 'ממ״ד 4', 'ממ״ד 5', 'ממ״ד 6', 'ממ״ד 7', 'ממ״ד 8', 'חדר אוכל'];

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
  scheduleItemId?: string;
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
  lifeThreatening: meal.specialDiets?.lifeThreatening || 0,
  mehadrinKosher: meal.specialDiets?.mehadrinKosher || 0,
  sensitivities: meal.specialDiets?.sensitivities || 0,
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
    
    const { error: deleteKitchenError } = await supabase
      .from('kitchen_time_slots')
      .delete()
      .eq('source', 'groupSync')
      .eq('group_id', group.id);

    if (deleteKitchenError) {
      console.error('[GROUP SYNC] Error removing old kitchen slots:', deleteKitchenError);
    } else {
      console.log(`[GROUP SYNC] Removed old kitchen slots for group ${group.id}`);
    }
    
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
          source: 'groupSync',
          group_id: group.id,
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
      for (const item of bookableScheduleItems) {
        const spaceId = SPACE_ID_MAP[item.location];
        if (!spaceId) {
          console.warn(`[GROUP SYNC] No space ID mapping for: ${item.location}`);
          continue;
        }
        
        const itemEnd = item.endTime || item.startTime;
        
        // Use server-side RPC for atomic conflict detection + insert
        const rpcResult = await createActivityReservationSafe({
          spaceId,
          date: item.date,
          startTime: item.startTime,
          endTime: itemEnd,
          groupName: group.groupName,
          groupId: group.id,
          notes: item.description || undefined,
          source: 'groupSync',
          status: 'confirmed',
        });

        if (rpcResult.success) {
          result.spaceBookingsCreated++;
        } else {
          // RPC returned conflict
          result.conflicts.push({
            type: 'space',
            space: item.location,
            date: item.date,
            time: item.startTime,
            existingGroup: rpcResult.error || 'קבוצה אחרת',
            scheduleItemId: item.id,
          });
          console.warn(`[GROUP SYNC] Conflict for ${item.location} on ${item.date} at ${item.startTime}: ${rpcResult.error}`);
        }
      }

      console.log(`[GROUP SYNC] Created ${result.spaceBookingsCreated} space bookings (${result.conflicts.length} conflicts)`);
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
 * PRE-SAVE VALIDATION: Check for conflicts without saving anything.
 * Call this BEFORE saving the group to prevent phantom schedule items.
 */
export const preValidateScheduleConflicts = async (
  scheduleItems: ScheduleItem[],
  groupName: string,
  excludeGroupId?: string,
): Promise<SyncConflict[]> => {
  const conflicts: SyncConflict[] = [];

  const bookableItems = scheduleItems.filter(item => BOOKABLE_SPACES.includes(item.location));
  if (bookableItems.length === 0) return conflicts;

  // Collect unique space+date pairs to batch-fetch reservations
  const spaceIdDatePairs = new Map<string, Set<string>>();
  for (const item of bookableItems) {
    const spaceId = SPACE_ID_MAP[item.location];
    if (!spaceId) continue;
    if (!spaceIdDatePairs.has(spaceId)) spaceIdDatePairs.set(spaceId, new Set());
    spaceIdDatePairs.get(spaceId)!.add(item.date);
  }

  // Fetch all relevant existing reservations in one query per space
  const allReservations: Array<{
    space_id: string; date: string; start_time: string; end_time: string;
    group_name: string; id?: string; source?: string; group_id?: string;
  }> = [];

  for (const [spaceId, dates] of spaceIdDatePairs) {
    const { data } = await supabase
      .from('activity_reservations')
      .select('space_id, date, start_time, end_time, group_name, id, source, group_id')
      .eq('space_id', spaceId)
      .in('date', Array.from(dates));

    if (data) allReservations.push(...data);
  }

  // Check each bookable item for conflicts
  for (const item of bookableItems) {
    const spaceId = SPACE_ID_MAP[item.location];
    if (!spaceId) continue;

    const itemEnd = item.endTime || item.startTime;
    const result = checkActivityReservationConflict(
      spaceId,
      item.date,
      item.startTime,
      itemEnd,
      allReservations,
      undefined,
      excludeGroupId,
    );

    if (result.conflict) {
      conflicts.push({
        type: 'space',
        space: item.location,
        date: item.date,
        time: item.startTime,
        existingGroup: result.conflictingGroup || 'קבוצה אחרת',
        scheduleItemId: item.id,
      });
    }
  }

  return conflicts;
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

    // Remove kitchen slots for this group
    const { error: kitchenError } = await supabase
      .from('kitchen_time_slots')
      .delete()
      .eq('source', 'groupSync')
      .eq('group_id', groupId);

    if (kitchenError) {
      console.error('[GROUP SYNC] Error removing kitchen slots:', kitchenError);
    } else {
      console.log(`[GROUP SYNC] Removed kitchen slots for group ${groupId}`);
    }
  } catch (error) {
    console.error('[GROUP SYNC] Error removing synced records:', error);
  }
};
