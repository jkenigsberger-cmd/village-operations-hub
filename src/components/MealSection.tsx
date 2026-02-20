import React from 'react';
import { TimeSlot, MealType, MEAL_LABELS } from '@/types/kitchen';
import { TimeSlotCard } from './TimeSlotCard';
import { Button } from '@/components/ui/button';
import { Plus, Sunrise, Sun, Moon } from 'lucide-react';

interface MealSectionProps {
  mealType: MealType;
  slots: TimeSlot[];
  onSlotClick: (slot: TimeSlot) => void;
  onAddSlot: () => void;
}

const MEAL_ICONS: Record<MealType, React.ReactNode> = {
  BREAKFAST: <Sunrise className="w-6 h-6" />,
  LUNCH: <Sun className="w-6 h-6" />,
  DINNER: <Moon className="w-6 h-6" />,
};

const MEAL_COLORS: Record<MealType, string> = {
  BREAKFAST: 'bg-amber-50 border-amber-200',
  LUNCH: 'bg-orange-50 border-orange-200',
  DINNER: 'bg-indigo-50 border-indigo-200',
};

export const MealSection: React.FC<MealSectionProps> = ({
  mealType,
  slots,
  onSlotClick,
  onAddSlot,
}) => {
  const totalPax = slots.reduce((sum, slot) => sum + slot.totalPax, 0);
  const totalSpecial = slots.reduce((sum, slot) => 
    sum + slot.specialDiets.vegetarian + 
    slot.specialDiets.vegan + 
    slot.specialDiets.glutenFree + 
    slot.specialDiets.lactoseFree + 
    slot.specialDiets.lifeThreatening +
    slot.specialDiets.mehadrinKosher +
    slot.specialDiets.sensitivities, 0
  );

  return (
    <div className={`rounded-2xl border-2 p-5 ${MEAL_COLORS[mealType]}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🍽️</span>
          {MEAL_ICONS[mealType]}
          <h2 className="text-2xl font-bold text-foreground">
            {MEAL_LABELS[mealType]}
          </h2>
        </div>
        
        {/* Summary */}
        <div className="flex items-center gap-4 text-lg">
          {slots.length > 0 && (
            <>
              <span className="font-bold text-foreground">{totalPax} סועדים</span>
              {totalSpecial > 0 && (
                <span className="text-amber-600">⚠️ {totalSpecial} מיוחדים</span>
              )}
            </>
          )}
        </div>
      </div>

      {/* Time Slots */}
      <div className="space-y-3">
        {slots.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p className="text-lg">אין משבצות זמן</p>
            <p className="text-sm">לחץ על הכפתור להוספה</p>
          </div>
        ) : (
          slots.map(slot => (
            <TimeSlotCard
              key={slot.id}
              slot={slot}
              onClick={() => onSlotClick(slot)}
            />
          ))
        )}
      </div>

      {/* Add Button */}
      <Button
        onClick={onAddSlot}
        variant="outline"
        className="w-full mt-4 h-12 text-lg gap-2 border-dashed border-2"
      >
        <Plus className="w-5 h-5" />
        הוסף משבצת זמן
      </Button>
    </div>
  );
};
