import React, { useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useVillage } from '@/context/VillageContext';
import { BreadcrumbNav } from '@/components/BreadcrumbNav';
import { BedTile, BunkBedGroup } from '@/components/BedTile';
import { CleaningToggle } from '@/components/StatusBadge';
import { Bed } from '@/types/village';
import { 
  Loader2, 
  Sparkles, 
  Accessibility, 
  Bath, 
  Calendar,
  Users,
  MessageSquare,
  Trash2,
  AlertTriangle
} from 'lucide-react';
import { cn } from '@/lib/utils';

const TentDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { 
    state, 
    isLoading, 
    cycleBedStatus,
    updateBedGuestName,
    clearBedGuest,
    updateTentCleaningStatus,
    updateTentGroupName,
    updateTentDates,
    updateTentNotes,
    clearAllBeds
  } = useVillage();

  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const tent = state?.tents[id || ''];

  // Organize beds into bunks and singles
  const { bunkBeds, singleBeds } = useMemo(() => {
    if (!tent) return { bunkBeds: [], singleBeds: [] };

    const bunks: { top: Bed; bottom: Bed }[] = [];
    const singles: Bed[] = [];

    const bunkTops = tent.beds.filter(b => b.type === 'BUNK_TOP');
    const bunkBottoms = tent.beds.filter(b => b.type === 'BUNK_BOTTOM');

    bunkTops.forEach(top => {
      const bottom = bunkBottoms.find(b => b.bunkNumber === top.bunkNumber);
      if (bottom) {
        bunks.push({ top, bottom });
      }
    });

    tent.beds.filter(b => b.type === 'SINGLE').forEach(bed => {
      singles.push(bed);
    });

    return { bunkBeds: bunks, singleBeds: singles };
  }, [tent]);

  if (isLoading || !state) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!tent) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold">אוהל לא נמצא</h1>
          <Link to="/" className="text-primary mt-4 block">← חזרה לדף הבית</Link>
        </div>
      </div>
    );
  }

  const neighborhood = state.neighborhoods[tent.neighborhoodId];

  const handleClearAll = () => {
    clearAllBeds(tent.id);
    setShowClearConfirm(false);
  };

  // Calculate stats
  const stats = {
    total: tent.beds.length,
    free: tent.beds.filter(b => b.status === 'FREE').length,
    reserved: tent.beds.filter(b => b.status === 'RESERVED').length,
    occupied: tent.beds.filter(b => b.status === 'OCCUPIED').length,
    blocked: tent.beds.filter(b => b.status === 'BLOCKED').length,
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b-2 border-border">
        <div className="container py-6">
          <BreadcrumbNav 
            items={[
              { label: neighborhood.displayName, path: `/neighborhood/${neighborhood.id}` },
              { label: tent.code }
            ]} 
          />
          
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold flex items-center gap-3">
                {tent.code}
                {tent.isVIP && (
                  <span className="px-3 py-1 bg-vip text-vip-foreground rounded-full text-lg font-semibold flex items-center gap-1">
                    <Sparkles className="w-5 h-5" />
                    VIP
                  </span>
                )}
              </h1>
              
              {/* Badges */}
              <div className="flex flex-wrap gap-2 mt-2">
                {tent.isAccessible && (
                  <span className="px-3 py-1 bg-primary text-primary-foreground rounded-full text-base font-medium flex items-center gap-1">
                    <Accessibility className="w-4 h-4" />
                    Accessible
                  </span>
                )}
                {tent.hasPrivateBathroom && (
                  <span className="px-3 py-1 bg-accent text-accent-foreground rounded-full text-base font-medium flex items-center gap-1">
                    <Bath className="w-4 h-4" />
                    Private Bath
                  </span>
                )}
              </div>
            </div>

            {/* Stats summary */}
            <div className="flex gap-2 flex-wrap">
              <span className="px-3 py-2 bg-status-free rounded-xl font-semibold">
                {stats.free} Free
              </span>
              <span className="px-3 py-2 bg-status-reserved rounded-xl font-semibold">
                {stats.reserved} Reserved
              </span>
              <span className="px-3 py-2 bg-status-occupied rounded-xl font-semibold">
                {stats.occupied} Occupied
              </span>
              {stats.blocked > 0 && (
                <span className="px-3 py-2 bg-status-blocked rounded-xl font-semibold">
                  {stats.blocked} Blocked
                </span>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="container py-6 space-y-8">
        {/* Tent Info Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: Group & Dates */}
          <div className="tile space-y-6">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Users className="w-6 h-6" />
              Group Information
            </h2>

            {/* Group Name */}
            <div className="space-y-2">
              <label className="text-base font-semibold text-muted-foreground">
                Group Name
              </label>
              <input
                type="text"
                value={tent.groupName || ''}
                onChange={(e) => updateTentGroupName(tent.id, e.target.value)}
                placeholder="Enter group name..."
                className="w-full px-4 py-4 text-xl rounded-xl border-2 border-input bg-background focus:outline-none focus:border-primary"
              />
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-base font-semibold text-muted-foreground flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Check-in Date
                </label>
                <input
                  type="date"
                  value={tent.checkInDate || ''}
                  onChange={(e) => updateTentDates(tent.id, e.target.value, tent.checkOutDate)}
                  className="w-full px-4 py-3 text-lg rounded-xl border-2 border-input bg-background focus:outline-none focus:border-primary"
                />
              </div>
              <div className="space-y-2">
                <label className="text-base font-semibold text-muted-foreground flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Check-out Date
                </label>
                <input
                  type="date"
                  value={tent.checkOutDate || ''}
                  onChange={(e) => updateTentDates(tent.id, tent.checkInDate, e.target.value)}
                  className="w-full px-4 py-3 text-lg rounded-xl border-2 border-input bg-background focus:outline-none focus:border-primary"
                />
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <label className="text-base font-semibold text-muted-foreground flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                Notes
              </label>
              <textarea
                value={tent.notes || ''}
                onChange={(e) => updateTentNotes(tent.id, e.target.value)}
                placeholder="Add notes about this tent..."
                className="w-full px-4 py-3 text-lg rounded-xl border-2 border-input bg-background resize-none focus:outline-none focus:border-primary"
                rows={3}
              />
            </div>
          </div>

          {/* Right: Cleaning & Actions */}
          <div className="tile space-y-6">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Sparkles className="w-6 h-6" />
              Tent Status
            </h2>

            {/* Cleaning Status */}
            <div className="space-y-3">
              <label className="text-base font-semibold text-muted-foreground">
                Cleaning Status
              </label>
              <CleaningToggle
                status={tent.cleaningStatus}
                onChange={(status) => updateTentCleaningStatus(tent.id, status)}
                size="lg"
              />
            </div>

            {/* Clear All Button */}
            <div className="pt-4 border-t border-border">
              {showClearConfirm ? (
                <div className="bg-destructive/10 border-2 border-destructive rounded-xl p-4 space-y-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-6 h-6 text-destructive flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-lg">לנקות את כל המיטות?</p>
                      <p className="text-muted-foreground">
                        כל המיטות יוגדרו כפנויות ושמות האורחים יוסרו.
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={handleClearAll}
                      className="flex-1 px-4 py-3 bg-destructive text-destructive-foreground rounded-xl font-bold text-lg hover:bg-destructive/90"
                    >
                      כן, נקה הכל
                    </button>
                    <button
                      onClick={() => setShowClearConfirm(false)}
                      className="flex-1 px-4 py-3 bg-muted text-foreground rounded-xl font-bold text-lg hover:bg-muted/80"
                    >
                      ביטול
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setShowClearConfirm(true)}
                  className="w-full px-4 py-4 bg-muted text-foreground rounded-xl font-bold text-lg hover:bg-muted/80 flex items-center justify-center gap-2"
                >
                  <Trash2 className="w-5 h-5" />
                  Clear All Beds
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Bed Map */}
        <section>
          <h2 className="text-2xl font-bold mb-6">Bed Map</h2>
          <p className="text-muted-foreground mb-4">
            Click the status button to cycle through: Free → Reserved → Occupied → Blocked → Free
          </p>

          {/* Bunk Beds */}
          {bunkBeds.length > 0 && (
            <div className="mb-8">
              <h3 className="text-xl font-semibold mb-4">Bunk Beds</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {bunkBeds.map((bunk, index) => (
                  <BunkBedGroup
                    key={`bunk-${index}`}
                    topBed={bunk.top}
                    bottomBed={bunk.bottom}
                    onStatusChange={cycleBedStatus}
                    onGuestNameChange={updateBedGuestName}
                    onClearGuest={clearBedGuest}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Single Beds */}
          {singleBeds.length > 0 && (
            <div>
              <h3 className="text-xl font-semibold mb-4">Single Beds</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {singleBeds.map((bed) => (
                  <BedTile
                    key={bed.id}
                    bed={bed}
                    onStatusChange={cycleBedStatus}
                    onGuestNameChange={updateBedGuestName}
                    onClearGuest={clearBedGuest}
                  />
                ))}
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

export default TentDetail;
