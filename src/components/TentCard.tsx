import React from 'react';
import { Link } from 'react-router-dom';
import { TentSummary, TentGender } from '@/types/village';
import { StatusBadge } from './StatusBadge';
import { cn } from '@/lib/utils';
import { Users, Calendar, Sparkles, Accessibility, Bath } from 'lucide-react';

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
  const occupancyPercent = summary.totalBeds > 0 
    ? Math.round((summary.occupiedBeds / summary.totalBeds) * 100) 
    : 0;

  // Determine if tent has an active reservation (groupName or dates set)
  const hasReservation = !!(summary.groupName || summary.checkInDate || summary.checkOutDate);
  
  const genderBadge = getGenderBadge(summary.gender, hasReservation);

  return (
    <Link 
      to={to}
      className={cn(
        'tile flex flex-col gap-3 animate-slide-up transition-all',
        getGenderStyles(summary.gender, hasReservation),
        summary.isVIP && !hasReservation && 'border-vip/50 bg-gradient-to-br from-card to-vip/10',
        summary.cleaningStatus === 'NEEDS_CLEANING' && 'border-status-dirty'
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1">
          <h4 className="text-xl font-bold">{summary.code}</h4>
          {summary.groupName && (
            <p className="text-muted-foreground font-medium mt-1 truncate">
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
      <div className="flex items-center gap-3">
        <Users className="w-5 h-5 text-muted-foreground" />
        <div className="flex-1">
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary rounded-full transition-all duration-300"
              style={{ width: `${occupancyPercent}%` }}
            />
          </div>
        </div>
        <span className="font-semibold text-base">
          {summary.occupiedBeds}/{summary.totalBeds}
        </span>
      </div>

      {/* Status & Dates */}
      <div className="flex flex-wrap items-center gap-2">
        <StatusBadge status={summary.cleaningStatus} size="sm" />
        
        {summary.checkInDate && (
          <span className="flex items-center gap-1 text-sm text-muted-foreground">
            <Calendar className="w-4 h-4" />
            {new Date(summary.checkInDate).toLocaleDateString()}
          </span>
        )}
      </div>
    </Link>
  );
};
