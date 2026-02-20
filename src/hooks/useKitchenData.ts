// @refresh reset - Force full refresh when this file changes
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { KitchenState, TimeSlot, MealType, SpecialDiets, MealGroup } from '@/types/kitchen';

const getDefaultSpecialDiets = (): SpecialDiets => ({
  vegetarian: 0, vegan: 0, glutenFree: 0, lactoseFree: 0, lifeThreatening: 0, mehadrinKosher: 0, sensitivities: 0, notes: '',
});

/** Backward compat: map legacy 'allergies' key to 'lifeThreatening' */
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
    sensitivities: raw.sensitivities || 0,
    notes: raw.notes || '',
  };
};

const generateId = () => Math.random().toString(36).substring(2, 11);

export const useKitchenData = () => {
  const [state, setState] = useState<KitchenState>({ timeSlots: {} });
  const [isLoading, setIsLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase.from('kitchen_time_slots').select('*');
      if (error) throw error;
      const timeSlots: Record<string, TimeSlot> = {};
      data?.forEach(slot => {
        timeSlots[slot.id] = {
          id: slot.id, date: slot.date, mealType: slot.meal_type as MealType, time: slot.time,
          location: slot.location as 'DINING_HALL' | 'OUTSIDE', totalPax: slot.total_pax,
          specialDiets: migrateSpecialDiets(slot.special_diets),
          groups: (slot.groups as unknown as MealGroup[]) || [], updatedAt: slot.updated_at,
        };
      });
      setState({ timeSlots });
    } catch (error) { console.error('Error loading kitchen data:', error); }
    finally { setIsLoading(false); }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  useEffect(() => {
    const channel = supabase.channel('kitchen-time-slots-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'kitchen_time_slots' }, () => loadData())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [loadData]);

  const getTimeSlotsForDate = useCallback((date: string): TimeSlot[] => {
    return Object.values(state.timeSlots).filter(s => s.date === date).sort((a, b) => a.time.localeCompare(b.time));
  }, [state.timeSlots]);

  const getTimeSlotsForMeal = useCallback((date: string, mealType: MealType): TimeSlot[] => {
    return Object.values(state.timeSlots).filter(s => s.date === date && s.mealType === mealType).sort((a, b) => a.time.localeCompare(b.time));
  }, [state.timeSlots]);

  const addTimeSlot = useCallback(async (
    date: string, mealType: MealType, time: string, location: 'DINING_HALL' | 'OUTSIDE',
    totalPax: number = 0, specialDiets: SpecialDiets = getDefaultSpecialDiets(), groups: MealGroup[] = []
  ): Promise<string> => {
    const id = generateId();
    await supabase.from('kitchen_time_slots').insert({
      id, date, meal_type: mealType, time, location, total_pax: totalPax,
      special_diets: JSON.parse(JSON.stringify(specialDiets)), groups: JSON.parse(JSON.stringify(groups)),
    });
    setState(prev => ({ ...prev, timeSlots: { ...prev.timeSlots, [id]: { id, date, mealType, time, location, totalPax, specialDiets, groups, updatedAt: new Date().toISOString() } } }));
    return id;
  }, []);

  const updateTimeSlot = useCallback(async (id: string, updates: Partial<Omit<TimeSlot, 'id' | 'date' | 'mealType'>>) => {
    const dbUpdates: Record<string, unknown> = {};
    if (updates.time !== undefined) dbUpdates.time = updates.time;
    if (updates.location !== undefined) dbUpdates.location = updates.location;
    if (updates.totalPax !== undefined) dbUpdates.total_pax = updates.totalPax;
    if (updates.specialDiets !== undefined) dbUpdates.special_diets = JSON.parse(JSON.stringify(updates.specialDiets));
    if (updates.groups !== undefined) dbUpdates.groups = JSON.parse(JSON.stringify(updates.groups));
    await supabase.from('kitchen_time_slots').update(dbUpdates).eq('id', id);
    setState(prev => { const slot = prev.timeSlots[id]; if (!slot) return prev; return { ...prev, timeSlots: { ...prev.timeSlots, [id]: { ...slot, ...updates, updatedAt: new Date().toISOString() } } }; });
  }, []);

  const deleteTimeSlot = useCallback(async (id: string) => {
    await supabase.from('kitchen_time_slots').delete().eq('id', id);
    setState(prev => { const { [id]: _, ...rest } = prev.timeSlots; return { ...prev, timeSlots: rest }; });
  }, []);

  const getTimeSlot = useCallback((id: string): TimeSlot | null => state.timeSlots[id] || null, [state.timeSlots]);

  return { state, isLoading, getTimeSlotsForDate, getTimeSlotsForMeal, addTimeSlot, updateTimeSlot, deleteTimeSlot, getTimeSlot };
};
