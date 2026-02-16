// @refresh reset - Force full refresh when this file changes to avoid HMR hook queue issues
import React, { createContext, useContext, ReactNode, useCallback } from 'react';
import { 
  VillageState, 
  Tent, 
  Bed, 
  Facility, 
  ActivityReservation,
  FacilityReservation,
  NeighborhoodReservation,
  DailyTask,
  DailyTaskStatus,
  BedStatus,
  CleaningStatus,
  WorkingStatus,
  NeighborhoodSummary,
  TentSummary,
  TodaySummary,
  NeighborhoodId,
  TentGender
} from '@/types/village';
import { useSupabaseVillage } from '@/hooks/useSupabaseVillage';
import { timeRangesOverlapWithGap } from '@/lib/timeUtils';

interface VillageContextType {
  state: VillageState | null;
  isLoading: boolean;
  
  // Bed operations
  updateBedStatus: (bedId: string, status: BedStatus) => void;
  cycleBedStatus: (bedId: string) => void;
  updateBedGuestName: (bedId: string, guestName: string) => void;
  clearBedGuest: (bedId: string) => void;
  
  // Tent operations
  updateTentCleaningStatus: (tentId: string, status: CleaningStatus, assignedTo?: string) => void;
  updateTentGroupName: (tentId: string, groupName: string) => void;
  updateTentDates: (tentId: string, checkIn?: string | null, checkOut?: string | null) => void;
  updateTentNotes: (tentId: string, notes: string) => void;
  updateTentPeopleCount: (tentId: string, count: number | undefined) => void;
  updateTentGender: (tentId: string, gender: TentGender | undefined) => void;
  setTentReservedBeds: (tentId: string, reservedCount: number) => void;
  updateTentPrivateBathroom: (tentId: string, hasPrivateBathroom: boolean) => void;
  updateTentPrivateShower: (tentId: string, hasPrivateShower: boolean) => void;
  updateTentCleaningAssignment: (tentId: string, assignedTo: string) => void;
  // VIP private facility maintenance
  reportTentFacilityIssue: (tentId: string, facilityType: 'bathroom' | 'shower', status: WorkingStatus, notes: string, image?: string) => void;
  resolveTentFacilityIssue: (tentId: string, facilityType: 'bathroom' | 'shower') => void;
  clearAllBeds: (tentId: string) => void;
  
  // Facility operations
  updateFacilityCleaningStatus: (facilityId: string, status: CleaningStatus) => void;
  updateFacilityWorkingStatus: (facilityId: string, status: WorkingStatus) => void;
  updateFacilityNotes: (facilityId: string, notes: string) => void;
  updateFacilityMaintenanceImage: (facilityId: string, image: string | undefined) => void;
  updateFacilityMaintenanceNotes: (facilityId: string, notes: string | undefined) => void;
  reportFacilityIssue: (facilityId: string, status: WorkingStatus, notes: string, image?: string) => void;
  resolveFacilityIssue: (facilityId: string) => void;
  
  // Facility reservation operations
  addFacilityReservation: (reservation: Omit<FacilityReservation, 'id' | 'createdAt'>) => boolean;
  removeFacilityReservation: (reservationId: string) => void;
  getFacilityReservations: (facilityId: string) => FacilityReservation[];
  
  // Activity operations
  addActivityReservation: (reservation: Omit<ActivityReservation, 'id' | 'createdAt'>) => boolean;
  removeActivityReservation: (reservationId: string) => void;
  updateActivitySpaceStatus: (spaceId: string, cleaningStatus?: CleaningStatus, workingStatus?: WorkingStatus, cleaningNotes?: string) => void;
  updateActivitySpaceNotes: (spaceId: string, notes: string) => void;
  reportActivitySpaceIssue: (spaceId: string, status: WorkingStatus, notes: string, image?: string) => void;
  resolveActivitySpaceIssue: (spaceId: string) => void;
  
  // Neighborhood bulk operations
  reserveNeighborhood: (reservation: Omit<NeighborhoodReservation, 'id' | 'createdAt'>) => { success: boolean; error?: string };
  reserveSpecificTents: (params: {
    neighborhoodId: NeighborhoodId;
    tentIds: string[];
    tentGenders?: Record<string, TentGender>;
    groupName: string;
    checkInDate: string;
    checkOutDate: string;
    totalPeople?: number;
    contactName?: string;
    contactPhone?: string;
    notes?: string;
  }) => { success: boolean; error?: string };
  removeNeighborhoodReservation: (reservationId: string) => void;
  getNeighborhoodReservations: (neighborhoodId: NeighborhoodId) => NeighborhoodReservation[];
  checkNeighborhoodAvailability: (neighborhoodId: NeighborhoodId, checkIn: string, checkOut: string) => { available: boolean; conflictingReservation?: NeighborhoodReservation };
  checkTentAvailability: (tentId: string, checkIn: string, checkOut: string) => { available: boolean; conflictingGroup?: string };
  markNeighborhoodDirty: (neighborhoodId: NeighborhoodId) => void;
  markNeighborhoodClean: (neighborhoodId: NeighborhoodId) => void;
  clearNeighborhoodBeds: (neighborhoodId: NeighborhoodId) => void;
  
  // Daily task operations
  addDailyTask: (task: Omit<DailyTask, 'id' | 'createdAt'>) => void;
  updateDailyTaskStatus: (taskId: string, status: DailyTaskStatus) => void;
  removeDailyTask: (taskId: string) => void;
  getDailyTasks: (date: string) => DailyTask[];
  
  // Summaries
  getNeighborhoodSummary: (neighborhoodId: NeighborhoodId) => NeighborhoodSummary | null;
  getTentSummary: (tentId: string) => TentSummary | null;
  getTodaySummary: () => TodaySummary;
  
  // Data management
  exportState: () => string;
  importState: (json: string) => boolean;
  resetToDefault: () => void;
}

// Singleton pattern to prevent HMR context issues
const VILLAGE_CONTEXT_KEY = '__VILLAGE_CONTEXT__';

function getOrCreateContext(): React.Context<VillageContextType | null> {
  const globalObj = globalThis as unknown as { [key: string]: React.Context<VillageContextType | null> };
  if (!globalObj[VILLAGE_CONTEXT_KEY]) {
    globalObj[VILLAGE_CONTEXT_KEY] = createContext<VillageContextType | null>(null);
  }
  return globalObj[VILLAGE_CONTEXT_KEY];
}

const VillageContext = getOrCreateContext();

export const useVillage = () => {
  const context = useContext(VillageContext);
  if (!context) {
    throw new Error('useVillage must be used within a VillageProvider');
  }
  return context;
};

const getToday = () => new Date().toISOString().split('T')[0];

export const VillageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { 
    state, 
    isLoading, 
    updateTent,
    updateBed,
    updateFacility,
    updateActivitySpace,
    addActivityReservation: addActivityReservationDb,
    removeActivityReservation: removeActivityReservationDb,
    addFacilityReservation: addFacilityReservationDb,
    removeFacilityReservation: removeFacilityReservationDb,
    addNeighborhoodReservation: addNeighborhoodReservationDb,
    removeNeighborhoodReservation: removeNeighborhoodReservationDb,
    addDailyTask: addDailyTaskDb,
    updateDailyTask: updateDailyTaskDb,
    removeDailyTask: removeDailyTaskDb,
  } = useSupabaseVillage();

  // ============================================================
  // BED OPERATIONS
  // ============================================================

  const updateBedStatus = useCallback((bedId: string, status: BedStatus) => {
    updateBed(bedId, { status }).catch(console.error);
  }, [updateBed]);

  const cycleBedStatus = useCallback((bedId: string) => {
    if (!state) return;
    const bed = state.beds[bedId];
    if (!bed) return;

    const statusCycle: BedStatus[] = ['FREE', 'RESERVED', 'OCCUPIED', 'BLOCKED'];
    const currentIndex = statusCycle.indexOf(bed.status);
    const nextStatus = statusCycle[(currentIndex + 1) % statusCycle.length];
    
    updateBedStatus(bedId, nextStatus);
  }, [state, updateBedStatus]);

  const updateBedGuestName = useCallback((bedId: string, guestName: string) => {
    updateBed(bedId, { guestName }).catch(console.error);
  }, [updateBed]);

  const clearBedGuest = useCallback((bedId: string) => {
    updateBedGuestName(bedId, '');
  }, [updateBedGuestName]);

  // ============================================================
  // TENT OPERATIONS
  // ============================================================

  const updateTentCleaningStatus = useCallback((tentId: string, cleaningStatus: CleaningStatus, assignedTo?: string) => {
    const updates: Partial<Tent> = { cleaningStatus };
    if (assignedTo !== undefined) {
      updates.cleaningAssignedTo = assignedTo;
    }
    updateTent(tentId, updates).catch(console.error);
  }, [updateTent]);

  const updateTentGroupName = useCallback((tentId: string, groupName: string) => {
    updateTent(tentId, { groupName }).catch(console.error);
  }, [updateTent]);

  const updateTentDates = useCallback((tentId: string, checkInDate?: string | null, checkOutDate?: string | null) => {
    if (!state) return;
    const tent = state.tents[tentId];
    if (!tent) return;

    const updates: Partial<Tent> = {};
    // null = clear, undefined = keep existing
    if (checkInDate !== undefined) {
      updates.checkInDate = checkInDate === null ? undefined : checkInDate;
    }
    if (checkOutDate !== undefined) {
      updates.checkOutDate = checkOutDate === null ? undefined : checkOutDate;
    }
    updateTent(tentId, updates).catch(console.error);
  }, [state, updateTent]);

  const updateTentNotes = useCallback((tentId: string, notes: string) => {
    updateTent(tentId, { notes }).catch(console.error);
  }, [updateTent]);

  const updateTentPeopleCount = useCallback((tentId: string, peopleCount: number | undefined) => {
    if (!state) return;
    const tent = state.tents[tentId];
    if (!tent) return;

    // Validate count doesn't exceed beds
    const validCount = peopleCount !== undefined 
      ? Math.min(Math.max(0, peopleCount), tent.beds.length)
      : undefined;

    updateTent(tentId, { peopleCount: validCount }).catch(console.error);
  }, [state, updateTent]);

  const updateTentGender = useCallback((tentId: string, gender: TentGender | undefined) => {
    updateTent(tentId, { gender }).catch(console.error);
  }, [updateTent]);

  // Atomically set bed statuses to RESERVED for VIP tent assignments
  const setTentReservedBeds = useCallback((tentId: string, reservedCount: number) => {
    if (!state) return;
    const tent = state.tents[tentId];
    if (!tent) return;

    // Update each bed based on whether it should be reserved
    tent.beds.forEach((bed, index) => {
      const shouldBeReserved = index < reservedCount;
      
      if (shouldBeReserved) {
        if (bed.status === 'FREE') {
          updateBed(bed.id, { status: 'RESERVED' }).catch(console.error);
        }
      } else {
        if (bed.status === 'RESERVED' && !bed.guestName) {
          updateBed(bed.id, { status: 'FREE' }).catch(console.error);
        }
      }
    });
  }, [state, updateBed]);

  const updateTentPrivateBathroom = useCallback((tentId: string, hasPrivateBathroom: boolean) => {
    updateTent(tentId, { hasPrivateBathroom }).catch(console.error);
  }, [updateTent]);

  const updateTentPrivateShower = useCallback((tentId: string, hasPrivateShower: boolean) => {
    updateTent(tentId, { hasPrivateShower }).catch(console.error);
  }, [updateTent]);

  const clearAllBeds = useCallback((tentId: string) => {
    if (!state) return;
    const tent = state.tents[tentId];
    if (!tent) return;

    // Clear all beds
    tent.beds.forEach(b => {
      updateBed(b.id, { status: 'FREE', guestName: '' }).catch(console.error);
    });
    // Clear tent group info
    updateTent(tentId, { groupName: '' }).catch(console.error);
  }, [state, updateBed, updateTent]);

  const updateTentCleaningAssignment = useCallback((tentId: string, assignedTo: string) => {
    updateTent(tentId, { cleaningAssignedTo: assignedTo }).catch(console.error);
  }, [updateTent]);

  const reportTentFacilityIssue = useCallback((
    tentId: string,
    facilityType: 'bathroom' | 'shower',
    status: WorkingStatus,
    notes: string,
    image?: string
  ) => {
    const updates = facilityType === 'bathroom'
      ? { bathroomWorkingStatus: status, bathroomMaintenanceNotes: notes, bathroomMaintenanceImage: image }
      : { showerWorkingStatus: status, showerMaintenanceNotes: notes, showerMaintenanceImage: image };

    updateTent(tentId, updates).catch(console.error);
  }, [updateTent]);

  const resolveTentFacilityIssue = useCallback((tentId: string, facilityType: 'bathroom' | 'shower') => {
    const updates = facilityType === 'bathroom' 
      ? { bathroomWorkingStatus: 'WORKING' as WorkingStatus, bathroomMaintenanceNotes: undefined, bathroomMaintenanceImage: undefined }
      : { showerWorkingStatus: 'WORKING' as WorkingStatus, showerMaintenanceNotes: undefined, showerMaintenanceImage: undefined };

    updateTent(tentId, updates).catch(console.error);
  }, [updateTent]);

  // ============================================================
  // FACILITY OPERATIONS
  // ============================================================

  const updateFacilityCleaningStatus = useCallback((facilityId: string, cleaningStatus: CleaningStatus) => {
    updateFacility(facilityId, { cleaningStatus }).catch(console.error);
  }, [updateFacility]);

  const updateFacilityWorkingStatus = useCallback((facilityId: string, workingStatus: WorkingStatus) => {
    if (workingStatus === 'WORKING') {
      updateFacility(facilityId, { workingStatus, maintenanceNotes: undefined, maintenanceImage: undefined }).catch(console.error);
    } else {
      updateFacility(facilityId, { workingStatus }).catch(console.error);
    }
  }, [updateFacility]);

  const updateFacilityNotes = useCallback((facilityId: string, notes: string) => {
    updateFacility(facilityId, { notes }).catch(console.error);
  }, [updateFacility]);

  const updateFacilityMaintenanceImage = useCallback((facilityId: string, maintenanceImage: string | undefined) => {
    updateFacility(facilityId, { maintenanceImage }).catch(console.error);
  }, [updateFacility]);

  const updateFacilityMaintenanceNotes = useCallback((facilityId: string, maintenanceNotes: string | undefined) => {
    updateFacility(facilityId, { maintenanceNotes }).catch(console.error);
  }, [updateFacility]);

  const reportFacilityIssue = useCallback((facilityId: string, status: WorkingStatus, notes: string, image?: string) => {
    updateFacility(facilityId, { 
      workingStatus: status,
      maintenanceNotes: notes,
      maintenanceImage: image,
    }).catch(console.error);
  }, [updateFacility]);

  const resolveFacilityIssue = useCallback((facilityId: string) => {
    updateFacility(facilityId, { 
      workingStatus: 'WORKING',
      maintenanceNotes: undefined,
      maintenanceImage: undefined,
    }).catch(console.error);
  }, [updateFacility]);

  // ============================================================
  // FACILITY RESERVATION OPERATIONS
  // ============================================================

  const addFacilityReservation = useCallback((reservation: Omit<FacilityReservation, 'id' | 'createdAt'>): boolean => {
    if (!state) return false;

    // Check for overlapping reservations
    const existingReservations = Object.values(state.facilityReservations || {}).filter(
      r => r.facilityId === reservation.facilityId && r.date === reservation.date
    );

    const newStart = reservation.startTime;
    const newEnd = reservation.endTime;

    for (const existing of existingReservations) {
      // Check if times overlap
      if (
        (newStart >= existing.startTime && newStart < existing.endTime) ||
        (newEnd > existing.startTime && newEnd <= existing.endTime) ||
        (newStart <= existing.startTime && newEnd >= existing.endTime)
      ) {
        return false; // Overlap detected
      }
    }

    addFacilityReservationDb(reservation).catch(console.error);
    return true;
  }, [state, addFacilityReservationDb]);

  const removeFacilityReservation = useCallback((reservationId: string) => {
    removeFacilityReservationDb(reservationId).catch(console.error);
  }, [removeFacilityReservationDb]);

  const getFacilityReservations = useCallback((facilityId: string): FacilityReservation[] => {
    if (!state) return [];
    return Object.values(state.facilityReservations || {}).filter(
      r => r.facilityId === facilityId
    );
  }, [state]);

  // ============================================================
  // ACTIVITY OPERATIONS
  // ============================================================

  const addActivityReservation = useCallback((reservation: Omit<ActivityReservation, 'id' | 'createdAt'>): boolean => {
    if (!state) return false;

    // Client-side pre-check for UX (server RPC is the real enforcement)
    const existingReservations = Object.values(state.activityReservations).filter(
      r => r.spaceId === reservation.spaceId && r.date === reservation.date
    );

    const newStart = reservation.startTime;
    const newEnd = reservation.endTime;

    for (const existing of existingReservations) {
      if (timeRangesOverlapWithGap(newStart, newEnd, existing.startTime, existing.endTime, 15)) {
        return false; // Overlap detected - need 15 minute gap
      }
    }

    // Use server-side RPC for atomic insert (handles concurrency)
    addActivityReservationDb(reservation).catch((err) => {
      console.error('Activity reservation conflict (server):', err.message);
    });
    return true;
  }, [state, addActivityReservationDb]);

  const removeActivityReservation = useCallback((reservationId: string) => {
    removeActivityReservationDb(reservationId).catch(console.error);
  }, [removeActivityReservationDb]);

  const updateActivitySpaceStatus = useCallback((spaceId: string, cleaningStatus?: CleaningStatus, workingStatus?: WorkingStatus, cleaningNotes?: string) => {
    if (!state) return;
    const space = state.activitySpaces[spaceId];
    if (!space) return;

    const updates: Partial<{cleaningStatus: CleaningStatus; workingStatus: WorkingStatus; cleaningNotes: string | undefined; maintenanceNotes: string | undefined; maintenanceImage: string | undefined}> = {};
    if (cleaningStatus !== undefined) updates.cleaningStatus = cleaningStatus;
    if (workingStatus !== undefined) {
      updates.workingStatus = workingStatus;
      if (workingStatus === 'WORKING') {
        updates.maintenanceNotes = undefined;
        updates.maintenanceImage = undefined;
      }
    }
    // Clear cleaning notes when marking as clean, otherwise set if provided
    if (cleaningStatus === 'CLEAN') {
      updates.cleaningNotes = undefined;
    } else if (cleaningNotes !== undefined) {
      updates.cleaningNotes = cleaningNotes;
    }

    updateActivitySpace(spaceId, updates).catch(console.error);
  }, [state, updateActivitySpace]);

  const updateActivitySpaceNotes = useCallback((spaceId: string, notes: string) => {
    updateActivitySpace(spaceId, { notes }).catch(console.error);
  }, [updateActivitySpace]);

  const reportActivitySpaceIssue = useCallback((spaceId: string, status: WorkingStatus, notes: string, image?: string) => {
    updateActivitySpace(spaceId, {
      workingStatus: status,
      maintenanceNotes: notes,
      maintenanceImage: image,
    }).catch(console.error);
  }, [updateActivitySpace]);

  const resolveActivitySpaceIssue = useCallback((spaceId: string) => {
    updateActivitySpace(spaceId, {
      workingStatus: 'WORKING',
      maintenanceNotes: undefined,
      maintenanceImage: undefined,
    }).catch(console.error);
  }, [updateActivitySpace]);

  // ============================================================
  // NEIGHBORHOOD BULK OPERATIONS
  // ============================================================

  // Helper to check date overlap
  const datesOverlap = (start1: string, end1: string, start2: string, end2: string): boolean => {
    // Two ranges overlap if one starts before the other ends
    return start1 < end2 && start2 < end1;
  };

  const checkNeighborhoodAvailability = useCallback((
    neighborhoodId: NeighborhoodId, 
    checkIn: string, 
    checkOut: string
  ): { available: boolean; conflictingReservation?: NeighborhoodReservation } => {
    if (!state) return { available: false };

    // Check existing neighborhood reservations
    const existingReservations = Object.values(state.neighborhoodReservations || {}).filter(
      r => r.neighborhoodId === neighborhoodId
    );

    for (const reservation of existingReservations) {
      if (datesOverlap(checkIn, checkOut, reservation.checkInDate, reservation.checkOutDate)) {
        return { available: false, conflictingReservation: reservation };
      }
    }

    // Also check individual tent reservations in that neighborhood
    const neighborhood = state.neighborhoods[neighborhoodId];
    if (neighborhood) {
      for (const tentId of neighborhood.tentIds) {
        const tent = state.tents[tentId];
        if (tent && tent.checkInDate && tent.checkOutDate) {
          if (datesOverlap(checkIn, checkOut, tent.checkInDate, tent.checkOutDate)) {
            // Check if any beds are occupied or reserved
            const hasBookedBeds = tent.beds.some(b => b.status === 'RESERVED' || b.status === 'OCCUPIED');
            if (hasBookedBeds) {
              return { 
                available: false, 
                conflictingReservation: {
                  id: 'tent_' + tentId,
                  neighborhoodId,
                  groupName: tent.groupName || 'Reserva existente',
                  checkInDate: tent.checkInDate,
                  checkOutDate: tent.checkOutDate,
                  reservationType: 'SPECIFIC_TENTS',
                  tentIds: [tentId],
                  createdAt: tent.lastUpdated,
                }
              };
            }
          }
        }
      }
    }

    return { available: true };
  }, [state]);

  const reserveNeighborhood = useCallback((reservation: Omit<NeighborhoodReservation, 'id' | 'createdAt'>): { success: boolean; error?: string } => {
    if (!state) return { success: false, error: 'המערכת לא זמינה' };

    const neighborhood = state.neighborhoods[reservation.neighborhoodId];
    if (!neighborhood) return { success: false, error: 'שכונה לא נמצאה' };

    // Validate dates
    if (reservation.checkInDate >= reservation.checkOutDate) {
      return { success: false, error: 'תאריך CHECK OUT חייב להיות אחרי CHECK IN' };
    }

    // Check for overlapping reservations
    const availability = checkNeighborhoodAvailability(
      reservation.neighborhoodId,
      reservation.checkInDate,
      reservation.checkOutDate
    );

    if (!availability.available) {
      const conflict = availability.conflictingReservation;
      return { 
        success: false, 
        error: `התנגשות עם הזמנה קיימת: ${conflict?.groupName} (${conflict?.checkInDate} - ${conflict?.checkOutDate})` 
      };
    }

    // Add reservation to DB
    addNeighborhoodReservationDb({
      ...reservation,
      reservationType: reservation.reservationType || 'FULL_NEIGHBORHOOD',
    }).catch(console.error);

    // Assign genders based on distribution
    const genderDistribution = reservation.genderDistribution;
    let femaleCount = genderDistribution?.female || 0;
    let maleCount = genderDistribution?.male || 0;
    let mixedCount = genderDistribution?.mixed || 0;

    // Update all tents in the neighborhood
    for (const tentId of neighborhood.tentIds) {
      const tent = state.tents[tentId];
      if (!tent) continue;

      // Determine gender for this tent based on distribution
      let assignedGender: TentGender | undefined = undefined;
      if (genderDistribution && (femaleCount > 0 || maleCount > 0 || mixedCount > 0)) {
        if (femaleCount > 0) {
          assignedGender = 'FEMALE';
          femaleCount--;
        } else if (maleCount > 0) {
          assignedGender = 'MALE';
          maleCount--;
        } else if (mixedCount > 0) {
          assignedGender = 'MIXED';
          mixedCount--;
        }
      }

      // Update tent
      updateTent(tentId, {
        groupName: reservation.groupName,
        checkInDate: reservation.checkInDate,
        checkOutDate: reservation.checkOutDate,
        gender: assignedGender || tent.gender,
      }).catch(console.error);

      // Reserve all beds
      tent.beds.forEach(b => {
        updateBed(b.id, { status: 'RESERVED' }).catch(console.error);
      });
    }

    return { success: true };
  }, [state, checkNeighborhoodAvailability, addNeighborhoodReservationDb, updateTent, updateBed]);

  const checkTentAvailability = useCallback((
    tentId: string,
    checkIn: string,
    checkOut: string
  ): { available: boolean; conflictingGroup?: string } => {
    if (!state) return { available: false };

    const tent = state.tents[tentId];
    if (!tent) return { available: false };

    // Check if tent has booked beds in overlapping dates
    if (tent.checkInDate && tent.checkOutDate) {
      if (datesOverlap(checkIn, checkOut, tent.checkInDate, tent.checkOutDate)) {
        const hasBookedBeds = tent.beds.some(b => b.status === 'RESERVED' || b.status === 'OCCUPIED');
        if (hasBookedBeds) {
          return { available: false, conflictingGroup: tent.groupName };
        }
      }
    }

    return { available: true };
  }, [state]);

  const reserveSpecificTents = useCallback((params: {
    neighborhoodId: NeighborhoodId;
    tentIds: string[];
    tentGenders?: Record<string, TentGender>;
    groupName: string;
    checkInDate: string;
    checkOutDate: string;
    totalPeople?: number;
    contactName?: string;
    contactPhone?: string;
    notes?: string;
  }): { success: boolean; error?: string } => {
    if (!state) return { success: false, error: 'המערכת לא זמינה' };

    const { neighborhoodId, tentIds, tentGenders, groupName, checkInDate, checkOutDate, totalPeople, contactName, contactPhone, notes } = params;

    // Validate dates
    if (checkInDate >= checkOutDate) {
      return { success: false, error: 'תאריך CHECK OUT חייב להיות אחרי CHECK IN' };
    }

    // Check availability of each tent
    for (const tentId of tentIds) {
      const availability = checkTentAvailability(tentId, checkInDate, checkOutDate);
      if (!availability.available) {
        const tent = state.tents[tentId];
        return { 
          success: false, 
          error: `אוהל ${tent?.code} מתנגש עם: ${availability.conflictingGroup || 'הזמנה קיימת'}` 
        };
      }
    }

    // Calculate total beds
    let totalBeds = 0;
    for (const tentId of tentIds) {
      const tent = state.tents[tentId];
      if (tent) totalBeds += tent.beds.length;
    }

    // Add reservation to DB
    addNeighborhoodReservationDb({
      neighborhoodId,
      groupName,
      checkInDate,
      checkOutDate,
      reservationType: 'SPECIFIC_TENTS',
      tentIds,
      totalBeds,
      totalPeople,
      contactName,
      contactPhone,
      notes,
    }).catch(console.error);

    // Update selected tents
    for (const tentId of tentIds) {
      const tent = state.tents[tentId];
      if (!tent) continue;

      // Get assigned gender for this tent
      const assignedGender = tentGenders?.[tentId] || tent.gender;

      updateTent(tentId, {
        groupName,
        checkInDate,
        checkOutDate,
        gender: assignedGender,
      }).catch(console.error);

      // Reserve all beds in selected tents
      tent.beds.forEach(b => {
        updateBed(b.id, { status: 'RESERVED' }).catch(console.error);
      });
    }

    return { success: true };
  }, [state, checkTentAvailability, addNeighborhoodReservationDb, updateTent, updateBed]);

  const removeNeighborhoodReservation = useCallback((reservationId: string) => {
    removeNeighborhoodReservationDb(reservationId).catch(console.error);
  }, [removeNeighborhoodReservationDb]);

  const getNeighborhoodReservations = useCallback((neighborhoodId: NeighborhoodId): NeighborhoodReservation[] => {
    if (!state) return [];
    return Object.values(state.neighborhoodReservations || {}).filter(
      r => r.neighborhoodId === neighborhoodId
    ).sort((a, b) => a.checkInDate.localeCompare(b.checkInDate));
  }, [state]);

  const markNeighborhoodDirty = useCallback((neighborhoodId: NeighborhoodId) => {
    if (!state) return;

    const neighborhood = state.neighborhoods[neighborhoodId];
    if (!neighborhood) return;

    for (const tentId of neighborhood.tentIds) {
      updateTent(tentId, { cleaningStatus: 'NEEDS_CLEANING' }).catch(console.error);
    }
  }, [state, updateTent]);

  const markNeighborhoodClean = useCallback((neighborhoodId: NeighborhoodId) => {
    if (!state) return;

    const neighborhood = state.neighborhoods[neighborhoodId];
    if (!neighborhood) return;

    for (const tentId of neighborhood.tentIds) {
      updateTent(tentId, { cleaningStatus: 'CLEAN' }).catch(console.error);
    }
  }, [state, updateTent]);

  const clearNeighborhoodBeds = useCallback((neighborhoodId: NeighborhoodId) => {
    if (!state) return;

    const neighborhood = state.neighborhoods[neighborhoodId];
    if (!neighborhood) return;

    for (const tentId of neighborhood.tentIds) {
      const tent = state.tents[tentId];
      if (!tent) continue;

      // Clear all beds
      tent.beds.forEach(b => {
        updateBed(b.id, { status: 'FREE', guestName: '' }).catch(console.error);
      });

      // Clear tent group info
      updateTent(tentId, { 
        groupName: '',
        checkInDate: undefined,
        checkOutDate: undefined,
      }).catch(console.error);
    }
  }, [state, updateTent, updateBed]);

  // ============================================================
  // DAILY TASK OPERATIONS
  // ============================================================

  const addDailyTask = useCallback((task: Omit<DailyTask, 'id' | 'createdAt'>) => {
    addDailyTaskDb(task).catch(console.error);
  }, [addDailyTaskDb]);

  const updateDailyTaskStatus = useCallback((taskId: string, status: DailyTaskStatus) => {
    const updates: Partial<DailyTask> = { status };
    if (status === 'COMPLETED') {
      updates.completedAt = new Date().toISOString();
    }
    updateDailyTaskDb(taskId, updates).catch(console.error);
  }, [updateDailyTaskDb]);

  const removeDailyTask = useCallback((taskId: string) => {
    removeDailyTaskDb(taskId).catch(console.error);
  }, [removeDailyTaskDb]);

  const getDailyTasks = useCallback((date: string): DailyTask[] => {
    if (!state) return [];
    return Object.values(state.dailyTasks || {}).filter(t => t.date === date);
  }, [state]);

  // ============================================================
  // SUMMARIES
  // ============================================================

  const getNeighborhoodSummary = useCallback((neighborhoodId: NeighborhoodId): NeighborhoodSummary | null => {
    if (!state) return null;

    const neighborhood = state.neighborhoods[neighborhoodId];
    if (!neighborhood) return null;

    const today = getToday();
    let totalBeds = 0;
    let occupiedBeds = 0;
    let freeBeds = 0;
    let dirtyTents = 0;
    let checkInsToday = 0;
    let checkOutsToday = 0;

    for (const tentId of neighborhood.tentIds) {
      const tent = state.tents[tentId];
      if (!tent) continue;

      totalBeds += tent.beds.length;
      // Treat RESERVED beds as "occupied" for occupancy/availability displays.
      occupiedBeds += tent.beds.filter(b => b.status === 'OCCUPIED' || b.status === 'RESERVED').length;
      freeBeds += tent.beds.filter(b => b.status === 'FREE').length;

      if (tent.cleaningStatus === 'NEEDS_CLEANING') {
        dirtyTents++;
      }

      if (tent.checkInDate === today) {
        checkInsToday++;
      }

      if (tent.checkOutDate === today) {
        checkOutsToday++;
      }
    }

    return {
      id: neighborhoodId,
      name: neighborhood.name,
      displayName: neighborhood.displayName,
      totalBeds,
      occupiedBeds,
      freeBeds,
      dirtyTents,
      checkInsToday,
      checkOutsToday,
    };
  }, [state]);

  const getTentSummary = useCallback((tentId: string): TentSummary | null => {
    if (!state) return null;

    const tent = state.tents[tentId];
    if (!tent) return null;

    return {
      tentId: tent.id,
      code: tent.code,
      totalBeds: tent.beds.length,
      freeBeds: tent.beds.filter(b => b.status === 'FREE').length,
      reservedBeds: tent.beds.filter(b => b.status === 'RESERVED').length,
      occupiedBeds: tent.beds.filter(b => b.status === 'OCCUPIED').length,
      blockedBeds: tent.beds.filter(b => b.status === 'BLOCKED').length,
      cleaningStatus: tent.cleaningStatus,
      groupName: tent.groupName,
      checkInDate: tent.checkInDate,
      checkOutDate: tent.checkOutDate,
      isVIP: tent.isVIP,
      hasPrivateBathroom: tent.hasPrivateBathroom,
      hasPrivateShower: tent.hasPrivateShower,
      isAccessible: tent.isAccessible,
      gender: tent.gender,
    };
  }, [state]);

  const getTodaySummary = useCallback((): TodaySummary => {
    if (!state) {
      return { checkIns: [], checkOuts: [], tentsToCleaning: [], facilitiesNeedAttention: [] };
    }

    const today = getToday();
    const checkIns: TentSummary[] = [];
    const checkOuts: TentSummary[] = [];
    const tentsToCleaning: TentSummary[] = [];

    for (const tent of Object.values(state.tents)) {
      const summary = getTentSummary(tent.id);
      if (!summary) continue;

      if (tent.checkInDate === today) {
        checkIns.push(summary);
      }

      if (tent.checkOutDate === today) {
        checkOuts.push(summary);
      }

      if (tent.cleaningStatus === 'NEEDS_CLEANING') {
        tentsToCleaning.push(summary);
      }
    }

    // Common facilities needing attention
    const facilitiesNeedAttention = Object.values(state.facilities).filter(
      f => f.cleaningStatus === 'NEEDS_CLEANING' || f.workingStatus === 'BROKEN'
    );

    // Also include VIP private bathroom/shower issues as "virtual" facilities
    const vipFacilityIssues: Facility[] = [];
    for (const tent of Object.values(state.tents)) {
      if (tent.isVIP || tent.hasPrivateBathroom || tent.hasPrivateShower) {
        // Check bathroom
        if (tent.hasPrivateBathroom && tent.bathroomWorkingStatus && tent.bathroomWorkingStatus !== 'WORKING') {
          vipFacilityIssues.push({
            id: `vip_bathroom_${tent.id}`,
            areaId: 'VIP',
            label: `🚽 ${tent.code} - Baño`,
            type: 'TOILET',
            gender: 'UNISEX',
            cleaningStatus: 'CLEAN',
            workingStatus: tent.bathroomWorkingStatus,
            notes: tent.bathroomMaintenanceNotes,
            maintenanceImage: tent.bathroomMaintenanceImage,
            maintenanceNotes: tent.bathroomMaintenanceNotes,
            lastUpdated: tent.lastUpdated,
          });
        }
        // Check shower
        if (tent.hasPrivateShower && tent.showerWorkingStatus && tent.showerWorkingStatus !== 'WORKING') {
          vipFacilityIssues.push({
            id: `vip_shower_${tent.id}`,
            areaId: 'VIP',
            label: `🚿 ${tent.code} - Ducha`,
            type: 'SHOWER',
            gender: 'UNISEX',
            cleaningStatus: 'CLEAN',
            workingStatus: tent.showerWorkingStatus,
            notes: tent.showerMaintenanceNotes,
            maintenanceImage: tent.showerMaintenanceImage,
            maintenanceNotes: tent.showerMaintenanceNotes,
            lastUpdated: tent.lastUpdated,
          });
        }
      }
    }

    return { 
      checkIns, 
      checkOuts, 
      tentsToCleaning, 
      facilitiesNeedAttention: [...facilitiesNeedAttention, ...vipFacilityIssues] 
    };
  }, [state, getTentSummary]);

  // ============================================================
  // DATA MANAGEMENT
  // ============================================================

  const exportState = useCallback(() => {
    if (!state) return '';
    return JSON.stringify(state, null, 2);
  }, [state]);

  const importState = useCallback((_jsonString: string): boolean => {
    // Import is not supported with Supabase backend - data is in the cloud
    console.warn('Import is not supported with cloud backend');
    return false;
  }, []);

  const resetToDefault = useCallback(() => {
    // Reset is not supported with Supabase backend - would require clearing all tables
    console.warn('Reset is not supported with cloud backend');
  }, []);

  const value: VillageContextType = {
    state,
    isLoading,
    updateBedStatus,
    cycleBedStatus,
    updateBedGuestName,
    clearBedGuest,
    updateTentCleaningStatus,
    updateTentGroupName,
    updateTentDates,
    updateTentNotes,
    updateTentPeopleCount,
    updateTentGender,
    setTentReservedBeds,
    updateTentPrivateBathroom,
    updateTentPrivateShower,
    updateTentCleaningAssignment,
    reportTentFacilityIssue,
    resolveTentFacilityIssue,
    clearAllBeds,
    updateFacilityCleaningStatus,
    updateFacilityWorkingStatus,
    updateFacilityNotes,
    updateFacilityMaintenanceImage,
    updateFacilityMaintenanceNotes,
    reportFacilityIssue,
    resolveFacilityIssue,
    addFacilityReservation,
    removeFacilityReservation,
    getFacilityReservations,
    addActivityReservation,
    removeActivityReservation,
    updateActivitySpaceStatus,
    updateActivitySpaceNotes,
    reportActivitySpaceIssue,
    resolveActivitySpaceIssue,
    reserveNeighborhood,
    reserveSpecificTents,
    removeNeighborhoodReservation,
    getNeighborhoodReservations,
    checkNeighborhoodAvailability,
    checkTentAvailability,
    markNeighborhoodDirty,
    markNeighborhoodClean,
    clearNeighborhoodBeds,
    addDailyTask,
    updateDailyTaskStatus,
    removeDailyTask,
    getDailyTasks,
    getNeighborhoodSummary,
    getTentSummary,
    getTodaySummary,
    exportState,
    importState,
    resetToDefault,
  };

  return (
    <VillageContext.Provider value={value}>
      {children}
    </VillageContext.Provider>
  );
};
