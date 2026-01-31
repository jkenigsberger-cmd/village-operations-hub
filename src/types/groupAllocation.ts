// ============================================================
// GROUP ALLOCATION TYPES - Capacity & Assignment Tracking
// ============================================================

export type AllocationType = 'VIP_TENT' | 'NEIGHBORHOOD' | 'TENT';

export interface AllocationRecord {
  id: string;
  groupId: string;
  dateRangeStart: string; // YYYY-MM-DD
  dateRangeEnd: string; // YYYY-MM-DD
  allocationType: AllocationType;
  resourceId: string; // e.g., VIP_83, N3, tent_id
  resourceLabel: string; // Human-readable label
  bedsAssigned: number;
  createdAt: string;
}

export interface CapacityCheckResult {
  isAvailable: boolean;
  vipBeds: {
    required: number;
    available: number;
    shortage: number;
  };
  participantBeds: {
    required: number;
    available: number;
    shortage: number;
  };
  lockedNeighborhoods: {
    id: string;
    name: string;
    groupName: string;
  }[];
}

// Storage key for allocations
export const ALLOCATIONS_STORAGE_KEY = 'aharonson_allocations';

// Extended GroupRecord fields for allocation tracking
export interface GroupAllocationFields {
  staffCount: number; // צוות
  participantCount: number; // חניכים (auto = totalPax - staffCount)
  vipPeoplePerTent: number; // Default 3
  remainingStaff: number; // init = staffCount
  remainingParticipants: number; // init = participantCount
}
