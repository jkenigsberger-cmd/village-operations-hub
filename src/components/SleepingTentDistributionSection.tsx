import React, { useState, useEffect, useMemo } from 'react';
import { 
  DistributionPreference, 
  DistributionMode, 
  TentRange, 
  VirtualTent,
  createEmptyDistributionPreference,
  generateUniformTents,
  generateTentsFromRanges,
  calculateTotalPax,
  validateDistribution
} from '@/types/distributionPreference';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { NumericInput } from '@/components/NumericInput';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  ChevronDown, 
  ChevronUp, 
  Tent, 
  AlertCircle, 
  AlertTriangle, 
  CheckCircle2,
  Plus,
  Trash2,
  Sparkles,
  Info
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface SleepingTentDistributionSectionProps {
  participantCount: number;
  preference: DistributionPreference | null;
  onChange: (preference: DistributionPreference | null) => void;
  disabled?: boolean;
}

const DISTRIBUTION_MODE_LABELS: Record<DistributionMode, string> = {
  uniform: 'אחיד',
  ranges: 'טווחים',
  custom: 'מותאם אישית',
};

export const SleepingTentDistributionSection: React.FC<SleepingTentDistributionSectionProps> = ({
  participantCount,
  preference,
  onChange,
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(preference !== null && preference.requestedSleepingTentCount > 0);
  const [localPreference, setLocalPreference] = useState<DistributionPreference>(
    preference || createEmptyDistributionPreference()
  );
  
  // When preference prop changes, update local state
  useEffect(() => {
    if (preference) {
      setLocalPreference(preference);
      if (preference.requestedSleepingTentCount > 0) {
        setIsOpen(true);
      }
    }
  }, [preference]);

  // Calculate validation
  const validation = useMemo(() => {
    return validateDistribution(localPreference, participantCount);
  }, [localPreference, participantCount]);

  // Update parent when local changes
  const updatePreference = (updates: Partial<DistributionPreference>) => {
    const newPref = { 
      ...localPreference, 
      ...updates, 
      updatedAt: new Date().toISOString() 
    };
    
    // Recalculate tents and totalPax based on mode
    let tents: VirtualTent[] = [];
    
    if (newPref.mode === 'uniform' && newPref.requestedSleepingTentCount > 0) {
      // For uniform, calculate pax per tent
      const paxPerTent = newPref.preferredTentCapacity || 8;
      tents = generateUniformTents(newPref.requestedSleepingTentCount, paxPerTent);
    } else if (newPref.mode === 'ranges' && newPref.ranges && newPref.ranges.length > 0) {
      tents = generateTentsFromRanges(newPref.ranges);
    } else if (newPref.mode === 'custom' && newPref.tents) {
      tents = newPref.tents;
    }
    
    newPref.tents = tents;
    newPref.totalPax = calculateTotalPax(tents);
    newPref.isValid = newPref.totalPax === participantCount;
    
    setLocalPreference(newPref);
    onChange(newPref.requestedSleepingTentCount > 0 ? newPref : null);
  };

  // Auto-distribute evenly
  const autoDistribute = () => {
    if (participantCount <= 0) return;
    
    const capacity = localPreference.preferredTentCapacity || 8;
    const tentCount = Math.ceil(participantCount / capacity);
    const basePax = Math.floor(participantCount / tentCount);
    const remainder = participantCount % tentCount;
    
    const tents: VirtualTent[] = [];
    for (let i = 0; i < tentCount; i++) {
      tents.push({
        index: i + 1,
        pax: basePax + (i < remainder ? 1 : 0),
      });
    }
    
    updatePreference({
      requestedSleepingTentCount: tentCount,
      mode: 'custom',
      tents,
      totalPax: participantCount,
      isValid: true,
    });
  };

  // Add a range
  const addRange = () => {
    const currentRanges = localPreference.ranges || [];
    const lastTo = currentRanges.length > 0 
      ? Math.max(...currentRanges.map(r => r.to)) 
      : 0;
    
    const newRange: TentRange = {
      from: lastTo + 1,
      to: lastTo + 1,
      pax: localPreference.preferredTentCapacity || 8,
    };
    
    updatePreference({
      ranges: [...currentRanges, newRange],
    });
  };

  // Update a range
  const updateRange = (index: number, updates: Partial<TentRange>) => {
    const newRanges = [...(localPreference.ranges || [])];
    newRanges[index] = { ...newRanges[index], ...updates };
    
    // Update requestedSleepingTentCount to max 'to' value
    const maxTo = Math.max(...newRanges.map(r => r.to));
    
    updatePreference({
      ranges: newRanges,
      requestedSleepingTentCount: maxTo,
    });
  };

  // Remove a range
  const removeRange = (index: number) => {
    const newRanges = (localPreference.ranges || []).filter((_, i) => i !== index);
    const maxTo = newRanges.length > 0 ? Math.max(...newRanges.map(r => r.to)) : 0;
    
    updatePreference({
      ranges: newRanges,
      requestedSleepingTentCount: maxTo,
    });
  };

  // Update a custom tent
  const updateTent = (index: number, pax: number) => {
    const newTents = [...(localPreference.tents || [])];
    if (newTents[index]) {
      newTents[index] = { ...newTents[index], pax };
    }
    updatePreference({ tents: newTents });
  };

  // Add a tent in custom mode
  const addTent = () => {
    const newTents = [...(localPreference.tents || [])];
    const maxIndex = newTents.length > 0 ? Math.max(...newTents.map(t => t.index)) : 0;
    newTents.push({ index: maxIndex + 1, pax: localPreference.preferredTentCapacity || 8 });
    updatePreference({ 
      tents: newTents,
      requestedSleepingTentCount: maxIndex + 1,
    });
  };

  // Remove a tent in custom mode
  const removeTent = (index: number) => {
    const newTents = (localPreference.tents || []).filter((_, i) => i !== index);
    const maxIndex = newTents.length > 0 ? Math.max(...newTents.map(t => t.index)) : 0;
    updatePreference({ 
      tents: newTents,
      requestedSleepingTentCount: maxIndex,
    });
  };

  // Clear preference
  const clearPreference = () => {
    setLocalPreference(createEmptyDistributionPreference());
    onChange(null);
    setIsOpen(false);
  };

  return (
    <Card className={cn("border-dashed", disabled && "opacity-60")}>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild disabled={disabled}>
          <div className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/50 transition-colors">
            <div className="flex items-center gap-3">
              <Tent className="w-5 h-5 text-muted-foreground" />
              <div>
                <h4 className="font-medium">העדפת חלוקה לאוהלי לינה</h4>
                <p className="text-sm text-muted-foreground">אופציונלי</p>
              </div>
              {preference && preference.requestedSleepingTentCount > 0 && (
                <Badge variant={validation.isValid ? "default" : "secondary"}>
                  {preference.requestedSleepingTentCount} אוהלים
                </Badge>
              )}
            </div>
            {isOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </div>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="pt-0 space-y-4">
            {/* Info notice */}
            <div className="flex items-start gap-2 p-3 bg-muted/50 rounded-lg text-sm">
              <Info className="w-4 h-4 mt-0.5 text-muted-foreground flex-shrink-0" />
              <span className="text-muted-foreground">
                זו העדפה בלבד ולא שיבוץ בפועל. השיבוץ בפועל מתבצע בלשונית "שיבוצים".
              </span>
            </div>

            {/* Basic inputs */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">מספר אוהלי לינה מבוקש</label>
                <NumericInput
                  value={localPreference.requestedSleepingTentCount}
                  onChange={(val) => updatePreference({ requestedSleepingTentCount: val })}
                  min={0}
                  disabled={disabled}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">קיבולת מועדפת לאוהל</label>
                <NumericInput
                  value={localPreference.preferredTentCapacity}
                  onChange={(val) => updatePreference({ preferredTentCapacity: val })}
                  min={1}
                  max={16}
                  disabled={disabled}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">שיטת חלוקה</label>
                <Select 
                  value={localPreference.mode} 
                  onValueChange={(v) => updatePreference({ mode: v as DistributionMode })}
                  disabled={disabled}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(DISTRIBUTION_MODE_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Auto-distribute button */}
            <Button 
              type="button" 
              variant="outline" 
              onClick={autoDistribute}
              disabled={disabled || participantCount <= 0}
              className="gap-2"
            >
              <Sparkles className="w-4 h-4" />
              חלק אוטומטית ({participantCount} חניכים)
            </Button>

            {/* Uniform mode: just shows preview */}
            {localPreference.mode === 'uniform' && localPreference.requestedSleepingTentCount > 0 && (
              <div className="p-3 bg-muted/30 rounded-lg space-y-2">
                <p className="text-sm font-medium">תצוגה מקדימה:</p>
                <div className="flex flex-wrap gap-2">
                  {(localPreference.tents || []).map((tent) => (
                    <Badge key={tent.index} variant="outline" className="gap-1">
                      {tent.index}: {tent.pax}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Ranges mode */}
            {localPreference.mode === 'ranges' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">טווחי אוהלים</label>
                  <Button 
                    type="button"
                    variant="outline" 
                    size="sm" 
                    onClick={addRange}
                    disabled={disabled}
                  >
                    <Plus className="w-4 h-4 ml-1" />
                    הוסף טווח
                  </Button>
                </div>
                
                {(localPreference.ranges || []).map((range, index) => (
                  <div key={index} className="flex items-center gap-2 p-3 bg-muted/30 rounded-lg">
                    <span className="text-sm">אוהלים</span>
                    <NumericInput
                      value={range.from}
                      onChange={(val) => updateRange(index, { from: val })}
                      min={1}
                      className="w-16"
                      disabled={disabled}
                    />
                    <span className="text-sm">עד</span>
                    <NumericInput
                      value={range.to}
                      onChange={(val) => updateRange(index, { to: val })}
                      min={range.from}
                      className="w-16"
                      disabled={disabled}
                    />
                    <span className="text-sm mx-2">→</span>
                    <NumericInput
                      value={range.pax}
                      onChange={(val) => updateRange(index, { pax: val })}
                      min={1}
                      className="w-16"
                      disabled={disabled}
                    />
                    <span className="text-sm text-muted-foreground">בכל אוהל</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeRange(index)}
                      className="mr-auto text-destructive"
                      disabled={disabled}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}

                {(localPreference.ranges?.length || 0) > 0 && (
                  <div className="flex flex-wrap gap-2 pt-2">
                    {(localPreference.tents || []).map((tent) => (
                      <Badge key={tent.index} variant="outline" className="gap-1">
                        {tent.index}: {tent.pax}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Custom mode */}
            {localPreference.mode === 'custom' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">רשימת אוהלים</label>
                  <Button 
                    type="button"
                    variant="outline" 
                    size="sm" 
                    onClick={addTent}
                    disabled={disabled}
                  >
                    <Plus className="w-4 h-4 ml-1" />
                    הוסף אוהל
                  </Button>
                </div>
                
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
                  {(localPreference.tents || []).map((tent, index) => {
                    const isOverCapacity = tent.pax > localPreference.preferredTentCapacity;
                    return (
                      <div 
                        key={tent.index} 
                        className={cn(
                          "p-2 rounded-lg border flex flex-col items-center gap-1",
                          isOverCapacity ? "border-amber-400 bg-amber-50 dark:bg-amber-950/20" : "bg-muted/30"
                        )}
                      >
                        <span className="text-xs text-muted-foreground">אוהל {tent.index}</span>
                        <NumericInput
                          value={tent.pax}
                          onChange={(val) => updateTent(index, val)}
                          min={0}
                          className="w-full h-8 text-center"
                          disabled={disabled}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeTent(index)}
                          className="text-destructive h-6 px-2"
                          disabled={disabled}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Validation summary */}
            {localPreference.requestedSleepingTentCount > 0 && (
              <div className={cn(
                "p-3 rounded-lg border-2 flex items-center gap-3",
                validation.isValid 
                  ? "border-green-400 bg-green-50 dark:bg-green-950/20" 
                  : "border-red-400 bg-red-50 dark:bg-red-950/20"
              )}>
                {validation.isValid ? (
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-red-600" />
                )}
                <div>
                  <span className="font-medium">
                    סה״כ בחלוקה: {localPreference.totalPax}
                  </span>
                  <span className="mx-2">|</span>
                  <span className="text-muted-foreground">
                    חניכים: {participantCount}
                  </span>
                  {!validation.isValid && (
                    <span className={cn(
                      "mr-2 font-medium",
                      validation.difference > 0 ? "text-red-600" : "text-amber-600"
                    )}>
                      ({validation.difference > 0 ? '+' : ''}{validation.difference})
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Over capacity warnings */}
            {localPreference.tents?.some(t => t.pax > localPreference.preferredTentCapacity) && (
              <div className="flex items-center gap-2 p-3 bg-amber-100 dark:bg-amber-900/30 rounded-lg text-amber-800 dark:text-amber-200">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                <span className="text-sm">
                  חלק מהאוהלים חורגים מהקיבולת המועדפת ({localPreference.preferredTentCapacity})
                </span>
              </div>
            )}

            {/* Clear button */}
            {localPreference.requestedSleepingTentCount > 0 && (
              <Button 
                type="button"
                variant="ghost" 
                onClick={clearPreference}
                disabled={disabled}
                className="text-muted-foreground"
              >
                נקה העדפה
              </Button>
            )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
};
