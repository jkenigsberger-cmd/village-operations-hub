import React, { useState, useMemo } from 'react';
import { format, addDays, isSameDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { FacilityReservation } from '@/types/village';
import { cn } from '@/lib/utils';
import { 
  CalendarIcon, 
  Clock, 
  Plus, 
  Trash2, 
  ChevronLeft, 
  ChevronRight,
  Users,
  Check,
  StickyNote,
  X
} from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { GroupSelector, ActiveGroup } from '@/components/GroupSelector';

interface FacilityReservationCalendarProps {
  facilityId: string;
  facilityLabel: string;
  reservations: FacilityReservation[];
  onAddReservation: (reservation: Omit<FacilityReservation, 'id' | 'createdAt'>) => boolean;
  onRemoveReservation: (reservationId: string) => void;
}

const HOURS = Array.from({ length: 17 }, (_, i) => i + 6); // 6:00 to 22:00

const formatHour = (hour: number) => {
  return `${hour.toString().padStart(2, '0')}:00`;
};

// Generate a random pleasant color for groups
const generateGroupColor = (): string => {
  const hues = [0, 30, 60, 120, 180, 210, 270, 300, 330]; // Various hue values
  const hue = hues[Math.floor(Math.random() * hues.length)];
  const saturation = 55 + Math.random() * 25; // 55-80%
  const lightness = 55 + Math.random() * 15; // 55-70%
  return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
};

// Get contrasting text color
const getContrastColor = (hslColor: string): string => {
  const match = hslColor.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/);
  if (match) {
    const lightness = parseInt(match[3]);
    return lightness > 60 ? 'hsl(30, 20%, 15%)' : 'hsl(40, 40%, 98%)';
  }
  return 'hsl(30, 20%, 15%)';
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
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showNotesDialog, setShowNotesDialog] = useState(false);
  const [selectedReservation, setSelectedReservation] = useState<FacilityReservation | null>(null);
  const [selectedSlotHour, setSelectedSlotHour] = useState<number | null>(null);
  const [newReservation, setNewReservation] = useState({
    startHour: 9,
    endHour: 10,
    groupName: '',
    numberOfPeople: '',
    notes: '',
  });
  const [selectedActiveGroup, setSelectedActiveGroup] = useState<ActiveGroup | undefined>();

  // Get reservations for selected date
  const dayReservations = useMemo(() => {
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    return reservations.filter(r => r.date === dateStr);
  }, [reservations, selectedDate]);

  // Build hourly grid showing which slots are booked
  const hourlySlots = useMemo(() => {
    return HOURS.map(hour => {
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

  const handleSlotClick = (hour: number, reservation: FacilityReservation | undefined) => {
    if (reservation) {
      // Show reservation details with notes
      setSelectedReservation(reservation);
      setShowNotesDialog(true);
      return;
    }
    // Open reservation dialog with selected hour
    setSelectedSlotHour(hour);
    setNewReservation({
      startHour: hour,
      endHour: hour + 1,
      groupName: '',
      numberOfPeople: '',
      notes: '',
    });
    setSelectedActiveGroup(undefined);
    setShowAddDialog(true);
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
      numberOfPeople: newReservation.numberOfPeople ? parseInt(newReservation.numberOfPeople) : undefined,
      groupColor: generateGroupColor(),
      notes: newReservation.notes.trim() || undefined,
    });

    if (success) {
      toast.success('Reserva guardada exitosamente');
      setNewReservation({ startHour: 9, endHour: 10, groupName: '', numberOfPeople: '', notes: '' });
      setShowAddDialog(false);
      setSelectedSlotHour(null);
    }
  };

  const handleCloseDialog = () => {
    setShowAddDialog(false);
    setSelectedSlotHour(null);
    setNewReservation({ startHour: 9, endHour: 10, groupName: '', numberOfPeople: '', notes: '' });
    setSelectedActiveGroup(undefined);
  };

  const handleGroupSelect = (groupName: string, activeGroup?: ActiveGroup) => {
    setNewReservation(prev => ({
      ...prev,
      groupName,
      numberOfPeople: activeGroup?.totalBeds?.toString() || prev.numberOfPeople,
    }));
    setSelectedActiveGroup(activeGroup);
  };

  const isToday = isSameDay(selectedDate, new Date());

  return (
    <div className="space-y-4">
      {/* Date Navigation */}
      <div className="flex items-center justify-between gap-4">
        <Button variant="outline" size="icon" onClick={handlePrevDay}>
          <ChevronLeft className="w-5 h-5" />
        </Button>

        <Popover open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" className="flex-1 justify-center gap-2 text-base">
              <CalendarIcon className="w-5 h-5" />
              <span className="font-bold">
                {isToday ? 'Hoy' : format(selectedDate, "EEEE d 'de' MMMM", { locale: es })}
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
          <ChevronRight className="w-5 h-5" />
        </Button>
      </div>

      {/* Hourly Timeline */}
      <div className="border-2 border-border rounded-xl overflow-hidden">
        <div className="bg-muted/50 px-4 py-3 border-b-2 border-border flex items-center justify-between">
          <h4 className="font-bold flex items-center gap-2 text-lg">
            <Clock className="w-5 h-5" />
            Horario
          </h4>
          <span className="text-sm text-muted-foreground">
            Toca un horario libre para reservar
          </span>
        </div>

        <div className="max-h-[450px] overflow-y-auto">
          {hourlySlots.map(({ hour, reservation }) => {
            const isBookedStart = reservation && 
              parseInt(reservation.startTime.split(':')[0]) === hour;
            const isBooked = !!reservation;
            const bgColor = reservation?.groupColor || 'transparent';
            const textColor = reservation?.groupColor ? getContrastColor(reservation.groupColor) : undefined;

            return (
              <div
                key={hour}
                onClick={() => handleSlotClick(hour, reservation)}
                className={cn(
                  'flex items-stretch border-b border-border last:border-b-0 transition-all cursor-pointer',
                  !isBooked && 'hover:bg-primary/10 active:scale-[0.99]',
                  isBooked && 'hover:opacity-90'
                )}
              >
                {/* Time label */}
                <div className="w-20 shrink-0 px-3 py-3 text-base font-mono text-muted-foreground border-r border-border bg-muted/30 flex items-center">
                  {formatHour(hour)}
                </div>

                {/* Slot content */}
                <div 
                  className={cn(
                    'flex-1 px-4 py-3 min-h-[56px] flex items-center',
                    isBooked && 'relative'
                  )}
                  style={isBooked ? { 
                    backgroundColor: bgColor,
                    color: textColor 
                  } : undefined}
                >
                  {isBookedStart && reservation && (
                    <div className="flex items-center justify-between gap-2 w-full">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <Users className="w-5 h-5 shrink-0" style={{ color: textColor }} />
                        <div className="flex flex-col min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-base truncate" style={{ color: textColor }}>
                              {reservation.groupName}
                            </span>
                            {reservation.notes && (
                              <StickyNote className="w-4 h-4 shrink-0 opacity-70" style={{ color: textColor }} />
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-sm opacity-80">
                            <span>{reservation.startTime} - {reservation.endTime}</span>
                            {reservation.numberOfPeople && (
                              <span>• {reservation.numberOfPeople} personas</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-10 w-10 shrink-0 hover:bg-black/10"
                        onClick={(e) => {
                          e.stopPropagation();
                          onRemoveReservation(reservation.id);
                        }}
                      >
                        <Trash2 className="w-5 h-5" style={{ color: textColor }} />
                      </Button>
                    </div>
                  )}
                  {isBooked && !isBookedStart && (
                    <div className="flex items-center gap-2 opacity-60">
                      <div className="h-1 w-8 rounded-full" style={{ backgroundColor: textColor }} />
                      <span className="text-sm font-medium" style={{ color: textColor }}>
                        {reservation.groupName} (cont.)
                      </span>
                    </div>
                  )}
                  {!isBooked && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Plus className="w-4 h-4" />
                      <span className="text-sm">Disponible</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Add Reservation Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-md max-h-[90vh] flex flex-col">
          <DialogHeader className="shrink-0">
            <DialogTitle className="flex items-center gap-2 text-xl">
              <Plus className="w-5 h-5" />
              Nueva Reserva
            </DialogTitle>
            <DialogDescription>
              Completa los datos para reservar este espacio
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4 overflow-y-auto flex-1">
            <div className="bg-muted/50 rounded-lg p-3 text-center">
              <span className="text-muted-foreground">Fecha:</span>{' '}
              <span className="font-bold">{format(selectedDate, "d 'de' MMMM, yyyy", { locale: es })}</span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold">Hora Inicio</label>
                <select
                  value={newReservation.startHour}
                  onChange={(e) => setNewReservation(prev => ({
                    ...prev,
                    startHour: parseInt(e.target.value),
                    endHour: Math.max(prev.endHour, parseInt(e.target.value) + 1)
                  }))}
                  className="w-full px-3 py-3 rounded-lg border-2 border-input bg-background text-base"
                >
                  {HOURS.map(h => (
                    <option key={h} value={h}>{formatHour(h)}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold">Hora Fin</label>
                <select
                  value={newReservation.endHour}
                  onChange={(e) => setNewReservation(prev => ({
                    ...prev,
                    endHour: parseInt(e.target.value)
                  }))}
                  className="w-full px-3 py-3 rounded-lg border-2 border-input bg-background text-base"
                >
                  {HOURS.filter(h => h > newReservation.startHour).map(h => (
                    <option key={h} value={h}>{formatHour(h)}</option>
                  ))}
                  <option value={23}>23:00</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold">Nombre del Grupo *</label>
              <GroupSelector
                date={format(selectedDate, 'yyyy-MM-dd')}
                selectedGroup={newReservation.groupName}
                onSelectGroup={handleGroupSelect}
                placeholder="Seleccionar grupo..."
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold">Cantidad de Personas</label>
              <Input
                type="number"
                value={newReservation.numberOfPeople}
                onChange={(e) => setNewReservation(prev => ({
                  ...prev,
                  numberOfPeople: e.target.value
                }))}
                placeholder="Ej: 25"
                className="text-base py-3"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold">Notas Importantes</label>
              <Textarea
                value={newReservation.notes}
                onChange={(e) => setNewReservation(prev => ({
                  ...prev,
                  notes: e.target.value
                }))}
                placeholder="Ej: Necesitan proyector, traen comida kosher..."
                className="text-base min-h-[80px]"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 shrink-0 pt-4 border-t">
            <Button
              variant="outline"
              onClick={handleCloseDialog}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleAddReservation}
              disabled={!newReservation.groupName.trim() || newReservation.startHour >= newReservation.endHour}
              className="flex-1"
            >
              <Check className="w-4 h-4 mr-2" />
              Guardar y Salir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Notes Dialog */}
      <Dialog open={showNotesDialog} onOpenChange={setShowNotesDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <StickyNote className="w-5 h-5" />
              Detalles de Reserva
            </DialogTitle>
            <DialogDescription>
              Información completa de la reserva
            </DialogDescription>
          </DialogHeader>

          {selectedReservation && (
            <div className="space-y-4 py-4">
              <div 
                className="rounded-xl p-4"
                style={{ 
                  backgroundColor: selectedReservation.groupColor || 'hsl(var(--primary))',
                  color: selectedReservation.groupColor ? getContrastColor(selectedReservation.groupColor) : 'hsl(var(--primary-foreground))'
                }}
              >
                <h3 className="font-bold text-lg">{selectedReservation.groupName}</h3>
                <p className="opacity-80">
                  {selectedReservation.startTime} - {selectedReservation.endTime}
                  {selectedReservation.numberOfPeople && ` • ${selectedReservation.numberOfPeople} personas`}
                </p>
              </div>

              {selectedReservation.notes ? (
                <div className="space-y-2">
                  <h4 className="font-semibold flex items-center gap-2">
                    <StickyNote className="w-4 h-4" />
                    Notas Importantes
                  </h4>
                  <div className="bg-muted/50 rounded-lg p-4 text-base">
                    {selectedReservation.notes}
                  </div>
                </div>
              ) : (
                <div className="bg-muted/30 rounded-lg p-4 text-center text-muted-foreground">
                  No hay notas para esta reserva
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button
              onClick={() => {
                setShowNotesDialog(false);
                setSelectedReservation(null);
              }}
              className="w-full"
            >
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Quick Info */}
      {dayReservations.length > 0 && (
        <div className="bg-muted/50 rounded-xl p-4">
          <h5 className="font-semibold mb-2 flex items-center gap-2">
            <Users className="w-4 h-4" />
            Reservas del día ({dayReservations.length})
          </h5>
          <div className="flex flex-wrap gap-2">
            {dayReservations.map(r => (
              <div
                key={r.id}
                onClick={() => {
                  setSelectedReservation(r);
                  setShowNotesDialog(true);
                }}
                className="px-3 py-1.5 rounded-full text-sm font-medium flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
                style={{ 
                  backgroundColor: r.groupColor || 'hsl(var(--primary))',
                  color: r.groupColor ? getContrastColor(r.groupColor) : 'hsl(var(--primary-foreground))'
                }}
              >
                <span>{r.groupName}</span>
                <span className="opacity-70">{r.startTime}-{r.endTime}</span>
                {r.notes && <StickyNote className="w-3 h-3 opacity-70" />}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
