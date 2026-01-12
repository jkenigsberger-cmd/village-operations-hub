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
        'tile-large flex flex-col gap-4 animate-slide-up',
        isVIP && 'border-vip/50 bg-gradient-to-br from-card to-vip/10'
      )}
    >
      <div className="flex items-start justify-between">
        <div>
          <h3 className={cn(
            "text-2xl font-bold",
            isVIP && "text-accent"
          )}>
            {summary.displayName}
          </h3>
          {isVIP && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-vip text-vip-foreground rounded-full text-sm font-semibold mt-1">
              <Sparkles className="w-3 h-3" />
              VIP
            </span>
          )}
        </div>
        <Tent className="w-8 h-8 text-muted-foreground" />
      </div>

      {/* Occupancy bar */}
      <div className="space-y-2">
        <div className="flex justify-between text-lg">
          <span className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            <span className="font-medium">{summary.occupiedBeds} / {summary.totalBeds} beds</span>
          </span>
          <span className="font-bold">{occupancyPercent}%</span>
        </div>
        <div className="h-3 bg-muted rounded-full overflow-hidden">
          <div 
            className="h-full bg-primary rounded-full transition-all duration-500"
            style={{ width: `${occupancyPercent}%` }}
          />
        </div>
      </div>

      {/* Stats row */}
      <div className="flex flex-wrap gap-4 text-base">
        {summary.dirtyTents > 0 && (
          <span className="flex items-center gap-1 px-3 py-1 bg-status-dirty rounded-full font-medium">
            🧹 {summary.dirtyTents} dirty
          </span>
        )}
        {summary.checkInsToday > 0 && (
          <span className="flex items-center gap-1 px-3 py-1 bg-status-reserved rounded-full font-medium">
            <Calendar className="w-4 h-4" />
            {summary.checkInsToday} check-in
          </span>
        )}
        {summary.checkOutsToday > 0 && (
          <span className="flex items-center gap-1 px-3 py-1 bg-muted rounded-full font-medium">
            <Calendar className="w-4 h-4" />
            {summary.checkOutsToday} check-out
          </span>
        )}
        {summary.freeBeds > 0 && (
          <span className="text-muted-foreground">
            {summary.freeBeds} free
          </span>
        )}
      </div>
    </Link>
  );
};
