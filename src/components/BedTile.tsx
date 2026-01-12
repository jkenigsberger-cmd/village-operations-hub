import React, { useState } from 'react';
import { Bed, BedStatus } from '@/types/village';
import { cn } from '@/lib/utils';
import { User, X, Edit2, Check } from 'lucide-react';

interface BedTileProps {
  bed: Bed;
  onStatusChange: (bedId: string) => void;
  onGuestNameChange: (bedId: string, name: string) => void;
  onClearGuest: (bedId: string) => void;
}

const statusColors: Record<BedStatus, string> = {
  FREE: 'bg-status-free border-border hover:border-primary/50',
  RESERVED: 'bg-status-reserved border-status-reserved',
  OCCUPIED: 'bg-status-occupied border-status-occupied',
  BLOCKED: 'bg-status-blocked border-status-blocked',
};

const statusLabels: Record<BedStatus, string> = {
  FREE: 'Free',
  RESERVED: 'Reserved',
  OCCUPIED: 'Occupied',
  BLOCKED: 'Blocked',
};

export const BedTile: React.FC<BedTileProps> = ({
  bed,
  onStatusChange,
  onGuestNameChange,
  onClearGuest,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(bed.guestName || '');

  const handleSaveName = () => {
    onGuestNameChange(bed.id, editName);
    setIsEditing(false);
  };

  const isBunkTop = bed.type === 'BUNK_TOP';
  const isBunkBottom = bed.type === 'BUNK_BOTTOM';

  return (
    <div
      className={cn(
        'relative rounded-xl border-2 transition-all duration-200',
        'min-h-[100px] p-4 flex flex-col justify-between',
        statusColors[bed.status],
        isBunkTop && 'rounded-b-sm mb-0.5',
        isBunkBottom && 'rounded-t-sm mt-0.5'
      )}
    >
      {/* Bed label */}
      <div className="flex items-center justify-between">
        <span className="font-bold text-lg">
          {bed.label.replace('_', ' ')}
        </span>
        {bed.type !== 'SINGLE' && (
          <span className="text-xs px-2 py-0.5 bg-background/50 rounded-full">
            {isBunkTop ? '↑ Top' : '↓ Bottom'}
          </span>
        )}
      </div>

      {/* Guest name section */}
      <div className="mt-2">
        {isEditing ? (
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              placeholder="Guest name"
              className="flex-1 px-3 py-2 rounded-lg border-2 border-primary bg-background text-base focus:outline-none"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSaveName();
                if (e.key === 'Escape') setIsEditing(false);
              }}
            />
            <button
              onClick={handleSaveName}
              className="p-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
            >
              <Check className="w-5 h-5" />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            {bed.guestName ? (
              <>
                <User className="w-4 h-4" />
                <span className="font-medium truncate flex-1">{bed.guestName}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onClearGuest(bed.id);
                  }}
                  className="p-1 hover:bg-background/50 rounded"
                  title="Clear guest"
                >
                  <X className="w-4 h-4" />
                </button>
              </>
            ) : (
              <span className="text-sm opacity-70">No guest</span>
            )}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setEditName(bed.guestName || '');
                setIsEditing(true);
              }}
              className="p-1 hover:bg-background/50 rounded ml-auto"
              title="Edit guest name"
            >
              <Edit2 className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Status button - big and obvious */}
      <button
        onClick={() => onStatusChange(bed.id)}
        className={cn(
          'mt-3 w-full py-3 rounded-lg font-bold text-lg transition-all',
          'active:scale-95 hover:opacity-90',
          'border-2 border-current/20',
          bed.status === 'FREE' && 'bg-muted text-foreground',
          bed.status === 'RESERVED' && 'bg-status-reserved',
          bed.status === 'OCCUPIED' && 'bg-status-occupied',
          bed.status === 'BLOCKED' && 'bg-status-blocked'
        )}
      >
        {statusLabels[bed.status]}
      </button>
    </div>
  );
};

// Grouped bunk bed component
interface BunkBedGroupProps {
  topBed: Bed;
  bottomBed: Bed;
  onStatusChange: (bedId: string) => void;
  onGuestNameChange: (bedId: string, name: string) => void;
  onClearGuest: (bedId: string) => void;
}

export const BunkBedGroup: React.FC<BunkBedGroupProps> = ({
  topBed,
  bottomBed,
  onStatusChange,
  onGuestNameChange,
  onClearGuest,
}) => {
  return (
    <div className="space-y-1 p-2 bg-muted/30 rounded-xl">
      <div className="text-center text-sm font-medium text-muted-foreground mb-2">
        Bunk {topBed.bunkNumber}
      </div>
      <BedTile
        bed={topBed}
        onStatusChange={onStatusChange}
        onGuestNameChange={onGuestNameChange}
        onClearGuest={onClearGuest}
      />
      <BedTile
        bed={bottomBed}
        onStatusChange={onStatusChange}
        onGuestNameChange={onGuestNameChange}
        onClearGuest={onClearGuest}
      />
    </div>
  );
};
