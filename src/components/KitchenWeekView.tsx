import React, { useMemo } from 'react';
import { format, startOfWeek, addDays, isSameDay, isToday } from 'date-fns';
import { he } from 'date-fns/locale';
import { TimeSlot, MEAL_LABELS, MealType, LOCATION_LABELS, getTotalSpecialCount, DIETARY_CATEGORIES } from '@/types/kitchen';
import { cn } from '@/lib/utils';
import { Clock, Users, AlertTriangle, MapPin } from 'lucide-react';

interface KitchenWeekViewProps {
  selectedDate: Date;
  getTimeSlotsForDate: (date: string) => TimeSlot[];
  onSlotClick: (slot: TimeSlot) => void;
}

const MEAL_ORDER: MealType[] = ['BREAKFAST', 'LUNCH', 'DINNER'];

const MEAL_ICONS: Record<MealType, string> = {
  BREAKFAST: '☀️',
  LUNCH: '🌤️',
  DINNER: '🌙',
};

const MEAL_BG: Record<MealType, string> = {
  BREAKFAST: 'bg-amber-50 border-amber-200',
  LUNCH: 'bg-orange-50 border-orange-200',
  DINNER: 'bg-indigo-50 border-indigo-200',
};

export const KitchenWeekView: React.FC<KitchenWeekViewProps> = ({
  selectedDate,
  getTimeSlotsForDate,
  onSlotClick,
}) => {
  const weekDays = useMemo(() => {
    const start = startOfWeek(selectedDate, { weekStartsOn: 0 }); // Sunday
    return Array.from({ length: 7 }, (_, i) => addDays(start, i));
  }, [selectedDate]);

  return (
    <div className="overflow-x-auto" dir="rtl">
      <div className="min-w-[700px] grid grid-cols-7 gap-1">
        {/* Day headers */}
        {weekDays.map((day) => (
          <div
            key={day.toISOString()}
            className={cn(
              'text-center py-2 rounded-t-lg font-bold text-sm border-b-2',
              isToday(day)
                ? 'bg-primary/10 border-primary text-primary'
                : 'bg-muted/50 border-border text-muted-foreground'
            )}
          >
            <div>{format(day, 'EEEE', { locale: he })}</div>
            <div className="text-lg">{format(day, 'd')}</div>
          </div>
        ))}

        {/* Day columns */}
        {weekDays.map((day) => {
          const dateStr = format(day, 'yyyy-MM-dd');
          const slots = getTimeSlotsForDate(dateStr);

          const slotsByMeal: Record<MealType, TimeSlot[]> = {
            BREAKFAST: [],
            LUNCH: [],
            DINNER: [],
          };
          slots.forEach((s) => {
            if (slotsByMeal[s.mealType]) slotsByMeal[s.mealType].push(s);
          });

          return (
            <div
              key={day.toISOString()}
              className={cn(
                'min-h-[200px] p-1 space-y-1 border rounded-b-lg',
                isToday(day) ? 'bg-primary/5 border-primary/30' : 'bg-card border-border'
              )}
            >
              {MEAL_ORDER.map((meal) => {
                const mealSlots = slotsByMeal[meal];
                if (mealSlots.length === 0) return null;

                return (
                  <div key={meal} className="space-y-0.5">
                    {mealSlots.map((slot) => {
                      const specialCount = getTotalSpecialCount(slot.specialDiets);
                      return (
                        <button
                          key={slot.id}
                          onClick={() => onSlotClick(slot)}
                          className={cn(
                            'w-full text-right p-2 rounded-lg border transition-all hover:shadow-md hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-primary',
                            MEAL_BG[meal]
                          )}
                        >
                          <div className="flex items-center gap-1 mb-1">
                            <span className="text-xs">{MEAL_ICONS[meal]}</span>
                            <span className="text-xs font-bold truncate">
                              {MEAL_LABELS[meal]}
                            </span>
                          </div>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="w-3 h-3" />
                            <span>{slot.time}</span>
                          </div>
                          <div className="flex items-center gap-1 text-xs font-semibold mt-0.5">
                            <Users className="w-3 h-3 text-primary" />
                            <span>{slot.totalPax} סועדים</span>
                          </div>
                          {slot.groups && slot.groups.length > 0 && (
                            <div className="text-[10px] text-muted-foreground truncate mt-0.5">
                              {slot.groups.map((g) => g.name).join(', ')}
                            </div>
                          )}
                          {specialCount > 0 && (
                            <div className="flex items-center gap-1 text-[10px] text-amber-600 mt-0.5">
                              <AlertTriangle className="w-3 h-3" />
                              <span>{specialCount} מיוחדים</span>
                            </div>
                          )}
                          {slot.location === 'OUTSIDE' && (
                            <div className="flex items-center gap-1 text-[10px] text-muted-foreground mt-0.5">
                              <MapPin className="w-3 h-3" />
                              <span>{LOCATION_LABELS[slot.location]}</span>
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                );
              })}

              {slots.length === 0 && (
                <div className="flex items-center justify-center h-full text-xs text-muted-foreground opacity-50 py-6">
                  אין ארוחות
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
