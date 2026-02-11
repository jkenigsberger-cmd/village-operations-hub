import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useVillage } from '@/context/VillageContext';
import { useAdminGroups } from '@/hooks/useAdminGroups';
import { useGroupAllocation } from '@/hooks/useGroupAllocation';
import { NeighborhoodTile } from '@/components/NeighborhoodTile';
import NeighborhoodMiniMap from '@/components/NeighborhoodMiniMap';
import { NeighborhoodId, Facility, WorkingStatus } from '@/types/village';
import { FacilityTile, FacilityCard } from '@/components/FacilityCard';
import { MaintenancePhotoCapture } from '@/components/MaintenancePhotoCapture';
import { ReportIssueModal } from '@/components/ReportIssueModal';
import { TentCard } from '@/components/TentCard';
import { TentDetailModal } from '@/components/TentDetailModal';
import { MasterCalendar } from '@/components/MasterCalendar';
import { SleepingDashboard } from '@/components/SleepingDashboard';
import { GlobalSearch } from '@/components/GlobalSearch';
import { PendingAllocationCard } from '@/components/PendingAllocationCard';
import { MobileBottomNav, MenuSection } from '@/components/MobileBottomNav';
import { GENDER_LEGEND } from '@/lib/tentColors';
import { HE } from '@/lib/translations';
import { 
  computeAllocationStatus, 
  groupNeedsAllocation, 
  getSleepingGroups 
} from '@/lib/allocationStatus';
import { 
  Calendar,
  Moon,
  Bath, 
  CalendarDays, 
  Tent,
  Loader2,
  Home,
  Flame,
  ShowerHead,
  StickyNote,
  AlertTriangle,
  Wrench,
  Sparkles,
  CheckCircle,
  Camera,
  ArrowLeft,
  CalendarCheck,
  ChevronLeft,
  ChevronRight,
  ChefHat,
  Settings,
  ClipboardList
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { toast } from 'sonner';
import { format, addDays, subDays, isToday } from 'date-fns';
import { he } from 'date-fns/locale';

const neighborhoodOrder: NeighborhoodId[] = ['N1', 'N2', 'N3', 'N4', 'N5', 'N6', 'N7', 'VIP'];

// MenuSection type is now imported from MobileBottomNav

const Index = () => {
  const navigate = useNavigate();
  const { groups, archivedGroups } = useAdminGroups();
  const { allocations } = useGroupAllocation();
  const {
    state, 
    isLoading, 
    getNeighborhoodSummary, 
    getTodaySummary,
    getTentSummary,
    updateFacilityCleaningStatus,
    updateFacilityWorkingStatus,
    updateFacilityNotes,
    updateFacilityMaintenanceImage,
    updateTentCleaningStatus,
    reportFacilityIssue,
    resolveFacilityIssue,
    resolveActivitySpaceIssue,
    updateActivitySpaceStatus,
    getDailyTasks,
    removeDailyTask,
    resolveTentFacilityIssue
  } = useVillage();

  const [activeSection, setActiveSection] = useState<MenuSection>('overview');
  const [selectedFacility, setSelectedFacility] = useState<Facility | null>(null);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportStatus, setReportStatus] = useState<WorkingStatus>('BROKEN');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedTentId, setSelectedTentId] = useState<string | null>(null);

  // GOAL 2: Get ALL sleeping groups for allocations view
  const sleepingGroups = useMemo(() => getSleepingGroups(groups), [groups]);

  // GOAL 2: Groups that need allocation (for notifications)
  const groupsNeedingAllocation = useMemo(() => {
    return groups.filter(g => groupNeedsAllocation(g, allocations));
  }, [groups, allocations]);

  // Filter allocations for TODAY only (for overview section - notifications)
  const todayAllocations = useMemo(() => {
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    return groupsNeedingAllocation.filter(g => {
      const start = g.startDate;
      const end = g.endDate;
      // Include if today is within the group's date range
      return start <= todayStr && end >= todayStr;
    });
  }, [groupsNeedingAllocation]);

  // Pending Allocations Section Component - for overview (TODAY only, notifications)
  const PendingAllocationsSection = () => {
    if (todayAllocations.length === 0) return null;
    
    return (
      <section className="mb-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold flex items-center gap-3">
            <ClipboardList className="w-8 h-8" />
            {HE.pages.todayAllocations}
            <span className="px-3 py-1 text-sm rounded-full bg-amber-500 text-white">
              {todayAllocations.length}
            </span>
          </h2>
          {groupsNeedingAllocation.length > todayAllocations.length && (
            <button 
              onClick={() => setActiveSection('allocations')}
              className="text-primary hover:underline font-semibold flex items-center gap-1"
            >
              {HE.pages.allAllocations} ({sleepingGroups.length}) ←
            </button>
          )}
        </div>
        <div className="space-y-3">
          {todayAllocations.map(group => (
            <PendingAllocationCard key={group.id} group={group} allocations={allocations} />
          ))}
        </div>
      </section>
    );
  };

  // Calculate check-ins and check-outs for selected date
  const summaryForDate = useMemo(() => {
    if (!state) return { checkIns: [], checkOuts: [] };
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    
    const checkIns: NonNullable<ReturnType<typeof getTentSummary>>[] = [];
    const checkOuts: NonNullable<ReturnType<typeof getTentSummary>>[] = [];
    
    Object.values(state.tents).forEach(tent => {
      if (tent.checkInDate === dateStr) {
        const summary = getTentSummary(tent.id);
        if (summary) checkIns.push(summary);
      }
      if (tent.checkOutDate === dateStr) {
        const summary = getTentSummary(tent.id);
        if (summary) checkOuts.push(summary);
      }
    });
    
    return { checkIns, checkOuts };
  }, [state, selectedDate, getTentSummary]);

  // Get archived group names for filtering - MUST be before any early return
  const archivedGroupNames = useMemo(() => 
    new Set(archivedGroups.map(g => g.groupName)), 
    [archivedGroups]
  );

  // Filter out archived groups from today summary - MUST be before any early return
  const todaySummary = useMemo(() => {
    if (!state) return { checkIns: [], checkOuts: [], tentsToCleaning: [] };
    const rawTodaySummary = getTodaySummary();
    return {
      ...rawTodaySummary,
      checkIns: rawTodaySummary.checkIns.filter(t => !t.groupName || !archivedGroupNames.has(t.groupName)),
      checkOuts: rawTodaySummary.checkOuts.filter(t => !t.groupName || !archivedGroupNames.has(t.groupName)),
      tentsToCleaning: rawTodaySummary.tentsToCleaning.filter(t => !t.groupName || !archivedGroupNames.has(t.groupName)),
    };
  }, [state, getTodaySummary, archivedGroupNames]);

  if (isLoading || !state) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin mx-auto text-primary" />
          <p className="mt-4 text-xl">{HE.messages.loadingVillage}</p>
        </div>
      </div>
    );
  }

  // Get all facilities organized by type
  const allFacilities = Object.values(state.facilities);
  const bathroomFacilities = allFacilities.filter(f => f.type === 'TOILET' || f.type === 'SHOWER');
  const facilitiesNeedingAttention = bathroomFacilities.filter(
    f => f.cleaningStatus === 'NEEDS_CLEANING' || f.workingStatus === 'BROKEN'
  );

// Maintenance items - facilities that are broken or need maintenance
  const maintenanceItems = allFacilities.filter(
    f => f.workingStatus === 'BROKEN' || f.workingStatus === 'MAINTENANCE'
  );

  // Activity Spaces maintenance items (Common Facilities like Bunker, Dining Hall, etc.)
  const activitySpaceMaintenanceItems = Object.values(state.activitySpaces).filter(
    s => s.workingStatus === 'BROKEN' || s.workingStatus === 'MAINTENANCE'
  );

  // VIP Maintenance tasks from dailyTasks (baños y duchas VIP)
  const today = new Date().toISOString().split('T')[0];
  const vipMaintenanceTasks = getDailyTasks(today).filter(
    task => task.type === 'MAINTENANCE' && task.status !== 'COMPLETED' && task.entityType === 'TENT'
  );

  // Combined maintenance count
  const totalMaintenanceCount = maintenanceItems.length + activitySpaceMaintenanceItems.length + vipMaintenanceTasks.length;

  // Housekeeping items - tents, facilities, and activity spaces that need cleaning
  const tentsNeedingCleaning = Object.values(state.tents).filter(
    t => t.cleaningStatus === 'NEEDS_CLEANING'
  );
  const facilitiesNeedingCleaning = allFacilities.filter(
    f => f.cleaningStatus === 'NEEDS_CLEANING'
  );
  // Activity spaces (common facilities) needing cleaning
  const activitySpacesNeedingCleaning = Object.values(state.activitySpaces).filter(
    s => s.cleaningStatus === 'NEEDS_CLEANING' || s.cleaningStatus === 'CLEANING_IN_PROGRESS'
  );
  const totalHousekeepingItems = tentsNeedingCleaning.length + facilitiesNeedingCleaning.length + activitySpacesNeedingCleaning.length;

  const menuItems: { key: MenuSection; label: string; icon: React.ElementType; count?: number }[] = [
    { key: 'overview', label: HE.nav.overview, icon: Home },
    { key: 'sleeping', label: 'לינה', icon: Moon },
    { key: 'calendar', label: HE.nav.calendar, icon: CalendarDays },
    { key: 'allocations', label: HE.nav.allocations, icon: ClipboardList, count: groupsNeedingAllocation.length > 0 ? groupsNeedingAllocation.length : undefined },
    { key: 'neighborhoods', label: HE.nav.neighborhoods, icon: Tent },
    { key: 'facilities', label: HE.nav.facilities, icon: Flame },
    { key: 'bathrooms', label: HE.nav.bathrooms, icon: ShowerHead, count: facilitiesNeedingAttention.length },
    { key: 'maintenance', label: HE.nav.maintenance, icon: Wrench, count: totalMaintenanceCount },
    { key: 'housekeeping', label: HE.nav.housekeeping, icon: Sparkles, count: totalHousekeepingItems },
    { key: 'notes', label: HE.nav.notes, icon: StickyNote },
  ];

  const handleReportIssue = (status: WorkingStatus) => {
    setReportStatus(status);
    setReportModalOpen(true);
  };

  const handleReportSubmit = (data: { status: WorkingStatus; notes: string; image?: string }) => {
    if (selectedFacility) {
      reportFacilityIssue(selectedFacility.id, data.status, data.notes, data.image);
      setSelectedFacility({ 
        ...selectedFacility, 
        workingStatus: data.status,
        maintenanceNotes: data.notes,
        maintenanceImage: data.image,
      });
      toast.success(HE.messages.issueReported);
    }
  };

  const handleResolveMaintenance = (facilityId: string) => {
    resolveFacilityIssue(facilityId);
    toast.success(HE.messages.taskCompleted);
  };

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      {/* Header - Compact on mobile */}
      <header className="bg-card border-b-2 border-border sticky top-0 z-10">
        <div className="container py-3 md:py-6">
          <div className="flex items-center justify-between gap-3 md:gap-4">
            <div className="flex items-center gap-2 md:gap-4">
              <Tent className="w-8 h-8 md:w-10 md:h-10 text-primary" />
              <div>
                <h1 className="text-2xl md:text-4xl font-bold text-foreground">
                  חוות אהרונסון
                </h1>
                <p className="text-muted-foreground text-sm md:text-lg hidden sm:block">
                  Glow Glamping & Ha-Dor Ha-Ba
                </p>
              </div>
            </div>
            
            {/* Global Search & Settings */}
            <div className="flex items-center gap-2 md:gap-3">
              <GlobalSearch />
              <Button 
                variant="outline" 
                size="icon"
                onClick={() => navigate('/settings')}
                className="md:hidden"
              >
                <Settings className="w-5 h-5" />
              </Button>
              <Button 
                variant="outline" 
                onClick={() => navigate('/settings')}
                className="hidden md:flex items-center gap-2"
              >
                <Settings className="w-5 h-5" />
                <span>{HE.nav.settings}</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Menu - Hidden on mobile, use bottom nav instead */}
      <nav className="bg-card border-b border-border hidden md:block">
        <div className="container">
          <div className="flex overflow-x-auto gap-1 py-2">
            {menuItems.map((item) => (
              <button
                key={item.key}
                onClick={() => setActiveSection(item.key)}
                className={`flex items-center gap-2 px-4 py-3 rounded-xl font-semibold whitespace-nowrap transition-all ${
                  activeSection === item.key
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted/50 text-muted-foreground hover:bg-muted'
                }`}
              >
                <item.icon className="w-5 h-5" />
                {item.label}
                {item.count !== undefined && item.count > 0 && (
                  <span className="mr-1 px-2 py-0.5 text-xs rounded-full bg-destructive text-destructive-foreground">
                    {item.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </nav>

      <main className="container py-4 md:py-8">
        {/* Overview Section */}
        {activeSection === 'overview' && (
          <>
            <section className="mb-6 md:mb-10">
              <h2 className="text-xl md:text-2xl font-bold mb-4 md:mb-6 flex items-center gap-2 md:gap-3">
                <CalendarDays className="w-6 h-6 md:w-8 md:h-8" />
                {HE.pages.todayOverview}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Check-ins Tile */}
                <div 
                  onClick={() => setActiveSection('check-ins')}
                  className={`tile p-6 cursor-pointer hover:shadow-lg transition-all border-r-4 ${
                    todaySummary.checkIns.length > 0 ? 'border-green-500' : 'border-muted'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${
                      todaySummary.checkIns.length > 0 
                        ? 'bg-green-500/20 text-green-600' 
                        : 'bg-muted text-muted-foreground'
                    }`}>
                      <Calendar className="w-8 h-8" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold">{HE.nav.checkIns}</h3>
                      <p className="text-sm text-muted-foreground">{HE.stats.todaysArrivals}</p>
                    </div>
                    {todaySummary.checkIns.length > 0 && (
                      <span className="px-3 py-1.5 rounded-full bg-green-500 text-white font-bold text-lg">
                        {todaySummary.checkIns.length}
                      </span>
                    )}
                  </div>
                </div>

                {/* Check-outs Tile */}
                <div 
                  onClick={() => setActiveSection('check-outs')}
                  className="tile p-6 cursor-pointer hover:shadow-lg transition-all border-r-4 border-muted"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${
                      todaySummary.checkOuts.length > 0 
                        ? 'bg-blue-500/20 text-blue-600' 
                        : 'bg-muted text-muted-foreground'
                    }`}>
                      <Calendar className="w-8 h-8" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold">{HE.nav.checkOuts}</h3>
                      <p className="text-sm text-muted-foreground">{HE.stats.todaysDepartures}</p>
                    </div>
                    {todaySummary.checkOuts.length > 0 && (
                      <span className="px-3 py-1.5 rounded-full bg-blue-500 text-white font-bold text-lg">
                        {todaySummary.checkOuts.length}
                      </span>
                    )}
                  </div>
                </div>

                {/* Needs Cleaning Tile */}
                <div 
                  onClick={() => setActiveSection('needs-cleaning')}
                  className={`tile p-6 cursor-pointer hover:shadow-lg transition-all border-r-4 ${
                    todaySummary.tentsToCleaning.length > 0 ? 'border-yellow-500' : 'border-muted'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${
                      todaySummary.tentsToCleaning.length > 0 
                        ? 'bg-yellow-500/20 text-yellow-600' 
                        : 'bg-muted text-muted-foreground'
                    }`}>
                      <Tent className="w-8 h-8" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold">{HE.nav.needsCleaning}</h3>
                      <p className="text-sm text-muted-foreground">{HE.stats.tentsToCleanToday}</p>
                    </div>
                    {todaySummary.tentsToCleaning.length > 0 && (
                      <span className="px-3 py-1.5 rounded-full bg-yellow-500 text-white font-bold text-lg">
                        {todaySummary.tentsToCleaning.length}
                      </span>
                    )}
                  </div>
                </div>

                {/* Facilities Alert Tile */}
                <div 
                  onClick={() => setActiveSection('facilities-alert')}
                  className="tile p-6 cursor-pointer hover:shadow-lg transition-all border-r-4 border-destructive"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${
                      (totalMaintenanceCount + totalHousekeepingItems) > 0 
                        ? 'bg-destructive/20 text-destructive' 
                        : 'bg-muted text-muted-foreground'
                    }`}>
                      <Bath className="w-8 h-8" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold">{HE.stats.facilitiesAlert}</h3>
                      <p className="text-sm text-muted-foreground">{HE.stats.maintenanceHousekeeping}</p>
                    </div>
                    {(totalMaintenanceCount + totalHousekeepingItems) > 0 && (
                      <span className="px-3 py-1.5 rounded-full bg-destructive text-destructive-foreground font-bold text-lg">
                        {totalMaintenanceCount + totalHousekeepingItems}
                      </span>
                    )}
                  </div>
                </div>

                {/* Kitchen Tile */}
                <div 
                  onClick={() => navigate('/kitchen')}
                  className="tile p-6 cursor-pointer hover:shadow-lg transition-all border-r-4 border-amber-500"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-xl flex items-center justify-center bg-amber-500/20 text-amber-600">
                      <ChefHat className="w-8 h-8" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold">🍽️ מטבח</h3>
                      <p className="text-sm text-muted-foreground">תכנון ארוחות</p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Pending Allocations Section */}
            <PendingAllocationsSection />

            {/* Interactive Neighborhoods Mini-Maps */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <h2 className="text-2xl font-bold">{HE.nav.neighborhoods}</h2>
                  <span className="text-sm text-muted-foreground capitalize">
                    {format(new Date(), "EEEE, d 'ב'MMMM", { locale: he })}
                  </span>
                </div>
                <button 
                  onClick={() => setActiveSection('neighborhoods')}
                  className="text-primary hover:underline font-semibold"
                >
                  {HE.actions.viewAll} ←
                </button>
              </div>
              
              {/* Gender Legend */}
              <div className="flex flex-wrap gap-4 mb-4 text-sm">
                {GENDER_LEGEND.map(({ color, label }) => (
                  <div key={label} className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded" style={{ backgroundColor: color }} />
                    <span>{label}</span>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {neighborhoodOrder.map((id) => {
                  const summary = getNeighborhoodSummary(id);
                  const neighborhood = state.neighborhoods[id];
                  if (!summary || !neighborhood) return null;
                  
                  const tents = Object.values(state.tents).filter(t => t.neighborhoodId === id);
                  
                  return (
                    <NeighborhoodMiniMap
                      key={id}
                      neighborhoodId={id}
                      displayName={HE.neighborhoodNames[id] || neighborhood.displayName}
                      tents={tents}
                      summary={summary}
                      onTentClick={(tentId) => setSelectedTentId(tentId)}
                    />
                  );
                })}
              </div>
            </section>
          </>
        )}

        {/* Calendar Section */}
        {activeSection === 'calendar' && (
          <MasterCalendar />
        )}

        {/* Sleeping Section */}
        {activeSection === 'sleeping' && (
          <SleepingDashboard />
        )}

        {/* Allocations Section - ALL sleeping groups (GOAL 2) */}
        {activeSection === 'allocations' && (
          <section>
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
              <ClipboardList className="w-8 h-8" />
              {HE.pages.allAllocations}
              <span className="px-3 py-1 text-sm rounded-full bg-muted text-muted-foreground">
                {sleepingGroups.length}
              </span>
              {groupsNeedingAllocation.length > 0 && (
                <span className="px-3 py-1 text-sm rounded-full bg-amber-500 text-white">
                  {groupsNeedingAllocation.length} דורשים שיבוץ
                </span>
              )}
            </h2>
            {sleepingGroups.length === 0 ? (
              <div className="tile p-8 text-center bg-muted/20 border-muted">
                <Tent className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                <p className="text-xl font-medium">אין קבוצות לינה</p>
              </div>
            ) : (
              <div className="space-y-3">
                {sleepingGroups.map(group => (
                  <PendingAllocationCard key={group.id} group={group} allocations={allocations} />
                ))}
              </div>
            )}
          </section>
        )}

        {/* Neighborhoods Section */}
        {activeSection === 'neighborhoods' && (
          <section>
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
              <Tent className="w-8 h-8" />
              {HE.pages.allNeighborhoods}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {neighborhoodOrder.map((id) => {
                const summary = getNeighborhoodSummary(id);
                if (!summary) return null;
                return (
                  <NeighborhoodTile
                    key={id}
                    summary={{...summary, displayName: HE.neighborhoodNames[id] || summary.displayName}}
                    to={`/neighborhood/${id}`}
                  />
                );
              })}
            </div>
          </section>
        )}

        {/* Common Facilities Section */}
        {activeSection === 'facilities' && (
          <section>
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
              <Flame className="w-8 h-8" />
              {HE.nav.facilities}
            </h2>
            <p className="text-muted-foreground mb-6">
              מרחבי פעילות זמינים לשימוש קבוצתי
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.values(state.activitySpaces).map((space) => (
                <div
                  key={space.id}
                  onClick={() => navigate(`/activities?spaceId=${space.id}`)}
                  className="tile flex items-center gap-4 cursor-pointer hover:shadow-lg transition-all"
                >
                  <div className="w-14 h-14 rounded-xl bg-primary/20 flex items-center justify-center">
                    <Flame className="w-8 h-8 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold">{space.name}</h3>
                    <p className="text-sm text-muted-foreground">{space.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Bathrooms Section */}
        {activeSection === 'bathrooms' && (
          <section>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold flex items-center gap-3">
                <ShowerHead className="w-8 h-8" />
                {HE.nav.bathrooms}
              </h2>
              <button
                onClick={() => navigate('/facilities')}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-xl font-semibold"
              >
                {HE.actions.viewAll}
              </button>
            </div>
            
            {facilitiesNeedingAttention.length === 0 ? (
              <div className="tile p-8 text-center bg-status-clean/10 border-status-clean">
                <CheckCircle className="w-16 h-16 mx-auto mb-4 text-status-clean" />
                <p className="text-xl font-medium">{HE.messages.allFacilitiesWorking}</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {facilitiesNeedingAttention.map((facility) => (
                  <FacilityTile
                    key={facility.id}
                    facility={facility}
                    onClick={() => setSelectedFacility(facility)}
                  />
                ))}
              </div>
            )}
          </section>
        )}

        {/* Maintenance Section */}
        {activeSection === 'maintenance' && (
          <section>
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
              <Wrench className="w-8 h-8" />
              {HE.nav.maintenance}
            </h2>
            
{maintenanceItems.length === 0 && activitySpaceMaintenanceItems.length === 0 && vipMaintenanceTasks.length === 0 ? (
              <div className="tile p-8 text-center bg-status-clean/10 border-status-clean">
                <CheckCircle className="w-16 h-16 mx-auto mb-4 text-status-clean" />
                <p className="text-xl font-medium">{HE.messages.allFacilitiesWorking}</p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Common Facilities Maintenance (Bathrooms/Showers) */}
                {maintenanceItems.length > 0 && (
                  <div>
                    <h3 className="text-xl font-semibold mb-4">{HE.nav.bathrooms}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {maintenanceItems.map((facility) => (
                        <div key={facility.id} className="tile border-destructive bg-destructive/5">
                          <div className="flex items-center gap-3 mb-4">
                            <AlertTriangle className="w-6 h-6 text-destructive" />
                            <div>
                              <h4 className="font-bold text-lg">{facility.label}</h4>
                              <span className={`text-sm ${facility.workingStatus === 'BROKEN' ? 'text-destructive' : 'text-yellow-600'}`}>
                                {facility.workingStatus === 'BROKEN' ? HE.status.broken : HE.status.maintenance}
                              </span>
                            </div>
                          </div>
                          
                          {facility.maintenanceImage && (
                            <img 
                              src={facility.maintenanceImage} 
                              alt="Issue" 
                              className="w-full h-32 object-cover rounded-lg mb-3"
                            />
                          )}
                          
                          {facility.maintenanceNotes && (
                            <p className="text-muted-foreground mb-4">{facility.maintenanceNotes}</p>
                          )}
                          
                          <button
                            onClick={() => handleResolveMaintenance(facility.id)}
                            className="w-full px-4 py-3 bg-status-clean text-status-clean-foreground rounded-xl font-bold flex items-center justify-center gap-2"
                          >
                            <CheckCircle className="w-5 h-5" />
                            {HE.messages.taskCompleted}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Activity Spaces Maintenance (Common Facilities like Bunker, Dining Hall) */}
                {activitySpaceMaintenanceItems.length > 0 && (
                  <div>
                    <h3 className="text-xl font-semibold mb-4">{HE.nav.facilities}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {activitySpaceMaintenanceItems.map((space) => (
                        <div key={space.id} className="tile border-destructive bg-destructive/5">
                          <div className="flex items-center gap-3 mb-4">
                            <AlertTriangle className="w-6 h-6 text-destructive" />
                            <div>
                              <h4 className="font-bold text-lg">{space.name}</h4>
                              <span className={`text-sm ${space.workingStatus === 'BROKEN' ? 'text-destructive' : 'text-yellow-600'}`}>
                                {space.workingStatus === 'BROKEN' ? HE.status.broken : HE.status.maintenance}
                              </span>
                            </div>
                          </div>
                          
                          {space.maintenanceImage && (
                            <img 
                              src={space.maintenanceImage} 
                              alt="Issue" 
                              className="w-full h-32 object-cover rounded-lg mb-3"
                            />
                          )}
                          
                          {space.maintenanceNotes && (
                            <p className="text-muted-foreground mb-4">{space.maintenanceNotes}</p>
                          )}
                          
                          <button
                            onClick={() => {
                              resolveActivitySpaceIssue(space.id);
                              toast.success(HE.messages.taskCompleted);
                            }}
                            className="w-full px-4 py-3 bg-status-clean text-status-clean-foreground rounded-xl font-bold flex items-center justify-center gap-2"
                          >
                            <CheckCircle className="w-5 h-5" />
                            {HE.messages.taskCompleted}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* VIP Tent Maintenance Tasks */}
                {vipMaintenanceTasks.length > 0 && (
                  <div>
                    <h3 className="text-xl font-semibold mb-4">{HE.badges.vip} - {HE.nav.bathrooms}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {vipMaintenanceTasks.map((task) => {
                        // Get the tent to show current status
                        const tent = task.entityId ? state.tents[task.entityId] : null;
                        return (
                          <div key={task.id} className="tile border-vip bg-vip/5">
                            <div className="flex items-center gap-3 mb-4">
                              <Sparkles className="w-6 h-6 text-vip" />
                              <div>
                                <h4 className="font-bold text-lg">{task.title}</h4>
                                <span className="text-sm text-muted-foreground">{task.description}</span>
                              </div>
                            </div>
                            
                            {/* Show maintenance image if available */}
                            {task.maintenanceImage && (
                              <img 
                                src={task.maintenanceImage} 
                                alt="Issue" 
                                className="w-full h-32 object-cover rounded-lg mb-3"
                              />
                            )}
                            
                            {/* Show tent code for location context */}
                            {tent && (
                              <p className="text-sm text-muted-foreground mb-3">
                                📍 {tent.code}
                              </p>
                            )}
                            
                            <button
                              onClick={() => {
                                if (task.entityId && task.facilityType) {
                                  resolveTentFacilityIssue(task.entityId, task.facilityType);
                                }
                                removeDailyTask(task.id);
                                toast.success(HE.messages.taskCompleted);
                              }}
                              className="w-full px-4 py-3 bg-status-clean text-status-clean-foreground rounded-xl font-bold flex items-center justify-center gap-2"
                            >
                              <CheckCircle className="w-5 h-5" />
                              {HE.messages.taskCompleted}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </section>
        )}

        {/* Housekeeping Section */}
        {activeSection === 'housekeeping' && (
          <section>
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
              <Sparkles className="w-8 h-8" />
              {HE.nav.housekeeping}
            </h2>
            
            {totalHousekeepingItems === 0 ? (
              <div className="tile p-8 text-center bg-status-clean/10 border-status-clean">
                <Sparkles className="w-16 h-16 mx-auto mb-4 text-status-clean" />
                <p className="text-xl font-medium">{HE.messages.allClean}</p>
              </div>
            ) : (
              <div className="space-y-8">
                {/* Tents */}
                {tentsNeedingCleaning.length > 0 && (
                  <div>
                    <h3 className="text-xl font-semibold mb-4">
                      {HE.entities.tents} ({tentsNeedingCleaning.length})
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      {tentsNeedingCleaning.map((tent) => {
                        const summary = getTentSummary(tent.id);
                        if (!summary) return null;
                        return (
                          <div key={tent.id} className="tile border-yellow-500 bg-yellow-50/50">
                            <div className="flex items-center gap-3 mb-4">
                              <Tent className="w-6 h-6 text-yellow-600" />
                              <div className="flex-1">
                                <h4 className="font-bold text-lg">{tent.neighborhoodId} – {tent.code}</h4>
                                <span className="text-sm text-yellow-600">
                                  {HE.status.needsCleaning}
                                </span>
                              </div>
                            </div>
                            
                            <button
                              onClick={() => {
                                updateTentCleaningStatus(tent.id, 'CLEAN');
                                toast.success(HE.messages.taskCompleted);
                              }}
                              className="w-full px-4 py-3 bg-status-clean text-status-clean-foreground rounded-xl font-bold flex items-center justify-center gap-2"
                            >
                              <CheckCircle className="w-5 h-5" />
                              נקי
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Facilities */}
                {facilitiesNeedingCleaning.length > 0 && (
                  <div>
                    <h3 className="text-xl font-semibold mb-4">
                      {HE.entities.facilities} ({facilitiesNeedingCleaning.length})
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      {facilitiesNeedingCleaning.map((facility) => (
                        <FacilityTile
                          key={facility.id}
                          facility={facility}
                          onClick={() => setSelectedFacility(facility)}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Activity Spaces (Common Facilities) */}
                {activitySpacesNeedingCleaning.length > 0 && (
                  <div>
                    <h3 className="text-xl font-semibold mb-4">
                      {HE.nav.facilities} ({activitySpacesNeedingCleaning.length})
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {activitySpacesNeedingCleaning.map((space) => (
                        <div key={space.id} className="tile border-yellow-500 bg-yellow-50/50">
                          <div className="flex items-center gap-3 mb-4">
                            <Sparkles className="w-6 h-6 text-yellow-600" />
                            <div className="flex-1">
                              <h4 className="font-bold text-lg">{space.name}</h4>
                              <span className={`text-sm ${space.cleaningStatus === 'NEEDS_CLEANING' ? 'text-yellow-600' : 'text-blue-600'}`}>
                                {space.cleaningStatus === 'NEEDS_CLEANING' ? HE.status.needsCleaning : HE.status.inProgress}
                              </span>
                            </div>
                          </div>
                          
                          {space.cleaningNotes && (
                            <p className="text-muted-foreground mb-4 text-sm">📝 {space.cleaningNotes}</p>
                          )}
                          
                          <div className="flex gap-2">
                            {space.cleaningStatus === 'NEEDS_CLEANING' && (
                              <button
                                onClick={() => {
                                  updateActivitySpaceStatus(space.id, 'CLEANING_IN_PROGRESS', undefined);
                                  toast.success('התחלת ניקיון');
                                }}
                                className="flex-1 px-4 py-3 bg-blue-500 text-white rounded-xl font-bold flex items-center justify-center gap-2"
                              >
                                <Sparkles className="w-5 h-5" />
                                התחל ניקיון
                              </button>
                            )}
                            <button
                              onClick={() => {
                                updateActivitySpaceStatus(space.id, 'CLEAN', undefined);
                                toast.success(HE.messages.taskCompleted);
                              }}
                              className="flex-1 px-4 py-3 bg-status-clean text-status-clean-foreground rounded-xl font-bold flex items-center justify-center gap-2"
                            >
                              <CheckCircle className="w-5 h-5" />
                              {HE.messages.taskCompleted}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </section>
        )}

        {/* Check-ins Section */}
        {activeSection === 'check-ins' && (
          <section>
            <div className="flex items-center gap-4 mb-6">
              <button
                onClick={() => setActiveSection('overview')}
                className="p-2 hover:bg-muted rounded-xl"
              >
                <ArrowLeft className="w-6 h-6" />
              </button>
              <h2 className="text-2xl font-bold flex items-center gap-3">
                <Calendar className="w-8 h-8" />
                {HE.nav.checkIns} {HE.date.today}
              </h2>
            </div>
            
            {/* Date Navigator */}
            <div className="flex items-center gap-4 mb-6">
              <Button variant="outline" size="icon" onClick={() => setSelectedDate(prev => subDays(prev, 1))}>
                <ChevronRight className="w-5 h-5" />
              </Button>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="min-w-[200px]">
                    <CalendarDays className="w-4 h-4 ml-2" />
                    {isToday(selectedDate) ? HE.date.today : format(selectedDate, 'd MMM yyyy', { locale: he })}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <CalendarComponent
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => date && setSelectedDate(date)}
                    locale={he}
                  />
                </PopoverContent>
              </Popover>
              <Button variant="outline" size="icon" onClick={() => setSelectedDate(prev => addDays(prev, 1))}>
                <ChevronLeft className="w-5 h-5" />
              </Button>
              {!isToday(selectedDate) && (
                <Button variant="secondary" onClick={() => setSelectedDate(new Date())}>
                  {HE.actions.goToToday}
                </Button>
              )}
            </div>
            
            {summaryForDate.checkIns.length === 0 ? (
              <div className="tile p-8 text-center">
                <Calendar className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                <p className="text-xl text-muted-foreground">{HE.messages.noCheckIns}</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {summaryForDate.checkIns.map((tent) => (
                  <TentCard
                    key={tent.tentId}
                    summary={tent}
                    to={`/tent/${tent.tentId}`}
                  />
                ))}
              </div>
            )}
          </section>
        )}

        {/* Check-outs Section */}
        {activeSection === 'check-outs' && (
          <section>
            <div className="flex items-center gap-4 mb-6">
              <button
                onClick={() => setActiveSection('overview')}
                className="p-2 hover:bg-muted rounded-xl"
              >
                <ArrowLeft className="w-6 h-6" />
              </button>
              <h2 className="text-2xl font-bold flex items-center gap-3">
                <CalendarCheck className="w-8 h-8" />
                {HE.nav.checkOuts} {HE.date.today}
              </h2>
            </div>
            
            {/* Date Navigator */}
            <div className="flex items-center gap-4 mb-6">
              <Button variant="outline" size="icon" onClick={() => setSelectedDate(prev => subDays(prev, 1))}>
                <ChevronRight className="w-5 h-5" />
              </Button>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="min-w-[200px]">
                    <CalendarDays className="w-4 h-4 ml-2" />
                    {isToday(selectedDate) ? HE.date.today : format(selectedDate, 'd MMM yyyy', { locale: he })}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <CalendarComponent
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => date && setSelectedDate(date)}
                    locale={he}
                  />
                </PopoverContent>
              </Popover>
              <Button variant="outline" size="icon" onClick={() => setSelectedDate(prev => addDays(prev, 1))}>
                <ChevronLeft className="w-5 h-5" />
              </Button>
              {!isToday(selectedDate) && (
                <Button variant="secondary" onClick={() => setSelectedDate(new Date())}>
                  {HE.actions.goToToday}
                </Button>
              )}
            </div>
            
            {summaryForDate.checkOuts.length === 0 ? (
              <div className="tile p-8 text-center">
                <CalendarCheck className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                <p className="text-xl text-muted-foreground">{HE.messages.noCheckOuts}</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {summaryForDate.checkOuts.map((tent) => (
                  <TentCard
                    key={tent.tentId}
                    summary={tent}
                    to={`/tent/${tent.tentId}`}
                  />
                ))}
              </div>
            )}
          </section>
        )}

        {/* Needs Cleaning Section */}
        {activeSection === 'needs-cleaning' && (
          <section>
            <div className="flex items-center gap-4 mb-6">
              <button
                onClick={() => setActiveSection('overview')}
                className="p-2 hover:bg-muted rounded-xl"
              >
                <ArrowLeft className="w-6 h-6" />
              </button>
              <h2 className="text-2xl font-bold flex items-center gap-3">
                <Sparkles className="w-8 h-8" />
                {HE.nav.needsCleaning}
              </h2>
            </div>
            
            {todaySummary.tentsToCleaning.length === 0 ? (
              <div className="tile p-8 text-center bg-status-clean/10 border-status-clean">
                <Sparkles className="w-16 h-16 mx-auto mb-4 text-status-clean" />
                <p className="text-xl font-medium">{HE.messages.allClean}</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {todaySummary.tentsToCleaning.map((tent) => (
                  <TentCard
                    key={tent.tentId}
                    summary={tent}
                    to={`/tent/${tent.tentId}`}
                  />
                ))}
              </div>
            )}
          </section>
        )}

        {/* Facilities Alert Section */}
        {activeSection === 'facilities-alert' && (
          <section>
            <div className="flex items-center gap-4 mb-6">
              <button
                onClick={() => setActiveSection('overview')}
                className="p-2 hover:bg-muted rounded-xl"
              >
                <ArrowLeft className="w-6 h-6" />
              </button>
              <h2 className="text-2xl font-bold flex items-center gap-3">
                <AlertTriangle className="w-8 h-8 text-destructive" />
                {HE.stats.facilitiesAlert}
              </h2>
            </div>
            
            <div className="space-y-8">
              {/* Maintenance Items */}
              {(maintenanceItems.length > 0 || vipMaintenanceTasks.length > 0) && (
                <div>
                  <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                    <Wrench className="w-5 h-5" />
                    {HE.nav.maintenance} ({maintenanceItems.length + vipMaintenanceTasks.length})
                  </h3>
                  <button
                    onClick={() => setActiveSection('maintenance')}
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-xl font-semibold mb-4"
                  >
                    {HE.actions.viewAll}
                  </button>
                </div>
              )}

              {/* Housekeeping Items */}
              {totalHousekeepingItems > 0 && (
                <div>
                  <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                    <Sparkles className="w-5 h-5" />
                    {HE.nav.housekeeping} ({totalHousekeepingItems})
                  </h3>
                  <button
                    onClick={() => setActiveSection('housekeeping')}
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-xl font-semibold"
                  >
                    {HE.actions.viewAll}
                  </button>
                </div>
              )}
            </div>
          </section>
        )}
      </main>

      {/* Facility Detail Modal */}
      <Dialog open={!!selectedFacility} onOpenChange={(open) => !open && setSelectedFacility(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">{selectedFacility?.label}</DialogTitle>
          </DialogHeader>
          {selectedFacility && (
            <FacilityCard
              facility={selectedFacility}
              onCleaningChange={(status) => {
                updateFacilityCleaningStatus(selectedFacility.id, status);
                setSelectedFacility({ ...selectedFacility, cleaningStatus: status });
              }}
              onWorkingChange={(status) => {
                updateFacilityWorkingStatus(selectedFacility.id, status);
                setSelectedFacility({ ...selectedFacility, workingStatus: status });
              }}
              onNotesChange={(notes) => {
                updateFacilityNotes(selectedFacility.id, notes);
                setSelectedFacility({ ...selectedFacility, notes });
              }}
              onReportIssue={handleReportIssue}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Report Issue Modal */}
      {selectedFacility && (
        <ReportIssueModal
          isOpen={reportModalOpen}
          onClose={() => setReportModalOpen(false)}
          facility={selectedFacility}
          selectedStatus={reportStatus}
          onSubmit={handleReportSubmit}
        />
      )}

      {/* Tent Detail Modal */}
      <TentDetailModal
        open={!!selectedTentId}
        onOpenChange={(open) => !open && setSelectedTentId(null)}
        tent={selectedTentId ? state.tents[selectedTentId] : null}
      />

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav
        activeSection={activeSection}
        onSectionChange={setActiveSection}
        maintenanceCount={totalMaintenanceCount}
        housekeepingCount={totalHousekeepingItems}
        allocationsCount={groupsNeedingAllocation.length}
      />
    </div>
  );
};

export default Index;
