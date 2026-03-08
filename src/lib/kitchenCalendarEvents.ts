import { TimeSlot, MEAL_LABELS, LOCATION_LABELS, MealType, getTotalSpecialCount } from '@/types/kitchen';
import { CalendarEvent } from '@/types/village';

export const KITCHEN_EVENT_COLOR = 'hsl(45, 80%, 45%)'; // Warm amber/gold color

// Default meal durations in minutes
const MEAL_DURATIONS: Record<MealType, number> = {
  BREAKFAST: 60,
  LUNCH: 90,
  DINNER: 90,
};

/**
 * Calculate special diets count (excluding notes)
 */
export const getSpecialCount = (slot: TimeSlot): number => getTotalSpecialCount(slot.specialDiets);

/**
 * Calculate end time based on meal type
 */
const calculateEndTime = (startTime: string, mealType: MealType): string => {
  const [hours, minutes] = startTime.split(':').map(Number);
  const totalMinutes = hours * 60 + minutes + MEAL_DURATIONS[mealType];
  const endHours = Math.floor(totalMinutes / 60) % 24;
  const endMinutes = totalMinutes % 60;
  return `${endHours.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}`;
};

/**
 * Convert a kitchen time slot to a calendar event
 */
export const timeSlotToCalendarEvent = (slot: TimeSlot): CalendarEvent => {
  const specialCount = getSpecialCount(slot);
  const mealLabel = MEAL_LABELS[slot.mealType];
  const locationLabel = LOCATION_LABELS[slot.location];
  
  let title = `${mealLabel} – ${slot.totalPax} סועדים`;
  if (slot.location === 'OUTSIDE') {
    title += ` (${locationLabel})`;
  }
  if (specialCount > 0) {
    title += ` ⚠️ ${specialCount} מיוחדים`;
  }

  return {
    id: `kitchen_${slot.id}`,
    type: 'KITCHEN',
    title,
    groupName: mealLabel,
    startDate: slot.date,
    startTime: slot.time,
    endTime: calculateEndTime(slot.time, slot.mealType),
    location: locationLabel,
    color: KITCHEN_EVENT_COLOR,
    metadata: {
      slotId: slot.id,
      mealType: slot.mealType,
      totalPax: slot.totalPax,
      specialDiets: slot.specialDiets,
      specialCount,
      locationCode: slot.location,
      updatedAt: slot.updatedAt,
    },
  };
};

/**
 * Convert all kitchen time slots to calendar events
 */
export const kitchenSlotsToCalendarEvents = (
  timeSlots: Record<string, TimeSlot>
): CalendarEvent[] => {
  return Object.values(timeSlots).map(timeSlotToCalendarEvent);
};
