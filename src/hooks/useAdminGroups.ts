// @refresh reset - Force full refresh when this file changes to avoid HMR hook queue issues
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { GroupRecord, GroupType, GroupStatus, VIPTentConfig, MealPlanItem, ScheduleItem } from '@/types/adminGroups';
import { parseISO, isWithinInterval, isSameDay } from 'date-fns';

const generateId = () => Math.random().toString(36).substring(2, 11);

const mapDbRowToGroup = (row: any): GroupRecord => ({
  id: row.id,
  groupName: row.name,
  reservedBy: row.contact_name || '',
  contactPhone: row.contact_phone || undefined,
  groupType: (row.group_type as GroupType) || 'לינה',
  startDate: row.arrival_date,
  endDate: row.departure_date,
  pax: row.total_pax,
  staffCount: row.staff_count,
  participantCount: row.participant_count,
  vipPeoplePerTent: row.vip_people_per_tent || 3,
  remainingStaff: row.remaining_staff ?? row.staff_count,
  remainingParticipants: row.remaining_participants ?? row.participant_count,
  notes: row.notes || undefined,
  status: (row.status as GroupStatus) || 'PLANNED',
  mealsPlan: (row.meal_plan as MealPlanItem[]) || [],
  scheduleItems: (row.schedule_items as ScheduleItem[]) || [],
  vipTentConfigs: (row.vip_tent_configs as VIPTentConfig[]) || [],
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

export const useAdminGroups = () => {
  const [groups, setGroups] = useState<GroupRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase.from('groups').select('*').order('arrival_date', { ascending: true });
      if (error) throw error;
      setGroups((data || []).map(mapDbRowToGroup));
    } catch (error) {
      console.error('Error loading admin groups:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  useEffect(() => {
    const channel = supabase.channel('groups-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'groups' }, () => loadData())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [loadData]);

  const addGroup = useCallback(async (group: Omit<GroupRecord, 'id' | 'createdAt' | 'updatedAt'>) => {
    const id = generateId();
    const { error } = await supabase.from('groups').insert({
      id,
      name: group.groupName,
      arrival_date: group.startDate,
      departure_date: group.endDate,
      total_pax: group.pax,
      staff_count: group.staffCount || 0,
      participant_count: group.participantCount || (group.pax - (group.staffCount || 0)),
      vip_people_per_tent: group.vipPeoplePerTent || 3,
      remaining_staff: group.remainingStaff ?? group.staffCount,
      remaining_participants: group.remainingParticipants ?? group.participantCount,
      contact_name: group.reservedBy || null,
      contact_phone: group.contactPhone || null,
      notes: group.notes || null,
      status: group.status || 'PLANNED',
      group_type: group.groupType || 'לינה',
      meal_plan: JSON.parse(JSON.stringify(group.mealsPlan || [])),
      schedule_items: JSON.parse(JSON.stringify(group.scheduleItems || [])),
      vip_tent_configs: JSON.parse(JSON.stringify(group.vipTentConfigs || [])),
    });
    if (error) throw error;
    const now = new Date().toISOString();
    const newGroup: GroupRecord = { ...group, groupType: group.groupType || 'לינה', id, createdAt: now, updatedAt: now };
    setGroups(prev => [...prev, newGroup]);
    return newGroup;
  }, []);

  const updateGroup = useCallback(async (id: string, updates: Partial<Omit<GroupRecord, 'id' | 'createdAt'>>) => {
    const dbUpdates: Record<string, unknown> = {};
    if (updates.groupName !== undefined) dbUpdates.name = updates.groupName;
    if (updates.startDate !== undefined) dbUpdates.arrival_date = updates.startDate;
    if (updates.endDate !== undefined) dbUpdates.departure_date = updates.endDate;
    if (updates.pax !== undefined) dbUpdates.total_pax = updates.pax;
    if (updates.staffCount !== undefined) dbUpdates.staff_count = updates.staffCount;
    if (updates.participantCount !== undefined) dbUpdates.participant_count = updates.participantCount;
    if (updates.vipPeoplePerTent !== undefined) dbUpdates.vip_people_per_tent = updates.vipPeoplePerTent;
    if (updates.remainingStaff !== undefined) dbUpdates.remaining_staff = updates.remainingStaff;
    if (updates.remainingParticipants !== undefined) dbUpdates.remaining_participants = updates.remainingParticipants;
    if (updates.reservedBy !== undefined) dbUpdates.contact_name = updates.reservedBy || null;
    if (updates.contactPhone !== undefined) dbUpdates.contact_phone = updates.contactPhone || null;
    if (updates.notes !== undefined) dbUpdates.notes = updates.notes || null;
    if (updates.status !== undefined) dbUpdates.status = updates.status;
    if (updates.groupType !== undefined) dbUpdates.group_type = updates.groupType;
    if (updates.mealsPlan !== undefined) dbUpdates.meal_plan = JSON.parse(JSON.stringify(updates.mealsPlan));
    if (updates.scheduleItems !== undefined) dbUpdates.schedule_items = JSON.parse(JSON.stringify(updates.scheduleItems));
    if (updates.vipTentConfigs !== undefined) dbUpdates.vip_tent_configs = JSON.parse(JSON.stringify(updates.vipTentConfigs));

    const { error } = await supabase.from('groups').update(dbUpdates).eq('id', id);
    if (error) throw error;
    setGroups(prev => prev.map(g => g.id === id ? { ...g, ...updates, updatedAt: new Date().toISOString() } : g));
  }, []);

  const deleteGroup = useCallback(async (id: string) => {
    const { error } = await supabase.from('groups').delete().eq('id', id);
    if (error) throw error;
    setGroups(prev => prev.filter(g => g.id !== id));
  }, []);

  const getGroup = useCallback((id: string) => groups.find(g => g.id === id), [groups]);

  const getDayUseGroupsForDate = useCallback((date: string) => {
    return groups.filter(g => {
      if (g.groupType !== 'יום ללא לינה') return false;
      const targetDate = parseISO(date);
      const start = parseISO(g.startDate);
      const end = parseISO(g.endDate);
      return isSameDay(targetDate, start) || isSameDay(targetDate, end) || isWithinInterval(targetDate, { start, end });
    });
  }, [groups]);

  const addLinkedSpaceReservation = useCallback(async (groupId: string, reservationId: string) => {
    const group = groups.find(g => g.id === groupId);
    if (!group) return;
    const linkedIds = group.linkedSpaceReservationIds || [];
    if (!linkedIds.includes(reservationId)) {
      await updateGroup(groupId, { linkedSpaceReservationIds: [...linkedIds, reservationId] });
    }
  }, [groups, updateGroup]);

  const addLinkedKitchenSlot = useCallback(async (groupId: string, slotId: string) => {
    const group = groups.find(g => g.id === groupId);
    if (!group) return;
    const linkedIds = group.linkedKitchenSlotIds || [];
    if (!linkedIds.includes(slotId)) {
      await updateGroup(groupId, { linkedKitchenSlotIds: [...linkedIds, slotId] });
    }
  }, [groups, updateGroup]);

  const archiveGroup = useCallback(async (id: string) => { await updateGroup(id, { isArchived: true }); }, [updateGroup]);
  const restoreGroup = useCallback(async (id: string) => { await updateGroup(id, { isArchived: false }); }, [updateGroup]);

  const activeGroups = groups.filter(g => !g.isArchived);
  const archivedGroups = groups.filter(g => g.isArchived);

  return {
    groups, activeGroups, archivedGroups, isLoading,
    addGroup, updateGroup, deleteGroup, getGroup,
    getDayUseGroupsForDate, addLinkedSpaceReservation, addLinkedKitchenSlot, archiveGroup, restoreGroup,
  };
};
