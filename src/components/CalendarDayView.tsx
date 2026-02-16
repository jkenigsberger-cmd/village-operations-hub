import React, { useMemo } from 'react';
import { CalendarEvent } from '@/types/village';
import { DayCapacity } from '@/hooks/useCalendarCapacity';
import { format, parseISO, isWithinInterval, isSameDay } from 'date-fns';
import { he } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { 
  Tent, 
  Flame, 
  LogIn, 
  LogOut,
  Users,
  Clock,
  MapPin,
  ChefHat,
  Star
} from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface CalendarDayViewProps {
  selectedDate: Date;
  events: CalendarEvent[];
  onEventClick?: (event: CalendarEvent) => void;
  onGroupEventClick?: (event: CalendarEvent) => void;
  getCapacityForDate: (date: Date | string) => DayCapacity;
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

export const CalendarDayView: React.FC<CalendarDayViewProps> = ({ selectedDate, events, onEventClick, onGroupEventClick, getCapacityForDate }) => {
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

  const cap = getCapacityForDate(selectedDate);

  return (
    <div className="flex flex-col lg:flex-row min-h-[600px]">
      {/* Sidebar with all-day events */}
      <div className="lg:w-80 border-b lg:border-b-0 lg:border-r border-border bg-muted/30">
        <div className="p-4 border-b border-border">
          <h3 className="font-bold text-lg">
            {format(selectedDate, "EEEE d", { locale: he })}
          </h3>
          <p className="text-sm text-muted-foreground capitalize">
            {format(selectedDate, "MMMM yyyy", { locale: he })}
          </p>
        </div>

        {/* Capacity card */}
        <div className="p-4 border-b border-border">
          <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
            <Tent className="w-4 h-4" />
            קיבולת לינה
          </h4>
          <div className="grid grid-cols-2 gap-3">
            {/* Participants */}
            <div className={cn(
              "rounded-lg p-3 border",
              cap.participantsOverCapacity ? "border-destructive bg-destructive/10" : "bg-muted/50"
            )}>
              <div className="text-xs text-muted-foreground mb-1">🛏️ חניכים</div>
              <div className={cn("text-2xl font-bold", cap.participantsOverCapacity && "text-destructive")}>
                {cap.participantsFree}
                <span className="text-xs font-normal text-muted-foreground mr-1">פנוי</span>
              </div>
              {cap.participantsOverCapacity && (
                <span className="text-[10px] bg-destructive text-destructive-foreground rounded px-1 py-0.5">חריגה</span>
              )}
              <div className="text-[10px] text-muted-foreground mt-1">
                לנים: {cap.participantsSleeping} · קיבולת: {cap.participantsCapacity}
              </div>
            </div>
            {/* VIP */}
            <div className={cn(
              "rounded-lg p-3 border",
              cap.vipOverCapacity ? "border-destructive bg-destructive/10" : "bg-muted/50"
            )}>
              <div className="text-xs text-muted-foreground mb-1">⭐ צוות (VIP)</div>
              <div className={cn("text-2xl font-bold", cap.vipOverCapacity && "text-destructive")}>
                {cap.vipFree}
                <span className="text-xs font-normal text-muted-foreground mr-1">פנוי</span>
              </div>
              {cap.vipOverCapacity && (
                <span className="text-[10px] bg-destructive text-destructive-foreground rounded px-1 py-0.5">חריגה</span>
              )}
              <div className="text-[10px] text-muted-foreground mt-1">
                לנים: {cap.vipSleeping} · קיבולת: {cap.vipCapacity}
              </div>
            </div>
          </div>
        </div>

        <ScrollArea className="h-[200px] lg:h-[500px]">
          <div className="p-4 space-y-4">
            {/* Active neighborhood reservations */}
            {activeNeighborhoods.length > 0 && (
              <div>
                <h4 className="font-semibold text-sm text-muted-foreground mb-2 flex items-center gap-2">
                  <Tent className="w-4 h-4" />
                  קבוצות מאוכסנות
                </h4>
                <div className="space-y-2">
                  {activeNeighborhoods.map(event => (
                    <div
                      key={event.id}
                      onClick={() => onGroupEventClick?.(event)}
                      className={cn(
                        "p-3 rounded-lg text-sm",
                        onGroupEventClick && "cursor-pointer hover:opacity-80 transition-opacity"
                      )}
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
                        {format(parseISO(event.startDate), 'd MMM', { locale: he })} - {format(parseISO(event.endDate!), 'd MMM', { locale: he })}
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
                  CHECK IN ({checkIns.length})
                </h4>
                <div className="space-y-2">
                  {checkIns.map(event => (
                    <div
                      key={event.id}
                      onClick={() => onGroupEventClick?.(event)}
                      className={cn(
                        "p-3 rounded-lg text-sm",
                        onGroupEventClick && "cursor-pointer hover:opacity-80 transition-opacity"
                      )}
                      style={{ 
                        backgroundColor: `${event.color}20`,
                        borderLeft: `4px solid ${event.color}`
                      }}
                    >
                      <div className="font-semibold">{event.title}</div>
                      <div className="text-muted-foreground text-xs">{event.groupName}</div>
                      <div className="text-muted-foreground text-xs flex items-center gap-1 mt-1">
                        <MapPin className="w-3 h-3" />
                        {event.metadata?.isAllocated === false ? (
                          <span className="text-red-500 font-semibold">לא שובץ עדיין</span>
                        ) : (
                          event.location
                        )}
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
                  CHECK OUT ({checkOuts.length})
                </h4>
                <div className="space-y-2">
                  {checkOuts.map(event => (
                    <div
                      key={event.id}
                      onClick={() => onGroupEventClick?.(event)}
                      className={cn(
                        "p-3 rounded-lg text-sm",
                        onGroupEventClick && "cursor-pointer hover:opacity-80 transition-opacity"
                      )}
                      style={{ 
                        backgroundColor: `${event.color}20`,
                        borderLeft: `4px solid ${event.color}`
                      }}
                    >
                      <div className="font-semibold">{event.title}</div>
                      <div className="text-muted-foreground text-xs">{event.groupName}</div>
                      <div className="text-muted-foreground text-xs flex items-center gap-1 mt-1">
                        <MapPin className="w-3 h-3" />
                        {event.metadata?.isAllocated === false ? (
                          <span className="text-red-500 font-semibold">לא שובץ עדיין</span>
                        ) : (
                          event.location
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {allDayEvents.length === 0 && activeNeighborhoods.length === 0 && (
              <p className="text-muted-foreground text-sm text-center py-4">
                אין אירועי CHECK IN / CHECK OUT
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

                  <div className="flex-1 py-1 px-2 flex flex-wrap gap-2">
                    {hourEvents.map(event => {
                      const Icon = getEventIcon(event.type);
                      const isKitchenClickable = event.type === 'KITCHEN';
                      const isGroupClickable = event.groupName && 
                        (event.type === 'NEIGHBORHOOD' || 
                         event.type === 'FACILITY' || 
                         event.type === 'ACTIVITY' ||
                         event.type === 'DAY_USE' ||
                         event.type === 'TENT_CHECKIN' ||
                         event.type === 'TENT_CHECKOUT');
                      const isClickable = isKitchenClickable || isGroupClickable;
                      
                      const handleClick = () => {
                        if (isKitchenClickable && onEventClick) {
                          onEventClick(event);
                        } else if (isGroupClickable && onGroupEventClick) {
                          onGroupEventClick(event);
                        }
                      };

                      return (
                        <div
                          key={event.id}
                          onClick={isClickable ? handleClick : undefined}
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
                          <div className="min-w-0 overflow-hidden">
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
