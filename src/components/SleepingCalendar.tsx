import React, { useMemo, useState } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday as isTodayFn, startOfWeek, endOfWeek, addMonths, subMonths } from 'date-fns';
import { he } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SleepingCalendarProps {
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  monthCounts: Map<string, { sleeping: number; checkIn: number; checkOut: number }>;
}

const DAY_NAMES = ['א׳', 'ב׳', 'ג׳', 'ד׳', 'ה׳', 'ו׳', 'ש׳'];

export const SleepingCalendar: React.FC<SleepingCalendarProps> = ({
  selectedDate,
  onSelectDate,
  monthCounts,
}) => {
  const [viewMonth, setViewMonth] = useState<Date>(startOfMonth(selectedDate));

  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(viewMonth);
    const monthEnd = endOfMonth(viewMonth);
    const calStart = startOfWeek(monthStart, { weekStartsOn: 0 });
    const calEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
    return eachDayOfInterval({ start: calStart, end: calEnd });
  }, [viewMonth]);

  const isCurrentMonth = (d: Date) => d.getMonth() === viewMonth.getMonth();

  return (
    <div className="rounded-xl border bg-card p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <Button variant="ghost" size="icon" onClick={() => setViewMonth(subMonths(viewMonth, 1))}>
          <ChevronRight className="w-4 h-4" />
        </Button>
        <h3 className="font-semibold text-lg">
          {format(viewMonth, 'MMMM yyyy', { locale: he })}
        </h3>
        <Button variant="ghost" size="icon" onClick={() => setViewMonth(addMonths(viewMonth, 1))}>
          <ChevronLeft className="w-4 h-4" />
        </Button>
      </div>

      {/* Day names */}
      <div className="grid grid-cols-7 mb-1">
        {DAY_NAMES.map(d => (
          <div key={d} className="text-center text-xs text-muted-foreground font-medium py-1">{d}</div>
        ))}
      </div>

      {/* Days grid */}
      <div className="grid grid-cols-7 gap-0.5">
        {calendarDays.map((day) => {
          const dayStr = format(day, 'yyyy-MM-dd');
          const counts = monthCounts.get(dayStr);
          const isSelected = isSameDay(day, selectedDate);
          const isToday = isTodayFn(day);
          const inMonth = isCurrentMonth(day);

          return (
            <button
              key={dayStr}
              onClick={() => onSelectDate(day)}
              className={cn(
                "relative flex flex-col items-center p-1 rounded-lg text-sm transition-colors min-h-[48px] justify-start",
                !inMonth && "opacity-30",
                isSelected && "bg-primary text-primary-foreground",
                !isSelected && isToday && "bg-accent",
                !isSelected && !isToday && "hover:bg-muted/50"
              )}
            >
              <span className={cn("text-xs font-medium", isSelected && "font-bold")}>
                {day.getDate()}
              </span>
              {/* Dots for sleeping data */}
              {counts && (
                <div className="flex gap-0.5 mt-0.5 flex-wrap justify-center">
                  {counts.checkIn > 0 && (
                    <span className={cn("w-1.5 h-1.5 rounded-full", isSelected ? "bg-primary-foreground" : "bg-green-500")} />
                  )}
                  {counts.sleeping > 0 && (
                    <span className={cn("w-1.5 h-1.5 rounded-full", isSelected ? "bg-primary-foreground" : "bg-blue-500")} />
                  )}
                  {counts.checkOut > 0 && (
                    <span className={cn("w-1.5 h-1.5 rounded-full", isSelected ? "bg-primary-foreground" : "bg-orange-500")} />
                  )}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-3 pt-3 border-t text-xs text-muted-foreground justify-center">
        <div className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-green-500" />
          <span>צ׳ק-אין</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-blue-500" />
          <span>ישנים</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-orange-500" />
          <span>צ׳ק-אאוט</span>
        </div>
      </div>
    </div>
  );
};
