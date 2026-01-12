import React from 'react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface ActionTileProps {
  title: string;
  description?: string;
  icon: LucideIcon;
  to?: string;
  onClick?: () => void;
  variant?: 'default' | 'warning' | 'success' | 'danger';
  count?: number;
  badge?: string;
}

const variantClasses = {
  default: 'border-border hover:border-primary/30',
  warning: 'border-status-dirty bg-status-dirty/10 hover:border-status-dirty',
  success: 'border-status-clean bg-status-clean/10 hover:border-status-clean',
  danger: 'border-destructive bg-destructive/10 hover:border-destructive',
};

export const ActionTile: React.FC<ActionTileProps> = ({
  title,
  description,
  icon: Icon,
  to,
  onClick,
  variant = 'default',
  count,
  badge,
}) => {
  const content = (
    <>
      <div className="flex items-start justify-between">
        <Icon className="w-10 h-10 text-muted-foreground" />
        {count !== undefined && (
          <span className="text-3xl font-bold">{count}</span>
        )}
        {badge && (
          <span className="px-3 py-1 bg-primary text-primary-foreground rounded-full text-sm font-semibold">
            {badge}
          </span>
        )}
      </div>
      <div className="mt-4">
        <h3 className="text-2xl font-bold">{title}</h3>
        {description && (
          <p className="text-muted-foreground mt-1">{description}</p>
        )}
      </div>
    </>
  );

  const className = cn('tile-large', variantClasses[variant]);

  if (to) {
    return (
      <Link to={to} className={className}>
        {content}
      </Link>
    );
  }

  return (
    <button onClick={onClick} className={cn(className, 'text-left w-full')}>
      {content}
    </button>
  );
};
