// @refresh reset - Force full refresh when this file changes
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { KitchenState, TimeSlot, MealType, SpecialDiets, MealGroup } from '@/types/kitchen';

const generateId = () => Math.random().toString(36).substring(2, 11);

const getDefaultSpecialDiets = (): SpecialDiets => ({
  vegetarian: 0, vegan: 0, glutenFree: 0, lactoseFree: 0, lifeThreatening: 0, mehadrinKosher: 0, eggFree: 0, nutFree: 0, notes: '',
});

/** Backward compat: map legacy keys, default new keys to 0, drop sensitivities */
const migrateSpecialDiets = (raw: any): SpecialDiets => {
  const defaults = getDefaultSpecialDiets();
  if (!raw || typeof raw !== 'object') return defaults;
  return {
    vegetarian: raw.vegetarian || 0,
    vegan: raw.vegan || 0,
    glutenFree: raw.glutenFree || 0,
    lactoseFree: raw.lactoseFree || 0,
    lifeThreatening: raw.lifeThreatening || raw.allergies || 0,
    mehadrinKosher: raw.mehadrinKosher || 0,
    eggFree: raw.eggFree || 0,
    nutFree: raw.nutFree || 0,
    notes: raw.notes || '',
  };
};

export const useSupabaseKitchen = () => {
  const [state, setState] = useState<KitchenState>({ timeSlots: {} });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadTimeSlots = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const { data, error: fetchError } = await supabase.from('kitchen_time_slots').select('*').order('date', { ascending: true });
      if (fetchError) throw fetchError;
      const timeSlots: Record<string, TimeSlot> = {};
      (data || []).forEach(slot => {
        timeSlots[slot.id] = {
          id: slot.id, date: slot.date, mealType: slot.meal_type as MealType, time: slot.time,
          location: slot.location as 'DINING_HALL' | 'OUTSIDE', totalPax: slot.total_pax,
          specialDiets: migrateSpecialDiets(slot.special_diets),
          groups: (slot.groups as unknown as MealGroup[]) || [], updatedAt: slot.updated_at,
        };
      });
      setState({ timeSlots });
      return { timeSlots };
    } catch (err) {
      console.error('Error loading kitchen data from Supabase:', err);
      setError(err instanceof Error ? err.message : 'Failed to load kitchen data');
      return { timeSlots: {} };
    } finally { setIsLoading(false); }
  }, []);

  useEffect(() => { loadTimeSlots(); }, [loadTimeSlots]);

  useEffect(() => {
    const channel = supabase.channel('kitchen-time-slots-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'kitchen_time_slots' }, () => loadTimeSlots())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [loadTimeSlots]);

  const getTimeSlotsForDate = useCallback((date: string): TimeSlot[] => {
    return Object.values(state.timeSlots).filter(slot => slot.date === date).sort((a, b) => a.time.localeCompare(b.time));
  }, [state.timeSlots]);

  const getTimeSlotsForMeal = useCallback((date: string, mealType: MealType): TimeSlot[] => {
    return Object.values(state.timeSlots).filter(slot => slot.date === date && slot.mealType === mealType).sort((a, b) => a.time.localeCompare(b.time));
  }, [state.timeSlots]);

  const addTimeSlot = useCallback(async (
    date: string, mealType: MealType, time: string, location: 'DINING_HALL' | 'OUTSIDE',
    totalPax: number = 0, specialDiets: SpecialDiets = getDefaultSpecialDiets(), groups: MealGroup[] = []
  ): Promise<string> => {
    const id = generateId();
    const { error: insertError } = await supabase.from('kitchen_time_slots').insert({
      id, date, meal_type: mealType, time, location, total_pax: totalPax,
      special_diets: JSON.parse(JSON.stringify(specialDiets)), groups: JSON.parse(JSON.stringify(groups)),
    });
    if (insertError) throw insertError;
    return id;
  }, []);

  const updateTimeSlot = useCallback(async (id: string, updates: Partial<Omit<TimeSlot, 'id' | 'date' | 'mealType'>>) => {
    const dbUpdates: Record<string, unknown> = {};
    if (updates.time !== undefined) dbUpdates.time = updates.time;
    if (updates.location !== undefined) dbUpdates.location = updates.location;
    if (updates.totalPax !== undefined) dbUpdates.total_pax = updates.totalPax;
    if (updates.specialDiets !== undefined) dbUpdates.special_diets = updates.specialDiets;
    if (updates.groups !== undefined) dbUpdates.groups = updates.groups;
    const { error: updateError } = await supabase.from('kitchen_time_slots').update(dbUpdates).eq('id', id);
    if (updateError) throw updateError;
  }, []);

  const deleteTimeSlot = useCallback(async (id: string) => {
    const { error: deleteError } = await supabase.from('kitchen_time_slots').delete().eq('id', id);
    if (deleteError) throw deleteError;
  }, []);

  const getTimeSlot = useCallback((id: string): TimeSlot | null => state.timeSlots[id] || null, [state.timeSlots]);

  return { state, isLoading, error, loadTimeSlots, getTimeSlotsForDate, getTimeSlotsForMeal, addTimeSlot, updateTimeSlot, deleteTimeSlot, getTimeSlot };
};
