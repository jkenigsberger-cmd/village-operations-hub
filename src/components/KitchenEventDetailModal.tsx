import React from 'react';
import { useNavigate } from 'react-router-dom';
import { CalendarEvent } from '@/types/village';
import { MEAL_LABELS, DIET_LABELS, SpecialDiets, MealType } from '@/types/kitchen';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Clock, MapPin, Users, ChefHat, ExternalLink } from 'lucide-react';
import { format, parseISO } from 'date-fns';

interface KitchenEventDetailModalProps {
  event: CalendarEvent | null;
  isOpen: boolean;
  onClose: () => void;
}

export const KitchenEventDetailModal: React.FC<KitchenEventDetailModalProps> = ({
  event,
  isOpen,
  onClose,
}) => {
  const navigate = useNavigate();

  if (!event || event.type !== 'KITCHEN') return null;

  const { metadata } = event;
  const mealType = metadata.mealType as MealType;
  const totalPax = metadata.totalPax as number;
  const specialDiets = metadata.specialDiets as SpecialDiets;
  const specialCount = metadata.specialCount as number;
  const locationCode = metadata.locationCode as string;
  const updatedAt = metadata.updatedAt as string;
  const slotId = metadata.slotId as string;

  const handleOpenInKitchen = () => {
    // Navigate to kitchen with date parameter
    navigate(`/kitchen?date=${event.startDate}&slot=${slotId}`);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <ChefHat className="w-6 h-6" />
            {MEAL_LABELS[mealType]}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Summary Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
              <Clock className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">שעה</p>
                <p className="font-semibold">{event.startTime} - {event.endTime}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
              <MapPin className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">מיקום</p>
                <p className="font-semibold">{event.location}</p>
              </div>
            </div>
          </div>

          {/* Total Diners */}
          <div className="flex items-center gap-3 p-4 bg-primary/10 rounded-lg">
            <Users className="w-8 h-8 text-primary" />
            <div>
              <p className="text-sm text-muted-foreground">סה״כ סועדים</p>
              <p className="text-3xl font-bold">{totalPax}</p>
            </div>
            {specialCount > 0 && (
              <div className="mr-auto text-center">
                <p className="text-sm text-muted-foreground">מיוחדים</p>
                <p className="text-2xl font-bold text-amber-600">⚠️ {specialCount}</p>
              </div>
            )}
          </div>

          <Separator />

          {/* Special Diets Breakdown */}
          <div>
            <h4 className="font-semibold mb-3">צרכים תזונתיים</h4>
            <div className="grid grid-cols-2 gap-2">
              {specialDiets.vegetarian > 0 && (
                <div className="flex justify-between p-2 bg-green-50 dark:bg-green-950/30 rounded">
                  <span>{DIET_LABELS.vegetarian}</span>
                  <span className="font-bold">{specialDiets.vegetarian}</span>
                </div>
              )}
              {specialDiets.vegan > 0 && (
                <div className="flex justify-between p-2 bg-green-50 dark:bg-green-950/30 rounded">
                  <span>{DIET_LABELS.vegan}</span>
                  <span className="font-bold">{specialDiets.vegan}</span>
                </div>
              )}
              {specialDiets.glutenFree > 0 && (
                <div className="flex justify-between p-2 bg-amber-50 dark:bg-amber-950/30 rounded">
                  <span>{DIET_LABELS.glutenFree}</span>
                  <span className="font-bold">{specialDiets.glutenFree}</span>
                </div>
              )}
              {specialDiets.lactoseFree > 0 && (
                <div className="flex justify-between p-2 bg-amber-50 dark:bg-amber-950/30 rounded">
                  <span>{DIET_LABELS.lactoseFree}</span>
                  <span className="font-bold">{specialDiets.lactoseFree}</span>
                </div>
              )}
              {specialDiets.lifeThreatening > 0 && (
                <div className="flex justify-between p-2 bg-red-50 dark:bg-red-950/30 rounded col-span-2">
                  <span>{DIET_LABELS.lifeThreatening}</span>
                  <span className="font-bold">{specialDiets.lifeThreatening}</span>
                </div>
              )}
              {specialDiets.mehadrinKosher > 0 && (
                <div className="flex justify-between p-2 bg-blue-50 dark:bg-blue-950/30 rounded">
                  <span>{DIET_LABELS.mehadrinKosher}</span>
                  <span className="font-bold">{specialDiets.mehadrinKosher}</span>
                </div>
              )}
              {specialDiets.sensitivities > 0 && (
                <div className="flex justify-between p-2 bg-orange-50 dark:bg-orange-950/30 rounded">
                  <span>{DIET_LABELS.sensitivities}</span>
                  <span className="font-bold">{specialDiets.sensitivities}</span>
                </div>
              )}
            </div>
            {specialCount === 0 && (
              <p className="text-muted-foreground text-sm text-center py-2">
                אין צרכים מיוחדים
              </p>
            )}
          </div>

          {/* Notes */}
          {specialDiets.notes && (
            <div>
              <h4 className="font-semibold mb-2">הערות</h4>
              <p className="text-sm p-3 bg-muted rounded-lg whitespace-pre-wrap">
                {specialDiets.notes}
              </p>
            </div>
          )}

          {/* Last Updated */}
          {updatedAt && (
            <p className="text-xs text-muted-foreground text-center">
              עודכן: {format(parseISO(updatedAt), 'HH:mm dd/MM/yyyy')}
            </p>
          )}

          <Separator />

          {/* Action Button */}
          <Button
            onClick={handleOpenInKitchen}
            className="w-full gap-2"
            size="lg"
          >
            <ExternalLink className="w-4 h-4" />
            פתח במטבח
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
