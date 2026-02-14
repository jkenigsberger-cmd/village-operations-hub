import React, { useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Trash2, Plus, AlertTriangle, CheckCircle2, Tent } from 'lucide-react';
import { VIPTentConfig } from '@/types/adminGroups';
import { cn } from '@/lib/utils';

interface VIPTentPlannerProps {
  staffCount: number;
  vipTentConfigs: VIPTentConfig[];
  onConfigsChange: (configs: VIPTentConfig[]) => void;
  disabled?: boolean;
}

export const VIPTentPlanner: React.FC<VIPTentPlannerProps> = ({
  staffCount,
  vipTentConfigs,
  onConfigsChange,
  disabled = false,
}) => {
  // Calculate totals
  const plannedBeds = useMemo(() => 
    vipTentConfigs.reduce((sum, t) => sum + t.bedsPlanned + (t.hasExtraBed ? 1 : 0), 0), 
    [vipTentConfigs]
  );
  
  const remainingToPlan = staffCount - plannedBeds;

  const addConfig = () => {
    const newConfig: VIPTentConfig = { 
      id: Math.random().toString(36).substring(2, 11),
      bedsPlanned: 3,
      hasExtraBed: false,
    };
    onConfigsChange([...vipTentConfigs, newConfig]);
  };

  const removeConfig = (id: string) => {
    onConfigsChange(vipTentConfigs.filter(c => c.id !== id));
  };

  const updateConfigBeds = (id: string, beds: number) => {
    onConfigsChange(
      vipTentConfigs.map(c => 
        c.id === id ? { ...c, bedsPlanned: beds } : c
      )
    );
  };

  const updateConfigExtraBed = (id: string, hasExtraBed: boolean) => {
    onConfigsChange(
      vipTentConfigs.map(c => 
        c.id === id ? { ...c, hasExtraBed } : c
      )
    );
  };

  const updateConfigGender = (id: string, gender: 'female' | 'male' | undefined) => {
    onConfigsChange(
      vipTentConfigs.map(c => 
        c.id === id ? { ...c, gender } : c
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
          תצורת אוהלי VIP לצוות
        </CardTitle>
        
        {/* Summary */}
        <div className="flex flex-col sm:flex-row flex-wrap gap-4 text-sm mt-2">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">נדרש:</span>
            <Badge variant="outline">{staffCount} מיטות</Badge>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">מתוכנן:</span>
            <Badge variant={plannedBeds >= staffCount ? "default" : "secondary"}>
              {plannedBeds} מיטות ב-{vipTentConfigs.length} אוהלים
            </Badge>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Planned Configs Grid */}
        {vipTentConfigs.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {vipTentConfigs.map((config, index) => (
              <div 
                key={config.id}
                className={cn(
                  "p-4 rounded-lg border-2 bg-background relative",
                  config.gender === 'female' && "border-pink-300 bg-pink-50/50 dark:bg-pink-950/20",
                  config.gender === 'male' && "border-blue-300 bg-blue-50/50 dark:bg-blue-950/20",
                  !config.gender && "border-border"
                )}
              >
                {/* Header with tent number and remove button */}
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-sm">אוהל {index + 1}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-muted-foreground hover:text-destructive"
                    onClick={() => removeConfig(config.id)}
                    disabled={disabled}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
                
                {/* Beds selector */}
                <div className="mb-2">
                  <ToggleGroup 
                    type="single" 
                    value={config.bedsPlanned.toString()}
                    onValueChange={(v) => v && updateConfigBeds(config.id, parseInt(v))}
                    disabled={disabled}
                    className="justify-start"
                  >
                    {[1, 2, 3].map(n => (
                      <ToggleGroupItem 
                        key={n} 
                        value={n.toString()}
                        size="sm"
                        className="h-8 w-8 text-sm md:h-7 md:w-7 md:text-xs"
                      >
                        {n}
                      </ToggleGroupItem>
                    ))}
                  </ToggleGroup>
                </div>

                {/* Extra bed toggle */}
                <div className="flex items-center gap-2 mb-2">
                  <Switch
                    id={`extra-${config.id}`}
                    checked={config.hasExtraBed || false}
                    onCheckedChange={(checked) => updateConfigExtraBed(config.id, checked)}
                    disabled={disabled}
                    className="scale-75"
                  />
                  <Label 
                    htmlFor={`extra-${config.id}`} 
                    className="text-xs text-muted-foreground cursor-pointer"
                  >
                    +מיטה
                  </Label>
                </div>
                
                {/* Gender selector */}
                <Select 
                  value={config.gender || "_none"} 
                  onValueChange={(v) => updateConfigGender(config.id, v === "_none" ? undefined : v as 'female' | 'male')}
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

                {/* Total beds display */}
                <div className="mt-2 text-center text-xs text-muted-foreground">
                  סה״כ: {config.bedsPlanned + (config.hasExtraBed ? 1 : 0)} מיטות
                </div>
              </div>
            ))}
          </div>
        )}
        
        {/* Add Config Button */}
        {vipTentConfigs.length < 10 && (
          <Button
            variant="outline"
            size="sm"
            onClick={addConfig}
            disabled={disabled}
            className="w-full sm:w-auto"
          >
            <Plus className="w-4 h-4 ml-1" />
            הוסף אוהל VIP
          </Button>
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
        {remainingToPlan <= 0 && staffCount > 0 && vipTentConfigs.length > 0 && (
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
