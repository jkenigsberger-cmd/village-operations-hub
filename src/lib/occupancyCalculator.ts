// ============================================================
// OCCUPANCY CALCULATOR - Allocation-Based Bed Counting
// ============================================================
// 
// RULES:
// 1. Occupancy is ONLY based on actual allocations/reservations, NOT group totals
// 2. Departure date is NOT an occupied night (hotel rule: startDate <= D < endDate)
// 3. Day-use groups ("יום ללא לינה") = 0 beds always
// 4. Pending groups (no allocations) = 0 occupied beds
// ============================================================

import { parseISO, isBefore, isEqual } from 'date-fns';
import { AllocationRecord, ALLOCATIONS_STORAGE_KEY } from '@/types/groupAllocation';
import { VillageState, NeighborhoodId } from '@/types/village';

// VIP constants
const VIP_TENT_CODES = ['80', '81', '82', '83', '84', '85', '86', '87', '88', '89'];
const VIP_BEDS_PER_TENT = 3;
export const TOTAL_VIP_BEDS = VIP_TENT_CODES.length * VIP_BEDS_PER_TENT; // 30

// Regular neighborhood IDs (non-VIP)
const REGULAR_NEIGHBORHOOD_IDS: NeighborhoodId[] = ['N1', 'N2', 'N3', 'N4', 'N5', 'N6', 'N7'];

/**
 * Check if a specific night is occupied by an allocation.
 * Uses hotel rule: startDate <= night < endDate (departure excluded)
 */
export function isNightOccupied(night: Date | string, startDate: string, endDate: string): boolean {
  const nightDate = typeof night === 'string' ? parseISO(night) : night;
  const start = parseISO(startDate);
  const end = parseISO(endDate);
  
  // Night is occupied if: start <= night < end
  return (isEqual(nightDate, start) || isBefore(start, nightDate)) && isBefore(nightDate, end);
}

/**
 * Check if date ranges overlap for occupancy (respecting hotel rule).
 * A range overlaps if there exists at least one night both ranges occupy.
 */
export function dateRangesOverlapForOccupancy(
  start1: string, end1: string, 
  start2: string, end2: string
): boolean {
  const s1 = parseISO(start1);
  const e1 = parseISO(end1);
  const s2 = parseISO(start2);
  const e2 = parseISO(end2);
  
  // Ranges overlap if: max(s1, s2) < min(e1, e2)
  const maxStart = isBefore(s1, s2) ? s2 : s1;
  const minEnd = isBefore(e1, e2) ? e1 : e2;
  
  return isBefore(maxStart, minEnd);
}

/**
 * Load allocations from localStorage
 */
export function loadAllocations(): AllocationRecord[] {
  try {
    const stored = localStorage.getItem(ALLOCATIONS_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

/**
 * Calculate total physical bed capacity from village state
 */
export function getTotalPhysicalCapacity(state: VillageState | null): { total: number; vip: number; regular: number } {
  if (!state) {
    // Fallback to known totals
    return { total: 335, vip: 30, regular: 305 };
  }
  
  let vipBeds = 0;
  let regularBeds = 0;
  
  Object.values(state.tents).forEach(tent => {
    const bedCount = tent.beds.length;
    if (tent.neighborhoodId === 'VIP') {
      vipBeds += bedCount;
    } else {
      regularBeds += bedCount;
    }
  });
  
  return {
    total: vipBeds + regularBeds,
    vip: vipBeds,
    regular: regularBeds,
  };
}

/**
 * Get occupied beds for a specific date based ONLY on actual allocations.
 * Does NOT count group pax - only actual assigned allocations.
 */
export function getOccupiedBedsForDate(
  date: Date | string,
  allocations: AllocationRecord[],
  state: VillageState | null
): { total: number; vip: number; regular: number } {
  const targetDate = typeof date === 'string' ? parseISO(date) : date;
  
  let vipOccupied = 0;
  let regularOccupied = 0;
  
  // Count from allocation records
  allocations.forEach(alloc => {
    if (isNightOccupied(targetDate, alloc.dateRangeStart, alloc.dateRangeEnd)) {
      if (alloc.allocationType === 'VIP_TENT') {
        vipOccupied += alloc.bedsAssigned;
      } else {
        regularOccupied += alloc.bedsAssigned;
      }
    }
  });
  
  // Also count from direct tent bookings in village state (for reservations not in allocation records)
  if (state) {
    Object.values(state.tents).forEach(tent => {
      if (tent.checkInDate && tent.checkOutDate) {
        if (isNightOccupied(targetDate, tent.checkInDate, tent.checkOutDate)) {
          // Check if this tent is already counted via allocations
          const alreadyCounted = allocations.some(
            a => a.resourceId === tent.id && 
                 isNightOccupied(targetDate, a.dateRangeStart, a.dateRangeEnd)
          );
          
          if (!alreadyCounted) {
            const bookedBeds = tent.beds.filter(
              b => b.status === 'RESERVED' || b.status === 'OCCUPIED'
            ).length;
            
            if (tent.neighborhoodId === 'VIP') {
              vipOccupied += bookedBeds;
            } else {
              regularOccupied += bookedBeds;
            }
          }
        }
      }
    });
  }
  
  return {
    total: vipOccupied + regularOccupied,
    vip: vipOccupied,
    regular: regularOccupied,
  };
}

/**
 * Get peak occupied beds across a date range.
 * Returns the maximum occupancy for any single night in the range.
 */
export function getPeakOccupiedBedsForRange(
  startDate: string,
  endDate: string,
  allocations: AllocationRecord[],
  state: VillageState | null
): { total: number; vip: number; regular: number } {
  const start = parseISO(startDate);
  const end = parseISO(endDate);
  
  let peakTotal = 0;
  let peakVip = 0;
  let peakRegular = 0;
  
  // Check each night in the range (excluding departure date)
  const currentDate = new Date(start);
  while (isBefore(currentDate, end)) {
    const occupied = getOccupiedBedsForDate(currentDate, allocations, state);
    
    if (occupied.total > peakTotal) peakTotal = occupied.total;
    if (occupied.vip > peakVip) peakVip = occupied.vip;
    if (occupied.regular > peakRegular) peakRegular = occupied.regular;
    
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return { total: peakTotal, vip: peakVip, regular: peakRegular };
}

/**
 * Get available beds for a date range (capacity - peak occupied).
 */
export function getAvailableBedsForRange(
  startDate: string,
  endDate: string,
  allocations: AllocationRecord[],
  state: VillageState | null,
  excludeGroupId?: string
): { total: number; vip: number; regular: number } {
  const capacity = getTotalPhysicalCapacity(state);
  
  // Filter allocations to exclude the current group if specified
  const relevantAllocations = excludeGroupId 
    ? allocations.filter(a => a.groupId !== excludeGroupId)
    : allocations;
  
  const occupied = getPeakOccupiedBedsForRange(startDate, endDate, relevantAllocations, state);
  
  return {
    total: Math.max(0, capacity.total - occupied.total),
    vip: Math.max(0, capacity.vip - occupied.vip),
    regular: Math.max(0, capacity.regular - occupied.regular),
  };
}

/**
 * Get allocations for a specific group
 */
export function getGroupAllocatedBeds(
  groupId: string,
  allocations: AllocationRecord[]
): { total: number; vip: number; regular: number } {
  let vip = 0;
  let regular = 0;
  
  allocations.forEach(alloc => {
    if (alloc.groupId === groupId) {
      if (alloc.allocationType === 'VIP_TENT') {
        vip += alloc.bedsAssigned;
      } else {
        regular += alloc.bedsAssigned;
      }
    }
  });
  
  return { total: vip + regular, vip, regular };
}
