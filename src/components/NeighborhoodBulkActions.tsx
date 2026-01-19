import React, { useState, useMemo } from 'react';
import { useVillage } from '@/context/VillageContext';
import { NeighborhoodId } from '@/types/village';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { 
  Users, 
  Trash2, 
  SparklesIcon, 
  AlertTriangle,
  Calendar,
  X,
  Check,
  AlertCircle,
  CalendarCheck,
  CalendarX
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface NeighborhoodBulkActionsProps {
  neighborhoodId: NeighborhoodId;
  neighborhoodName: string;
}

export const NeighborhoodBulkActions: React.FC<NeighborhoodBulkActionsProps> = ({
  neighborhoodId,
  neighborhoodName,
}) => {
  const { 
    reserveNeighborhood, 
    markNeighborhoodDirty, 
    markNeighborhoodClean,
    clearNeighborhoodBeds,
    getNeighborhoodReservations,
    checkNeighborhoodAvailability,
    removeNeighborhoodReservation
  } = useVillage();

  const [showReserveDialog, setShowReserveDialog] = useState(false);
  const [showConfirmClear, setShowConfirmClear] = useState(false);
  const [availabilityError, setAvailabilityError] = useState<string | null>(null);
  const [reservationForm, setReservationForm] = useState({
    groupName: '',
    checkInDate: new Date().toISOString().split('T')[0],
    checkOutDate: '',
    notes: '',
  });

  const reservations = getNeighborhoodReservations(neighborhoodId);
  const today = new Date().toISOString().split('T')[0];

  // Get upcoming check-ins and check-outs
  const upcomingEvents = useMemo(() => {
    return reservations
      .filter(r => r.checkOutDate >= today)
      .sort((a, b) => a.checkInDate.localeCompare(b.checkInDate));
  }, [reservations, today]);

  // Check availability when dates change
  const handleDateChange = (field: 'checkInDate' | 'checkOutDate', value: string) => {
    const newForm = { ...reservationForm, [field]: value };
    setReservationForm(newForm);
    
    // Validate dates when both are set
    if (newForm.checkInDate && newForm.checkOutDate) {
      if (newForm.checkInDate >= newForm.checkOutDate) {
        setAvailabilityError('La fecha de check-out debe ser posterior al check-in');
        return;
      }
      
      const availability = checkNeighborhoodAvailability(
        neighborhoodId, 
        newForm.checkInDate, 
        newForm.checkOutDate
      );
      
      if (!availability.available && availability.conflictingReservation) {
        setAvailabilityError(
          `⚠️ Conflicto: "${availability.conflictingReservation.groupName}" ya tiene reserva del ${availability.conflictingReservation.checkInDate} al ${availability.conflictingReservation.checkOutDate}`
        );
      } else {
        setAvailabilityError(null);
      }
    } else {
      setAvailabilityError(null);
    }
  };

  const handleReserve = () => {
    if (!reservationForm.groupName.trim()) {
      toast.error('El nombre del grupo es requerido');
      return;
    }
    if (!reservationForm.checkInDate || !reservationForm.checkOutDate) {
      toast.error('Por favor completa todas las fechas');
      return;
    }
    if (reservationForm.checkInDate >= reservationForm.checkOutDate) {
      toast.error('La fecha de check-out debe ser posterior al check-in');
      return;
    }

    const result = reserveNeighborhood({
      neighborhoodId,
      groupName: reservationForm.groupName.trim(),
      checkInDate: reservationForm.checkInDate,
      checkOutDate: reservationForm.checkOutDate,
      notes: reservationForm.notes,
      reservationType: 'FULL_NEIGHBORHOOD',
    });

    if (result.success) {
      toast.success(`✓ Vecindario ${neighborhoodName} reservado para ${reservationForm.groupName}`);
      setShowReserveDialog(false);
      setReservationForm({
        groupName: '',
        checkInDate: new Date().toISOString().split('T')[0],
        checkOutDate: '',
        notes: '',
      });
      setAvailabilityError(null);
    } else {
      toast.error(result.error || 'Error al crear la reserva');
    }
  };

  const handleRemoveReservation = (reservationId: string, groupName: string) => {
    removeNeighborhoodReservation(reservationId);
    toast.success(`Reserva de "${groupName}" eliminada`);
  };

  const handleMarkDirty = () => {
    markNeighborhoodDirty(neighborhoodId);
    toast.success(`Todas las carpas de ${neighborhoodName} marcadas como sucias`);
  };

  const handleMarkClean = () => {
    markNeighborhoodClean(neighborhoodId);
    toast.success(`Todas las carpas de ${neighborhoodName} marcadas como limpias`);
  };

  const handleClearBeds = () => {
    clearNeighborhoodBeds(neighborhoodId);
    toast.success(`Todas las camas de ${neighborhoodName} liberadas`);
    setShowConfirmClear(false);
  };

  return (
    <div className="tile p-4 mb-6">
      <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
        <Users className="w-5 h-5" />
        Acciones Grupales - {neighborhoodName}
      </h3>

      <div className="flex flex-wrap gap-3">
        {/* Reserve Neighborhood */}
        <Dialog open={showReserveDialog} onOpenChange={setShowReserveDialog}>
          <DialogTrigger asChild>
            <Button variant="default" className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Reservar Vecindario Completo
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Reservar {neighborhoodName}</DialogTitle>
              <DialogDescription>
                Esto reservará todas las camas del vecindario para el grupo especificado.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="groupName">Nombre del Grupo *</Label>
                <Input
                  id="groupName"
                  value={reservationForm.groupName}
                  onChange={(e) => setReservationForm(prev => ({ ...prev, groupName: e.target.value }))}
                  placeholder="Ej: Grupo Escolar San José"
                  maxLength={100}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="checkIn">Fecha Check-in *</Label>
                  <Input
                    id="checkIn"
                    type="date"
                    value={reservationForm.checkInDate}
                    onChange={(e) => handleDateChange('checkInDate', e.target.value)}
                    min={today}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="checkOut">Fecha Check-out *</Label>
                  <Input
                    id="checkOut"
                    type="date"
                    value={reservationForm.checkOutDate}
                    onChange={(e) => handleDateChange('checkOutDate', e.target.value)}
                    min={reservationForm.checkInDate || today}
                  />
                </div>
              </div>

              {/* Availability Error */}
              {availabilityError && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{availabilityError}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="notes">Notas</Label>
                <Input
                  id="notes"
                  value={reservationForm.notes}
                  onChange={(e) => setReservationForm(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Notas adicionales..."
                  maxLength={500}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => {
                setShowReserveDialog(false);
                setAvailabilityError(null);
              }}>
                Cancelar
              </Button>
              <Button 
                onClick={handleReserve}
                disabled={!!availabilityError}
              >
                <Check className="w-4 h-4 mr-2" />
                Reservar
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Mark All Dirty */}
        <Button 
          variant="outline" 
          onClick={handleMarkDirty}
          className="flex items-center gap-2 border-amber-500 text-amber-700 hover:bg-amber-50"
        >
          <AlertTriangle className="w-4 h-4" />
          Marcar Todo Sucio
        </Button>

        {/* Mark All Clean */}
        <Button 
          variant="outline" 
          onClick={handleMarkClean}
          className="flex items-center gap-2 border-green-500 text-green-700 hover:bg-green-50"
        >
          <SparklesIcon className="w-4 h-4" />
          Marcar Todo Limpio
        </Button>

        {/* Clear All Beds */}
        <Dialog open={showConfirmClear} onOpenChange={setShowConfirmClear}>
          <DialogTrigger asChild>
            <Button 
              variant="outline" 
              className="flex items-center gap-2 border-red-500 text-red-700 hover:bg-red-50"
            >
              <Trash2 className="w-4 h-4" />
              Liberar Todas las Camas
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="text-red-600">⚠️ Confirmar Acción</DialogTitle>
              <DialogDescription>
                Esto liberará TODAS las camas de {neighborhoodName}, eliminando reservas, 
                nombres de huéspedes y fechas. Esta acción no se puede deshacer.
              </DialogDescription>
            </DialogHeader>
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setShowConfirmClear(false)}>
                Cancelar
              </Button>
              <Button variant="destructive" onClick={handleClearBeds}>
                <Trash2 className="w-4 h-4 mr-2" />
                Sí, Liberar Todo
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Upcoming Events - Check-ins and Check-outs */}
      {upcomingEvents.length > 0 && (
        <div className="mt-4 pt-4 border-t">
          <h4 className="font-semibold mb-3 flex items-center gap-2">
            <CalendarCheck className="w-4 h-4" />
            Reservas Programadas
          </h4>
          <div className="space-y-2">
            {upcomingEvents.map(r => {
              const isCheckInToday = r.checkInDate === today;
              const isCheckOutToday = r.checkOutDate === today;
              
              return (
                <div 
                  key={r.id} 
                  className={cn(
                    "flex items-center justify-between p-3 rounded-lg border-2",
                    isCheckInToday ? "bg-green-50 border-green-300" :
                    isCheckOutToday ? "bg-orange-50 border-orange-300" :
                    "bg-muted border-transparent"
                  )}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{r.groupName}</span>
                      {isCheckInToday && (
                        <span className="text-xs bg-green-600 text-white px-2 py-0.5 rounded-full flex items-center gap-1">
                          <CalendarCheck className="w-3 h-3" />
                          CHECK-IN HOY
                        </span>
                      )}
                      {isCheckOutToday && (
                        <span className="text-xs bg-orange-600 text-white px-2 py-0.5 rounded-full flex items-center gap-1">
                          <CalendarX className="w-3 h-3" />
                          CHECK-OUT HOY
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">
                      📅 {r.checkInDate} → {r.checkOutDate}
                      {r.notes && <span className="ml-2 italic">({r.notes})</span>}
                    </div>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    onClick={() => handleRemoveReservation(r.id, r.groupName)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* No reservations message */}
      {upcomingEvents.length === 0 && (
        <div className="mt-4 pt-4 border-t text-center text-muted-foreground py-4">
          <Calendar className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p>No hay reservas programadas para este vecindario</p>
        </div>
      )}
    </div>
  );
};
