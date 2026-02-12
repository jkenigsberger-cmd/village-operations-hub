import React, { useState, useMemo } from 'react';
import { useVillage } from '@/context/VillageContext';
import { useAdminGroups } from '@/hooks/useAdminGroups';
import { useGroupStays } from '@/hooks/useGroupStays';
import { CalendarEvent, CalendarEventType, getActivitySpaceLabel } from '@/types/village';
import { useKitchenData } from '@/hooks/useKitchenData';
import { kitchenSlotsToCalendarEvents, KITCHEN_EVENT_COLOR } from '@/lib/kitchenCalendarEvents';
import { CalendarDayView } from './CalendarDayView';
import { CalendarWeekView } from './CalendarWeekView';
import { CalendarMonthView } from './CalendarMonthView';
import { KitchenEventDetailModal } from './KitchenEventDetailModal';
import { GroupItineraryModal } from './GroupItineraryModal';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { 
  CalendarDays, 
  ChevronLeft, 
  ChevronRight,
  Calendar as CalendarIcon,
  Filter,
  Tent,
  Flame,
  LogIn,
  LogOut,
  ChefHat,
  Sun
} from 'lucide-react';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, addDays, subDays, addWeeks, subWeeks, addMonths, subMonths, isWithinInterval, parseISO, eachDayOfInterval, isSameDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';

type ViewMode = 'day' | 'week' | 'month';

// Color palette for event types
const DAY_USE_COLOR = 'hsl(40, 90%, 50%)'; // Warm amber for day-use

const EVENT_COLORS: Record<CalendarEventType, string> = {
  NEIGHBORHOOD: 'hsl(270, 70%, 50%)', // Purple
  FACILITY: 'hsl(30, 90%, 50%)',      // Orange
  ACTIVITY: 'hsl(30, 90%, 50%)',      // Orange (same as facility)
  TENT_CHECKIN: 'hsl(142, 70%, 45%)', // Green
  TENT_CHECKOUT: 'hsl(210, 80%, 50%)', // Blue
  KITCHEN: KITCHEN_EVENT_COLOR,        // Warm amber
  DAY_USE: DAY_USE_COLOR,              // Warm amber for day-use
};

interface FilterState {
  showNeighborhoods: boolean;
  showFacilities: boolean;
  showCheckIns: boolean;
  showCheckOuts: boolean;
  showKitchen: boolean;
  showDayUse: boolean;
}

export const MasterCalendar: React.FC = () => {
  const { state, getFacilityReservations } = useVillage();
  const { groups } = useAdminGroups();
  const { allGroupStays } = useGroupStays();
  const { state: kitchenState } = useKitchenData();
  const [viewMode, setViewMode] = useState<ViewMode>('day');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [selectedKitchenEvent, setSelectedKitchenEvent] = useState<CalendarEvent | null>(null);
  const [selectedGroupEvent, setSelectedGroupEvent] = useState<CalendarEvent | null>(null);
  const [filters, setFilters] = useState<FilterState>({
    showNeighborhoods: true,
    showFacilities: true,
    showCheckIns: true,
    showCheckOuts: true,
    showKitchen: true,
    showDayUse: true,
  });

  // Generate all calendar events from different sources
  const allEvents = useMemo((): CalendarEvent[] => {
    if (!state) return [];

    const events: CalendarEvent[] = [];

    // 1. Neighborhood reservations (multi-day)
    Object.values(state.neighborhoodReservations || {}).forEach(reservation => {
      events.push({
        id: `neighborhood_${reservation.id}`,
        type: 'NEIGHBORHOOD',
        title: `${state.neighborhoods[reservation.neighborhoodId]?.displayName || reservation.neighborhoodId}`,
        groupName: reservation.groupName,
        startDate: reservation.checkInDate,
        endDate: reservation.checkOutDate,
        location: state.neighborhoods[reservation.neighborhoodId]?.displayName || reservation.neighborhoodId,
        color: EVENT_COLORS.NEIGHBORHOOD,
        metadata: {
          reservationType: reservation.reservationType,
          tentCount: reservation.tentCount,
          genderDistribution: reservation.genderDistribution,
          contactName: reservation.contactName,
          contactPhone: reservation.contactPhone,
          notes: reservation.notes,
        },
      });
    });

    // 2. Facility reservations (hourly)
    Object.values(state.facilityReservations || {}).forEach(reservation => {
      const space = state.activitySpaces[reservation.facilityId];
      events.push({
        id: `facility_${reservation.id}`,
        type: 'FACILITY',
        title: space ? getActivitySpaceLabel(space) : reservation.facilityId,
        groupName: reservation.groupName,
        startDate: reservation.date,
        startTime: reservation.startTime,
        endTime: reservation.endTime,
        location: space?.name || reservation.facilityId,
        color: reservation.groupColor || EVENT_COLORS.FACILITY,
        metadata: {
          numberOfPeople: reservation.numberOfPeople,
          notes: reservation.notes,
        },
      });
    });

    // 3. Activity reservations (hourly)
    Object.values(state.activityReservations || {}).forEach(reservation => {
      const space = state.activitySpaces[reservation.spaceId];
      events.push({
        id: `activity_${reservation.id}`,
        type: 'ACTIVITY',
        title: space ? getActivitySpaceLabel(space) : reservation.spaceId,
        groupName: reservation.groupName,
        startDate: reservation.date,
        startTime: reservation.startTime,
        endTime: reservation.endTime,
        location: space?.name || reservation.spaceId,
        color: EVENT_COLORS.ACTIVITY,
        metadata: {
          notes: reservation.notes,
        },
      });
    });

    // 4. Unified group stay events (replaces individual tent events + group arrival/departure)
    // Build a set of group names that have GroupStay entries to skip duplicate tent events
    const groupStayGroupNames = new Set(allGroupStays.map(gs => gs.groupName));

    // Individual tent check-in/check-out only for tents NOT belonging to a grouped stay
    Object.values(state.tents).forEach(tent => {
      if (tent.groupName && groupStayGroupNames.has(tent.groupName)) return; // skip, handled by GroupStay
      if (tent.checkInDate && tent.groupName) {
        events.push({
          id: `checkin_${tent.id}`,
          type: 'TENT_CHECKIN',
          title: tent.code,
          groupName: tent.groupName,
          startDate: tent.checkInDate,
          location: state.neighborhoods[tent.neighborhoodId]?.displayName || tent.neighborhoodId,
          color: EVENT_COLORS.TENT_CHECKIN,
          metadata: { tentId: tent.id, neighborhoodId: tent.neighborhoodId, beds: tent.beds.length },
        });
      }
      if (tent.checkOutDate && tent.groupName) {
        events.push({
          id: `checkout_${tent.id}`,
          type: 'TENT_CHECKOUT',
          title: tent.code,
          groupName: tent.groupName,
          startDate: tent.checkOutDate,
          location: state.neighborhoods[tent.neighborhoodId]?.displayName || tent.neighborhoodId,
          color: EVENT_COLORS.TENT_CHECKOUT,
          metadata: { tentId: tent.id, neighborhoodId: tent.neighborhoodId, beds: tent.beds.length },
        });
      }
    });

    // 5. Kitchen time slots
    const kitchenEvents = kitchenSlotsToCalendarEvents(kitchenState.timeSlots);
    events.push(...kitchenEvents);

    // 6. Day-use groups from admin groups
    const dayUseGroups = groups.filter(g => g.groupType === 'יום ללא לינה' && !g.isArchived);
    dayUseGroups.forEach(group => {
      const start = parseISO(group.startDate);
      const end = parseISO(group.endDate);
      const daysInRange = eachDayOfInterval({ start, end });
      
      daysInRange.forEach(day => {
        const dateStr = format(day, 'yyyy-MM-dd');
        events.push({
          id: `dayuse_${group.id}_${dateStr}`,
          type: 'DAY_USE',
          title: `פעילות יום – ${group.groupName}`,
          groupName: group.groupName,
          startDate: dateStr,
          startTime: group.arrivalTime || '09:00',
          endTime: group.departureTime || '17:00',
          location: 'פעילות יום',
          color: EVENT_COLORS.DAY_USE,
          metadata: {
            groupId: group.id,
            pax: group.pax,
            arrivalTime: group.arrivalTime,
            departureTime: group.departureTime,
            linkedSpaces: group.linkedSpaceReservationIds,
            linkedMeals: group.linkedKitchenSlotIds,
          },
        });
      });
    });

    // 7. Unified lodging group arrival/departure from GroupStays
    allGroupStays.forEach(stay => {
      const nhoodLabel = stay.neighborhoods.length > 0
        ? `שכונות: ${stay.neighborhoods.map(n => n.neighborhoodName).join(', ')}`
        : '';
      const vipLabel = stay.vipTentCount > 0
        ? `VIP: ${stay.vipTentCount} (${stay.vipTents.map(t => t.tentNumber).join(', ')})`
        : (stay.staffCount > 0 ? 'VIP: לא שובץ' : '');
      const subtitle = [nhoodLabel, vipLabel].filter(Boolean).join(' | ');

      // Arrival event
      const group = groups.find(g => g.id === stay.groupId);
      events.push({
        id: `group_arrival_${stay.key}`,
        type: 'TENT_CHECKIN',
        title: `הגעה: ${stay.groupName} (${stay.participantsTotal + stay.staffTotal} איש)`,
        groupName: stay.groupName,
        startDate: stay.startDate,
        startTime: group?.arrivalTime,
        location: subtitle || 'לינה',
        color: EVENT_COLORS.TENT_CHECKIN,
        metadata: {
          groupId: stay.groupId,
          pax: stay.participantsTotal + stay.staffTotal,
          isGroupArrival: true,
          neighborhoods: stay.neighborhoods,
          vipTents: stay.vipTents,
          vipTentCount: stay.vipTentCount,
        },
      });

      // Departure event
      events.push({
        id: `group_departure_${stay.key}`,
        type: 'TENT_CHECKOUT',
        title: `עזיבה: ${stay.groupName} (${stay.participantsTotal + stay.staffTotal} איש)`,
        groupName: stay.groupName,
        startDate: stay.endDate,
        startTime: group?.departureTime,
        location: subtitle || 'לינה',
        color: EVENT_COLORS.TENT_CHECKOUT,
        metadata: {
          groupId: stay.groupId,
          pax: stay.participantsTotal + stay.staffTotal,
          isGroupDeparture: true,
          neighborhoods: stay.neighborhoods,
          vipTents: stay.vipTents,
          vipTentCount: stay.vipTentCount,
        },
      });
    });

    return events;
  }, [state, kitchenState.timeSlots, groups, allGroupStays]);

  // Filter events based on active filters
  const filteredEvents = useMemo(() => {
    return allEvents.filter(event => {
      if (event.type === 'NEIGHBORHOOD' && !filters.showNeighborhoods) return false;
      if ((event.type === 'FACILITY' || event.type === 'ACTIVITY') && !filters.showFacilities) return false;
      if (event.type === 'TENT_CHECKIN' && !filters.showCheckIns) return false;
      if (event.type === 'TENT_CHECKOUT' && !filters.showCheckOuts) return false;
      if (event.type === 'KITCHEN' && !filters.showKitchen) return false;
      if (event.type === 'DAY_USE' && !filters.showDayUse) return false;
      return true;
    });
  }, [allEvents, filters]);

  // Handle event click for kitchen events
  const handleEventClick = (event: CalendarEvent) => {
    if (event.type === 'KITCHEN') {
      setSelectedKitchenEvent(event);
    }
  };

  // Handle group event click to show itinerary
  const handleGroupEventClick = (event: CalendarEvent) => {
    if (event.groupName) {
      setSelectedGroupEvent(event);
    }
  };

  // Navigation handlers
  const handlePrevious = () => {
    switch (viewMode) {
      case 'day':
        setSelectedDate(prev => subDays(prev, 1));
        break;
      case 'week':
        setSelectedDate(prev => subWeeks(prev, 1));
        break;
      case 'month':
        setSelectedDate(prev => subMonths(prev, 1));
        break;
    }
  };

  const handleNext = () => {
    switch (viewMode) {
      case 'day':
        setSelectedDate(prev => addDays(prev, 1));
        break;
      case 'week':
        setSelectedDate(prev => addWeeks(prev, 1));
        break;
      case 'month':
        setSelectedDate(prev => addMonths(prev, 1));
        break;
    }
  };

  const handleToday = () => {
    setSelectedDate(new Date());
  };

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      setSelectedDate(date);
      setIsDatePickerOpen(false);
    }
  };

  // Get date range label based on view mode
  const getDateLabel = (): string => {
    switch (viewMode) {
      case 'day':
        return format(selectedDate, "EEEE, d 'de' MMMM yyyy", { locale: es });
      case 'week': {
        const weekStart = startOfWeek(selectedDate, { weekStartsOn: 0 });
        const weekEnd = endOfWeek(selectedDate, { weekStartsOn: 0 });
        return `${format(weekStart, "d MMM", { locale: es })} - ${format(weekEnd, "d MMM yyyy", { locale: es })}`;
      }
      case 'month':
        return format(selectedDate, "MMMM yyyy", { locale: es });
    }
  };

  const toggleFilter = (key: keyof FilterState) => {
    setFilters(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // Count active events for today indicator
  const todayEventsCount = useMemo(() => {
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    return filteredEvents.filter(e => e.startDate === todayStr).length;
  }, [filteredEvents]);

  return (
    <div className="space-y-4">
      {/* Header with view selector and navigation */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <CalendarDays className="w-8 h-8 text-primary" />
          <h2 className="text-2xl font-bold">Calendario General</h2>
        </div>

        {/* View mode tabs */}
        <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as ViewMode)}>
          <TabsList className="grid grid-cols-3 w-full sm:w-auto">
            <TabsTrigger value="day" className="px-6">Día</TabsTrigger>
            <TabsTrigger value="week" className="px-6">Semana</TabsTrigger>
            <TabsTrigger value="month" className="px-6">Mes</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Date navigation and filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={handlePrevious}>
            <ChevronLeft className="w-5 h-5" />
          </Button>
          
          <Popover open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" className="min-w-[200px] justify-start gap-2">
                <CalendarIcon className="w-4 h-4" />
                <span className="capitalize">{getDateLabel()}</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={handleDateSelect}
                initialFocus
                className="p-3 pointer-events-auto"
              />
            </PopoverContent>
          </Popover>

          <Button variant="outline" size="icon" onClick={handleNext}>
            <ChevronRight className="w-5 h-5" />
          </Button>

          <Button variant="ghost" onClick={handleToday} className="ml-2">
            Hoy
          </Button>
        </div>

        {/* Filter buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm text-muted-foreground mr-2">
            <Filter className="w-4 h-4 inline mr-1" />
            Filtros:
          </span>
          <Button
            variant={filters.showNeighborhoods ? "default" : "outline"}
            size="sm"
            onClick={() => toggleFilter('showNeighborhoods')}
            className="gap-1"
            style={{ backgroundColor: filters.showNeighborhoods ? EVENT_COLORS.NEIGHBORHOOD : undefined }}
          >
            <Tent className="w-4 h-4" />
            לינה
          </Button>
          <Button
            variant={filters.showFacilities ? "default" : "outline"}
            size="sm"
            onClick={() => toggleFilter('showFacilities')}
            className="gap-1"
            style={{ backgroundColor: filters.showFacilities ? EVENT_COLORS.FACILITY : undefined }}
          >
            <Flame className="w-4 h-4" />
            מרחבים
          </Button>
          <Button
            variant={filters.showCheckIns ? "default" : "outline"}
            size="sm"
            onClick={() => toggleFilter('showCheckIns')}
            className="gap-1"
            style={{ backgroundColor: filters.showCheckIns ? EVENT_COLORS.TENT_CHECKIN : undefined }}
          >
            <LogIn className="w-4 h-4" />
            Check-in
          </Button>
          <Button
            variant={filters.showCheckOuts ? "default" : "outline"}
            size="sm"
            onClick={() => toggleFilter('showCheckOuts')}
            className="gap-1"
            style={{ backgroundColor: filters.showCheckOuts ? EVENT_COLORS.TENT_CHECKOUT : undefined }}
          >
            <LogOut className="w-4 h-4" />
            Check-out
          </Button>
          <Button
            variant={filters.showKitchen ? "default" : "outline"}
            size="sm"
            onClick={() => toggleFilter('showKitchen')}
            className="gap-1"
            style={{ backgroundColor: filters.showKitchen ? EVENT_COLORS.KITCHEN : undefined }}
          >
            <ChefHat className="w-4 h-4" />
            מטבח
          </Button>
          <Button
            variant={filters.showDayUse ? "default" : "outline"}
            size="sm"
            onClick={() => toggleFilter('showDayUse')}
            className="gap-1"
            style={{ backgroundColor: filters.showDayUse ? EVENT_COLORS.DAY_USE : undefined }}
          >
            <Sun className="w-4 h-4" />
            פעילות יום
          </Button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 p-3 bg-muted/50 rounded-lg text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded" style={{ backgroundColor: EVENT_COLORS.NEIGHBORHOOD }} />
          <span>🏕️ לינה</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded" style={{ backgroundColor: EVENT_COLORS.FACILITY }} />
          <span>🧱 מרחבים משותפים</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded" style={{ backgroundColor: EVENT_COLORS.TENT_CHECKIN }} />
          <span>⏳ Check-in</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded" style={{ backgroundColor: EVENT_COLORS.TENT_CHECKOUT }} />
          <span>⏳ Check-out</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded" style={{ backgroundColor: EVENT_COLORS.KITCHEN }} />
          <span>🍽️ מטבח</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded" style={{ backgroundColor: EVENT_COLORS.DAY_USE }} />
          <span>☀️ פעילות יום</span>
        </div>
      </div>

      {/* Calendar views */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        {viewMode === 'day' && (
          <CalendarDayView 
            selectedDate={selectedDate} 
            events={filteredEvents}
            onEventClick={handleEventClick}
            onGroupEventClick={handleGroupEventClick}
          />
        )}
        {viewMode === 'week' && (
          <CalendarWeekView 
            selectedDate={selectedDate} 
            events={filteredEvents}
            onDayClick={(date) => {
              setSelectedDate(date);
              setViewMode('day');
            }}
          />
        )}
        {viewMode === 'month' && (
          <CalendarMonthView 
            selectedDate={selectedDate} 
            events={filteredEvents}
            onDayClick={(date) => {
              setSelectedDate(date);
              setViewMode('day');
            }}
          />
        )}
      </div>

      {/* Kitchen Event Detail Modal */}
      <KitchenEventDetailModal
        event={selectedKitchenEvent}
        isOpen={!!selectedKitchenEvent}
        onClose={() => setSelectedKitchenEvent(null)}
      />

      {/* Group Itinerary Modal */}
      <GroupItineraryModal
        event={selectedGroupEvent}
        selectedDate={selectedDate}
        isOpen={!!selectedGroupEvent}
        onClose={() => setSelectedGroupEvent(null)}
      />
    </div>
  );
};
