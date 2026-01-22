import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useVillage } from '@/context/VillageContext';
import { NeighborhoodTile } from '@/components/NeighborhoodTile';
import NeighborhoodMiniMap from '@/components/NeighborhoodMiniMap';
import { NeighborhoodId, Facility, WorkingStatus } from '@/types/village';
import { FacilityTile, FacilityCard } from '@/components/FacilityCard';
import { MaintenancePhotoCapture } from '@/components/MaintenancePhotoCapture';
import { ReportIssueModal } from '@/components/ReportIssueModal';
import { TentCard } from '@/components/TentCard';
import { TentDetailModal } from '@/components/TentDetailModal';
import { MasterCalendar } from '@/components/MasterCalendar';
import { GENDER_LEGEND } from '@/lib/tentColors';
import { 
  Calendar, 
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
  ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { toast } from 'sonner';
import { format, addDays, subDays, isToday } from 'date-fns';
import { es } from 'date-fns/locale';

const neighborhoodOrder: NeighborhoodId[] = ['N1', 'N2', 'N3', 'N4', 'N5', 'N6', 'N7', 'VIP'];

type MenuSection = 'overview' | 'calendar' | 'neighborhoods' | 'facilities' | 'bathrooms' | 'maintenance' | 'housekeeping' | 'notes' | 'facilities-alert' | 'check-ins' | 'check-outs' | 'needs-cleaning';

const Index = () => {
  const navigate = useNavigate();
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

  if (isLoading || !state) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin mx-auto text-primary" />
          <p className="mt-4 text-xl">Loading village...</p>
        </div>
      </div>
    );
  }

  const todaySummary = getTodaySummary();

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

  // VIP Maintenance tasks from dailyTasks (baños y duchas VIP)
  const today = new Date().toISOString().split('T')[0];
  const vipMaintenanceTasks = getDailyTasks(today).filter(
    task => task.type === 'MAINTENANCE' && task.status !== 'COMPLETED' && task.entityType === 'TENT'
  );

  // Combined maintenance count
  const totalMaintenanceCount = maintenanceItems.length + vipMaintenanceTasks.length;

  // Housekeeping items - tents and facilities that need cleaning
  const tentsNeedingCleaning = Object.values(state.tents).filter(
    t => t.cleaningStatus === 'NEEDS_CLEANING'
  );
  const facilitiesNeedingCleaning = allFacilities.filter(
    f => f.cleaningStatus === 'NEEDS_CLEANING'
  );
  const totalHousekeepingItems = tentsNeedingCleaning.length + facilitiesNeedingCleaning.length;

  const menuItems: { key: MenuSection; label: string; icon: React.ElementType; count?: number }[] = [
    { key: 'overview', label: 'Overview', icon: Home },
    { key: 'calendar', label: 'Calendario', icon: CalendarDays },
    { key: 'neighborhoods', label: 'Neighborhoods', icon: Tent },
    { key: 'facilities', label: 'Common Facilities', icon: Flame },
    { key: 'bathrooms', label: 'Bathrooms', icon: ShowerHead, count: facilitiesNeedingAttention.length },
    { key: 'maintenance', label: 'Maintenance', icon: Wrench, count: totalMaintenanceCount },
    { key: 'housekeeping', label: 'Housekeeping', icon: Sparkles, count: totalHousekeepingItems },
    { key: 'notes', label: 'Important Notes', icon: StickyNote },
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
      toast.success('Issue reported successfully');
    }
  };

  const handleResolveMaintenance = (facilityId: string) => {
    resolveFacilityIssue(facilityId);
    toast.success('Task marked as complete');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b-2 border-border sticky top-0 z-10">
        <div className="container py-6">
          <div className="flex items-center gap-4">
            <Tent className="w-10 h-10 text-primary" />
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-foreground">
                Aharonson Farm
              </h1>
              <p className="text-muted-foreground text-lg">
                Glow Glamping & Ha-Dor Ha-Ba
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Menu */}
      <nav className="bg-card border-b border-border">
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
                  <span className="ml-1 px-2 py-0.5 text-xs rounded-full bg-destructive text-destructive-foreground">
                    {item.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </nav>

      <main className="container py-8">
        {/* Overview Section */}
        {activeSection === 'overview' && (
          <>
            <section className="mb-10">
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
                <CalendarDays className="w-8 h-8" />
                Today's Overview
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Check-ins Tile */}
                <div 
                  onClick={() => setActiveSection('check-ins')}
                  className={`tile p-6 cursor-pointer hover:shadow-lg transition-all border-l-4 ${
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
                      <h3 className="text-xl font-bold">Check-ins</h3>
                      <p className="text-sm text-muted-foreground">Today's arrivals</p>
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
                  className="tile p-6 cursor-pointer hover:shadow-lg transition-all border-l-4 border-muted"
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
                      <h3 className="text-xl font-bold">Check-outs</h3>
                      <p className="text-sm text-muted-foreground">Today's departures</p>
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
                  className={`tile p-6 cursor-pointer hover:shadow-lg transition-all border-l-4 ${
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
                      <h3 className="text-xl font-bold">Needs Cleaning</h3>
                      <p className="text-sm text-muted-foreground">Tents to clean</p>
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
                  className="tile p-6 cursor-pointer hover:shadow-lg transition-all border-l-4 border-destructive"
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
                      <h3 className="text-xl font-bold">Facilities Alert</h3>
                      <p className="text-sm text-muted-foreground">Maintenance & Housekeeping</p>
                    </div>
                    {(totalMaintenanceCount + totalHousekeepingItems) > 0 && (
                      <span className="px-3 py-1.5 rounded-full bg-destructive text-destructive-foreground font-bold text-lg">
                        {totalMaintenanceCount + totalHousekeepingItems}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </section>

            {/* Interactive Neighborhoods Mini-Maps */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <h2 className="text-2xl font-bold">Neighborhoods</h2>
                  <span className="text-sm text-muted-foreground capitalize">
                    {format(new Date(), "EEEE, d 'de' MMMM", { locale: es })}
                  </span>
                </div>
                <button 
                  onClick={() => setActiveSection('neighborhoods')}
                  className="text-primary hover:underline font-semibold"
                >
                  View All →
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
                      displayName={neighborhood.displayName}
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

        {/* Neighborhoods Section */}
        {activeSection === 'neighborhoods' && (
          <section>
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
              <Tent className="w-8 h-8" />
              All Neighborhoods
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {neighborhoodOrder.map((id) => {
                const summary = getNeighborhoodSummary(id);
                if (!summary) return null;
                return (
                  <NeighborhoodTile
                    key={id}
                    summary={summary}
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
              Common Facilities
            </h2>
            <p className="text-muted-foreground mb-6">
              Activity spaces available for group use
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.values(state.activitySpaces).map((space) => (
                <button
                  key={space.id}
                  type="button"
                  onClick={() => navigate(`/activities?spaceId=${encodeURIComponent(space.id)}`)}
                  className="tile p-6 text-left hover:bg-muted/40 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Flame className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold">{space.name}</h3>
                      {space.description && (
                        <p className="text-sm text-muted-foreground">
                          {space.description}
                        </p>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Facilities Alert Submenu */}
        {activeSection === 'facilities-alert' && (
          <section>
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
              <AlertTriangle className="w-8 h-8 text-destructive" />
              Facilities Alert
            </h2>
            <p className="text-muted-foreground mb-6">
              Choose a category to view pending tasks
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Maintenance Option */}
              <button
                onClick={() => setActiveSection('maintenance')}
                className="tile p-8 text-left hover:shadow-lg hover:border-destructive/50 transition-all group"
              >
                <div className="flex items-center gap-6">
                  <div className={`w-20 h-20 rounded-2xl flex items-center justify-center ${
                    totalMaintenanceCount > 0 
                      ? 'bg-destructive/20 text-destructive' 
                      : 'bg-muted text-muted-foreground'
                  }`}>
                    <Wrench className="w-10 h-10" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold group-hover:text-destructive transition-colors">Maintenance</h3>
                    <p className="text-muted-foreground mt-1">Repairs & broken items</p>
                  </div>
                  {totalMaintenanceCount > 0 && (
                    <span className="px-4 py-2 rounded-full bg-destructive text-destructive-foreground font-bold text-2xl">
                      {totalMaintenanceCount}
                    </span>
                  )}
                </div>
              </button>

              {/* Housekeeping Option */}
              <button
                onClick={() => setActiveSection('housekeeping')}
                className="tile p-8 text-left hover:shadow-lg hover:border-yellow-500/50 transition-all group"
              >
                <div className="flex items-center gap-6">
                  <div className={`w-20 h-20 rounded-2xl flex items-center justify-center ${
                    totalHousekeepingItems > 0 
                      ? 'bg-yellow-500/20 text-yellow-600' 
                      : 'bg-muted text-muted-foreground'
                  }`}>
                    <Sparkles className="w-10 h-10" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold group-hover:text-yellow-600 transition-colors">Housekeeping</h3>
                    <p className="text-muted-foreground mt-1">Cleaning tasks</p>
                  </div>
                  {totalHousekeepingItems > 0 && (
                    <span className="px-4 py-2 rounded-full bg-yellow-500 text-white font-bold text-2xl">
                      {totalHousekeepingItems}
                    </span>
                  )}
                </div>
              </button>
            </div>
          </section>
        )}

        {/* Bathrooms Section */}
        {activeSection === 'bathrooms' && (
          <section>
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
              <ShowerHead className="w-8 h-8" />
              Bathrooms & Showers
            </h2>

            {facilitiesNeedingAttention.length > 0 && (
              <div className="mb-6 p-4 rounded-xl bg-destructive/10 border border-destructive/20">
                <div className="flex items-center gap-2 text-destructive font-semibold mb-2">
                  <AlertTriangle className="w-5 h-5" />
                  {facilitiesNeedingAttention.length} facilities need attention
                </div>
              </div>
            )}

            {/* Group by area */}
            {Object.values(state.facilityAreas).map((area) => {
              const areaFacilities = area.facilityIds
                .map(id => state.facilities[id])
                .filter(Boolean);

              return (
                <div key={area.id} className="mb-8">
                  <h3 className="text-xl font-bold mb-4">{area.name}</h3>
                  <p className="text-muted-foreground mb-4">{area.description}</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                    {areaFacilities.map((facility) => (
                      <FacilityTile
                        key={facility.id}
                        facility={facility}
                        onClick={() => setSelectedFacility(facility)}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </section>
        )}

        {/* Maintenance Section */}
        {activeSection === 'maintenance' && (
          <section>
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
              <Wrench className="w-8 h-8" />
              Maintenance Tasks
            </h2>
            <p className="text-muted-foreground mb-6">
              Items that need repair or maintenance attention
            </p>

            {totalMaintenanceCount === 0 ? (
              <div className="tile p-8 text-center">
                <CheckCircle className="w-16 h-16 mx-auto mb-4 text-green-500" />
                <p className="text-xl text-muted-foreground">
                  All clear! No maintenance tasks pending.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Common Facilities Maintenance */}
                {maintenanceItems.map((facility) => (
                  <div 
                    key={facility.id}
                    className="tile p-4"
                  >
                    <div className="flex items-start gap-4">
                      {/* Photo thumbnail or status icon */}
                      {facility.maintenanceImage ? (
                        <button
                          onClick={() => setSelectedFacility(facility)}
                          className="w-20 h-20 rounded-xl overflow-hidden border-2 border-primary/50 hover:border-primary transition-all flex-shrink-0"
                        >
                          <img 
                            src={facility.maintenanceImage} 
                            alt="Maintenance issue" 
                            className="w-full h-full object-cover"
                          />
                        </button>
                      ) : (
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                          facility.workingStatus === 'BROKEN' 
                            ? 'bg-destructive/10 text-destructive' 
                            : 'bg-yellow-500/10 text-yellow-600'
                        }`}>
                          <Wrench className="w-6 h-6" />
                        </div>
                      )}
                      
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-lg">{facility.label}</h3>
                        <p className="text-sm text-muted-foreground">
                          {state.facilityAreas[facility.areaId]?.name || 'Unknown Area'}
                        </p>
                        <span className={`inline-block text-xs font-semibold px-2 py-1 rounded-full mt-1 ${
                          facility.workingStatus === 'BROKEN' 
                            ? 'bg-destructive/10 text-destructive' 
                            : 'bg-yellow-500/10 text-yellow-600'
                        }`}>
                          {facility.workingStatus === 'BROKEN' ? '🔧 Broken' : '⚠️ Maintenance'}
                        </span>
                        {/* Show maintenance notes if available */}
                        {facility.maintenanceNotes && (
                          <p className="text-sm text-foreground mt-2 p-2 bg-muted rounded-lg">
                            📝 {facility.maintenanceNotes}
                          </p>
                        )}
                        {/* Fallback to general notes */}
                        {!facility.maintenanceNotes && facility.notes && (
                          <p className="text-sm text-muted-foreground mt-2">
                            📝 {facility.notes}
                          </p>
                        )}
                      </div>
                      
                      <div className="flex flex-col gap-2 flex-shrink-0">
                        {!facility.maintenanceImage && (
                          <MaintenancePhotoCapture
                            facilityId={facility.id}
                            currentImage={facility.maintenanceImage}
                            onImageCapture={updateFacilityMaintenanceImage}
                          />
                        )}
                        <Button
                          onClick={() => handleResolveMaintenance(facility.id)}
                          variant="outline"
                          className="flex items-center gap-2"
                        >
                          <CheckCircle className="w-4 h-4" />
                          Done
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}

                {/* VIP Tent Maintenance Tasks */}
                {vipMaintenanceTasks.map((task) => {
                  const tent = task.entityId ? state.tents[task.entityId] : null;
                  const facilityType = task.title.includes('Baño') ? 'bathroom' : 'shower';
                  
                  return (
                    <div 
                      key={task.id}
                      className="tile p-4 border-amber-300 bg-amber-50/50"
                    >
                      <div className="flex items-start gap-4">
                        {/* Photo thumbnail or VIP icon */}
                        {task.maintenanceImage ? (
                          <div className="w-20 h-20 rounded-xl overflow-hidden border-2 border-amber-500/50 flex-shrink-0">
                            <img 
                              src={task.maintenanceImage} 
                              alt="Maintenance issue" 
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ) : (
                          <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 bg-amber-500/10 text-amber-700">
                            <Sparkles className="w-6 h-6" />
                          </div>
                        )}
                        
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-lg flex items-center gap-2">
                            {task.title}
                            <span className="px-2 py-0.5 bg-amber-500 text-white rounded-full text-xs">VIP</span>
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            Carpa VIP - {tent?.code || 'Unknown'}
                          </p>
                          <span className="inline-block text-xs font-semibold px-2 py-1 rounded-full mt-1 bg-destructive/10 text-destructive">
                            {task.description?.includes('ROTO') ? '🔧 Roto' : '⚠️ Mantenimiento'}
                          </span>
                          {task.description && (
                            <p className="text-sm text-foreground mt-2 p-2 bg-white/50 rounded-lg">
                              📝 {task.description}
                            </p>
                          )}
                        </div>
                        
                        <div className="flex flex-col gap-2 flex-shrink-0">
                          <Button
                            onClick={() => {
                              // Resolve the tent facility issue
                              if (tent) {
                                resolveTentFacilityIssue(tent.id, facilityType);
                              }
                              // Remove the task
                              removeDailyTask(task.id);
                              toast.success('Tarea VIP completada');
                            }}
                            variant="outline"
                            className="flex items-center gap-2"
                          >
                            <CheckCircle className="w-4 h-4" />
                            Done
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {/* Housekeeping Section */}
        {activeSection === 'housekeeping' && (
          <section>
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
              <Sparkles className="w-8 h-8" />
              Housekeeping Tasks
            </h2>
            <p className="text-muted-foreground mb-6">
              Areas that need cleaning
            </p>

            {totalHousekeepingItems === 0 ? (
              <div className="tile p-8 text-center">
                <CheckCircle className="w-16 h-16 mx-auto mb-4 text-green-500" />
                <p className="text-xl text-muted-foreground">
                  All clean! No housekeeping tasks pending.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Tents needing cleaning */}
                {tentsNeedingCleaning.length > 0 && (
                  <div>
                    <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                      <Tent className="w-5 h-5" />
                      Tents ({tentsNeedingCleaning.length})
                    </h3>
                    <div className="space-y-3">
                      {tentsNeedingCleaning.map((tent) => (
                        <div 
                          key={tent.id}
                          className="tile p-4 flex items-center justify-between"
                        >
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-yellow-500/10 flex items-center justify-center">
                              <Tent className="w-6 h-6 text-yellow-600" />
                            </div>
                            <div>
                              <h4 className="font-bold text-lg">{tent.code}</h4>
                              <p className="text-sm text-muted-foreground">
                                {state.neighborhoods[tent.neighborhoodId]?.displayName || tent.neighborhoodId}
                              </p>
                              <span className="text-xs font-semibold px-2 py-1 rounded-full bg-yellow-500/10 text-yellow-600">
                                🧹 Needs Cleaning
                              </span>
                            </div>
                          </div>
                          <Button
                            onClick={() => updateTentCleaningStatus(tent.id, 'CLEAN')}
                            variant="outline"
                            className="flex items-center gap-2"
                          >
                            <CheckCircle className="w-4 h-4" />
                            Done
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Facilities needing cleaning */}
                {facilitiesNeedingCleaning.length > 0 && (
                  <div>
                    <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                      <ShowerHead className="w-5 h-5" />
                      Facilities ({facilitiesNeedingCleaning.length})
                    </h3>
                    <div className="space-y-3">
                      {facilitiesNeedingCleaning.map((facility) => (
                        <div 
                          key={facility.id}
                          className="tile p-4 flex items-center justify-between"
                        >
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-yellow-500/10 flex items-center justify-center">
                              <ShowerHead className="w-6 h-6 text-yellow-600" />
                            </div>
                            <div>
                              <h4 className="font-bold text-lg">{facility.label}</h4>
                              <p className="text-sm text-muted-foreground">
                                {state.facilityAreas[facility.areaId]?.name || 'Unknown Area'}
                              </p>
                              <span className="text-xs font-semibold px-2 py-1 rounded-full bg-yellow-500/10 text-yellow-600">
                                🧹 Needs Cleaning
                              </span>
                            </div>
                          </div>
                          <Button
                            onClick={() => updateFacilityCleaningStatus(facility.id, 'CLEAN')}
                            variant="outline"
                            className="flex items-center gap-2"
                          >
                            <CheckCircle className="w-4 h-4" />
                            Done
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </section>
        )}

        {/* Important Notes Section */}
        {activeSection === 'notes' && (
          <section>
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
              <StickyNote className="w-8 h-8" />
              Important Notes
            </h2>
            <div className="tile p-8 text-center">
              <StickyNote className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-xl text-muted-foreground mb-4">
                Notes feature coming soon
              </p>
              <p className="text-muted-foreground">
                This section will allow you to add and manage important notes for the team.
              </p>
            </div>
          </section>
        )}

        {/* Check-ins Section */}
        {activeSection === 'check-ins' && (
          <section>
            <div className="flex items-center gap-4 mb-6">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setActiveSection('overview')}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </Button>
            </div>
            
            {/* Date Selector */}
            <div className="flex flex-wrap items-center gap-3 mb-6">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setSelectedDate(subDays(selectedDate, 1))}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="min-w-[200px]">
                    <Calendar className="w-4 h-4 mr-2" />
                    {format(selectedDate, "EEEE, d 'de' MMMM", { locale: es })}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => date && setSelectedDate(date)}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
              
              <Button
                variant="outline"
                size="icon"
                onClick={() => setSelectedDate(addDays(selectedDate, 1))}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
              
              {!isToday(selectedDate) && (
                <Button
                  variant="secondary"
                  onClick={() => setSelectedDate(new Date())}
                >
                  Ir a Hoy
                </Button>
              )}
            </div>
            
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-green-500/20 rounded-xl">
                <Calendar className="w-8 h-8 text-green-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">
                  Check-ins {isToday(selectedDate) ? 'Hoy' : format(selectedDate, "d/MM/yyyy")}
                </h2>
                <p className="text-muted-foreground">{summaryForDate.checkIns.length} grupos llegando</p>
              </div>
            </div>
            
            {summaryForDate.checkIns.length === 0 ? (
              <div className="tile p-8 text-center text-muted-foreground">
                <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p className="text-xl">No hay check-ins {isToday(selectedDate) ? 'hoy' : 'este día'}</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {summaryForDate.checkIns.map((tent) => tent && (
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
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setActiveSection('overview')}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </Button>
            </div>
            
            {/* Date Selector */}
            <div className="flex flex-wrap items-center gap-3 mb-6">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setSelectedDate(subDays(selectedDate, 1))}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="min-w-[200px]">
                    <Calendar className="w-4 h-4 mr-2" />
                    {format(selectedDate, "EEEE, d 'de' MMMM", { locale: es })}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => date && setSelectedDate(date)}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
              
              <Button
                variant="outline"
                size="icon"
                onClick={() => setSelectedDate(addDays(selectedDate, 1))}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
              
              {!isToday(selectedDate) && (
                <Button
                  variant="secondary"
                  onClick={() => setSelectedDate(new Date())}
                >
                  Ir a Hoy
                </Button>
              )}
            </div>
            
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-blue-500/20 rounded-xl">
                <CalendarCheck className="w-8 h-8 text-blue-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">
                  Check-outs {isToday(selectedDate) ? 'Hoy' : format(selectedDate, "d/MM/yyyy")}
                </h2>
                <p className="text-muted-foreground">{summaryForDate.checkOuts.length} grupos saliendo</p>
              </div>
            </div>
            
            {summaryForDate.checkOuts.length === 0 ? (
              <div className="tile p-8 text-center text-muted-foreground">
                <CalendarCheck className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p className="text-xl">No hay check-outs {isToday(selectedDate) ? 'hoy' : 'este día'}</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {summaryForDate.checkOuts.map((tent) => tent && (
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
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setActiveSection('overview')}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </Button>
            </div>
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-yellow-500/20 rounded-xl">
                <Sparkles className="w-8 h-8 text-yellow-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Tents Needing Cleaning</h2>
                <p className="text-muted-foreground">{todaySummary.tentsToCleaning.length} tents to clean</p>
              </div>
            </div>
            
            {todaySummary.tentsToCleaning.length === 0 ? (
              <div className="tile p-8 text-center bg-green-500/10 border-green-500">
                <Sparkles className="w-12 h-12 mx-auto mb-3 text-green-500" />
                <p className="text-xl font-medium">All tents are clean! ✨</p>
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

        {/* Footer with Settings link */}
        <footer className="mt-12 pt-8 border-t-2 border-border text-center">
          <a 
            href="/settings" 
            className="text-lg text-muted-foreground hover:text-foreground transition-colors"
          >
            ⚙️ Settings & Data Management
          </a>
        </footer>
      </main>

      {/* Facility Detail Modal */}
      <Dialog open={!!selectedFacility} onOpenChange={(open) => !open && setSelectedFacility(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">
              {selectedFacility?.label}
            </DialogTitle>
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

      {/* Tent Detail Modal from mini-maps */}
      <TentDetailModal
        open={!!selectedTentId}
        onOpenChange={(open) => !open && setSelectedTentId(null)}
        tent={selectedTentId ? state.tents[selectedTentId] : null}
      />
    </div>
  );
};

export default Index;
