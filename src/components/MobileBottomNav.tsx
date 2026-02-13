import React from 'react';
import { Home, CalendarDays, Tent, Sparkles, Wrench, ClipboardList, Moon, Flame, ShowerHead, StickyNote } from 'lucide-react';
import { cn } from '@/lib/utils';

export type MenuSection = 'overview' | 'calendar' | 'sleeping' | 'allocations' | 'neighborhoods' | 'facilities' | 'bathrooms' | 'maintenance' | 'housekeeping' | 'notes' | 'facilities-alert' | 'check-ins' | 'check-outs' | 'needs-cleaning';

interface MobileBottomNavProps {
  activeSection: MenuSection;
  onSectionChange: (section: MenuSection) => void;
  maintenanceCount?: number;
  housekeepingCount?: number;
  allocationsCount?: number;
  bathroomsCount?: number;
  notesCount?: number;
}

const navItems: { key: MenuSection; label: string; icon: React.ElementType }[] = [
  { key: 'overview', label: 'דף הבית', icon: Home },
  { key: 'sleeping', label: 'לינה', icon: Moon },
  { key: 'calendar', label: 'לוח שנה', icon: CalendarDays },
  { key: 'allocations', label: 'שיבוצים', icon: ClipboardList },
  { key: 'neighborhoods', label: 'שכונות', icon: Tent },
  { key: 'facilities', label: 'מתקנים', icon: Flame },
  { key: 'bathrooms', label: 'שירותים', icon: ShowerHead },
  { key: 'maintenance', label: 'תחזוקה', icon: Wrench },
  { key: 'housekeeping', label: 'משק בית', icon: Sparkles },
  { key: 'notes', label: 'הערות', icon: StickyNote },
];

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeSection,
  onSectionChange,
  maintenanceCount = 0,
  housekeepingCount = 0,
  allocationsCount = 0,
  bathroomsCount = 0,
  notesCount = 0,
}) => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t-2 border-border md:hidden bottom-nav relative">
      {/* Scroll fade indicators */}
      <div className="absolute left-0 top-0 bottom-0 w-6 bg-gradient-to-r from-card to-transparent pointer-events-none z-10" />
      <div className="absolute right-0 top-0 bottom-0 w-6 bg-gradient-to-l from-card to-transparent pointer-events-none z-10" />
      <div className="flex overflow-x-auto scrollbar-hide items-center py-2 px-1 gap-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeSection === item.key;
          const count = item.key === 'maintenance' ? maintenanceCount 
                      : item.key === 'housekeeping' ? housekeepingCount 
                      : item.key === 'allocations' ? allocationsCount
                      : item.key === 'bathrooms' ? bathroomsCount
                      : item.key === 'notes' ? notesCount
                      : 0;
          
          return (
            <button
              key={item.key}
              onClick={() => onSectionChange(item.key)}
              className={cn(
                'flex flex-col items-center justify-center min-w-[64px] min-h-[56px] px-3 py-2 rounded-xl transition-all relative touch-target flex-shrink-0',
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
