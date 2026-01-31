import React, { useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Trash2, Plus, AlertTriangle, CheckCircle2, Tent } from 'lucide-react';
import { VIPTentPlan } from '@/types/adminGroups';
import { cn } from '@/lib/utils';

const VIP_TENT_CODES = ['80', '81', '82', '83', '84', '85', '86', '87', '88', '89'];

interface VIPTentPlannerProps {
  staffCount: number;
  vipTentPlans: VIPTentPlan[];
  onPlansChange: (plans: VIPTentPlan[]) => void;
  availableVIPTents: { tentCode: string; available: boolean; conflictingGroup?: string }[];
  disabled?: boolean;
}

export const VIPTentPlanner: React.FC<VIPTentPlannerProps> = ({
  staffCount,
  vipTentPlans,
  onPlansChange,
  availableVIPTents,
  disabled = false,
}) => {
  // Calculate totals
  const plannedBeds = useMemo(() => 
    vipTentPlans.reduce((sum, t) => sum + t.bedsPlanned, 0), 
    [vipTentPlans]
  );
  
  const remainingToPlan = staffCount - plannedBeds;
  const usedTentCodes = vipTentPlans.map(t => t.tentCode);
  
  // Get tents available for adding (not already in plan)
  const tentsForDropdown = useMemo(() => {
    return availableVIPTents.filter(t => !usedTentCodes.includes(t.tentCode));
  }, [availableVIPTents, usedTentCodes]);

  const addTent = (tentCode: string) => {
    if (usedTentCodes.includes(tentCode)) return;
    const newPlan: VIPTentPlan = { tentCode, bedsPlanned: 3 };
    onPlansChange([...vipTentPlans, newPlan].sort((a, b) => a.tentCode.localeCompare(b.tentCode)));
  };

  const removeTent = (tentCode: string) => {
    onPlansChange(vipTentPlans.filter(p => p.tentCode !== tentCode));
  };

  const updateTentBeds = (tentCode: string, beds: number) => {
    onPlansChange(
      vipTentPlans.map(p => 
        p.tentCode === tentCode ? { ...p, bedsPlanned: beds } : p
      )
    );
  };

  const updateTentGender = (tentCode: string, gender: 'female' | 'male' | undefined) => {
    onPlansChange(
      vipTentPlans.map(p => 
        p.tentCode === tentCode ? { ...p, gender } : p
      )
    );
  };

  if (staffCount === 0) {
    return (
      <div className="p-4 bg-muted/50 rounded-lg text-center text-muted-foreground">
        <Tent className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">הזן מספר צוות כדי לתכנן אוהלי VIP</p>
      </div>
    );
  }

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Tent className="w-5 h-5" />
          תכנון אוהלי VIP לצוות
        </CardTitle>
        
        {/* Summary */}
        <div className="flex flex-wrap gap-4 text-sm mt-2">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">נדרש:</span>
            <Badge variant="outline">{staffCount} מיטות</Badge>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">מתוכנן:</span>
            <Badge variant={plannedBeds >= staffCount ? "default" : "secondary"}>
              {plannedBeds} מיטות ב-{vipTentPlans.length} אוהלים
            </Badge>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Planned Tents Grid */}
        {vipTentPlans.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {vipTentPlans.map(plan => (
              <div 
                key={plan.tentCode}
                className={cn(
                  "p-3 rounded-lg border-2 bg-background relative",
                  plan.gender === 'female' && "border-pink-300 bg-pink-50/50 dark:bg-pink-950/20",
                  plan.gender === 'male' && "border-blue-300 bg-blue-50/50 dark:bg-blue-950/20",
                  !plan.gender && "border-border"
                )}
              >
                {/* Header with tent code and remove button */}
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-sm">VIP {plan.tentCode}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-muted-foreground hover:text-destructive"
                    onClick={() => removeTent(plan.tentCode)}
                    disabled={disabled}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
                
                {/* Beds selector */}
                <div className="mb-2">
                  <ToggleGroup 
                    type="single" 
                    value={plan.bedsPlanned.toString()}
                    onValueChange={(v) => v && updateTentBeds(plan.tentCode, parseInt(v))}
                    disabled={disabled}
                    className="justify-start"
                  >
                    {[1, 2, 3].map(n => (
                      <ToggleGroupItem 
                        key={n} 
                        value={n.toString()}
                        size="sm"
                        className="h-7 w-7 text-xs"
                      >
                        {n}
                      </ToggleGroupItem>
                    ))}
                  </ToggleGroup>
                </div>
                
                {/* Gender selector */}
                <Select 
                  value={plan.gender || "_none"} 
                  onValueChange={(v) => updateTentGender(plan.tentCode, v === "_none" ? undefined : v as 'female' | 'male')}
                  disabled={disabled}
                >
                  <SelectTrigger className="h-7 text-xs">
                    <SelectValue placeholder="מגדר" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_none">ללא</SelectItem>
                    <SelectItem value="female">♀️ נקבה</SelectItem>
                    <SelectItem value="male">♂️ זכר</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            ))}
          </div>
        )}
        
        {/* Add Tent Dropdown */}
        {vipTentPlans.length < 10 && (
          <div className="flex items-center gap-2">
            <Select 
              value="_placeholder" 
              onValueChange={(value) => {
                if (value !== "_placeholder") {
                  addTent(value);
                }
              }}
              disabled={disabled || tentsForDropdown.filter(t => t.available).length === 0}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="הוסף אוהל VIP..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="_placeholder" disabled className="hidden">הוסף אוהל VIP...</SelectItem>
                {tentsForDropdown.map(tent => (
                  <SelectItem 
                    key={tent.tentCode} 
                    value={tent.tentCode}
                    disabled={!tent.available}
                    className={cn(!tent.available && "opacity-50")}
                  >
                    <span className="flex items-center gap-2">
                      VIP {tent.tentCode}
                      {tent.available ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
                      ) : (
                        <span className="text-xs text-destructive">
                          ❌ {tent.conflictingGroup}
                        </span>
                      )}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const nextAvailable = tentsForDropdown.find(t => t.available);
                if (nextAvailable) addTent(nextAvailable.tentCode);
              }}
              disabled={disabled || tentsForDropdown.filter(t => t.available).length === 0}
            >
              <Plus className="w-4 h-4 ml-1" />
              הוסף
            </Button>
          </div>
        )}
        
        {/* Warning if not enough beds planned */}
        {remainingToPlan > 0 && staffCount > 0 && (
          <div className="flex items-center gap-2 p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg text-amber-800 dark:text-amber-200">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span className="text-sm">
              נשאר {remainingToPlan} מיטות צוות לא מתוכננות
            </span>
          </div>
        )}
        
        {/* Success message when fully planned */}
        {remainingToPlan <= 0 && staffCount > 0 && vipTentPlans.length > 0 && (
          <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg text-green-800 dark:text-green-200">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            <span className="text-sm">
              כל מיטות הצוות מתוכננות ✓
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
