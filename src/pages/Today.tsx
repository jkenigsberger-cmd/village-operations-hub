import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useVillage } from '@/context/VillageContext';
import { useAdminGroups } from '@/hooks/useAdminGroups';
import { useKitchenData } from '@/hooks/useKitchenData';
import { BreadcrumbNav } from '@/components/BreadcrumbNav';
import { TentCard } from '@/components/TentCard';
import { FacilityTile } from '@/components/FacilityCard';
import { DailyTasksCalendar } from '@/components/DailyTasksCalendar';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { TentSummary } from '@/types/village';
import { format, isToday, addDays, subDays } from 'date-fns';
import { es, he } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { 
  Calendar as CalendarIcon, 
  CalendarCheck, 
  Sparkles, 
  AlertTriangle,
  Loader2,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Sun,
  Users,
  Clock,
  Building2,
  ChefHat
} from 'lucide-react';

const Today = () => {
  const { state, isLoading, getTodaySummary, getTentSummary } = useVillage();
  const { getDayUseGroupsForDate } = useAdminGroups();
  const { getTimeSlotsForDate } = useKitchenData();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  // Get summary for selected date
  const summaryForDate = useMemo(() => {
    if (!state) return { checkIns: [], checkOuts: [] };

    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    const checkIns: TentSummary[] = [];
    const checkOuts: TentSummary[] = [];

    for (const tent of Object.values(state.tents)) {
      const summary = getTentSummary(tent.id);
      if (!summary) continue;

      if (tent.checkInDate === dateStr) {
        checkIns.push(summary);
      }

      if (tent.checkOutDate === dateStr) {
        checkOuts.push(summary);
      }
    }

    return { checkIns, checkOuts };
  }, [state, selectedDate, getTentSummary]);

  // Get day-use groups for selected date
  const dayUseGroups = useMemo(() => {
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    return getDayUseGroupsForDate(dateStr);
  }, [selectedDate, getDayUseGroupsForDate]);

  // Get meals for day-use groups today
  const getMealsForGroup = (groupName: string) => {
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    const slots = getTimeSlotsForDate(dateStr);
    return slots.filter(slot => 
      slot.groups.some(g => g.name === groupName)
    );
  };

  if (isLoading || !state) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  const todaySummary = getTodaySummary();
  const isViewingToday = isToday(selectedDate);
  
  const formattedDate = format(selectedDate, "EEEE, d 'de' MMMM yyyy", { locale: es });

  const goToPreviousDay = () => setSelectedDate(prev => subDays(prev, 1));
  const goToNextDay = () => setSelectedDate(prev => addDays(prev, 1));
  const goToToday = () => setSelectedDate(new Date());

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b-2 border-border">
        <div className="container py-6">
          <BreadcrumbNav items={[{ label: 'Tareas Hoy' }]} />
          <h1 className="text-3xl md:text-4xl font-bold">Operaciones del Día</h1>
          <p className="text-xl text-muted-foreground mt-2 capitalize">{formattedDate}</p>
        </div>
      </header>

      <main className="container py-8 space-y-10">
        {/* Daily Tasks Calendar */}
        <DailyTasksCalendar />

        {/* Date Selector for Check-ins/Check-outs */}
        <section className="tile p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <CalendarIcon className="w-7 h-7" />
                Ver Check-ins / Check-outs
              </h2>
              <p className="text-muted-foreground mt-1">
                Selecciona una fecha para prepararte con anticipación
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={goToPreviousDay}
                className="h-12 w-12"
              >
                <ChevronLeft className="w-6 h-6" />
              </Button>

              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "h-12 px-4 text-lg font-medium min-w-[200px] justify-center",
                      !isViewingToday && "border-primary text-primary"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-5 w-5" />
                    {isViewingToday ? 'Hoy' : format(selectedDate, 'd MMM yyyy', { locale: es })}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="center">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => date && setSelectedDate(date)}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>

              <Button
                variant="outline"
                size="icon"
                onClick={goToNextDay}
                className="h-12 w-12"
              >
                <ChevronRight className="w-6 h-6" />
              </Button>

              {!isViewingToday && (
                <Button
                  variant="secondary"
                  onClick={goToToday}
                  className="h-12 px-4 text-lg"
                >
                  Ir a Hoy
                </Button>
              )}
            </div>
          </div>
        </section>

        {/* Check-ins for Selected Date */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-status-reserved rounded-xl">
              <CalendarIcon className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">
                Check-ins {isViewingToday ? 'Hoy' : format(selectedDate, "d 'de' MMMM", { locale: es })}
              </h2>
              <p className="text-muted-foreground">{summaryForDate.checkIns.length} grupos llegando</p>
            </div>
          </div>
          
          {summaryForDate.checkIns.length === 0 ? (
            <div className="tile p-8 text-center text-muted-foreground">
              <CalendarIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p className="text-xl">Sin check-ins {isViewingToday ? 'hoy' : 'en esta fecha'}</p>
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

        {/* Check-outs for Selected Date */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-muted rounded-xl">
              <CalendarCheck className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">
                Check-outs {isViewingToday ? 'Hoy' : format(selectedDate, "d 'de' MMMM", { locale: es })}
              </h2>
              <p className="text-muted-foreground">{summaryForDate.checkOuts.length} grupos saliendo</p>
            </div>
          </div>
          
          {summaryForDate.checkOuts.length === 0 ? (
            <div className="tile p-8 text-center text-muted-foreground">
              <CalendarCheck className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p className="text-xl">Sin check-outs {isViewingToday ? 'hoy' : 'en esta fecha'}</p>
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

        {/* Day-Use Groups Section */}
        {dayUseGroups.length > 0 && (
          <section>
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-amber-100 dark:bg-amber-900/30 rounded-xl">
                <Sun className="w-8 h-8 text-amber-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">
                  פעילויות יום (ללא לינה)
                </h2>
                <p className="text-muted-foreground">{dayUseGroups.length} קבוצות יום</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {dayUseGroups.map((group) => {
                const groupMeals = getMealsForGroup(group.groupName);
                const specialCount = groupMeals.reduce((acc, slot) => {
                  const { vegetarian, vegan, glutenFree, lactoseFree, allergies } = slot.specialDiets;
                  return acc + vegetarian + vegan + glutenFree + lactoseFree + allergies;
                }, 0);

                return (
                  <Card key={group.id} className="border-amber-200 dark:border-amber-800">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-bold text-lg">{group.groupName}</h3>
                          <p className="text-sm text-muted-foreground flex items-center gap-1">
                            <Users className="w-4 h-4" />
                            {group.pax} משתתפים
                          </p>
                        </div>
                        <Sun className="w-5 h-5 text-amber-500" />
                      </div>

                      {/* Time window */}
                      {(group.arrivalTime || group.departureTime) && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                          <Clock className="w-4 h-4" />
                          <span>{group.arrivalTime || '09:00'} - {group.departureTime || '17:00'}</span>
                        </div>
                      )}

                      {/* Space bookings indicator */}
                      {group.linkedSpaceReservationIds && group.linkedSpaceReservationIds.length > 0 && (
                        <div className="flex items-center gap-2 text-sm mb-2">
                          <Building2 className="w-4 h-4 text-primary" />
                          <span>{group.linkedSpaceReservationIds.length} הזמנות מרחבים</span>
                        </div>
                      )}

                      {/* Meals indicator */}
                      {groupMeals.length > 0 && (
                        <div className="flex items-center gap-2 text-sm">
                          <ChefHat className="w-4 h-4 text-amber-600" />
                          <span>{groupMeals.length} ארוחות</span>
                          {specialCount > 0 && (
                            <span className="text-amber-600 font-medium">⚠️ {specialCount} מיוחדים</span>
                          )}
                        </div>
                      )}

                      {/* Notes */}
                      {group.notes && (
                        <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{group.notes}</p>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </section>
        )}

        {/* Tents Needing Cleaning (only show if viewing today) */}
        {isViewingToday && (
          <section>
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-status-dirty rounded-xl">
                <Sparkles className="w-8 h-8" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Carpas para Limpiar</h2>
                <p className="text-muted-foreground">{todaySummary.tentsToCleaning.length} carpas por limpiar</p>
              </div>
            </div>
            
            {todaySummary.tentsToCleaning.length === 0 ? (
              <div className="tile p-8 text-center bg-status-clean/10 border-status-clean">
                <Sparkles className="w-12 h-12 mx-auto mb-3 text-status-clean" />
                <p className="text-xl font-medium">¡Todas las carpas están limpias! ✨</p>
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

        {/* Facilities Needing Attention (only show if viewing today) */}
        {isViewingToday && (
          <section>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-destructive/20 rounded-xl">
                  <AlertTriangle className="w-8 h-8 text-destructive" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">Instalaciones que Necesitan Atención</h2>
                  <p className="text-muted-foreground">
                    {todaySummary.facilitiesNeedAttention.length} instalaciones requieren atención
                  </p>
                </div>
              </div>
              <Link 
                to="/facilities"
                className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl font-semibold hover:bg-primary/90 transition-colors"
              >
                Ver Todas
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
            
            {todaySummary.facilitiesNeedAttention.length === 0 ? (
              <div className="tile p-8 text-center bg-status-clean/10 border-status-clean">
                <AlertTriangle className="w-12 h-12 mx-auto mb-3 text-status-clean" />
                <p className="text-xl font-medium">¡Todas las instalaciones funcionando! ✓</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {todaySummary.facilitiesNeedAttention.slice(0, 8).map((facility) => (
                  <FacilityTile
                    key={facility.id}
                    facility={facility}
                    onClick={() => {}}
                  />
                ))}
              </div>
            )}
          </section>
        )}
      </main>
    </div>
  );
};

export default Today;
