// ============================================================
// DISTRIBUTION PREFERENCE TYPES - Sleeping Tent Planning (Optional)
// ============================================================
// This is ONLY a planning preference for sleeping tents (אוהלי לינה).
// It does NOT reserve neighborhoods, tents, or beds.
// Real allocation is a separate step in the Allocations flow.

export type DistributionMode = 'uniform' | 'ranges' | 'custom';

export interface TentRange {
  from: number; // fromTentIndex (1-based)
  to: number;   // toTentIndex (1-based)
  pax: number;  // people per tent in this range
}

export interface VirtualTent {
  index: number; // 1-based tent index
  pax: number;   // planned people in this tent
}

export interface DistributionPreference {
  requestedSleepingTentCount: number;  // How many tents requested
  preferredTentCapacity: number;       // Soft guideline (default = 8)
  mode: DistributionMode;              // uniform | ranges | custom
  ranges?: TentRange[];                // For ranges mode
  tents?: VirtualTent[];               // For custom mode (or generated from ranges/uniform)
  totalPax: number;                    // Sum of all tent assignments
  isValid: boolean;                    // Whether totalPax matches participantCount
  updatedAt: string;                   // ISO timestamp
}

// Default empty preference
export const createEmptyDistributionPreference = (): DistributionPreference => ({
  requestedSleepingTentCount: 0,
  preferredTentCapacity: 8,
  mode: 'uniform',
  ranges: [],
  tents: [],
  totalPax: 0,
  isValid: false,
  updatedAt: new Date().toISOString(),
});

// Helper to generate virtual tents from uniform distribution
export const generateUniformTents = (tentCount: number, paxPerTent: number): VirtualTent[] => {
  return Array.from({ length: tentCount }, (_, i) => ({
    index: i + 1,
    pax: paxPerTent,
  }));
};

// Helper to generate virtual tents from ranges
export const generateTentsFromRanges = (ranges: TentRange[]): VirtualTent[] => {
  const tents: VirtualTent[] = [];
  ranges.forEach(range => {
    for (let i = range.from; i <= range.to; i++) {
      tents.push({ index: i, pax: range.pax });
    }
  });
  // Sort by index
  return tents.sort((a, b) => a.index - b.index);
};

// Calculate total pax from tents array
export const calculateTotalPax = (tents: VirtualTent[]): number => {
  return tents.reduce((sum, tent) => sum + tent.pax, 0);
};

// Validate distribution preference against participant count
export const validateDistribution = (
  preference: DistributionPreference,
  participantCount: number
): { isValid: boolean; difference: number } => {
  const difference = preference.totalPax - participantCount;
  return {
    isValid: difference === 0,
    difference,
  };
};
