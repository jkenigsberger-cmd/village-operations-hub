import React, { useState, useMemo } from 'react';
import { DistributionPreference, validateDistribution } from '@/types/distributionPreference';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Tent, CheckCircle2, AlertTriangle, Info, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DistributionRequirementsPanelProps {
  preference: DistributionPreference | null;
  participantCount: number;
}

interface GroupedRequirement {
  pax: number;
  count: number;
}

// Group tents by pax count for summary display
const groupTentsByPax = (tents: { index: number; pax: number }[]): GroupedRequirement[] => {
  const groups: Record<number, number> = {};
  tents.forEach(tent => {
    groups[tent.pax] = (groups[tent.pax] || 0) + 1;
  });
  return Object.entries(groups)
    .map(([pax, count]) => ({ pax: Number(pax), count: Number(count) }))
    .sort((a, b) => b.count - a.count);
};

export const DistributionRequirementsPanel: React.FC<DistributionRequirementsPanelProps> = ({
  preference,
  participantCount,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const groupedRequirements = useMemo(() => {
    if (!preference?.tents || preference.tents.length === 0) return [];
    return groupTentsByPax(preference.tents);
  }, [preference?.tents]);

  if (!preference || preference.requestedSleepingTentCount === 0) {
    return (
      <Card className="border-dashed border-muted-foreground/30 mb-4">
        <CardContent className="py-4 text-center">
          <Tent className="w-6 h-6 mx-auto mb-2 text-muted-foreground opacity-50" />
          <p className="text-sm text-muted-foreground">
            לא הוגדרה העדפת חלוקה לאוהלי לינה
          </p>
        </CardContent>
      </Card>
    );
  }

  const validation = validateDistribution(preference, participantCount);

  return (
    <Card className="mb-4 border-primary/20 bg-primary/5">
      <CardContent className="py-4 space-y-3">
        {/* Header */}
        <div className="flex items-center gap-2 text-primary">
          <Tent className="w-5 h-5" />
          <h4 className="font-semibold text-base">דרישות חלוקה מהזמנה</h4>
        </div>

        {/* Grouped Requirements */}
        <div className="space-y-1.5">
          {groupedRequirements.map((req, idx) => (
            <div key={idx} className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">•</span>
              <span className="font-medium">{req.count} אוהלים</span>
              <span className="text-muted-foreground">×</span>
              <span className="font-medium">{req.pax} אנשים</span>
            </div>
          ))}
        </div>

        {/* Validation Status */}
        <div className={cn(
          "flex items-center gap-2 px-3 py-2 rounded-lg text-sm",
          validation.isValid 
            ? "bg-green-100 dark:bg-green-950/30 text-green-700 dark:text-green-300" 
            : "bg-amber-100 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300"
        )}>
          {validation.isValid ? (
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          )}
          <span>
            סה״כ: <strong>{preference.totalPax}</strong>
            <span className="mx-2">|</span>
            חניכים: <strong>{participantCount}</strong>
          </span>
          {!validation.isValid && (
            <span className="mr-auto font-medium">
              ⚠️ הסכום לא תואם למספר החניכים
            </span>
          )}
        </div>

        {/* Expandable Details */}
        {preference.tents && preference.tents.length > 0 && (
          <Collapsible open={isOpen} onOpenChange={setIsOpen}>
            <CollapsibleTrigger className="flex items-center gap-1 text-sm text-primary hover:underline cursor-pointer">
              {isOpen ? (
                <>
                  <ChevronUp className="w-4 h-4" />
                  הסתר פירוט
                </>
              ) : (
                <>
                  <ChevronDown className="w-4 h-4" />
                  הצג פירוט
                </>
              )}
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-2">
              <div className="flex flex-wrap gap-1.5 p-2 bg-muted/50 rounded-lg">
                {preference.tents.map((tent) => (
                  <Badge 
                    key={tent.index} 
                    variant="outline"
                    className="text-xs gap-0.5"
                  >
                    {tent.index}:{tent.pax}
                  </Badge>
                ))}
              </div>
            </CollapsibleContent>
          </Collapsible>
        )}

        {/* Info Notice */}
        <div className="flex items-start gap-2 text-xs text-muted-foreground pt-1 border-t border-border/50">
          <Info className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
          <span>
            זהו מידע תכנוני בלבד. השיבוץ בפועל מתבצע בבחירת שכונות/אוהלים בהמשך.
          </span>
        </div>
      </CardContent>
    </Card>
  );
};
