import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useKitchenData } from '@/hooks/useKitchenData';
import { MealType, TimeSlot, MEAL_LABELS } from '@/types/kitchen';
import { MealSection } from '@/components/MealSection';
import { TimeSlotDetailModal } from '@/components/TimeSlotDetailModal';
import { AddTimeSlotModal } from '@/components/AddTimeSlotModal';
import { Button } from '@/components/ui/button';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format, addDays, subDays, isToday } from 'date-fns';
import { he } from 'date-fns/locale';
import { 
  ArrowRight, 
  ChefHat, 
  Calendar, 
  ChevronLeft, 
  ChevronRight,
  Loader2
} from 'lucide-react';

const Kitchen: React.FC = () => {
  const navigate = useNavigate();
  const {
    isLoading,
    getTimeSlotsForMeal,
    addTimeSlot,
    updateTimeSlot,
    deleteTimeSlot,
    getTimeSlot,
  } = useKitchenData();

  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [addMealType, setAddMealType] = useState<MealType>('LUNCH');

  const dateStr = format(selectedDate, 'yyyy-MM-dd');

  // Get slots for each meal type
  const breakfastSlots = useMemo(() => getTimeSlotsForMeal(dateStr, 'BREAKFAST'), [dateStr, getTimeSlotsForMeal]);
  const lunchSlots = useMemo(() => getTimeSlotsForMeal(dateStr, 'LUNCH'), [dateStr, getTimeSlotsForMeal]);
  const dinnerSlots = useMemo(() => getTimeSlotsForMeal(dateStr, 'DINNER'), [dateStr, getTimeSlotsForMeal]);

  const handleSlotClick = (slot: TimeSlot) => {
    setSelectedSlot(slot);
    setDetailModalOpen(true);
  };

  const handleAddSlot = (mealType: MealType) => {
    setAddMealType(mealType);
    setAddModalOpen(true);
  };

  const handleAddConfirm = (time: string, location: 'DINING_HALL' | 'OUTSIDE', totalPax: number) => {
    addTimeSlot(dateStr, addMealType, time, location, totalPax);
  };

  const handleSaveSlot = (updates: Partial<Omit<TimeSlot, 'id' | 'date' | 'mealType'>>) => {
    if (selectedSlot) {
      updateTimeSlot(selectedSlot.id, updates);
      // Refresh the slot
      const updated = getTimeSlot(selectedSlot.id);
      if (updated) setSelectedSlot(updated);
    }
  };

  const handleDeleteSlot = () => {
    if (selectedSlot) {
      deleteTimeSlot(selectedSlot.id);
      setSelectedSlot(null);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin mx-auto text-primary" />
          <p className="mt-4 text-xl">טוען נתוני מטבח...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      {/* Header */}
      <header className="bg-card border-b-2 border-border sticky top-0 z-10">
        <div className="container py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/')}
              className="shrink-0"
            >
              <ArrowRight className="w-6 h-6" />
            </Button>
            <div className="flex items-center gap-3 flex-1">
              <ChefHat className="w-8 h-8 text-primary" />
              <div>
                <h1 className="text-2xl font-bold text-foreground">
                  🍽️ מטבח / ארוחות
                </h1>
                <p className="text-muted-foreground text-sm">
                  תכנון ארוחות יומי
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Date Selector */}
      <div className="bg-muted/30 border-b border-border">
        <div className="container py-4">
          <div className="flex items-center justify-center gap-3">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setSelectedDate(d => subDays(d, 1))}
            >
              <ChevronRight className="w-5 h-5" />
            </Button>

            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="min-w-[200px] h-12 text-lg gap-2">
                  <Calendar className="w-5 h-5" />
                  {isToday(selectedDate) ? (
                    <span className="font-bold">היום</span>
                  ) : (
                    format(selectedDate, 'EEEE, d בMMMM', { locale: he })
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="center">
                <CalendarComponent
                  mode="single"
                  selected={selectedDate}
                  onSelect={date => date && setSelectedDate(date)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>

            <Button
              variant="outline"
              size="icon"
              onClick={() => setSelectedDate(d => addDays(d, 1))}
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>

            {!isToday(selectedDate) && (
              <Button
                variant="ghost"
                onClick={() => setSelectedDate(new Date())}
                className="text-sm"
              >
                חזור להיום
              </Button>
            )}
          </div>

          {/* Date Display */}
          <p className="text-center mt-2 text-lg text-muted-foreground">
            {format(selectedDate, 'EEEE, d בMMMM yyyy', { locale: he })}
          </p>
        </div>
      </div>

      {/* Main Content */}
      <main className="container py-6 space-y-6">
        {/* Breakfast */}
        <MealSection
          mealType="BREAKFAST"
          slots={breakfastSlots}
          onSlotClick={handleSlotClick}
          onAddSlot={() => handleAddSlot('BREAKFAST')}
        />

        {/* Lunch */}
        <MealSection
          mealType="LUNCH"
          slots={lunchSlots}
          onSlotClick={handleSlotClick}
          onAddSlot={() => handleAddSlot('LUNCH')}
        />

        {/* Dinner */}
        <MealSection
          mealType="DINNER"
          slots={dinnerSlots}
          onSlotClick={handleSlotClick}
          onAddSlot={() => handleAddSlot('DINNER')}
        />
      </main>

      {/* Detail Modal */}
      <TimeSlotDetailModal
        slot={selectedSlot}
        open={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        onSave={handleSaveSlot}
        onDelete={handleDeleteSlot}
      />

      {/* Add Modal */}
      <AddTimeSlotModal
        open={addModalOpen}
        mealType={addMealType}
        onClose={() => setAddModalOpen(false)}
        onAdd={handleAddConfirm}
      />
    </div>
  );
};

export default Kitchen;
