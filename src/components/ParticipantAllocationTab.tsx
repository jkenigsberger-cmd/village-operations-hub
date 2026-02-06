import React, { useState } from 'react';
import { GroupRecord } from '@/types/adminGroups';
import { useVillage } from '@/context/VillageContext';
import { useGroupAllocation } from '@/hooks/useGroupAllocation';
import { useAdminGroups } from '@/hooks/useAdminGroups';
import { NeighborhoodId } from '@/types/village';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Home, Lock, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ParticipantAllocationTabProps {
  group: GroupRecord;
  onUpdate: () => void;
}

const NEIGHBORHOOD_IDS: NeighborhoodId[] = ['N1', 'N2', 'N3', 'N4', 'N5', 'N6', 'N7'];

export const ParticipantAllocationTab: React.FC<ParticipantAllocationTabProps> = ({ group, onUpdate }) => {
  const { state } = useVillage();
  const { isNeighborhoodAvailableForGroup, addAllocation, allocations } = useGroupAllocation();
  const { updateGroup } = useAdminGroups();
  
  const [selectedNeighborhood, setSelectedNeighborhood] = useState<NeighborhoodId | null>(null);
  const [bedsToAssign, setBedsToAssign] = useState<number>(0);
  const [modalOpen, setModalOpen] = useState(false);

  if (!state) return null;

  const remainingParticipants = group.remainingParticipants ?? group.participantCount ?? (group.pax - (group.staffCount || 0));

  // Get current allocations for this group
  const groupAllocations = allocations.filter(
    a => a.groupId === group.id && a.allocationType === 'NEIGHBORHOOD'
  );

  const handleNeighborhoodClick = (nId: NeighborhoodId) => {
    const neighborhood = state.neighborhoods[nId];
    if (!neighborhood) return;

    const availability = isNeighborhoodAvailableForGroup(nId, group.id, group.startDate, group.endDate);
    if (!availability.available) {
      toast.error(`שכונה נעולה ל: ${availability.conflictingGroup}`);
      return;
    }

    // Check if already allocated to this group
    const existingAllocation = groupAllocations.find(a => a.resourceId === nId);
    if (existingAllocation) {
      toast.info('שכונה זו כבר שובצה לקבוצה');
      return;
    }

    // Calculate neighborhood capacity
    const capacity = neighborhood.tentIds.reduce((sum, tentId) => {
      const tent = state.tents[tentId];
      return sum + (tent?.beds.length || 0);
    }, 0);

    setSelectedNeighborhood(nId);
    setBedsToAssign(Math.min(capacity, remainingParticipants));
    setModalOpen(true);
  };

  const handleAssign = () => {
    if (!selectedNeighborhood || bedsToAssign <= 0) return;

    const neighborhood = state.neighborhoods[selectedNeighborhood];
    if (!neighborhood) return;

    // Validate beds count
    if (bedsToAssign > remainingParticipants) {
      toast.error(`לא ניתן לשבץ יותר מ-${remainingParticipants} חניכים`);
      return;
    }

    // Add allocation
    const success = addAllocation(
      group.id,
      'NEIGHBORHOOD',
      selectedNeighborhood,
      neighborhood.displayName,
      bedsToAssign,
      group.startDate,
      group.endDate
    );

    if (success) {
      toast.success(`${neighborhood.displayName} שובצה עם ${bedsToAssign} מיטות`);
      setModalOpen(false);
      setSelectedNeighborhood(null);
      onUpdate();
    } else {
      toast.error('שגיאה בשיבוץ השכונה');
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold flex items-center gap-2">
        <Home className="w-5 h-5" />
        שכונות זמינות לחניכים
      </h3>

      {/* Already allocated neighborhoods */}
      {groupAllocations.length > 0 && (
        <div className="p-4 bg-green-50 dark:bg-green-950/20 rounded-xl border border-green-200 dark:border-green-800 mb-4">
          <h4 className="font-medium text-green-700 dark:text-green-300 mb-2">
            שכונות שובצו ({groupAllocations.length})
          </h4>
          <div className="flex flex-wrap gap-2 text-sm">
            {groupAllocations.map(alloc => (
              <span 
                key={alloc.id} 
                className="px-3 py-1 bg-green-200/50 dark:bg-green-800/30 rounded-full"
              >
                {alloc.resourceLabel} • {alloc.bedsAssigned} מיטות
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Neighborhoods list */}
      <div className="space-y-3">
        {NEIGHBORHOOD_IDS.map(nId => {
          const neighborhood = state.neighborhoods[nId];
          if (!neighborhood) return null;

          const availability = isNeighborhoodAvailableForGroup(nId, group.id, group.startDate, group.endDate);
          const capacity = neighborhood.tentIds.reduce((sum, tentId) => {
            const tent = state.tents[tentId];
            return sum + (tent?.beds.length || 0);
          }, 0);
          
          const isAllocatedToThisGroup = groupAllocations.some(a => a.resourceId === nId);

          return (
            <Card 
              key={nId}
              className={cn(
                'transition-all',
                availability.available && !isAllocatedToThisGroup && 'hover:shadow-md cursor-pointer',
                isAllocatedToThisGroup && 'border-green-400 bg-green-50/50 dark:bg-green-950/10',
                !availability.available && !isAllocatedToThisGroup && 'opacity-60'
              )}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {isAllocatedToThisGroup ? (
                      <div className="w-10 h-10 rounded-xl bg-green-500 text-white flex items-center justify-center">
                        <Check className="w-5 h-5" />
                      </div>
                    ) : !availability.available ? (
                      <div className="w-10 h-10 rounded-xl bg-muted text-muted-foreground flex items-center justify-center">
                        <Lock className="w-5 h-5" />
                      </div>
                    ) : (
                      <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                        <Home className="w-5 h-5" />
                      </div>
                    )}
                    
                    <div>
                      <h4 className="font-bold">{neighborhood.displayName}</h4>
                      <p className="text-sm text-muted-foreground">
                        {capacity} מיטות • {neighborhood.tentIds.length} אוהלים
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {isAllocatedToThisGroup ? (
                      <Badge variant="default" className="bg-green-500">שובץ ✓</Badge>
                    ) : !availability.available ? (
                      <Badge variant="secondary">נעול: {availability.conflictingGroup}</Badge>
                    ) : (
                      <Button 
                        size="sm"
                        onClick={() => handleNeighborhoodClick(nId)}
                        disabled={remainingParticipants <= 0}
                      >
                        שבץ שכונה
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Assignment Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>
              שיבוץ {selectedNeighborhood && state.neighborhoods[selectedNeighborhood]?.displayName}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">קיבולת השכונה:</span>
              <span className="font-medium">
                {selectedNeighborhood && state.neighborhoods[selectedNeighborhood]?.tentIds.reduce((sum, tentId) => {
                  const tent = state.tents[tentId];
                  return sum + (tent?.beds.length || 0);
                }, 0)} מיטות
              </span>
            </div>
            
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">חניכים נשאר:</span>
              <span className="font-medium">{remainingParticipants}</span>
            </div>

            <div className="space-y-2">
              <Label htmlFor="beds">כמות מיטות לשיבוץ:</Label>
              <Input
                id="beds"
                type="number"
                min={1}
                max={remainingParticipants}
                value={bedsToAssign}
                onChange={(e) => setBedsToAssign(Math.max(1, parseInt(e.target.value) || 0))}
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setModalOpen(false)}>
              ביטול
            </Button>
            <Button 
              onClick={handleAssign}
              disabled={bedsToAssign <= 0 || bedsToAssign > remainingParticipants}
            >
              שבץ ✓
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
