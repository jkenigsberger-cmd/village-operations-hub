import React, { useState, useMemo } from 'react';
import { useVillage } from '@/context/VillageContext';
import { NeighborhoodId, Tent, TentGender, GenderCount } from '@/types/village';
import { 
  Calendar, 
  Users, 
  Check, 
  X,
  AlertCircle,
  Tent as TentIcon,
  Phone,
  User,
  MessageSquare,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';

interface NeighborhoodReservationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  neighborhoodId: NeighborhoodId;
  neighborhoodName: string;
}

type ReservationMode = 'FULL' | 'SPECIFIC';

export const NeighborhoodReservationModal: React.FC<NeighborhoodReservationModalProps> = ({
  open,
  onOpenChange,
  neighborhoodId,
  neighborhoodName,
}) => {
  const { 
    state,
    reserveNeighborhood, 
    reserveSpecificTents,
    checkNeighborhoodAvailability,
    checkTentAvailability
  } = useVillage();

  const [mode, setMode] = useState<ReservationMode>('FULL');
  const [selectedTentIds, setSelectedTentIds] = useState<string[]>([]);
  const [showOptionalFields, setShowOptionalFields] = useState(false);
  const [availabilityError, setAvailabilityError] = useState<string | null>(null);
  const [tentCount, setTentCount] = useState<number>(0); // Number of tents for FULL mode
  
  // Gender distribution for reservation
  const [genderCounts, setGenderCounts] = useState<GenderCount>({ female: 0, male: 0, mixed: 0 });
  
  // Gender assignments for specific tent mode
  const [tentGenders, setTentGenders] = useState<Record<string, TentGender>>({});
  
  const [peopleCount, setPeopleCount] = useState<number | undefined>(undefined);
  
  const [form, setForm] = useState({
    groupName: '',
    checkInDate: new Date().toISOString().split('T')[0],
    checkOutDate: '',
    contactName: '',
    contactPhone: '',
    notes: '',
  });

  const today = new Date().toISOString().split('T')[0];

  // Get tents for this neighborhood
  const neighborhoodTents = useMemo(() => {
    if (!state) return [];
    const neighborhood = state.neighborhoods[neighborhoodId];
    if (!neighborhood) return [];
    
    return neighborhood.tentIds
      .map(id => state.tents[id])
      .filter(Boolean) as Tent[];
  }, [state, neighborhoodId]);

  // Calculate total beds for selected tents
  const selectedBeds = useMemo(() => {
    return selectedTentIds.reduce((acc, tentId) => {
      const tent = state?.tents[tentId];
      return acc + (tent?.beds.length || 0);
    }, 0);
  }, [selectedTentIds, state]);

  // Total beds in neighborhood
  const totalNeighborhoodBeds = useMemo(() => {
    return neighborhoodTents.reduce((acc, tent) => acc + tent.beds.length, 0);
  }, [neighborhoodTents]);

  // Total gender count sum
  const totalGenderTents = genderCounts.female + genderCounts.male + genderCounts.mixed;
  
  // Calculate estimated beds based on gender distribution
  const estimatedBedsByGender = useMemo(() => {
    if (neighborhoodTents.length === 0) return 0;
    const avgBedsPerTent = totalNeighborhoodBeds / neighborhoodTents.length;
    return Math.round(totalGenderTents * avgBedsPerTent);
  }, [totalGenderTents, totalNeighborhoodBeds, neighborhoodTents.length]);

  // Check availability when dates change
  const handleDateChange = (field: 'checkInDate' | 'checkOutDate', value: string) => {
    const newForm = { ...form, [field]: value };
    setForm(newForm);
    
    if (newForm.checkInDate && newForm.checkOutDate) {
      if (newForm.checkInDate >= newForm.checkOutDate) {
        setAvailabilityError('La fecha de check-out debe ser posterior al check-in');
        return;
      }
      
      if (mode === 'FULL') {
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
        // Check each selected tent
        for (const tentId of selectedTentIds) {
          const availability = checkTentAvailability(tentId, newForm.checkInDate, newForm.checkOutDate);
          if (!availability.available) {
            const tent = state?.tents[tentId];
            setAvailabilityError(
              `⚠️ Carpa ${tent?.code} tiene conflicto con: ${availability.conflictingGroup || 'reserva existente'}`
            );
            return;
          }
        }
        setAvailabilityError(null);
      }
    } else {
      setAvailabilityError(null);
    }
  };

  const handleTentToggle = (tentId: string) => {
    setSelectedTentIds(prev => {
      const newSelection = prev.includes(tentId) 
        ? prev.filter(id => id !== tentId)
        : [...prev, tentId];
      
      // Check availability for new selection
      if (form.checkInDate && form.checkOutDate && !prev.includes(tentId)) {
        const availability = checkTentAvailability(tentId, form.checkInDate, form.checkOutDate);
        if (!availability.available) {
          const tent = state?.tents[tentId];
          toast.error(`Carpa ${tent?.code} no está disponible para estas fechas`);
          return prev;
        }
      }
      
      return newSelection;
    });
    setAvailabilityError(null);
  };

  const handleSelectAll = () => {
    if (selectedTentIds.length === neighborhoodTents.length) {
      setSelectedTentIds([]);
    } else {
      const availableTentIds = neighborhoodTents
        .filter(tent => {
          if (!form.checkInDate || !form.checkOutDate) return true;
          const availability = checkTentAvailability(tent.id, form.checkInDate, form.checkOutDate);
          return availability.available;
        })
        .map(tent => tent.id);
      setSelectedTentIds(availableTentIds);
    }
  };

  const handleSubmit = () => {
    if (!form.groupName.trim()) {
      toast.error('El nombre del grupo es requerido');
      return;
    }
    if (!form.checkInDate || !form.checkOutDate) {
      toast.error('Por favor completa todas las fechas');
      return;
    }
    if (form.checkInDate >= form.checkOutDate) {
      toast.error('La fecha de check-out debe ser posterior al check-in');
      return;
    }
    if (mode === 'SPECIFIC' && selectedTentIds.length === 0) {
      toast.error('Selecciona al menos una carpa');
      return;
    }

    let result;
    
    if (mode === 'FULL') {
      result = reserveNeighborhood({
        neighborhoodId,
        groupName: form.groupName.trim(),
        checkInDate: form.checkInDate,
        checkOutDate: form.checkOutDate,
        reservationType: 'FULL_NEIGHBORHOOD',
        tentCount: totalGenderTents || tentCount || neighborhoodTents.length,
        genderDistribution: totalGenderTents > 0 ? genderCounts : undefined,
        totalPeople: peopleCount,
        contactName: form.contactName || undefined,
        contactPhone: form.contactPhone || undefined,
        notes: form.notes || undefined,
      });
    } else {
      result = reserveSpecificTents({
        neighborhoodId,
        tentIds: selectedTentIds,
        tentGenders,
        groupName: form.groupName.trim(),
        checkInDate: form.checkInDate,
        checkOutDate: form.checkOutDate,
        totalPeople: peopleCount,
        contactName: form.contactName || undefined,
        contactPhone: form.contactPhone || undefined,
        notes: form.notes || undefined,
      });
    }

    if (result.success) {
      const bedCount = mode === 'FULL' ? totalNeighborhoodBeds : selectedBeds;
      toast.success(
        `✓ Reserva creada: ${form.groupName} - ${mode === 'FULL' ? 'Vecindario completo' : `${selectedTentIds.length} carpas`} (${bedCount} camas)`
      );
      handleClose();
    } else {
      toast.error(result.error || 'Error al crear la reserva');
    }
  };

  const handleClose = () => {
    setForm({
      groupName: '',
      checkInDate: new Date().toISOString().split('T')[0],
      checkOutDate: '',
      contactName: '',
      contactPhone: '',
      notes: '',
    });
    setSelectedTentIds([]);
    setMode('FULL');
    setAvailabilityError(null);
    setShowOptionalFields(false);
    setTentCount(0);
    setPeopleCount(undefined);
    setGenderCounts({ female: 0, male: 0, mixed: 0 });
    setTentGenders({});
    onOpenChange(false);
  };

  // Get tent availability status for display
  const getTentStatus = (tent: Tent) => {
    if (!form.checkInDate || !form.checkOutDate) return 'available';
    const availability = checkTentAvailability(tent.id, form.checkInDate, form.checkOutDate);
    return availability.available ? 'available' : 'unavailable';
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        // Only reset when closing. (In controlled mode Radix may request open changes.)
        if (!nextOpen) handleClose();
      }}
    >
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Nueva Reserva - {neighborhoodName}
          </DialogTitle>
          <DialogDescription>
            Reserva el vecindario completo o selecciona carpas específicas
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Reservation Mode Toggle */}
          <div className="flex gap-2">
            <Button
              type="button"
              variant={mode === 'FULL' ? 'default' : 'outline'}
              onClick={() => {
                setMode('FULL');
                setSelectedTentIds([]);
                setAvailabilityError(null);
              }}
              className="flex-1"
            >
              <Users className="w-4 h-4 mr-2" />
              Vecindario Completo
            </Button>
            <Button
              type="button"
              variant={mode === 'SPECIFIC' ? 'default' : 'outline'}
              onClick={() => setMode('SPECIFIC')}
              className="flex-1"
            >
              <TentIcon className="w-4 h-4 mr-2" />
              Carpas Específicas
            </Button>
          </div>

          {/* Basic Info */}
          <div className="space-y-4 p-4 bg-muted/50 rounded-xl">
            <h3 className="font-semibold flex items-center gap-2">
              <Users className="w-4 h-4" />
              Información Básica
            </h3>
            
            <div className="space-y-2">
              <Label htmlFor="groupName">Nombre del Grupo *</Label>
              <Input
                id="groupName"
                value={form.groupName}
                onChange={(e) => setForm(prev => ({ ...prev, groupName: e.target.value }))}
                placeholder="Ej: Grupo Escolar San José"
                maxLength={100}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="checkIn">Check-in *</Label>
                <Input
                  id="checkIn"
                  type="date"
                  value={form.checkInDate}
                  onChange={(e) => handleDateChange('checkInDate', e.target.value)}
                  min={today}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="checkOut">Check-out *</Label>
                <Input
                  id="checkOut"
                  type="date"
                  value={form.checkOutDate}
                  onChange={(e) => handleDateChange('checkOutDate', e.target.value)}
                  min={form.checkInDate || today}
                />
              </div>
            </div>

            {/* People Count */}
            <div className="space-y-2">
              <Label htmlFor="peopleCount" className="flex items-center justify-between">
                <span>Cantidad de Personas</span>
                <span className="text-sm text-muted-foreground font-normal">
                  Máximo: {mode === 'FULL' ? totalNeighborhoodBeds : (selectedBeds || totalNeighborhoodBeds)} camas
                </span>
              </Label>
              <Input
                id="peopleCount"
                type="number"
                min={0}
                max={mode === 'FULL' ? totalNeighborhoodBeds : (selectedBeds || totalNeighborhoodBeds)}
                value={peopleCount ?? ''}
                onChange={(e) => {
                  const val = e.target.value === '' ? undefined : parseInt(e.target.value);
                  setPeopleCount(val);
                }}
                placeholder="Número de personas esperadas..."
                disabled={mode === 'SPECIFIC' && selectedTentIds.length === 0}
              />
              {mode === 'SPECIFIC' && selectedTentIds.length === 0 && (
                <p className="text-sm text-muted-foreground">Selecciona carpas primero</p>
              )}
            </div>

            {/* Availability Error */}
            {availabilityError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{availabilityError}</AlertDescription>
              </Alert>
            )}
          </div>

          {/* Tent Selection (only in SPECIFIC mode) */}
          {mode === 'SPECIFIC' && (
            <div className="space-y-4 p-4 bg-muted/50 rounded-xl">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold flex items-center gap-2">
                  <TentIcon className="w-4 h-4" />
                  Seleccionar Carpas y Género
                </h3>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleSelectAll}
                >
                  {selectedTentIds.length === neighborhoodTents.length ? 'Deseleccionar Todo' : 'Seleccionar Todo'}
                </Button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-80 overflow-y-auto">
                {neighborhoodTents.map(tent => {
                  const status = getTentStatus(tent);
                  const isSelected = selectedTentIds.includes(tent.id);
                  const isDisabled = status === 'unavailable';
                  const currentGender = tentGenders[tent.id] || tent.gender || 'MIXED';
                  
                  const genderBorderColor = isSelected ? (
                    currentGender === 'FEMALE' ? 'border-pink-500 bg-pink-50' :
                    currentGender === 'MALE' ? 'border-blue-500 bg-blue-50' :
                    'border-purple-500 bg-purple-50'
                  ) : '';
                  
                  return (
                    <div
                      key={tent.id}
                      className={cn(
                        'p-3 rounded-lg border-2 transition-all',
                        isDisabled && 'opacity-50 cursor-not-allowed bg-muted',
                        isSelected && !isDisabled && genderBorderColor,
                        !isSelected && !isDisabled && 'border-border hover:border-primary/50'
                      )}
                    >
                      <button
                        type="button"
                        onClick={() => !isDisabled && handleTentToggle(tent.id)}
                        disabled={isDisabled}
                        className="w-full text-left"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{tent.code}</span>
                          <div className="flex items-center gap-1">
                            {isSelected && <Check className="w-4 h-4 text-primary" />}
                            {isDisabled && <X className="w-4 h-4 text-destructive" />}
                          </div>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {tent.beds.length} camas
                        </div>
                        {isDisabled && tent.groupName && (
                          <div className="text-xs text-destructive mt-1">
                            Ocupada: {tent.groupName}
                          </div>
                        )}
                      </button>
                      
                      {/* Gender selector - only show when selected */}
                      {isSelected && !isDisabled && (
                        <div className="flex gap-1 mt-2 pt-2 border-t">
                          <button
                            type="button"
                            onClick={() => setTentGenders(prev => ({ ...prev, [tent.id]: 'FEMALE' }))}
                            className={cn(
                              'flex-1 py-1 rounded text-xs font-medium transition-all',
                              currentGender === 'FEMALE' 
                                ? 'bg-pink-500 text-white' 
                                : 'bg-pink-100 text-pink-700 hover:bg-pink-200'
                            )}
                          >
                            ♀ Fem
                          </button>
                          <button
                            type="button"
                            onClick={() => setTentGenders(prev => ({ ...prev, [tent.id]: 'MALE' }))}
                            className={cn(
                              'flex-1 py-1 rounded text-xs font-medium transition-all',
                              currentGender === 'MALE' 
                                ? 'bg-blue-500 text-white' 
                                : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                            )}
                          >
                            ♂ Masc
                          </button>
                          <button
                            type="button"
                            onClick={() => setTentGenders(prev => ({ ...prev, [tent.id]: 'MIXED' }))}
                            className={cn(
                              'flex-1 py-1 rounded text-xs font-medium transition-all',
                              currentGender === 'MIXED' 
                                ? 'bg-purple-500 text-white' 
                                : 'bg-purple-100 text-purple-700 hover:bg-purple-200'
                            )}
                          >
                            ⚥ Mixto
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {selectedTentIds.length > 0 && (
                <div className="text-sm text-center p-3 bg-primary/10 rounded-lg space-y-1">
                  <div>
                    Seleccionadas: <strong>{selectedTentIds.length}</strong> carpas, <strong>{selectedBeds}</strong> camas
                  </div>
                  {/* Show gender breakdown */}
                  <div className="flex justify-center gap-3 flex-wrap text-xs">
                    {Object.values(tentGenders).filter(g => g === 'FEMALE').length > 0 && (
                      <span className="text-pink-600">♀ {Object.values(tentGenders).filter(g => g === 'FEMALE').length}</span>
                    )}
                    {Object.values(tentGenders).filter(g => g === 'MALE').length > 0 && (
                      <span className="text-blue-600">♂ {Object.values(tentGenders).filter(g => g === 'MALE').length}</span>
                    )}
                    {Object.values(tentGenders).filter(g => g === 'MIXED').length > 0 && (
                      <span className="text-purple-600">⚥ {Object.values(tentGenders).filter(g => g === 'MIXED').length}</span>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Capacity Summary and Tent Count for FULL mode */}
          {mode === 'FULL' && (
            <div className="space-y-4 p-4 bg-muted/50 rounded-xl">
              <h3 className="font-semibold flex items-center gap-2">
                <TentIcon className="w-4 h-4" />
                Distribución de Carpas por Género
              </h3>
              
              {/* Gender distribution inputs */}
              <div className="grid grid-cols-3 gap-3">
                {/* Female */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-pink-600">
                    <span className="w-3 h-3 rounded-full bg-pink-500" />
                    Femenino
                  </Label>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setGenderCounts(prev => ({ ...prev, female: Math.max(0, prev.female - 1) }))}
                      disabled={genderCounts.female === 0}
                      className="w-8 h-8 p-0"
                    >
                      -
                    </Button>
                    <span className="w-8 text-center font-semibold text-pink-600">{genderCounts.female}</span>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setGenderCounts(prev => ({ ...prev, female: Math.min(neighborhoodTents.length - prev.male - prev.mixed, prev.female + 1) }))}
                      disabled={totalGenderTents >= neighborhoodTents.length}
                      className="w-8 h-8 p-0"
                    >
                      +
                    </Button>
                  </div>
                </div>
                
                {/* Male */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-blue-600">
                    <span className="w-3 h-3 rounded-full bg-blue-500" />
                    Masculino
                  </Label>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setGenderCounts(prev => ({ ...prev, male: Math.max(0, prev.male - 1) }))}
                      disabled={genderCounts.male === 0}
                      className="w-8 h-8 p-0"
                    >
                      -
                    </Button>
                    <span className="w-8 text-center font-semibold text-blue-600">{genderCounts.male}</span>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setGenderCounts(prev => ({ ...prev, male: Math.min(neighborhoodTents.length - prev.female - prev.mixed, prev.male + 1) }))}
                      disabled={totalGenderTents >= neighborhoodTents.length}
                      className="w-8 h-8 p-0"
                    >
                      +
                    </Button>
                  </div>
                </div>
                
                {/* Mixed */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-purple-600">
                    <span className="w-3 h-3 rounded-full bg-purple-500" />
                    Mixto
                  </Label>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setGenderCounts(prev => ({ ...prev, mixed: Math.max(0, prev.mixed - 1) }))}
                      disabled={genderCounts.mixed === 0}
                      className="w-8 h-8 p-0"
                    >
                      -
                    </Button>
                    <span className="w-8 text-center font-semibold text-purple-600">{genderCounts.mixed}</span>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setGenderCounts(prev => ({ ...prev, mixed: Math.min(neighborhoodTents.length - prev.female - prev.male, prev.mixed + 1) }))}
                      disabled={totalGenderTents >= neighborhoodTents.length}
                      className="w-8 h-8 p-0"
                    >
                      +
                    </Button>
                  </div>
                </div>
              </div>

              {totalGenderTents > 0 && (
                <div className="text-sm text-center p-3 bg-primary/10 rounded-lg space-y-1">
                  <div className="flex justify-center gap-4 flex-wrap">
                    {genderCounts.female > 0 && (
                      <span className="text-pink-600">♀ {genderCounts.female} carpas</span>
                    )}
                    {genderCounts.male > 0 && (
                      <span className="text-blue-600">♂ {genderCounts.male} carpas</span>
                    )}
                    {genderCounts.mixed > 0 && (
                      <span className="text-purple-600">⚥ {genderCounts.mixed} carpas</span>
                    )}
                  </div>
                  <div>
                    <strong>{totalGenderTents}</strong> carpas = aprox. <strong>{estimatedBedsByGender}</strong> camas
                  </div>
                </div>
              )}
              
              <div className="text-xs text-muted-foreground text-center">
                Capacidad máxima: {neighborhoodTents.length} carpas, {totalNeighborhoodBeds} camas
              </div>
            </div>
          )}

          {/* Optional Fields Toggle */}
          <button
            type="button"
            onClick={() => setShowOptionalFields(!showOptionalFields)}
            className="w-full flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
          >
            <span className="font-medium">Información Adicional (Opcional)</span>
            {showOptionalFields ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {/* Optional Fields */}
          {showOptionalFields && (
            <div className="space-y-4 p-4 bg-muted/30 rounded-xl">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="contactName" className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Contacto Responsable
                  </Label>
                  <Input
                    id="contactName"
                    value={form.contactName}
                    onChange={(e) => setForm(prev => ({ ...prev, contactName: e.target.value }))}
                    placeholder="Nombre del contacto"
                    maxLength={100}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contactPhone" className="flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    Teléfono
                  </Label>
                  <Input
                    id="contactPhone"
                    type="tel"
                    value={form.contactPhone}
                    onChange={(e) => setForm(prev => ({ ...prev, contactPhone: e.target.value }))}
                    placeholder="+1 234 567 8900"
                    maxLength={20}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes" className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" />
                  Notas
                </Label>
                <Textarea
                  id="notes"
                  value={form.notes}
                  onChange={(e) => setForm(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Notas adicionales sobre la reserva..."
                  maxLength={500}
                  rows={3}
                />
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button type="button" variant="outline" onClick={handleClose}>
            Cancelar
          </Button>
          <Button 
            type="button"
            onClick={() => {
              console.log('Create reservation clicked', { mode, form, selectedTentIds, availabilityError });
              handleSubmit();
            }}
            disabled={!!availabilityError || (mode === 'SPECIFIC' && selectedTentIds.length === 0)}
          >
            <Check className="w-4 h-4 mr-2" />
            Crear Reserva
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
