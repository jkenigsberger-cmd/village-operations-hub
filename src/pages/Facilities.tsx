import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useVillage } from '@/context/VillageContext';
import { BreadcrumbNav } from '@/components/BreadcrumbNav';
import { FacilityCard, FacilityTile } from '@/components/FacilityCard';
import { ReportIssueModal } from '@/components/ReportIssueModal';
import { Facility, WorkingStatus } from '@/types/village';
import { Loader2, Bath, ChevronDown, ChevronUp, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { HE } from '@/lib/translations';

const Facilities = () => {
  const { areaId } = useParams<{ areaId?: string }>();
  const { 
    state, 
    isLoading,
    updateFacilityCleaningStatus,
    updateFacilityWorkingStatus,
    updateFacilityNotes,
    reportFacilityIssue,
  } = useVillage();

  const [expandedAreaId, setExpandedAreaId] = useState<string | null>(areaId || null);
  const [selectedFacility, setSelectedFacility] = useState<Facility | null>(null);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportStatus, setReportStatus] = useState<WorkingStatus>('BROKEN');

  if (isLoading || !state) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  const facilityAreas = Object.values(state.facilityAreas);

  const getAreaStats = (areaId: string) => {
    const area = state.facilityAreas[areaId];
    if (!area) return { total: 0, needsAttention: 0 };
    const facilities = area.facilityIds.map(id => state.facilities[id]).filter(Boolean);
    const needsAttention = facilities.filter(
      f => f.cleaningStatus === 'NEEDS_CLEANING' || f.workingStatus === 'BROKEN'
    ).length;
    return { total: facilities.length, needsAttention };
  };

  const handleReportSubmit = (data: { status: WorkingStatus; notes: string; image?: string }) => {
    if (selectedFacility) {
      reportFacilityIssue(selectedFacility.id, data.status, data.notes, data.image);
      setSelectedFacility({ 
        ...selectedFacility, 
        workingStatus: data.status,
        maintenanceNotes: data.notes,
        maintenanceImage: data.image,
      });
      toast.success(HE.messages.issueReported);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b-2 border-border">
        <div className="container py-6">
          <BreadcrumbNav items={[{ label: HE.nav.bathrooms }]} />
          <h1 className="text-3xl md:text-4xl font-bold flex items-center gap-3">
            <Bath className="w-10 h-10" />
            {HE.pages.bathroomsShowers}
          </h1>
          <p className="text-muted-foreground text-lg mt-2">
            ניהול ניקיון, מצב והזמנות לכל המתקנים
          </p>
        </div>
      </header>

      <main className="container py-6">
        <div className="space-y-4">
          {facilityAreas.map((area) => {
            const stats = getAreaStats(area.id);
            const isExpanded = expandedAreaId === area.id;
            const facilities = area.facilityIds.map(id => state.facilities[id]).filter(Boolean);

            return (
              <div key={area.id} className="tile p-0 overflow-hidden">
                <button
                  onClick={() => setExpandedAreaId(isExpanded ? null : area.id)}
                  className={cn(
                    'w-full p-6 flex items-center justify-between text-right',
                    'hover:bg-muted/50 transition-colors',
                    isExpanded && 'border-b-2 border-border'
                  )}
                >
                  <div className="flex items-center gap-4">
                    {isExpanded ? (
                      <ChevronUp className="w-8 h-8 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="w-8 h-8 text-muted-foreground" />
                    )}
                    <span className="text-muted-foreground text-lg">
                      {stats.total} {HE.entities.facilities}
                    </span>
                    {stats.needsAttention > 0 && (
                      <span className="flex items-center gap-2 px-4 py-2 bg-destructive/20 text-destructive rounded-xl font-semibold">
                        <AlertTriangle className="w-5 h-5" />
                        {stats.needsAttention} {HE.stats.needsAttention}
                      </span>
                    )}
                  </div>
                  <div className="text-right">
                    {(() => {
                      const match = area.name.match(/^(.+?)\s*\((.+)\)$/);
                      if (match) {
                        return (
                          <>
                            <h2 className="text-2xl font-bold">{match[1]}</h2>
                            <p className="text-sm text-muted-foreground mt-0.5">{match[2]}</p>
                          </>
                        );
                      }
                      return <h2 className="text-2xl font-bold">{area.name}</h2>;
                    })()}
                    <p className="text-muted-foreground text-sm mt-1">{area.description}</p>
                  </div>
                </button>

                {isExpanded && (
                  <div className="p-6 bg-muted/20">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      {facilities.map((facility) => (
                        <FacilityTile
                          key={facility.id}
                          facility={facility}
                          onClick={() => setSelectedFacility(facility)}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {selectedFacility && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-background rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl animate-slide-up">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <button
                    onClick={() => setSelectedFacility(null)}
                    className="p-2 hover:bg-muted rounded-xl text-muted-foreground"
                  >
                    ✕
                  </button>
                  <h2 className="text-2xl font-bold">{selectedFacility.label}</h2>
                </div>

                <FacilityCard
                  facility={selectedFacility}
                  onCleaningChange={(status) => {
                    updateFacilityCleaningStatus(selectedFacility.id, status);
                    setSelectedFacility({ ...selectedFacility, cleaningStatus: status });
                  }}
                  onWorkingChange={(status) => {
                    updateFacilityWorkingStatus(selectedFacility.id, status);
                    setSelectedFacility({ ...selectedFacility, workingStatus: status });
                  }}
                  onNotesChange={(notes) => {
                    updateFacilityNotes(selectedFacility.id, notes);
                    setSelectedFacility({ ...selectedFacility, notes });
                  }}
                  onReportIssue={(status) => {
                    setReportStatus(status);
                    setReportModalOpen(true);
                  }}
                />

                <button
                  onClick={() => setSelectedFacility(null)}
                  className="w-full mt-6 px-6 py-4 bg-primary text-primary-foreground rounded-xl font-bold text-lg hover:bg-primary/90"
                >
                  {HE.actions.done}
                </button>
              </div>
            </div>
          </div>
        )}

        {selectedFacility && (
          <ReportIssueModal
            isOpen={reportModalOpen}
            onClose={() => setReportModalOpen(false)}
            facility={selectedFacility}
            selectedStatus={reportStatus}
            onSubmit={handleReportSubmit}
          />
        )}
      </main>
    </div>
  );
};

export default Facilities;
