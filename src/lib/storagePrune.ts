import { VillageState } from '@/types/village';

export type StoragePruneStrategy = 'completedTaskImages' | 'allImages' | 'aggressive';

export function isQuotaExceededError(error: unknown): boolean {
  if (!error) return false;

  const anyErr = error as { name?: string; message?: string; code?: number };

  // Standard name in most browsers
  if (anyErr.name === 'QuotaExceededError') return true;

  // Some browsers throw DOMException with this name
  if (typeof DOMException !== 'undefined' && error instanceof DOMException) {
    return error.name === 'QuotaExceededError';
  }

  // Fallback message sniff
  const msg = String(anyErr.message ?? '');
  return msg.toLowerCase().includes('quota') || msg.toLowerCase().includes('exceeded the quota');
}

function daysSince(iso: string | undefined): number {
  if (!iso) return Number.POSITIVE_INFINITY;
  const ms = Date.now() - new Date(iso).getTime();
  return ms / (1000 * 60 * 60 * 24);
}

export function pruneVillageStateForLocalStorage(
  state: VillageState,
  strategy: StoragePruneStrategy
): VillageState {
  // Start with a shallow clone
  let next: VillageState = {
    ...state,
    facilities: { ...state.facilities },
    tents: { ...state.tents },
    dailyTasks: { ...(state.dailyTasks || {}) },
  };

  // 1) Daily tasks: images are the biggest culprit.
  for (const [taskId, task] of Object.entries(next.dailyTasks || {})) {
    if (!task) continue;

    const isCompleted = task.status === 'COMPLETED';
    const hasImage = !!task.maintenanceImage;

    if (strategy === 'completedTaskImages') {
      if (isCompleted && hasImage) {
        next.dailyTasks[taskId] = { ...task, maintenanceImage: undefined };
      }
      continue;
    }

    if (strategy === 'allImages') {
      if (hasImage) {
        next.dailyTasks[taskId] = { ...task, maintenanceImage: undefined };
      }
      continue;
    }

    // aggressive
    if (hasImage) {
      next.dailyTasks[taskId] = { ...task, maintenanceImage: undefined };
    }

    const ageDays = Math.min(daysSince(task.completedAt), daysSince(task.createdAt));
    if (isCompleted && ageDays > 30) {
      delete next.dailyTasks[taskId];
    }
  }

  // 2) Facilities: remove stale images on WORKING, and optionally all images.
  for (const [facilityId, facility] of Object.entries(next.facilities || {})) {
    if (!facility) continue;

    const shouldClear =
      strategy !== 'completedTaskImages'
        ? true // allImages/aggressive
        : facility.workingStatus === 'WORKING';

    if (shouldClear && facility.maintenanceImage) {
      next.facilities[facilityId] = { ...facility, maintenanceImage: undefined };
    }
  }

  // 3) VIP tents private facilities images
  for (const [tentId, tent] of Object.entries(next.tents || {})) {
    if (!tent) continue;

    const clearBathroom =
      strategy !== 'completedTaskImages'
        ? true
        : (tent.bathroomWorkingStatus ?? 'WORKING') === 'WORKING';

    const clearShower =
      strategy !== 'completedTaskImages'
        ? true
        : (tent.showerWorkingStatus ?? 'WORKING') === 'WORKING';

    if (clearBathroom && tent.bathroomMaintenanceImage) {
      next.tents[tentId] = { ...next.tents[tentId], bathroomMaintenanceImage: undefined };
    }
    if (clearShower && tent.showerMaintenanceImage) {
      next.tents[tentId] = { ...next.tents[tentId], showerMaintenanceImage: undefined };
    }
  }

  // 4) Aggressive: shrink activity log as a last resort
  if (strategy === 'aggressive' && Array.isArray(next.activityLog)) {
    next = { ...next, activityLog: next.activityLog.slice(0, 50) };
  }

  return next;
}
