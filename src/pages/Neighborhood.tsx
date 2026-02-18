import React, { useState, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useVillage } from '@/context/VillageContext';
import { useAdminGroups } from '@/hooks/useAdminGroups';
import { BreadcrumbNav } from '@/components/BreadcrumbNav';
import { TentCard } from '@/components/TentCard';
import NeighborhoodMap, { TentNode } from '@/components/NeighborhoodMap';
import VIPNeighborhoodMap from '@/components/VIPNeighborhoodMap';
import { NeighborhoodBulkActions } from '@/components/NeighborhoodBulkActions';
import { NeighborhoodReservationModal } from '@/components/NeighborhoodReservationModal';
import { TentDetailModal } from '@/components/TentDetailModal';
import { VIPPlanningPanel } from '@/components/VIPPlanningPanel';
import { NeighborhoodDatePicker } from '@/components/NeighborhoodDatePicker';
import { NeighborhoodBookingsList } from '@/components/NeighborhoodBookingsList';
import { useNeighborhoodBookings } from '@/hooks/useNeighborhoodBookings';
import { useVipReservations } from '@/hooks/useVipReservations';
import { BOOKING_STATUS_COLORS, getBookingStatus } from '@/lib/bookingStatusColors';

import { Badge } from '@/components/ui/badge';
import { GlobalSearch } from '@/components/GlobalSearch';
import { NeighborhoodId, Tent } from '@/types/village';
import { 
  Search, 
  Filter, 
  Loader2,
  LayoutGrid,
  Layers,
  Map,
  Grid3X3,
  Plus,
  CalendarDays,
  Moon
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { parseISO, isWithinInterval, isBefore, isAfter, format } from 'date-fns';

type ViewMode = 'grid' | 'map';

type FilterType = 'all' | 'dirty' | 'checkin' | 'checkout' | 'full';

const Neighborhood = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { state, isLoading, getTentSummary } = useVillage();
  const { groups } = useAdminGroups();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [groupByDouble, setGroupByDouble] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [showReservationModal, setShowReservationModal] = useState(false);
  const [selectedTent, setSelectedTent] = useState<Tent | null>(null);
  const [selectedVIPGroupId, setSelectedVIPGroupId] = useState<string | null>(null);
  const [viewDate, setViewDate] = useState<Date>(new Date());

  const neighborhoodId = id as NeighborhoodId;
  const isVIPNeighborhood = neighborhoodId === 'VIP';

  // Booking data for the selected view date
  const { neighborhoodBookings, vipBooking } = useNeighborhoodBookings(viewDate);
  
  // VIP reservations from the single source of truth (groups.vip_tent_configs)
  const vipReservations = useVipReservations(viewDate);

  // Build VIP booking banner from vipReservations (groups-based, not allocations)
  const vipBookingFromGroups = useMemo(() => {
    const entries = Object.values(vipReservations);
    if (entries.length === 0) return null;
    // Pick the first group found (there could be multiple groups overlapping)
    const first = entries[0];
    const totalPax = entries.reduce((acc, r) => acc + r.bedsPlanned, 0);
    const status = getBookingStatus(first.startDate, first.endDate, format(viewDate, 'yyyy-MM-dd'));
    return {
      status,
      groupName: first.groupName,
      startDate: first.startDate,
      endDate: first.endDate,
      totalPax,
      boysCount: undefined as number | undefined,
      girlsCount: undefined as number | undefined,
    };
  }, [vipReservations, viewDate]);

  const currentBooking = isVIPNeighborhood
    ? vipBookingFromGroups
    : neighborhoodBookings[neighborhoodId] || null;

  const neighborhood = state?.neighborhoods[neighborhoodId];
  const hasDoubleTents = neighborhood?.hasDoubleTents;

  const today = new Date().toISOString().split('T')[0];

  // Get overlapping groups for VIP (groups with staff that overlap with today or current selection)
  const overlappingVIPGroups = useMemo(() => {
    if (!isVIPNeighborhood) return [];
    
    const todayDate = parseISO(today);
    return groups.filter(g => {
      if (g.groupType !== 'לינה') return false;
      if ((g.staffCount || 0) === 0) return false;
      
      const start = parseISO(g.startDate);
      const end = parseISO(g.endDate);
      
      // Check if today falls within the group's date range
      return (isBefore(start, todayDate) || start.getTime() === todayDate.getTime()) &&
             (isAfter(end, todayDate) || end.getTime() === todayDate.getTime());
    });
  }, [groups, today, isVIPNeighborhood]);

  const tentSummaries = useMemo(() => {
    if (!state || !neighborhood) return [];
    
    return neighborhood.tentIds
      .map(tentId => {
        const tent = state.tents[tentId];
        const summary = getTentSummary(tentId);
        return { tent, summary };
      })
      .filter(({ tent, summary }) => tent && summary)
      .map(({ tent, summary }) => ({ tent: tent!, summary: summary! }));
  }, [state, neighborhood, getTentSummary]);

  // Apply filters
  const filteredTents = useMemo(() => {
    let result = tentSummaries;

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(({ tent, summary }) => 
        tent.code.toLowerCase().includes(query) ||
        (summary.groupName?.toLowerCase().includes(query))
      );
    }

    // Type filter
    switch (activeFilter) {
      case 'dirty':
        result = result.filter(({ summary }) => 
          summary.cleaningStatus === 'NEEDS_CLEANING'
        );
        break;
      case 'checkin':
        result = result.filter(({ tent }) => tent.checkInDate === today);
        break;
      case 'checkout':
        result = result.filter(({ tent }) => tent.checkOutDate === today);
        break;
      case 'full':
        result = result.filter(({ summary }) => summary.freeBeds === 0);
        break;
    }

    // Sort VIP tents by ascending number for grid view
    if (isVIPNeighborhood) {
      result = [...result].sort((a, b) => {
        const numA = parseInt(a.tent.code.match(/\d+/)?.[0] ?? '0');
        const numB = parseInt(b.tent.code.match(/\d+/)?.[0] ?? '0');
        return numA - numB;
      });
    }

    return result;
  }, [tentSummaries, searchQuery, activeFilter, today, isVIPNeighborhood]);

  // Group by double tent for N1-N3
  const groupedTents = useMemo(() => {
    if (!groupByDouble || !hasDoubleTents) return null;

    const groups: Record<string, typeof filteredTents> = {};
    
    filteredTents.forEach(item => {
      const doubleTentId = item.tent.doubleTentId;
      if (doubleTentId) {
        if (!groups[doubleTentId]) {
          groups[doubleTentId] = [];
        }
        groups[doubleTentId].push(item);
      }
    });

    return Object.entries(groups).map(([groupId, tents]) => ({
      groupId,
      groupCode: groupId.replace('double_', ''),
      tents: tents.sort((a, b) => (a.tent.isAlef ? -1 : 1)),
    }));
  }, [filteredTents, groupByDouble, hasDoubleTents]);

  // Build a lookup of tent code -> hasExtraBed from vipReservations (groups-based source of truth)
  const extraBedByTentCode = useMemo(() => {
    const map: Record<string, boolean> = {};
    if (!isVIPNeighborhood) return map;
    Object.entries(vipReservations).forEach(([tentCode, reservation]) => {
      if (reservation.hasExtraBed) {
        map[`VIP ${tentCode}`] = true;
      }
    });
    return map;
  }, [vipReservations, isVIPNeighborhood]);

  // Map nodes for NeighborhoodMap
  const mapNodes: TentNode[] = useMemo(() => {
    return filteredTents.map(({ tent, summary }) => {
      // Determine tent type based on neighborhood and structure
      let tentType: 'SIMPLE' | 'DOUBLE' | 'WHITE' = 'SIMPLE';
      if (tent.neighborhoodId === 'N5' || tent.neighborhoodId === 'N6') {
        tentType = 'WHITE';
      } else if (tent.doubleTentId) {
        tentType = 'DOUBLE';
      }

      // Map cleaning status
      let cleaning: 'CLEAN' | 'DIRTY' | 'IN_PROGRESS' = 'CLEAN';
      if (summary.cleaningStatus === 'NEEDS_CLEANING') {
        cleaning = 'DIRTY';
      } else if (summary.cleaningStatus === 'CLEANING_IN_PROGRESS') {
        cleaning = 'IN_PROGRESS';
      }

      // For VIP tents: derive hasReservation + gender from vipReservations (groups-based)
      // For regular tents: use physical tent state as before
      const tentNum = tent.code.match(/\d+/)?.[0] || '';
      const vipRes = isVIPNeighborhood ? vipReservations[tentNum] : undefined;

      const hasReservation = isVIPNeighborhood
        ? !!vipRes
        : !!(tent.checkInDate && tent.checkOutDate && tent.groupName &&
              getBookingStatus(tent.checkInDate, tent.checkOutDate, format(new Date(), 'yyyy-MM-dd')));

      const gender = isVIPNeighborhood
        ? (vipRes?.gender || tent.gender)
        : tent.gender;

      return {
        id: tent.id,
        code: tent.code,
        type: tentType,
        cleaning,
        occupancySummary: {
            used: vipRes ? vipRes.bedsPlanned : (summary.occupiedBeds + summary.reservedBeds),
          total: summary.totalBeds,
        },
        onClick: () => setSelectedTent(tent),
        isAlef: tent.isAlef,
        doubleTentId: tent.doubleTentId,
        gender,
        hasReservation,
        hasExtraBed: !!extraBedByTentCode[tent.code],
      };
    });
  }, [filteredTents, extraBedByTentCode, isVIPNeighborhood, vipReservations]);

  if (isLoading || !state) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!neighborhood) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold">שכונה לא נמצאה</h1>
          <Link to="/" className="text-primary mt-4 block">← חזרה לדף הבית</Link>
        </div>
      </div>
    );
  }

  const filters: { key: FilterType; label: string }[] = [
    { key: 'all', label: 'הכל' },
    { key: 'dirty', label: '🧹 מלוכלך' },
    { key: 'checkin', label: "📅 צ'ק-אין היום" },
    { key: 'checkout', label: "📤 צ'ק-אאוט היום" },
    { key: 'full', label: '🔴 מלא' },
  ];

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b-2 border-border sticky top-0 z-10">
        <div className="container py-3 md:py-6">
          <BreadcrumbNav items={[{ label: neighborhood.displayName }]} />
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 md:gap-4">
            <div className="flex items-start gap-3 flex-1">
              <div>
                <h1 className="text-2xl md:text-4xl font-bold">{neighborhood.displayName}</h1>
                {neighborhood.description && (
                  <p className="text-muted-foreground text-sm md:text-lg mt-1 hidden sm:block">{neighborhood.description}</p>
                )}
              </div>
              <GlobalSearch />
            </div>
            
            {/* Stats */}
            <div className="flex gap-2 md:gap-4 text-sm md:text-lg flex-wrap">
              <span className="px-3 md:px-4 py-1.5 md:py-2 bg-muted rounded-xl">
                <strong>{tentSummaries.length}</strong> אוהלים
              </span>
              <span className="px-3 md:px-4 py-1.5 md:py-2 bg-primary/10 rounded-xl">
                <strong>
                  {tentSummaries.reduce((acc, t) => acc + t.summary.occupiedBeds + t.summary.reservedBeds, 0)}
                </strong> / {tentSummaries.reduce((acc, t) => acc + t.summary.totalBeds, 0)} מיטות
              </span>
              {isVIPNeighborhood && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate('/', { state: { section: 'sleeping' } })}
                >
                  <Moon className="w-4 h-4 ml-1" />
                  לינה
                </Button>
              )}
              <Button onClick={() => setShowReservationModal(true)} className="flex items-center gap-2" size="sm">
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">הזמנה חדשה</span>
                <span className="sm:hidden">+</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container py-6">
        {/* Status Banner */}
        {(() => {
          if (currentBooking?.status) {
            const style = BOOKING_STATUS_COLORS[currentBooking.status];
            const Icon = style.icon;
            return (
              <div
                className={cn(
                  "rounded-xl p-5 mb-6 flex flex-col sm:flex-row sm:items-center gap-3 border-2",
                  style.bgLight,
                  style.border
                )}
                dir="rtl"
              >
                <div className={cn("p-3 rounded-xl", style.bg, "text-white")}>
                  <Icon className="w-8 h-8" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={cn("text-2xl font-bold", style.text)}>תפוס</span>
                    <Badge className={cn(style.bgLight, style.text, "text-sm")}>{style.label}</Badge>
                  </div>
                  <p className="text-lg font-semibold mt-1">{currentBooking.groupName}</p>
                  <p className="text-sm text-muted-foreground">
                    {currentBooking.startDate} → {currentBooking.endDate}
                    {currentBooking.totalPax > 0 && <> · {currentBooking.totalPax} איש</>}
                    {currentBooking.boysCount != null && currentBooking.girlsCount != null && (
                      <> (ב:{currentBooking.boysCount} בנ:{currentBooking.girlsCount})</>
                    )}
                  </p>
                </div>
              </div>
            );
          }
          return (
            <div className="rounded-xl p-5 mb-6 border-2 border-green-300 bg-green-50 dark:bg-green-950/30 text-center" dir="rtl">
              <span className="text-2xl font-bold text-green-700">פנוי</span>
              <p className="text-sm text-muted-foreground mt-1">אין הזמנה לתאריך הנבחר</p>
            </div>
          );
        })()}

        {/* Date Picker & Bookings Calendar Section */}
        <div className="tile p-4 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <CalendarDays className="w-5 h-5 text-primary" />
            <span className="font-semibold">צפה בהזמנות לתאריך</span>
          </div>
          <NeighborhoodDatePicker value={viewDate} onChange={setViewDate} />
          <NeighborhoodBookingsList neighborhoodId={neighborhoodId} date={viewDate} />
        </div>

        {/* VIP Planning Panel - only for VIP neighborhood */}
        {isVIPNeighborhood && (
          <VIPPlanningPanel
            groups={overlappingVIPGroups}
            selectedGroupId={selectedVIPGroupId}
            onGroupSelect={setSelectedVIPGroupId}
          />
        )}

        {/* Bulk Actions for large groups */}
        <NeighborhoodBulkActions 
          neighborhoodId={neighborhoodId} 
          neighborhoodName={neighborhood.displayName} 
        />

        {/* Search & Filters */}
        <div className="mb-6 space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="חפש קוד אוהל או שם קבוצה..."
              className="w-full pl-14 pr-4 py-4 text-xl rounded-xl border-2 border-input bg-background focus:outline-none focus:border-primary"
            />
          </div>

          {/* Filter buttons - scrollable on mobile */}
          <div className="flex flex-wrap gap-2 overflow-x-auto pb-2">
            <Filter className="w-5 h-5 md:w-6 md:h-6 text-muted-foreground self-center mr-2 flex-shrink-0" />
              {filters.map((filter) => (
              <button
                key={filter.key}
                onClick={() => setActiveFilter(filter.key)}
                className={cn(
                  'px-3 md:px-4 py-2 md:py-2 rounded-xl font-medium text-sm md:font-semibold transition-all whitespace-nowrap min-h-[44px] touch-target',
                  activeFilter === filter.key
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                )}
              >
                {filter.label}
              </button>
            ))}

            {/* View Mode Toggle */}
            <div className="ml-auto flex gap-2">
              <button
                onClick={() => setViewMode('grid')}
                className={cn(
                  'px-4 py-2 rounded-xl font-semibold transition-all flex items-center gap-2',
                  viewMode === 'grid'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                )}
              >
                <Grid3X3 className="w-5 h-5" />
                רשת
              </button>
              <button
                onClick={() => setViewMode('map')}
                className={cn(
                  'px-4 py-2 rounded-xl font-semibold transition-all flex items-center gap-2',
                  viewMode === 'map'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                )}
              >
                <Map className="w-5 h-5" />
                מפה
              </button>

              {/* Group toggle for N1-N3 */}
              {hasDoubleTents && viewMode === 'grid' && (
                <button
                  onClick={() => setGroupByDouble(!groupByDouble)}
                className={cn(
                  'ml-auto px-4 py-2 rounded-xl font-semibold transition-all flex items-center gap-2',
                  groupByDouble
                    ? 'bg-accent text-accent-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                )}
              >
                {groupByDouble ? <Layers className="w-5 h-5" /> : <LayoutGrid className="w-5 h-5" />}
                  {groupByDouble ? 'מקובצים' : 'בודדים'}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Tent Display */}
        {filteredTents.length === 0 ? (
          <div className="tile p-12 text-center">
            <Search className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="text-xl text-muted-foreground">לא נמצאו אוהלים</p>
          </div>
        ) : viewMode === 'map' ? (
          // Map view - use VIP rectangular map for VIP neighborhood
          <div className="tile p-6 overflow-x-auto">
            {neighborhoodId === 'VIP' ? (
              <VIPNeighborhoodMap nodes={mapNodes} />
            ) : (
              <NeighborhoodMap
                title={neighborhood.displayName}
                nodes={mapNodes}
                isDoubleTentNeighborhood={hasDoubleTents}
              />
            )}
          </div>
        ) : groupByDouble && groupedTents ? (
          // Grouped view
          <div className="space-y-8">
            {groupedTents.map((group) => (
              <div key={group.groupId} className="tile p-6">
                <h3 className="text-2xl font-bold mb-4">
                  אוהל כפול {group.groupCode}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {group.tents.map(({ summary }) => (
                    <TentCard
                      key={summary.tentId}
                      summary={summary}
                      to={`/tent/${summary.tentId}`}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          // Regular grid view - responsive columns
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 sm:gap-4">
            {filteredTents.map(({ tent, summary }) => {
              // For VIP: overlay groups-based booking data onto the summary
              const tentNum = tent.code.match(/\d+/)?.[0] || '';
              const vipRes = isVIPNeighborhood ? vipReservations[tentNum] : undefined;
              const augmentedSummary = isVIPNeighborhood && vipRes
                ? {
                    ...summary,
                    groupName: vipRes.groupName,
                    checkInDate: vipRes.startDate,
                    checkOutDate: vipRes.endDate,
                    gender: vipRes.gender || summary.gender,
                    occupiedBeds: vipRes.bedsPlanned,
                    freeBeds: Math.max(0, summary.totalBeds - vipRes.bedsPlanned),
                  }
                : isVIPNeighborhood && !vipRes
                  ? { ...summary, groupName: undefined, checkInDate: undefined, checkOutDate: undefined }
                  : summary;

              return (
                <div 
                  key={summary.tentId} 
                  onClick={() => setSelectedTent(tent)}
                  className="cursor-pointer"
                >
                  <TentCard
                    summary={augmentedSummary}
                    to="#"
                    hasExtraBed={!!extraBedByTentCode[tent.code]}
                  />
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Reservation Modal */}
      <NeighborhoodReservationModal
        open={showReservationModal}
        onOpenChange={setShowReservationModal}
        neighborhoodId={neighborhoodId}
        neighborhoodName={neighborhood.displayName}
      />

      {/* Tent Detail Modal */}
      <TentDetailModal
        open={!!selectedTent}
        onOpenChange={(open) => !open && setSelectedTent(null)}
        tent={selectedTent ? state.tents[selectedTent.id] : null}
      />
    </div>
  );
};

export default Neighborhood;
