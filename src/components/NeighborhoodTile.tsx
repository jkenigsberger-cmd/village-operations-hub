import React from 'react';
import { Link } from 'react-router-dom';
import { NeighborhoodSummary } from '@/types/village';
import { cn } from '@/lib/utils';
import { Tent, Users, Calendar, Sparkles } from 'lucide-react';

interface NeighborhoodTileProps {
  summary: NeighborhoodSummary;
  to: string;
}

export const NeighborhoodTile: React.FC<NeighborhoodTileProps> = ({ summary, to }) => {
  const occupancyPercent = summary.totalBeds > 0 
    ? Math.round((summary.occupiedBeds / summary.totalBeds) * 100) 
    : 0;

  const isVIP = summary.id === 'VIP';

  return (
    <Link 
      to={to}
      className={cn(
        'tile-large flex flex-col gap-3 md:gap-4 animate-slide-up min-h-[120px] md:min-h-[140px]',
        isVIP && 'border-vip/50 bg-gradient-to-br from-card to-vip/10'
      )}
    >
      <div className="flex items-start justify-between">
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
    </Link>
  );
};
