// ============================================================
// RESERVATION CONFLICT UTILITIES
// Shared conflict detection for activity_reservations (and future facility_reservations)
// ============================================================

import { supabase } from '@/integrations/supabase/client';
import { timeToMinutes } from '@/lib/timeUtils';

const BUFFER_MINUTES = 15;

export interface ConflictCheckResult {
  conflict: boolean;
  message: string;
  conflictingGroup?: string;
}

/**
 * Client-side conflict check for a single reservation against existing ones.
 * Use for UX feedback before calling server-side RPC.
 */
export const checkActivityReservationConflict = (
  spaceId: string,
  date: string,
  startTime: string,
  endTime: string,
  existingReservations: Array<{
    space_id: string;
    date: string;
    start_time: string;
    end_time: string;
    group_name: string;
    id?: string;
    source?: string;
    group_id?: string;
  }>,
  excludeReservationId?: string,
  excludeGroupId?: string,
): ConflictCheckResult => {
  const newStart = timeToMinutes(startTime);
  const newEnd = timeToMinutes(endTime);

  if (newEnd <= newStart) {
    return { conflict: true, message: 'שעת סיום חייבת להיות אחרי שעת התחלה' };
  }

  for (const res of existingReservations) {
    if (res.space_id !== spaceId || res.date !== date) continue;
    if (excludeReservationId && res.id === excludeReservationId) continue;
    if (excludeGroupId && res.source === 'groupSync' && res.group_id === excludeGroupId) continue;

    const exStart = timeToMinutes(res.start_time);
    const exEnd = timeToMinutes(res.end_time);

    // Overlap with buffer: (ex_start - 15) < new_end AND (ex_end + 15) > new_start
    if ((exStart - BUFFER_MINUTES) < newEnd && (exEnd + BUFFER_MINUTES) > newStart) {
      return {
        conflict: true,
        message: `תפוס בזמן הזה (כולל 15 דק׳ ניקיון). בחרו שעה אחרת.`,
        conflictingGroup: res.group_name,
      };
    }
  }

  return { conflict: false, message: '' };
};

/**
 * Server-side safe reservation creation via RPC.
 * Uses advisory locks to prevent race conditions.
 */
export const createActivityReservationSafe = async (params: {
  spaceId: string;
  date: string;
  startTime: string;
  endTime: string;
  groupName: string;
  groupId?: string;
  notes?: string;
  source?: string;
  status?: string;
  reservationId?: string;
}): Promise<{ success: boolean; error?: string; data?: any }> => {
  const { data, error } = await supabase.rpc('create_activity_reservation_safe', {
    p_space_id: params.spaceId,
    p_date: params.date,
    p_start_time: params.startTime,
    p_end_time: params.endTime,
    p_group_name: params.groupName,
    p_group_id: params.groupId || null,
    p_notes: params.notes || null,
    p_source: params.source || 'manual',
    p_status: params.status || 'confirmed',
    p_reservation_id: params.reservationId || null,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, data };
};
