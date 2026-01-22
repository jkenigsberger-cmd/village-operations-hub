import React, { useState, useMemo } from 'react';
import { VillageState } from '@/types/village';
import { cn } from '@/lib/utils';
import { Users, Tent, MapPin, Pencil, ChevronDown, Check } from 'lucide-react';

export interface ActiveGroup {
  groupName: string;
  source: 'neighborhood' | 'tent';
  location: string;
  checkInDate: string;
  checkOutDate: string;
  totalBeds?: number;
}

interface GroupSelectorProps {
  date: string;
  selectedGroup: string;
  onSelectGroup: (groupName: string, activeGroup?: ActiveGroup) => void;
  state: VillageState | null;
  allowCustom?: boolean;
  placeholder?: string;
  className?: string;
}

// Helper function to get active groups from state
export const getActiveGroupsForDate = (state: VillageState | null, date: string): ActiveGroup[] => {
  if (!state) return [];

  const groups: ActiveGroup[] = [];
  const seenGroups = new Set<string>();

  // Check neighborhood reservations
  Object.values(state.neighborhoodReservations || {}).forEach(reservation => {
    if (
      reservation.checkInDate <= date && 
      reservation.checkOutDate > date &&
      !seenGroups.has(reservation.groupName)
    ) {
      const neighborhood = state.neighborhoods[reservation.neighborhoodId];
      groups.push({
        groupName: reservation.groupName,
        source: 'neighborhood',
        location: neighborhood?.displayName || reservation.neighborhoodId,
        checkInDate: reservation.checkInDate,
        checkOutDate: reservation.checkOutDate,
        totalBeds: reservation.totalBeds,
      });
      seenGroups.add(reservation.groupName);
    }
  });

  // Check individual tents with group assignments
  Object.values(state.tents).forEach(tent => {
    if (
      tent.groupName &&
      tent.checkInDate &&
      tent.checkOutDate &&
      tent.checkInDate <= date &&
      tent.checkOutDate > date &&
      !seenGroups.has(tent.groupName)
    ) {
      // Count beds for this group across all tents
      const tentCount = Object.values(state.tents).filter(
        t => t.groupName === tent.groupName &&
             t.checkInDate === tent.checkInDate &&
             t.checkOutDate === tent.checkOutDate
      ).length;

      const totalBeds = Object.values(state.tents)
        .filter(t => t.groupName === tent.groupName)
        .reduce((sum, t) => sum + t.beds.length, 0);

      const neighborhood = state.neighborhoods[tent.neighborhoodId];
      groups.push({
        groupName: tent.groupName,
        source: 'tent',
        location: tentCount > 1 
          ? `${tentCount} carpas en ${neighborhood?.displayName || tent.neighborhoodId}`
          : tent.code,
        checkInDate: tent.checkInDate,
        checkOutDate: tent.checkOutDate,
        totalBeds,
      });
      seenGroups.add(tent.groupName);
    }
  });

  // Sort by group name
  return groups.sort((a, b) => a.groupName.localeCompare(b.groupName));
};

export const GroupSelector: React.FC<GroupSelectorProps> = ({
  date,
  selectedGroup,
  onSelectGroup,
  state,
  allowCustom = true,
  placeholder = 'Seleccionar grupo...',
  className,
}) => {
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customValue, setCustomValue] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  // Get active groups for the selected date
  const activeGroups = useMemo(() => getActiveGroupsForDate(state, date), [state, date]);

  const handleSelectGroup = (group: ActiveGroup) => {
    onSelectGroup(group.groupName, group);
    setIsOpen(false);
    setShowCustomInput(false);
  };

  const handleCustomSubmit = () => {
    if (customValue.trim()) {
      onSelectGroup(customValue.trim());
      setIsOpen(false);
      setShowCustomInput(false);
      setCustomValue('');
    }
  };

  const handleSwitchToCustom = () => {
    setShowCustomInput(true);
    setCustomValue(selectedGroup);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('es', { day: 'numeric', month: 'short' });
  };

  return (
    <div className={cn('relative', className)}>
      {/* Main trigger button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'w-full px-4 py-3 text-left rounded-xl border-2 border-input bg-background',
          'flex items-center justify-between gap-2',
          'hover:border-primary/50 focus:outline-none focus:border-primary transition-colors',
          'text-base'
        )}
      >
        <span className={cn(!selectedGroup && 'text-muted-foreground')}>
          {selectedGroup || placeholder}
        </span>
        <ChevronDown className={cn('w-5 h-5 text-muted-foreground transition-transform', isOpen && 'rotate-180')} />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => {
              setIsOpen(false);
              setShowCustomInput(false);
            }}
          />

          <div className="absolute z-50 w-full mt-2 bg-background border-2 border-border rounded-xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
            {/* Custom input mode */}
            {showCustomInput ? (
              <div className="p-3 space-y-3">
                <input
                  type="text"
                  value={customValue}
                  onChange={(e) => setCustomValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleCustomSubmit();
                    if (e.key === 'Escape') {
                      setShowCustomInput(false);
                      setCustomValue('');
                    }
                  }}
                  placeholder="Nombre del grupo visitante..."
                  className="w-full px-4 py-3 text-base rounded-lg border-2 border-input bg-background focus:outline-none focus:border-primary"
                  autoFocus
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCustomInput(false);
                      setCustomValue('');
                    }}
                    className="flex-1 px-3 py-2 text-sm font-medium bg-muted rounded-lg hover:bg-muted/80"
                  >
                    ← Volver
                  </button>
                  <button
                    type="button"
                    onClick={handleCustomSubmit}
                    disabled={!customValue.trim()}
                    className="flex-1 px-3 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50"
                  >
                    Confirmar
                  </button>
                </div>
              </div>
            ) : (
              <>
                {/* Hosted groups section */}
                {activeGroups.length > 0 && (
                  <div className="p-2">
                    <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                      <Tent className="w-3.5 h-3.5" />
                      Grupos Hospedados ({activeGroups.length})
                    </div>
                    <div className="space-y-1 mt-1 max-h-[200px] overflow-y-auto">
                      {activeGroups.map((group) => (
                        <button
                          key={group.groupName}
                          type="button"
                          onClick={() => handleSelectGroup(group)}
                          className={cn(
                            'w-full p-3 text-left rounded-lg transition-colors',
                            'hover:bg-primary/10',
                            selectedGroup === group.groupName && 'bg-primary/10'
                          )}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-base">{group.groupName}</span>
                            {selectedGroup === group.groupName && (
                              <Check className="w-4 h-4 text-primary" />
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-0.5 text-sm text-muted-foreground">
                            <MapPin className="w-3.5 h-3.5" />
                            <span>{group.location}</span>
                            {group.totalBeds && (
                              <>
                                <span>•</span>
                                <Users className="w-3.5 h-3.5" />
                                <span>{group.totalBeds} camas</span>
                              </>
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground mt-0.5">
                            {formatDate(group.checkInDate)} - {formatDate(group.checkOutDate)}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Divider if we have groups */}
                {activeGroups.length > 0 && allowCustom && (
                  <div className="border-t-2 border-border" />
                )}

                {/* Custom option */}
                {allowCustom && (
                  <div className="p-2">
                    <button
                      type="button"
                      onClick={handleSwitchToCustom}
                      className="w-full p-3 text-left rounded-lg hover:bg-muted/50 transition-colors flex items-center gap-3"
                    >
                      <Pencil className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <div className="font-medium text-base">Escribir nombre personalizado</div>
                        <div className="text-sm text-muted-foreground">
                          Para grupos visitantes no hospedados
                        </div>
                      </div>
                    </button>
                  </div>
                )}

                {/* Empty state */}
                {activeGroups.length === 0 && allowCustom && (
                  <div className="p-4 text-center text-muted-foreground">
                    <Tent className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No hay grupos hospedados para esta fecha</p>
                  </div>
                )}
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
};
