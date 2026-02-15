// @refresh reset - Force full refresh when this file changes to avoid HMR hook queue issues
import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useVillage } from '@/context/VillageContext';
import { useAdminGroups } from './useAdminGroups';
import { AllocationRecord, CapacityCheckResult } from '@/types/groupAllocation';
import { GroupRecord, VIPTentConfig } from '@/types/adminGroups';
import { NeighborhoodId, TentGender, NeighborhoodReservation } from '@/types/village';
import { parseISO, isBefore } from 'date-fns';
import { 
  dateRangesOverlapForOccupancy, 
  TOTAL_VIP_BEDS,
} from '@/lib/occupancyCalculator';
import { computeAllocationStatus, groupNeedsAllocation } from '@/lib/allocationStatus';

// VIP tent IDs (80-89)
const VIP_TENT_CODES = ['80', '81', '82', '83', '84', '85', '86', '87', '88', '89'];
const VIP_BEDS_PER_TENT = 3;

const generateId = () => Math.random().toString(36).substring(2, 11);

export const useGroupAllocation = () => {
  const { 
    state, 
    updateTentGroupName, 
    updateTentDates, 
    updateTentGender, 
    setTentReservedBeds,
    checkNeighborhoodAvailability 
  } = useVillage();
  const { groups, updateGroup } = useAdminGroups();
  const [allocations, setAllocations] = useState<AllocationRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load allocations from database
  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('allocations')
        .select('*');

      if (error) throw error;

      const loadedAllocations: AllocationRecord[] = (data || []).map(row => ({
        id: row.id,
        groupId: row.group_id,
        allocationType: row.allocation_type as AllocationRecord['allocationType'],
        resourceId: row.resource_id,
        resourceLabel: row.resource_label,
        bedsAssigned: row.beds_assigned,
        dateRangeStart: row.date_range_start,
        dateRangeEnd: row.date_range_end,
        createdAt: row.created_at,
      }));

      setAllocations(loadedAllocations);
    } catch (error) {
      console.error('Error loading allocations:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Set up realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel('allocations-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'allocations' }, () => {
        loadData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadData]);

  // Helper: check if date ranges overlap using hotel rule (departure excluded)
  const dateRangesOverlap = useCallback((start1: string, end1: string, start2: string, end2: string): boolean => {
    return dateRangesOverlapForOccupancy(start1, end1, start2, end2);
  }, []);

  // Helper: Find tent ID by code (e.g., "VIP 80")
  const findTentIdByCode = useCallback((code: string): string | undefined => {
    if (!state) return undefined;
    return Object.values(state.tents).find(t => t.code === code)?.id;
  }, [state]);

  // Get VIP capacity info for a date range (uses hotel rule: departure excluded)
  const getVIPCapacity = useCallback((startDate: string, endDate: string, excludeGroupId?: string) => {
    if (!state) return { total: TOTAL_VIP_BEDS, used: 0, available: TOTAL_VIP_BEDS };

    // Find VIP tents
    const vipNeighborhood = state.neighborhoods['VIP'];
    if (!vipNeighborhood) return { total: TOTAL_VIP_BEDS, used: 0, available: TOTAL_VIP_BEDS };

    let usedBeds = 0;

    // Check allocations for VIP tents in overlapping dates (hotel rule applied in dateRangesOverlap)
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

    // Cap usedBeds to physical capacity (never exceed max)
    usedBeds = Math.min(usedBeds, TOTAL_VIP_BEDS);

    return {
      total: TOTAL_VIP_BEDS,
      used: usedBeds,
      available: Math.max(0, TOTAL_VIP_BEDS - usedBeds),
    };
  }, [state, allocations, dateRangesOverlap]);

  // Get neighborhood capacity info for a date range (uses hotel rule: departure excluded)
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

        // Check if tent has overlapping booking from another group (hotel rule applied)
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

      // Check neighborhood-level allocations (hotel rule applied in dateRangesOverlap)
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

    // Cap usedBeds to physical capacity (never exceed max)
    usedBeds = Math.min(usedBeds, totalBeds);

    return {
      total: totalBeds,
      used: usedBeds,
      available: Math.max(0, totalBeds - usedBeds),
      lockedNeighborhoods,
    };
  }, [state, groups, allocations, dateRangesOverlap]);

  // Check capacity for a group
  const checkCapacity = useCallback((group: GroupRecord): CapacityCheckResult => {
    const staffCount = group.staffCount || 0;
    const participantCount = group.participantCount || (group.pax - staffCount);

    // Calculate VIP beds from vipTentConfigs if available
    let requiredVIPBeds = staffCount;
    if (group.vipTentConfigs && group.vipTentConfigs.length > 0) {
      requiredVIPBeds = group.vipTentConfigs.reduce((sum, config) => 
        sum + config.bedsPlanned + (config.hasExtraBed ? 1 : 0), 0
      );
    }

    const vipCapacity = getVIPCapacity(group.startDate, group.endDate, group.id);
    const neighborhoodCapacity = getNeighborhoodCapacity(group.startDate, group.endDate, group.id);

    const vipShortage = Math.max(0, requiredVIPBeds - vipCapacity.available);
    const participantShortage = Math.max(0, participantCount - neighborhoodCapacity.available);

    return {
      isAvailable: vipShortage === 0 && participantShortage === 0 && neighborhoodCapacity.lockedNeighborhoods.length < 7,
      vipBeds: {
        required: requiredVIPBeds,
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
  const addAllocation = useCallback(async (
    groupId: string,
    allocationType: AllocationRecord['allocationType'],
    resourceId: string,
    resourceLabel: string,
    bedsAssigned: number,
    dateRangeStart: string,
    dateRangeEnd: string
  ): Promise<boolean> => {
    const group = groups.find(g => g.id === groupId);
    if (!group) return false;

    // Check remaining counts
    const isVIP = allocationType === 'VIP_TENT';
    const remaining = isVIP ? (group.remainingStaff || 0) : (group.remainingParticipants || 0);

    if (bedsAssigned > remaining) {
      return false; // Would go below 0
    }

    // GOAL 3: For NEIGHBORHOOD allocations, check and create neighborhood_reservations
    if (allocationType === 'NEIGHBORHOOD') {
      // Check if neighborhood is already booked by another group for overlapping dates
      const neighborhoodId = resourceId as NeighborhoodId;
      
      // Check existing neighborhood_reservations for conflicts
      const { data: existingReservations, error: checkError } = await supabase
        .from('neighborhood_reservations')
        .select('*')
        .eq('neighborhood_id', neighborhoodId);
      
      if (checkError) {
        console.error('Error checking neighborhood reservations:', checkError);
        return false;
      }

      // Check for overlapping reservations from other groups
      const conflictingReservation = (existingReservations || []).find(res => {
        // Skip reservations for this group
        if (res.group_name === group.groupName) return false;
        
        // Check date overlap using hotel rule
        return dateRangesOverlapForOccupancy(
          dateRangeStart, 
          dateRangeEnd, 
          res.check_in_date, 
          res.check_out_date
        );
      });

      if (conflictingReservation) {
        console.error('Neighborhood already booked:', conflictingReservation.group_name);
        return false; // Conflict - neighborhood booked by another group
      }

      // Create neighborhood_reservation record
      const reservationId = generateId();
      const { error: reservationError } = await supabase.from('neighborhood_reservations').insert({
        id: reservationId,
        neighborhood_id: neighborhoodId,
        group_name: group.groupName,
        check_in_date: dateRangeStart,
        check_out_date: dateRangeEnd,
        reservation_type: 'FULL_NEIGHBORHOOD',
        total_beds: bedsAssigned,
        notes: `Auto-created from allocation for group ${group.groupName}`
      });

      if (reservationError) {
        console.error('Error creating neighborhood reservation:', reservationError);
        return false;
      }
    }

    const id = generateId();
    const { error } = await supabase.from('allocations').insert({
      id,
      group_id: groupId,
      allocation_type: allocationType,
      resource_id: resourceId,
      resource_label: resourceLabel,
      beds_assigned: bedsAssigned,
      date_range_start: dateRangeStart,
      date_range_end: dateRangeEnd,
    });

    if (error) {
      console.error('Error adding allocation:', error);
      return false;
    }

    // Optimistic update
    const newAllocation: AllocationRecord = {
      id,
      groupId,
      allocationType,
      resourceId,
      resourceLabel,
      bedsAssigned,
      dateRangeStart,
      dateRangeEnd,
      createdAt: new Date().toISOString(),
    };
    setAllocations(prev => [...prev, newAllocation]);

    // Update group remaining counts
    if (isVIP) {
      await updateGroup(groupId, {
        remainingStaff: (group.remainingStaff || 0) - bedsAssigned,
      });
    } else {
      await updateGroup(groupId, {
        remainingParticipants: (group.remainingParticipants || 0) - bedsAssigned,
      });
    }

    return true;
  }, [groups, updateGroup]);

  // Remove an allocation
  const removeAllocation = useCallback(async (allocationId: string) => {
    const allocation = allocations.find(a => a.id === allocationId);
    if (!allocation) return;

    const { error } = await supabase.from('allocations').delete().eq('id', allocationId);
    if (error) {
      console.error('Error removing allocation:', error);
      return;
    }

    const group = groups.find(g => g.id === allocation.groupId);
    
    // GOAL 3: For NEIGHBORHOOD allocations, also remove the neighborhood_reservation
    if (allocation.allocationType === 'NEIGHBORHOOD' && group) {
      // Find and delete the corresponding neighborhood_reservation
      const { data: reservations } = await supabase
        .from('neighborhood_reservations')
        .select('id')
        .eq('neighborhood_id', allocation.resourceId)
        .eq('group_name', group.groupName)
        .eq('check_in_date', allocation.dateRangeStart)
        .eq('check_out_date', allocation.dateRangeEnd);
      
      if (reservations && reservations.length > 0) {
        for (const res of reservations) {
          await supabase.from('neighborhood_reservations').delete().eq('id', res.id);
        }
      }
    }
    
    if (group) {
      // Restore remaining counts
      if (allocation.allocationType === 'VIP_TENT') {
        await updateGroup(allocation.groupId, {
          remainingStaff: (group.remainingStaff || 0) + allocation.bedsAssigned,
        });
      } else {
        await updateGroup(allocation.groupId, {
          remainingParticipants: (group.remainingParticipants || 0) + allocation.bedsAssigned,
        });
      }
    }

    // Optimistic update
    setAllocations(prev => prev.filter(a => a.id !== allocationId));
  }, [allocations, groups, updateGroup]);

  // Get allocations for a group
  const getGroupAllocations = useCallback((groupId: string) => {
    return allocations.filter(a => a.groupId === groupId);
  }, [allocations]);

  // Check if a neighborhood is available for a group (exclusive rule)
  // Also checks neighborhood_reservations table for conflicts
  const isNeighborhoodAvailableForGroup = useCallback(async (
    neighborhoodId: NeighborhoodId,
    groupId: string,
    startDate: string,
    endDate: string
  ): Promise<{ available: boolean; conflictingGroup?: string }> => {
    if (!state) return { available: false };

    const group = groups.find(g => g.id === groupId);
    const groupName = group?.groupName || '';

    // GOAL 3: Check neighborhood_reservations for conflicts
    const { data: existingReservations } = await supabase
      .from('neighborhood_reservations')
      .select('*')
      .eq('neighborhood_id', neighborhoodId);

    for (const res of existingReservations || []) {
      // Primary: check if this group owns a matching allocation for this neighborhood
      const isSelfByAllocation = allocations.some(
        a => a.groupId === groupId && a.resourceId === neighborhoodId && a.allocationType === 'NEIGHBORHOOD'
      );
      if (isSelfByAllocation) continue;

      // Fallback: also skip if group_name matches (backward compat)
      if (res.group_name === groupName) continue;
      
      // Check date overlap using hotel rule
      if (dateRangesOverlapForOccupancy(startDate, endDate, res.check_in_date, res.check_out_date)) {
        return { available: false, conflictingGroup: res.group_name };
      }
    }

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

  // Pre-validate if allocation is possible
  const canAllocate = useCallback((groupId: string, beds: number, isVIP: boolean = false): { canAllocate: boolean; remaining: number; reason?: string } => {
    const group = groups.find(g => g.id === groupId);
    if (!group) {
      return { canAllocate: false, remaining: 0, reason: 'קבוצה לא נמצאה' };
    }

    const remaining = isVIP ? (group.remainingStaff || 0) : (group.remainingParticipants || 0);
    
    if (beds <= 0) {
      return { canAllocate: false, remaining, reason: 'יש לבחור לפחות מיטה אחת' };
    }
    
    if (beds > remaining) {
      return { canAllocate: false, remaining, reason: `לא ניתן לשבץ ${beds} מיטות - נשאר רק ${remaining}` };
    }

    return { canAllocate: true, remaining };
  }, [groups]);

  // Get available VIP tents for a date range with conflict detection
  const getAvailableVIPTents = useCallback((
    startDate: string, 
    endDate: string, 
    excludeGroupId?: string
  ): { tentCode: string; available: boolean; conflictingGroup?: string }[] => {
    
    // Get the current group to check for WITHIN-group conflicts
    const currentGroup = excludeGroupId ? groups.find(g => g.id === excludeGroupId) : null;
    
    return VIP_TENT_CODES.map(tentCode => {
      // FIX: Check if tent is already assigned WITHIN the current group
      if (currentGroup?.vipTentConfigs?.some(config => config.assignedTentCode === tentCode)) {
        return {
          tentCode,
          available: false,
          conflictingGroup: currentGroup.groupName + ' (כבר שובץ)'
        };
      }
      
      // Check allocations for this tent code (other groups)
      const conflictingAlloc = allocations.find(alloc => 
        alloc.allocationType === 'VIP_TENT' &&
        alloc.resourceId === tentCode &&
        alloc.groupId !== excludeGroupId &&
        dateRangesOverlap(startDate, endDate, alloc.dateRangeStart, alloc.dateRangeEnd)
      );
      
      if (conflictingAlloc) {
        const conflictGroup = groups.find(g => g.id === conflictingAlloc.groupId);
        return { 
          tentCode, 
          available: false, 
          conflictingGroup: conflictGroup?.groupName || 'קבוצה אחרת' 
        };
      }
      
      // Check village state for existing bookings
      if (state) {
        const fullTentCode = `VIP ${tentCode}`; // "VIP 80"
        const actualTentId = findTentIdByCode(fullTentCode);
        const tent = actualTentId ? state.tents[actualTentId] : null;
        if (tent && tent.checkInDate && tent.checkOutDate && tent.groupName) {
          if (dateRangesOverlap(startDate, endDate, tent.checkInDate, tent.checkOutDate)) {
            const tentGroup = groups.find(g => g.groupName === tent.groupName);
            if (!excludeGroupId || tentGroup?.id !== excludeGroupId) {
              return { 
                tentCode, 
                available: false, 
                conflictingGroup: tent.groupName 
              };
            }
          }
        }
      }
      
      // Check if tent is already assigned in another group's vipTentConfigs
      const conflictingGroup = groups.find(g => {
        if (excludeGroupId && g.id === excludeGroupId) return false;
        if (!g.vipTentConfigs || g.vipTentConfigs.length === 0) return false;
        if (!dateRangesOverlap(startDate, endDate, g.startDate, g.endDate)) return false;
        return g.vipTentConfigs.some(config => config.assignedTentCode === tentCode);
      });

      if (conflictingGroup) {
        return {
          tentCode,
          available: false,
          conflictingGroup: conflictingGroup.groupName
        };
      }
      
      return { tentCode, available: true };
    });
  }, [allocations, groups, state, dateRangesOverlap, findTentIdByCode]);

  // Get unassigned VIP configs for a group (configs without assignedTentCode)
  const getUnassignedVIPConfigs = useCallback((groupId: string): VIPTentConfig[] => {
    const group = groups.find(g => g.id === groupId);
    if (!group || !group.vipTentConfigs) return [];
    return group.vipTentConfigs.filter(config => !config.assignedTentCode);
  }, [groups]);

  // Assign a VIP config to a specific tent code
  const assignVIPConfig = useCallback(async (
    groupId: string, 
    configId: string, 
    tentCode: string
  ): Promise<boolean> => {
    const group = groups.find(g => g.id === groupId);
    if (!group || !group.vipTentConfigs) return false;
    
    // Find the config being assigned
    const configToAssign = group.vipTentConfigs.find(c => c.id === configId);
    if (!configToAssign) return false;
    
    // Check if tent is available
    const availability = getAvailableVIPTents(group.startDate, group.endDate, groupId);
    const tentAvailable = availability.find(t => t.tentCode === tentCode)?.available;
    if (!tentAvailable) return false;

    // Calculate beds being assigned
    const bedsBeingAssigned = configToAssign.bedsPlanned + (configToAssign.hasExtraBed ? 1 : 0);
    
    // Dynamic check: compute remaining staff from actual assigned configs (source of truth)
    const alreadyAssignedBeds = group.vipTentConfigs
      .filter(c => c.assignedTentCode && c.id !== configId) // exclude the one being assigned now
      .reduce((sum, c) => sum + c.bedsPlanned + (c.hasExtraBed ? 1 : 0), 0);
    const staffCount = group.staffCount ?? 0;
    const dynamicRemaining = staffCount - alreadyAssignedBeds;
    
    if (bedsBeingAssigned > dynamicRemaining) {
      console.warn(`Not enough remaining staff for VIP assignment: need ${bedsBeingAssigned}, have ${dynamicRemaining} (staffCount=${staffCount}, alreadyAssigned=${alreadyAssignedBeds})`);
      return false;
    }

    // Update the config with the assigned tent code
    const updatedConfigs = group.vipTentConfigs.map(config =>
      config.id === configId ? { ...config, assignedTentCode: tentCode } : config
    );

    // Compute remainingStaff from source of truth after assignment
    const newRemainingStaff = dynamicRemaining - bedsBeingAssigned;

    await updateGroup(groupId, { 
      vipTentConfigs: updatedConfigs,
      remainingStaff: newRemainingStaff,
    });
    
    // SYNC TO VILLAGE STATE: Update the physical tent with group info
    const fullTentCode = `VIP ${tentCode}`; // e.g., "VIP 80"
    const actualTentId = findTentIdByCode(fullTentCode);
    if (actualTentId) {
      updateTentGroupName(actualTentId, group.groupName);
      updateTentDates(actualTentId, group.startDate, group.endDate);
      if (configToAssign.gender) {
        const villageGender: TentGender = configToAssign.gender === 'male' ? 'MALE' : 
                                           configToAssign.gender === 'female' ? 'FEMALE' : 'MIXED';
        updateTentGender(actualTentId, villageGender);
      }
      // Mark beds as RESERVED
      const tent = state?.tents[actualTentId];
      const maxBeds = tent?.beds.length || 3;
      setTentReservedBeds(actualTentId, Math.min(bedsBeingAssigned, maxBeds));
    }
    
    return true;
  }, [groups, updateGroup, getAvailableVIPTents, updateTentGroupName, updateTentDates, updateTentGender, setTentReservedBeds, findTentIdByCode, state]);

  // Unassign a VIP config from its tent code
  const unassignVIPConfig = useCallback(async (groupId: string, configId: string): Promise<boolean> => {
    const group = groups.find(g => g.id === groupId);
    if (!group || !group.vipTentConfigs) return false;

    // Find the config being unassigned
    const configToUnassign = group.vipTentConfigs.find(c => c.id === configId);
    if (!configToUnassign || !configToUnassign.assignedTentCode) return false;

    // Store tentCode before clearing it
    const tentCode = configToUnassign.assignedTentCode;

    // Calculate beds being freed (to restore remainingStaff)
    const bedsBeingFreed = configToUnassign.bedsPlanned + (configToUnassign.hasExtraBed ? 1 : 0);

    const updatedConfigs = group.vipTentConfigs.map(config =>
      config.id === configId ? { ...config, assignedTentCode: undefined } : config
    );

    // Recalculate remainingStaff from source of truth after unassignment
    const staffCount = group.staffCount ?? 0;
    const remainingAssignedBeds = updatedConfigs
      .filter(c => c.assignedTentCode)
      .reduce((sum, c) => sum + c.bedsPlanned + (c.hasExtraBed ? 1 : 0), 0);
    const newRemainingStaff = staffCount - remainingAssignedBeds;

    await updateGroup(groupId, { 
      vipTentConfigs: updatedConfigs,
      remainingStaff: newRemainingStaff,
    });
    
    // SYNC TO VILLAGE STATE: Clear the physical tent
    const fullTentCode = `VIP ${tentCode}`; // e.g., "VIP 80"
    const actualTentId = findTentIdByCode(fullTentCode);
    if (actualTentId) {
      updateTentGroupName(actualTentId, '');
      updateTentDates(actualTentId, null, null); // null = clear dates
      updateTentGender(actualTentId, undefined);
      setTentReservedBeds(actualTentId, 0); // Free all reserved beds
    }
    
    return true;
  }, [groups, updateGroup, updateTentGroupName, updateTentDates, updateTentGender, setTentReservedBeds, findTentIdByCode]);

  // HEALING EFFECT: Sync existing VIP assignments to village state
  // This runs once when state and groups are loaded to fix any missing data
  // Use a ref to ensure it only runs once per mount
  const healingRanRef = useRef(false);
  
  useEffect(() => {
    if (!state || isLoading || groups.length === 0) return;
    if (healingRanRef.current) return; // Already ran

    let healed = false;

    groups.forEach(group => {
      if (!group.vipTentConfigs) return;

      group.vipTentConfigs.forEach(config => {
        if (!config.assignedTentCode) return;

        const fullTentCode = `VIP ${config.assignedTentCode}`;
        const actualTentId = findTentIdByCode(fullTentCode);
        if (!actualTentId) return;

        const tent = state.tents[actualTentId];
        if (!tent) return;

        // Only heal if tent appears empty or belongs to same group but missing data
        const isEmpty = !tent.groupName && !tent.checkInDate && !tent.checkOutDate;
        const isSameGroupButMissingData = tent.groupName === group.groupName && (!tent.checkInDate || !tent.checkOutDate);

        if (isEmpty || isSameGroupButMissingData) {
          console.log(`Healing VIP tent ${config.assignedTentCode} for group ${group.groupName}`);
          
          updateTentGroupName(actualTentId, group.groupName);
          updateTentDates(actualTentId, group.startDate, group.endDate);
          
          if (config.gender) {
            const villageGender: TentGender = config.gender === 'male' ? 'MALE' : 
                                               config.gender === 'female' ? 'FEMALE' : 'MIXED';
            updateTentGender(actualTentId, villageGender);
          }
          
          const bedsToReserve = config.bedsPlanned + (config.hasExtraBed ? 1 : 0);
          const maxBeds = tent.beds.length;
          setTentReservedBeds(actualTentId, Math.min(bedsToReserve, maxBeds));
          
          healed = true;
        }
      });
    });

    if (healed) {
      console.log('VIP tent healing completed');
      healingRanRef.current = true;
    }
  }, [state, isLoading, groups, findTentIdByCode, updateTentGroupName, updateTentDates, updateTentGender, setTentReservedBeds]);

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
    canAllocate,
    getAvailableVIPTents,
    getUnassignedVIPConfigs,
    assignVIPConfig,
    unassignVIPConfig,
  };
};
