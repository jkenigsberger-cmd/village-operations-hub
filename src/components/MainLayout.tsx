import React, { useState } from 'react';
import { useVillage } from '@/context/VillageContext';
import { 
  Tent, 
  ClipboardList, 
  CalendarDays, 
  Map, 
  Settings,
  Loader2
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

interface MainLayoutProps {
  children: React.ReactNode;
}

type TabId = 'tasks' | 'reservations' | 'neighborhoods' | 'settings';

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const { state, isLoading, getTodaySummary } = useVillage();
  const location = useLocation();

  // Determine active tab from route
  const getActiveTab = (): TabId => {
    if (location.pathname === '/' || location.pathname === '/tasks') return 'tasks';
    if (location.pathname === '/reservations') return 'reservations';
    if (location.pathname.startsWith('/neighborhood')) return 'neighborhoods';
    if (location.pathname === '/settings') return 'settings';
    return 'tasks';
  };

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
  const pendingTasksCount = 
    todaySummary.tentsToCleaning.length + 
    todaySummary.facilitiesNeedAttention.length;

  const tabs = [
    { 
      id: 'tasks' as TabId, 
      label: 'Tasks Today', 
      icon: ClipboardList, 
      to: '/',
      count: pendingTasksCount 
    },
    { 
      id: 'reservations' as TabId, 
      label: 'Reservations', 
      icon: CalendarDays, 
      to: '/reservations' 
    },
    { 
      id: 'neighborhoods' as TabId, 
      label: 'Neighborhoods', 
      icon: Map, 
      to: '/neighborhoods' 
    },
    { 
      id: 'settings' as TabId, 
      label: 'Settings', 
      icon: Settings, 
      to: '/settings' 
    },
  ];

  const activeTab = getActiveTab();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b-2 border-border sticky top-0 z-10">
        <div className="container py-4">
          <div className="flex items-center gap-3">
            <Tent className="w-8 h-8 text-primary" />
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                Aharonson Farm
              </h1>
              <p className="text-sm text-muted-foreground">
                Glow Glamping & Ha-Dor Ha-Ba
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="bg-card border-b border-border sticky top-[76px] z-10">
        <div className="container">
          <div className="flex overflow-x-auto gap-1 py-2">
            {tabs.map((tab) => (
              <Link
                key={tab.id}
                to={tab.to}
                className={`flex items-center gap-2 px-4 py-3 rounded-xl font-semibold whitespace-nowrap transition-all ${
                  activeTab === tab.id
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted/50 text-muted-foreground hover:bg-muted'
                }`}
              >
                <tab.icon className="w-5 h-5" />
                {tab.label}
                {tab.count !== undefined && tab.count > 0 && (
                  <span className="ml-1 px-2 py-0.5 text-xs rounded-full bg-destructive text-destructive-foreground">
                    {tab.count}
                  </span>
                )}
              </Link>
            ))}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="container py-6">
        {children}
      </main>
    </div>
  );
};

export default MainLayout;
