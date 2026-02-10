import React from 'react';
import { DistributionPreference, TentGender, validateDistribution } from '@/types/distributionPreference';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tent, CheckCircle2, AlertCircle, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

const GENDER_LABELS: Record<TentGender, string> = {
  BOYS: 'בנים',
  GIRLS: 'בנות',
  MIXED: 'מעורב',
};

interface DistributionPreferenceDisplayProps {
  preference: DistributionPreference | null;
  participantCount: number;
  boysCount?: number;
  girlsCount?: number;
}

export const DistributionPreferenceDisplay: React.FC<DistributionPreferenceDisplayProps> = ({
  preference,
  participantCount,
  boysCount,
  girlsCount,
}) => {
  if (!preference || preference.requestedSleepingTentCount === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-6 text-center">
          <Tent className="w-8 h-8 mx-auto mb-2 text-muted-foreground opacity-50" />
          <p className="text-sm text-muted-foreground">
            לא הוגדרה העדפת חלוקה לאוהלי לינה
          </p>
        </CardContent>
      </Card>
    );
  }

  const validation = validateDistribution(preference, participantCount);
  const hasGenderInfo = !!(boysCount || girlsCount || preference.tents?.some(t => t.gender));

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Tent className="w-5 h-5" />
          העדפת חלוקה לאוהלי לינה
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Info notice */}
        <div className="flex items-start gap-2 p-3 bg-muted/50 rounded-lg text-sm">
          <Info className="w-4 h-4 mt-0.5 text-muted-foreground flex-shrink-0" />
          <span className="text-muted-foreground">
            זו העדפה בלבד – לא שיבוץ בפועל. השתמש בהנחיה זו בעת ביצוע השיבוץ בפועל.
          </span>
        </div>

        {/* Summary stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 bg-muted/50 rounded-lg text-center">
            <div className="text-2xl font-bold text-primary">
              {preference.requestedSleepingTentCount}
            </div>
            <div className="text-sm text-muted-foreground">אוהלים מבוקשים</div>
          </div>
          <div className="p-3 bg-muted/50 rounded-lg text-center">
            <div className="text-2xl font-bold text-primary">
              {preference.preferredTentCapacity}
            </div>
            <div className="text-sm text-muted-foreground">קיבולת מועדפת</div>
          </div>
        </div>

        {/* Gender info */}
        {hasGenderInfo && (
          <div className="p-3 bg-muted/30 rounded-lg space-y-1">
            <h5 className="text-sm font-medium">פירוט מגדרי:</h5>
            <div className="flex gap-4 text-sm">
              {boysCount !== undefined && boysCount > 0 && <span>בנים: <strong>{boysCount}</strong></span>}
              {girlsCount !== undefined && girlsCount > 0 && <span>בנות: <strong>{girlsCount}</strong></span>}
            </div>
          </div>
        )}

        {/* Tent distribution chips */}
        {preference.tents && preference.tents.length > 0 && (
          <div className="space-y-2">
            <label className="text-sm font-medium">חלוקה לאוהלים:</label>
            <div className="flex flex-wrap gap-2">
              {preference.tents.map((tent) => {
                const isOverCapacity = tent.pax > preference.preferredTentCapacity;
                return (
                  <Badge 
                    key={tent.index} 
                    variant="outline"
                    className={cn(
                      "gap-1",
                      isOverCapacity && "border-amber-400 bg-amber-50 dark:bg-amber-950/20"
                    )}
                  >
                    {tent.index}: {tent.pax}
                    {tent.gender && tent.gender !== 'MIXED' && (
                      <span className="text-muted-foreground"> ({GENDER_LABELS[tent.gender]})</span>
                    )}
                  </Badge>
                );
              })}
            </div>
          </div>
        )}

        {/* Validation status */}
        <div className={cn(
          "p-3 rounded-lg border-2 flex items-center gap-3",
          validation.isValid 
            ? "border-green-400 bg-green-50 dark:bg-green-950/20" 
            : "border-amber-400 bg-amber-50 dark:bg-amber-950/20"
        )}>
          {validation.isValid ? (
            <CheckCircle2 className="w-5 h-5 text-green-600" />
          ) : (
            <AlertCircle className="w-5 h-5 text-amber-600" />
          )}
          <div>
            <span className="font-medium">
              סה״כ: {preference.totalPax}
            </span>
            <span className="mx-2">|</span>
            <span className="text-muted-foreground">
              חניכים: {participantCount}
            </span>
            {!validation.isValid && (
              <span className="mr-2 text-amber-600 font-medium">
                (הפרש: {validation.difference > 0 ? '+' : ''}{validation.difference})
              </span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
