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
  NeighborhoodId,
  TentGender
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
  updateTentCleaningStatus: (tentId: string, status: CleaningStatus, assignedTo?: string) => void;
  updateTentGroupName: (tentId: string, groupName: string) => void;
  updateTentDates: (tentId: string, checkIn?: string, checkOut?: string) => void;
  updateTentNotes: (tentId: string, notes: string) => void;
  updateTentPeopleCount: (tentId: string, count: number | undefined) => void;
  updateTentGender: (tentId: string, gender: TentGender) => void;
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
  updateActivitySpaceStatus: (spaceId: string, cleaningStatus?: CleaningStatus, workingStatus?: WorkingStatus) => void;
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

    saveState((prev) => {
      const bed = prev.beds[bedId];
      if (!bed) return prev;

      const updatedBeds = {
        ...prev.beds,
        [bedId]: { ...bed, guestName },
      };

      const tent = prev.tents[bed.tentId];
      if (!tent) {
        return { ...prev, beds: updatedBeds };
      }

      const updatedTentBeds = tent.beds.map((b) => (b.id === bedId ? { ...b, guestName } : b));
      const updatedTents = {
        ...prev.tents,
        [bed.tentId]: { ...tent, beds: updatedTentBeds, lastUpdated: new Date().toISOString() },
      };

      return { ...prev, beds: updatedBeds, tents: updatedTents };
    });
  };

  const clearBedGuest = (bedId: string) => {
    updateBedGuestName(bedId, '');
  };

  // ============================================================
  // TENT OPERATIONS
  // ============================================================

  const updateTentCleaningStatus = (tentId: string, cleaningStatus: CleaningStatus, assignedTo?: string) => {
    if (!state) return;

    saveState((prev) => {
      const tent = prev.tents[tentId];
      if (!tent) return prev;

      const updatedTents = {
        ...prev.tents,
        [tentId]: {
          ...tent,
          cleaningStatus,
          cleaningAssignedTo: assignedTo ?? tent.cleaningAssignedTo,
          lastUpdated: new Date().toISOString(),
        },
      };

      return { ...prev, tents: updatedTents };
    });
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

  const updateTentPeopleCount = (tentId: string, peopleCount: number | undefined) => {
    if (!state) return;
    
    saveState((prev) => {
      const tent = prev.tents[tentId];
      if (!tent) return prev;

      // Validate count doesn't exceed beds
      const validCount = peopleCount !== undefined 
        ? Math.min(Math.max(0, peopleCount), tent.beds.length)
        : undefined;

      const updatedTents = {
        ...prev.tents,
        [tentId]: { ...tent, peopleCount: validCount, lastUpdated: new Date().toISOString() },
      };

      return { ...prev, tents: updatedTents };
    });
  };

  const updateTentGender = (tentId: string, gender: TentGender) => {
    if (!state) return;
    
    const tent = state.tents[tentId];
    if (!tent) return;

    const updatedTents = {
      ...state.tents,
      [tentId]: { ...tent, gender, lastUpdated: new Date().toISOString() },
    };

    saveState({ ...state, tents: updatedTents });
  };

  const updateTentPrivateBathroom = (tentId: string, hasPrivateBathroom: boolean) => {
    if (!state) return;
    
    const tent = state.tents[tentId];
    if (!tent) return;

    const updatedTents = {
      ...state.tents,
      [tentId]: { ...tent, hasPrivateBathroom, lastUpdated: new Date().toISOString() },
    };

    saveState({ ...state, tents: updatedTents });
  };

  const updateTentPrivateShower = (tentId: string, hasPrivateShower: boolean) => {
    if (!state) return;
    
    const tent = state.tents[tentId];
    if (!tent) return;

    const updatedTents = {
      ...state.tents,
      [tentId]: { ...tent, hasPrivateShower, lastUpdated: new Date().toISOString() },
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

  const updateTentCleaningAssignment = (tentId: string, assignedTo: string) => {
    if (!state) return;
    
    const tent = state.tents[tentId];
    if (!tent) return;

    const updatedTents = {
      ...state.tents,
      [tentId]: { ...tent, cleaningAssignedTo: assignedTo, lastUpdated: new Date().toISOString() },
    };

    saveState({ ...state, tents: updatedTents });
  };

  const reportTentFacilityIssue = (
    tentId: string,
    facilityType: 'bathroom' | 'shower',
    status: WorkingStatus,
    notes: string,
    image?: string
  ) => {
    if (!state) return;

    saveState((prev) => {
      const tent = prev.tents[tentId];
      if (!tent) return prev;

      const updates =
        facilityType === 'bathroom'
          ? { bathroomWorkingStatus: status, bathroomMaintenanceNotes: notes, bathroomMaintenanceImage: image }
          : { showerWorkingStatus: status, showerMaintenanceNotes: notes, showerMaintenanceImage: image };

      const updatedTents = {
        ...prev.tents,
        [tentId]: { ...tent, ...updates, lastUpdated: new Date().toISOString() },
      };

      return { ...prev, tents: updatedTents };
    });
  };

  const resolveTentFacilityIssue = (tentId: string, facilityType: 'bathroom' | 'shower') => {
    if (!state) return;
    
    const tent = state.tents[tentId];
    if (!tent) return;

    const updates = facilityType === 'bathroom' 
      ? { bathroomWorkingStatus: 'WORKING' as WorkingStatus, bathroomMaintenanceNotes: undefined, bathroomMaintenanceImage: undefined }
      : { showerWorkingStatus: 'WORKING' as WorkingStatus, showerMaintenanceNotes: undefined, showerMaintenanceImage: undefined };

    const updatedTents = {
      ...state.tents,
      [tentId]: { ...tent, ...updates, lastUpdated: new Date().toISOString() },
    };

    saveState({ ...state, tents: updatedTents });
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

  const updateActivitySpaceStatus = (spaceId: string, cleaningStatus?: CleaningStatus, workingStatus?: WorkingStatus) => {
    if (!state) return;

    const space = state.activitySpaces[spaceId];
    if (!space) return;

    saveState({
      ...state,
      activitySpaces: {
        ...state.activitySpaces,
        [spaceId]: {
          ...space,
          ...(cleaningStatus !== undefined && { cleaningStatus }),
          ...(workingStatus !== undefined && { workingStatus }),
        },
      },
    });
  };

  const updateActivitySpaceNotes = (spaceId: string, notes: string) => {
    if (!state) return;

    const space = state.activitySpaces[spaceId];
    if (!space) return;

    saveState({
      ...state,
      activitySpaces: {
        ...state.activitySpaces,
        [spaceId]: {
          ...space,
          notes,
        },
      },
    });
  };

  const reportActivitySpaceIssue = (spaceId: string, status: WorkingStatus, notes: string, image?: string) => {
    if (!state) return;

    const space = state.activitySpaces[spaceId];
    if (!space) return;

    saveState({
      ...state,
      activitySpaces: {
        ...state.activitySpaces,
        [spaceId]: {
          ...space,
          workingStatus: status,
          maintenanceNotes: notes,
          maintenanceImage: image,
        },
      },
    });
  };

  const resolveActivitySpaceIssue = (spaceId: string) => {
    if (!state) return;

    const space = state.activitySpaces[spaceId];
    if (!space) return;

    saveState({
      ...state,
      activitySpaces: {
        ...state.activitySpaces,
        [spaceId]: {
          ...space,
          workingStatus: 'WORKING',
          maintenanceNotes: undefined,
          maintenanceImage: undefined,
        },
      },
    });
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
      reservationType: reservation.reservationType || 'FULL_NEIGHBORHOOD',
    };

    // Update all tents in the neighborhood
    const updatedTents = { ...state.tents };
    const updatedBeds = { ...state.beds };

    // Assign genders based on distribution
    const genderDistribution = reservation.genderDistribution;
    let femaleCount = genderDistribution?.female || 0;
    let maleCount = genderDistribution?.male || 0;
    let mixedCount = genderDistribution?.mixed || 0;
    let tentIndex = 0;

    for (const tentId of neighborhood.tentIds) {
      const tent = updatedTents[tentId];
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

      // Set group name, check-in and check-out dates
      updatedTents[tentId] = {
        ...tent,
        groupName: reservation.groupName,
        checkInDate: reservation.checkInDate,
        checkOutDate: reservation.checkOutDate,
        gender: assignedGender || tent.gender,
        lastUpdated: new Date().toISOString(),
      };

      // Reserve all beds
      const updatedTentBeds = tent.beds.map(b => {
        const reservedBed = { ...b, status: 'RESERVED' as BedStatus };
        updatedBeds[b.id] = reservedBed;
        return reservedBed;
      });
      updatedTents[tentId].beds = updatedTentBeds;
      tentIndex++;
    }

    const updatedReservations = {
      ...state.neighborhoodReservations,
      [newReservation.id]: newReservation,
    };

    saveState({ ...state, tents: updatedTents, beds: updatedBeds, neighborhoodReservations: updatedReservations });
    return { success: true };
  };

  const checkTentAvailability = (
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
  };

  const reserveSpecificTents = (params: {
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
    if (!state) return { success: false, error: 'Estado no disponible' };

    const { neighborhoodId, tentIds, tentGenders, groupName, checkInDate, checkOutDate, totalPeople, contactName, contactPhone, notes } = params;

    // Validate dates
    if (checkInDate >= checkOutDate) {
      return { success: false, error: 'La fecha de check-out debe ser posterior al check-in' };
    }

    // Check availability of each tent
    for (const tentId of tentIds) {
      const availability = checkTentAvailability(tentId, checkInDate, checkOutDate);
      if (!availability.available) {
        const tent = state.tents[tentId];
        return { 
          success: false, 
          error: `Carpa ${tent?.code} tiene conflicto con: ${availability.conflictingGroup || 'reserva existente'}` 
        };
      }
    }

    // Calculate total beds
    let totalBeds = 0;
    for (const tentId of tentIds) {
      const tent = state.tents[tentId];
      if (tent) totalBeds += tent.beds.length;
    }

    const newReservation: NeighborhoodReservation = {
      id: Math.random().toString(36).substring(2, 11),
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
      createdAt: new Date().toISOString(),
    };

    // Update selected tents
    const updatedTents = { ...state.tents };
    const updatedBeds = { ...state.beds };

    for (const tentId of tentIds) {
      const tent = updatedTents[tentId];
      if (!tent) continue;

      // Get assigned gender for this tent
      const assignedGender = tentGenders?.[tentId] || tent.gender;

      updatedTents[tentId] = {
        ...tent,
        groupName,
        checkInDate,
        checkOutDate,
        gender: assignedGender,
        lastUpdated: new Date().toISOString(),
      };

      // Reserve all beds in selected tents
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

    saveState((prev) => {
      const updatedTasks = {
        ...(prev.dailyTasks || {}),
        [newTask.id]: newTask,
      };

      return { ...prev, dailyTasks: updatedTasks };
    });
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
      hasPrivateShower: tent.hasPrivateShower,
      isAccessible: tent.isAccessible,
      gender: tent.gender,
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
    updateTentPeopleCount,
    updateTentGender,
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
