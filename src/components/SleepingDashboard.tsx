import React, { useState, useMemo } from 'react';
import { useSleepingData, SleepingRow } from '@/hooks/useSleepingData';
import { SleepingCalendar } from '@/components/SleepingCalendar';
import { SleepingDetailDrawer } from '@/components/SleepingDetailDrawer';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { format, isToday, startOfMonth } from 'date-fns';
import { he } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import {
  Moon,
  LogIn,
  LogOut,
  Users,
  MapPin,
  Tent,
  Calendar as CalendarIcon,
} from 'lucide-react';

const statusConfig = {
  sleeping: { label: 'ישן הלילה', icon: Moon, color: 'bg-blue-500', textColor: 'text-blue-700', bgLight: 'bg-blue-50 dark:bg-blue-950/30' },
  'check-in': { label: "צ'ק-אין", icon: LogIn, color: 'bg-green-500', textColor: 'text-green-700', bgLight: 'bg-green-50 dark:bg-green-950/30' },
  'check-out': { label: "צ'ק-אאוט", icon: LogOut, color: 'bg-orange-500', textColor: 'text-orange-700', bgLight: 'bg-orange-50 dark:bg-orange-950/30' },
};

interface SleepingDashboardProps {
  onNavigateToNeighborhoods?: () => void;
}

export const SleepingDashboard: React.FC<SleepingDashboardProps> = ({ onNavigateToNeighborhoods }) => {
  const { getRowsForDay, getMonthSleepingCounts } = useSleepingData();

  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [filters, setFilters] = useState({ sleeping: true, checkIn: true, checkOut: true });
  const [drawerRow, setDrawerRow] = useState<SleepingRow | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const dayStr = format(selectedDate, 'yyyy-MM-dd');
  const isViewingToday = isToday(selectedDate);

  // Get rows for the selected day
  const rows = useMemo(
    () => getRowsForDay(dayStr, filters),
    [getRowsForDay, dayStr, filters]
  );

  // Group rows by status
  const grouped = useMemo(() => {
    const sleeping: SleepingRow[] = [];
    const checkIn: SleepingRow[] = [];
    const checkOut: SleepingRow[] = [];

    rows.forEach(r => {
      if (r.statusForDay === 'sleeping') sleeping.push(r);
      else if (r.statusForDay === 'check-in') checkIn.push(r);
      else if (r.statusForDay === 'check-out') checkOut.push(r);
    });

    return { sleeping, checkIn, checkOut };
  }, [rows]);

  // Month counts for calendar
  const monthCounts = useMemo(
    () => getMonthSleepingCounts(startOfMonth(selectedDate)),
    [getMonthSleepingCounts, selectedDate]
  );

  const toggleFilter = (key: keyof typeof filters) => {
    setFilters(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const openDrawer = (row: SleepingRow) => {
    setDrawerRow(row);
    setDrawerOpen(true);
  };

  const renderRow = (row: SleepingRow) => {
    const config = row.statusForDay ? statusConfig[row.statusForDay] : null;
    return (
      <button
        key={row.id}
        onClick={() => openDrawer(row)}
        className="w-full text-right p-4 rounded-xl border bg-card hover:shadow-md transition-all flex items-center gap-4"
        dir="rtl"
      >
        {/* Resource badge */}
        <div className={cn(
          "w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-xs shrink-0",
          row.type === 'vip' ? 'bg-amber-500' : 'bg-primary'
        )}>
          {row.type === 'vip' ? 'VIP' : row.resourceLabel.replace('שכונה ', '')}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold truncate">{row.groupName}</span>
            {config && (
              <Badge variant="secondary" className={cn("text-xs", config.bgLight, config.textColor)}>
                {config.label}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5" />
              {row.resourceLabel}
            </span>
            <span className="flex items-center gap-1">
              <Users className="w-3.5 h-3.5" />
              {row.totalPax}
            </span>
            {row.boysCount != null && row.girlsCount != null && (
              <span className="text-xs">
                ב: {row.boysCount} | בנ: {row.girlsCount}
              </span>
            )}
          </div>
          <div className="text-xs text-muted-foreground mt-0.5">
            {row.startDate} → {row.endDate}
          </div>
        </div>
      </button>
    );
  };

  const renderSection = (
    title: string,
    items: SleepingRow[],
    statusKey: 'sleeping' | 'check-in' | 'check-out'
  ) => {
    const config = statusConfig[statusKey];
    const Icon = config.icon;
    if (items.length === 0) return null;

    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <div className={cn("p-1.5 rounded-lg", config.bgLight)}>
            <Icon className={cn("w-5 h-5", config.textColor)} />
          </div>
          <h3 className="font-semibold">{title}</h3>
          <Badge variant="outline">{items.length}</Badge>
        </div>
        <div className="space-y-2">
          {items.map(renderRow)}
        </div>
      </div>
    );
  };

  return (
    <section dir="rtl">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-primary/10 rounded-xl">
          <Moon className="w-8 h-8 text-primary" />
        </div>
        <div>
          <h2 className="text-2xl font-bold">שיבוצי לינה</h2>
          <p className="text-muted-foreground">
            {isViewingToday ? 'היום' : format(selectedDate, "EEEE, d MMMM yyyy", { locale: he })}
            {' — '}שכונות ו-VIP בלבד
          </p>
        </div>
        {onNavigateToNeighborhoods && (
          <Button
            variant="outline"
            size="sm"
            className="mr-auto"
            onClick={onNavigateToNeighborhoods}
          >
            <Tent className="w-4 h-4 ml-1" />
            שכונות
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Calendar */}
        <div className="lg:col-span-1">
          <SleepingCalendar
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
            monthCounts={monthCounts}
          />

          {/* Filters */}
          <div className="mt-4 rounded-xl border bg-card p-4 space-y-3">
            <h4 className="font-semibold text-sm mb-2">סינון</h4>
            <div className="flex items-center justify-between">
              <Label htmlFor="f-sleeping" className="text-sm cursor-pointer flex items-center gap-2">
                <Moon className="w-4 h-4 text-blue-500" />
                ישן הלילה
              </Label>
              <Switch id="f-sleeping" checked={filters.sleeping} onCheckedChange={() => toggleFilter('sleeping')} />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="f-checkin" className="text-sm cursor-pointer flex items-center gap-2">
                <LogIn className="w-4 h-4 text-green-500" />
                צ׳ק-אין
              </Label>
              <Switch id="f-checkin" checked={filters.checkIn} onCheckedChange={() => toggleFilter('checkIn')} />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="f-checkout" className="text-sm cursor-pointer flex items-center gap-2">
                <LogOut className="w-4 h-4 text-orange-500" />
                צ׳ק-אאוט
              </Label>
              <Switch id="f-checkout" checked={filters.checkOut} onCheckedChange={() => toggleFilter('checkOut')} />
            </div>
          </div>

          {/* Today button */}
          {!isViewingToday && (
            <Button
              variant="outline"
              className="w-full mt-3"
              onClick={() => setSelectedDate(new Date())}
            >
              <CalendarIcon className="w-4 h-4 ml-2" />
              חזרה להיום
            </Button>
          )}
        </div>

        {/* Right: Lists */}
        <div className="lg:col-span-2 space-y-6">
          {rows.length === 0 ? (
            <div className="rounded-xl border bg-card p-12 text-center text-muted-foreground">
              <Moon className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="text-lg font-medium">אין שיבוצי לינה ליום זה</p>
              <p className="text-sm mt-1">בחר תאריך אחר בלוח השנה</p>
            </div>
          ) : (
            <>
              {renderSection("צ'ק-אין", grouped.checkIn, 'check-in')}
              {renderSection('ישנים הלילה', grouped.sleeping, 'sleeping')}
              {renderSection("צ'ק-אאוט", grouped.checkOut, 'check-out')}
            </>
          )}
        </div>
      </div>

      {/* Detail Drawer */}
      <SleepingDetailDrawer
        row={drawerRow}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
      />
    </section>
  );
};
