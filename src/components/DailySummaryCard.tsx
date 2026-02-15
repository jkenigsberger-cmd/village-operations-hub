import React, { useMemo } from 'react';
import { useAdminGroups } from '@/hooks/useAdminGroups';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Moon, Sun, LogIn, LogOut, Briefcase } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

interface DailySummaryCardProps {
  selectedDate: Date;
}

export const DailySummaryCard: React.FC<DailySummaryCardProps> = ({ selectedDate }) => {
  const { groups } = useAdminGroups();
  const dayStr = format(selectedDate, 'yyyy-MM-dd');

  const summary = useMemo(() => {
    const activeGroups = groups.filter(
      g => g.startDate <= dayStr && g.endDate > dayStr
    );
    const sleepingGroups = activeGroups.filter(g => g.groupType === 'לינה');
    const dayOnlyGroups = groups.filter(
      g => g.startDate === dayStr && g.endDate === dayStr
    );
    const allToday = [...activeGroups, ...dayOnlyGroups.filter(d => !activeGroups.some(a => a.id === d.id))];

    const checkIns = groups.filter(g => g.startDate === dayStr);
    const checkOuts = groups.filter(g => g.endDate === dayStr);

    const totalPeople = allToday.reduce((sum, g) => sum + (g.pax || 0), 0);
    const sleepingPeople = sleepingGroups.reduce((sum, g) => sum + (g.pax || 0), 0);
    const dayOnlyPeople = dayOnlyGroups.reduce((sum, g) => sum + (g.pax || 0), 0);

    return {
      totalGroups: allToday.length,
      sleepingGroupCount: sleepingGroups.length,
      dayOnlyGroupCount: dayOnlyGroups.length,
      totalPeople,
      sleepingPeople,
      dayOnlyPeople,
      checkInCount: checkIns.length,
      checkOutCount: checkOuts.length,
    };
  }, [groups, dayStr]);

  const StatRow = ({ icon: Icon, label, value, className }: { icon: React.ElementType; label: string; value: number; className?: string }) => (
    <div className="flex items-center justify-between py-1">
      <span className="flex items-center gap-2 text-sm text-muted-foreground">
        <Icon className={`w-4 h-4 ${className || ''}`} />
        {label}
      </span>
      <span className="font-semibold text-sm">{value}</span>
    </div>
  );

  return (
    <Card className="h-full" dir="rtl">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Briefcase className="w-5 h-5 text-primary" />
          סיכום יומי
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          {format(selectedDate, "EEEE, d MMMM yyyy", { locale: he })}
        </p>
      </CardHeader>
      <CardContent className="space-y-1">
        {/* Groups */}
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">קבוצות</p>
        <StatRow icon={Users} label="קבוצות היום" value={summary.totalGroups} />
        <StatRow icon={Moon} label="קבוצות לינה" value={summary.sleepingGroupCount} className="text-blue-500" />
        <StatRow icon={Sun} label="קבוצות יום בלבד" value={summary.dayOnlyGroupCount} className="text-amber-500" />

        <Separator className="my-2" />

        {/* People */}
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">אנשים</p>
        <StatRow icon={Users} label="סה״כ אנשים במתחם" value={summary.totalPeople} />
        <StatRow icon={Moon} label="לנים הלילה" value={summary.sleepingPeople} className="text-blue-500" />
        <StatRow icon={Sun} label="פעילות יומית בלבד" value={summary.dayOnlyPeople} className="text-amber-500" />

        <Separator className="my-2" />

        {/* Movements */}
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">תנועות</p>
        <StatRow icon={LogIn} label="CHECK IN היום" value={summary.checkInCount} className="text-green-500" />
        <StatRow icon={LogOut} label="CHECK OUT היום" value={summary.checkOutCount} className="text-orange-500" />
      </CardContent>
    </Card>
  );
};
