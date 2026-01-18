import React, { createContext, useContext, ReactNode } from 'react';
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
  NeighborhoodId
} from '@/types/village';
import { useVillageData } from '@/hooks/useVillageData';

interface VillageContextType {
  state: VillageState | null;
  isLoading: boolean;
  
  // Bed operations
  updateBedStatus: (bedId: string, status: BedStatus) => void;
  cycleBedStatus: (bedId: string) => void;
  updateBedGuestName: (bedId: string, guestName: string) => void;
  clearBedGuest: (bedId: string) => void;
  
  // Tent operations
  updateTentCleaningStatus: (tentId: string, status: CleaningStatus) => void;
  updateTentGroupName: (tentId: string, groupName: string) => void;
  updateTentDates: (tentId: string, checkIn?: string, checkOut?: string) => void;
  updateTentNotes: (tentId: string, notes: string) => void;
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
  
  // Neighborhood bulk operations
  reserveNeighborhood: (reservation: Omit<NeighborhoodReservation, 'id' | 'createdAt'>) => { success: boolean; error?: string };
  removeNeighborhoodReservation: (reservationId: string) => void;
  getNeighborhoodReservations: (neighborhoodId: NeighborhoodId) => NeighborhoodReservation[];
  checkNeighborhoodAvailability: (neighborhoodId: NeighborhoodId, checkIn: string, checkOut: string) => { available: boolean; conflictingReservation?: NeighborhoodReservation };
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

const VillageContext = createContext<VillageContextType | null>(null);

export const useVillage = () => {
  const context = useContext(VillageContext);
  if (!context) {
    throw new Error('useVillage must be used within a VillageProvider');
  }
  return context;
};

const getToday = () => new Date().toISOString().split('T')[0];

export const VillageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { state, isLoading, saveState, exportState, importState, resetToDefault } = useVillageData();

  // ============================================================
  // BED OPERATIONS
  // ============================================================

  const updateBedStatus = (bedId: string, status: BedStatus) => {
    if (!state) return;
    
    const bed = state.beds[bedId];
    if (!bed) return;

    const updatedBeds = {
      ...state.beds,
      [bedId]: { ...bed, status },
    };

    // Also update the bed in the tent's beds array
    const tent = state.tents[bed.tentId];
    if (tent) {
      const updatedTentBeds = tent.beds.map(b => 
        b.id === bedId ? { ...b, status } : b
      );
      const updatedTents = {
        ...state.tents,
        [bed.tentId]: { ...tent, beds: updatedTentBeds, lastUpdated: new Date().toISOString() },
      };
      saveState({ ...state, beds: updatedBeds, tents: updatedTents });
    } else {
      saveState({ ...state, beds: updatedBeds });
    }
  };

  const cycleBedStatus = (bedId: string) => {
    if (!state) return;
    const bed = state.beds[bedId];
    if (!bed) return;

    const statusCycle: BedStatus[] = ['FREE', 'RESERVED', 'OCCUPIED', 'BLOCKED'];
    const currentIndex = statusCycle.indexOf(bed.status);
    const nextStatus = statusCycle[(currentIndex + 1) % statusCycle.length];
    
    updateBedStatus(bedId, nextStatus);
  };

  const updateBedGuestName = (bedId: string, guestName: string) => {
    if (!state) return;
    
    const bed = state.beds[bedId];
    if (!bed) return;

    const updatedBeds = {
      ...state.beds,
      [bedId]: { ...bed, guestName },
    };

    const tent = state.tents[bed.tentId];
    if (tent) {
      const updatedTentBeds = tent.beds.map(b => 
        b.id === bedId ? { ...b, guestName } : b
      );
      const updatedTents = {
        ...state.tents,
        [bed.tentId]: { ...tent, beds: updatedTentBeds, lastUpdated: new Date().toISOString() },
      };
      saveState({ ...state, beds: updatedBeds, tents: updatedTents });
    } else {
      saveState({ ...state, beds: updatedBeds });
    }
  };

  const clearBedGuest = (bedId: string) => {
    updateBedGuestName(bedId, '');
  };

  // ============================================================
  // TENT OPERATIONS
  // ============================================================

  const updateTentCleaningStatus = (tentId: string, cleaningStatus: CleaningStatus) => {
    if (!state) return;
    
    const tent = state.tents[tentId];
    if (!tent) return;

    const updatedTents = {
      ...state.tents,
      [tentId]: { ...tent, cleaningStatus, lastUpdated: new Date().toISOString() },
    };

    saveState({ ...state, tents: updatedTents });
  };

  const updateTentGroupName = (tentId: string, groupName: string) => {
    if (!state) return;
    
    const tent = state.tents[tentId];
    if (!tent) return;

    const updatedTents = {
      ...state.tents,
      [tentId]: { ...tent, groupName, lastUpdated: new Date().toISOString() },
    };

    saveState({ ...state, tents: updatedTents });
  };

  const updateTentDates = (tentId: string, checkInDate?: string, checkOutDate?: string) => {
    if (!state) return;
    
    const tent = state.tents[tentId];
    if (!tent) return;

    const updatedTents = {
      ...state.tents,
      [tentId]: { 
        ...tent, 
        checkInDate: checkInDate ?? tent.checkInDate, 
        checkOutDate: checkOutDate ?? tent.checkOutDate,
        lastUpdated: new Date().toISOString() 
      },
    };

    saveState({ ...state, tents: updatedTents });
  };

  const updateTentNotes = (tentId: string, notes: string) => {
    if (!state) return;
    
    const tent = state.tents[tentId];
    if (!tent) return;

    const updatedTents = {
      ...state.tents,
      [tentId]: { ...tent, notes, lastUpdated: new Date().toISOString() },
    };

    saveState({ ...state, tents: updatedTents });
  };

  const clearAllBeds = (tentId: string) => {
    if (!state) return;
    
    const tent = state.tents[tentId];
    if (!tent) return;

    const updatedBeds = { ...state.beds };
    const updatedTentBeds = tent.beds.map(b => {
      const clearedBed = { ...b, status: 'FREE' as BedStatus, guestName: '' };
      updatedBeds[b.id] = clearedBed;
      return clearedBed;
    });

    const updatedTents = {
      ...state.tents,
      [tentId]: { ...tent, beds: updatedTentBeds, groupName: '', lastUpdated: new Date().toISOString() },
    };

    saveState({ ...state, beds: updatedBeds, tents: updatedTents });
  };

  // ============================================================
  // FACILITY OPERATIONS
  // ============================================================

  const updateFacilityCleaningStatus = (facilityId: string, cleaningStatus: CleaningStatus) => {
    if (!state) return;
    
    const facility = state.facilities[facilityId];
    if (!facility) return;

    const updatedFacilities = {
      ...state.facilities,
      [facilityId]: { ...facility, cleaningStatus, lastUpdated: new Date().toISOString() },
    };

    saveState({ ...state, facilities: updatedFacilities });
  };

  const updateFacilityWorkingStatus = (facilityId: string, workingStatus: WorkingStatus) => {
    if (!state) return;
    
    const facility = state.facilities[facilityId];
    if (!facility) return;

    const updatedFacilities = {
      ...state.facilities,
      [facilityId]: { ...facility, workingStatus, lastUpdated: new Date().toISOString() },
    };

    saveState({ ...state, facilities: updatedFacilities });
  };

  const updateFacilityNotes = (facilityId: string, notes: string) => {
    if (!state) return;
    
    const facility = state.facilities[facilityId];
    if (!facility) return;

    const updatedFacilities = {
      ...state.facilities,
      [facilityId]: { ...facility, notes, lastUpdated: new Date().toISOString() },
    };

    saveState({ ...state, facilities: updatedFacilities });
  };

  const updateFacilityMaintenanceImage = (facilityId: string, maintenanceImage: string | undefined) => {
    if (!state) return;
    
    const facility = state.facilities[facilityId];
    if (!facility) return;

    const updatedFacilities = {
      ...state.facilities,
      [facilityId]: { ...facility, maintenanceImage, lastUpdated: new Date().toISOString() },
    };

    saveState({ ...state, facilities: updatedFacilities });
  };

  const updateFacilityMaintenanceNotes = (facilityId: string, maintenanceNotes: string | undefined) => {
    if (!state) return;
    
    const facility = state.facilities[facilityId];
    if (!facility) return;

    const updatedFacilities = {
      ...state.facilities,
      [facilityId]: { ...facility, maintenanceNotes, lastUpdated: new Date().toISOString() },
    };

    saveState({ ...state, facilities: updatedFacilities });
  };

  const reportFacilityIssue = (facilityId: string, status: WorkingStatus, notes: string, image?: string) => {
    if (!state) return;
    
    const facility = state.facilities[facilityId];
    if (!facility) return;

    const updatedFacilities = {
      ...state.facilities,
      [facilityId]: { 
        ...facility, 
        workingStatus: status,
        maintenanceNotes: notes,
        maintenanceImage: image,
        lastUpdated: new Date().toISOString() 
      },
    };

    saveState({ ...state, facilities: updatedFacilities });
  };

  const resolveFacilityIssue = (facilityId: string) => {
    if (!state) return;
    
    const facility = state.facilities[facilityId];
    if (!facility) return;

    const updatedFacilities = {
      ...state.facilities,
      [facilityId]: { 
        ...facility, 
        workingStatus: 'WORKING' as WorkingStatus,
        maintenanceNotes: undefined,
        maintenanceImage: undefined,
        lastUpdated: new Date().toISOString() 
      },
    };

    saveState({ ...state, facilities: updatedFacilities });
  };

  // ============================================================
  // FACILITY RESERVATION OPERATIONS
  // ============================================================

  const addFacilityReservation = (reservation: Omit<FacilityReservation, 'id' | 'createdAt'>): boolean => {
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

    const newReservation: FacilityReservation = {
      ...reservation,
      id: Math.random().toString(36).substring(2, 11),
      createdAt: new Date().toISOString(),
    };

    const updatedReservations = {
      ...state.facilityReservations,
      [newReservation.id]: newReservation,
    };

    saveState({ ...state, facilityReservations: updatedReservations });
    return true;
  };

  const removeFacilityReservation = (reservationId: string) => {
    if (!state) return;

    const updatedReservations = { ...(state.facilityReservations || {}) };
    delete updatedReservations[reservationId];

    saveState({ ...state, facilityReservations: updatedReservations });
  };

  const getFacilityReservations = (facilityId: string): FacilityReservation[] => {
    if (!state) return [];
    return Object.values(state.facilityReservations || {}).filter(
      r => r.facilityId === facilityId
    );
  };

  // ============================================================
  // ACTIVITY OPERATIONS
  // ============================================================

  const addActivityReservation = (reservation: Omit<ActivityReservation, 'id' | 'createdAt'>): boolean => {
    if (!state) return false;

    // Check for overlapping reservations
    const existingReservations = Object.values(state.activityReservations).filter(
      r => r.spaceId === reservation.spaceId && r.date === reservation.date
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

    const newReservation: ActivityReservation = {
      ...reservation,
      id: Math.random().toString(36).substring(2, 11),
      createdAt: new Date().toISOString(),
    };

    const updatedReservations = {
      ...state.activityReservations,
      [newReservation.id]: newReservation,
    };

    saveState({ ...state, activityReservations: updatedReservations });
    return true;
  };

  const removeActivityReservation = (reservationId: string) => {
    if (!state) return;

    const updatedReservations = { ...state.activityReservations };
    delete updatedReservations[reservationId];

    saveState({ ...state, activityReservations: updatedReservations });
  };

  // ============================================================
  // NEIGHBORHOOD BULK OPERATIONS
  // ============================================================

  // Helper to check date overlap
  const datesOverlap = (start1: string, end1: string, start2: string, end2: string): boolean => {
    // Two ranges overlap if one starts before the other ends
    return start1 < end2 && start2 < end1;
  };

  const checkNeighborhoodAvailability = (
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
                  createdAt: tent.lastUpdated,
                }
              };
            }
          }
        }
      }
    }

    return { available: true };
  };

  const reserveNeighborhood = (reservation: Omit<NeighborhoodReservation, 'id' | 'createdAt'>): { success: boolean; error?: string } => {
    if (!state) return { success: false, error: 'Estado no disponible' };

    const neighborhood = state.neighborhoods[reservation.neighborhoodId];
    if (!neighborhood) return { success: false, error: 'Vecindario no encontrado' };

    // Validate dates
    if (reservation.checkInDate >= reservation.checkOutDate) {
      return { success: false, error: 'La fecha de check-out debe ser posterior al check-in' };
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
        error: `Conflicto con reserva existente: ${conflict?.groupName} (${conflict?.checkInDate} - ${conflict?.checkOutDate})` 
      };
    }

    const newReservation: NeighborhoodReservation = {
      ...reservation,
      id: Math.random().toString(36).substring(2, 11),
      createdAt: new Date().toISOString(),
    };

    // Update all tents in the neighborhood
    const updatedTents = { ...state.tents };
    const updatedBeds = { ...state.beds };

    for (const tentId of neighborhood.tentIds) {
      const tent = updatedTents[tentId];
      if (!tent) continue;

      // Set group name, check-in and check-out dates
      updatedTents[tentId] = {
        ...tent,
        groupName: reservation.groupName,
        checkInDate: reservation.checkInDate,
        checkOutDate: reservation.checkOutDate,
        lastUpdated: new Date().toISOString(),
      };

      // Reserve all beds
      const updatedTentBeds = tent.beds.map(b => {
        const reservedBed = { ...b, status: 'RESERVED' as BedStatus };
        updatedBeds[b.id] = reservedBed;
        return reservedBed;
      });
      updatedTents[tentId].beds = updatedTentBeds;
    }

    const updatedReservations = {
      ...state.neighborhoodReservations,
      [newReservation.id]: newReservation,
    };

    saveState({ ...state, tents: updatedTents, beds: updatedBeds, neighborhoodReservations: updatedReservations });
    return { success: true };
  };

  const removeNeighborhoodReservation = (reservationId: string) => {
    if (!state) return;

    const updatedReservations = { ...(state.neighborhoodReservations || {}) };
    delete updatedReservations[reservationId];

    saveState({ ...state, neighborhoodReservations: updatedReservations });
  };

  const getNeighborhoodReservations = (neighborhoodId: NeighborhoodId): NeighborhoodReservation[] => {
    if (!state) return [];
    return Object.values(state.neighborhoodReservations || {}).filter(
      r => r.neighborhoodId === neighborhoodId
    ).sort((a, b) => a.checkInDate.localeCompare(b.checkInDate));
  };

  const markNeighborhoodDirty = (neighborhoodId: NeighborhoodId) => {
    if (!state) return;

    const neighborhood = state.neighborhoods[neighborhoodId];
    if (!neighborhood) return;

    const updatedTents = { ...state.tents };
    for (const tentId of neighborhood.tentIds) {
      const tent = updatedTents[tentId];
      if (!tent) continue;
      updatedTents[tentId] = {
        ...tent,
        cleaningStatus: 'NEEDS_CLEANING',
        lastUpdated: new Date().toISOString(),
      };
    }

    saveState({ ...state, tents: updatedTents });
  };

  const markNeighborhoodClean = (neighborhoodId: NeighborhoodId) => {
    if (!state) return;

    const neighborhood = state.neighborhoods[neighborhoodId];
    if (!neighborhood) return;

    const updatedTents = { ...state.tents };
    for (const tentId of neighborhood.tentIds) {
      const tent = updatedTents[tentId];
      if (!tent) continue;
      updatedTents[tentId] = {
        ...tent,
        cleaningStatus: 'CLEAN',
        lastUpdated: new Date().toISOString(),
      };
    }

    saveState({ ...state, tents: updatedTents });
  };

  const clearNeighborhoodBeds = (neighborhoodId: NeighborhoodId) => {
    if (!state) return;

    const neighborhood = state.neighborhoods[neighborhoodId];
    if (!neighborhood) return;

    const updatedTents = { ...state.tents };
    const updatedBeds = { ...state.beds };

    for (const tentId of neighborhood.tentIds) {
      const tent = updatedTents[tentId];
      if (!tent) continue;

      const clearedTentBeds = tent.beds.map(b => {
        const clearedBed = { ...b, status: 'FREE' as BedStatus, guestName: '' };
        updatedBeds[b.id] = clearedBed;
        return clearedBed;
      });

      updatedTents[tentId] = {
        ...tent,
        beds: clearedTentBeds,
        groupName: '',
        checkInDate: undefined,
        checkOutDate: undefined,
        lastUpdated: new Date().toISOString(),
      };
    }

    saveState({ ...state, tents: updatedTents, beds: updatedBeds });
  };

  // ============================================================
  // DAILY TASK OPERATIONS
  // ============================================================

  const addDailyTask = (task: Omit<DailyTask, 'id' | 'createdAt'>) => {
    if (!state) return;

    const newTask: DailyTask = {
      ...task,
      id: Math.random().toString(36).substring(2, 11),
      createdAt: new Date().toISOString(),
    };

    const updatedTasks = {
      ...(state.dailyTasks || {}),
      [newTask.id]: newTask,
    };

    saveState({ ...state, dailyTasks: updatedTasks });
  };

  const updateDailyTaskStatus = (taskId: string, status: DailyTaskStatus) => {
    if (!state) return;

    const task = state.dailyTasks?.[taskId];
    if (!task) return;

    const updatedTasks = {
      ...state.dailyTasks,
      [taskId]: {
        ...task,
        status,
        completedAt: status === 'COMPLETED' ? new Date().toISOString() : undefined,
      },
    };

    saveState({ ...state, dailyTasks: updatedTasks });
  };

  const removeDailyTask = (taskId: string) => {
    if (!state) return;

    const updatedTasks = { ...(state.dailyTasks || {}) };
    delete updatedTasks[taskId];

    saveState({ ...state, dailyTasks: updatedTasks });
  };

  const getDailyTasks = (date: string): DailyTask[] => {
    if (!state) return [];
    return Object.values(state.dailyTasks || {}).filter(t => t.date === date);
  };

  // ============================================================
  // SUMMARIES
  // ============================================================

  const getNeighborhoodSummary = (neighborhoodId: NeighborhoodId): NeighborhoodSummary | null => {
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
      occupiedBeds += tent.beds.filter(b => b.status === 'OCCUPIED').length;
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
  };

  const getTentSummary = (tentId: string): TentSummary | null => {
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
      isAccessible: tent.isAccessible,
    };
  };

  const getTodaySummary = (): TodaySummary => {
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

    const facilitiesNeedAttention = Object.values(state.facilities).filter(
      f => f.cleaningStatus === 'NEEDS_CLEANING' || f.workingStatus === 'BROKEN'
    );

    return { checkIns, checkOuts, tentsToCleaning, facilitiesNeedAttention };
  };

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
    reserveNeighborhood,
    removeNeighborhoodReservation,
    getNeighborhoodReservations,
    checkNeighborhoodAvailability,
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
