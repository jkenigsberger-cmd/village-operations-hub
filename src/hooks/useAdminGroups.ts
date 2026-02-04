import { useState, useEffect, useCallback } from 'react';
import { GroupRecord, GroupType, VIPTentConfig, ADMIN_GROUPS_STORAGE_KEY } from '@/types/adminGroups';
import { format, parseISO, isWithinInterval, isSameDay } from 'date-fns';

// Migrate legacy vipTentPlans to vipTentConfigs
const migrateVIPTentPlans = (group: GroupRecord): GroupRecord => {
  // If already has vipTentConfigs, skip migration
  if (group.vipTentConfigs && group.vipTentConfigs.length > 0) {
    return group;
  }
  
  // If has legacy vipTentPlans, migrate them
  if (group.vipTentPlans && group.vipTentPlans.length > 0) {
    const migratedConfigs: VIPTentConfig[] = group.vipTentPlans.map(plan => ({
      id: Math.random().toString(36).substring(2, 11),
      bedsPlanned: plan.bedsPlanned,
      gender: plan.gender,
      hasExtraBed: false,
      assignedTentCode: plan.tentCode, // Preserve the assignment
    }));
    
    return {
      ...group,
      vipTentConfigs: migratedConfigs,
    };
  }
  
  return group;
};

export const useAdminGroups = () => {
  const [groups, setGroups] = useState<GroupRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load groups from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(ADMIN_GROUPS_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as GroupRecord[];
        // Migrate old groups without groupType and with legacy vipTentPlans
        const migrated = parsed.map(g => {
          let updated = {
            ...g,
            groupType: g.groupType || 'לינה' as GroupType,
          };
          // Migrate vipTentPlans to vipTentConfigs
          updated = migrateVIPTentPlans(updated);
          return updated;
        });
        setGroups(migrated);
      }
    } catch (error) {
      console.error('Error loading admin groups:', error);
    }
    setIsLoading(false);
  }, []);

  // Save groups to localStorage
  const saveGroups = useCallback((newGroups: GroupRecord[]) => {
    setGroups(newGroups);
    try {
      localStorage.setItem(ADMIN_GROUPS_STORAGE_KEY, JSON.stringify(newGroups));
    } catch (error) {
      console.error('Error saving admin groups:', error);
    }
  }, []);

  // Add a new group
  const addGroup = useCallback((group: Omit<GroupRecord, 'id' | 'createdAt' | 'updatedAt'>) => {
    const now = new Date().toISOString();
    const newGroup: GroupRecord = {
      ...group,
      groupType: group.groupType || 'לינה',
      id: Math.random().toString(36).substring(2, 11),
      createdAt: now,
      updatedAt: now,
    };
    saveGroups([...groups, newGroup]);
    return newGroup;
  }, [groups, saveGroups]);

  // Update an existing group
  const updateGroup = useCallback((id: string, updates: Partial<Omit<GroupRecord, 'id' | 'createdAt'>>) => {
    const updatedGroups = groups.map(group => 
      group.id === id 
        ? { ...group, ...updates, updatedAt: new Date().toISOString() }
        : group
    );
    saveGroups(updatedGroups);
  }, [groups, saveGroups]);

  // Delete a group
  const deleteGroup = useCallback((id: string) => {
    saveGroups(groups.filter(group => group.id !== id));
  }, [groups, saveGroups]);

  // Get a single group by ID
  const getGroup = useCallback((id: string) => {
    return groups.find(group => group.id === id);
  }, [groups]);

  // Get day-use groups for a specific date
  const getDayUseGroupsForDate = useCallback((date: string) => {
    return groups.filter(group => {
      if (group.groupType !== 'יום ללא לינה') return false;
      const targetDate = parseISO(date);
      const start = parseISO(group.startDate);
      const end = parseISO(group.endDate);
      return isSameDay(targetDate, start) || 
             isSameDay(targetDate, end) || 
             isWithinInterval(targetDate, { start, end });
    });
  }, [groups]);

  // Add linked space reservation ID
  const addLinkedSpaceReservation = useCallback((groupId: string, reservationId: string) => {
    const group = groups.find(g => g.id === groupId);
    if (!group) return;
    
    const linkedIds = group.linkedSpaceReservationIds || [];
    if (!linkedIds.includes(reservationId)) {
      updateGroup(groupId, {
        linkedSpaceReservationIds: [...linkedIds, reservationId],
      });
    }
  }, [groups, updateGroup]);

  // Add linked kitchen slot ID
  const addLinkedKitchenSlot = useCallback((groupId: string, slotId: string) => {
    const group = groups.find(g => g.id === groupId);
    if (!group) return;
    
    const linkedIds = group.linkedKitchenSlotIds || [];
    if (!linkedIds.includes(slotId)) {
      updateGroup(groupId, {
        linkedKitchenSlotIds: [...linkedIds, slotId],
      });
    }
  }, [groups, updateGroup]);

  // Archive a group (set isArchived = true)
  const archiveGroup = useCallback((id: string) => {
    updateGroup(id, { isArchived: true });
  }, [updateGroup]);

  // Restore a group from archive (set isArchived = false)
  const restoreGroup = useCallback((id: string) => {
    updateGroup(id, { isArchived: false });
  }, [updateGroup]);

  // Get active (non-archived) groups
  const activeGroups = groups.filter(g => !g.isArchived);

  // Get archived groups
  const archivedGroups = groups.filter(g => g.isArchived);

  return {
    groups,
    activeGroups,
    archivedGroups,
    isLoading,
    addGroup,
    updateGroup,
    deleteGroup,
    getGroup,
    getDayUseGroupsForDate,
    addLinkedSpaceReservation,
    addLinkedKitchenSlot,
    archiveGroup,
    restoreGroup,
  };
};
