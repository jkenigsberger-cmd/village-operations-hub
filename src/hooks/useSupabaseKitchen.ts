// @refresh reset - Force full refresh when this file changes
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { KitchenState, TimeSlot, MealType, SpecialDiets, MealGroup } from '@/types/kitchen';

// Helper to generate random IDs
const generateId = () => Math.random().toString(36).substring(2, 11);

const getDefaultSpecialDiets = (): SpecialDiets => ({
  vegetarian: 0,
  vegan: 0,
  glutenFree: 0,
  lactoseFree: 0,
  allergies: 0,
  notes: '',
});

export const useSupabaseKitchen = () => {
  const [state, setState] = useState<KitchenState>({ timeSlots: {} });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load all time slots from Supabase
  const loadTimeSlots = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('kitchen_time_slots')
        .select('*')
        .order('date', { ascending: true });

      if (fetchError) throw fetchError;

      // Transform database rows to KitchenState format
      const timeSlots: Record<string, TimeSlot> = {};
      
      (data || []).forEach(slot => {
        timeSlots[slot.id] = {
          id: slot.id,
          date: slot.date,
          mealType: slot.meal_type as MealType,
          time: slot.time,
          location: slot.location as 'DINING_HALL' | 'OUTSIDE',
          totalPax: slot.total_pax,
          specialDiets: (slot.special_diets as unknown as SpecialDiets) || getDefaultSpecialDiets(),
          groups: (slot.groups as unknown as MealGroup[]) || [],
          updatedAt: slot.updated_at
        };
      });

      setState({ timeSlots });
      return { timeSlots };
    } catch (err) {
      console.error('Error loading kitchen data from Supabase:', err);
      setError(err instanceof Error ? err.message : 'Failed to load kitchen data');
      return { timeSlots: {} };
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    loadTimeSlots();
  }, [loadTimeSlots]);

  // Set up realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel('kitchen-time-slots-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'kitchen_time_slots' }, () => loadTimeSlots())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadTimeSlots]);

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
  const addTimeSlot = useCallback(async (
    date: string,
    mealType: MealType,
    time: string,
    location: 'DINING_HALL' | 'OUTSIDE',
    totalPax: number = 0,
    specialDiets: SpecialDiets = getDefaultSpecialDiets(),
    groups: MealGroup[] = []
  ): Promise<string> => {
    const id = generateId();
    
    const { error: insertError } = await supabase.from('kitchen_time_slots').insert({
      id,
      date,
      meal_type: mealType,
      time,
      location,
      total_pax: totalPax,
      special_diets: JSON.parse(JSON.stringify(specialDiets)),
      groups: JSON.parse(JSON.stringify(groups))
    });

    if (insertError) throw insertError;
    return id;
  }, []);

  // Update a time slot
  const updateTimeSlot = useCallback(async (
    id: string,
    updates: Partial<Omit<TimeSlot, 'id' | 'date' | 'mealType'>>
  ) => {
    const dbUpdates: Record<string, unknown> = {};
    
    if (updates.time !== undefined) dbUpdates.time = updates.time;
    if (updates.location !== undefined) dbUpdates.location = updates.location;
    if (updates.totalPax !== undefined) dbUpdates.total_pax = updates.totalPax;
    if (updates.specialDiets !== undefined) dbUpdates.special_diets = updates.specialDiets;
    if (updates.groups !== undefined) dbUpdates.groups = updates.groups;

    const { error: updateError } = await supabase.from('kitchen_time_slots').update(dbUpdates).eq('id', id);
    if (updateError) throw updateError;
  }, []);

  // Delete a time slot
  const deleteTimeSlot = useCallback(async (id: string) => {
    const { error: deleteError } = await supabase.from('kitchen_time_slots').delete().eq('id', id);
    if (deleteError) throw deleteError;
  }, []);

  // Get a single time slot
  const getTimeSlot = useCallback((id: string): TimeSlot | null => {
    return state.timeSlots[id] || null;
  }, [state.timeSlots]);

  return {
    state,
    isLoading,
    error,
    loadTimeSlots,
    getTimeSlotsForDate,
    getTimeSlotsForMeal,
    addTimeSlot,
    updateTimeSlot,
    deleteTimeSlot,
    getTimeSlot,
  };
};
