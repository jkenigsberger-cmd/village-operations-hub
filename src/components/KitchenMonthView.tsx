import React, { useMemo, useState } from 'react';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isToday,
} from 'date-fns';
import { he } from 'date-fns/locale';
import { TimeSlot, MEAL_LABELS, MealType, getTotalSpecialCount } from '@/types/kitchen';
import { cn } from '@/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Users, AlertTriangle, Clock } from 'lucide-react';

interface KitchenMonthViewProps {
  selectedDate: Date;
  getTimeSlotsForDate: (date: string) => TimeSlot[];
  onSlotClick: (slot: TimeSlot) => void;
}

const MEAL_ORDER: MealType[] = ['BREAKFAST', 'LUNCH', 'DINNER'];

const MEAL_DOT: Record<MealType, string> = {
  BREAKFAST: 'bg-amber-400',
  LUNCH: 'bg-orange-400',
  DINNER: 'bg-indigo-400',
};

const DAY_NAMES = ['א׳', 'ב׳', 'ג׳', 'ד׳', 'ה׳', 'ו׳', 'ש׳'];

export const KitchenMonthView: React.FC<KitchenMonthViewProps> = ({
  selectedDate,
  getTimeSlotsForDate,
  onSlotClick,
}) => {
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(selectedDate);
    const monthEnd = endOfMonth(selectedDate);
    const start = startOfWeek(monthStart, { weekStartsOn: 0 });
    const end = endOfWeek(monthEnd, { weekStartsOn: 0 });
    return eachDayOfInterval({ start, end });
  }, [selectedDate]);

  return (
    <div dir="rtl">
      {/* Day headers */}
      <div className="grid grid-cols-7 gap-1 mb-1">
        {DAY_NAMES.map((name) => (
          <div
            key={name}
            className="text-center py-1 text-sm font-bold text-muted-foreground"
          >
            {name}
          </div>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map((day) => {
          const dateStr = format(day, 'yyyy-MM-dd');
          const slots = getTimeSlotsForDate(dateStr);
          const isCurrentMonth = isSameMonth(day, selectedDate);

          // Group by meal
          const mealSummary: { type: MealType; totalPax: number; slots: TimeSlot[] }[] = [];
          MEAL_ORDER.forEach((meal) => {
            const mealSlots = slots.filter((s) => s.mealType === meal);
            if (mealSlots.length > 0) {
              mealSummary.push({
                type: meal,
                totalPax: mealSlots.reduce((sum, s) => sum + s.totalPax, 0),
                slots: mealSlots,
              });
            }
          });

          const hasSpecials = slots.some(
            (s) => getTotalSpecialCount(s.specialDiets) > 0
          );

          return (
            <div
              key={dateStr}
              className={cn(
                'min-h-[80px] md:min-h-[100px] p-1 border rounded-lg transition-colors',
                !isCurrentMonth && 'opacity-30',
                isToday(day)
                  ? 'bg-primary/10 border-primary/40'
                  : 'bg-card border-border'
              )}
            >
              {/* Day number */}
              <div
                className={cn(
                  'text-xs font-bold mb-0.5 text-center',
                  isToday(day) ? 'text-primary' : 'text-foreground'
                )}
              >
                {format(day, 'd')}
              </div>

              {/* Compact meal items (up to 3) */}
              {mealSummary.slice(0, 3).map((meal) => (
                <Popover key={meal.type}>
                  <PopoverTrigger asChild>
                    <button
                      className="w-full flex items-center gap-0.5 text-[10px] rounded px-1 py-0.5 hover:bg-muted/50 transition-colors text-right"
                    >
                      <span
                        className={cn('w-2 h-2 rounded-full shrink-0', MEAL_DOT[meal.type])}
                      />
                      <span className="truncate font-medium">
                        {MEAL_LABELS[meal.type]}
                      </span>
                      <span className="text-muted-foreground mr-auto">{meal.totalPax}</span>
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-64 p-3" dir="rtl" align="center">
                    <div className="space-y-2">
                      <h4 className="font-bold text-sm">
                        {MEAL_LABELS[meal.type]} – {format(day, 'd בMMMM', { locale: he })}
                      </h4>
                      {meal.slots.map((slot) => {
                        const specialCount = getTotalSpecialCount(slot.specialDiets);
                        return (
                          <button
                            key={slot.id}
                            onClick={() => onSlotClick(slot)}
                            className="w-full text-right p-2 bg-muted/30 rounded-lg border border-border hover:border-primary transition-colors"
                          >
                            <div className="flex items-center gap-2 text-sm">
                              <Clock className="w-3 h-3 text-muted-foreground" />
                              <span className="font-medium">{slot.time}</span>
                              <span className="flex items-center gap-1 mr-auto">
                                <Users className="w-3 h-3 text-primary" />
                                <span className="font-bold">{slot.totalPax}</span>
                              </span>
                            </div>
                            {slot.groups && slot.groups.length > 0 && (
                              <div className="text-xs text-muted-foreground mt-1 truncate">
                                {slot.groups.map((g) => g.name).join(', ')}
                              </div>
                            )}
                            {specialCount > 0 && (
                              <div className="flex items-center gap-1 text-xs text-amber-600 mt-1">
                                <AlertTriangle className="w-3 h-3" />
                                <span>{specialCount} מיוחדים</span>
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </PopoverContent>
                </Popover>
              ))}

              {/* Specials indicator */}
              {hasSpecials && mealSummary.length === 0 && null}
              {hasSpecials && (
                <div className="flex justify-center mt-0.5">
                  <AlertTriangle className="w-3 h-3 text-amber-500" />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 mt-3 text-xs text-muted-foreground">
        {MEAL_ORDER.map((meal) => (
          <div key={meal} className="flex items-center gap-1">
            <span className={cn('w-2 h-2 rounded-full', MEAL_DOT[meal])} />
            <span>{MEAL_LABELS[meal]}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
