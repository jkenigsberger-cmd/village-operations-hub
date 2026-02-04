// ============================================================
// GROUP LINKED RECORDS UTILITY
// Checks if a group has any linked data that prevents deletion
// ============================================================

import { ALLOCATIONS_STORAGE_KEY } from '@/types/groupAllocation';

const VILLAGE_STORAGE_KEY = 'aharonson_farm_village_state';
const KITCHEN_STORAGE_KEY = 'aharonson_farm_kitchen_state';

interface LinkedRecordsSummary {
  hasLinkedRecords: boolean;
  allocations: number; // VIP/neighborhood/tent allocations
  tentBookings: number; // Tents with matching groupName
  spaceBookings: number; // Activity reservations linked to group
  kitchenSlots: number; // Kitchen time slots linked to group
  total: number;
}

/**
 * Checks all storage collections for records linked to a groupId
 * Returns true if ANY linked data exists (safe delete is NOT possible)
 */
export const hasLinkedRecords = (groupId: string, groupName: string): boolean => {
  const summary = getLinkedRecordsSummary(groupId, groupName);
  return summary.hasLinkedRecords;
};

/**
 * Returns a detailed summary of all linked records for a group
 */
export const getLinkedRecordsSummary = (groupId: string, groupName: string): LinkedRecordsSummary => {
  let allocations = 0;
  let tentBookings = 0;
  let spaceBookings = 0;
  let kitchenSlots = 0;

  // 1. Check allocations (VIP_TENT, NEIGHBORHOOD, TENT)
  try {
    const allocationsData = localStorage.getItem(ALLOCATIONS_STORAGE_KEY);
    if (allocationsData) {
      const allocs = JSON.parse(allocationsData) as { groupId: string }[];
      allocations = allocs.filter(a => a.groupId === groupId).length;
    }
  } catch (e) {
    console.error('Error checking allocations:', e);
  }

  // 2. Check village state for tent bookings and activity reservations
  try {
    const villageData = localStorage.getItem(VILLAGE_STORAGE_KEY);
    if (villageData) {
      const state = JSON.parse(villageData);
      
      // Check tents for matching groupName
      if (state.tents) {
        Object.values(state.tents).forEach((tent: any) => {
          if (tent.groupName === groupName && (tent.checkInDate || tent.checkOutDate)) {
            tentBookings++;
          }
        });
      }

      // Check activity reservations linked to this group
      if (state.activityReservations) {
        Object.values(state.activityReservations).forEach((res: any) => {
          if (res.groupId === groupId || res.reservedBy === groupName) {
            spaceBookings++;
          }
        });
      }

      // Check neighborhood reservations linked to this group
      if (state.neighborhoodReservations) {
        Object.values(state.neighborhoodReservations).forEach((res: any) => {
          if (res.groupId === groupId || res.groupName === groupName) {
            spaceBookings++;
          }
        });
      }
    }
  } catch (e) {
    console.error('Error checking village state:', e);
  }

  // 3. Check kitchen time slots
  try {
    const kitchenData = localStorage.getItem(KITCHEN_STORAGE_KEY);
    if (kitchenData) {
      const state = JSON.parse(kitchenData);
      if (state.timeSlots) {
        Object.values(state.timeSlots).forEach((slot: any) => {
          // Check if slot has groups array with matching group name
          if (slot.groups && Array.isArray(slot.groups)) {
            const hasMatchingGroup = slot.groups.some((g: any) => g.name === groupName);
            if (hasMatchingGroup) {
              kitchenSlots++;
            }
          }
        });
      }
    }
  } catch (e) {
    console.error('Error checking kitchen state:', e);
  }

  const total = allocations + tentBookings + spaceBookings + kitchenSlots;

  return {
    hasLinkedRecords: total > 0,
    allocations,
    tentBookings,
    spaceBookings,
    kitchenSlots,
    total,
  };
};

/**
 * Returns a human-readable description of linked records in Hebrew
 */
export const getLinkedRecordsDescription = (groupId: string, groupName: string): string => {
  const summary = getLinkedRecordsSummary(groupId, groupName);
  
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
  if (summary.kitchenSlots > 0) {
    parts.push(`${summary.kitchenSlots} ארוחות`);
  }

  return parts.join(', ');
};
