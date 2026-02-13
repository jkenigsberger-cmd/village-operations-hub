import React, { useMemo } from 'react';
import { CalendarEvent } from '@/types/village';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek,
  endOfWeek,
  eachDayOfInterval, 
  isSameDay, 
  isSameMonth,
  isWithinInterval, 
  parseISO,
  isToday
} from 'date-fns';
import { he } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { 
  Tent, 
  Flame, 
  LogIn, 
  LogOut
} from 'lucide-react';

interface CalendarMonthViewProps {
  selectedDate: Date;
  events: CalendarEvent[];
  onDayClick: (date: Date) => void;
}

// Event type dot colors
const DOT_COLORS: Record<string, string> = {
  NEIGHBORHOOD: 'bg-purple-500',
  FACILITY: 'bg-orange-500',
  ACTIVITY: 'bg-orange-500',
  TENT_CHECKIN: 'bg-green-500',
  TENT_CHECKOUT: 'bg-blue-500',
  KITCHEN: 'bg-amber-500',
  DAY_USE: 'bg-amber-400',
};

export const CalendarMonthView: React.FC<CalendarMonthViewProps> = ({ 
  selectedDate, 
  events,
  onDayClick 
}) => {
  // Get all days to display (including days from prev/next month to fill the grid)
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(selectedDate);
    const monthEnd = endOfMonth(selectedDate);
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
    
    return eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  }, [selectedDate]);

  // Organize events by day
  const eventsByDay = useMemo(() => {
    const byDay: Record<string, CalendarEvent[]> = {};
    
    calendarDays.forEach(day => {
      const dateStr = format(day, 'yyyy-MM-dd');
      byDay[dateStr] = [];
    });

    events.forEach(event => {
      if (event.type === 'NEIGHBORHOOD' && event.endDate) {
        // Multi-day event - add to all days in range
        const start = parseISO(event.startDate);
        const end = parseISO(event.endDate);
        
        calendarDays.forEach(day => {
          if (isWithinInterval(day, { start, end }) || isSameDay(day, start) || isSameDay(day, end)) {
            const dateStr = format(day, 'yyyy-MM-dd');
            if (byDay[dateStr]) {
              // Avoid duplicates
              if (!byDay[dateStr].find(e => e.id === event.id)) {
                byDay[dateStr].push(event);
              }
            }
          }
        });
      } else {
        // Single day event
        if (byDay[event.startDate]) {
          byDay[event.startDate].push(event);
        }
      }
    });

    return byDay;
  }, [events, calendarDays]);

  // Day names header
  const dayNames = ['א׳', 'ב׳', 'ג׳', 'ד׳', 'ה׳', 'ו׳', 'ש׳'];

  return (
    <div>
      {/* Day names header */}
      <div className="grid grid-cols-7 border-b border-border">
        {dayNames.map(name => (
          <div key={name} className="p-2 text-center text-sm font-medium text-muted-foreground">
            {name}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7">
        {calendarDays.map((day) => {
          const dateStr = format(day, 'yyyy-MM-dd');
          const dayEvents = eventsByDay[dateStr] || [];
          const isCurrentMonth = isSameMonth(day, selectedDate);
          const isCurrentDay = isToday(day);

          // Get unique event types for dots
          const eventTypes = [...new Set(dayEvents.map(e => e.type))];

          // Count by type for display
          const neighborhoodCount = dayEvents.filter(e => e.type === 'NEIGHBORHOOD').length;
          const checkInCount = dayEvents.filter(e => e.type === 'TENT_CHECKIN').length;
          const checkOutCount = dayEvents.filter(e => e.type === 'TENT_CHECKOUT').length;
          const facilityCount = dayEvents.filter(e => e.type === 'FACILITY' || e.type === 'ACTIVITY').length;
          const kitchenCount = dayEvents.filter(e => e.type === 'KITCHEN').length;
          const dayUseCount = dayEvents.filter(e => e.type === 'DAY_USE').length;

          return (
            <div
              key={dateStr}
              onClick={() => onDayClick(day)}
              className={cn(
                "min-h-[56px] sm:min-h-[100px] border-r border-b border-border p-1 sm:p-2 cursor-pointer hover:bg-accent/50 transition-colors overflow-hidden",
                !isCurrentMonth && "bg-muted/30 text-muted-foreground",
                isCurrentDay && "bg-primary/10"
              )}
            >
              {/* Day number */}
              <div className={cn(
                "text-sm font-medium mb-1",
                isCurrentDay && "text-primary font-bold"
              )}>
                {format(day, 'd')}
              </div>

              {/* Event indicators */}
              <div className="space-y-1">
                {/* Neighborhood reservation indicator */}
                {neighborhoodCount > 0 && (
                  <div className="flex items-center gap-1 text-xs">
                    <div className={cn("w-2 h-2 rounded-full", DOT_COLORS.NEIGHBORHOOD)} />
                    <span className="hidden sm:inline truncate text-muted-foreground">
                      {neighborhoodCount} קבוצ{neighborhoodCount > 1 ? 'ות' : 'ה'}
                    </span>
                  </div>
                )}

                {/* Check-in indicator */}
                {checkInCount > 0 && (
                  <div className="flex items-center gap-1 text-xs">
                    <div className={cn("w-2 h-2 rounded-full", DOT_COLORS.TENT_CHECKIN)} />
                    <span className="hidden sm:inline truncate text-muted-foreground">
                      {checkInCount} CHECK IN
                    </span>
                  </div>
                )}

                {/* Check-out indicator */}
                {checkOutCount > 0 && (
                  <div className="flex items-center gap-1 text-xs">
                    <div className={cn("w-2 h-2 rounded-full", DOT_COLORS.TENT_CHECKOUT)} />
                    <span className="hidden sm:inline truncate text-muted-foreground">
                      {checkOutCount} CHECK OUT
                    </span>
                  </div>
                )}

                {/* Facility reservation indicator */}
                {facilityCount > 0 && (
                  <div className="flex items-center gap-1 text-xs">
                    <div className={cn("w-2 h-2 rounded-full", DOT_COLORS.FACILITY)} />
                    <span className="hidden sm:inline truncate text-muted-foreground">
                      {facilityCount} מרחב{facilityCount > 1 ? 'ים' : ''}
                    </span>
                  </div>
                )}

                {/* Kitchen meal indicator */}
                {kitchenCount > 0 && (
                  <div className="flex items-center gap-1 text-xs">
                    <div className={cn("w-2 h-2 rounded-full", DOT_COLORS.KITCHEN)} />
                    <span className="hidden sm:inline truncate text-muted-foreground">
                      🍽️ {kitchenCount} ארוח{kitchenCount > 1 ? 'ות' : 'ה'}
                    </span>
                  </div>
                )}

                {/* Day-use group indicator */}
                {dayUseCount > 0 && (
                  <div className="flex items-center gap-1 text-xs">
                    <div className={cn("w-2 h-2 rounded-full", DOT_COLORS.DAY_USE)} />
                    <span className="hidden sm:inline truncate text-muted-foreground">
                      ☀️ {dayUseCount} יום
                    </span>
                  </div>
                )}

                {/* Mobile: just show dots if there are events */}
                {dayEvents.length > 0 && (
                  <div className="flex gap-1 sm:hidden flex-wrap">
                    {eventTypes.slice(0, 4).map(type => (
                      <div 
                        key={type} 
                        className={cn("w-2 h-2 rounded-full", DOT_COLORS[type])} 
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
