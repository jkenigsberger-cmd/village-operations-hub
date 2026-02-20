// @ts-nocheck
import { describe, it, expect } from 'vitest';

/**
 * Regression test: Departed groups must NEVER appear in VIP bookings.
 *
 * The date-guard filter in NeighborhoodBookingsList ensures that
 * even if upstream data contains stale entries, items where
 * selectedDate >= endDate are excluded.
 *
 * This test validates the guard logic directly.
 */

interface BookingInfo {
  id: string;
  groupName: string;
  checkIn: string;
  checkOut: string;
}

/** Replicates the date-guard filter from NeighborhoodBookingsList */
function applyDateGuard(bookings: BookingInfo[], selectedDate: string): BookingInfo[] {
  return bookings.filter(b => selectedDate >= b.checkIn && selectedDate < b.checkOut);
}

describe('VIP Bookings Date Guard', () => {
  const bookings: BookingInfo[] = [
    { id: '1', groupName: 'Active Group', checkIn: '2026-02-18', checkOut: '2026-02-22' },
    { id: '2', groupName: 'Departed Group', checkIn: '2026-02-10', checkOut: '2026-02-15' },
    { id: '3', groupName: 'Future Group', checkIn: '2026-02-25', checkOut: '2026-02-28' },
    { id: '4', groupName: 'Checkout Today', checkIn: '2026-02-15', checkOut: '2026-02-20' },
  ];

  it('shows only the active group for Feb 20', () => {
    const result = applyDateGuard(bookings, '2026-02-20');
    expect(result).toHaveLength(1);
    expect(result[0].groupName).toBe('Active Group');
  });

  it('never shows departed groups', () => {
    const result = applyDateGuard(bookings, '2026-02-20');
    expect(result.find(b => b.groupName === 'Departed Group')).toBeUndefined();
  });

  it('excludes groups on their checkout day (hotel rule: checkOut day is NOT a sleeping night)', () => {
    const result = applyDateGuard(bookings, '2026-02-20');
    expect(result.find(b => b.groupName === 'Checkout Today')).toBeUndefined();
  });

  it('shows future groups only on their active dates', () => {
    const resultBefore = applyDateGuard(bookings, '2026-02-24');
    expect(resultBefore.find(b => b.groupName === 'Future Group')).toBeUndefined();

    const resultDuring = applyDateGuard(bookings, '2026-02-25');
    expect(resultDuring.find(b => b.groupName === 'Future Group')).toBeDefined();
  });

  it('returns empty for a date with no active bookings', () => {
    const result = applyDateGuard(bookings, '2026-03-01');
    expect(result).toHaveLength(0);
  });
});
