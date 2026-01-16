import React from 'react';
import { Link } from 'react-router-dom';
import { useVillage } from '@/context/VillageContext';
import { BreadcrumbNav } from '@/components/BreadcrumbNav';
import { TentCard } from '@/components/TentCard';
import { FacilityTile } from '@/components/FacilityCard';
import { DailyTasksCalendar } from '@/components/DailyTasksCalendar';
import { 
  Calendar, 
  CalendarCheck, 
  Sparkles, 
  AlertTriangle,
  Loader2,
  ArrowRight
} from 'lucide-react';

const Today = () => {
  const { state, isLoading, getTodaySummary } = useVillage();

  if (isLoading || !state) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  const summary = getTodaySummary();
  const today = new Date().toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b-2 border-border">
        <div className="container py-6">
          <BreadcrumbNav items={[{ label: 'Today' }]} />
          <h1 className="text-3xl md:text-4xl font-bold">Today's Operations</h1>
          <p className="text-xl text-muted-foreground mt-2">{today}</p>
        </div>
      </header>

      <main className="container py-8 space-y-10">
        {/* Daily Tasks Calendar */}
        <DailyTasksCalendar />

        {/* Check-ins Today */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-status-reserved rounded-xl">
              <Calendar className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Check-ins Today</h2>
              <p className="text-muted-foreground">{summary.checkIns.length} groups arriving</p>
            </div>
          </div>
          
          {summary.checkIns.length === 0 ? (
            <div className="tile p-8 text-center text-muted-foreground">
              <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p className="text-xl">No check-ins today</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {summary.checkIns.map((tent) => (
                <TentCard
                  key={tent.tentId}
                  summary={tent}
                  to={`/tent/${tent.tentId}`}
                />
              ))}
            </div>
          )}
        </section>

        {/* Check-outs Today */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-muted rounded-xl">
              <CalendarCheck className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Check-outs Today</h2>
              <p className="text-muted-foreground">{summary.checkOuts.length} groups leaving</p>
            </div>
          </div>
          
          {summary.checkOuts.length === 0 ? (
            <div className="tile p-8 text-center text-muted-foreground">
              <CalendarCheck className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p className="text-xl">No check-outs today</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {summary.checkOuts.map((tent) => (
                <TentCard
                  key={tent.tentId}
                  summary={tent}
                  to={`/tent/${tent.tentId}`}
                />
              ))}
            </div>
          )}
        </section>

        {/* Tents Needing Cleaning */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-status-dirty rounded-xl">
              <Sparkles className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Tents Needing Cleaning</h2>
              <p className="text-muted-foreground">{summary.tentsToCleaning.length} tents to clean</p>
            </div>
          </div>
          
          {summary.tentsToCleaning.length === 0 ? (
            <div className="tile p-8 text-center bg-status-clean/10 border-status-clean">
              <Sparkles className="w-12 h-12 mx-auto mb-3 text-status-clean" />
              <p className="text-xl font-medium">All tents are clean! ✨</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {summary.tentsToCleaning.map((tent) => (
                <TentCard
                  key={tent.tentId}
                  summary={tent}
                  to={`/tent/${tent.tentId}`}
                />
              ))}
            </div>
          )}
        </section>

        {/* Facilities Needing Attention */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-destructive/20 rounded-xl">
                <AlertTriangle className="w-8 h-8 text-destructive" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Facilities Needing Attention</h2>
                <p className="text-muted-foreground">
                  {summary.facilitiesNeedAttention.length} facilities need attention
                </p>
              </div>
            </div>
            <Link 
              to="/facilities"
              className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl font-semibold hover:bg-primary/90 transition-colors"
            >
              View All
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
          
          {summary.facilitiesNeedAttention.length === 0 ? (
            <div className="tile p-8 text-center bg-status-clean/10 border-status-clean">
              <AlertTriangle className="w-12 h-12 mx-auto mb-3 text-status-clean" />
              <p className="text-xl font-medium">All facilities working properly! ✓</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {summary.facilitiesNeedAttention.slice(0, 8).map((facility) => (
                <FacilityTile
                  key={facility.id}
                  facility={facility}
                  onClick={() => {}}
                />
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

export default Today;
