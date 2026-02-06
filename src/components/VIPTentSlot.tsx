import React from 'react';
import { cn } from '@/lib/utils';
import { Lock, Check } from 'lucide-react';

interface VIPTentSlotProps {
  tentCode: string;
  isAvailable: boolean;
  conflictingGroup?: string;
  isAssignedToCurrentGroup?: boolean;
  onClick: () => void;
  disabled?: boolean;
}

export const VIPTentSlot: React.FC<VIPTentSlotProps> = ({
  tentCode,
  isAvailable,
  conflictingGroup,
  isAssignedToCurrentGroup,
  onClick,
  disabled,
}) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled || !isAvailable}
      className={cn(
        'relative p-4 rounded-xl border-2 transition-all text-center min-w-[100px]',
        isAvailable && !isAssignedToCurrentGroup && 'border-green-400 bg-green-50 dark:bg-green-950/20 hover:shadow-md cursor-pointer',
        isAssignedToCurrentGroup && 'border-primary bg-primary/10',
        !isAvailable && !isAssignedToCurrentGroup && 'border-muted bg-muted/50 cursor-not-allowed opacity-60',
        disabled && 'opacity-50 cursor-not-allowed'
      )}
    >
      {isAssignedToCurrentGroup && (
        <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
          <Check className="w-4 h-4" />
        </div>
      )}
      
      {!isAvailable && !isAssignedToCurrentGroup && (
        <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center">
          <Lock className="w-4 h-4" />
        </div>
      )}
      
      <div className="font-bold text-lg mb-1">VIP {tentCode}</div>
      
      <div className="text-sm">
        {isAssignedToCurrentGroup ? (
          <span className="text-primary font-medium">שובץ ✓</span>
        ) : isAvailable ? (
          <span className="text-green-600 dark:text-green-400">פנוי</span>
        ) : (
          <span className="text-muted-foreground truncate block" title={conflictingGroup}>
            {conflictingGroup || 'תפוס'}
          </span>
        )}
      </div>
      
      <div className="text-xs text-muted-foreground mt-1">
        3 🛏
      </div>
    </button>
  );
};
