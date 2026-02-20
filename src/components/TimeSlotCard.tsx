import React from 'react';
import { TimeSlot, LOCATION_LABELS } from '@/types/kitchen';
import { Clock, MapPin, Users, AlertTriangle } from 'lucide-react';

interface TimeSlotCardProps {
  slot: TimeSlot;
  onClick: () => void;
}

export const TimeSlotCard: React.FC<TimeSlotCardProps> = ({ slot, onClick }) => {
  const totalSpecial = 
    slot.specialDiets.vegetarian + 
    slot.specialDiets.vegan + 
    slot.specialDiets.glutenFree + 
    slot.specialDiets.lactoseFree + 
    slot.specialDiets.lifeThreatening +
    slot.specialDiets.mehadrinKosher +
    slot.specialDiets.sensitivities;

  const locationLabel = LOCATION_LABELS[slot.location];

  return (
    <button
      onClick={onClick}
      className="w-full bg-card border-2 border-border rounded-2xl p-5 text-right transition-all hover:border-primary hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-primary"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          {/* Time and Location */}
          <div className="flex items-center gap-4 mb-3">
            <div className="flex items-center gap-2 text-lg font-bold text-foreground">
              <Clock className="w-5 h-5 text-muted-foreground" />
              <span>{slot.time}</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="w-4 h-4" />
              <span className="text-sm">{locationLabel}</span>
            </div>
          </div>

          {/* Total Diners */}
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-5 h-5 text-primary" />
            <span className="text-2xl font-bold text-foreground">{slot.totalPax}</span>
            <span className="text-muted-foreground">סועדים</span>
          </div>

          {/* Special Diets */}
          {totalSpecial > 0 && (
            <div className="flex items-center gap-2 text-amber-600">
              <AlertTriangle className="w-4 h-4" />
              <span className="font-medium">{totalSpecial} מיוחדים</span>
            </div>
          )}
        </div>

        {/* Location indicator */}
        <div className={`w-3 h-3 rounded-full ${
          slot.location === 'DINING_HALL' ? 'bg-green-500' : 'bg-amber-500'
        }`} />
      </div>
    </button>
  );
};
