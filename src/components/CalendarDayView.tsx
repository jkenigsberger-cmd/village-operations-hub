import React, { useMemo } from 'react';
import { CalendarEvent } from '@/types/village';
import { format, parseISO, isWithinInterval, isSameDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { 
  Tent, 
  Flame, 
  LogIn, 
  LogOut,
  Users,
  Clock,
  MapPin,
  ChefHat
} from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface CalendarDayViewProps {
  selectedDate: Date;
  events: CalendarEvent[];
  onEventClick?: (event: CalendarEvent) => void;
}

// Hours to display (6:00 - 22:00)
const HOURS = Array.from({ length: 17 }, (_, i) => i + 6);

const getEventIcon = (type: CalendarEvent['type']) => {
  switch (type) {
    case 'NEIGHBORHOOD': return Tent;
    case 'FACILITY':
    case 'ACTIVITY': return Flame;
    case 'TENT_CHECKIN': return LogIn;
    case 'TENT_CHECKOUT': return LogOut;
    case 'KITCHEN': return ChefHat;
    default: return Clock;
  }
};

const getContrastColor = (hslColor: string): string => {
  // Extract lightness from HSL
  const match = hslColor.match(/hsl\((\d+),\s*(\d+)%?,\s*(\d+)%?\)/);
  if (match) {
    const lightness = parseInt(match[3]);
    return lightness > 50 ? 'hsl(0, 0%, 10%)' : 'hsl(0, 0%, 100%)';
  }
  return 'white';
};

export const CalendarDayView: React.FC<CalendarDayViewProps> = ({ selectedDate, events, onEventClick }) => {
  const dateStr = format(selectedDate, 'yyyy-MM-dd');

  // Separate all-day events (check-ins, check-outs, neighborhoods) from timed events
  const { allDayEvents, timedEvents, activeNeighborhoods } = useMemo(() => {
    const allDay: CalendarEvent[] = [];
    const timed: CalendarEvent[] = [];
    const neighborhoods: CalendarEvent[] = [];

    events.forEach(event => {
      // Check if this event is relevant for this day
      if (event.type === 'NEIGHBORHOOD' && event.endDate) {
        // Multi-day event - check if selectedDate is within range
        const start = parseISO(event.startDate);
        const end = parseISO(event.endDate);
        if (isWithinInterval(selectedDate, { start, end }) || isSameDay(selectedDate, start) || isSameDay(selectedDate, end)) {
          neighborhoods.push(event);
        }
      } else if (event.startDate === dateStr) {
        if (event.startTime && event.endTime) {
          timed.push(event);
        } else {
          allDay.push(event);
        }
      }
    });

    // Sort timed events by start time
    timed.sort((a, b) => (a.startTime || '').localeCompare(b.startTime || ''));
    
    return { 
      allDayEvents: allDay, 
      timedEvents: timed,
      activeNeighborhoods: neighborhoods
    };
  }, [events, selectedDate, dateStr]);

  // Group timed events by hour
  const eventsByHour = useMemo(() => {
    const byHour: Record<number, CalendarEvent[]> = {};
    HOURS.forEach(h => { byHour[h] = []; });

    timedEvents.forEach(event => {
      if (event.startTime) {
        const hour = parseInt(event.startTime.split(':')[0]);
        if (byHour[hour]) {
          byHour[hour].push(event);
        }
      }
    });

    return byHour;
  }, [timedEvents]);

  // Group all-day events by type
  const checkIns = allDayEvents.filter(e => e.type === 'TENT_CHECKIN');
  const checkOuts = allDayEvents.filter(e => e.type === 'TENT_CHECKOUT');

  return (
    <div className="flex flex-col lg:flex-row min-h-[600px]">
      {/* Sidebar with all-day events */}
      <div className="lg:w-80 border-b lg:border-b-0 lg:border-r border-border bg-muted/30">
        <div className="p-4 border-b border-border">
          <h3 className="font-bold text-lg">
            {format(selectedDate, "EEEE d", { locale: es })}
          </h3>
          <p className="text-sm text-muted-foreground capitalize">
            {format(selectedDate, "MMMM yyyy", { locale: es })}
          </p>
        </div>

        <ScrollArea className="h-[200px] lg:h-[500px]">
          <div className="p-4 space-y-4">
            {/* Active neighborhood reservations */}
            {activeNeighborhoods.length > 0 && (
              <div>
                <h4 className="font-semibold text-sm text-muted-foreground mb-2 flex items-center gap-2">
                  <Tent className="w-4 h-4" />
                  Grupos Hospedados
                </h4>
                <div className="space-y-2">
                  {activeNeighborhoods.map(event => (
                    <div
                      key={event.id}
                      className="p-3 rounded-lg text-sm"
                      style={{ 
                        backgroundColor: `${event.color}20`,
                        borderLeft: `4px solid ${event.color}`
                      }}
                    >
                      <div className="font-semibold">{event.groupName}</div>
                      <div className="text-muted-foreground text-xs mt-1">
                        {event.location}
                      </div>
                      <div className="text-muted-foreground text-xs">
                        {format(parseISO(event.startDate), 'd MMM', { locale: es })} - {format(parseISO(event.endDate!), 'd MMM', { locale: es })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Check-ins */}
            {checkIns.length > 0 && (
              <div>
                <h4 className="font-semibold text-sm text-muted-foreground mb-2 flex items-center gap-2">
                  <LogIn className="w-4 h-4 text-green-500" />
                  Check-ins ({checkIns.length})
                </h4>
                <div className="space-y-2">
                  {checkIns.map(event => (
                    <div
                      key={event.id}
                      className="p-3 rounded-lg text-sm"
                      style={{ 
                        backgroundColor: `${event.color}20`,
                        borderLeft: `4px solid ${event.color}`
                      }}
                    >
                      <div className="font-semibold">{event.title}</div>
                      <div className="text-muted-foreground text-xs">{event.groupName}</div>
                      <div className="text-muted-foreground text-xs flex items-center gap-1 mt-1">
                        <MapPin className="w-3 h-3" />
                        {event.location}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Check-outs */}
            {checkOuts.length > 0 && (
              <div>
                <h4 className="font-semibold text-sm text-muted-foreground mb-2 flex items-center gap-2">
                  <LogOut className="w-4 h-4 text-blue-500" />
                  Check-outs ({checkOuts.length})
                </h4>
                <div className="space-y-2">
                  {checkOuts.map(event => (
                    <div
                      key={event.id}
                      className="p-3 rounded-lg text-sm"
                      style={{ 
                        backgroundColor: `${event.color}20`,
                        borderLeft: `4px solid ${event.color}`
                      }}
                    >
                      <div className="font-semibold">{event.title}</div>
                      <div className="text-muted-foreground text-xs">{event.groupName}</div>
                      <div className="text-muted-foreground text-xs flex items-center gap-1 mt-1">
                        <MapPin className="w-3 h-3" />
                        {event.location}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {allDayEvents.length === 0 && activeNeighborhoods.length === 0 && (
              <p className="text-muted-foreground text-sm text-center py-4">
                Sin eventos de check-in/out
              </p>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Hourly timeline */}
      <div className="flex-1 overflow-auto">
        <ScrollArea className="h-[400px] lg:h-[560px]">
          <div className="min-w-[300px]">
            {HOURS.map(hour => {
              const hourEvents = eventsByHour[hour];
              const hasEvents = hourEvents.length > 0;

              return (
                <div
                  key={hour}
                  className={cn(
                    "flex border-b border-border/50 min-h-[50px]",
                    hasEvents && "bg-accent/20"
                  )}
                >
                  {/* Time label */}
                  <div className="w-16 sm:w-20 flex-shrink-0 py-2 px-2 sm:px-3 text-right text-sm font-medium text-muted-foreground border-r border-border/50">
                    {hour.toString().padStart(2, '0')}:00
                  </div>

                  {/* Events for this hour */}
                  <div className="flex-1 py-1 px-2 flex flex-wrap gap-2">
                    {hourEvents.map(event => {
                      const Icon = getEventIcon(event.type);
                      const isClickable = event.type === 'KITCHEN';
                      return (
                        <div
                          key={event.id}
                          onClick={isClickable && onEventClick ? () => onEventClick(event) : undefined}
                          className={cn(
                            "px-3 py-2 rounded-lg text-sm flex items-center gap-2 max-w-full",
                            isClickable && "cursor-pointer hover:opacity-90 transition-opacity"
                          )}
                          style={{ 
                            backgroundColor: event.color,
                            color: getContrastColor(event.color)
                          }}
                        >
                          <Icon className="w-4 h-4 flex-shrink-0" />
                          <div className="min-w-0">
                            <div className="font-semibold truncate">{event.title}</div>
                            <div className="text-xs opacity-90 truncate">
                              {event.startTime} - {event.endTime} • {event.groupName}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
};
