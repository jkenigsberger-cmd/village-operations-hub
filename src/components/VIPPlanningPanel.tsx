import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Users, Tent, UserCheck, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { GroupRecord } from '@/types/adminGroups';
import { cn } from '@/lib/utils';

interface VIPPlanningPanelProps {
  groups: GroupRecord[];
  selectedGroupId: string | null;
  onGroupSelect: (groupId: string | null) => void;
}

export const VIPPlanningPanel: React.FC<VIPPlanningPanelProps> = ({
  groups,
  selectedGroupId,
  onGroupSelect,
}) => {
  // Filter to only groups with staff (VIP needs)
  const vipGroups = useMemo(() => 
    groups.filter(g => (g.staffCount || 0) > 0 && g.groupType === 'לינה'),
    [groups]
  );

  const selectedGroup = useMemo(() => 
    vipGroups.find(g => g.id === selectedGroupId) || (vipGroups.length === 1 ? vipGroups[0] : null),
    [vipGroups, selectedGroupId]
  );

  // Calculate VIP plan stats from vipTentConfigs
  const vipStats = useMemo(() => {
    if (!selectedGroup) return null;

    const staffTotal = selectedGroup.staffCount || 0;
    const remainingStaff = selectedGroup.remainingStaff ?? staffTotal;
    const vipConfigs = selectedGroup.vipTentConfigs || [];
    
    // Total planned beds from configs
    const plannedBeds = vipConfigs.reduce(
      (sum, c) => sum + c.bedsPlanned + (c.hasExtraBed ? 1 : 0), 
      0
    );
    
    // Recommended tents = number of configs
    const recommendedTents = vipConfigs.length;
    
    // Default beds per tent (from group or 3)
    const bedsPerTentDefault = selectedGroup.vipPeoplePerTent || 3;
    
    // Derived: tents needed based on remaining
    const tentsNeededByRemaining = remainingStaff > 0 
      ? Math.ceil(remainingStaff / bedsPerTentDefault) 
      : 0;
    
    // Already assigned configs
    const assignedConfigs = vipConfigs.filter(c => c.assignedTentCode);
    const assignedBeds = assignedConfigs.reduce(
      (sum, c) => sum + c.bedsPlanned + (c.hasExtraBed ? 1 : 0), 
      0
    );

    // Gender summary
    const genderCounts = {
      male: vipConfigs.filter(c => c.gender === 'male').length,
      female: vipConfigs.filter(c => c.gender === 'female').length,
      unset: vipConfigs.filter(c => !c.gender).length,
    };

    return {
      staffTotal,
      remainingStaff,
      plannedBeds,
      recommendedTents,
      bedsPerTentDefault,
      tentsNeededByRemaining,
      assignedTents: assignedConfigs.length,
      assignedBeds,
      genderCounts,
    };
  }, [selectedGroup]);

  if (vipGroups.length === 0) {
    return (
      <Card className="mb-6 border-muted">
        <CardContent className="py-6 text-center text-muted-foreground">
          <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">אין קבוצות עם צוות (VIP) בטווח התאריכים הנוכחי</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mb-6 border-primary/30 bg-primary/5">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <Tent className="w-5 h-5" />
            תכנון VIP - צוות
          </div>
          
          {/* Group selector if multiple groups */}
          {vipGroups.length > 1 && (
            <Select 
              value={selectedGroupId || selectedGroup?.id || "_none"} 
              onValueChange={(v) => onGroupSelect(v === "_none" ? null : v)}
            >
              <SelectTrigger className="w-[280px] h-9">
                <SelectValue placeholder="בחר קבוצה" />
              </SelectTrigger>
              <SelectContent>
                {vipGroups.map(g => {
                  const startFormatted = g.startDate.slice(5).replace('-', '/');
                  const endFormatted = g.endDate.slice(5).replace('-', '/');
                  return (
                  <SelectItem key={g.id} value={g.id}>
                    {g.groupName} ({startFormatted}–{endFormatted}) • צוות: {g.staffCount}
                  </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          )}
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        {selectedGroup && vipStats ? (
          <div className="space-y-4">
            {/* Group Name with Dates */}
            <div className="flex items-center gap-2 text-lg font-semibold flex-wrap">
              <UserCheck className="w-5 h-5 text-primary" />
              <span>קבוצת צוות (VIP):</span>
              <span className="text-primary">{selectedGroup.groupName}</span>
              <span className="text-muted-foreground text-sm font-normal">
                ({selectedGroup.startDate.slice(5).replace('-', '/')} - {selectedGroup.endDate.slice(5).replace('-', '/')})
              </span>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {/* Staff Total */}
              <div className="p-3 bg-background rounded-lg border">
                <div className="text-xs text-muted-foreground mb-1">צוות סה״כ</div>
                <div className="text-2xl font-bold">{vipStats.staffTotal}</div>
              </div>
              
              {/* Remaining Staff */}
              <div className={cn(
                "p-3 rounded-lg border",
                vipStats.remainingStaff > 0 
                  ? "bg-amber-50 dark:bg-amber-950/20 border-amber-200" 
                  : "bg-green-50 dark:bg-green-950/20 border-green-200"
              )}>
                <div className="text-xs text-muted-foreground mb-1">צוות נשאר לשיבוץ</div>
                <div className="text-2xl font-bold">{vipStats.remainingStaff}</div>
              </div>
              
              {/* Recommended Tents */}
              <div className="p-3 bg-background rounded-lg border">
                <div className="text-xs text-muted-foreground mb-1">אוהלי VIP מתוכננים</div>
                <div className="text-2xl font-bold">{vipStats.recommendedTents}</div>
              </div>
              
              {/* Tents Needed */}
              <div className="p-3 bg-background rounded-lg border">
                <div className="text-xs text-muted-foreground mb-1">אוהלים נדרשים (לפי נשאר)</div>
                <div className="text-2xl font-bold">
                  {vipStats.tentsNeededByRemaining}
                </div>
                <div className="text-xs text-muted-foreground">
                  ({vipStats.bedsPerTentDefault} מיטות/אוהל)
                </div>
              </div>
            </div>

            {/* Progress info */}
            <div className="flex flex-wrap items-center gap-3 text-sm">
              <Badge variant="outline">
                שובצו: {vipStats.assignedTents} / {vipStats.recommendedTents} אוהלים
              </Badge>
              <Badge variant="outline">
                מיטות משובצות: {vipStats.assignedBeds} / {vipStats.plannedBeds}
              </Badge>
              
              {/* Gender summary */}
              {(vipStats.genderCounts.male > 0 || vipStats.genderCounts.female > 0) && (
                <Badge variant="secondary">
                  {vipStats.genderCounts.male > 0 && `♂️ ${vipStats.genderCounts.male}`}
                  {vipStats.genderCounts.male > 0 && vipStats.genderCounts.female > 0 && ' | '}
                  {vipStats.genderCounts.female > 0 && `♀️ ${vipStats.genderCounts.female}`}
                </Badge>
              )}
            </div>

            {/* Status message */}
            {vipStats.remainingStaff > 0 ? (
              <div className="flex items-center gap-2 p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg text-amber-800 dark:text-amber-200">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                <span className="text-sm">
                  נשאר {vipStats.remainingStaff} אנשי צוות לשיבוץ באוהלי VIP
                </span>
              </div>
            ) : vipStats.staffTotal > 0 ? (
              <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg text-green-800 dark:text-green-200">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                <span className="text-sm">
                  כל אנשי הצוות שובצו לאוהלי VIP ✓
                </span>
              </div>
            ) : null}
          </div>
        ) : (
          <div className="text-center text-muted-foreground py-4">
            בחר קבוצה לצפייה בתכנון VIP
          </div>
        )}
      </CardContent>
    </Card>
  );
};
