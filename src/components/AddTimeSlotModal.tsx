import React, { useState } from 'react';
import { MealType, MEAL_LABELS, LOCATION_LABELS } from '@/types/kitchen';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Clock, MapPin, Users, Plus } from 'lucide-react';

interface AddTimeSlotModalProps {
  open: boolean;
  mealType: MealType;
  onClose: () => void;
  onAdd: (time: string, location: 'DINING_HALL' | 'OUTSIDE', totalPax: number) => void;
}

const DEFAULT_TIMES: Record<MealType, string> = {
  BREAKFAST: '08:00',
  LUNCH: '13:00',
  DINNER: '19:00',
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

  const handleAdd = () => {
    onAdd(time, location, totalPax);
    // Reset form
    setTime(DEFAULT_TIMES[mealType]);
    setLocation('DINING_HALL');
    setTotalPax(0);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md" dir="rtl">
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
