import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useVillage } from '@/context/VillageContext';
import { BreadcrumbNav } from '@/components/BreadcrumbNav';
import { FacilityCard, FacilityTile } from '@/components/FacilityCard';
import { Facility } from '@/types/village';
import { 
  Loader2, 
  Bath, 
  ChevronDown,
  ChevronUp,
  AlertTriangle
} from 'lucide-react';
import { cn } from '@/lib/utils';

const Facilities = () => {
  const { areaId } = useParams<{ areaId?: string }>();
  const { 
    state, 
    isLoading,
    updateFacilityCleaningStatus,
    updateFacilityWorkingStatus,
    updateFacilityNotes
  } = useVillage();

  const [expandedAreaId, setExpandedAreaId] = useState<string | null>(areaId || null);
  const [selectedFacility, setSelectedFacility] = useState<Facility | null>(null);

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

  const handleFacilityClick = (facility: Facility) => {
    setSelectedFacility(facility);
  };

  const closeFacilityDetail = () => {
    setSelectedFacility(null);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b-2 border-border">
        <div className="container py-6">
          <BreadcrumbNav items={[{ label: 'Facilities' }]} />
          <h1 className="text-3xl md:text-4xl font-bold flex items-center gap-3">
            <Bath className="w-10 h-10" />
            Bathrooms & Showers
          </h1>
          <p className="text-muted-foreground text-lg mt-2">
            Manage cleaning and working status for all facilities
          </p>
        </div>
      </header>

      <main className="container py-6">
        {/* Area cards */}
        <div className="space-y-4">
          {facilityAreas.map((area) => {
            const stats = getAreaStats(area.id);
            const isExpanded = expandedAreaId === area.id;
            const facilities = area.facilityIds
              .map(id => state.facilities[id])
              .filter(Boolean);

            return (
              <div key={area.id} className="tile p-0 overflow-hidden">
                {/* Area Header */}
                <button
                  onClick={() => setExpandedAreaId(isExpanded ? null : area.id)}
                  className={cn(
                    'w-full p-6 flex items-center justify-between text-left',
                    'hover:bg-muted/50 transition-colors',
                    isExpanded && 'border-b-2 border-border'
                  )}
                >
                  <div>
                    <h2 className="text-2xl font-bold">{area.name}</h2>
                    <p className="text-muted-foreground mt-1">{area.description}</p>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    {stats.needsAttention > 0 && (
                      <span className="flex items-center gap-2 px-4 py-2 bg-destructive/20 text-destructive rounded-xl font-semibold">
                        <AlertTriangle className="w-5 h-5" />
                        {stats.needsAttention} needs attention
                      </span>
                    )}
                    <span className="text-muted-foreground text-lg">
                      {stats.total} facilities
                    </span>
                    {isExpanded ? (
                      <ChevronUp className="w-8 h-8 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="w-8 h-8 text-muted-foreground" />
                    )}
                  </div>
                </button>

                {/* Expanded Facilities Grid */}
                {isExpanded && (
                  <div className="p-6 bg-muted/20">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      {facilities.map((facility) => (
                        <FacilityTile
                          key={facility.id}
                          facility={facility}
                          onClick={() => handleFacilityClick(facility)}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Facility Detail Modal */}
        {selectedFacility && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-background rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl animate-slide-up">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold">{selectedFacility.label}</h2>
                  <button
                    onClick={closeFacilityDetail}
                    className="p-2 hover:bg-muted rounded-xl text-muted-foreground"
                  >
                    ✕
                  </button>
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
                />

                <button
                  onClick={closeFacilityDetail}
                  className="w-full mt-6 px-6 py-4 bg-primary text-primary-foreground rounded-xl font-bold text-lg hover:bg-primary/90"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Facilities;
