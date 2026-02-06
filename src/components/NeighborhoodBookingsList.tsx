import React, { useMemo } from 'react';
import { format } from 'date-fns';
import { useVillage } from '@/context/VillageContext';
import { NeighborhoodId, Tent, TentGender } from '@/types/village';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, Tent as TentIcon, CalendarDays } from 'lucide-react';
import { genderColor } from '@/lib/tentColors';
import { HE } from '@/lib/translations';

interface NeighborhoodBookingsListProps {
  neighborhoodId: NeighborhoodId;
  date: Date;
}

interface BookingInfo {
  id: string;
  type: 'neighborhood' | 'tent';
  groupName: string;
  gender?: TentGender;
  checkIn: string;
  checkOut: string;
  tentCount?: number;
  bedCount?: number;
}

export const NeighborhoodBookingsList: React.FC<NeighborhoodBookingsListProps> = ({
  neighborhoodId,
  date,
}) => {
  const { state, getTentSummary } = useVillage();
  
  const bookings = useMemo(() => {
    if (!state) return [];
    
    const dateStr = format(date, 'yyyy-MM-dd');
    const results: BookingInfo[] = [];
    const seenGroups = new Set<string>();
    
    // 1. Get neighborhood-level reservations
    const nReservations = Object.values(state.neighborhoodReservations || {})
      .filter(r => 
        r.neighborhoodId === neighborhoodId &&
        r.checkInDate <= dateStr && 
        r.checkOutDate >= dateStr
      );
    
    nReservations.forEach(r => {
      if (!seenGroups.has(r.groupName)) {
        seenGroups.add(r.groupName);
        // Determine gender from genderDistribution if available
        let gender: TentGender | undefined;
        if (r.genderDistribution) {
          if (r.genderDistribution.female > 0 && r.genderDistribution.male === 0) {
            gender = 'FEMALE';
          } else if (r.genderDistribution.male > 0 && r.genderDistribution.female === 0) {
            gender = 'MALE';
          } else if (r.genderDistribution.female > 0 || r.genderDistribution.male > 0) {
            gender = 'MIXED';
          }
        }
        results.push({
          id: r.id,
          type: 'neighborhood',
          groupName: r.groupName,
          gender,
          checkIn: r.checkInDate,
          checkOut: r.checkOutDate,
          tentCount: r.tentCount,
          bedCount: r.totalBeds,
        });
      }
    });
    
    // 2. Get tent-level bookings for this neighborhood
    const neighborhood = state.neighborhoods[neighborhoodId];
    if (neighborhood) {
      const tentBookings = neighborhood.tentIds
        .map(id => state.tents[id])
        .filter((t): t is Tent => 
          !!t && 
          !!t.checkInDate && 
          !!t.checkOutDate &&
          t.checkInDate <= dateStr && 
          t.checkOutDate >= dateStr
        );
      
      // Group tents by groupName
      const tentsByGroup: Record<string, Tent[]> = {};
      tentBookings.forEach(t => {
        const name = t.groupName || 'ללא קבוצה';
        if (!tentsByGroup[name]) tentsByGroup[name] = [];
        tentsByGroup[name].push(t);
      });
      
      Object.entries(tentsByGroup).forEach(([groupName, tents]) => {
        if (!seenGroups.has(groupName)) {
          seenGroups.add(groupName);
          const firstTent = tents[0];
          // Calculate total reserved beds from tent summaries
          const totalBeds = tents.reduce((acc, t) => {
            const summary = getTentSummary(t.id);
            return acc + (summary?.reservedBeds || 0) + (summary?.occupiedBeds || 0);
          }, 0);
          
          results.push({
            id: `tent-group-${groupName}`,
            type: 'tent',
            groupName,
            gender: firstTent.gender,
            checkIn: firstTent.checkInDate!,
            checkOut: firstTent.checkOutDate!,
            tentCount: tents.length,
            bedCount: totalBeds,
          });
        }
      });
    }
    
    // Sort by check-in date
    return results.sort((a, b) => a.checkIn.localeCompare(b.checkIn));
  }, [state, neighborhoodId, date, getTentSummary]);
  
  if (bookings.length === 0) {
    return (
      <div className="p-6 text-center bg-muted/30 rounded-xl border border-dashed">
        <CalendarDays className="w-12 h-12 mx-auto mb-3 text-muted-foreground/50" />
        <p className="text-muted-foreground">{HE.neighborhood?.noBookingsForDate || 'אין הזמנות לתאריך זה'}</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold flex items-center gap-2">
        <CalendarDays className="w-5 h-5" />
        {HE.neighborhood?.bookingsForDate || 'הזמנות לתאריך'}
        <Badge variant="secondary">{bookings.length}</Badge>
      </h3>
      
      <div className="grid gap-3">
        {bookings.map((booking) => (
          <Card 
            key={booking.id}
            className="overflow-hidden"
            style={{
              borderRightWidth: '4px',
              borderRightColor: genderColor(booking.gender, true),
            }}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-10 h-10 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: genderColor(booking.gender, true) + '33' }}
                  >
                    <Users className="w-5 h-5" style={{ color: genderColor(booking.gender, true) }} />
                  </div>
                  <div>
                    <h4 className="font-bold">{booking.groupName}</h4>
                    <p className="text-sm text-muted-foreground">
                      {booking.checkIn} → {booking.checkOut}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 text-sm">
                  {booking.tentCount && (
                    <Badge variant="outline" className="gap-1">
                      <TentIcon className="w-3 h-3" />
                      {booking.tentCount}
                    </Badge>
                  )}
                  {booking.gender && (
                    <Badge 
                      variant="secondary"
                      style={{ 
                        backgroundColor: genderColor(booking.gender, true) + '22',
                        color: genderColor(booking.gender, true),
                      }}
                    >
                      {booking.gender === 'FEMALE' ? '♀ נשים' : 
                       booking.gender === 'MALE' ? '♂ גברים' : '👥 מעורב'}
                    </Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
