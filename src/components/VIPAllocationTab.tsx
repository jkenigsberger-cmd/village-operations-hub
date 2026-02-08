import React, { useState } from 'react';
import { GroupRecord, VIPTentConfig } from '@/types/adminGroups';
import { useGroupAllocation } from '@/hooks/useGroupAllocation';
import { VIPConfigCard } from './VIPConfigCard';
import { VIPTentSlot } from './VIPTentSlot';
import { ResponsiveModal } from '@/components/ResponsiveModal';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { BedDouble, Trash2 } from 'lucide-react';

interface VIPAllocationTabProps {
  group: GroupRecord;
  onUpdate: () => void;
}

export const VIPAllocationTab: React.FC<VIPAllocationTabProps> = ({ group, onUpdate }) => {
  const { getUnassignedVIPConfigs, getAvailableVIPTents, assignVIPConfig, unassignVIPConfig } = useGroupAllocation();
  
  const [selectedConfig, setSelectedConfig] = useState<VIPTentConfig | null>(null);
  const [selectedTentCode, setSelectedTentCode] = useState<string | null>(null);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  
  // Remove confirmation state
  const [configToRemove, setConfigToRemove] = useState<VIPTentConfig | null>(null);
  const [removeModalOpen, setRemoveModalOpen] = useState(false);

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

  const handleConfirmAssignment = async () => {
    if (!selectedConfig || !selectedTentCode) return;

    const success = await assignVIPConfig(group.id, selectedConfig.id, selectedTentCode);
    
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

  const handleRemoveConfig = async () => {
    if (!configToRemove) return;
    
    const success = await unassignVIPConfig(group.id, configToRemove.id);
    if (success) {
      toast.success(`אוהל VIP ${configToRemove.assignedTentCode} שוחרר`);
      setRemoveModalOpen(false);
      setConfigToRemove(null);
      onUpdate();
    } else {
      toast.error('שגיאה בשחרור האוהל');
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

  const getGenderLabel = (gender?: 'male' | 'female') => {
    return gender === 'female' ? '♀️' : gender === 'male' ? '♂️' : '';
  };

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

      {/* Assigned Configs Summary - Now with remove buttons */}
      {assignedConfigs.length > 0 && (
        <div className="p-4 bg-green-50 dark:bg-green-950/20 rounded-xl border border-green-200 dark:border-green-800">
          <h4 className="font-medium text-green-700 dark:text-green-300 mb-3">
            תצורות שובצו ({assignedConfigs.length})
          </h4>
          <div className="flex flex-wrap gap-3">
            {assignedConfigs.map(config => {
              const beds = config.bedsPlanned + (config.hasExtraBed ? 1 : 0);
              return (
                <div 
                  key={config.id} 
                  className="flex items-center gap-2 px-3 py-2 bg-green-200/50 dark:bg-green-800/30 rounded-lg border border-green-300 dark:border-green-700"
                >
                  <span className="font-medium">
                    VIP {config.assignedTentCode}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {beds} מיטות {getGenderLabel(config.gender)}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-destructive hover:bg-destructive/10"
                    onClick={(e) => {
                      e.stopPropagation();
                      setConfigToRemove(config);
                      setRemoveModalOpen(true);
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              );
            })}
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
        
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
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
      <ResponsiveModal 
        open={confirmModalOpen} 
        onOpenChange={setConfirmModalOpen}
        title="שיבוץ תצורה לאוהל VIP"
        className="max-w-sm"
      >
        <div className="space-y-4 py-2">
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">תצורה:</span>
            <span className="font-medium">
              אוהל {unassignedConfigs.findIndex(c => c.id === selectedConfig?.id) + 1}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">מיטות:</span>
            <span className="font-medium">{totalBeds}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">מגדר:</span>
            <span className="font-medium">{genderLabel}</span>
          </div>
          <div className="flex justify-between items-center text-lg">
            <span className="text-muted-foreground">שיבוץ לאוהל:</span>
            <span className="font-bold text-primary">VIP {selectedTentCode}</span>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <Button variant="outline" className="flex-1" onClick={() => setConfirmModalOpen(false)}>
            ביטול
          </Button>
          <Button className="flex-1" onClick={handleConfirmAssignment}>
            שבץ ✓
          </Button>
        </div>
      </ResponsiveModal>

      {/* Remove Confirmation Modal */}
      <ResponsiveModal 
        open={removeModalOpen} 
        onOpenChange={setRemoveModalOpen}
        title="שחרור אוהל VIP"
        className="max-w-sm"
      >
        <div className="space-y-4 py-4">
          <p className="text-center">
            האם לשחרר את אוהל <strong>VIP {configToRemove?.assignedTentCode}</strong>?
          </p>
          <p className="text-sm text-muted-foreground text-center">
            התצורה תחזור לרשימת הממתינים לשיבוץ
          </p>
        </div>

        <div className="flex gap-3 mt-4">
          <Button variant="outline" className="flex-1" onClick={() => setRemoveModalOpen(false)}>
            ביטול
          </Button>
          <Button variant="destructive" className="flex-1" onClick={handleRemoveConfig}>
            שחרר
          </Button>
        </div>
      </ResponsiveModal>
    </div>
  );
};