import { useState, useEffect, useCallback } from 'react';
import { KitchenState, TimeSlot, MealType, SpecialDiets, MealGroup } from '@/types/kitchen';

const STORAGE_KEY = 'aharonson_farm_kitchen_state';

const getDefaultSpecialDiets = (): SpecialDiets => ({
  vegetarian: 0,
  vegan: 0,
  glutenFree: 0,
  lactoseFree: 0,
  allergies: 0,
  notes: '',
});

const generateId = () => Math.random().toString(36).substring(2, 11);

export const useKitchenData = () => {
  const [state, setState] = useState<KitchenState>({ timeSlots: {} });
  const [isLoading, setIsLoading] = useState(true);

  // Load from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as KitchenState;
        setState(parsed);
      }
    } catch (error) {
      console.error('Error loading kitchen state:', error);
    }
    setIsLoading(false);
  }, []);

  // Save to localStorage
  const saveState = useCallback((newState: KitchenState) => {
    setState(newState);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
    } catch (error) {
      console.error('Error saving kitchen state:', error);
    }
  }, []);

  // Get time slots for a specific date
  const getTimeSlotsForDate = useCallback((date: string): TimeSlot[] => {
    return Object.values(state.timeSlots)
      .filter(slot => slot.date === date)
      .sort((a, b) => a.time.localeCompare(b.time));
  }, [state.timeSlots]);

  // Get time slots for a specific date and meal type
  const getTimeSlotsForMeal = useCallback((date: string, mealType: MealType): TimeSlot[] => {
    return Object.values(state.timeSlots)
      .filter(slot => slot.date === date && slot.mealType === mealType)
      .sort((a, b) => a.time.localeCompare(b.time));
  }, [state.timeSlots]);

  // Add a new time slot
  const addTimeSlot = useCallback((
    date: string,
    mealType: MealType,
    time: string,
    location: 'DINING_HALL' | 'OUTSIDE',
    totalPax: number = 0,
    specialDiets: SpecialDiets = getDefaultSpecialDiets(),
    groups: MealGroup[] = []
  ): string => {
    const id = generateId();
    const newSlot: TimeSlot = {
      id,
      date,
      mealType,
      time,
      location,
      totalPax,
      specialDiets,
      groups,
      updatedAt: new Date().toISOString(),
    };

    const newState: KitchenState = {
      ...state,
      timeSlots: {
        ...state.timeSlots,
        [id]: newSlot,
      },
    };
    saveState(newState);
    return id;
  }, [state, saveState]);

  // Update a time slot
  const updateTimeSlot = useCallback((
    id: string,
    updates: Partial<Omit<TimeSlot, 'id' | 'date' | 'mealType'>>
  ) => {
    const slot = state.timeSlots[id];
    if (!slot) return;

    const updatedSlot: TimeSlot = {
      ...slot,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    const newState: KitchenState = {
      ...state,
      timeSlots: {
        ...state.timeSlots,
        [id]: updatedSlot,
      },
    };
    saveState(newState);
  }, [state, saveState]);

  // Delete a time slot
  const deleteTimeSlot = useCallback((id: string) => {
    const { [id]: _, ...rest } = state.timeSlots;
    const newState: KitchenState = {
      ...state,
      timeSlots: rest,
    };
    saveState(newState);
  }, [state, saveState]);

  // Get a single time slot
  const getTimeSlot = useCallback((id: string): TimeSlot | null => {
    return state.timeSlots[id] || null;
  }, [state.timeSlots]);

  return {
    state,
    isLoading,
    getTimeSlotsForDate,
    getTimeSlotsForMeal,
    addTimeSlot,
    updateTimeSlot,
    deleteTimeSlot,
    getTimeSlot,
  };
};
