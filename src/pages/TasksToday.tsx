import React, { useState, useMemo } from 'react';
import { useVillage } from '@/context/VillageContext';
import { 
  CheckCircle, 
  AlertTriangle,
  Wrench,
  Sparkles,
  Clock,
  LogIn,
  LogOut,
  Tent,
  ShowerHead,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';

interface TaskSection {
  id: string;
  title: string;
  icon: React.ElementType;
  priority: 'urgent' | 'high' | 'normal';
  items: TaskItem[];
}

interface TaskItem {
  id: string;
  title: string;
  subtitle: string;
  type: 'tent' | 'facility';
  badge?: string;
  badgeColor?: string;
  onComplete?: () => void;
}

const TasksToday: React.FC = () => {
  const { 
    state, 
    getTodaySummary,
    updateTentCleaningStatus,
    updateFacilityCleaningStatus,
    updateFacilityWorkingStatus,
    updateFacilityMaintenanceImage,
    getNeighborhoodReservations
  } = useVillage();
  
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});
  const [completedTasks, setCompletedTasks] = useState<Set<string>>(new Set());

  const todaySummary = useMemo(() => getTodaySummary(), [state]);
  const today = format(new Date(), 'yyyy-MM-dd');

  // Get all maintenance items
  const maintenanceItems = useMemo(() => {
    if (!state) return [];
    return Object.values(state.facilities).filter(
      f => f.workingStatus === 'BROKEN' || f.workingStatus === 'MAINTENANCE'
    );
  }, [state]);

  // Get check-ins for today with neighborhood info
  const checkInsToday = useMemo(() => {
    if (!state) return [];
    const neighborhoodIds = Object.keys(state.neighborhoods);
    const reservations: Array<{ groupName: string; neighborhoodName: string; neighborhoodId: string; beds: number; arrivalTime?: string }> = [];
    
    neighborhoodIds.forEach(id => {
      const nReservations = getNeighborhoodReservations(id as any);
      nReservations.forEach(r => {
        if (r.checkInDate === today) {
          const neighborhood = state.neighborhoods[id];
          const totalBeds = neighborhood.tentIds.reduce((acc, tentId) => {
            return acc + (state.tents[tentId]?.beds.length || 0);
          }, 0);
          reservations.push({
            groupName: r.groupName,
            neighborhoodName: neighborhood.displayName,
            neighborhoodId: id,
            beds: totalBeds,
            arrivalTime: r.arrivalTime
          });
        }
      });
    });
    return reservations;
  }, [state, today, getNeighborhoodReservations]);

  // Get check-outs for today
  const checkOutsToday = useMemo(() => {
    if (!state) return [];
    const neighborhoodIds = Object.keys(state.neighborhoods);
    const reservations: Array<{ groupName: string; neighborhoodName: string; neighborhoodId: string }> = [];
    
    neighborhoodIds.forEach(id => {
      const nReservations = getNeighborhoodReservations(id as any);
      nReservations.forEach(r => {
        if (r.checkOutDate === today) {
          const neighborhood = state.neighborhoods[id];
          reservations.push({
            groupName: r.groupName,
            neighborhoodName: neighborhood.displayName,
            neighborhoodId: id
          });
        }
      });
    });
    return reservations;
  }, [state, today, getNeighborhoodReservations]);

  // Build task sections
  const taskSections: TaskSection[] = useMemo(() => {
    const sections: TaskSection[] = [];

    // Urgent - Maintenance
    if (maintenanceItems.length > 0) {
      sections.push({
        id: 'maintenance',
        title: `🔴 Urgent - Repairs (${maintenanceItems.length})`,
        icon: Wrench,
        priority: 'urgent',
        items: maintenanceItems.map(f => ({
          id: f.id,
          title: f.label,
          subtitle: state?.facilityAreas[f.areaId]?.name || 'Unknown Area',
          type: 'facility' as const,
          badge: f.workingStatus === 'BROKEN' ? '🔧 Broken' : '⚠️ Maintenance',
          badgeColor: f.workingStatus === 'BROKEN' ? 'bg-destructive/10 text-destructive' : 'bg-yellow-500/10 text-yellow-600',
          onComplete: () => {
            updateFacilityWorkingStatus(f.id, 'WORKING');
            updateFacilityMaintenanceImage(f.id, undefined);
          }
        }))
      });
    }

    // Cleaning tasks
    const cleaningItems = [
      ...todaySummary.tentsToCleaning.map(t => ({
        id: t.tentId,
        title: t.code,
        subtitle: state?.neighborhoods[state.tents[t.tentId]?.neighborhoodId]?.displayName || '',
        type: 'tent' as const,
        badge: '🧹 Needs Cleaning',
        badgeColor: 'bg-yellow-500/10 text-yellow-600',
        onComplete: () => updateTentCleaningStatus(t.tentId, 'CLEAN')
      })),
      ...todaySummary.facilitiesNeedAttention
        .filter(f => f.cleaningStatus === 'NEEDS_CLEANING' && f.workingStatus === 'WORKING')
        .map(f => ({
          id: f.id,
          title: f.label,
          subtitle: state?.facilityAreas[f.areaId]?.name || '',
          type: 'facility' as const,
          badge: '🧹 Needs Cleaning',
          badgeColor: 'bg-yellow-500/10 text-yellow-600',
          onComplete: () => updateFacilityCleaningStatus(f.id, 'CLEAN')
        }))
    ];

    if (cleaningItems.length > 0) {
      sections.push({
        id: 'cleaning',
        title: `🧹 Cleaning Tasks (${cleaningItems.length})`,
        icon: Sparkles,
        priority: 'high',
        items: cleaningItems
      });
    }

    // Check-ins today (to prepare)
    if (checkInsToday.length > 0) {
      sections.push({
        id: 'checkins',
        title: `📥 Check-ins Today (${checkInsToday.length})`,
        icon: LogIn,
        priority: 'normal',
        items: checkInsToday.map(r => ({
          id: `checkin-${r.neighborhoodId}`,
          title: `${r.neighborhoodName} - "${r.groupName}"`,
          subtitle: `${r.beds} beds${r.arrivalTime ? ` • Arrival: ${r.arrivalTime}` : ''}`,
          type: 'tent' as const,
          badge: 'Prepare',
          badgeColor: 'bg-primary/10 text-primary'
        }))
      });
    }

    // Check-outs today
    if (checkOutsToday.length > 0) {
      sections.push({
        id: 'checkouts',
        title: `📤 Check-outs Today (${checkOutsToday.length})`,
        icon: LogOut,
        priority: 'normal',
        items: checkOutsToday.map(r => ({
          id: `checkout-${r.neighborhoodId}`,
          title: `${r.neighborhoodName} - "${r.groupName}"`,
          subtitle: 'Clean after departure',
          type: 'tent' as const,
          badge: 'Departure',
          badgeColor: 'bg-muted text-muted-foreground'
        }))
      });
    }

    return sections;
  }, [maintenanceItems, todaySummary, checkInsToday, checkOutsToday, state]);

  const toggleSection = (sectionId: string) => {
    setCollapsedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
  };

  const markComplete = (taskId: string, onComplete?: () => void) => {
    if (onComplete) {
      onComplete();
    }
    setCompletedTasks(prev => new Set([...prev, taskId]));
  };

  const totalPendingTasks = taskSections.reduce((acc, section) => 
    acc + section.items.filter(item => !completedTasks.has(item.id)).length, 0
  );

  if (!state) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3">
            <Clock className="w-7 h-7" />
            Tasks Today
          </h1>
          <p className="text-muted-foreground">
            {format(new Date(), 'EEEE, MMMM d, yyyy')}
          </p>
        </div>
        <div className="text-right">
          <div className="text-3xl font-bold text-primary">{totalPendingTasks}</div>
          <div className="text-sm text-muted-foreground">pending tasks</div>
        </div>
      </div>

      {/* All clear state */}
      {taskSections.length === 0 && (
        <div className="tile p-12 text-center">
          <CheckCircle className="w-20 h-20 mx-auto mb-4 text-green-500" />
          <h2 className="text-2xl font-bold mb-2">All Clear! 🎉</h2>
          <p className="text-lg text-muted-foreground">
            No pending tasks for today. Great job!
          </p>
        </div>
      )}

      {/* Task sections */}
      {taskSections.map((section) => (
        <div key={section.id} className="tile p-0 overflow-hidden">
          {/* Section header */}
          <button
            onClick={() => toggleSection(section.id)}
            className={`w-full p-4 flex items-center justify-between transition-colors ${
              section.priority === 'urgent' 
                ? 'bg-destructive/5' 
                : section.priority === 'high' 
                  ? 'bg-yellow-500/5' 
                  : 'bg-muted/30'
            }`}
          >
            <div className="flex items-center gap-3">
              <section.icon className={`w-6 h-6 ${
                section.priority === 'urgent' 
                  ? 'text-destructive' 
                  : section.priority === 'high' 
                    ? 'text-yellow-600' 
                    : 'text-primary'
              }`} />
              <span className="font-bold text-lg">{section.title}</span>
            </div>
            {collapsedSections[section.id] ? (
              <ChevronDown className="w-5 h-5 text-muted-foreground" />
            ) : (
              <ChevronUp className="w-5 h-5 text-muted-foreground" />
            )}
          </button>

          {/* Section items */}
          {!collapsedSections[section.id] && (
            <div className="divide-y divide-border">
              {section.items.map((item) => {
                const isCompleted = completedTasks.has(item.id);
                
                return (
                  <div 
                    key={item.id}
                    className={`p-4 flex items-center justify-between transition-all ${
                      isCompleted ? 'bg-green-50 opacity-60' : ''
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                        isCompleted 
                          ? 'bg-green-100' 
                          : item.type === 'tent' 
                            ? 'bg-primary/10' 
                            : 'bg-muted'
                      }`}>
                        {isCompleted ? (
                          <CheckCircle className="w-6 h-6 text-green-600" />
                        ) : item.type === 'tent' ? (
                          <Tent className="w-6 h-6 text-primary" />
                        ) : (
                          <ShowerHead className="w-6 h-6 text-muted-foreground" />
                        )}
                      </div>
                      <div>
                        <h4 className={`font-bold ${isCompleted ? 'line-through' : ''}`}>
                          {item.title}
                        </h4>
                        <p className="text-sm text-muted-foreground">{item.subtitle}</p>
                        {item.badge && !isCompleted && (
                          <span className={`inline-block text-xs font-semibold px-2 py-1 rounded-full mt-1 ${item.badgeColor}`}>
                            {item.badge}
                          </span>
                        )}
                      </div>
                    </div>
                    {item.onComplete && !isCompleted && (
                      <Button
                        onClick={() => markComplete(item.id, item.onComplete)}
                        variant="outline"
                        size="lg"
                        className="flex items-center gap-2"
                      >
                        <CheckCircle className="w-5 h-5" />
                        Done
                      </Button>
                    )}
                    {isCompleted && (
                      <span className="text-green-600 font-semibold">✓ Completed</span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default TasksToday;
