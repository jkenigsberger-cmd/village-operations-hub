import React from 'react';
import { Facility, CleaningStatus, WorkingStatus } from '@/types/village';
import { CleaningToggle, WorkingToggle } from './StatusBadge';
import { cn } from '@/lib/utils';
import { Droplets, Accessibility, MessageSquare } from 'lucide-react';

interface FacilityCardProps {
  facility: Facility;
  onCleaningChange: (status: CleaningStatus) => void;
  onWorkingChange: (status: WorkingStatus) => void;
  onNotesChange: (notes: string) => void;
}

export const FacilityCard = React.forwardRef<HTMLDivElement, FacilityCardProps>(
  ({ facility, onCleaningChange, onWorkingChange, onNotesChange }, ref) => {
    const isToilet = facility.type === 'TOILET';
    const needsAttention = 
      facility.cleaningStatus === 'NEEDS_CLEANING' || 
      facility.workingStatus === 'BROKEN';

    const genderIcon = {
      UNISEX: '🚻',
      MALE: '🚹',
      FEMALE: '🚺',
    }[facility.gender];

    return (
      <div
        ref={ref}
        className={cn(
          'tile flex flex-col gap-4',
          needsAttention && 'border-destructive bg-destructive/5'
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{genderIcon}</span>
            <div>
              <h4 className="text-xl font-bold">{facility.label}</h4>
              <span className="text-muted-foreground">
                {isToilet ? 'Toilet' : 'Shower'}
              </span>
            </div>
          </div>
          
          <div className="flex gap-2">
            {facility.isAccessible && (
              <span className="p-2 bg-primary text-primary-foreground rounded-full">
                <Accessibility className="w-5 h-5" />
              </span>
            )}
            {!isToilet && (
              <span className="p-2 bg-accent text-accent-foreground rounded-full">
                <Droplets className="w-5 h-5" />
              </span>
            )}
          </div>
        </div>

        {/* Cleaning Status */}
        <div className="space-y-2">
          <label className="text-base font-semibold text-muted-foreground">
            Cleaning Status
          </label>
          <CleaningToggle
            status={facility.cleaningStatus}
            onChange={onCleaningChange}
            size="md"
          />
        </div>

        {/* Working Status */}
        <div className="space-y-2">
          <label className="text-base font-semibold text-muted-foreground">
            Working Status
          </label>
          <WorkingToggle
            status={facility.workingStatus}
            onChange={onWorkingChange}
            size="md"
          />
        </div>

        {/* Notes */}
        <div className="space-y-2">
          <label className="text-base font-semibold text-muted-foreground flex items-center gap-2">
            <MessageSquare className="w-4 h-4" />
            Notes
          </label>
          <textarea
            value={facility.notes || ''}
            onChange={(e) => onNotesChange(e.target.value)}
            placeholder="Add notes..."
            className="w-full px-4 py-3 rounded-xl border-2 border-input bg-background resize-none focus:outline-none focus:border-primary"
            rows={2}
          />
        </div>

        {/* Last updated */}
        <div className="text-sm text-muted-foreground">
          Updated: {new Date(facility.lastUpdated).toLocaleString()}
        </div>
      </div>
    );
  }
);

FacilityCard.displayName = 'FacilityCard';

// Compact facility tile for overview
interface FacilityTileProps {
  facility: Facility;
  onClick: () => void;
}

export const FacilityTile: React.FC<FacilityTileProps> = ({ facility, onClick }) => {
  const isToilet = facility.type === 'TOILET';
  const needsAttention = 
    facility.cleaningStatus === 'NEEDS_CLEANING' || 
    facility.workingStatus === 'BROKEN';

  const genderIcon = {
    UNISEX: '🚻',
    MALE: '🚹',
    FEMALE: '🚺',
  }[facility.gender];

  return (
    <button
      onClick={onClick}
      className={cn(
        'tile p-4 text-left w-full',
        needsAttention && 'border-destructive bg-destructive/5 animate-pulse-soft'
      )}
    >
      <div className="flex items-center gap-3">
        <span className="text-2xl">{genderIcon}</span>
        <div className="flex-1">
          <h5 className="font-bold">{facility.label}</h5>
          <div className="flex gap-2 mt-1">
            <span className={cn(
              'px-2 py-0.5 rounded-full text-sm font-medium',
              facility.cleaningStatus === 'CLEAN' && 'bg-status-clean',
              facility.cleaningStatus === 'NEEDS_CLEANING' && 'bg-status-dirty',
              facility.cleaningStatus === 'CLEANING_IN_PROGRESS' && 'bg-status-cleaning'
            )}>
              {facility.cleaningStatus === 'CLEAN' ? '✓' : facility.cleaningStatus === 'NEEDS_CLEANING' ? '!' : '...'}
            </span>
            {facility.workingStatus !== 'WORKING' && (
              <span className={cn(
                'px-2 py-0.5 rounded-full text-sm font-medium',
                'bg-status-broken'
              )}>
                {facility.workingStatus}
              </span>
            )}
          </div>
        </div>
        {facility.isAccessible && (
          <Accessibility className="w-5 h-5 text-primary" />
        )}
      </div>
    </button>
  );
};
