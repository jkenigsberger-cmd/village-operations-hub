import React from 'react';
import { CleaningStatus, WorkingStatus, BedStatus } from '@/types/village';
import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  status: BedStatus | CleaningStatus | WorkingStatus;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

const statusConfig: Record<string, { bg: string; label: string }> = {
  // Bed status
  FREE: { bg: 'bg-status-free', label: 'Free' },
  RESERVED: { bg: 'bg-status-reserved', label: 'Reserved' },
  OCCUPIED: { bg: 'bg-status-occupied', label: 'Occupied' },
  BLOCKED: { bg: 'bg-status-blocked', label: 'Blocked' },
  
  // Cleaning status
  CLEAN: { bg: 'bg-status-clean', label: 'Clean' },
  NEEDS_CLEANING: { bg: 'bg-status-dirty', label: 'Needs Cleaning' },
  CLEANING_IN_PROGRESS: { bg: 'bg-status-cleaning', label: 'Cleaning...' },
  
  // Working status
  WORKING: { bg: 'bg-status-working', label: 'Working' },
  BROKEN: { bg: 'bg-status-broken', label: 'Broken' },
  MAINTENANCE: { bg: 'bg-status-maintenance', label: 'Maintenance' },
  CLOSED: { bg: 'bg-status-blocked', label: 'Closed' },
};

const sizeClasses = {
  sm: 'px-2 py-1 text-sm',
  md: 'px-3 py-1.5 text-base',
  lg: 'px-4 py-2 text-lg',
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({ 
  status, 
  size = 'md',
  showLabel = true 
}) => {
  const config = statusConfig[status] || { bg: 'bg-muted', label: status };
  
  return (
    <span 
      className={cn(
        'status-badge rounded-full font-semibold',
        config.bg,
        sizeClasses[size]
      )}
    >
      {showLabel && config.label}
    </span>
  );
};

// Quick status toggle buttons
interface CleaningToggleProps {
  status: CleaningStatus;
  onChange: (status: CleaningStatus) => void;
  size?: 'sm' | 'md' | 'lg';
}

export const CleaningToggle: React.FC<CleaningToggleProps> = ({
  status,
  onChange,
  size = 'md'
}) => {
  const statuses: CleaningStatus[] = ['CLEAN', 'NEEDS_CLEANING', 'CLEANING_IN_PROGRESS'];
  
  const sizeClasses = {
    sm: 'px-2 py-1 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  };

  return (
    <div className="flex flex-wrap gap-2">
      {statuses.map((s) => {
        const config = statusConfig[s];
        const isActive = status === s;
        
        return (
          <button
            key={s}
            onClick={() => onChange(s)}
            className={cn(
              'rounded-xl font-semibold transition-all duration-200',
              sizeClasses[size],
              isActive 
                ? cn(config.bg, 'ring-2 ring-offset-2 ring-primary shadow-md')
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            )}
          >
            {config.label}
          </button>
        );
      })}
    </div>
  );
};

interface WorkingToggleProps {
  status: WorkingStatus;
  onChange: (status: WorkingStatus) => void;
  size?: 'sm' | 'md' | 'lg';
}

export const WorkingToggle: React.FC<WorkingToggleProps> = ({
  status,
  onChange,
  size = 'md'
}) => {
  const statuses: WorkingStatus[] = ['WORKING', 'BROKEN', 'MAINTENANCE', 'CLOSED'];
  
  const sizeClasses = {
    sm: 'px-2 py-1 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  };

  return (
    <div className="flex flex-wrap gap-2">
      {statuses.map((s) => {
        const config = statusConfig[s];
        const isActive = status === s;
        
        return (
          <button
            key={s}
            onClick={() => onChange(s)}
            className={cn(
              'rounded-xl font-semibold transition-all duration-200',
              sizeClasses[size],
              isActive 
                ? cn(config.bg, 'ring-2 ring-offset-2 ring-primary shadow-md')
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            )}
          >
            {config.label}
          </button>
        );
      })}
    </div>
  );
};
