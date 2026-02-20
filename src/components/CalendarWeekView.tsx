import React, { useMemo } from 'react';
import { CalendarEvent } from '@/types/village';
import { DayCapacity } from '@/hooks/useCalendarCapacity';
import { 
  format, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  isSameDay, 
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
import { ScrollArea } from '@/components/ui/scroll-area';

interface CalendarWeekViewProps {
  selectedDate: Date;
  events: CalendarEvent[];
  onDayClick: (date: Date) => void;
  getCapacityForDate: (date: Date | string) => DayCapacity;
}

const getEventIcon = (type: CalendarEvent['type']) => {
  switch (type) {
    case 'NEIGHBORHOOD': return Tent;
    case 'FACILITY':
    case 'ACTIVITY': return Flame;
    case 'TENT_CHECKIN': return LogIn;
    case 'TENT_CHECKOUT': return LogOut;
    default: return Flame;
  }
};

export const CalendarWeekView: React.FC<CalendarWeekViewProps> = ({ 
  selectedDate, 
  events,
  onDayClick,
  getCapacityForDate
}) => {
  // Get all days of the week
  const weekDays = useMemo(() => {
    const start = startOfWeek(selectedDate, { weekStartsOn: 0 });
    const end = endOfWeek(selectedDate, { weekStartsOn: 0 });
    return eachDayOfInterval({ start, end });
  }, [selectedDate]);

  // Organize events by day
  const eventsByDay = useMemo(() => {
    const byDay: Record<string, CalendarEvent[]> = {};
    
    weekDays.forEach(day => {
      const dateStr = format(day, 'yyyy-MM-dd');
      byDay[dateStr] = [];
    });

    events.forEach(event => {
      if (event.type === 'NEIGHBORHOOD' && event.endDate) {
        // Multi-day event - add to all days in range
        const start = parseISO(event.startDate);
        const end = parseISO(event.endDate);
        
        weekDays.forEach(day => {
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
  }, [events, weekDays]);

  // Get multi-day neighborhood events for spanning bars
  const neighborhoodBars = useMemo(() => {
    const bars: Array<{
      event: CalendarEvent;
      startCol: number;
      span: number;
    }> = [];

    const neighborhoodEvents = events.filter(e => e.type === 'NEIGHBORHOOD' && e.endDate);
    
    neighborhoodEvents.forEach(event => {
      const start = parseISO(event.startDate);
      const end = parseISO(event.endDate!);
      
      let startCol = -1;
      let endCol = -1;

      weekDays.forEach((day, index) => {
        const isInRange = isWithinInterval(day, { start, end }) || isSameDay(day, start) || isSameDay(day, end);
        if (isInRange) {
          if (startCol === -1) startCol = index;
          endCol = index;
        }
      });

      if (startCol !== -1) {
        bars.push({
          event,
          startCol,
          span: endCol - startCol + 1,
        });
      }
    });

    return bars;
  }, [events, weekDays]);

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[600px]">
      {/* Header row with day names */}
      <div className="grid grid-cols-7 border-b border-border">
        {weekDays.map((day) => {
          const dateStr = format(day, 'yyyy-MM-dd');
          const dayEvents = eventsByDay[dateStr] || [];
          const isCurrentDay = isToday(day);
          const cap = getCapacityForDate(day);

          return (
            <div 
              key={dateStr}
              className={cn(
                "p-2 text-center border-r border-border last:border-r-0",
                isCurrentDay && "bg-primary/10"
              )}
            >
              <div className="text-xs text-muted-foreground uppercase">
                {format(day, 'EEE', { locale: he })}
              </div>
              <div className={cn(
                "text-lg font-bold mt-1",
                isCurrentDay && "text-primary"
              )}>
                {format(day, 'd')}
              </div>
              <div className="flex items-center justify-center gap-2 text-[10px] mt-1 text-muted-foreground">
                <span className={cn(cap.participantsOverCapacity && "text-destructive font-bold")}>
                  🛏️{cap.participantsFree}
                </span>
                <span className={cn(cap.vipOverCapacity && "text-destructive font-bold")}>
                  ⭐{cap.vipFree}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Neighborhood spanning bars */}
      {neighborhoodBars.length > 0 && (
        <div className="relative border-b border-border bg-muted/30 py-2 px-1 min-h-[60px]">
          <div className="grid grid-cols-7 gap-1">
            {neighborhoodBars.map((bar, barIndex) => (
              <div
                key={bar.event.id}
                className="rounded-lg px-2 py-1 text-xs font-semibold truncate cursor-pointer hover:opacity-90 transition-opacity"
                style={{
                  gridColumnStart: bar.startCol + 1,
                  gridColumnEnd: `span ${bar.span}`,
                  backgroundColor: bar.event.color,
                  color: 'white',
                  marginTop: barIndex * 28,
                }}
                title={`${bar.event.groupName} - ${bar.event.location}`}
              >
                <div className="flex items-center gap-1">
                  <Tent className="w-3 h-3 flex-shrink-0" />
                  <span className="truncate">{bar.event.groupName}{bar.event.metadata?.upgradedCoffee ? ' ☕' : ''}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Day cells with events */}
      <div className="grid grid-cols-7 min-h-[400px]">
        {weekDays.map((day) => {
          const dateStr = format(day, 'yyyy-MM-dd');
          const dayEvents = (eventsByDay[dateStr] || []).filter(e => e.type !== 'NEIGHBORHOOD');
          const isCurrentDay = isToday(day);

          // Count events by type
          const checkIns = dayEvents.filter(e => e.type === 'TENT_CHECKIN');
          const checkOuts = dayEvents.filter(e => e.type === 'TENT_CHECKOUT');
          const facilities = dayEvents.filter(e => e.type === 'FACILITY' || e.type === 'ACTIVITY');

          return (
            <div
              key={dateStr}
              onClick={() => onDayClick(day)}
              className={cn(
                "border-r border-b border-border last:border-r-0 p-2 cursor-pointer hover:bg-accent/50 transition-colors min-h-[120px]",
                isCurrentDay && "bg-primary/5"
              )}
            >
              <ScrollArea className="h-[180px]">
                <div className="space-y-2">
                  {/* Check-ins summary */}
                  {checkIns.length > 0 && (
                    <div className="flex items-center gap-1 p-1.5 rounded bg-green-500/20 text-green-700 dark:text-green-400 text-xs">
                      <LogIn className="w-3 h-3" />
                      <span className="font-medium">{checkIns.length} CHECK IN</span>
                    </div>
                  )}

                  {/* Check-outs summary */}
                  {checkOuts.length > 0 && (
                    <div className="flex items-center gap-1 p-1.5 rounded bg-blue-500/20 text-blue-700 dark:text-blue-400 text-xs">
                      <LogOut className="w-3 h-3" />
                      <span className="font-medium">{checkOuts.length} CHECK OUT</span>
                    </div>
                  )}

                  {/* Facility/Activity events */}
                  {facilities.map(event => (
                    <div
                      key={event.id}
                      className="p-1.5 rounded text-xs"
                      style={{ 
                        backgroundColor: `${event.color}30`,
                        borderLeft: `3px solid ${event.color}`
                      }}
                    >
                      <div className="font-medium truncate">{event.startTime}</div>
                      <div className="truncate text-muted-foreground">{event.title}</div>
                    </div>
                  ))}

                  {dayEvents.length === 0 && (
                    <p className="text-xs text-muted-foreground text-center py-2">
                      אין אירועים
                    </p>
                  )}
                </div>
              </ScrollArea>
            </div>
          );
        })}
      </div>
      </div>
    </div>
  );
};
