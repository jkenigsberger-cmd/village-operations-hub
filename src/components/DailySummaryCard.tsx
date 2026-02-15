import React, { useMemo } from 'react';
import { useAdminGroups } from '@/hooks/useAdminGroups';
import { useKitchenData } from '@/hooks/useKitchenData';
import { useVillage } from '@/context/VillageContext';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import { Users } from 'lucide-react';

interface DailySummaryCardProps {
  selectedDate: Date;
}

export const DailySummaryCard: React.FC<DailySummaryCardProps> = ({ selectedDate }) => {
  const { groups } = useAdminGroups();
  const { getTimeSlotsForDate } = useKitchenData();
  const { state } = useVillage();
  const dayStr = format(selectedDate, 'yyyy-MM-dd');

  const summary = useMemo(() => {
    const activeGroups = groups.filter(
      g => g.startDate <= dayStr && g.endDate > dayStr
    );
    const sleepingGroups = activeGroups.filter(g => g.groupType === 'לינה');
    const dayOnlyGroups = groups.filter(
      g => g.startDate === dayStr && g.endDate === dayStr
    );
    const allToday = [...activeGroups, ...dayOnlyGroups.filter(d => !activeGroups.some(a => a.id === d.id))];

    const totalPeople = allToday.reduce((sum, g) => sum + (g.pax || 0), 0);
    const sleepingPeople = sleepingGroups.reduce((sum, g) => sum + (g.pax || 0), 0);

    const spacesUsed = Object.values(state.activityReservations).filter(r => r.date === dayStr).length;
    const mealsCount = getTimeSlotsForDate(dayStr).length;

    return {
      totalGroups: allToday.length,
      totalPeople,
      sleepingPeople,
      spacesUsed,
      mealsCount,
    };
  }, [groups, dayStr, state.activityReservations, getTimeSlotsForDate]);

  const subtitle = `${summary.totalPeople} אנשים · ${summary.totalGroups} קבוצות · ${summary.sleepingPeople} לנים · ${summary.spacesUsed} חללים · ${summary.mealsCount} ארוחות`;

  return (
    <div className="tile p-6 border-r-4 border-indigo-500">
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 rounded-xl flex items-center justify-center bg-indigo-500/20 text-indigo-600">
          <Users className="w-8 h-8" />
        </div>
        <div className="flex-1">
          <h3 className="text-xl font-bold">סיכום יומי</h3>
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        </div>
      </div>
    </div>
  );
};
