import React, { useState, useEffect } from 'react';
import { TimeSlot, SpecialDiets, MealGroup, LOCATION_LABELS, DIET_LABELS } from '@/types/kitchen';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Clock, MapPin, Users, Save, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { format } from 'date-fns';

interface TimeSlotDetailModalProps {
  slot: TimeSlot | null;
  open: boolean;
  onClose: () => void;
  onSave: (updates: Partial<Omit<TimeSlot, 'id' | 'date' | 'mealType'>>) => void;
  onDelete: () => void;
}

export const TimeSlotDetailModal: React.FC<TimeSlotDetailModalProps> = ({
  slot,
  open,
  onClose,
  onSave,
  onDelete,
}) => {
  const [time, setTime] = useState('');
  const [location, setLocation] = useState<'DINING_HALL' | 'OUTSIDE'>('DINING_HALL');
  const [totalPax, setTotalPax] = useState(0);
  const [specialDiets, setSpecialDiets] = useState<SpecialDiets>({
    vegetarian: 0,
    vegan: 0,
    glutenFree: 0,
    lactoseFree: 0,
    allergies: 0,
    notes: '',
  });
  const [groups, setGroups] = useState<MealGroup[]>([]);
  const [groupsOpen, setGroupsOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (slot) {
      setTime(slot.time);
      setLocation(slot.location);
      setTotalPax(slot.totalPax);
      setSpecialDiets(slot.specialDiets);
      setGroups(slot.groups);
      setConfirmDelete(false);
    }
  }, [slot]);

  const handleSave = () => {
    onSave({
      time,
      location,
      totalPax,
      specialDiets,
      groups,
    });
    onClose();
  };

  const handleDelete = () => {
    if (confirmDelete) {
      onDelete();
      onClose();
    } else {
      setConfirmDelete(true);
    }
  };

  const updateDiet = (key: keyof Omit<SpecialDiets, 'notes'>, value: number) => {
    setSpecialDiets(prev => ({ ...prev, [key]: Math.max(0, value) }));
  };

  if (!slot) return null;

  const updatedTime = slot.updatedAt 
    ? format(new Date(slot.updatedAt), 'HH:mm')
    : '';

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">פרטי משבצת זמן</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Summary */}
          <div className="bg-muted/50 rounded-xl p-4 space-y-2">
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <span>עדכון אחרון: {updatedTime}</span>
            </div>
          </div>

          {/* Time */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-lg">
              <Clock className="w-5 h-5" />
              שעה
            </Label>
            <Input
              type="time"
              value={time}
              onChange={e => setTime(e.target.value)}
              className="text-xl font-bold h-14 text-center"
            />
          </div>

          {/* Location */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-lg">
              <MapPin className="w-5 h-5" />
              מיקום
            </Label>
            <div className="grid grid-cols-2 gap-3">
              <Button
                type="button"
                variant={location === 'DINING_HALL' ? 'default' : 'outline'}
                onClick={() => setLocation('DINING_HALL')}
                className="h-14 text-lg"
              >
                {LOCATION_LABELS.DINING_HALL}
              </Button>
              <Button
                type="button"
                variant={location === 'OUTSIDE' ? 'default' : 'outline'}
                onClick={() => setLocation('OUTSIDE')}
                className="h-14 text-lg"
              >
                {LOCATION_LABELS.OUTSIDE}
              </Button>
            </div>
          </div>

          {/* Total Diners */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-lg">
              <Users className="w-5 h-5" />
              סה״כ סועדים
            </Label>
            <Input
              type="number"
              min={0}
              value={totalPax}
              onChange={e => setTotalPax(parseInt(e.target.value) || 0)}
              className="text-3xl font-bold h-16 text-center"
            />
          </div>

          {/* Special Diets */}
          <div className="space-y-4">
            <Label className="text-lg font-bold">⚠️ דרישות מיוחדות</Label>
            
            <div className="grid grid-cols-2 gap-3">
              {(Object.keys(DIET_LABELS) as Array<keyof typeof DIET_LABELS>)
                .filter(key => key !== 'notes')
                .map(key => (
                  <div key={key} className="flex items-center gap-2 bg-muted/30 rounded-lg p-3">
                    <span className="text-sm flex-1">{DIET_LABELS[key]}</span>
                    <Input
                      type="number"
                      min={0}
                      value={specialDiets[key as keyof Omit<SpecialDiets, 'notes'>]}
                      onChange={e => updateDiet(
                        key as keyof Omit<SpecialDiets, 'notes'>,
                        parseInt(e.target.value) || 0
                      )}
                      className="w-16 h-10 text-center font-bold"
                    />
                  </div>
                ))}
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label className="text-sm">{DIET_LABELS.notes}</Label>
              <Textarea
                value={specialDiets.notes}
                onChange={e => setSpecialDiets(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="הערות נוספות..."
                className="min-h-[80px]"
              />
            </div>
          </div>

          {/* Groups (Collapsible) */}
          {groups.length > 0 && (
            <Collapsible open={groupsOpen} onOpenChange={setGroupsOpen}>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" className="w-full justify-between h-12">
                  <span>קבוצות ({groups.length})</span>
                  {groupsOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-2 mt-2">
                {groups.map((group, idx) => (
                  <div key={idx} className="flex items-center justify-between bg-muted/30 rounded-lg p-3">
                    <span className="font-medium">{group.name}</span>
                    <span className="text-muted-foreground">{group.pax} אנשים</span>
                  </div>
                ))}
              </CollapsibleContent>
            </Collapsible>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t">
            <Button onClick={handleSave} className="flex-1 h-14 text-lg gap-2">
              <Save className="w-5 h-5" />
              שמור
            </Button>
            <Button 
              variant={confirmDelete ? 'destructive' : 'outline'} 
              onClick={handleDelete}
              className="h-14 text-lg gap-2"
            >
              <Trash2 className="w-5 h-5" />
              {confirmDelete ? 'לחץ לאישור' : 'מחק'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
