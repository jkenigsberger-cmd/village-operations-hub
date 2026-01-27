// Global Search Index Builder for Aharonson Farm
// Builds searchable index from village state data

import { VillageState, Tent, Facility, ActivitySpace, FacilityArea } from '@/types/village';
import { HE } from '@/lib/translations';

export type SearchResultType = 'tent' | 'facility' | 'activitySpace';

export interface SearchResult {
  id: string;
  type: SearchResultType;
  icon: string;
  primaryLabel: string;
  secondaryLabel: string;
  // Status indicators
  cleaningStatus?: 'CLEAN' | 'NEEDS_CLEANING' | 'CLEANING_IN_PROGRESS';
  workingStatus?: 'WORKING' | 'BROKEN' | 'MAINTENANCE' | 'CLOSED';
  occupancyStatus?: 'FREE' | 'RESERVED' | 'OCCUPIED' | 'BLOCKED';
  // Navigation data
  navigateTo: string;
  focusId?: string;
  // Search keywords (for matching)
  searchTerms: string[];
}

// Normalize text for search matching
const normalizeText = (text: string): string => {
  return text
    .toLowerCase()
    .replace(/[״׳'"'`]/g, '') // Remove quote marks
    .replace(/\s+/g, ' ') // Normalize spaces
    .trim();
};

// Generate search terms for a tent
const getTentSearchTerms = (tent: Tent): string[] => {
  const terms: string[] = [];
  const code = tent.code;
  
  // Add the full code
  terms.push(code);
  terms.push(normalizeText(code));
  
  // VIP handling
  if (tent.isVIP) {
    const vipNum = code.replace('VIP ', '');
    terms.push('vip', vipNum, `vip ${vipNum}`, `vip${vipNum}`);
  }
  
  // Double tent handling (Alef/Bet variants)
  if (code.includes(' א')) {
    const base = code.replace(' א', '');
    terms.push(base, `${base} א`, `${base} א׳`, `${base} alef`, `${base}א`);
  }
  if (code.includes(' ב')) {
    const base = code.replace(' ב', '');
    terms.push(base, `${base} ב`, `${base} ב׳`, `${base} bet`, `${base}ב`);
  }
  
  // Just the number
  const numMatch = code.match(/\d+/);
  if (numMatch) {
    terms.push(numMatch[0]);
  }
  
  // Neighborhood context
  terms.push(`שכונה ${tent.neighborhoodId.replace('N', '')}`);
  if (tent.neighborhoodId === 'VIP') {
    terms.push('שכונת vip', 'vip');
  }
  
  // Accessible tent
  if (tent.isAccessible) {
    terms.push('נגיש', 'accessible', '74');
  }
  
  // Group name if any
  if (tent.groupName) {
    terms.push(normalizeText(tent.groupName));
  }
  
  return [...new Set(terms.map(normalizeText))];
};

// Generate search terms for a facility
const getFacilitySearchTerms = (facility: Facility, area: FacilityArea | undefined): string[] => {
  const terms: string[] = [];
  
  // Label (e.g., "מקלחת 6", "תא 33")
  terms.push(facility.label);
  terms.push(normalizeText(facility.label));
  
  // Extract number from label
  const numMatch = facility.label.match(/\d+/);
  if (numMatch) {
    const num = numMatch[0];
    terms.push(num);
    
    // Type-specific terms
    if (facility.type === 'SHOWER') {
      terms.push(`מקלחת ${num}`, `מקלחת${num}`, `shower ${num}`, `shower${num}`);
    }
    if (facility.type === 'TOILET') {
      terms.push(`תא ${num}`, `תא${num}`, `שירותים ${num}`, `toilet ${num}`);
    }
  }
  
  // Gender
  if (facility.gender === 'MALE') {
    terms.push('גברים', 'male');
  } else if (facility.gender === 'FEMALE') {
    terms.push('נשים', 'female');
  }
  
  // Accessible
  if (facility.isAccessible) {
    terms.push('נגיש', 'accessible');
  }
  
  // Area context
  if (area) {
    terms.push(normalizeText(area.name));
    // Extract location from parentheses
    const locationMatch = area.name.match(/\((.+)\)/);
    if (locationMatch) {
      terms.push(normalizeText(locationMatch[1]));
    }
    // Dining hall related
    if (area.name.includes('חדר אוכל')) {
      terms.push('חדר אוכל', 'dining', 'dining hall');
    }
  }
  
  return [...new Set(terms.map(normalizeText))];
};

// Generate search terms for an activity space
const getActivitySpaceSearchTerms = (space: ActivitySpace): string[] => {
  const terms: string[] = [];
  
  terms.push(space.name);
  terms.push(normalizeText(space.name));
  
  // Bunker variations (ממ״ד)
  if (space.id.startsWith('bunker_')) {
    const num = space.id.replace('bunker_', '');
    terms.push('ממד', 'ממ״ד', `ממד ${num}`, `ממ״ד ${num}`, `ממד${num}`, `bunker`, `bunker ${num}`);
  }
  
  // Ohel Moed variations
  if (space.id === 'ohel_moed') {
    terms.push('אוהל מועד', 'אוהל', 'מועד', 'ohel moed', 'ohel');
  }
  
  // Dining hall variations
  if (space.id === 'dining_hall') {
    terms.push('חדר אוכל', 'חדר', 'אוכל', 'dining', 'dining hall');
  }
  
  // Description
  if (space.description) {
    terms.push(normalizeText(space.description));
  }
  
  return [...new Set(terms.map(normalizeText))];
};

// Get neighborhood display name
const getNeighborhoodName = (neighborhoodId: string): string => {
  const names: Record<string, string> = {
    N1: 'שכונה 1',
    N2: 'שכונה 2',
    N3: 'שכונה 3',
    N4: 'שכונה 4',
    N5: 'שכונה 5 (אוהלים לבנים)',
    N6: 'שכונה 6 (אוהלים לבנים)',
    N7: 'שכונה 7',
    VIP: 'שכונת VIP',
  };
  return names[neighborhoodId] || neighborhoodId;
};

// Build the complete search index
export const buildSearchIndex = (state: VillageState): SearchResult[] => {
  const results: SearchResult[] = [];
  
  // Index all tents
  Object.values(state.tents).forEach((tent) => {
    const primaryBedStatus = tent.beds.length > 0 ? tent.beds[0].status : undefined;
    
    results.push({
      id: tent.id,
      type: 'tent',
      icon: tent.isVIP ? '🏕️' : '⛺',
      primaryLabel: tent.code,
      secondaryLabel: getNeighborhoodName(tent.neighborhoodId),
      cleaningStatus: tent.cleaningStatus,
      occupancyStatus: primaryBedStatus,
      navigateTo: `/tent/${tent.id}`,
      searchTerms: getTentSearchTerms(tent),
    });
  });
  
  // Index all facilities
  Object.values(state.facilities).forEach((facility) => {
    const area = state.facilityAreas[facility.areaId];
    
    results.push({
      id: facility.id,
      type: 'facility',
      icon: facility.type === 'SHOWER' ? '🚿' : '🚻',
      primaryLabel: facility.label,
      secondaryLabel: area?.name || '',
      cleaningStatus: facility.cleaningStatus,
      workingStatus: facility.workingStatus,
      navigateTo: '/facilities',
      focusId: facility.id,
      searchTerms: getFacilitySearchTerms(facility, area),
    });
  });
  
  // Index all activity spaces
  Object.values(state.activitySpaces).forEach((space) => {
    results.push({
      id: space.id,
      type: 'activitySpace',
      icon: space.id === 'dining_hall' ? '🍽️' : space.id.startsWith('bunker_') ? '🧱' : '🎪',
      primaryLabel: space.name,
      secondaryLabel: space.description || 'מתקן משותף',
      cleaningStatus: space.cleaningStatus,
      workingStatus: space.workingStatus,
      navigateTo: '/activities',
      focusId: space.id,
      searchTerms: getActivitySpaceSearchTerms(space),
    });
  });
  
  return results;
};

// Search the index
export const searchIndex = (index: SearchResult[], query: string): SearchResult[] => {
  if (!query.trim()) return [];
  
  const normalizedQuery = normalizeText(query);
  const queryWords = normalizedQuery.split(' ').filter(Boolean);
  
  // Score each result
  const scored = index.map((result) => {
    let score = 0;
    
    for (const word of queryWords) {
      // Exact match on primary label
      if (normalizeText(result.primaryLabel) === normalizedQuery) {
        score += 100;
      }
      // Primary label contains the word
      else if (normalizeText(result.primaryLabel).includes(word)) {
        score += 50;
      }
      
      // Check search terms
      for (const term of result.searchTerms) {
        if (term === word) {
          score += 30;
        } else if (term.includes(word)) {
          score += 15;
        } else if (word.includes(term) && term.length > 1) {
          score += 10;
        }
      }
    }
    
    return { result, score };
  });
  
  // Filter and sort by score
  return scored
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 15) // Limit to top 15 results
    .map(({ result }) => result);
};
