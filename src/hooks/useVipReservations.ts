import { useMemo } from 'react';
import { useAdminGroups } from '@/hooks/useAdminGroups';
import { format, parseISO, isBefore } from 'date-fns';
import { TentGender } from '@/types/village';

export interface VipTentReservation {
  groupId: string;
  groupName: string;
  startDate: string;
  endDate: string;
  bedsPlanned: number;
  hasExtraBed: boolean;
  gender?: TentGender;
}

export type VipReservationMap = Record<string, VipTentReservation>;

/**
 * Single source of truth for VIP tent bookings on a given date.
 * Derives occupancy from groups.vip_tent_configs + group stay dates.
 *
 * A VIP tent is booked on date D only if:
 *   group.startDate <= D  AND  group.endDate > D
 *   AND vip_tent_configs contains assignedTentCode matching the tent.
 *
 * Checkout day is NOT sleeping (hotel rule).
 *
 * Returns a map keyed by tent code string (e.g. "80", "81", ..., "89").
 */
export const useVipReservations = (selectedDate: Date | string): VipReservationMap => {
  const { groups } = useAdminGroups();

  return useMemo(() => {
    const dayStr = typeof selectedDate === 'string'
      ? selectedDate
      : format(selectedDate, 'yyyy-MM-dd');

    const result: VipReservationMap = {};

    for (const group of groups) {
      // Skip non-lodging and archived groups
      if (group.groupType !== 'לינה') continue;
      if (group.isArchived) continue;
      if (!group.vipTentConfigs || group.vipTentConfigs.length === 0) continue;

      // Hotel rule: startDate <= D < endDate
      const start = group.startDate; // YYYY-MM-DD
      const end = group.endDate;     // YYYY-MM-DD

      if (dayStr < start || dayStr >= end) continue;

      for (const config of group.vipTentConfigs) {
        if (!config.assignedTentCode) continue;
        const tentCode = config.assignedTentCode;

        result[tentCode] = {
          groupId: group.id,
          groupName: group.groupName,
          startDate: start,
          endDate: end,
          bedsPlanned: config.bedsPlanned + (config.hasExtraBed ? 1 : 0),
          hasExtraBed: !!config.hasExtraBed,
          gender: config.gender
            ? (config.gender.toUpperCase() as TentGender)
            : undefined,
        };
      }
    }

    return result;
  }, [groups, selectedDate]);
};
