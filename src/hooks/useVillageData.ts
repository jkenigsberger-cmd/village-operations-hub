import { useState, useEffect, useCallback } from 'react';
import { VillageState, ActivityLogEntry } from '@/types/village';
import { generateInitialVillageState } from '@/data/initialData';

const STORAGE_KEY = 'aharonson_farm_village_state';
const MAX_LOG_ENTRIES = 200;

export const useVillageData = () => {
  const [state, setState] = useState<VillageState | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load state from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as VillageState;
        // Ensure facilityReservations exists (for backwards compatibility)
        if (!parsed.facilityReservations) {
          parsed.facilityReservations = {};
        }
        if (!parsed.neighborhoodReservations) {
          parsed.neighborhoodReservations = {};
        }
        if (!parsed.dailyTasks) {
          parsed.dailyTasks = {};
        }
        setState(parsed);
      } else {
        // Generate initial state on first load
        const initial = generateInitialVillageState();
        setState(initial);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
      }
    } catch (error) {
      console.error('Error loading village state:', error);
      // Reset to initial state on error
      const initial = generateInitialVillageState();
      setState(initial);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
    }
    setIsLoading(false);
  }, []);

  // Save state to localStorage whenever it changes
  const saveState = useCallback((newState: VillageState) => {
    const updated = {
      ...newState,
      lastModified: new Date().toISOString(),
    };
    setState(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  }, []);

  // Add entry to activity log
  const addLogEntry = useCallback((
    action: string,
    entityType: ActivityLogEntry['entityType'],
    entityId: string,
    details: string
  ) => {
    if (!state) return;

    const entry: ActivityLogEntry = {
      id: Math.random().toString(36).substring(2, 11),
      timestamp: new Date().toISOString(),
      action,
      entityType,
      entityId,
      details,
    };

    const newLog = [entry, ...state.activityLog].slice(0, MAX_LOG_ENTRIES);
    
    saveState({
      ...state,
      activityLog: newLog,
    });
  }, [state, saveState]);

  // Update a specific part of the state
  const updateState = useCallback(<K extends keyof VillageState>(
    key: K,
    value: VillageState[K]
  ) => {
    if (!state) return;
    saveState({
      ...state,
      [key]: value,
    });
  }, [state, saveState]);

  // Export state as JSON
  const exportState = useCallback(() => {
    if (!state) return '';
    return JSON.stringify(state, null, 2);
  }, [state]);

  // Import state from JSON
  const importState = useCallback((jsonString: string): boolean => {
    try {
      const parsed = JSON.parse(jsonString) as VillageState;
      // Basic validation
      if (!parsed.version || !parsed.neighborhoods || !parsed.tents) {
        throw new Error('Invalid state structure');
      }
      saveState(parsed);
      return true;
    } catch (error) {
      console.error('Error importing state:', error);
      return false;
    }
  }, [saveState]);

  // Reset to initial state
  const resetToDefault = useCallback(() => {
    const initial = generateInitialVillageState();
    saveState(initial);
  }, [saveState]);

  return {
    state,
    isLoading,
    saveState,
    updateState,
    addLogEntry,
    exportState,
    importState,
    resetToDefault,
  };
};
