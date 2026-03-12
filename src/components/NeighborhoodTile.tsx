import React from 'react';
import { Link } from 'react-router-dom';
import { NeighborhoodSummary } from '@/types/village';
import { cn } from '@/lib/utils';
import { Tent, Users, Calendar, Sparkles } from 'lucide-react';
import { BookingStatus, BOOKING_STATUS_COLORS, type BookingStatusStyle } from '@/lib/bookingStatusColors';
import { Badge } from '@/components/ui/badge';
import { format, parseISO } from 'date-fns';

interface FutureBookingMarker {
  startDate: string;
  endDate: string;
  groupName: string;
}

interface NeighborhoodTileProps {
  summary: NeighborhoodSummary;
  to: string;
  /** Booking status for the selected date */
  bookingStatus?: BookingStatus | null;
  /** Group name if booked */
  bookingGroupName?: string;
  /** Booking date range */
  bookingStartDate?: string;
  bookingEndDate?: string;
  /** Pax info */
  bookingPax?: number;
  bookingBoys?: number;
  bookingGirls?: number;
  /** Future bookings (up to 3 markers) */
  futureBookings?: FutureBookingMarker[];
  /** Show future bookings */
  showFutureBookings?: boolean;
  /** Callback for jumping to a future booking's start date */
  onFutureBookingClick?: (startDate: string) => void;
  /** Whether this tile is dimmed by status filter */
  dimmed?: boolean;
}

export const NeighborhoodTile: React.FC<NeighborhoodTileProps> = ({ 
  summary, 
  to,
  bookingStatus,
  bookingGroupName,
  bookingStartDate,
  bookingEndDate,
  bookingPax,
  bookingBoys,
  bookingGirls,
  futureBookings,
  showFutureBookings = true,
  onFutureBookingClick,
  dimmed = false,
}) => {
  const occupancyPercent = summary.totalBeds > 0 
    ? Math.round((summary.occupiedBeds / summary.totalBeds) * 100) 
    : 0;

  const isVIP = summary.id === 'VIP';
  const statusStyle = bookingStatus ? BOOKING_STATUS_COLORS[bookingStatus] : null;
  const StatusIcon = statusStyle?.icon;

  return (
    <Link 
      to={to}
      className={cn(
        'tile-large flex flex-col gap-3 md:gap-4 animate-slide-up min-h-[120px] md:min-h-[140px] relative overflow-hidden transition-opacity',
        isVIP && 'border-vip/50 bg-gradient-to-br from-card to-vip/10',
        dimmed && 'opacity-50',
      )}
      style={statusStyle ? { borderTopWidth: '4px', borderTopColor: statusStyle.hsl } : undefined}
    >
      {/* Booking status badge */}
      {statusStyle && (
        <div className={cn(
          "absolute top-0 left-0 right-0 flex items-center justify-between px-3 py-1.5 text-sm font-semibold",
          statusStyle.bgLight,
        )}>
          <div className="flex items-center gap-2">
            {StatusIcon && <StatusIcon className={cn("w-4 h-4", statusStyle.text)} />}
            <span className={statusStyle.text}>{statusStyle.label}</span>
            {bookingGroupName && (
              <span className="font-bold text-foreground truncate max-w-[120px]">
                — {bookingGroupName}
              </span>
            )}
          </div>
          {bookingPax != null && bookingPax > 0 && (
            <span className="text-xs text-muted-foreground">
              {bookingPax} איש
              {bookingBoys != null && bookingGirls != null && (
                <> (ג:{bookingBoys} נ:{bookingGirls})</>
              )}
            </span>
          )}
        </div>
      )}

      <div className={cn("flex items-start justify-between", statusStyle && "mt-7")}>
        <div>
          <h3 className={cn(
            "text-xl md:text-2xl font-bold",
            isVIP && "text-accent"
          )}>
            {summary.displayName}
          </h3>
          {isVIP && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-vip text-vip-foreground rounded-full text-xs md:text-sm font-semibold mt-1">
              <Sparkles className="w-3 h-3" />
              VIP
            </span>
          )}
        </div>
        <Tent className="w-6 h-6 md:w-8 md:h-8 text-muted-foreground" />
      </div>

      {/* Date range when booked */}
      {bookingStartDate && bookingEndDate && statusStyle && (
        <div className="text-xs text-muted-foreground -mt-2">
          {bookingStartDate} → {bookingEndDate}
        </div>
      )}

      {/* Occupancy bar */}
      <div className="space-y-1 md:space-y-2">
        <div className="flex justify-between text-sm md:text-lg">
          <span className="flex items-center gap-1 md:gap-2">
            <Users className="w-4 h-4 md:w-5 md:h-5" />
            <span className="font-medium">{summary.occupiedBeds} / {summary.totalBeds}</span>
          </span>
          <span className="font-bold">{occupancyPercent}%</span>
        </div>
        <div className="h-2 md:h-3 bg-muted rounded-full overflow-hidden">
          <div 
            className="h-full bg-primary rounded-full transition-all duration-500"
            style={{ width: `${occupancyPercent}%` }}
          />
        </div>
      </div>

      {/* Stats row */}
      <div className="flex flex-wrap gap-2 md:gap-4 text-xs md:text-base">
        {summary.dirtyTents > 0 && (
          <span className="flex items-center gap-1 px-2 md:px-3 py-0.5 md:py-1 bg-status-dirty rounded-full font-medium">
            🧹 {summary.dirtyTents}
          </span>
        )}
        {summary.checkInsToday > 0 && (
          <span className="flex items-center gap-1 px-2 md:px-3 py-0.5 md:py-1 bg-status-reserved rounded-full font-medium">
            <Calendar className="w-3 h-3 md:w-4 md:h-4" />
            {summary.checkInsToday}
          </span>
        )}
        {summary.checkOutsToday > 0 && (
          <span className="flex items-center gap-1 px-2 md:px-3 py-0.5 md:py-1 bg-muted rounded-full font-medium">
            <Calendar className="w-3 h-3 md:w-4 md:h-4" />
            {summary.checkOutsToday}
          </span>
        )}
        {summary.freeBeds > 0 && (
          <span className="text-muted-foreground text-xs md:text-base">
            {summary.freeBeds} פנוי
          </span>
        )}
      </div>

      {/* Future bookings markers */}
      {showFutureBookings && futureBookings && futureBookings.length > 0 && (
        <div className="flex items-center gap-1.5 pt-1 border-t border-border/50">
          <span className="text-[10px] text-muted-foreground whitespace-nowrap">הבא:</span>
          {futureBookings.map((fb, i) => (
            <button
              key={i}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onFutureBookingClick?.(fb.startDate);
              }}
              className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-muted hover:bg-muted/80 transition-colors"
              title={`${fb.groupName}: ${fb.startDate} → ${fb.endDate}`}
            >
              <div className="w-2 h-2 rounded-full bg-primary/60" />
              <span className="text-[10px] text-muted-foreground truncate max-w-[60px]">
                {fb.startDate.slice(5)}
              </span>
            </button>
          ))}
        </div>
      )}
    </Link>
  );
};
