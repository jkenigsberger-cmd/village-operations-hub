import { useMemo } from 'react';
import { useVillage } from '@/context/VillageContext';
import { useAdminGroups } from '@/hooks/useAdminGroups';
import { useSupabaseAllocations } from '@/hooks/useSupabaseAllocations';
import { NeighborhoodReservation } from '@/types/village';
import { AllocationRecord } from '@/types/groupAllocation';
import { GroupRecord } from '@/types/adminGroups';
import { format, parseISO, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';

// A unified "sleeping row" for the dashboard
export interface SleepingRow {
  id: string;
  type: 'neighborhood' | 'vip';
  resourceLabel: string; // "שכונה 1", "VIP"
  groupName: string;
  groupId?: string;
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  totalPax: number;
  boysCount?: number;
  girlsCount?: number;
  // Status for a given day
  statusForDay?: 'sleeping' | 'check-in' | 'check-out';
}

/**
 * Hotel logic helpers:
 *  sleeping:  startDate <= D < endDate
 *  check-in:  startDate == D
 *  check-out: endDate == D
 */
function isSleeping(start: string, end: string, day: string): boolean {
  return start <= day && day < end;
}
function isCheckIn(start: string, day: string): boolean {
  return start === day;
}
function isCheckOut(end: string, day: string): boolean {
  return end === day;
}

function neighborhoodDisplayName(neighborhoodId: string, neighborhoods: Record<string, any>): string {
  const n = neighborhoods[neighborhoodId];
  if (n) return n.displayName || n.name;
  return neighborhoodId;
}

export const useSleepingData = () => {
  const { state } = useVillage();
  const { groups, archivedGroups } = useAdminGroups();
  const { allocations } = useSupabaseAllocations();

  const archivedGroupNames = useMemo(
    () => new Set(archivedGroups.map(g => g.groupName)),
    [archivedGroups]
  );

  // Build a map of groupName -> GroupRecord for enrichment
  const groupsByName = useMemo(() => {
    const map = new Map<string, GroupRecord>();
    groups.forEach(g => map.set(g.groupName, g));
    return map;
  }, [groups]);

  const groupsById = useMemo(() => {
    const map = new Map<string, GroupRecord>();
    groups.forEach(g => map.set(g.id, g));
    return map;
  }, [groups]);

  // All sleeping rows (neighborhood reservations + VIP allocations)
  const allSleepingRows = useMemo<SleepingRow[]>(() => {
    if (!state) return [];

    const rows: SleepingRow[] = [];

    // 1) Neighborhood reservations
    Object.values(state.neighborhoodReservations).forEach((nr: NeighborhoodReservation) => {
      if (archivedGroupNames.has(nr.groupName)) return;

      const group = groupsByName.get(nr.groupName);
      rows.push({
        id: `nr-${nr.id}`,
        type: 'neighborhood',
        resourceLabel: neighborhoodDisplayName(nr.neighborhoodId, state.neighborhoods),
        groupName: nr.groupName,
        groupId: group?.id,
        startDate: nr.checkInDate,
        endDate: nr.checkOutDate,
        totalPax: nr.totalPeople || group?.participantCount || group?.pax || 0,
        boysCount: group?.boysCount,
        girlsCount: group?.girlsCount,
      });
    });

    // 2) VIP allocations (allocation_type = 'VIP_TENT')
    // Aggregate by groupId + dateRange to show one row per group
    const vipByGroup = new Map<string, { beds: number; start: string; end: string; groupId: string }>();
    allocations
      .filter(a => a.allocationType === 'VIP_TENT')
      .forEach((a: AllocationRecord) => {
        const key = `${a.groupId}-${a.dateRangeStart}-${a.dateRangeEnd}`;
        const existing = vipByGroup.get(key);
        if (existing) {
          existing.beds += a.bedsAssigned;
        } else {
          vipByGroup.set(key, {
            beds: a.bedsAssigned,
            start: a.dateRangeStart,
            end: a.dateRangeEnd,
            groupId: a.groupId,
          });
        }
      });

    vipByGroup.forEach((val, key) => {
      const group = groupsById.get(val.groupId);
      if (!group) return;
      if (archivedGroupNames.has(group.groupName)) return;

      rows.push({
        id: `vip-${key}`,
        type: 'vip',
        resourceLabel: 'VIP',
        groupName: group.groupName,
        groupId: group.id,
        startDate: val.start,
        endDate: val.end,
        totalPax: val.beds,
        boysCount: undefined, // VIP doesn't have boys/girls split
        girlsCount: undefined,
      });
    });

    return rows;
  }, [state, allocations, archivedGroupNames, groupsByName, groupsById]);

  // Get rows for a specific day with status annotation
  const getRowsForDay = useMemo(() => {
    return (day: string, filters: { sleeping: boolean; checkIn: boolean; checkOut: boolean }): SleepingRow[] => {
      const result: SleepingRow[] = [];
      for (const row of allSleepingRows) {
        const sleeping = isSleeping(row.startDate, row.endDate, day);
        const checkin = isCheckIn(row.startDate, day);
        const checkout = isCheckOut(row.endDate, day);

        if (filters.sleeping && sleeping) {
          result.push({ ...row, statusForDay: checkin ? 'check-in' : 'sleeping' });
        } else if (filters.checkIn && checkin && !sleeping) {
          // check-in only case (shouldn't normally happen since sleeping includes check-in day)
          result.push({ ...row, statusForDay: 'check-in' });
        }
        // Check-out: endDate == day, and NOT sleeping that night
        if (filters.checkOut && checkout) {
          // Avoid duplicates: only add if not already added as sleeping
          const alreadyAdded = result.find(r => r.id === row.id);
          if (!alreadyAdded) {
            result.push({ ...row, statusForDay: 'check-out' });
          } else if (alreadyAdded.statusForDay !== 'check-out') {
            // It was added as sleeping/check-in, add another entry for check-out
            // Actually, per hotel logic checkout day is NOT sleeping, so this shouldn't happen
          }
        }
      }
      return result;
    };
  }, [allSleepingRows]);

  // Get sleeping counts per day for a month (for calendar badges)
  const getMonthSleepingCounts = useMemo(() => {
    return (month: Date): Map<string, { sleeping: number; checkIn: number; checkOut: number }> => {
      const start = startOfMonth(month);
      const end = endOfMonth(month);
      const days = eachDayOfInterval({ start, end });
      const counts = new Map<string, { sleeping: number; checkIn: number; checkOut: number }>();

      for (const d of days) {
        const dayStr = format(d, 'yyyy-MM-dd');
        let sleeping = 0;
        let checkInCount = 0;
        let checkOutCount = 0;

        for (const row of allSleepingRows) {
          if (isSleeping(row.startDate, row.endDate, dayStr)) sleeping++;
          if (isCheckIn(row.startDate, dayStr)) checkInCount++;
          if (isCheckOut(row.endDate, dayStr)) checkOutCount++;
        }

        if (sleeping > 0 || checkInCount > 0 || checkOutCount > 0) {
          counts.set(dayStr, { sleeping, checkIn: checkInCount, checkOut: checkOutCount });
        }
      }

      return counts;
    };
  }, [allSleepingRows]);

  return {
    allSleepingRows,
    getRowsForDay,
    getMonthSleepingCounts,
  };
};
