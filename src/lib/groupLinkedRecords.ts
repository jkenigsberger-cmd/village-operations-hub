// ============================================================
// GROUP LINKED RECORDS UTILITY
// Checks if a group has any linked data that prevents deletion
// Provides cascade delete for permanent group removal
// Uses Supabase for all data operations
// ============================================================

import { supabase } from '@/integrations/supabase/client';

interface LinkedRecordsSummary {
  hasLinkedRecords: boolean;
  allocations: number; // VIP/neighborhood/tent allocations
  tentBookings: number; // Tents with matching groupName
  spaceBookings: number; // Activity reservations linked to group
  neighborhoodBookings: number; // Neighborhood reservations linked to group
  kitchenSlots: number; // Kitchen time slots linked to group
  total: number;
}

/**
 * Checks all Supabase tables for records linked to a groupId
 * Returns true if ANY linked data exists
 */
export const hasLinkedRecords = async (groupId: string, groupName: string): Promise<boolean> => {
  const summary = await getLinkedRecordsSummary(groupId, groupName);
  return summary.hasLinkedRecords;
};

/**
 * Returns a detailed summary of all linked records for a group (async - fetches from Supabase)
 */
export const getLinkedRecordsSummary = async (groupId: string, groupName: string): Promise<LinkedRecordsSummary> => {
  let allocations = 0;
  let tentBookings = 0;
  let spaceBookings = 0;
  let neighborhoodBookings = 0;
  let kitchenSlots = 0;

  try {
    // Fetch all counts in parallel
    const [
      allocationsRes,
      tentsRes,
      activityRes,
      neighborhoodRes,
      kitchenRes
    ] = await Promise.all([
      // 1. Count allocations for this group
      supabase.from('allocations').select('id', { count: 'exact', head: true }).eq('group_id', groupId),
      
      // 2. Count tents with this group name
      supabase.from('tents').select('id', { count: 'exact', head: true }).eq('group_name', groupName),
      
      // 3. Count activity reservations for this group
      supabase.from('activity_reservations').select('id', { count: 'exact', head: true }).or(`group_id.eq.${groupId},group_name.eq.${groupName}`),
      
      // 4. Count neighborhood reservations for this group
      supabase.from('neighborhood_reservations').select('id', { count: 'exact', head: true }).eq('group_name', groupName),
      
      // 5. Count kitchen time slots containing this group
      supabase.from('kitchen_time_slots').select('id, groups')
    ]);

    allocations = allocationsRes.count || 0;
    tentBookings = tentsRes.count || 0;
    spaceBookings = activityRes.count || 0;
    neighborhoodBookings = neighborhoodRes.count || 0;

    // Count kitchen slots that have this group in the JSON array
    if (kitchenRes.data) {
      kitchenSlots = kitchenRes.data.filter(slot => {
        if (!slot.groups || !Array.isArray(slot.groups)) return false;
        return (slot.groups as { name: string }[]).some(g => g.name === groupName);
      }).length;
    }

  } catch (e) {
    console.error('Error checking linked records:', e);
  }

  const total = allocations + tentBookings + spaceBookings + neighborhoodBookings + kitchenSlots;

  return {
    hasLinkedRecords: total > 0,
    allocations,
    tentBookings,
    spaceBookings,
    neighborhoodBookings,
    kitchenSlots,
    total,
  };
};

/**
 * Synchronous version for UI display (returns cached/empty data)
 * For accurate counts, use getLinkedRecordsSummary instead
 */
export const getLinkedRecordsDescription = (groupId: string, groupName: string): string => {
  // This is a sync wrapper - returns empty string
  // The actual check happens in the modal where we can be async
  // For now, return a generic message if we're in an edit context
  return '';
};

/**
 * CASCADE DELETE - Permanently removes ALL linked records for a group
 * Tables cleaned:
 * 1. allocations - VIP/neighborhood/tent allocations
 * 2. neighborhood_reservations - neighborhood reservations
 * 3. activity_reservations - space bookings
 * 4. kitchen_time_slots - removes group from meals (doesn't delete the meal)
 * 5. tents - clears group name, dates, and gender from tents
 */
export const cascadeDeleteGroupRecords = async (groupId: string, groupName: string): Promise<void> => {
  console.log(`[CASCADE DELETE] Starting for group: ${groupName} (${groupId})`);

  try {
    // Run all delete/update operations in parallel where possible
    const results = await Promise.allSettled([
      // 1. Delete allocations
      (async () => {
        const { error, count } = await supabase
          .from('allocations')
          .delete()
          .eq('group_id', groupId);
        if (error) throw error;
        console.log(`[CASCADE DELETE] Removed ${count || 0} allocations`);
      })(),

      // 2. Delete neighborhood reservations
      (async () => {
        const { error, count } = await supabase
          .from('neighborhood_reservations')
          .delete()
          .eq('group_name', groupName);
        if (error) throw error;
        console.log(`[CASCADE DELETE] Removed ${count || 0} neighborhood reservations`);
      })(),

      // 3. Delete activity reservations (by group_id OR group_name)
      (async () => {
        const { error, count } = await supabase
          .from('activity_reservations')
          .delete()
          .or(`group_id.eq.${groupId},group_name.eq.${groupName}`);
        if (error) throw error;
        console.log(`[CASCADE DELETE] Removed ${count || 0} activity reservations`);
      })(),

      // 4. Clear tents - set group_name, dates, gender to null
      (async () => {
        const { error, count } = await supabase
          .from('tents')
          .update({
            group_name: null,
            check_in_date: null,
            check_out_date: null,
            gender: 'MIXED'
          })
          .eq('group_name', groupName);
        if (error) throw error;
        console.log(`[CASCADE DELETE] Cleared ${count || 0} tents`);
      })(),

      // 5. Update kitchen time slots - remove group from JSON array
      (async () => {
        // First fetch all slots that might contain this group
        const { data: slots, error: fetchError } = await supabase
          .from('kitchen_time_slots')
          .select('id, groups');
        
        if (fetchError) throw fetchError;
        
        if (!slots) return;

        // Filter and update slots that have this group
        let updatedCount = 0;
        for (const slot of slots) {
          if (!slot.groups || !Array.isArray(slot.groups)) continue;
          
          const groupsArray = slot.groups as { name: string }[];
          const hasGroup = groupsArray.some(g => g.name === groupName);
          
          if (hasGroup) {
            const filteredGroups = groupsArray.filter(g => g.name !== groupName);
            const { error: updateError } = await supabase
              .from('kitchen_time_slots')
              .update({ groups: filteredGroups })
              .eq('id', slot.id);
            
            if (updateError) throw updateError;
            updatedCount++;
          }
        }
        console.log(`[CASCADE DELETE] Removed group from ${updatedCount} kitchen slots`);
      })()
    ]);

    // Log any failures
    results.forEach((result, index) => {
      if (result.status === 'rejected') {
        console.error(`[CASCADE DELETE] Operation ${index} failed:`, result.reason);
      }
    });

    console.log(`[CASCADE DELETE] Completed for group: ${groupName}`);

  } catch (e) {
    console.error('[CASCADE DELETE] Error:', e);
    throw e;
  }
};

/**
 * Get async description of linked records for display in UI
 */
export const getLinkedRecordsDescriptionAsync = async (groupId: string, groupName: string): Promise<string> => {
  const summary = await getLinkedRecordsSummary(groupId, groupName);
  
  if (!summary.hasLinkedRecords) {
    return '';
  }

  const parts: string[] = [];
  
  if (summary.allocations > 0) {
    parts.push(`${summary.allocations} שיבוצים`);
  }
  if (summary.tentBookings > 0) {
    parts.push(`${summary.tentBookings} אוהלים`);
  }
  if (summary.spaceBookings > 0) {
    parts.push(`${summary.spaceBookings} הזמנות מרחב`);
  }
  if (summary.neighborhoodBookings > 0) {
    parts.push(`${summary.neighborhoodBookings} הזמנות שכונה`);
  }
  if (summary.kitchenSlots > 0) {
    parts.push(`${summary.kitchenSlots} ארוחות`);
  }

  return parts.join(', ');
};
