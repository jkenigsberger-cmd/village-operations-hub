// @refresh reset - Force full refresh when this file changes
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { 
  VillageState, 
  Neighborhood, 
  Tent, 
  Bed, 
  Facility, 
  FacilityArea, 
  ActivitySpace,
  ActivityReservation,
  FacilityReservation,
  NeighborhoodReservation,
  DailyTask,
  ActivityLogEntry,
  NeighborhoodId,
  BedStatus,
  CleaningStatus,
  WorkingStatus,
  BedType,
  TentGender,
  FacilityType,
  FacilityGender,
  ReservationType,
  DailyTaskType,
  DailyTaskStatus
} from '@/types/village';
import { generateInitialVillageState } from '@/data/initialData';

// Type mappings for database enums to application types
const mapDbBedStatus = (status: string): BedStatus => 
  status as BedStatus;

const mapDbCleaningStatus = (status: string): CleaningStatus => 
  status as CleaningStatus;

const mapDbWorkingStatus = (status: string | null): WorkingStatus | undefined => 
  status ? status as WorkingStatus : undefined;

const mapDbBedType = (type: string): BedType => 
  type as BedType;

const mapDbTentGender = (gender: string | null): TentGender | undefined => 
  gender ? gender as TentGender : undefined;

const mapDbFacilityType = (type: string): FacilityType => 
  type as FacilityType;

const mapDbFacilityGender = (gender: string): FacilityGender => 
  gender as FacilityGender;

const mapDbReservationType = (type: string): ReservationType => 
  type as ReservationType;

const mapDbTaskType = (type: string): DailyTaskType => 
  type as DailyTaskType;

const mapDbTaskStatus = (status: string): DailyTaskStatus => 
  status as DailyTaskStatus;

// Helper to generate random IDs
const generateId = () => Math.random().toString(36).substring(2, 11);

export const useSupabaseVillage = () => {
  const [state, setState] = useState<VillageState | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load all data from Supabase
  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Fetch all data in parallel
      const [
        neighborhoodsRes,
        tentsRes,
        bedsRes,
        facilityAreasRes,
        facilitiesRes,
        activitySpacesRes,
        activityReservationsRes,
        facilityReservationsRes,
        neighborhoodReservationsRes,
        dailyTasksRes,
        activityLogRes
      ] = await Promise.all([
        supabase.from('neighborhoods').select('*'),
        supabase.from('tents').select('*'),
        supabase.from('beds').select('*'),
        supabase.from('facility_areas').select('*'),
        supabase.from('facilities').select('*'),
        supabase.from('activity_spaces').select('*'),
        supabase.from('activity_reservations').select('*'),
        supabase.from('facility_reservations').select('*'),
        supabase.from('neighborhood_reservations').select('*'),
        supabase.from('daily_tasks').select('*'),
        supabase.from('activity_log').select('*').order('timestamp', { ascending: false }).limit(200)
      ]);

      // Check if we have data
      const hasData = neighborhoodsRes.data && neighborhoodsRes.data.length > 0;

      if (!hasData) {
        // No data in database - return null to signal need for import
        setState(null);
        setIsLoading(false);
        return null;
      }

      // Transform database rows to VillageState format
      const neighborhoods: Record<string, Neighborhood> = {};
      const tents: Record<string, Tent> = {};
      const beds: Record<string, Bed> = {};
      const facilityAreas: Record<string, FacilityArea> = {};
      const facilities: Record<string, Facility> = {};
      const activitySpaces: Record<string, ActivitySpace> = {};
      const activityReservations: Record<string, ActivityReservation> = {};
      const facilityReservations: Record<string, FacilityReservation> = {};
      const neighborhoodReservations: Record<string, NeighborhoodReservation> = {};
      const dailyTasks: Record<string, DailyTask> = {};
      const activityLog: ActivityLogEntry[] = [];

      // Process neighborhoods
      neighborhoodsRes.data?.forEach(n => {
        neighborhoods[n.id] = {
          id: n.id as NeighborhoodId,
          name: n.name,
          displayName: n.display_name,
          description: n.description || undefined,
          hasDoubleTents: n.has_double_tents || false,
          isWhiteTent: n.is_white_tent || false,
          tentIds: [] // Will be populated from tents
        };
      });

      // Process beds first to group by tent
      const bedsByTent: Record<string, Bed[]> = {};
      bedsRes.data?.forEach(b => {
        const bed: Bed = {
          id: b.id,
          tentId: b.tent_id,
          label: b.label,
          type: mapDbBedType(b.bed_type),
          bunkNumber: b.bunk_number || undefined,
          status: mapDbBedStatus(b.status),
          guestName: b.guest_name || undefined
        };
        beds[b.id] = bed;
        if (!bedsByTent[b.tent_id]) bedsByTent[b.tent_id] = [];
        bedsByTent[b.tent_id].push(bed);
      });

      // Process tents and add tentIds to neighborhoods
      tentsRes.data?.forEach(t => {
        const tent: Tent = {
          id: t.id,
          code: t.code,
          neighborhoodId: t.neighborhood_id as NeighborhoodId,
          doubleTentId: t.double_tent_id || undefined,
          isAlef: t.is_alef || undefined,
          beds: bedsByTent[t.id] || [],
          groupName: t.group_name || undefined,
          peopleCount: t.people_count || undefined,
          checkInDate: t.check_in_date || undefined,
          checkOutDate: t.check_out_date || undefined,
          notes: t.notes || undefined,
          cleaningStatus: mapDbCleaningStatus(t.cleaning_status),
          cleaningAssignedTo: t.cleaning_assigned_to || undefined,
          gender: mapDbTentGender(t.gender),
          hasPrivateBathroom: t.has_private_bathroom || false,
          hasPrivateShower: t.has_private_shower || false,
          bathroomWorkingStatus: mapDbWorkingStatus(t.bathroom_working_status),
          bathroomMaintenanceNotes: t.bathroom_maintenance_notes || undefined,
          bathroomMaintenanceImage: t.bathroom_maintenance_image || undefined,
          showerWorkingStatus: mapDbWorkingStatus(t.shower_working_status),
          showerMaintenanceNotes: t.shower_maintenance_notes || undefined,
          showerMaintenanceImage: t.shower_maintenance_image || undefined,
          isAccessible: t.is_accessible || false,
          isVIP: t.is_vip || false,
          lastUpdated: t.updated_at
        };
        tents[t.id] = tent;
        
        // Add tent ID to neighborhood
        if (neighborhoods[t.neighborhood_id]) {
          neighborhoods[t.neighborhood_id].tentIds.push(t.id);
        }
      });

      // Process facility areas
      facilityAreasRes.data?.forEach(fa => {
        facilityAreas[fa.id] = {
          id: fa.id,
          name: fa.name,
          description: fa.description,
          facilityIds: [] // Will be populated from facilities
        };
      });

      // Process facilities
      facilitiesRes.data?.forEach(f => {
        facilities[f.id] = {
          id: f.id,
          areaId: f.area_id,
          label: f.label,
          type: mapDbFacilityType(f.facility_type),
          gender: mapDbFacilityGender(f.gender),
          isAccessible: f.is_accessible || false,
          cleaningStatus: mapDbCleaningStatus(f.cleaning_status),
          workingStatus: f.working_status as WorkingStatus,
          notes: f.notes || undefined,
          maintenanceImage: f.maintenance_image || undefined,
          maintenanceNotes: f.maintenance_notes || undefined,
          lastUpdated: f.updated_at
        };
        
        // Add facility ID to area
        if (facilityAreas[f.area_id]) {
          facilityAreas[f.area_id].facilityIds.push(f.id);
        }
      });

      // Process activity spaces
      activitySpacesRes.data?.forEach((as: any) => {
        activitySpaces[as.id] = {
          id: as.id,
          name: as.name,
          description: as.description || undefined,
          type: as.type || undefined,
          number: as.number ?? undefined,
          displayName: as.display_name || undefined,
          capacity: as.capacity ?? undefined,
          active: as.active ?? true,
          cleaningStatus: as.cleaning_status ? mapDbCleaningStatus(as.cleaning_status) : undefined,
          cleaningNotes: as.cleaning_notes || undefined,
          workingStatus: mapDbWorkingStatus(as.working_status),
          notes: as.notes || undefined,
          maintenanceImage: as.maintenance_image || undefined,
          maintenanceNotes: as.maintenance_notes || undefined
        };
      });

      // Process activity reservations
      activityReservationsRes.data?.forEach(ar => {
        activityReservations[ar.id] = {
          id: ar.id,
          spaceId: ar.space_id,
          date: ar.date,
          startTime: ar.start_time,
          endTime: ar.end_time,
          groupName: ar.group_name,
          notes: ar.notes || undefined,
          source: ar.source as 'manual' | 'groupSync' | undefined,
          groupId: ar.group_id || undefined,
          status: ar.status as 'confirmed' | 'conflict' | undefined,
          createdAt: ar.created_at
        };
      });

      // Process facility reservations
      facilityReservationsRes.data?.forEach(fr => {
        facilityReservations[fr.id] = {
          id: fr.id,
          facilityId: fr.facility_id,
          date: fr.date,
          startTime: fr.start_time,
          endTime: fr.end_time,
          groupName: fr.group_name,
          numberOfPeople: fr.number_of_people || undefined,
          groupColor: fr.group_color || undefined,
          notes: fr.notes || undefined,
          createdAt: fr.created_at
        };
      });

      // Process neighborhood reservations
      neighborhoodReservationsRes.data?.forEach(nr => {
        neighborhoodReservations[nr.id] = {
          id: nr.id,
          neighborhoodId: nr.neighborhood_id as NeighborhoodId,
          groupName: nr.group_name,
          checkInDate: nr.check_in_date,
          checkOutDate: nr.check_out_date,
          reservationType: mapDbReservationType(nr.reservation_type),
          tentIds: nr.tent_ids as string[] | undefined,
          tentCount: nr.tent_count || undefined,
          genderDistribution: nr.gender_distribution as { female: number; male: number; mixed: number } | undefined,
          totalBeds: nr.total_beds || undefined,
          totalPeople: nr.total_people || undefined,
          contactName: nr.contact_name || undefined,
          contactPhone: nr.contact_phone || undefined,
          notes: nr.notes || undefined,
          createdAt: nr.created_at
        };
      });

      // Process daily tasks
      dailyTasksRes.data?.forEach(dt => {
        dailyTasks[dt.id] = {
          id: dt.id,
          date: dt.date,
          type: mapDbTaskType(dt.task_type),
          title: dt.title,
          description: dt.description || undefined,
          entityType: dt.entity_type as 'TENT' | 'FACILITY' | 'NEIGHBORHOOD' | undefined,
          entityId: dt.entity_id || undefined,
          status: mapDbTaskStatus(dt.status),
          assignedTo: dt.assigned_to || undefined,
          maintenanceImage: dt.maintenance_image || undefined,
          facilityType: dt.facility_type as 'bathroom' | 'shower' | undefined,
          createdAt: dt.created_at,
          completedAt: dt.completed_at || undefined
        };
      });

      // Process activity log
      activityLogRes.data?.forEach(al => {
        activityLog.push({
          id: al.id,
          timestamp: al.timestamp,
          action: al.action,
          entityType: al.entity_type as ActivityLogEntry['entityType'],
          entityId: al.entity_id,
          details: al.details || ''
        });
      });

      const villageState: VillageState = {
        version: 1,
        lastModified: new Date().toISOString(),
        neighborhoods,
        tents,
        beds,
        facilityAreas,
        facilities,
        activitySpaces,
        activityReservations,
        facilityReservations,
        neighborhoodReservations,
        dailyTasks,
        activityLog
      };

      setState(villageState);
      return villageState;
    } catch (err) {
      console.error('Error loading village data from Supabase:', err);
      setError(err instanceof Error ? err.message : 'Failed to load data');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Set up realtime subscriptions
  useEffect(() => {
    const channels = [
      supabase.channel('tents-changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'tents' }, () => loadData()),
      supabase.channel('beds-changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'beds' }, () => loadData()),
      supabase.channel('daily-tasks-changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'daily_tasks' }, () => loadData()),
      supabase.channel('neighborhood-reservations-changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'neighborhood_reservations' }, () => loadData()),
      supabase.channel('activity-reservations-changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'activity_reservations' }, () => loadData()),
      supabase.channel('facility-reservations-changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'facility_reservations' }, () => loadData()),
      supabase.channel('facilities-changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'facilities' }, () => loadData()),
      supabase.channel('activity-spaces-changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'activity_spaces' }, () => loadData())
    ];

    channels.forEach(channel => channel.subscribe());

    return () => {
      channels.forEach(channel => supabase.removeChannel(channel));
    };
  }, [loadData]);

  // Update a tent
  const updateTent = useCallback(async (tentId: string, updates: Partial<Tent>) => {
    const dbUpdates: Record<string, unknown> = {};
    
    if (updates.groupName !== undefined) dbUpdates.group_name = updates.groupName || null;
    if (updates.peopleCount !== undefined) dbUpdates.people_count = updates.peopleCount || null;
    if (updates.checkInDate !== undefined) dbUpdates.check_in_date = updates.checkInDate || null;
    if (updates.checkOutDate !== undefined) dbUpdates.check_out_date = updates.checkOutDate || null;
    if (updates.notes !== undefined) dbUpdates.notes = updates.notes || null;
    if (updates.cleaningStatus !== undefined) dbUpdates.cleaning_status = updates.cleaningStatus;
    if (updates.cleaningAssignedTo !== undefined) dbUpdates.cleaning_assigned_to = updates.cleaningAssignedTo || null;
    if (updates.gender !== undefined) dbUpdates.gender = updates.gender || null;
    if (updates.hasPrivateBathroom !== undefined) dbUpdates.has_private_bathroom = updates.hasPrivateBathroom;
    if (updates.hasPrivateShower !== undefined) dbUpdates.has_private_shower = updates.hasPrivateShower;
    if (updates.bathroomWorkingStatus !== undefined) dbUpdates.bathroom_working_status = updates.bathroomWorkingStatus || null;
    if (updates.bathroomMaintenanceNotes !== undefined) dbUpdates.bathroom_maintenance_notes = updates.bathroomMaintenanceNotes || null;
    if (updates.bathroomMaintenanceImage !== undefined) dbUpdates.bathroom_maintenance_image = updates.bathroomMaintenanceImage || null;
    if (updates.showerWorkingStatus !== undefined) dbUpdates.shower_working_status = updates.showerWorkingStatus || null;
    if (updates.showerMaintenanceNotes !== undefined) dbUpdates.shower_maintenance_notes = updates.showerMaintenanceNotes || null;
    if (updates.showerMaintenanceImage !== undefined) dbUpdates.shower_maintenance_image = updates.showerMaintenanceImage || null;

    const { error } = await supabase.from('tents').update(dbUpdates).eq('id', tentId);
    if (error) throw error;
  }, []);

  // Update a bed
  const updateBed = useCallback(async (bedId: string, updates: Partial<Bed>) => {
    const dbUpdates: Record<string, unknown> = {};
    
    if (updates.status !== undefined) dbUpdates.status = updates.status;
    if (updates.guestName !== undefined) dbUpdates.guest_name = updates.guestName || null;

    const { error } = await supabase.from('beds').update(dbUpdates).eq('id', bedId);
    if (error) throw error;
  }, []);

  // Update a facility
  const updateFacility = useCallback(async (facilityId: string, updates: Partial<Facility>) => {
    const dbUpdates: Record<string, unknown> = {};
    
    if (updates.cleaningStatus !== undefined) dbUpdates.cleaning_status = updates.cleaningStatus;
    if (updates.workingStatus !== undefined) dbUpdates.working_status = updates.workingStatus;
    if (updates.notes !== undefined) dbUpdates.notes = updates.notes || null;
    if (updates.maintenanceImage !== undefined) dbUpdates.maintenance_image = updates.maintenanceImage || null;
    if (updates.maintenanceNotes !== undefined) dbUpdates.maintenance_notes = updates.maintenanceNotes || null;

    const { error } = await supabase.from('facilities').update(dbUpdates).eq('id', facilityId);
    if (error) throw error;
  }, []);

  // Update an activity space
  const updateActivitySpace = useCallback(async (spaceId: string, updates: Partial<ActivitySpace>) => {
    const dbUpdates: Record<string, unknown> = {};
    
    if (updates.cleaningStatus !== undefined) dbUpdates.cleaning_status = updates.cleaningStatus || null;
    if (updates.cleaningNotes !== undefined) dbUpdates.cleaning_notes = updates.cleaningNotes || null;
    if (updates.workingStatus !== undefined) dbUpdates.working_status = updates.workingStatus || null;
    if (updates.notes !== undefined) dbUpdates.notes = updates.notes || null;
    if (updates.maintenanceImage !== undefined) dbUpdates.maintenance_image = updates.maintenanceImage || null;
    if (updates.maintenanceNotes !== undefined) dbUpdates.maintenance_notes = updates.maintenanceNotes || null;

    const { error } = await supabase.from('activity_spaces').update(dbUpdates).eq('id', spaceId);
    if (error) throw error;
  }, []);

  // Add activity reservation
  const addActivityReservation = useCallback(async (reservation: Omit<ActivityReservation, 'id' | 'createdAt'>) => {
    const id = generateId();
    const { error } = await supabase.from('activity_reservations').insert({
      id,
      space_id: reservation.spaceId,
      date: reservation.date,
      start_time: reservation.startTime,
      end_time: reservation.endTime,
      group_name: reservation.groupName,
      notes: reservation.notes || null,
      source: reservation.source || 'manual',
      group_id: reservation.groupId || null,
      status: reservation.status || 'confirmed'
    });
    if (error) throw error;
    return id;
  }, []);

  // Remove activity reservation
  const removeActivityReservation = useCallback(async (reservationId: string) => {
    const { error } = await supabase.from('activity_reservations').delete().eq('id', reservationId);
    if (error) throw error;
  }, []);

  // Add facility reservation
  const addFacilityReservation = useCallback(async (reservation: Omit<FacilityReservation, 'id' | 'createdAt'>) => {
    const id = generateId();
    const { error } = await supabase.from('facility_reservations').insert({
      id,
      facility_id: reservation.facilityId,
      date: reservation.date,
      start_time: reservation.startTime,
      end_time: reservation.endTime,
      group_name: reservation.groupName,
      number_of_people: reservation.numberOfPeople || null,
      group_color: reservation.groupColor || null,
      notes: reservation.notes || null
    });
    if (error) throw error;
    return id;
  }, []);

  // Remove facility reservation
  const removeFacilityReservation = useCallback(async (reservationId: string) => {
    const { error } = await supabase.from('facility_reservations').delete().eq('id', reservationId);
    if (error) throw error;
  }, []);

  // Add neighborhood reservation
  const addNeighborhoodReservation = useCallback(async (reservation: Omit<NeighborhoodReservation, 'id' | 'createdAt'>) => {
    const id = generateId();
    const { error } = await supabase.from('neighborhood_reservations').insert({
      id,
      neighborhood_id: reservation.neighborhoodId,
      group_name: reservation.groupName,
      check_in_date: reservation.checkInDate,
      check_out_date: reservation.checkOutDate,
      reservation_type: reservation.reservationType,
      tent_ids: reservation.tentIds ? JSON.parse(JSON.stringify(reservation.tentIds)) : null,
      tent_count: reservation.tentCount || null,
      gender_distribution: reservation.genderDistribution ? JSON.parse(JSON.stringify(reservation.genderDistribution)) : null,
      total_beds: reservation.totalBeds || null,
      total_people: reservation.totalPeople || null,
      contact_name: reservation.contactName || null,
      contact_phone: reservation.contactPhone || null,
      notes: reservation.notes || null
    });
    if (error) throw error;
    return id;
  }, []);

  // Remove neighborhood reservation
  const removeNeighborhoodReservation = useCallback(async (reservationId: string) => {
    const { error } = await supabase.from('neighborhood_reservations').delete().eq('id', reservationId);
    if (error) throw error;
  }, []);

  // Add daily task
  const addDailyTask = useCallback(async (task: Omit<DailyTask, 'id' | 'createdAt'>) => {
    const id = generateId();
    const { error } = await supabase.from('daily_tasks').insert({
      id,
      date: task.date,
      task_type: task.type,
      title: task.title,
      description: task.description || null,
      entity_type: task.entityType || null,
      entity_id: task.entityId || null,
      status: task.status,
      assigned_to: task.assignedTo || null,
      maintenance_image: task.maintenanceImage || null,
      facility_type: task.facilityType || null,
      completed_at: task.completedAt || null
    });
    if (error) throw error;
    return id;
  }, []);

  // Update daily task
  const updateDailyTask = useCallback(async (taskId: string, updates: Partial<DailyTask>) => {
    const dbUpdates: Record<string, unknown> = {};
    
    if (updates.status !== undefined) dbUpdates.status = updates.status;
    if (updates.completedAt !== undefined) dbUpdates.completed_at = updates.completedAt || null;
    if (updates.assignedTo !== undefined) dbUpdates.assigned_to = updates.assignedTo || null;

    const { error } = await supabase.from('daily_tasks').update(dbUpdates).eq('id', taskId);
    if (error) throw error;
  }, []);

  // Remove daily task
  const removeDailyTask = useCallback(async (taskId: string) => {
    const { error } = await supabase.from('daily_tasks').delete().eq('id', taskId);
    if (error) throw error;
  }, []);

  // Add activity log entry
  const addLogEntry = useCallback(async (
    action: string,
    entityType: ActivityLogEntry['entityType'],
    entityId: string,
    details: string
  ) => {
    const id = generateId();
    const { error } = await supabase.from('activity_log').insert({
      id,
      action,
      entity_type: entityType,
      entity_id: entityId,
      details
    });
    if (error) console.error('Error adding log entry:', error);
  }, []);

  return {
    state,
    isLoading,
    error,
    loadData,
    updateTent,
    updateBed,
    updateFacility,
    updateActivitySpace,
    addActivityReservation,
    removeActivityReservation,
    addFacilityReservation,
    removeFacilityReservation,
    addNeighborhoodReservation,
    removeNeighborhoodReservation,
    addDailyTask,
    updateDailyTask,
    removeDailyTask,
    addLogEntry
  };
};
