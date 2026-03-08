import React, { useState } from 'react';
import { MealType, SpecialDiets, MEAL_LABELS, LOCATION_LABELS, DIETARY_CATEGORIES, DIET_LABELS } from '@/types/kitchen';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Clock, MapPin, Users, Plus, AlertTriangle } from 'lucide-react';

interface AddTimeSlotModalProps {
  open: boolean;
  mealType: MealType;
  onClose: () => void;
  onAdd: (time: string, location: 'DINING_HALL' | 'OUTSIDE', totalPax: number, specialDiets: SpecialDiets) => void;
}

const DEFAULT_TIMES: Record<MealType, string> = {
  BREAKFAST: '08:00',
  LUNCH: '13:00',
  DINNER: '19:00',
};

const DEFAULT_SPECIAL_DIETS: SpecialDiets = {
  vegetarian: 0, vegan: 0, glutenFree: 0, lactoseFree: 0, lifeThreatening: 0, mehadrinKosher: 0, eggFree: 0, nutFree: 0, notes: '',
};

export const AddTimeSlotModal: React.FC<AddTimeSlotModalProps> = ({
  open,
  mealType,
  onClose,
  onAdd,
}) => {
  const [time, setTime] = useState(DEFAULT_TIMES[mealType]);
  const [location, setLocation] = useState<'DINING_HALL' | 'OUTSIDE'>('DINING_HALL');
  const [totalPax, setTotalPax] = useState(0);
  const [specialDiets, setSpecialDiets] = useState<SpecialDiets>(DEFAULT_SPECIAL_DIETS);

  const handleAdd = () => {
    onAdd(time, location, totalPax, specialDiets);
    setTime(DEFAULT_TIMES[mealType]);
    setLocation('DINING_HALL');
    setTotalPax(0);
    setSpecialDiets(DEFAULT_SPECIAL_DIETS);
    onClose();
  };

  const updateDiet = (key: keyof Omit<SpecialDiets, 'notes'>, value: number) => {
    setSpecialDiets(prev => ({ ...prev, [key]: Math.max(0, value) }));
  };

  const totalSpecial = DIETARY_CATEGORIES.reduce((sum, c) => sum + (specialDiets[c.key] || 0), 0);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
            <Plus className="w-6 h-6" />
            הוסף משבצת ל{MEAL_LABELS[mealType]}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 pt-4">
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
              placeholder="0"
            />
            {totalPax === 0 && (
              <p className="text-sm text-amber-600 flex items-center gap-1">
                <AlertTriangle className="w-4 h-4" />
                מספר סועדים לא הוגדר
              </p>
            )}
          </div>

          {/* Special Diets - Always Visible */}
          <div className="space-y-4 border-t pt-4">
            <Label className="text-lg font-bold flex items-center gap-2">
              ⚠️ דרישות מיוחדות
              {totalSpecial > 0 && (
                <span className="text-sm font-normal text-amber-600">({totalSpecial} מיוחדים)</span>
              )}
            </Label>
            
            <div className="grid grid-cols-2 gap-3">
              {DIETARY_CATEGORIES.map(({ key, icon, label }) => (
                <div key={key} className="flex items-center gap-2 bg-muted/30 rounded-lg p-3">
                  <span className="text-sm flex-1">{icon} {label}</span>
                  <Input
                    type="number"
                    min={0}
                    value={specialDiets[key]}
                    onChange={e => updateDiet(key, parseInt(e.target.value) || 0)}
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

          {/* Add Button */}
          <Button onClick={handleAdd} className="w-full h-14 text-xl gap-2">
            <Plus className="w-6 h-6" />
            הוסף משבצת
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
