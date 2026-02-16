import { useMemo } from 'react';
import { useVillage } from '@/context/VillageContext';
import { useGroupStays } from '@/hooks/useGroupStays';
import { getTotalPhysicalCapacity } from '@/lib/occupancyCalculator';
import { format } from 'date-fns';

export interface DayCapacity {
  participantsFree: number;
  vipFree: number;
  participantsSleeping: number;
  vipSleeping: number;
  participantsCapacity: number;
  vipCapacity: number;
  participantsOverCapacity: boolean;
  vipOverCapacity: boolean;
}

export function useCalendarCapacity() {
  const { state } = useVillage();
  const { allGroupStays } = useGroupStays();

  const capacity = useMemo(() => getTotalPhysicalCapacity(state), [state]);

  const getCapacityForDate = useMemo(() => {
    return (date: Date | string): DayCapacity => {
      const dayStr = typeof date === 'string' ? date : format(date, 'yyyy-MM-dd');

      let participantsSleeping = 0;
      let vipSleeping = 0;

      for (const stay of allGroupStays) {
        // Hotel rule: startDate <= day < endDate
        if (stay.startDate <= dayStr && dayStr < stay.endDate) {
          participantsSleeping += stay.participantsTotal;
          vipSleeping += stay.staffTotal;
        }
      }

      const pFree = capacity.regular - participantsSleeping;
      const vFree = capacity.vip - vipSleeping;

      return {
        participantsFree: Math.max(0, pFree),
        vipFree: Math.max(0, vFree),
        participantsSleeping,
        vipSleeping,
        participantsCapacity: capacity.regular,
        vipCapacity: capacity.vip,
        participantsOverCapacity: pFree < 0,
        vipOverCapacity: vFree < 0,
      };
    };
  }, [allGroupStays, capacity]);

  return { getCapacityForDate, capacity };
}
