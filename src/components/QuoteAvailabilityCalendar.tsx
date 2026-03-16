import React, { useMemo, useState } from 'react';
import {
  format, startOfMonth, endOfMonth, eachDayOfInterval,
  startOfWeek, endOfWeek, addMonths, subMonths, isSameMonth, isToday as isTodayFn,
} from 'date-fns';
import { he } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ChevronLeft, ChevronRight, Moon, Sun } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCalendarCapacity, DayCapacity } from '@/hooks/useCalendarCapacity';
import { useAdminGroups } from '@/hooks/useAdminGroups';
import { useGroupStays } from '@/hooks/useGroupStays';

const DAY_NAMES = ['א׳', 'ב׳', 'ג׳', 'ד׳', 'ה׳', 'ו׳', 'ש׳'];

type ViewMode = 'sleeping' | 'activity';

interface Props {
  /** Highlighted date range from the quote form */
  highlightStart?: string; // YYYY-MM-DD
  highlightEnd?: string;
}

// ---- Load level helpers ----

function sleepingLevel(cap: DayCapacity): 'available' | 'moderate' | 'almostFull' | 'full' {
  const totalOccupied = cap.participantsSleeping + cap.vipSleeping;
  const totalCap = cap.participantsCapacity + cap.vipCapacity;
  if (totalCap === 0) return 'available';
  const pct = totalOccupied / totalCap;
  if (cap.participantsOverCapacity || cap.vipOverCapacity || pct >= 1) return 'full';
  if (pct >= 0.8) return 'almostFull';
  if (pct >= 0.5) return 'moderate';
  return 'available';
}

const LEVEL_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  available: { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-700 dark:text-green-400', label: 'פנוי' },
  moderate: { bg: 'bg-yellow-100 dark:bg-yellow-900/30', text: 'text-yellow-700 dark:text-yellow-400', label: 'בינוני' },
  almostFull: { bg: 'bg-orange-100 dark:bg-orange-900/30', text: 'text-orange-700 dark:text-orange-400', label: 'כמעט מלא' },
  full: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-400', label: 'מלא' },
};

const ACTIVITY_LEVEL_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  none: { bg: '', text: 'text-muted-foreground', label: '' },
  light: { bg: 'bg-blue-50 dark:bg-blue-900/20', text: 'text-blue-700 dark:text-blue-400', label: 'קל' },
  moderate: { bg: 'bg-yellow-100 dark:bg-yellow-900/30', text: 'text-yellow-700 dark:text-yellow-400', label: 'בינוני' },
  heavy: { bg: 'bg-orange-100 dark:bg-orange-900/30', text: 'text-orange-700 dark:text-orange-400', label: 'עמוס' },
};

function activityLevel(groupCount: number, totalPax: number): 'none' | 'light' | 'moderate' | 'heavy' {
  if (groupCount === 0) return 'none';
  if (groupCount <= 1 && totalPax <= 50) return 'light';
  if (groupCount <= 2 && totalPax <= 150) return 'moderate';
  return 'heavy';
}

export const QuoteAvailabilityCalendar: React.FC<Props> = ({ highlightStart, highlightEnd }) => {
  const [viewMonth, setViewMonth] = useState<Date>(() => {
    if (highlightStart) {
      try { return startOfMonth(new Date(highlightStart)); } catch {}
    }
    return startOfMonth(new Date());
  });
  const [mode, setMode] = useState<ViewMode>('sleeping');

  const { getCapacityForDate } = useCalendarCapacity();
  const { groups } = useAdminGroups();
  const { allGroupStays } = useGroupStays();

  // Day-use groups aggregated per day for the visible month
  const dayActivityData = useMemo(() => {
    const monthStart = startOfMonth(viewMonth);
    const monthEnd = endOfMonth(viewMonth);
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
    const map = new Map<string, { groupCount: number; totalPax: number; groupNames: string[] }>();

    const dayGroups = groups.filter(g => g.groupType === 'יום ללא לינה' && !g.isArchived);

    for (const d of days) {
      const dayStr = format(d, 'yyyy-MM-dd');
      let groupCount = 0;
      let totalPax = 0;
      const groupNames: string[] = [];

      for (const g of dayGroups) {
        // Day-use: startDate <= day < endDate (usually same day)
        if (g.startDate <= dayStr && dayStr <= g.endDate) {
          groupCount++;
          totalPax += g.pax || 0;
          groupNames.push(g.groupName);
        }
      }

      if (groupCount > 0) {
        map.set(dayStr, { groupCount, totalPax, groupNames });
      }
    }
    return map;
  }, [viewMonth, groups]);

  // Sleeping groups count per day
  const sleepingGroupCounts = useMemo(() => {
    const monthStart = startOfMonth(viewMonth);
    const monthEnd = endOfMonth(viewMonth);
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
    const map = new Map<string, number>();

    for (const d of days) {
      const dayStr = format(d, 'yyyy-MM-dd');
      let count = 0;
      for (const stay of allGroupStays) {
        if (stay.startDate <= dayStr && dayStr < stay.endDate) count++;
      }
      if (count > 0) map.set(dayStr, count);
    }
    return map;
  }, [viewMonth, allGroupStays]);

  const calendarDays = useMemo(() => {
    const ms = startOfMonth(viewMonth);
    const me = endOfMonth(viewMonth);
    return eachDayOfInterval({
      start: startOfWeek(ms, { weekStartsOn: 0 }),
      end: endOfWeek(me, { weekStartsOn: 0 }),
    });
  }, [viewMonth]);

  const isHighlighted = (dayStr: string) => {
    if (!highlightStart || !highlightEnd) return false;
    return dayStr >= highlightStart && dayStr < highlightEnd;
  };

  return (
    <Card className="rounded-2xl shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <CardTitle className="text-lg flex items-center gap-2">
            📅 בדיקת זמינות
          </CardTitle>
          <div className="flex items-center gap-2">
            <Label htmlFor="cal-mode" className="text-sm cursor-pointer flex items-center gap-1.5">
              <Moon className="w-3.5 h-3.5" />
              לינה
            </Label>
            <Switch
              id="cal-mode"
              checked={mode === 'activity'}
              onCheckedChange={(c) => setMode(c ? 'activity' : 'sleeping')}
            />
            <Label htmlFor="cal-mode" className="text-sm cursor-pointer flex items-center gap-1.5">
              פעילות יומית
              <Sun className="w-3.5 h-3.5" />
            </Label>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Month nav */}
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="icon" onClick={() => setViewMonth(subMonths(viewMonth, 1))}>
            <ChevronRight className="w-4 h-4" />
          </Button>
          <span className="font-semibold text-base">
            {format(viewMonth, 'MMMM yyyy', { locale: he })}
          </span>
          <Button variant="ghost" size="icon" onClick={() => setViewMonth(addMonths(viewMonth, 1))}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-7">
          {DAY_NAMES.map(d => (
            <div key={d} className="text-center text-xs text-muted-foreground font-medium py-1">{d}</div>
          ))}
        </div>

        {/* Grid */}
        <div className="grid grid-cols-7 gap-0.5">
          {calendarDays.map(day => {
            const dayStr = format(day, 'yyyy-MM-dd');
            const inMonth = isSameMonth(day, viewMonth);
            const isToday = isTodayFn(day);
            const highlighted = isHighlighted(dayStr);

            if (mode === 'sleeping') {
              const cap = getCapacityForDate(day);
              const level = sleepingLevel(cap);
              const style = LEVEL_STYLES[level];
              const groupCount = sleepingGroupCounts.get(dayStr) || 0;

              return (
                <Popover key={dayStr}>
                  <PopoverTrigger asChild>
                    <button
                      className={cn(
                        'relative flex flex-col items-center p-1 rounded-lg text-xs transition-all min-h-[52px] justify-start border',
                        !inMonth && 'opacity-25',
                        inMonth && style.bg,
                        isToday && 'ring-2 ring-primary',
                        highlighted && 'ring-2 ring-blue-500 ring-offset-1',
                        'hover:shadow-sm cursor-pointer border-transparent hover:border-border',
                      )}
                    >
                      <span className={cn('font-medium', isToday && 'font-bold')}>{day.getDate()}</span>
                      {inMonth && (
                        <>
                          <span className={cn('text-[10px] font-semibold mt-0.5', style.text)}>
                            {cap.participantsSleeping + cap.vipSleeping}/{cap.participantsCapacity + cap.vipCapacity}
                          </span>
                          {groupCount > 0 && (
                            <span className="text-[9px] text-muted-foreground">{groupCount} קב׳</span>
                          )}
                        </>
                      )}
                    </button>
                  </PopoverTrigger>
                  {inMonth && (
                    <PopoverContent className="w-56 text-sm" side="bottom">
                      <div className="space-y-2">
                        <p className="font-semibold">{format(day, 'EEEE, d MMMM', { locale: he })}</p>
                        <Badge className={cn(style.bg, style.text, 'text-xs')}>{style.label}</Badge>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs mt-2">
                          <span className="text-muted-foreground">משתתפים:</span>
                          <span>{cap.participantsSleeping}/{cap.participantsCapacity}</span>
                          <span className="text-muted-foreground">VIP:</span>
                          <span>{cap.vipSleeping}/{cap.vipCapacity}</span>
                          <span className="text-muted-foreground">פנוי משתתפים:</span>
                          <span className={cap.participantsOverCapacity ? 'text-destructive font-bold' : ''}>
                            {cap.participantsFree}{cap.participantsOverCapacity && ' ⚠️'}
                          </span>
                          <span className="text-muted-foreground">פנוי VIP:</span>
                          <span className={cap.vipOverCapacity ? 'text-destructive font-bold' : ''}>
                            {cap.vipFree}{cap.vipOverCapacity && ' ⚠️'}
                          </span>
                          <span className="text-muted-foreground">קבוצות לנות:</span>
                          <span>{groupCount}</span>
                        </div>
                      </div>
                    </PopoverContent>
                  )}
                </Popover>
              );
            }

            // Activity mode
            const actData = dayActivityData.get(dayStr);
            const gCount = actData?.groupCount || 0;
            const tPax = actData?.totalPax || 0;
            const aLevel = activityLevel(gCount, tPax);
            const aStyle = ACTIVITY_LEVEL_STYLES[aLevel];

            return (
              <Popover key={dayStr}>
                <PopoverTrigger asChild>
                  <button
                    className={cn(
                      'relative flex flex-col items-center p-1 rounded-lg text-xs transition-all min-h-[52px] justify-start border',
                      !inMonth && 'opacity-25',
                      inMonth && aLevel !== 'none' && aStyle.bg,
                      isToday && 'ring-2 ring-primary',
                      highlighted && 'ring-2 ring-blue-500 ring-offset-1',
                      'hover:shadow-sm cursor-pointer border-transparent hover:border-border',
                    )}
                  >
                    <span className={cn('font-medium', isToday && 'font-bold')}>{day.getDate()}</span>
                    {inMonth && gCount > 0 && (
                      <>
                        <span className={cn('text-[10px] font-semibold mt-0.5', aStyle.text)}>
                          {tPax} איש
                        </span>
                        <span className="text-[9px] text-muted-foreground">{gCount} קב׳</span>
                      </>
                    )}
                  </button>
                </PopoverTrigger>
                {inMonth && gCount > 0 && (
                  <PopoverContent className="w-56 text-sm" side="bottom">
                    <div className="space-y-2">
                      <p className="font-semibold">{format(day, 'EEEE, d MMMM', { locale: he })}</p>
                      <Badge className={cn(aStyle.bg, aStyle.text, 'text-xs')}>{aStyle.label}</Badge>
                      <div className="text-xs space-y-1 mt-2">
                        <p><span className="text-muted-foreground">קבוצות יום:</span> {gCount}</p>
                        <p><span className="text-muted-foreground">סה״כ משתתפים:</span> {tPax}</p>
                        {actData?.groupNames && actData.groupNames.length > 0 && (
                          <div className="mt-1 pt-1 border-t">
                            <p className="text-muted-foreground mb-0.5">קבוצות:</p>
                            {actData.groupNames.map((n, i) => (
                              <p key={i} className="truncate">• {n}</p>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </PopoverContent>
                )}
              </Popover>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-3 pt-2 border-t text-[10px] text-muted-foreground">
          {mode === 'sleeping' ? (
            <>
              {Object.entries(LEVEL_STYLES).map(([key, s]) => (
                <div key={key} className="flex items-center gap-1">
                  <span className={cn('w-3 h-3 rounded-sm', s.bg, 'border')} />
                  <span>{s.label}</span>
                </div>
              ))}
              {highlightStart && (
                <div className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded-sm ring-2 ring-blue-500 border" />
                  <span>תאריכי הצעה</span>
                </div>
              )}
            </>
          ) : (
            <>
              {Object.entries(ACTIVITY_LEVEL_STYLES).filter(([k]) => k !== 'none').map(([key, s]) => (
                <div key={key} className="flex items-center gap-1">
                  <span className={cn('w-3 h-3 rounded-sm', s.bg, 'border')} />
                  <span>{s.label}</span>
                </div>
              ))}
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
