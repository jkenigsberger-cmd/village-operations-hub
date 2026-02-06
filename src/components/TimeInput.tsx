import React, { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Minus, Plus, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface TimeInputProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  required?: boolean;
  className?: string;
  disabled?: boolean;
  error?: string;
  showPresets?: boolean;
  showStepButtons?: boolean;
  minTime?: string; // For validation: time must be after this
  placeholder?: string;
}

// Common time presets
const TIME_PRESETS = [
  '07:00', '08:00', '09:00', '10:00', '11:00', '12:00',
  '13:00', '14:00', '15:00', '16:00', '17:00', '18:00',
  '19:00', '20:00', '21:00', '22:00'
];

/**
 * Normalize various time input formats to HH:MM
 * Accepts: "9", "09", "900", "0900", "9:0", "9:00", "09:00"
 */
function normalizeTimeInput(input: string): string | null {
  if (!input || input.trim() === '') return null;
  
  // Remove any non-digit characters except colon
  const cleaned = input.replace(/[^\\d:]/g, '');
  
  let hours: number;
  let minutes: number;
  
  if (cleaned.includes(':')) {
    // Format: H:M, HH:M, H:MM, HH:MM
    const [h, m] = cleaned.split(':');
    hours = parseInt(h, 10) || 0;
    minutes = parseInt(m, 10) || 0;
  } else {
    // Format without colon
    const len = cleaned.length;
    if (len === 1) {
      // "9" -> 09:00
      hours = parseInt(cleaned, 10);
      minutes = 0;
    } else if (len === 2) {
      // "09" -> 09:00 or "12" -> 12:00
      hours = parseInt(cleaned, 10);
      minutes = 0;
    } else if (len === 3) {
      // "900" -> 09:00
      hours = parseInt(cleaned[0], 10);
      minutes = parseInt(cleaned.slice(1), 10);
    } else if (len >= 4) {
      // "0900" -> 09:00
      hours = parseInt(cleaned.slice(0, 2), 10);
      minutes = parseInt(cleaned.slice(2, 4), 10);
    } else {
      return null;
    }
  }
  
  // Validate ranges
  if (isNaN(hours) || isNaN(minutes)) return null;
  if (hours < 0 || hours > 23) return null;
  if (minutes < 0 || minutes > 59) return null;
  
  // Format as HH:MM
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}

/**
 * Add or subtract minutes from a time string
 */
function adjustTime(time: string, deltaMinutes: number): string {
  const normalized = normalizeTimeInput(time);
  if (!normalized) return '09:00';
  
  const [h, m] = normalized.split(':').map(Number);
  let totalMinutes = h * 60 + m + deltaMinutes;
  
  // Clamp to valid range
  totalMinutes = Math.max(0, Math.min(23 * 60 + 59, totalMinutes));
  
  const newHours = Math.floor(totalMinutes / 60);
  const newMinutes = totalMinutes % 60;
  
  return `${newHours.toString().padStart(2, '0')}:${newMinutes.toString().padStart(2, '0')}`;
}

export const TimeInput: React.FC<TimeInputProps> = ({
  value,
  onChange,
  label,
  required = false,
  className,
  disabled = false,
  error,
  showPresets = true,
  showStepButtons = true,
  minTime,
  placeholder = '00:00',
}) => {
  const [inputValue, setInputValue] = useState(value || '');
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync external value changes
  useEffect(() => {
    if (!isFocused) {
      setInputValue(value || '');
    }
  }, [value, isFocused]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Allow typing freely
    setInputValue(e.target.value);
  };

  const handleBlur = () => {
    setIsFocused(false);
    const normalized = normalizeTimeInput(inputValue);
    if (normalized) {
      setInputValue(normalized);
      onChange(normalized);
    } else if (inputValue.trim() === '') {
      // Keep empty or reset to previous valid value
      setInputValue(value || '');
    } else {
      // Invalid input, reset
      setInputValue(value || '');
    }
  };

  const handleFocus = () => {
    setIsFocused(true);
  };

  const handleStep = (delta: number) => {
    const newTime = adjustTime(value || '09:00', delta);
    setInputValue(newTime);
    onChange(newTime);
  };

  const handlePresetSelect = (preset: string) => {
    setInputValue(preset);
    onChange(preset);
  };

  // Check if current time is valid compared to minTime
  const hasMinTimeError = minTime && value && value <= minTime;

  return (
    <div className={cn("space-y-1.5", className)}>
      {label && (
        <Label className="flex items-center gap-1.5 text-sm font-medium">
          <Clock className="w-4 h-4 text-muted-foreground" />
          {label}
          {required && <span className="text-destructive">*</span>}
        </Label>
      )}
      
      <div className="flex items-center gap-1">
        {/* Decrease button */}
        {showStepButtons && (
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-10 w-10 flex-shrink-0 text-muted-foreground hover:text-foreground"
            onClick={() => handleStep(-15)}
            disabled={disabled}
            tabIndex={-1}
          >
            <Minus className="w-4 h-4" />
          </Button>
        )}
        
        {/* Time input */}
        <Input
          ref={inputRef}
          type="text"
          inputMode="numeric"
          value={inputValue}
          onChange={handleInputChange}
          onBlur={handleBlur}
          onFocus={handleFocus}
          placeholder={placeholder}
          disabled={disabled}
          className={cn(
            "text-center font-mono text-lg h-10 flex-1 min-w-[80px]",
            (error || hasMinTimeError) && "border-destructive focus-visible:ring-destructive"
          )}
          dir="ltr"
        />
        
        {/* Increase button */}
        {showStepButtons && (
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-10 w-10 flex-shrink-0 text-muted-foreground hover:text-foreground"
            onClick={() => handleStep(15)}
            disabled={disabled}
            tabIndex={-1}
          >
            <Plus className="w-4 h-4" />
          </Button>
        )}
        
        {/* Presets dropdown */}
        {showPresets && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-10 w-10 flex-shrink-0"
                disabled={disabled}
                tabIndex={-1}
              >
                <Clock className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent 
              align="end" 
              className="max-h-[280px] overflow-y-auto bg-background z-50"
            >
              {TIME_PRESETS.map(preset => (
                <DropdownMenuItem
                  key={preset}
                  onClick={() => handlePresetSelect(preset)}
                  className="font-mono text-center justify-center"
                >
                  {preset}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
      
      {/* Error message */}
      {(error || hasMinTimeError) && (
        <p className="text-sm text-destructive flex items-center gap-1">
          {error || 'שעת הסיום חייבת להיות אחרי שעת ההתחלה'}
        </p>
      )}
    </div>
  );
};

export default TimeInput;

