import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Minus, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NumericInputProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  showStepper?: boolean;
}

/**
 * A user-friendly numeric input that:
 * - Allows empty state while editing (no forced leading zeros)
 * - Converts to proper number on blur
 * - Optional +/- stepper buttons
 */
export const NumericInput: React.FC<NumericInputProps> = ({
  value,
  onChange,
  min = 0,
  max,
  placeholder = '0',
  className,
  disabled = false,
  showStepper = false,
}) => {
  // Local string state for editing
  const [inputValue, setInputValue] = useState<string>(value.toString());

  // Sync external value changes
  useEffect(() => {
    setInputValue(value.toString());
  }, [value]);

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    // Auto-select all text so typing replaces the value instantly
    e.target.select();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    
    // Allow empty string or digits only
    if (val === '' || /^\d+$/.test(val)) {
      setInputValue(val);
    }
  };

  const handleBlur = () => {
    if (inputValue === '' || inputValue === null) {
      // Default to min or 0 on empty
      onChange(min ?? 0);
      setInputValue((min ?? 0).toString());
    } else {
      let num = parseInt(inputValue, 10);
      
      // Clamp to min/max
      if (min !== undefined && num < min) num = min;
      if (max !== undefined && num > max) num = max;
      
      onChange(num);
      setInputValue(num.toString());
    }
  };

  const handleIncrement = () => {
    let newVal = (parseInt(inputValue, 10) || 0) + 1;
    if (max !== undefined && newVal > max) newVal = max;
    onChange(newVal);
    setInputValue(newVal.toString());
  };

  const handleDecrement = () => {
    let newVal = (parseInt(inputValue, 10) || 0) - 1;
    if (min !== undefined && newVal < min) newVal = min;
    onChange(newVal);
    setInputValue(newVal.toString());
  };

  if (showStepper) {
    return (
      <div className={cn("flex items-center gap-1", className)}>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="h-10 w-10 flex-shrink-0"
          onClick={handleDecrement}
          disabled={disabled || (min !== undefined && (parseInt(inputValue, 10) || 0) <= min)}
        >
          <Minus className="w-4 h-4" />
        </Button>
        <Input
          type="text"
          inputMode="numeric"
          value={inputValue}
          onChange={handleChange}
          onBlur={handleBlur}
          onFocus={handleFocus}
          placeholder={placeholder}
          disabled={disabled}
          className="text-center"
          dir="ltr"
        />
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="h-10 w-10 flex-shrink-0"
          onClick={handleIncrement}
          disabled={disabled || (max !== undefined && (parseInt(inputValue, 10) || 0) >= max)}
        >
          <Plus className="w-4 h-4" />
        </Button>
      </div>
    );
  }

  return (
    <Input
      type="text"
      inputMode="numeric"
      value={inputValue}
      onChange={handleChange}
      onBlur={handleBlur}
      onFocus={handleFocus}
      placeholder={placeholder}
      disabled={disabled}
      className={cn("", className)}
      dir="ltr"
    />
  );
};

export default NumericInput;
