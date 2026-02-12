import React from 'react';
import { GroupStay } from '@/types/groupStay';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Calendar, Users, MapPin, Crown } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { he } from 'date-fns/locale';

interface GroupStayDetailDrawerProps {
  stay: GroupStay | null;
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

export const GroupStayDetailDrawer: React.FC<GroupStayDetailDrawerProps> = ({ stay, open, onOpenChange }) => {
  if (!stay) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="text-right">{stay.groupName}</SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-6" dir="rtl">
          {/* Status */}
          {stay.statusForDay && (
            <Badge className={`${statusColor[stay.statusForDay]} text-white`}>
              {statusLabel[stay.statusForDay]}
            </Badge>
          )}

          {/* Dates */}
          <div className="flex items-center gap-3">
            <Calendar className="w-5 h-5 text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground">תאריכים</p>
              <p className="font-semibold">
                {format(parseISO(stay.startDate), 'd MMM', { locale: he })} → {format(parseISO(stay.endDate), 'd MMM', { locale: he })}
              </p>
            </div>
          </div>

          {/* Participants */}
          <div className="flex items-center gap-3">
            <Users className="w-5 h-5 text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground">חניכים</p>
              <p className="font-semibold">{stay.participantsTotal}</p>
            </div>
          </div>

          {/* Boys/Girls */}
          {(stay.boysCount != null || stay.girlsCount != null) && (
            <div className="flex gap-4 p-3 rounded-lg bg-muted/50">
              {stay.boysCount != null && (
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full" style={{ backgroundColor: 'hsl(210, 60%, 70%)' }} />
                  <span>בנים: {stay.boysCount}</span>
                </div>
              )}
              {stay.girlsCount != null && (
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full" style={{ backgroundColor: 'hsl(330, 60%, 70%)' }} />
                  <span>בנות: {stay.girlsCount}</span>
                </div>
              )}
            </div>
          )}

          {/* VIP Staff */}
          {(stay.staffCount > 0 || stay.staffTotal > 0) && (
            <div className="flex items-center gap-3">
              <Crown className="w-5 h-5 text-amber-500" />
              <div>
                <p className="text-sm text-muted-foreground">צוות (VIP)</p>
                {stay.vipTentCount > 0 ? (
                  <>
                    <p className="font-semibold">{stay.staffCount || stay.staffTotal} אנשים · {stay.vipTentCount} אוהלים</p>
                    <p className="text-sm text-muted-foreground">
                      אוהלים: {stay.vipTents.map(t => t.tentNumber).join(', ')}
                    </p>
                  </>
                ) : (
                  <p className="font-semibold text-amber-600">{stay.staffCount} אנשים · VIP: לא שובץ</p>
                )}
              </div>
            </div>
          )}

          {/* Neighborhoods */}
          {stay.neighborhoods.length > 0 && (
            <div className="flex items-center gap-3">
              <MapPin className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">שכונות</p>
                <p className="font-semibold">
                  {stay.neighborhoods.map(n => n.neighborhoodName).join(', ')}
                </p>
              </div>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};
