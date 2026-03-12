import React from 'react';
import { VIPTentConfig } from '@/types/adminGroups';
import { cn } from '@/lib/utils';
import { BedDouble, Check } from 'lucide-react';

interface VIPConfigCardProps {
  config: VIPTentConfig;
  index: number;
  isSelected: boolean;
  onClick: () => void;
}

export const VIPConfigCard: React.FC<VIPConfigCardProps> = ({
  config,
  index,
  isSelected,
  onClick,
}) => {
  const totalBeds = config.bedsPlanned + (config.hasExtraBed ? 1 : 0);
  const genderLabel = config.gender === 'female' ? 'נשים' : config.gender === 'male' ? 'גברים' : '---';
  
  const borderColor = config.gender === 'female' 
    ? 'border-gender-female' 
    : config.gender === 'male' 
      ? 'border-gender-male' 
      : 'border-muted';

  const bgColor = config.gender === 'female'
    ? 'bg-gender-female-light dark:bg-gender-female/10'
    : config.gender === 'male'
      ? 'bg-gender-male-light dark:bg-gender-male/10'
      : 'bg-muted/30';

  return (
    <button
      onClick={onClick}
      className={cn(
        'relative p-4 rounded-xl border-2 transition-all text-center min-w-[120px]',
        borderColor,
        bgColor,
        isSelected && 'ring-2 ring-primary ring-offset-2',
        'hover:shadow-md cursor-pointer'
      )}
    >
      {isSelected && (
        <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
          <Check className="w-4 h-4" />
        </div>
      )}
      
      <div className="font-bold text-lg mb-1">אוהל {index + 1}</div>
      
      <div className="flex items-center justify-center gap-1 text-sm text-muted-foreground mb-2">
        <BedDouble className="w-4 h-4" />
        <span>
          {config.bedsPlanned}
          {config.hasExtraBed && '+1'} מיטות
        </span>
      </div>
      
      <div className={cn(
        'text-sm font-medium px-2 py-1 rounded-lg',
        config.gender === 'female' && 'bg-pink-200/50 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300',
        config.gender === 'male' && 'bg-blue-200/50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
        !config.gender && 'bg-muted text-muted-foreground'
      )}>
        {genderLabel}
      </div>
      
      <div className="mt-2 text-xs text-muted-foreground">
        לא שובץ
      </div>
    </button>
  );
};
