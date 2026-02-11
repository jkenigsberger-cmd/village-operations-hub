import { useMemo } from 'react';
import { useVillage } from '@/context/VillageContext';
import { useAdminGroups } from '@/hooks/useAdminGroups';
import { useSupabaseAllocations } from '@/hooks/useSupabaseAllocations';
import { NeighborhoodId, NeighborhoodReservation } from '@/types/village';
import { BookingStatus, getBookingStatus } from '@/lib/bookingStatusColors';
import { format, addDays } from 'date-fns';

export interface NeighborhoodBookingInfo {
  neighborhoodId: string;
  status: BookingStatus | null;
  groupName: string;
  startDate: string;
  endDate: string;
  totalPax: number;
  boysCount?: number;
  girlsCount?: number;
  reservationId: string;
}

export interface VIPBookingInfo {
  status: BookingStatus | null;
  groupName: string;
  startDate: string;
  endDate: string;
  totalPax: number;
}

export interface FutureBooking {
  startDate: string;
  endDate: string;
  groupName: string;
}

/**
 * Provides booking data for all neighborhoods + VIP on a given date.
 */
export const useNeighborhoodBookings = (selectedDate: Date) => {
  const { state } = useVillage();
  const { groups } = useAdminGroups();
  const { allocations } = useSupabaseAllocations();

  const dayStr = format(selectedDate, 'yyyy-MM-dd');

  // Map group names -> group records for enrichment
  const groupsByName = useMemo(() => {
    const map = new Map<string, (typeof groups)[0]>();
    groups.forEach(g => map.set(g.groupName, g));
    return map;
  }, [groups]);

  const groupsById = useMemo(() => {
    const map = new Map<string, (typeof groups)[0]>();
    groups.forEach(g => map.set(g.id, g));
    return map;
  }, [groups]);

  // Neighborhood bookings for selected day
  const neighborhoodBookings = useMemo<Record<string, NeighborhoodBookingInfo>>(() => {
    if (!state) return {};
    const result: Record<string, NeighborhoodBookingInfo> = {};

    Object.values(state.neighborhoodReservations).forEach((nr: NeighborhoodReservation) => {
      const status = getBookingStatus(nr.checkInDate, nr.checkOutDate, dayStr);
      if (!status) return;

      const group = groupsByName.get(nr.groupName);
      // Only keep the first match per neighborhood (simplification)
      if (!result[nr.neighborhoodId]) {
        result[nr.neighborhoodId] = {
          neighborhoodId: nr.neighborhoodId,
          status,
          groupName: nr.groupName,
          startDate: nr.checkInDate,
          endDate: nr.checkOutDate,
          totalPax: nr.totalPeople || group?.participantCount || group?.pax || 0,
          boysCount: group?.boysCount,
          girlsCount: group?.girlsCount,
          reservationId: nr.id,
        };
      }
    });
    return result;
  }, [state, dayStr, groupsByName]);

  // VIP bookings for selected day (aggregated from VIP_TENT allocations)
  const vipBooking = useMemo<VIPBookingInfo | null>(() => {
    const vipAllocations = allocations.filter(a => a.allocationType === 'VIP_TENT');
    
    // Group by groupId + dateRange
    const byGroup = new Map<string, { beds: number; start: string; end: string; groupId: string }>();
    vipAllocations.forEach(a => {
      const key = `${a.groupId}-${a.dateRangeStart}-${a.dateRangeEnd}`;
      const existing = byGroup.get(key);
      if (existing) {
        existing.beds += a.bedsAssigned;
      } else {
        byGroup.set(key, { beds: a.bedsAssigned, start: a.dateRangeStart, end: a.dateRangeEnd, groupId: a.groupId });
      }
    });

    for (const val of byGroup.values()) {
      const status = getBookingStatus(val.start, val.end, dayStr);
      if (status) {
        const group = groupsById.get(val.groupId);
        return {
          status,
          groupName: group?.groupName || 'VIP',
          startDate: val.start,
          endDate: val.end,
          totalPax: val.beds,
        };
      }
    }
    return null;
  }, [allocations, dayStr, groupsById]);

  // Future bookings (next 30 days) per neighborhood
  const futureBookings = useMemo<Record<string, FutureBooking[]>>(() => {
    if (!state) return {};
    const result: Record<string, FutureBooking[]> = {};
    const futureStart = format(addDays(selectedDate, 1), 'yyyy-MM-dd');
    const futureEnd = format(addDays(selectedDate, 30), 'yyyy-MM-dd');

    Object.values(state.neighborhoodReservations).forEach((nr: NeighborhoodReservation) => {
      // Include if booking overlaps with futureStart..futureEnd
      if (nr.checkOutDate > futureStart && nr.checkInDate <= futureEnd) {
        if (!result[nr.neighborhoodId]) result[nr.neighborhoodId] = [];
        // Limit to 3 future bookings per neighborhood
        if (result[nr.neighborhoodId].length < 3) {
          result[nr.neighborhoodId].push({
            startDate: nr.checkInDate,
            endDate: nr.checkOutDate,
            groupName: nr.groupName,
          });
        }
      }
    });

    // VIP future bookings
    const vipAllocations = allocations.filter(a => a.allocationType === 'VIP_TENT');
    const vipSeen = new Set<string>();
    vipAllocations.forEach(a => {
      const key = `${a.groupId}-${a.dateRangeStart}-${a.dateRangeEnd}`;
      if (vipSeen.has(key)) return;
      vipSeen.add(key);
      if (a.dateRangeEnd > futureStart && a.dateRangeStart <= futureEnd) {
        if (!result['VIP']) result['VIP'] = [];
        if (result['VIP'].length < 3) {
          const group = groupsById.get(a.groupId);
          result['VIP'].push({
            startDate: a.dateRangeStart,
            endDate: a.dateRangeEnd,
            groupName: group?.groupName || 'VIP',
          });
        }
      }
    });

    return result;
  }, [state, allocations, selectedDate, groupsById]);

  return {
    neighborhoodBookings,
    vipBooking,
    futureBookings,
  };
};

