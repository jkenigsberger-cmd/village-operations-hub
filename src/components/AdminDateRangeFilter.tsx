import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Calendar } from 'lucide-react';
import { DateRangeOption, DATE_RANGE_LABELS } from '@/types/adminFinance';

interface AdminDateRangeFilterProps {
  selectedRange: DateRangeOption;
  customStart?: string;
  customEnd?: string;
  onRangeChange: (range: DateRangeOption) => void;
  onCustomStartChange: (date: string) => void;
  onCustomEndChange: (date: string) => void;
}

export const AdminDateRangeFilter: React.FC<AdminDateRangeFilterProps> = ({
  selectedRange,
  customStart,
  customEnd,
  onRangeChange,
  onCustomStartChange,
  onCustomEndChange,
}) => {
  return (
    <div className="flex flex-wrap items-center gap-2 p-4 bg-card rounded-xl border">
      <Calendar className="w-5 h-5 text-muted-foreground" />
      <span className="font-medium text-sm ml-2">טווח תאריכים:</span>
      
      {(Object.keys(DATE_RANGE_LABELS) as DateRangeOption[]).map((option) => (
        <Button
          key={option}
          variant={selectedRange === option ? 'default' : 'outline'}
          size="sm"
          onClick={() => onRangeChange(option)}
        >
          {DATE_RANGE_LABELS[option]}
        </Button>
      ))}

      {selectedRange === 'custom' && (
        <div className="flex items-center gap-2 mr-4">
          <Input
            type="date"
            value={customStart || ''}
            onChange={(e) => onCustomStartChange(e.target.value)}
            className="w-36"
          />
          <span className="text-muted-foreground">עד</span>
          <Input
            type="date"
            value={customEnd || ''}
            onChange={(e) => onCustomEndChange(e.target.value)}
            className="w-36"
          />
        </div>
      )}
    </div>
  );
};
