import { useMemo } from 'react';
import { useVillage } from '@/context/VillageContext';
import { useAdminGroups } from '@/hooks/useAdminGroups';
import { GroupStay, GroupStayNeighborhood, GroupStayVipTent } from '@/types/groupStay';
import { format, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';

function isSleeping(start: string, end: string, day: string): boolean {
  return start <= day && day < end;
}
function isCheckIn(start: string, day: string): boolean {
  return start === day;
}
function isCheckOut(end: string, day: string): boolean {
  return end === day;
}

export const useGroupStays = () => {
  const { state } = useVillage();
  const { groups, archivedGroups } = useAdminGroups();

  const archivedGroupNames = useMemo(
    () => new Set(archivedGroups.map(g => g.groupName)),
    [archivedGroups]
  );

  const groupsById = useMemo(() => {
    const map = new Map<string, typeof groups[0]>();
    groups.forEach(g => map.set(g.id, g));
    return map;
  }, [groups]);

  const groupsByName = useMemo(() => {
    const map = new Map<string, typeof groups[0]>();
    groups.forEach(g => map.set(g.groupName, g));
    return map;
  }, [groups]);

  const allGroupStays = useMemo<GroupStay[]>(() => {
    if (!state) return [];

    // Accumulator keyed by groupId+startDate+endDate
    const stayMap = new Map<string, {
      groupId: string;
      groupName: string;
      startDate: string;
      endDate: string;
      participantsTotal: number;
      staffTotal: number;
      boysCount?: number;
      girlsCount?: number;
      neighborhoods: Map<string, GroupStayNeighborhood>;
      vipTents: Map<string, GroupStayVipTent>;
    }>();

    const getOrCreate = (groupId: string, groupName: string, startDate: string, endDate: string) => {
      const key = `${groupId}-${startDate}-${endDate}`;
      let entry = stayMap.get(key);
      if (!entry) {
        const group = groupsById.get(groupId);
        entry = {
          groupId,
          groupName,
          startDate,
          endDate,
          participantsTotal: group?.participantCount || group?.pax || 0,
          staffTotal: 0,
          boysCount: group?.boysCount,
          girlsCount: group?.girlsCount,
          neighborhoods: new Map(),
          vipTents: new Map(),
        };
        stayMap.set(key, entry);
      }
      return entry;
    };

    // 1) Neighborhood reservations
    Object.values(state.neighborhoodReservations).forEach(nr => {
      if (archivedGroupNames.has(nr.groupName)) return;
      const group = groupsByName.get(nr.groupName);
      if (!group) return;

      const entry = getOrCreate(group.id, nr.groupName, nr.checkInDate, nr.checkOutDate);
      const nhood = state.neighborhoods[nr.neighborhoodId];
      const name = nhood?.displayName || nhood?.name || nr.neighborhoodId;
      entry.neighborhoods.set(nr.neighborhoodId, { neighborhoodId: nr.neighborhoodId, neighborhoodName: name });
      // Use totalPeople from reservation if larger
      if (nr.totalPeople && nr.totalPeople > entry.participantsTotal) {
        entry.participantsTotal = nr.totalPeople;
      }
    });

    // 2) VIP from group's vipTentConfigs
    groups.forEach(group => {
      if (archivedGroupNames.has(group.groupName)) return;
      const configs = group.vipTentConfigs || [];
      const assignedConfigs = configs.filter(c => c.assignedTentCode);
      if (assignedConfigs.length === 0) return;

      const entry = getOrCreate(group.id, group.groupName, group.startDate, group.endDate);
      assignedConfigs.forEach(config => {
        const beds = config.bedsPlanned + (config.hasExtraBed ? 1 : 0);
        entry.vipTents.set(config.assignedTentCode!, {
          tentNumber: config.assignedTentCode!,
          bedsAssigned: beds,
        });
        entry.staffTotal += beds;
      });
    });

    // Ensure ALL lodging groups appear (even without allocations)
    groups.forEach(group => {
      if (archivedGroupNames.has(group.groupName)) return;
      if (group.groupType === 'יום ללא לינה') return; // day-use handled separately
      const key = `${group.id}-${group.startDate}-${group.endDate}`;
      if (!stayMap.has(key)) {
        stayMap.set(key, {
          groupId: group.id,
          groupName: group.groupName,
          startDate: group.startDate,
          endDate: group.endDate,
          participantsTotal: group.participantCount || group.pax || 0,
          staffTotal: 0,
          boysCount: group.boysCount,
          girlsCount: group.girlsCount,
          neighborhoods: new Map(),
          vipTents: new Map(),
        });
      }
    });

    // Convert to array
    return Array.from(stayMap.entries()).map(([key, e]) => {
      const group = groupsById.get(e.groupId);
      const hasNeighborhoods = e.neighborhoods.size > 0;
      const hasVip = e.vipTents.size > 0;
      return {
        key,
        groupId: e.groupId,
        groupName: e.groupName,
        startDate: e.startDate,
        endDate: e.endDate,
        participantsTotal: e.participantsTotal,
        staffTotal: e.staffTotal,
        boysCount: e.boysCount,
        girlsCount: e.girlsCount,
        neighborhoods: Array.from(e.neighborhoods.values()),
        vipTents: Array.from(e.vipTents.values()),
        vipTentCount: e.vipTents.size,
        staffCount: group?.staffCount || 0,
        isAllocated: hasNeighborhoods || hasVip,
      };
    });
  }, [state, groups, archivedGroupNames, groupsByName, groupsById]);

  // Get stays for a specific day with status annotation
  const getStaysForDay = useMemo(() => {
    return (day: string, filters: { sleeping: boolean; checkIn: boolean; checkOut: boolean }): GroupStay[] => {
      const result: GroupStay[] = [];
      for (const stay of allGroupStays) {
        const sleeping = isSleeping(stay.startDate, stay.endDate, day);
        const checkin = isCheckIn(stay.startDate, day);
        const checkout = isCheckOut(stay.endDate, day);

        let status: GroupStay['statusForDay'] | null = null;
        if (sleeping) {
          status = checkin ? 'check-in' : 'sleeping';
        }
        if (checkout && !sleeping) {
          status = 'check-out';
        }

        if (!status) continue;
        if (status === 'sleeping' && !filters.sleeping) continue;
        if (status === 'check-in' && !filters.checkIn) continue;
        if (status === 'check-out' && !filters.checkOut) continue;

        result.push({ ...stay, statusForDay: status });
      }
      return result;
    };
  }, [allGroupStays]);

  // Get counts per day for a month (for calendar badges)
  const getMonthCounts = useMemo(() => {
    return (month: Date): Map<string, { sleeping: number; checkIn: number; checkOut: number }> => {
      const start = startOfMonth(month);
      const end = endOfMonth(month);
      const days = eachDayOfInterval({ start, end });
      const counts = new Map<string, { sleeping: number; checkIn: number; checkOut: number }>();

      for (const d of days) {
        const dayStr = format(d, 'yyyy-MM-dd');
        let sleeping = 0, checkInCount = 0, checkOutCount = 0;

        for (const stay of allGroupStays) {
          if (isSleeping(stay.startDate, stay.endDate, dayStr)) sleeping++;
          if (isCheckIn(stay.startDate, dayStr)) checkInCount++;
          if (isCheckOut(stay.endDate, dayStr)) checkOutCount++;
        }

        if (sleeping > 0 || checkInCount > 0 || checkOutCount > 0) {
          counts.set(dayStr, { sleeping, checkIn: checkInCount, checkOut: checkOutCount });
        }
      }
      return counts;
    };
  }, [allGroupStays]);

  return {
    allGroupStays,
    getStaysForDay,
    getMonthCounts,
  };
};
