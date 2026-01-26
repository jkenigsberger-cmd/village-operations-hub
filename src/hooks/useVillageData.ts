import { useState, useEffect, useCallback } from 'react';
import { VillageState, ActivityLogEntry } from '@/types/village';
import { generateInitialVillageState } from '@/data/initialData';
import { isQuotaExceededError, pruneVillageStateForLocalStorage } from '@/lib/storagePrune';

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
        const initial = generateInitialVillageState();
        let needsMigration = false;
        
        // Ensure all required fields exist (for backwards compatibility / migration)
        if (!parsed.facilityReservations) {
          parsed.facilityReservations = {};
          needsMigration = true;
        }
        if (!parsed.neighborhoodReservations) {
          parsed.neighborhoodReservations = {};
          needsMigration = true;
        }
        if (!parsed.dailyTasks) {
          parsed.dailyTasks = {};
          needsMigration = true;
        }
        // Migrate tent codes from Alef/Bet to א/ב
        Object.values(parsed.tents).forEach(tent => {
          if (tent.code.includes(' Alef')) {
            tent.code = tent.code.replace(' Alef', ' א');
            needsMigration = true;
          } else if (tent.code.includes(' Bet')) {
            tent.code = tent.code.replace(' Bet', ' ב');
            needsMigration = true;
          }
        });
        
        // Migrate missing facility and activity data from initial state
        if (!parsed.facilityAreas || Object.keys(parsed.facilityAreas).length === 0) {
          parsed.facilityAreas = initial.facilityAreas;
          needsMigration = true;
        }
        if (!parsed.facilities || Object.keys(parsed.facilities).length === 0) {
          parsed.facilities = initial.facilities;
          needsMigration = true;
        }
        if (!parsed.activitySpaces || Object.keys(parsed.activitySpaces).length === 0) {
          parsed.activitySpaces = initial.activitySpaces;
          needsMigration = true;
        }
        if (!parsed.activityReservations) {
          parsed.activityReservations = {};
          needsMigration = true;
        }
        
        // Check if facilities need Hebrew label migration (old English labels like "TOILET-1", "SHOWER-1")
        const needsFacilityLabelMigration = parsed.facilities && 
          Object.values(parsed.facilities).some(
            (f) => f.label.startsWith('TOILET-') || f.label.startsWith('SHOWER-')
          );
        
        if (needsFacilityLabelMigration) {
          // Replace all facility data with fresh Hebrew-labeled data
          parsed.facilityAreas = initial.facilityAreas;
          parsed.facilities = initial.facilities;
          needsMigration = true;
          console.log('[migration] Migrated facility labels to Hebrew');
        }
        
        // Persist migrated state
        if (needsMigration) {
          try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
            console.log('[migration] Updated localStorage with missing data');
          } catch (error) {
            console.warn('Unable to persist migrated state:', error);
          }
        }
        
        setState(parsed);
      } else {
        // Generate initial state on first load
        const initial = generateInitialVillageState();
        setState(initial);
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
        } catch (error) {
          console.warn('Unable to persist initial village state:', error);
        }
      }
    } catch (error) {
      console.error('Error loading village state:', error);
      // Reset to initial state on error
      const initial = generateInitialVillageState();
      setState(initial);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
      } catch (error2) {
        console.warn('Unable to persist reset village state:', error2);
      }
    }
    setIsLoading(false);
  }, []);

  // Save state to localStorage whenever it changes
  const saveState = useCallback((next: VillageState | ((prev: VillageState) => VillageState)) => {
    setState((prev) => {
      const base = prev ?? (typeof next === 'function' ? generateInitialVillageState() : next);
      const computed = typeof next === 'function' ? next(base) : next;

      const updated: VillageState = {
        ...computed,
        lastModified: new Date().toISOString(),
      };

      const persist = (candidate: VillageState): VillageState => {
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(candidate));
          return candidate;
        } catch (error) {
          if (!isQuotaExceededError(error)) {
            console.error('Error saving village state:', error);
            return candidate;
          }

          const strategies: Array<Parameters<typeof pruneVillageStateForLocalStorage>[1]> = [
            'completedTaskImages',
            'allImages',
            'aggressive',
          ];

          for (const strategy of strategies) {
            try {
              const pruned = pruneVillageStateForLocalStorage(candidate, strategy);
              localStorage.setItem(STORAGE_KEY, JSON.stringify(pruned));
              console.warn(`[storage] Quota exceeded; saved with strategy=${strategy}`);
              return pruned;
            } catch (error2) {
              if (!isQuotaExceededError(error2)) {
                console.error('Error saving pruned village state:', error2);
                return candidate;
              }
            }
          }

          console.error('[storage] Quota exceeded; unable to persist state (continuing in-memory).');
          return candidate;
        }
      };

      return persist(updated);
    });
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
