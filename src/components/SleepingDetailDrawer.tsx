import React from 'react';
import { SleepingRow } from '@/hooks/useSleepingData';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Calendar, Users, MapPin } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { he } from 'date-fns/locale';

interface SleepingDetailDrawerProps {
  row: SleepingRow | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const statusLabel: Record<string, string> = {
  sleeping: 'ישן הלילה',
  'check-in': "צ'ק-אין",
  'check-out': "צ'ק-אאוט",
};

const statusColor: Record<string, string> = {
  sleeping: 'bg-blue-500',
  'check-in': 'bg-green-500',
  'check-out': 'bg-orange-500',
};

export const SleepingDetailDrawer: React.FC<SleepingDetailDrawerProps> = ({ row, open, onOpenChange }) => {
  if (!row) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="text-right">{row.groupName}</SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-6" dir="rtl">
          {/* Status */}
          {row.statusForDay && (
            <Badge className={`${statusColor[row.statusForDay]} text-white`}>
              {statusLabel[row.statusForDay]}
            </Badge>
          )}

          {/* Resource */}
          <div className="flex items-center gap-3">
            <MapPin className="w-5 h-5 text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground">מיקום</p>
              <p className="font-semibold">{row.resourceLabel}</p>
            </div>
          </div>

          {/* Dates */}
          <div className="flex items-center gap-3">
            <Calendar className="w-5 h-5 text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground">תאריכים</p>
              <p className="font-semibold">
                {format(parseISO(row.startDate), 'd MMM', { locale: he })} → {format(parseISO(row.endDate), 'd MMM', { locale: he })}
              </p>
            </div>
          </div>

          {/* Pax */}
          <div className="flex items-center gap-3">
            <Users className="w-5 h-5 text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground">
                {row.type === 'vip' ? 'צוות VIP' : 'סה"כ אנשים'}
              </p>
              <p className="font-semibold">{row.totalPax}</p>
            </div>
          </div>

          {/* Boys/Girls if available */}
          {(row.boysCount != null || row.girlsCount != null) && (
            <div className="flex gap-4 p-3 rounded-lg bg-muted/50">
              {row.boysCount != null && (
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-gender-male" />
                  <span>גברים: {row.boysCount}</span>
                </div>
              )}
              {row.girlsCount != null && (
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-gender-female" />
                  <span>נשים: {row.girlsCount}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};
