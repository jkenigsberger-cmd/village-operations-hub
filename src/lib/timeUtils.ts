// ============================================================
// TIME UTILITIES - Shared time calculation and validation
// ============================================================

/**
 * Convert time string "HH:mm" to total minutes from midnight
 */
export const timeToMinutes = (time: string): number => {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
};

/**
 * Check if two time ranges overlap with a required gap between them
 * @param start1 - Start time of first range (HH:mm)
 * @param end1 - End time of first range (HH:mm)
 * @param start2 - Start time of second range (HH:mm)
 * @param end2 - End time of second range (HH:mm)
 * @param gapMinutes - Required gap between reservations (default 15 minutes)
 * @returns true if the ranges overlap (considering the gap), false otherwise
 */
export const timeRangesOverlapWithGap = (
  start1: string,
  end1: string,
  start2: string,
  end2: string,
  gapMinutes: number = 15
): boolean => {
  const s1 = timeToMinutes(start1);
  const e1 = timeToMinutes(end1);
  const s2 = timeToMinutes(start2);
  const e2 = timeToMinutes(end2);

  // Overlap exists if there's no gapMinutes separation between the ranges
  // Range 1 ends before Range 2 starts (with gap): e1 + gap <= s2
  // Range 2 ends before Range 1 starts (with gap): e2 + gap <= s1
  // If neither condition is true, they overlap
  return !((e1 + gapMinutes) <= s2 || (e2 + gapMinutes) <= s1);
};

/**
 * Calculate how many hour rows a reservation should span in an hourly grid
 * Properly handles reservations with minutes (e.g., 09:30-10:30)
 */
export const getReservationSpan = (startTime: string, endTime: string): number => {
  const startMinutes = timeToMinutes(startTime);
  const endMinutes = timeToMinutes(endTime);
  // Calculate duration and round up to full hours
  return Math.max(1, Math.ceil((endMinutes - startMinutes) / 60));
};

/**
 * Check if a given hour falls within a reservation's time range
 * @param hour - Hour to check (HH:00 format)
 * @param startTime - Reservation start time
 * @param endTime - Reservation end time
 */
export const isHourInReservation = (hour: string, startTime: string, endTime: string): boolean => {
  const hourMinutes = timeToMinutes(hour);
  const startMinutes = timeToMinutes(startTime);
  const endMinutes = timeToMinutes(endTime);
  return hourMinutes >= startMinutes && hourMinutes < endMinutes;
};

/**
 * Check if a given hour is the start hour of a reservation
 * (the hour row where the block should begin rendering)
 */
export const isReservationStartHour = (hour: string, startTime: string): boolean => {
  const hourValue = parseInt(hour.split(':')[0]);
  const startHour = parseInt(startTime.split(':')[0]);
  return hourValue === startHour;
};
