/**
 * Shared booking status colors — consistent with MasterCalendar & SleepingDashboard.
 *
 * Colors sourced from:
 *   MasterCalendar EVENT_COLORS:
 *     TENT_CHECKIN  → hsl(142, 70%, 45%)  (green)
 *     TENT_CHECKOUT → hsl(210, 80%, 50%)  (blue)  — note: "sleeping" in SleepingDashboard also uses blue
 *   SleepingDashboard statusConfig:
 *     sleeping   → bg-blue-500  / text-blue-700  / bg-blue-50
 *     check-in   → bg-green-500 / text-green-700 / bg-green-50
 *     check-out  → bg-orange-500/ text-orange-700/ bg-orange-50
 *
 * We unify as follows (matching SleepingDashboard exactly for UI consistency):
 */

import { LogIn, LogOut, Moon, type LucideIcon } from 'lucide-react';

export type BookingStatus = 'CHECKIN' | 'SLEEPING' | 'CHECKOUT';

export interface BookingStatusStyle {
  label: string;
  icon: LucideIcon;
  /** Tailwind bg class for solid badges */
  bg: string;
  /** Tailwind text class */
  text: string;
  /** Lighter bg for subtle badges */
  bgLight: string;
  /** HSL string for borders / markers */
  hsl: string;
  /** Tailwind border class */
  border: string;
}

export const BOOKING_STATUS_COLORS: Record<BookingStatus, BookingStatusStyle> = {
  CHECKIN: {
    label: "צ'ק-אין",
    icon: LogIn,
    bg: 'bg-green-500',
    text: 'text-green-700',
    bgLight: 'bg-green-50 dark:bg-green-950/30',
    hsl: 'hsl(142, 70%, 45%)',
    border: 'border-green-400',
  },
  SLEEPING: {
    label: 'ישן',
    icon: Moon,
    bg: 'bg-blue-500',
    text: 'text-blue-700',
    bgLight: 'bg-blue-50 dark:bg-blue-950/30',
    hsl: 'hsl(210, 80%, 50%)',
    border: 'border-blue-400',
  },
  CHECKOUT: {
    label: "צ'ק-אאוט",
    icon: LogOut,
    bg: 'bg-orange-500',
    text: 'text-orange-700',
    bgLight: 'bg-orange-50 dark:bg-orange-950/30',
    hsl: 'hsl(30, 90%, 50%)',
    border: 'border-orange-400',
  },
};

/**
 * Hotel logic:
 *   sleeping:  startDate <= D < endDate  (check-in day is a subset of sleeping)
 *   check-in:  startDate === D
 *   check-out: endDate === D (NOT sleeping)
 */
export function getBookingStatus(
  startDate: string,
  endDate: string,
  day: string
): BookingStatus | null {
  if (endDate === day) return 'CHECKOUT';
  if (startDate <= day && day < endDate) {
    return startDate === day ? 'CHECKIN' : 'SLEEPING';
  }
  return null;
}

export function getBookingStatusStyle(status: BookingStatus): BookingStatusStyle {
  return BOOKING_STATUS_COLORS[status];
}
