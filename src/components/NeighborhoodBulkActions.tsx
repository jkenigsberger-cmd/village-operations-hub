import React, { useState } from 'react';
import { useVillage } from '@/context/VillageContext';
import { NeighborhoodId } from '@/types/village';
import { 
  Users, 
  Trash2, 
  SparklesIcon, 
  AlertTriangle,
  Calendar,
  X,
  Check
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
    getNeighborhoodReservations
  } = useVillage();

  const [showReserveDialog, setShowReserveDialog] = useState(false);
  const [showConfirmClear, setShowConfirmClear] = useState(false);
  const [reservationForm, setReservationForm] = useState({
    groupName: '',
    checkInDate: new Date().toISOString().split('T')[0],
    checkOutDate: '',
    notes: '',
  });

  const reservations = getNeighborhoodReservations(neighborhoodId);

  const handleReserve = () => {
    if (!reservationForm.groupName || !reservationForm.checkInDate || !reservationForm.checkOutDate) {
      toast.error('Por favor completa todos los campos requeridos');
      return;
    }

    reserveNeighborhood({
      neighborhoodId,
      groupName: reservationForm.groupName,
      checkInDate: reservationForm.checkInDate,
      checkOutDate: reservationForm.checkOutDate,
      notes: reservationForm.notes,
    });

    toast.success(`Vecindario ${neighborhoodName} reservado para ${reservationForm.groupName}`);
    setShowReserveDialog(false);
    setReservationForm({
      groupName: '',
      checkInDate: new Date().toISOString().split('T')[0],
      checkOutDate: '',
      notes: '',
    });
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
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="checkIn">Fecha Check-in *</Label>
                  <Input
                    id="checkIn"
                    type="date"
                    value={reservationForm.checkInDate}
                    onChange={(e) => setReservationForm(prev => ({ ...prev, checkInDate: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="checkOut">Fecha Check-out *</Label>
                  <Input
                    id="checkOut"
                    type="date"
                    value={reservationForm.checkOutDate}
                    onChange={(e) => setReservationForm(prev => ({ ...prev, checkOutDate: e.target.value }))}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Notas</Label>
                <Input
                  id="notes"
                  value={reservationForm.notes}
                  onChange={(e) => setReservationForm(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Notas adicionales..."
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowReserveDialog(false)}>
                Cancelar
              </Button>
              <Button onClick={handleReserve}>
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

      {/* Active Reservations */}
      {reservations.length > 0 && (
        <div className="mt-4 pt-4 border-t">
          <h4 className="font-semibold mb-2">Reservas Activas del Vecindario</h4>
          <div className="space-y-2">
            {reservations.map(r => (
              <div key={r.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div>
                  <span className="font-medium">{r.groupName}</span>
                  <span className="text-sm text-muted-foreground ml-3">
                    {r.checkInDate} → {r.checkOutDate}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
