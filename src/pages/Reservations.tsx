import React, { useState, useMemo } from 'react';
import { useVillage } from '@/context/VillageContext';
import { NeighborhoodId, NeighborhoodReservation } from '@/types/village';
import { ReservationForm } from '@/components/ReservationForm';
import { ReservationCard } from '@/components/ReservationCard';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { 
  CalendarPlus, 
  CalendarDays, 
  List, 
  Grid,
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon
} from 'lucide-react';
import { format, parseISO, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, isSameDay, addMonths, subMonths } from 'date-fns';

const neighborhoodOrder: NeighborhoodId[] = ['N1', 'N2', 'N3', 'N4', 'N5', 'N6', 'N7', 'VIP'];

// Colors for different neighborhoods
const neighborhoodColors: Record<NeighborhoodId, string> = {
  'N1': 'bg-blue-500',
  'N2': 'bg-green-500',
  'N3': 'bg-purple-500',
  'N4': 'bg-orange-500',
  'N5': 'bg-pink-500',
  'N6': 'bg-cyan-500',
  'N7': 'bg-amber-500',
  'VIP': 'bg-yellow-500'
};

const Reservations: React.FC = () => {
  const { state, getNeighborhoodReservations } = useVillage();
  const [showForm, setShowForm] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Get all reservations sorted by date
  const allReservations = useMemo(() => {
    if (!state) return [];
    
    const reservations: NeighborhoodReservation[] = [];
    neighborhoodOrder.forEach(id => {
      const nReservations = getNeighborhoodReservations(id);
      reservations.push(...nReservations);
    });
    
    return reservations.sort((a, b) => 
      a.checkInDate.localeCompare(b.checkInDate)
    );
  }, [state, getNeighborhoodReservations]);

  // Filter upcoming and past reservations
  const today = format(new Date(), 'yyyy-MM-dd');
  const upcomingReservations = allReservations.filter(r => r.checkOutDate >= today);
  const pastReservations = allReservations.filter(r => r.checkOutDate < today).slice(-10);

  // Calendar data
  const calendarDays = useMemo(() => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    return eachDayOfInterval({ start, end });
  }, [currentMonth]);

  // Get reservations for a specific day
  const getReservationsForDay = (day: Date) => {
    const dayStr = format(day, 'yyyy-MM-dd');
    return allReservations.filter(r => 
      r.checkInDate <= dayStr && r.checkOutDate > dayStr
    );
  };

  if (!state) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3">
            <CalendarDays className="w-7 h-7" />
            Reservations
          </h1>
          <p className="text-muted-foreground">
            {upcomingReservations.length} upcoming reservations
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex bg-muted rounded-lg p-1">
            <Button
              variant={viewMode === 'list' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
            >
              <List className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === 'calendar' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('calendar')}
            >
              <Grid className="w-4 h-4" />
            </Button>
          </div>
          
          <Button onClick={() => setShowForm(true)} className="flex items-center gap-2">
            <CalendarPlus className="w-5 h-5" />
            New Reservation
          </Button>
        </div>
      </div>

      {/* Calendar View */}
      {viewMode === 'calendar' && (
        <div className="tile p-4">
          {/* Month navigation */}
          <div className="flex items-center justify-between mb-4">
            <Button variant="ghost" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <h2 className="text-xl font-bold">
              {format(currentMonth, 'MMMM yyyy')}
            </h2>
            <Button variant="ghost" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
              <ChevronRight className="w-5 h-5" />
            </Button>
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-1">
            {/* Day headers */}
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="text-center text-sm font-semibold text-muted-foreground p-2">
                {day}
              </div>
            ))}
            
            {/* Empty cells for days before month start */}
            {Array.from({ length: calendarDays[0]?.getDay() || 0 }).map((_, i) => (
              <div key={`empty-${i}`} className="p-2" />
            ))}
            
            {/* Calendar days */}
            {calendarDays.map(day => {
              const dayReservations = getReservationsForDay(day);
              const isCurrentDay = isToday(day);
              
              return (
                <div
                  key={day.toISOString()}
                  className={`min-h-[80px] p-1 border rounded-lg ${
                    isCurrentDay ? 'border-primary border-2' : 'border-border'
                  }`}
                >
                  <div className={`text-sm font-semibold mb-1 ${
                    isCurrentDay ? 'text-primary' : ''
                  }`}>
                    {format(day, 'd')}
                  </div>
                  <div className="space-y-1">
                    {dayReservations.slice(0, 3).map(r => (
                      <div
                        key={r.id}
                        className={`text-xs px-1 py-0.5 rounded text-white truncate ${
                          neighborhoodColors[r.neighborhoodId]
                        }`}
                        title={`${r.groupName} - ${state.neighborhoods[r.neighborhoodId]?.displayName}`}
                      >
                        {r.groupName}
                      </div>
                    ))}
                    {dayReservations.length > 3 && (
                      <div className="text-xs text-muted-foreground">
                        +{dayReservations.length - 3} more
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div className="mt-4 flex flex-wrap gap-2">
            {neighborhoodOrder.map(id => (
              <div key={id} className="flex items-center gap-1 text-sm">
                <div className={`w-3 h-3 rounded ${neighborhoodColors[id]}`} />
                <span>{state.neighborhoods[id]?.displayName}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* List View */}
      {viewMode === 'list' && (
        <>
          {/* Upcoming Reservations */}
          <div>
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <CalendarIcon className="w-5 h-5" />
              Upcoming & Active Reservations
            </h2>
            
            {upcomingReservations.length === 0 ? (
              <div className="tile p-8 text-center">
                <CalendarDays className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                <p className="text-xl text-muted-foreground mb-4">
                  No upcoming reservations
                </p>
                <Button onClick={() => setShowForm(true)}>
                  <CalendarPlus className="w-5 h-5 mr-2" />
                  Create First Reservation
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {upcomingReservations.map(reservation => (
                  <ReservationCard 
                    key={reservation.id} 
                    reservation={reservation}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Past Reservations */}
          {pastReservations.length > 0 && (
            <div>
              <h2 className="text-xl font-bold mb-4 text-muted-foreground">
                Recent Past Reservations
              </h2>
              <div className="space-y-4 opacity-60">
                {pastReservations.map(reservation => (
                  <ReservationCard 
                    key={reservation.id} 
                    reservation={reservation}
                  />
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Reservation Form Modal */}
      <ReservationForm
        open={showForm}
        onClose={() => setShowForm(false)}
        onSuccess={() => setShowForm(false)}
      />
    </div>
  );
};

export default Reservations;
