import React from 'react';
import { useVillage } from '@/context/VillageContext';
import { NeighborhoodTile } from '@/components/NeighborhoodTile';
import { ActionTile } from '@/components/ActionTile';
import { NeighborhoodId } from '@/types/village';
import { 
  Calendar, 
  Bath, 
  UtensilsCrossed, 
  CalendarDays, 
  Tent,
  Loader2
} from 'lucide-react';

const neighborhoodOrder: NeighborhoodId[] = ['N1', 'N2', 'N3', 'N4', 'N5', 'N6', 'N7', 'VIP'];

const Index = () => {
  const { state, isLoading, getNeighborhoodSummary, getTodaySummary } = useVillage();

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

      <main className="container py-8">
        {/* Today's Quick Actions */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
            <CalendarDays className="w-8 h-8" />
            Today's Overview
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <ActionTile
              title="Check-ins"
              icon={Calendar}
              to="/today"
              count={todaySummary.checkIns.length}
              variant={todaySummary.checkIns.length > 0 ? 'success' : 'default'}
            />
            <ActionTile
              title="Check-outs"
              icon={Calendar}
              to="/today"
              count={todaySummary.checkOuts.length}
            />
            <ActionTile
              title="Needs Cleaning"
              icon={Tent}
              to="/today"
              count={todaySummary.tentsToCleaning.length}
              variant={todaySummary.tentsToCleaning.length > 0 ? 'warning' : 'default'}
            />
            <ActionTile
              title="Facilities Alert"
              icon={Bath}
              to="/facilities"
              count={todaySummary.facilitiesNeedAttention.length}
              variant={todaySummary.facilitiesNeedAttention.length > 0 ? 'danger' : 'default'}
            />
          </div>
        </section>

        {/* Neighborhoods Grid */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold mb-6">Neighborhoods</h2>
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

        {/* Quick Access */}
        <section>
          <h2 className="text-2xl font-bold mb-6">Quick Access</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <ActionTile
              title="Bathrooms & Showers"
              description="Manage all facilities"
              icon={Bath}
              to="/facilities"
            />
            <ActionTile
              title="Dining Facilities"
              description="Dining hall toilets & showers"
              icon={UtensilsCrossed}
              to="/facilities/dining"
            />
            <ActionTile
              title="Activities"
              description="Reserve spaces & view schedule"
              icon={CalendarDays}
              to="/activities"
            />
          </div>
        </section>

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
    </div>
  );
};

export default Index;
