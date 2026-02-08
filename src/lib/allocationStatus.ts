// ============================================================
// ALLOCATION STATUS UTILITIES
// Computes allocation completeness from allocations + group counts
// ============================================================

import { AllocationRecord } from '@/types/groupAllocation';
import { GroupRecord } from '@/types/adminGroups';

export type AllocationStatusType = 'needs_allocation' | 'partial' | 'fully_allocated';

export interface AllocationStatusInfo {
  status: AllocationStatusType;
  label: string;
  badgeVariant: 'destructive' | 'secondary' | 'default';
  vipAssigned: number;
  vipRequired: number;
  participantAssigned: number;
  participantRequired: number;
}

/**
 * Compute allocation status for a group based on allocations table.
 * Does NOT rely on stored flags - always computes from source of truth.
 */
export function computeAllocationStatus(
  group: GroupRecord,
  allocations: AllocationRecord[]
): AllocationStatusInfo {
  const staffCount = group.staffCount ?? 0;
  const participantCount = group.participantCount ?? (group.pax - staffCount);
  
  // Get allocations for this group
  const groupAllocations = allocations.filter(a => a.groupId === group.id);
  
  // VIP allocations (staff)
  const vipAllocations = groupAllocations.filter(a => a.allocationType === 'VIP_TENT');
  const vipAssigned = vipAllocations.reduce((sum, a) => sum + a.bedsAssigned, 0);
  
  // Also count VIP configs that have been assigned to specific tents
  const vipConfigAssigned = (group.vipTentConfigs || [])
    .filter(c => c.assignedTentCode)
    .reduce((sum, c) => sum + c.bedsPlanned + (c.hasExtraBed ? 1 : 0), 0);
  
  // Use whichever is higher (in case data is duplicated during transition)
  const totalVipAssigned = Math.max(vipAssigned, vipConfigAssigned);
  
  // Participant allocations (neighborhoods/tents)
  const participantAllocations = groupAllocations.filter(
    a => a.allocationType === 'NEIGHBORHOOD' || a.allocationType === 'TENT'
  );
  const participantAssigned = participantAllocations.reduce((sum, a) => sum + a.bedsAssigned, 0);
  
  // Determine status
  const vipComplete = totalVipAssigned >= staffCount;
  const participantsComplete = participantAssigned >= participantCount;
  
  const hasAnyAllocation = totalVipAssigned > 0 || participantAssigned > 0;
  const isFullyAllocated = vipComplete && participantsComplete;
  
  let status: AllocationStatusType;
  let label: string;
  let badgeVariant: 'destructive' | 'secondary' | 'default';
  
  if (isFullyAllocated) {
    status = 'fully_allocated';
    label = 'משובץ ✓';
    badgeVariant = 'default';
  } else if (hasAnyAllocation) {
    status = 'partial';
    label = 'שיבוץ חלקי';
    badgeVariant = 'secondary';
  } else {
    status = 'needs_allocation';
    label = 'דורש שיבוץ';
    badgeVariant = 'destructive';
  }
  
  return {
    status,
    label,
    badgeVariant,
    vipAssigned: totalVipAssigned,
    vipRequired: staffCount,
    participantAssigned,
    participantRequired: participantCount,
  };
}

/**
 * Check if a group needs allocation (for notifications section).
 * Day-use groups and archived groups don't need allocation.
 */
export function groupNeedsAllocation(
  group: GroupRecord,
  allocations: AllocationRecord[]
): boolean {
  // Day-use groups don't need allocation
  if (group.groupType === 'יום ללא לינה') return false;
  
  // Archived groups don't show in notifications
  if (group.isArchived) return false;
  
  const status = computeAllocationStatus(group, allocations);
  return status.status !== 'fully_allocated';
}

/**
 * Get all sleeping groups (לינה) for the allocations list.
 * These always appear in the allocations view, regardless of status.
 */
export function getSleepingGroups(groups: GroupRecord[]): GroupRecord[] {
  return groups.filter(g => 
    g.groupType !== 'יום ללא לינה' && !g.isArchived
  );
}
