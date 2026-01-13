import React, { useState, useMemo } from 'react';
import { format, addDays, isSameDay, parseISO, startOfDay } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FacilityReservation } from '@/types/village';
import { cn } from '@/lib/utils';
import { 
  CalendarIcon, 
  Clock, 
  Plus, 
  Trash2, 
  ChevronLeft, 
  ChevronRight,
  Users
} from 'lucide-react';

interface FacilityReservationCalendarProps {
  facilityId: string;
  facilityLabel: string;
  reservations: FacilityReservation[];
  onAddReservation: (reservation: Omit<FacilityReservation, 'id' | 'createdAt'>) => boolean;
  onRemoveReservation: (reservationId: string) => void;
}

const HOURS = Array.from({ length: 24 }, (_, i) => i);

const formatHour = (hour: number) => {
  return `${hour.toString().padStart(2, '0')}:00`;
};

export const FacilityReservationCalendar: React.FC<FacilityReservationCalendarProps> = ({
  facilityId,
  facilityLabel,
  reservations,
  onAddReservation,
  onRemoveReservation,
}) => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newReservation, setNewReservation] = useState({
    startHour: 9,
    endHour: 10,
    groupName: '',
    notes: '',
  });

  // Get reservations for selected date
  const dayReservations = useMemo(() => {
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    return reservations.filter(r => r.date === dateStr);
  }, [reservations, selectedDate]);

  // Build hourly grid showing which slots are booked
  const hourlySlots = useMemo(() => {
    return HOURS.map(hour => {
      const hourStr = formatHour(hour);
      const reservation = dayReservations.find(r => {
        const start = parseInt(r.startTime.split(':')[0]);
        const end = parseInt(r.endTime.split(':')[0]);
        return hour >= start && hour < end;
      });
      return { hour, reservation };
    });
  }, [dayReservations]);

  const handlePrevDay = () => {
    setSelectedDate(prev => addDays(prev, -1));
  };

  const handleNextDay = () => {
    setSelectedDate(prev => addDays(prev, 1));
  };

  const handleAddReservation = () => {
    if (!newReservation.groupName.trim()) return;
    if (newReservation.startHour >= newReservation.endHour) return;

    const success = onAddReservation({
      facilityId,
      date: format(selectedDate, 'yyyy-MM-dd'),
      startTime: formatHour(newReservation.startHour),
      endTime: formatHour(newReservation.endHour),
      groupName: newReservation.groupName.trim(),
      notes: newReservation.notes.trim() || undefined,
    });

    if (success) {
      setNewReservation({ startHour: 9, endHour: 10, groupName: '', notes: '' });
      setShowAddForm(false);
    }
  };

  const isToday = isSameDay(selectedDate, new Date());

  return (
    <div className="space-y-4">
      {/* Date Navigation */}
      <div className="flex items-center justify-between gap-4">
        <Button variant="outline" size="icon" onClick={handlePrevDay}>
          <ChevronLeft className="w-4 h-4" />
        </Button>

        <Popover open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" className="flex-1 justify-center gap-2">
              <CalendarIcon className="w-4 h-4" />
              <span className="font-semibold">
                {isToday ? 'Today' : format(selectedDate, 'EEE, MMM d')}
              </span>
              <span className="text-muted-foreground">
                {format(selectedDate, 'yyyy')}
              </span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="center">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(date) => {
                if (date) {
                  setSelectedDate(date);
                  setIsDatePickerOpen(false);
                }
              }}
              initialFocus
              className="pointer-events-auto"
            />
          </PopoverContent>
        </Popover>

        <Button variant="outline" size="icon" onClick={handleNextDay}>
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>

      {/* Hourly Timeline */}
      <div className="border-2 border-border rounded-xl overflow-hidden">
        <div className="bg-muted/50 px-4 py-3 border-b-2 border-border flex items-center justify-between">
          <h4 className="font-bold flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Hourly Schedule
          </h4>
          <Button
            size="sm"
            onClick={() => setShowAddForm(true)}
            className="gap-1"
          >
            <Plus className="w-4 h-4" />
            Reserve
          </Button>
        </div>

        <div className="max-h-[400px] overflow-y-auto">
          {hourlySlots.map(({ hour, reservation }) => {
            const isBookedStart = reservation && 
              parseInt(reservation.startTime.split(':')[0]) === hour;

            return (
              <div
                key={hour}
                className={cn(
                  'flex items-stretch border-b border-border last:border-b-0',
                  reservation ? 'bg-primary/10' : 'hover:bg-muted/30'
                )}
              >
                {/* Time label */}
                <div className="w-16 shrink-0 px-3 py-2 text-sm font-mono text-muted-foreground border-r border-border bg-muted/30">
                  {formatHour(hour)}
                </div>

                {/* Slot content */}
                <div className="flex-1 px-3 py-2 min-h-[48px]">
                  {isBookedStart && reservation && (
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-primary" />
                        <span className="font-semibold text-foreground">
                          {reservation.groupName}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {reservation.startTime} - {reservation.endTime}
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => onRemoveReservation(reservation.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                  {reservation && !isBookedStart && (
                    <div className="h-full w-1 bg-primary/30 rounded-full" />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Add Reservation Form */}
      {showAddForm && (
        <div className="border-2 border-primary rounded-xl p-4 space-y-4 bg-primary/5">
          <h4 className="font-bold flex items-center gap-2">
            <Plus className="w-4 h-4" />
            New Reservation
          </h4>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Start Time</label>
              <select
                value={newReservation.startHour}
                onChange={(e) => setNewReservation(prev => ({
                  ...prev,
                  startHour: parseInt(e.target.value)
                }))}
                className="w-full px-3 py-2 rounded-lg border-2 border-input bg-background"
              >
                {HOURS.map(h => (
                  <option key={h} value={h}>{formatHour(h)}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">End Time</label>
              <select
                value={newReservation.endHour}
                onChange={(e) => setNewReservation(prev => ({
                  ...prev,
                  endHour: parseInt(e.target.value)
                }))}
                className="w-full px-3 py-2 rounded-lg border-2 border-input bg-background"
              >
                {HOURS.filter(h => h > newReservation.startHour).map(h => (
                  <option key={h} value={h}>{formatHour(h)}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Group / Person Name *</label>
            <Input
              value={newReservation.groupName}
              onChange={(e) => setNewReservation(prev => ({
                ...prev,
                groupName: e.target.value
              }))}
              placeholder="Enter name..."
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Notes (optional)</label>
            <Input
              value={newReservation.notes}
              onChange={(e) => setNewReservation(prev => ({
                ...prev,
                notes: e.target.value
              }))}
              placeholder="Any special notes..."
            />
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setShowAddForm(false)}
            >
              Cancel
            </Button>
            <Button
              className="flex-1"
              onClick={handleAddReservation}
              disabled={!newReservation.groupName.trim() || newReservation.startHour >= newReservation.endHour}
            >
              Add Reservation
            </Button>
          </div>
        </div>
      )}

      {/* Quick Info */}
      {dayReservations.length > 0 && (
        <div className="text-sm text-muted-foreground text-center">
          {dayReservations.length} reservation{dayReservations.length !== 1 ? 's' : ''} on this day
        </div>
      )}
    </div>
  );
};
