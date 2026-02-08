import React from 'react';
import { Home, CalendarDays, Tent, Sparkles, Wrench, ClipboardList } from 'lucide-react';
import { cn } from '@/lib/utils';

export type MenuSection = 'overview' | 'calendar' | 'allocations' | 'neighborhoods' | 'facilities' | 'bathrooms' | 'maintenance' | 'housekeeping' | 'notes' | 'facilities-alert' | 'check-ins' | 'check-outs' | 'needs-cleaning';

interface MobileBottomNavProps {
  activeSection: MenuSection;
  onSectionChange: (section: MenuSection) => void;
  maintenanceCount?: number;
  housekeepingCount?: number;
  allocationsCount?: number;
}

const navItems: { key: MenuSection; label: string; icon: React.ElementType }[] = [
  { key: 'overview', label: 'סקירה', icon: Home },
  { key: 'calendar', label: 'יומן', icon: CalendarDays },
  { key: 'allocations', label: 'שיבוצים', icon: ClipboardList },
  { key: 'neighborhoods', label: 'שכונות', icon: Tent },
  { key: 'housekeeping', label: 'ניקיון', icon: Sparkles },
  { key: 'maintenance', label: 'תחזוקה', icon: Wrench },
];

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeSection,
  onSectionChange,
  maintenanceCount = 0,
  housekeepingCount = 0,
  allocationsCount = 0,
}) => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t-2 border-border md:hidden bottom-nav">
      <div className="flex justify-around items-center py-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeSection === item.key;
          const count = item.key === 'maintenance' ? maintenanceCount 
                      : item.key === 'housekeeping' ? housekeepingCount 
                      : item.key === 'allocations' ? allocationsCount
                      : 0;
          
          return (
            <button
              key={item.key}
              onClick={() => onSectionChange(item.key)}
              className={cn(
                'flex flex-col items-center justify-center min-w-[64px] min-h-[56px] px-3 py-2 rounded-xl transition-all relative touch-target',
                isActive
                  ? 'text-primary bg-primary/10'
                  : 'text-muted-foreground'
              )}
            >
              <Icon className={cn('w-6 h-6', isActive && 'text-primary')} />
              <span className={cn(
                'text-xs mt-1 font-medium',
                isActive && 'text-primary font-semibold'
              )}>
                {item.label}
              </span>
              {count > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1.5 flex items-center justify-center bg-destructive text-destructive-foreground text-xs font-bold rounded-full">
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
