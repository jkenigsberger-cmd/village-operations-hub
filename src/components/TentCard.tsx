import React from 'react';
import { Link } from 'react-router-dom';
import { TentSummary, TentGender } from '@/types/village';
import { StatusBadge } from './StatusBadge';
import { cn } from '@/lib/utils';
import { Users, Calendar, Sparkles, Accessibility, Bath } from 'lucide-react';
import { getBookingStatus } from '@/lib/bookingStatusColors';
import { format } from 'date-fns';

interface TentCardProps {
  summary: TentSummary;
  to: string;
  showGrouped?: boolean;
}

// Gender color styles - only apply when tent has an active reservation
const getGenderStyles = (gender?: TentGender, hasReservation?: boolean) => {
  // Only show gender colors if there's an active reservation
  if (!hasReservation) return '';
  
  switch (gender) {
    case 'FEMALE':
      return 'border-l-4 border-l-pink-400 bg-gradient-to-r from-pink-50 to-card';
    case 'MALE':
      return 'border-l-4 border-l-blue-400 bg-gradient-to-r from-blue-50 to-card';
    case 'MIXED':
      return 'border-l-4 border-l-purple-400 bg-gradient-to-r from-purple-50 to-card';
    default:
      return '';
  }
};

// Gender badge - only show when tent has an active reservation
const getGenderBadge = (gender?: TentGender, hasReservation?: boolean) => {
  // Only show gender badge if there's an active reservation
  if (!hasReservation) return null;
  
  switch (gender) {
    case 'FEMALE':
      return { label: '♀️', className: 'bg-pink-100 text-pink-700' };
    case 'MALE':
      return { label: '♂️', className: 'bg-blue-100 text-blue-700' };
    case 'MIXED':
      return { label: '👥', className: 'bg-purple-100 text-purple-700' };
    default:
      return null;
  }
};

export const TentCard: React.FC<TentCardProps> = ({ summary, to, showGrouped }) => {
  const usedBeds = summary.occupiedBeds + summary.reservedBeds;
  const occupancyPercent = summary.totalBeds > 0 
    ? Math.round((usedBeds / summary.totalBeds) * 100) 
    : 0;

  // Determine if tent has an active reservation using hotel-logic date check
  const today = format(new Date(), 'yyyy-MM-dd');
  const hasReservation = !!(
    summary.checkInDate && summary.checkOutDate &&
    getBookingStatus(summary.checkInDate, summary.checkOutDate, today)
  );
  
  const genderBadge = getGenderBadge(summary.gender, hasReservation);

  return (
    <Link 
      to={to}
      className={cn(
        'tile flex flex-col gap-2 md:gap-3 animate-slide-up transition-all min-h-[100px]',
        getGenderStyles(summary.gender, hasReservation),
        summary.isVIP && !hasReservation && 'border-vip/50 bg-gradient-to-br from-card to-vip/10',
        summary.cleaningStatus === 'NEEDS_CLEANING' && 'border-status-dirty'
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <h4 className="text-lg md:text-xl font-bold">{summary.code}</h4>
          {summary.groupName && (
            <p className="text-muted-foreground text-sm md:font-medium mt-0.5 md:mt-1 truncate">
              {summary.groupName}
            </p>
          )}
        </div>
        
        {/* Badges */}
        <div className="flex flex-wrap gap-1 justify-end">
          {genderBadge && (
            <span className={cn(
              'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold',
              genderBadge.className
            )}>
              {genderBadge.label}
            </span>
          )}
          {summary.isVIP && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-vip text-vip-foreground rounded-full text-xs font-semibold">
              <Sparkles className="w-3 h-3" />
            </span>
          )}
          {summary.isAccessible && (
            <span className="inline-flex items-center p-1 bg-primary text-primary-foreground rounded-full">
              <Accessibility className="w-3 h-3" />
            </span>
          )}
          {summary.hasPrivateBathroom && (
            <span className="inline-flex items-center p-1 bg-accent text-accent-foreground rounded-full">
              <Bath className="w-3 h-3" />
            </span>
          )}
        </div>
      </div>

      {/* Occupancy */}
      <div className="flex items-center gap-2 md:gap-3">
        <Users className="w-4 h-4 md:w-5 md:h-5 text-muted-foreground" />
        <div className="flex-1">
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary rounded-full transition-all duration-300"
              style={{ width: `${occupancyPercent}%` }}
            />
          </div>
        </div>
        <span className="font-semibold text-sm md:text-base">
          {usedBeds}/{summary.totalBeds}
        </span>
      </div>

      {/* Status & Dates */}
      <div className="flex flex-wrap items-center gap-2">
        <StatusBadge status={summary.cleaningStatus} size="sm" />
        
        {(summary.checkInDate || summary.checkOutDate) && (
          <span className="flex items-center gap-1 text-sm text-muted-foreground">
            <Calendar className="w-4 h-4" />
            {summary.checkInDate && new Date(summary.checkInDate).toLocaleDateString('he-IL')}
            {summary.checkInDate && summary.checkOutDate && ' - '}
            {summary.checkOutDate && new Date(summary.checkOutDate).toLocaleDateString('he-IL')}
          </span>
        )}
      </div>
    </Link>
  );
};
