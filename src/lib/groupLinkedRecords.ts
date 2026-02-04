// ============================================================
// GROUP LINKED RECORDS UTILITY
// Checks if a group has any linked data that prevents deletion
// Provides cascade delete for permanent group removal
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

/**
 * CASCADE DELETE - Permanently removes a group and ALL linked records
 * Collections cleaned:
 * 1. aharonson_allocations - VIP/neighborhood/tent allocations
 * 2. aharonson_farm_village_state.tents - tent bookings
 * 3. aharonson_farm_village_state.activityReservations - space bookings  
 * 4. aharonson_farm_village_state.neighborhoodReservations - neighborhood reservations
 * 5. aharonson_farm_kitchen_state.timeSlots - kitchen meal slots (removes group from slot)
 */
export const cascadeDeleteGroupRecords = (groupId: string, groupName: string): void => {
  console.log(`[CASCADE DELETE] Starting for group: ${groupName} (${groupId})`);

  // 1. Clean allocations
  try {
    const allocationsData = localStorage.getItem(ALLOCATIONS_STORAGE_KEY);
    if (allocationsData) {
      const allocs = JSON.parse(allocationsData) as { groupId: string }[];
      const filtered = allocs.filter(a => a.groupId !== groupId);
      localStorage.setItem(ALLOCATIONS_STORAGE_KEY, JSON.stringify(filtered));
      console.log(`[CASCADE DELETE] Removed ${allocs.length - filtered.length} allocations`);
    }
  } catch (e) {
    console.error('Error cleaning allocations:', e);
  }

  // 2. Clean village state
  try {
    const villageData = localStorage.getItem(VILLAGE_STORAGE_KEY);
    if (villageData) {
      const state = JSON.parse(villageData);
      let modified = false;

      // Clean tents - clear booking info for matching groupName
      if (state.tents) {
        Object.keys(state.tents).forEach(tentId => {
          const tent = state.tents[tentId];
          if (tent.groupName === groupName) {
            // Clear booking-related fields
            state.tents[tentId] = {
              ...tent,
              groupName: undefined,
              groupId: undefined,
              checkInDate: undefined,
              checkOutDate: undefined,
              reservedBy: undefined,
              phone: undefined,
              notes: '',
              // Keep physical tent properties
            };
            modified = true;
            console.log(`[CASCADE DELETE] Cleared tent: ${tentId}`);
          }
        });
      }

      // Clean activity reservations
      if (state.activityReservations) {
        const originalCount = Object.keys(state.activityReservations).length;
        const filtered: Record<string, any> = {};
        Object.entries(state.activityReservations).forEach(([key, res]: [string, any]) => {
          if (res.groupId !== groupId && res.reservedBy !== groupName) {
            filtered[key] = res;
          }
        });
        state.activityReservations = filtered;
        const removed = originalCount - Object.keys(filtered).length;
        if (removed > 0) {
          modified = true;
          console.log(`[CASCADE DELETE] Removed ${removed} activity reservations`);
        }
      }

      // Clean neighborhood reservations
      if (state.neighborhoodReservations) {
        const originalCount = Object.keys(state.neighborhoodReservations).length;
        const filtered: Record<string, any> = {};
        Object.entries(state.neighborhoodReservations).forEach(([key, res]: [string, any]) => {
          if (res.groupId !== groupId && res.groupName !== groupName) {
            filtered[key] = res;
          }
        });
        state.neighborhoodReservations = filtered;
        const removed = originalCount - Object.keys(filtered).length;
        if (removed > 0) {
          modified = true;
          console.log(`[CASCADE DELETE] Removed ${removed} neighborhood reservations`);
        }
      }

      if (modified) {
        localStorage.setItem(VILLAGE_STORAGE_KEY, JSON.stringify(state));
      }
    }
  } catch (e) {
    console.error('Error cleaning village state:', e);
  }

  // 3. Clean kitchen time slots - remove group from slots
  try {
    const kitchenData = localStorage.getItem(KITCHEN_STORAGE_KEY);
    if (kitchenData) {
      const state = JSON.parse(kitchenData);
      let modified = false;

      if (state.timeSlots) {
        Object.keys(state.timeSlots).forEach(slotId => {
          const slot = state.timeSlots[slotId];
          if (slot.groups && Array.isArray(slot.groups)) {
            const originalLength = slot.groups.length;
            slot.groups = slot.groups.filter((g: any) => g.name !== groupName);
            if (slot.groups.length < originalLength) {
              modified = true;
              console.log(`[CASCADE DELETE] Removed group from kitchen slot: ${slotId}`);
            }
          }
        });
      }

      if (modified) {
        localStorage.setItem(KITCHEN_STORAGE_KEY, JSON.stringify(state));
      }
    }
  } catch (e) {
    console.error('Error cleaning kitchen state:', e);
  }

  console.log(`[CASCADE DELETE] Completed for group: ${groupName}`);
};
