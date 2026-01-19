import React, { useState, useMemo } from 'react';
import { useVillage } from '@/context/VillageContext';
import { Tent, TentGender, Bed as BedType } from '@/types/village';
import { 
  X,
  Users,
  Calendar,
  Sparkles,
  Bath,
  ShowerHead,
  Accessibility,
  MessageSquare,
  User,
  Save
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';

interface TentDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tent: Tent | null;
}

const genderOptions: { value: TentGender; label: string; icon: string }[] = [
  { value: 'MIXED', label: 'Mixto', icon: '👥' },
  { value: 'MALE', label: 'Hombres', icon: '♂️' },
  { value: 'FEMALE', label: 'Mujeres', icon: '♀️' },
];

export const TentDetailModal: React.FC<TentDetailModalProps> = ({
  open,
  onOpenChange,
  tent,
}) => {
  const { 
    state,
    updateTentGroupName,
    updateTentDates,
    updateTentNotes,
    updateTentGender,
    updateTentPrivateBathroom,
    updateTentPrivateShower,
    updateBedGuestName,
  } = useVillage();

  const [localGuestNames, setLocalGuestNames] = useState<Record<string, string>>({});

  // Initialize local state when tent changes
  React.useEffect(() => {
    if (tent) {
      const names: Record<string, string> = {};
      tent.beds.forEach(bed => {
        names[bed.id] = bed.guestName || '';
      });
      setLocalGuestNames(names);
    }
  }, [tent?.id]);

  if (!tent || !state) return null;

  const isVIP = tent.isVIP;

  const handleGenderChange = (gender: TentGender) => {
    updateTentGender(tent.id, gender);
    toast.success(`Carpa marcada como: ${genderOptions.find(g => g.value === gender)?.label}`);
  };

  const handleBathroomToggle = (checked: boolean) => {
    updateTentPrivateBathroom(tent.id, checked);
    toast.success(checked ? 'Baño privado agregado' : 'Baño privado removido');
  };

  const handleShowerToggle = (checked: boolean) => {
    updateTentPrivateShower(tent.id, checked);
    toast.success(checked ? 'Ducha privada agregada' : 'Ducha privada removida');
  };

  const handleGuestNameChange = (bedId: string, name: string) => {
    setLocalGuestNames(prev => ({ ...prev, [bedId]: name }));
  };

  const handleGuestNameBlur = (bedId: string) => {
    const name = localGuestNames[bedId] || '';
    updateBedGuestName(bedId, name);
  };

  const handleSaveAllNames = () => {
    Object.entries(localGuestNames).forEach(([bedId, name]) => {
      updateBedGuestName(bedId, name);
    });
    toast.success('Nombres guardados');
  };

  // Organize beds by bunk
  const { bunkBeds, singleBeds } = useMemo(() => {
    if (!tent) return { bunkBeds: [], singleBeds: [] };

    const bunks: { top: BedType; bottom: BedType }[] = [];
    const singles: BedType[] = [];

    const bunkTops = tent.beds.filter(b => b.type === 'BUNK_TOP');
    const bunkBottoms = tent.beds.filter(b => b.type === 'BUNK_BOTTOM');

    bunkTops.forEach(top => {
      const bottom = bunkBottoms.find(b => b.bunkNumber === top.bunkNumber);
      if (bottom) {
        bunks.push({ top, bottom });
      }
    });

    tent.beds.filter(b => b.type === 'SINGLE').forEach(bed => {
      singles.push(bed);
    });

    return { bunkBeds: bunks, singleBeds: singles };
  }, [tent]);

  const stats = {
    total: tent.beds.length,
    free: tent.beds.filter(b => b.status === 'FREE').length,
    reserved: tent.beds.filter(b => b.status === 'RESERVED').length,
    occupied: tent.beds.filter(b => b.status === 'OCCUPIED').length,
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <span className="text-2xl font-bold">{tent.code}</span>
            {isVIP && (
              <span className="px-2 py-1 bg-amber-500 text-white rounded-full text-sm font-semibold flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                VIP
              </span>
            )}
            {tent.isAccessible && (
              <span className="px-2 py-1 bg-primary text-primary-foreground rounded-full text-sm">
                <Accessibility className="w-3 h-3" />
              </span>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Stats */}
          <div className="flex gap-2 flex-wrap">
            <span className="px-3 py-1.5 bg-green-100 text-green-800 rounded-lg text-sm font-medium">
              {stats.free} Libre
            </span>
            <span className="px-3 py-1.5 bg-blue-100 text-blue-800 rounded-lg text-sm font-medium">
              {stats.reserved} Reservada
            </span>
            <span className="px-3 py-1.5 bg-orange-100 text-orange-800 rounded-lg text-sm font-medium">
              {stats.occupied} Ocupada
            </span>
          </div>

          {/* Group Info */}
          <div className="space-y-4 p-4 bg-muted/50 rounded-xl">
            <h3 className="font-semibold flex items-center gap-2">
              <Users className="w-4 h-4" />
              Información del Grupo
            </h3>
            
            <div className="space-y-2">
              <Label>Nombre del Grupo</Label>
              <Input
                value={tent.groupName || ''}
                onChange={(e) => updateTentGroupName(tent.id, e.target.value)}
                placeholder="Nombre del grupo..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Check-in
                </Label>
                <Input
                  type="date"
                  value={tent.checkInDate || ''}
                  onChange={(e) => updateTentDates(tent.id, e.target.value, tent.checkOutDate)}
                />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Check-out
                </Label>
                <Input
                  type="date"
                  value={tent.checkOutDate || ''}
                  onChange={(e) => updateTentDates(tent.id, tent.checkInDate, e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Gender Designation */}
          <div className="space-y-3 p-4 bg-muted/50 rounded-xl">
            <h3 className="font-semibold">Designación de Género</h3>
            <div className="flex gap-2">
              {genderOptions.map(option => (
                <Button
                  key={option.value}
                  type="button"
                  variant={tent.gender === option.value || (!tent.gender && option.value === 'MIXED') ? 'default' : 'outline'}
                  onClick={() => handleGenderChange(option.value)}
                  className="flex-1"
                >
                  <span className="mr-2">{option.icon}</span>
                  {option.label}
                </Button>
              ))}
            </div>
          </div>

          {/* VIP Options - Bathroom & Shower */}
          {isVIP && (
            <div className="space-y-4 p-4 bg-amber-50 border border-amber-200 rounded-xl">
              <h3 className="font-semibold flex items-center gap-2 text-amber-800">
                <Sparkles className="w-4 h-4" />
                Opciones VIP
              </h3>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Bath className="w-5 h-5 text-amber-700" />
                  <div>
                    <Label className="text-base">Baño Privado</Label>
                    <p className="text-sm text-muted-foreground">Agregar baño a esta carpa</p>
                  </div>
                </div>
                <Switch
                  checked={tent.hasPrivateBathroom || false}
                  onCheckedChange={handleBathroomToggle}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <ShowerHead className="w-5 h-5 text-amber-700" />
                  <div>
                    <Label className="text-base">Ducha Privada</Label>
                    <p className="text-sm text-muted-foreground">Agregar ducha a esta carpa</p>
                  </div>
                </div>
                <Switch
                  checked={tent.hasPrivateShower || false}
                  onCheckedChange={handleShowerToggle}
                />
              </div>
            </div>
          )}

          {/* Guest Names */}
          <div className="space-y-4 p-4 bg-muted/50 rounded-xl">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold flex items-center gap-2">
                <User className="w-4 h-4" />
                Nombres de Huéspedes
              </h3>
              <Button size="sm" variant="outline" onClick={handleSaveAllNames}>
                <Save className="w-4 h-4 mr-1" />
                Guardar
              </Button>
            </div>

            {/* Bunk Beds */}
            {bunkBeds.length > 0 && (
              <div className="space-y-3">
                <Label className="text-sm text-muted-foreground">Literas</Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {bunkBeds.map((bunk, index) => (
                    <div key={`bunk-${index}`} className="p-3 bg-background rounded-lg border">
                      <div className="text-sm font-medium mb-2">Litera {bunk.top.bunkNumber}</div>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground w-16">Arriba:</span>
                          <Input
                            value={localGuestNames[bunk.top.id] || ''}
                            onChange={(e) => handleGuestNameChange(bunk.top.id, e.target.value)}
                            onBlur={() => handleGuestNameBlur(bunk.top.id)}
                            placeholder="Nombre..."
                            className="h-8 text-sm"
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground w-16">Abajo:</span>
                          <Input
                            value={localGuestNames[bunk.bottom.id] || ''}
                            onChange={(e) => handleGuestNameChange(bunk.bottom.id, e.target.value)}
                            onBlur={() => handleGuestNameBlur(bunk.bottom.id)}
                            placeholder="Nombre..."
                            className="h-8 text-sm"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Single Beds */}
            {singleBeds.length > 0 && (
              <div className="space-y-3">
                <Label className="text-sm text-muted-foreground">Camas Individuales</Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {singleBeds.map((bed) => (
                    <div key={bed.id} className="flex items-center gap-2">
                      <span className="text-sm font-medium w-20">{bed.label}:</span>
                      <Input
                        value={localGuestNames[bed.id] || ''}
                        onChange={(e) => handleGuestNameChange(bed.id, e.target.value)}
                        onBlur={() => handleGuestNameBlur(bed.id)}
                        placeholder="Nombre..."
                        className="h-8 text-sm"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              Notas
            </Label>
            <Textarea
              value={tent.notes || ''}
              onChange={(e) => updateTentNotes(tent.id, e.target.value)}
              placeholder="Notas sobre esta carpa..."
              rows={3}
            />
          </div>
        </div>

        {/* Close Button */}
        <div className="flex justify-end pt-4 border-t">
          <Button onClick={() => onOpenChange(false)}>
            Cerrar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
