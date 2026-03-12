import React, { useState, useMemo } from 'react';
import { DistributionPreference, TentGender, validateDistribution } from '@/types/distributionPreference';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Tent, CheckCircle2, AlertTriangle, Info, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DistributionRequirementsPanelProps {
  preference: DistributionPreference | null;
  participantCount: number;
  boysCount?: number;
  girlsCount?: number;
}

const GENDER_LABELS: Record<TentGender, string> = {
  BOYS: 'גברים',
  GIRLS: 'נשים',
  MIXED: 'מעורב',
};

interface GroupedRequirement {
  pax: number;
  count: number;
  gender?: TentGender;
}

// Group tents by pax count for summary display (without gender)
const groupTentsByPax = (tents: { index: number; pax: number; gender?: TentGender }[]): GroupedRequirement[] => {
  const groups: Record<number, number> = {};
  tents.forEach(tent => {
    groups[tent.pax] = (groups[tent.pax] || 0) + 1;
  });
  return Object.entries(groups)
    .map(([pax, count]) => ({ pax: Number(pax), count: Number(count) }))
    .sort((a, b) => b.count - a.count);
};

// Group tents by pax+gender for gender breakdown
const groupTentsByPaxAndGender = (tents: { index: number; pax: number; gender?: TentGender }[]): GroupedRequirement[] => {
  const key = (pax: number, gender?: TentGender) => `${pax}_${gender || 'NONE'}`;
  const groups: Record<string, { pax: number; count: number; gender?: TentGender }> = {};
  tents.forEach(tent => {
    const k = key(tent.pax, tent.gender);
    if (!groups[k]) groups[k] = { pax: tent.pax, count: 0, gender: tent.gender };
    groups[k].count++;
  });
  return Object.values(groups).sort((a, b) => {
    if (a.gender && b.gender) return a.gender.localeCompare(b.gender);
    if (a.gender) return -1;
    return b.count - a.count;
  });
};

export const DistributionRequirementsPanel: React.FC<DistributionRequirementsPanelProps> = ({
  preference,
  participantCount,
  boysCount,
  girlsCount,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const groupedRequirements = useMemo(() => {
    if (!preference?.tents || preference.tents.length === 0) return [];
    return groupTentsByPax(preference.tents);
  }, [preference?.tents]);

  const hasGenderInfo = !!(boysCount || girlsCount || preference?.tents?.some(t => t.gender));
  const hasGenderTags = preference?.tents?.some(t => t.gender && t.gender !== 'MIXED');

  const genderGrouped = useMemo(() => {
    if (!hasGenderTags || !preference?.tents) return [];
    return groupTentsByPaxAndGender(preference.tents.filter(t => t.gender));
  }, [hasGenderTags, preference?.tents]);

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

        {/* A) Aggregate requirements WITHOUT gender */}
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

        {/* B) Gender breakdown section */}
        {hasGenderInfo && (
          <div className="p-3 bg-muted/30 rounded-lg space-y-2">
            <h5 className="text-sm font-medium">פירוט מגדרי:</h5>
            <div className="flex gap-4 text-sm">
              {boysCount !== undefined && boysCount > 0 && (
                <span>גברים: <strong>{boysCount}</strong></span>
              )}
              {girlsCount !== undefined && girlsCount > 0 && (
                <span>נשים: <strong>{girlsCount}</strong></span>
              )}
            </div>
            {hasGenderTags && genderGrouped.length > 0 && (
              <div className="space-y-1 pt-1 border-t border-border/50">
                {genderGrouped.map((req, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-sm">
                    <span className="text-muted-foreground">•</span>
                    {req.gender && <Badge variant="outline" className="text-xs py-0">{GENDER_LABELS[req.gender]}</Badge>}
                    <span>{req.count} אוהלים × {req.pax}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

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

        {/* C) Expandable Details with gender tags */}
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
                    {tent.gender && tent.gender !== 'MIXED' && (
                      <span className="text-muted-foreground"> ({GENDER_LABELS[tent.gender]})</span>
                    )}
                  </Badge>
                ))}
              </div>
            </CollapsibleContent>
          </Collapsible>
        )}

        {/* D) Info Notice */}
        <div className="flex items-start gap-2 text-xs text-muted-foreground pt-1 border-t border-border/50">
          <Info className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
          <span>
            מידע תכנוני בלבד – השיבוץ בפועל מתבצע בבחירת שכונות/אוהלים.
          </span>
        </div>
      </CardContent>
    </Card>
  );
};
