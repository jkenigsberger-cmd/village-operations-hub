import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Label } from '@/components/ui/label';
import { Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TimePickerFieldProps {
  label?: string;
  value: string | null;
  onChange: (newValue: string | null) => void;
  required?: boolean;
  disabled?: boolean;
  helperText?: string;
  error?: string;
  className?: string;
}

// Generate hour options (0-23)
const HOURS = Array.from({ length: 24 }, (_, i) => i);
// Generate minute options (0, 5, 10, ..., 55)
const MINUTES = Array.from({ length: 12 }, (_, i) => i * 5);

export const TimePickerField: React.FC<TimePickerFieldProps> = ({
  label,
  value,
  onChange,
  required = false,
  disabled = false,
  helperText,
  error,
  className,
}) => {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<'hours' | 'minutes'>('hours');

  // Parse current value
  const { selectedHour, selectedMinute } = useMemo(() => {
    if (!value) return { selectedHour: null, selectedMinute: null };
    const [h, m] = value.split(':').map(Number);
    return { selectedHour: h, selectedMinute: m };
  }, [value]);

  const [tempHour, setTempHour] = useState<number | null>(selectedHour);

  const handleHourSelect = (hour: number) => {
    setTempHour(hour);
    setStep('minutes');
  };

  const handleMinuteSelect = (minute: number) => {
    const hour = tempHour ?? 0;
    const newValue = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
    onChange(newValue);
    setOpen(false);
    setStep('hours');
  };

  const handleOpen = (isOpen: boolean) => {
    if (isOpen) {
      setTempHour(selectedHour);
      setStep('hours');
    }
    setOpen(isOpen);
  };

  const displayValue = value || 'HH:MM';

  return (
    <div className={cn("space-y-1.5", className)}>
      {label && (
        <Label className="text-sm font-medium flex items-center gap-1.5">
          <Clock className="w-4 h-4 text-muted-foreground" />
          {label}
          {required && <span className="text-destructive">*</span>}
        </Label>
      )}
      
      <Popover open={open} onOpenChange={handleOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            disabled={disabled}
            className={cn(
              "w-full justify-center text-xl font-mono h-12 border-2",
              !value && "text-muted-foreground",
              error && "border-destructive",
              "hover:bg-muted/50 transition-colors"
            )}
          >
            {displayValue}
          </Button>
        </PopoverTrigger>
        <PopoverContent 
          className="w-[280px] p-4" 
          align="center"
          dir="rtl"
        >
          <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">
                {step === 'hours' ? 'בחר שעה' : 'בחר דקות'}
              </span>
              <div className="flex items-center gap-1 text-2xl font-mono">
                <span className={cn(
                  "px-2 py-1 rounded",
                  step === 'hours' ? "bg-primary text-primary-foreground" : "text-muted-foreground"
                )}>
                  {tempHour !== null ? tempHour.toString().padStart(2, '0') : '--'}
                </span>
                <span>:</span>
                <span className={cn(
                  "px-2 py-1 rounded",
                  step === 'minutes' ? "bg-primary text-primary-foreground" : "text-muted-foreground"
                )}>
                  {selectedMinute !== null && step === 'hours' 
                    ? selectedMinute.toString().padStart(2, '0') 
                    : '--'}
                </span>
              </div>
            </div>

            {/* Clock Grid */}
            {step === 'hours' ? (
              <div className="grid grid-cols-6 gap-1.5">
                {HOURS.map((hour) => (
                  <Button
                    key={hour}
                    variant={selectedHour === hour ? "default" : "outline"}
                    size="sm"
                    className={cn(
                      "h-10 w-full text-base font-medium",
                      selectedHour === hour && "bg-primary text-primary-foreground"
                    )}
                    onClick={() => handleHourSelect(hour)}
                  >
                    {hour.toString().padStart(2, '0')}
                  </Button>
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setStep('hours')}
                  className="text-xs text-muted-foreground"
                >
                  ← חזור לבחירת שעה
                </Button>
                <div className="grid grid-cols-4 gap-2">
                  {MINUTES.map((minute) => (
                    <Button
                      key={minute}
                      variant={selectedMinute === minute && tempHour === selectedHour ? "default" : "outline"}
                      size="sm"
                      className={cn(
                        "h-12 text-lg font-medium",
                        selectedMinute === minute && tempHour === selectedHour && 
                        "bg-primary text-primary-foreground"
                      )}
                      onClick={() => handleMinuteSelect(minute)}
                    >
                      {minute.toString().padStart(2, '0')}
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </PopoverContent>
      </Popover>

      {helperText && !error && (
        <p className="text-xs text-muted-foreground">{helperText}</p>
      )}
      {error && (
        <p className="text-xs text-destructive">{error}</p>
      )}
    </div>
  );
};

export default TimePickerField;
