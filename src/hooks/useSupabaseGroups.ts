// @refresh reset - Force full refresh when this file changes
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { GroupRecord, GroupType, VIPTentConfig } from '@/types/adminGroups';
import { parseISO, isWithinInterval, isSameDay } from 'date-fns';

// Helper to generate random IDs
const generateId = () => Math.random().toString(36).substring(2, 11);

export const useSupabaseGroups = () => {
  const [groups, setGroups] = useState<GroupRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load all groups from Supabase
  const loadGroups = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('groups')
        .select('*')
        .order('arrival_date', { ascending: true });

      if (fetchError) throw fetchError;

      // Transform database rows to GroupRecord format
      const groupRecords: GroupRecord[] = (data || []).map(g => ({
        id: g.id,
        groupName: g.name,
        reservedBy: g.contact_name || '',
        contactPhone: g.contact_phone || undefined,
        pax: g.total_pax,
        startDate: g.arrival_date,
        endDate: g.departure_date,
        notes: g.notes || undefined,
        scheduleItems: (g.schedule_items as unknown as GroupRecord['scheduleItems']) || [],
        status: (g.status as GroupRecord['status']) || 'PLANNED',
        groupType: 'לינה' as GroupType, // Default, can be extended
        staffCount: g.staff_count || undefined,
        participantCount: g.participant_count || undefined,
        vipPeoplePerTent: g.vip_people_per_tent || 3,
        vipTentConfigs: (g.vip_tent_configs as unknown as VIPTentConfig[]) || [],
        remainingStaff: g.remaining_staff || undefined,
        remainingParticipants: g.remaining_participants || undefined,
        mealsPlan: (g.meal_plan as unknown as GroupRecord['mealsPlan']) || undefined,
        isArchived: g.status === 'archived',
        createdAt: g.created_at,
        updatedAt: g.updated_at
      }));

      setGroups(groupRecords);
      return groupRecords;
    } catch (err) {
      console.error('Error loading groups from Supabase:', err);
      setError(err instanceof Error ? err.message : 'Failed to load groups');
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    loadGroups();
  }, [loadGroups]);

  // Set up realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel('groups-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'groups' }, () => loadGroups())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadGroups]);

  // Add a new group
  const addGroup = useCallback(async (group: Omit<GroupRecord, 'id' | 'createdAt' | 'updatedAt'>) => {
    const id = generateId();
    
    const { error: insertError } = await supabase.from('groups').insert({
      id,
      name: group.groupName,
      contact_name: group.reservedBy || null,
      contact_phone: group.contactPhone || null,
      arrival_date: group.startDate,
      departure_date: group.endDate,
      total_pax: group.pax,
      staff_count: group.staffCount || 0,
      participant_count: group.participantCount || 0,
      vip_people_per_tent: group.vipPeoplePerTent || 3,
      remaining_staff: group.remainingStaff || group.staffCount || 0,
      remaining_participants: group.remainingParticipants || group.participantCount || 0,
      notes: group.notes || null,
      status: group.status || 'confirmed',
      meal_plan: JSON.parse(JSON.stringify(group.mealsPlan || {})),
      schedule_items: JSON.parse(JSON.stringify(group.scheduleItems || [])),
      vip_tent_configs: JSON.parse(JSON.stringify(group.vipTentConfigs || []))
    });

    if (insertError) throw insertError;

    const newGroup: GroupRecord = {
      ...group,
      id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    return newGroup;
  }, []);

  // Update an existing group
  const updateGroup = useCallback(async (id: string, updates: Partial<Omit<GroupRecord, 'id' | 'createdAt'>>) => {
    const dbUpdates: Record<string, unknown> = {};
    
    if (updates.groupName !== undefined) dbUpdates.name = updates.groupName;
    if (updates.reservedBy !== undefined) dbUpdates.contact_name = updates.reservedBy || null;
    if (updates.contactPhone !== undefined) dbUpdates.contact_phone = updates.contactPhone || null;
    if (updates.pax !== undefined) dbUpdates.total_pax = updates.pax;
    if (updates.startDate !== undefined) dbUpdates.arrival_date = updates.startDate;
    if (updates.endDate !== undefined) dbUpdates.departure_date = updates.endDate;
    if (updates.notes !== undefined) dbUpdates.notes = updates.notes || null;
    if (updates.status !== undefined) dbUpdates.status = updates.status;
    if (updates.staffCount !== undefined) dbUpdates.staff_count = updates.staffCount;
    if (updates.participantCount !== undefined) dbUpdates.participant_count = updates.participantCount;
    if (updates.vipPeoplePerTent !== undefined) dbUpdates.vip_people_per_tent = updates.vipPeoplePerTent;
    if (updates.remainingStaff !== undefined) dbUpdates.remaining_staff = updates.remainingStaff;
    if (updates.remainingParticipants !== undefined) dbUpdates.remaining_participants = updates.remainingParticipants;
    if (updates.mealsPlan !== undefined) dbUpdates.meal_plan = updates.mealsPlan;
    if (updates.scheduleItems !== undefined) dbUpdates.schedule_items = updates.scheduleItems;
    if (updates.vipTentConfigs !== undefined) dbUpdates.vip_tent_configs = updates.vipTentConfigs;
    if (updates.isArchived !== undefined) dbUpdates.status = updates.isArchived ? 'archived' : 'confirmed';

    const { error: updateError } = await supabase.from('groups').update(dbUpdates).eq('id', id);
    if (updateError) throw updateError;
  }, []);

  // Delete a group
  const deleteGroup = useCallback(async (id: string) => {
    const { error: deleteError } = await supabase.from('groups').delete().eq('id', id);
    if (deleteError) throw deleteError;
  }, []);

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
  const addLinkedSpaceReservation = useCallback(async (groupId: string, reservationId: string) => {
    const group = groups.find(g => g.id === groupId);
    if (!group) return;
    
    const linkedIds = group.linkedSpaceReservationIds || [];
    if (!linkedIds.includes(reservationId)) {
      await updateGroup(groupId, {
        linkedSpaceReservationIds: [...linkedIds, reservationId],
      });
    }
  }, [groups, updateGroup]);

  // Add linked kitchen slot ID
  const addLinkedKitchenSlot = useCallback(async (groupId: string, slotId: string) => {
    const group = groups.find(g => g.id === groupId);
    if (!group) return;
    
    const linkedIds = group.linkedKitchenSlotIds || [];
    if (!linkedIds.includes(slotId)) {
      await updateGroup(groupId, {
        linkedKitchenSlotIds: [...linkedIds, slotId],
      });
    }
  }, [groups, updateGroup]);

  // Archive a group
  const archiveGroup = useCallback(async (id: string) => {
    await updateGroup(id, { isArchived: true });
  }, [updateGroup]);

  // Restore a group from archive
  const restoreGroup = useCallback(async (id: string) => {
    await updateGroup(id, { isArchived: false });
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
    error,
    loadGroups,
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
