import { useState, useEffect, useCallback, useMemo } from 'react';
import { useVillage } from '@/context/VillageContext';
import { useAdminGroups } from './useAdminGroups';
import { AllocationRecord, CapacityCheckResult, ALLOCATIONS_STORAGE_KEY } from '@/types/groupAllocation';
import { GroupRecord } from '@/types/adminGroups';
import { NeighborhoodId } from '@/types/village';
import { parseISO, isWithinInterval, isBefore, isAfter, isSameDay } from 'date-fns';

// VIP tent IDs (80-89)
const VIP_TENT_CODES = ['80', '81', '82', '83', '84', '85', '86', '87', '88', '89'];
const VIP_BEDS_PER_TENT = 3;
const TOTAL_VIP_BEDS = VIP_TENT_CODES.length * VIP_BEDS_PER_TENT; // 30

export const useGroupAllocation = () => {
  const { state } = useVillage();
  const { groups, updateGroup } = useAdminGroups();
  const [allocations, setAllocations] = useState<AllocationRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load allocations from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(ALLOCATIONS_STORAGE_KEY);
      if (stored) {
        setAllocations(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Error loading allocations:', error);
    }
    setIsLoading(false);
  }, []);

  // Save allocations to localStorage
  const saveAllocations = useCallback((newAllocations: AllocationRecord[]) => {
    setAllocations(newAllocations);
    try {
      localStorage.setItem(ALLOCATIONS_STORAGE_KEY, JSON.stringify(newAllocations));
    } catch (error) {
      console.error('Error saving allocations:', error);
    }
  }, []);

  // Helper: check if date ranges overlap
  const dateRangesOverlap = useCallback((start1: string, end1: string, start2: string, end2: string): boolean => {
    const s1 = parseISO(start1);
    const e1 = parseISO(end1);
    const s2 = parseISO(start2);
    const e2 = parseISO(end2);
    return isBefore(s1, e2) && isBefore(s2, e1);
  }, []);

  // Get VIP capacity info for a date range
  const getVIPCapacity = useCallback((startDate: string, endDate: string, excludeGroupId?: string) => {
    if (!state) return { total: TOTAL_VIP_BEDS, used: 0, available: TOTAL_VIP_BEDS };

    // Find VIP tents
    const vipNeighborhood = state.neighborhoods['VIP'];
    if (!vipNeighborhood) return { total: TOTAL_VIP_BEDS, used: 0, available: TOTAL_VIP_BEDS };

    let usedBeds = 0;

    // Check allocations for VIP tents in overlapping dates
    allocations.forEach(alloc => {
      if (alloc.allocationType === 'VIP_TENT' && dateRangesOverlap(startDate, endDate, alloc.dateRangeStart, alloc.dateRangeEnd)) {
        if (!excludeGroupId || alloc.groupId !== excludeGroupId) {
          usedBeds += alloc.bedsAssigned;
        }
      }
    });

    // Also check existing tent bookings
    vipNeighborhood.tentIds.forEach(tentId => {
      const tent = state.tents[tentId];
      if (tent && tent.checkInDate && tent.checkOutDate) {
        if (dateRangesOverlap(startDate, endDate, tent.checkInDate, tent.checkOutDate)) {
          // Check if already counted via allocation
          const alreadyCounted = allocations.some(
            a => a.resourceId === tentId && dateRangesOverlap(startDate, endDate, a.dateRangeStart, a.dateRangeEnd)
          );
          if (!alreadyCounted) {
            const bookedBeds = tent.beds.filter(b => b.status === 'RESERVED' || b.status === 'OCCUPIED').length;
            usedBeds += bookedBeds;
          }
        }
      }
    });

    return {
      total: TOTAL_VIP_BEDS,
      used: usedBeds,
      available: TOTAL_VIP_BEDS - usedBeds,
    };
  }, [state, allocations, dateRangesOverlap]);

  // Get neighborhood capacity info for a date range
  const getNeighborhoodCapacity = useCallback((startDate: string, endDate: string, excludeGroupId?: string) => {
    if (!state) return { total: 0, used: 0, available: 0, lockedNeighborhoods: [] };

    const lockedNeighborhoods: { id: string; name: string; groupName: string }[] = [];
    let totalBeds = 0;
    let usedBeds = 0;

    // Iterate through non-VIP neighborhoods
    const neighborhoodIds: NeighborhoodId[] = ['N1', 'N2', 'N3', 'N4', 'N5', 'N6', 'N7'];

    neighborhoodIds.forEach(nId => {
      const neighborhood = state.neighborhoods[nId];
      if (!neighborhood) return;

      let neighborhoodBeds = 0;
      let neighborhoodUsed = 0;
      let isLocked = false;
      let lockedBy = '';

      neighborhood.tentIds.forEach(tentId => {
        const tent = state.tents[tentId];
        if (!tent) return;

        neighborhoodBeds += tent.beds.length;

        // Check if tent has overlapping booking from another group
        if (tent.checkInDate && tent.checkOutDate && tent.groupName) {
          if (dateRangesOverlap(startDate, endDate, tent.checkInDate, tent.checkOutDate)) {
            // Find if this belongs to a different group
            const tentGroup = groups.find(g => g.groupName === tent.groupName);
            if (tentGroup && (!excludeGroupId || tentGroup.id !== excludeGroupId)) {
              isLocked = true;
              lockedBy = tent.groupName;
              neighborhoodUsed += tent.beds.length;
            }
          }
        }
      });

      // Check neighborhood-level allocations
      allocations.forEach(alloc => {
        if (alloc.allocationType === 'NEIGHBORHOOD' && alloc.resourceId === nId) {
          if (dateRangesOverlap(startDate, endDate, alloc.dateRangeStart, alloc.dateRangeEnd)) {
            if (!excludeGroupId || alloc.groupId !== excludeGroupId) {
              isLocked = true;
              const allocGroup = groups.find(g => g.id === alloc.groupId);
              lockedBy = allocGroup?.groupName || 'קבוצה אחרת';
            }
          }
        }
      });

      totalBeds += neighborhoodBeds;
      
      if (isLocked) {
        lockedNeighborhoods.push({ id: nId, name: neighborhood.displayName, groupName: lockedBy });
        usedBeds += neighborhoodBeds;
      }
    });

    return {
      total: totalBeds,
      used: usedBeds,
      available: totalBeds - usedBeds,
      lockedNeighborhoods,
    };
  }, [state, groups, allocations, dateRangesOverlap]);

  // Check capacity for a group
  const checkCapacity = useCallback((group: GroupRecord): CapacityCheckResult => {
    const staffCount = group.staffCount || 0;
    const participantCount = group.participantCount || (group.pax - staffCount);

    const vipCapacity = getVIPCapacity(group.startDate, group.endDate, group.id);
    const neighborhoodCapacity = getNeighborhoodCapacity(group.startDate, group.endDate, group.id);

    const vipShortage = Math.max(0, staffCount - vipCapacity.available);
    const participantShortage = Math.max(0, participantCount - neighborhoodCapacity.available);

    return {
      isAvailable: vipShortage === 0 && participantShortage === 0 && neighborhoodCapacity.lockedNeighborhoods.length < 7,
      vipBeds: {
        required: staffCount,
        available: vipCapacity.available,
        shortage: vipShortage,
      },
      participantBeds: {
        required: participantCount,
        available: neighborhoodCapacity.available,
        shortage: participantShortage,
      },
      lockedNeighborhoods: neighborhoodCapacity.lockedNeighborhoods,
    };
  }, [getVIPCapacity, getNeighborhoodCapacity]);

  // Get overlapping groups for a date range (for group selector dropdowns)
  const getOverlappingGroups = useCallback((startDate: string, endDate: string): GroupRecord[] => {
    return groups.filter(g => {
      if (g.groupType === 'יום ללא לינה') return false; // Day-use groups don't need allocation
      return dateRangesOverlap(startDate, endDate, g.startDate, g.endDate);
    });
  }, [groups, dateRangesOverlap]);

  // Add an allocation
  const addAllocation = useCallback((
    groupId: string,
    allocationType: AllocationRecord['allocationType'],
    resourceId: string,
    resourceLabel: string,
    bedsAssigned: number,
    dateRangeStart: string,
    dateRangeEnd: string
  ): boolean => {
    const group = groups.find(g => g.id === groupId);
    if (!group) return false;

    // Check remaining counts
    const isVIP = allocationType === 'VIP_TENT';
    const remaining = isVIP ? (group.remainingStaff || 0) : (group.remainingParticipants || 0);

    if (bedsAssigned > remaining) {
      return false; // Would go below 0
    }

    const newAllocation: AllocationRecord = {
      id: Math.random().toString(36).substring(2, 11),
      groupId,
      allocationType,
      resourceId,
      resourceLabel,
      bedsAssigned,
      dateRangeStart,
      dateRangeEnd,
      createdAt: new Date().toISOString(),
    };

    // Save allocation
    saveAllocations([...allocations, newAllocation]);

    // Update group remaining counts
    if (isVIP) {
      updateGroup(groupId, {
        remainingStaff: (group.remainingStaff || 0) - bedsAssigned,
      });
    } else {
      updateGroup(groupId, {
        remainingParticipants: (group.remainingParticipants || 0) - bedsAssigned,
      });
    }

    return true;
  }, [groups, allocations, saveAllocations, updateGroup]);

  // Remove an allocation
  const removeAllocation = useCallback((allocationId: string) => {
    const allocation = allocations.find(a => a.id === allocationId);
    if (!allocation) return;

    const group = groups.find(g => g.id === allocation.groupId);
    if (group) {
      // Restore remaining counts
      if (allocation.allocationType === 'VIP_TENT') {
        updateGroup(allocation.groupId, {
          remainingStaff: (group.remainingStaff || 0) + allocation.bedsAssigned,
        });
      } else {
        updateGroup(allocation.groupId, {
          remainingParticipants: (group.remainingParticipants || 0) + allocation.bedsAssigned,
        });
      }
    }

    saveAllocations(allocations.filter(a => a.id !== allocationId));
  }, [allocations, groups, saveAllocations, updateGroup]);

  // Get allocations for a group
  const getGroupAllocations = useCallback((groupId: string) => {
    return allocations.filter(a => a.groupId === groupId);
  }, [allocations]);

  // Check if a neighborhood is available for a group (exclusive rule)
  const isNeighborhoodAvailableForGroup = useCallback((
    neighborhoodId: NeighborhoodId,
    groupId: string,
    startDate: string,
    endDate: string
  ): { available: boolean; conflictingGroup?: string } => {
    if (!state) return { available: false };

    // Check allocations
    for (const alloc of allocations) {
      if (alloc.allocationType === 'NEIGHBORHOOD' || alloc.allocationType === 'TENT') {
        if (alloc.groupId !== groupId && dateRangesOverlap(startDate, endDate, alloc.dateRangeStart, alloc.dateRangeEnd)) {
          // Check if this allocation is for the same neighborhood
          const allocTent = state.tents[alloc.resourceId];
          if (alloc.resourceId === neighborhoodId || (allocTent && allocTent.neighborhoodId === neighborhoodId)) {
            const conflictGroup = groups.find(g => g.id === alloc.groupId);
            return { available: false, conflictingGroup: conflictGroup?.groupName || 'קבוצה אחרת' };
          }
        }
      }
    }

    // Check existing tent bookings
    const neighborhood = state.neighborhoods[neighborhoodId];
    if (neighborhood) {
      for (const tentId of neighborhood.tentIds) {
        const tent = state.tents[tentId];
        if (tent && tent.checkInDate && tent.checkOutDate && tent.groupName) {
          if (dateRangesOverlap(startDate, endDate, tent.checkInDate, tent.checkOutDate)) {
            const tentGroup = groups.find(g => g.groupName === tent.groupName);
            if (tentGroup && tentGroup.id !== groupId) {
              return { available: false, conflictingGroup: tent.groupName };
            }
          }
        }
      }
    }

    return { available: true };
  }, [state, groups, allocations, dateRangesOverlap]);

  return {
    allocations,
    isLoading,
    checkCapacity,
    getOverlappingGroups,
    addAllocation,
    removeAllocation,
    getGroupAllocations,
    isNeighborhoodAvailableForGroup,
    getVIPCapacity,
    getNeighborhoodCapacity,
  };
};
