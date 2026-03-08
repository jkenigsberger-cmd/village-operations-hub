import React from 'react';
import { format, addDays, subDays, isToday } from 'date-fns';
import { he } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, CalendarIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';

interface NeighborhoodDatePickerProps {
  value: Date;
  onChange: (date: Date) => void;
}

export const NeighborhoodDatePicker: React.FC<NeighborhoodDatePickerProps> = ({
  value,
  onChange,
}) => {
  return (
    <div className="flex items-center gap-2 mb-4">
      <Button
        variant="outline"
        size="icon"
        onClick={() => onChange(addDays(value, 1))}
      >
        <ChevronRight className="w-4 h-4" />
      </Button>

      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "min-w-[200px] justify-center text-center font-semibold",
              isToday(value) && "bg-primary/10"
            )}
          >
            <CalendarIcon className="ml-2 h-4 w-4" />
            {isToday(value) 
              ? 'היום' 
              : format(value, "EEEE, d בMMMM", { locale: he })}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="center">
          <Calendar
            mode="single"
            selected={value}
            onSelect={(date) => date && onChange(date)}
            initialFocus
            className="p-3 pointer-events-auto"
          />
        </PopoverContent>
      </Popover>

      <Button
        variant="outline"
        size="icon"
        onClick={() => onChange(addDays(value, 1))}
      >
        <ChevronLeft className="w-4 h-4" />
      </Button>

      {!isToday(value) && (
        <Button
          variant="ghost"
          onClick={() => onChange(new Date())}
          className="text-primary"
        >
          היום
        </Button>
      )}
    </div>
  );
};
