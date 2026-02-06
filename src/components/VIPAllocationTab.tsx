import React, { useState } from 'react';
import { GroupRecord, VIPTentConfig } from '@/types/adminGroups';
import { useGroupAllocation } from '@/hooks/useGroupAllocation';
import { VIPConfigCard } from './VIPConfigCard';
import { VIPTentSlot } from './VIPTentSlot';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { BedDouble } from 'lucide-react';

interface VIPAllocationTabProps {
  group: GroupRecord;
  onUpdate: () => void;
}

export const VIPAllocationTab: React.FC<VIPAllocationTabProps> = ({ group, onUpdate }) => {
  const { getUnassignedVIPConfigs, getAvailableVIPTents, assignVIPConfig } = useGroupAllocation();
  
  const [selectedConfig, setSelectedConfig] = useState<VIPTentConfig | null>(null);
  const [selectedTentCode, setSelectedTentCode] = useState<string | null>(null);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);

  const unassignedConfigs = getUnassignedVIPConfigs(group.id);
  const vipTentsAvailability = getAvailableVIPTents(group.startDate, group.endDate, group.id);

  // Get assigned configs for this group
  const assignedConfigs = group.vipTentConfigs?.filter(c => c.assignedTentCode) || [];

  const handleConfigClick = (config: VIPTentConfig) => {
    setSelectedConfig(config);
  };

  const handleTentClick = (tentCode: string, isAvailable: boolean) => {
    if (!isAvailable || !selectedConfig) return;
    
    setSelectedTentCode(tentCode);
    setConfirmModalOpen(true);
  };

  const handleConfirmAssignment = () => {
    if (!selectedConfig || !selectedTentCode) return;

    const success = assignVIPConfig(group.id, selectedConfig.id, selectedTentCode);
    
    if (success) {
      toast.success(`אוהל VIP ${selectedTentCode} שובץ בהצלחה`);
      setSelectedConfig(null);
      setSelectedTentCode(null);
      setConfirmModalOpen(false);
      onUpdate();
    } else {
      toast.error('שגיאה בשיבוץ האוהל');
    }
  };

  const totalBeds = selectedConfig 
    ? selectedConfig.bedsPlanned + (selectedConfig.hasExtraBed ? 1 : 0) 
    : 0;

  const genderLabel = selectedConfig?.gender === 'female' 
    ? '♀️ נקבה' 
    : selectedConfig?.gender === 'male' 
      ? '♂️ זכר' 
      : 'לא הוגדר';

  return (
    <div className="space-y-6">
      {/* Unassigned Configs Section */}
      <div>
        <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <BedDouble className="w-5 h-5" />
          תצורות צוות ממתינות לשיבוץ
          {unassignedConfigs.length > 0 && (
            <span className="text-sm font-normal text-muted-foreground">
              (לחץ לבחירה)
            </span>
          )}
        </h3>
        
        {unassignedConfigs.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground bg-muted/30 rounded-xl">
            {assignedConfigs.length > 0 
              ? 'כל תצורות הצוות שובצו ✓' 
              : 'אין תצורות VIP מוגדרות לקבוצה זו'}
          </div>
        ) : (
          <div className="flex flex-wrap gap-3">
            {unassignedConfigs.map((config, index) => (
              <VIPConfigCard
                key={config.id}
                config={config}
                index={index}
                isSelected={selectedConfig?.id === config.id}
                onClick={() => handleConfigClick(config)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Assigned Configs Summary */}
      {assignedConfigs.length > 0 && (
        <div className="p-4 bg-green-50 dark:bg-green-950/20 rounded-xl border border-green-200 dark:border-green-800">
          <h4 className="font-medium text-green-700 dark:text-green-300 mb-2">
            תצורות שובצו ({assignedConfigs.length})
          </h4>
          <div className="flex flex-wrap gap-2 text-sm">
            {assignedConfigs.map(config => (
              <span 
                key={config.id} 
                className="px-3 py-1 bg-green-200/50 dark:bg-green-800/30 rounded-full"
              >
                VIP {config.assignedTentCode} • {config.bedsPlanned + (config.hasExtraBed ? 1 : 0)} מיטות
              </span>
            ))}
          </div>
        </div>
      )}

      {/* VIP Tents Grid */}
      <div>
        <h3 className="text-lg font-semibold mb-3">
          אוהלי VIP זמינים (80-89)
          {selectedConfig && (
            <span className="text-sm font-normal text-primary mr-2">
              ← בחר אוהל לשיבוץ
            </span>
          )}
        </h3>
        
        <div className="grid grid-cols-5 gap-3">
          {vipTentsAvailability.map(({ tentCode, available, conflictingGroup }) => {
            const isAssignedToCurrentGroup = assignedConfigs.some(
              c => c.assignedTentCode === tentCode
            );
            
            return (
              <VIPTentSlot
                key={tentCode}
                tentCode={tentCode}
                isAvailable={available}
                conflictingGroup={conflictingGroup}
                isAssignedToCurrentGroup={isAssignedToCurrentGroup}
                onClick={() => handleTentClick(tentCode, available)}
                disabled={!selectedConfig}
              />
            );
          })}
        </div>
      </div>

      {/* Confirm Assignment Modal */}
      <Dialog open={confirmModalOpen} onOpenChange={setConfirmModalOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>שיבוץ תצורה לאוהל VIP</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-3 py-4">
            <div className="flex justify-between">
              <span className="text-muted-foreground">תצורה:</span>
              <span className="font-medium">
                אוהל {unassignedConfigs.findIndex(c => c.id === selectedConfig?.id) + 1}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">מיטות:</span>
              <span className="font-medium">{totalBeds}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">מגדר:</span>
              <span className="font-medium">{genderLabel}</span>
            </div>
            <div className="flex justify-between text-lg">
              <span className="text-muted-foreground">שיבוץ לאוהל:</span>
              <span className="font-bold text-primary">VIP {selectedTentCode}</span>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setConfirmModalOpen(false)}>
              ביטול
            </Button>
            <Button onClick={handleConfirmAssignment}>
              שבץ ✓
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
