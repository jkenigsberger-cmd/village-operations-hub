import React, { useMemo, useState } from 'react';
import { useAdminGroups } from '@/hooks/useAdminGroups';
import { useKitchenData } from '@/hooks/useKitchenData';
import { useVillage } from '@/context/VillageContext';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import { Users, ChevronLeft, BedDouble, CalendarCheck, UtensilsCrossed, LayoutGrid } from 'lucide-react';
import { ResponsiveModal } from '@/components/ResponsiveModal';
import { MEAL_LABELS } from '@/types/kitchen';

interface DailySummaryCardProps {
  selectedDate: Date;
}

export const DailySummaryCard: React.FC<DailySummaryCardProps> = ({ selectedDate }) => {
  const { activeGroups } = useAdminGroups();
  const { getTimeSlotsForDate } = useKitchenData();
  const { state } = useVillage();
  const dayStr = format(selectedDate, 'yyyy-MM-dd');
  const [open, setOpen] = useState(false);

  const summary = useMemo(() => {
    const overnightGroups = activeGroups.filter(
      g => g.startDate <= dayStr && g.endDate > dayStr
    );
    const sleepingGroups = overnightGroups.filter(g => g.groupType === 'לינה');
    const dayOnlyGroups = activeGroups.filter(
      g => g.startDate === dayStr && g.endDate === dayStr
    );
    const allToday = [...overnightGroups, ...dayOnlyGroups.filter(d => !overnightGroups.some(a => a.id === d.id))];

    const totalPeople = allToday.reduce((sum, g) => sum + (g.pax || 0), 0);
    const sleepingPeople = sleepingGroups.reduce((sum, g) => sum + (g.pax || 0), 0);

    const checkInGroups = activeGroups.filter(g => g.startDate === dayStr);
    const checkOutGroups = activeGroups.filter(g => g.endDate === dayStr);

    const reservations = Object.values(state.activityReservations).filter(r => r.date === dayStr);
    const meals = getTimeSlotsForDate(dayStr);

    return {
      totalGroups: allToday.length,
      totalPeople,
      sleepingPeople,
      dayOnlyPeople: totalPeople - sleepingPeople,
      spacesUsed: reservations.length,
      mealsCount: meals.length,
      allToday,
      sleepingGroups,
      dayOnlyGroups,
      checkInGroups,
      checkOutGroups,
      reservations,
      meals,
    };
  }, [activeGroups, dayStr, state.activityReservations, getTimeSlotsForDate]);

  

  const formattedDate = format(selectedDate, 'EEEE, d בMMMM', { locale: he });

  return (
    <>
      <div
        className="tile p-6 border-r-4 border-indigo-500 cursor-pointer hover:shadow-lg transition-all"
        onClick={() => setOpen(true)}
      >
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl flex items-center justify-center bg-indigo-500/20 text-indigo-600">
            <Users className="w-8 h-8" />
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-bold">סיכום יומי</h3>
            <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-sm text-muted-foreground">
              <span className="whitespace-nowrap">{summary.totalPeople} אנשים</span>
              <span>·</span>
              <span className="whitespace-nowrap">{summary.totalGroups} קבוצות</span>
              <span>·</span>
              <span className="whitespace-nowrap">{summary.sleepingPeople} לנים</span>
              <span>·</span>
              <span className="whitespace-nowrap">{summary.spacesUsed} חללים</span>
              <span>·</span>
              <span className="whitespace-nowrap">{summary.mealsCount} ארוחות</span>
            </div>
          </div>
          <ChevronLeft className="w-5 h-5 text-muted-foreground" />
        </div>
      </div>

      <ResponsiveModal open={open} onOpenChange={setOpen} title={`סיכום יומי - ${formattedDate}`} className="sm:max-w-xl">
        <div className="space-y-6 p-2">
          {/* Section 1: Groups */}
          <section>
            <div className="flex items-center gap-2 mb-3">
              <CalendarCheck className="w-5 h-5 text-indigo-500" />
              <h4 className="font-semibold text-base">קבוצות ({summary.totalGroups})</h4>
            </div>
            {summary.allToday.length === 0 ? (
              <p className="text-sm text-muted-foreground">אין קבוצות היום</p>
            ) : (
              <ul className="space-y-1.5">
                {summary.allToday.map(g => (
                  <li key={g.id} className="flex items-center justify-between text-sm bg-muted/50 rounded-lg px-3 py-2">
                    <span className="font-medium">{g.groupName}</span>
                    <span className="text-muted-foreground">{g.pax} איש · {g.groupType}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Section 2: People */}
          <section>
            <div className="flex items-center gap-2 mb-3">
              <BedDouble className="w-5 h-5 text-indigo-500" />
              <h4 className="font-semibold text-base">אנשים ({summary.totalPeople})</h4>
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="bg-muted/50 rounded-lg px-3 py-2">
                <span className="text-muted-foreground">לנים: </span>
                <span className="font-medium">{summary.sleepingPeople}</span>
              </div>
              <div className="bg-muted/50 rounded-lg px-3 py-2">
                <span className="text-muted-foreground">יום בלבד: </span>
                <span className="font-medium">{summary.dayOnlyPeople}</span>
              </div>
            </div>
            {summary.checkInGroups.length > 0 && (
              <div className="mt-2">
                <p className="text-xs text-muted-foreground mb-1">✅ צ׳ק-אין היום:</p>
                <div className="flex flex-wrap gap-1">
                  {summary.checkInGroups.map(g => (
                    <span key={g.id} className="text-xs bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 rounded px-2 py-0.5">{g.groupName} ({g.pax})</span>
                  ))}
                </div>
              </div>
            )}
            {summary.checkOutGroups.length > 0 && (
              <div className="mt-2">
                <p className="text-xs text-muted-foreground mb-1">🚪 צ׳ק-אאוט היום:</p>
                <div className="flex flex-wrap gap-1">
                  {summary.checkOutGroups.map(g => (
                    <span key={g.id} className="text-xs bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300 rounded px-2 py-0.5">{g.groupName} ({g.pax})</span>
                  ))}
                </div>
              </div>
            )}
          </section>

          {/* Section 3: Operations */}
          <section>
            <div className="flex items-center gap-2 mb-3">
              <LayoutGrid className="w-5 h-5 text-indigo-500" />
              <h4 className="font-semibold text-base">פעילות</h4>
            </div>
            <div className="space-y-3">
              <div>
                <p className="text-xs text-muted-foreground mb-1">חללים משותפים ({summary.spacesUsed})</p>
                {summary.reservations.length === 0 ? (
                  <p className="text-sm text-muted-foreground">אין הזמנות</p>
                ) : (
                  <ul className="space-y-1">
                    {summary.reservations.map(r => (
                      <li key={r.id} className="text-sm bg-muted/50 rounded-lg px-3 py-1.5 flex justify-between">
                        <span>{r.groupName}</span>
                        <span className="text-muted-foreground">{r.startTime}–{r.endTime}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                  <UtensilsCrossed className="w-3.5 h-3.5" /> ארוחות ({summary.mealsCount})
                </p>
                {summary.meals.length === 0 ? (
                  <p className="text-sm text-muted-foreground">אין ארוחות</p>
                ) : (
                  <ul className="space-y-1">
                    {summary.meals.map(m => (
                      <li key={m.id} className="text-sm bg-muted/50 rounded-lg px-3 py-1.5 flex justify-between">
                        <span>{MEAL_LABELS[m.mealType]}</span>
                        <span className="text-muted-foreground">{m.time} · {m.totalPax} סועדים</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </section>
        </div>
      </ResponsiveModal>
    </>
  );
};
