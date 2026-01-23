import { 
  VillageState, 
  Neighborhood, 
  Tent, 
  Bed, 
  BedType,
  FacilityArea, 
  Facility, 
  ActivitySpace,
  NeighborhoodId 
} from '@/types/village';

// ============================================================
// HELPER FUNCTIONS
// ============================================================

const generateId = (): string => Math.random().toString(36).substring(2, 11);

const now = () => new Date().toISOString();

// Create a bed
const createBed = (
  tentId: string, 
  label: string, 
  type: BedType, 
  bunkNumber?: number
): Bed => ({
  id: generateId(),
  tentId,
  label,
  type,
  bunkNumber,
  status: 'FREE',
});

// Create bunk beds (top + bottom)
const createBunkBeds = (tentId: string, bunkNumber: number): Bed[] => [
  createBed(tentId, `BUNK${bunkNumber}_TOP`, 'BUNK_TOP', bunkNumber),
  createBed(tentId, `BUNK${bunkNumber}_BOTTOM`, 'BUNK_BOTTOM', bunkNumber),
];

// Create single beds
const createSingleBeds = (tentId: string, count: number): Bed[] => 
  Array.from({ length: count }, (_, i) => 
    createBed(tentId, `BED${i + 1}`, 'SINGLE')
  );

// ============================================================
// NEIGHBORHOOD GENERATORS
// ============================================================

// N1, N2, N3: Double tents with 4 bunk beds each (8 beds per simple tent)
const createN123Neighborhood = (
  neighborhoodNum: 1 | 2 | 3
): { tents: Tent[]; beds: Bed[]; neighborhood: Neighborhood } => {
  const id = `N${neighborhoodNum}` as NeighborhoodId;
  const tents: Tent[] = [];
  const beds: Bed[] = [];
  const tentIds: string[] = [];

  for (let doubleTentNum = 1; doubleTentNum <= 4; doubleTentNum++) {
    const baseTentCode = `${neighborhoodNum}${doubleTentNum}`;
    const doubleTentId = `double_${baseTentCode}`;

    // Create Alef and Bet tents
    for (const suffix of ['Alef', 'Bet']) {
      const tentId = generateId();
      const tentCode = `${baseTentCode} ${suffix}`;
      
      // 4 bunk beds = 8 beds per tent
      const tentBeds: Bed[] = [
        ...createBunkBeds(tentId, 1),
        ...createBunkBeds(tentId, 2),
        ...createBunkBeds(tentId, 3),
        ...createBunkBeds(tentId, 4),
      ];

      tents.push({
        id: tentId,
        code: tentCode,
        neighborhoodId: id,
        doubleTentId,
        isAlef: suffix === 'Alef',
        beds: tentBeds,
        cleaningStatus: 'CLEAN',
        lastUpdated: now(),
      });

      beds.push(...tentBeds);
      tentIds.push(tentId);
    }
  }

  return {
    tents,
    beds,
    neighborhood: {
      id,
      name: id,
      displayName: `Neighborhood ${neighborhoodNum}`,
      hasDoubleTents: true,
      tentIds,
    },
  };
};

// N4: 4 tents with 4 singles + 2 bunks each (8 beds per tent)
const createN4Neighborhood = (): { tents: Tent[]; beds: Bed[]; neighborhood: Neighborhood } => {
  const tents: Tent[] = [];
  const beds: Bed[] = [];
  const tentIds: string[] = [];

  for (let i = 1; i <= 4; i++) {
    const tentId = generateId();
    const tentCode = `4${i}`;
    
    const tentBeds: Bed[] = [
      ...createSingleBeds(tentId, 4),
      ...createBunkBeds(tentId, 1),
      ...createBunkBeds(tentId, 2),
    ];

    tents.push({
      id: tentId,
      code: tentCode,
      neighborhoodId: 'N4',
      beds: tentBeds,
      cleaningStatus: 'CLEAN',
      lastUpdated: now(),
    });

    beds.push(...tentBeds);
    tentIds.push(tentId);
  }

  return {
    tents,
    beds,
    neighborhood: {
      id: 'N4',
      name: 'N4',
      displayName: 'Neighborhood 4',
      tentIds,
    },
  };
};

// N5: White tents with 5 tents (51-55), 6 single beds each
const createN5Neighborhood = (): { tents: Tent[]; beds: Bed[]; neighborhood: Neighborhood } => {
  const tents: Tent[] = [];
  const beds: Bed[] = [];
  const tentIds: string[] = [];

  for (let i = 1; i <= 5; i++) {
    const tentId = generateId();
    const tentCode = `5${i}`;
    
    const tentBeds = createSingleBeds(tentId, 6);

    tents.push({
      id: tentId,
      code: tentCode,
      neighborhoodId: 'N5',
      beds: tentBeds,
      cleaningStatus: 'CLEAN',
      lastUpdated: now(),
    });

    beds.push(...tentBeds);
    tentIds.push(tentId);
  }

  return {
    tents,
    beds,
    neighborhood: {
      id: 'N5',
      name: 'N5',
      displayName: 'Neighborhood 5',
      description: 'White Tents',
      isWhiteTent: true,
      tentIds,
    },
  };
};

// N6: White tents with 4 tents (61-64), 6 single beds each
const createN6Neighborhood = (): { tents: Tent[]; beds: Bed[]; neighborhood: Neighborhood } => {
  const tents: Tent[] = [];
  const beds: Bed[] = [];
  const tentIds: string[] = [];

  for (let i = 1; i <= 4; i++) {
    const tentId = generateId();
    const tentCode = `6${i}`;
    
    const tentBeds = createSingleBeds(tentId, 6);

    tents.push({
      id: tentId,
      code: tentCode,
      neighborhoodId: 'N6',
      beds: tentBeds,
      cleaningStatus: 'CLEAN',
      lastUpdated: now(),
    });

    beds.push(...tentBeds);
    tentIds.push(tentId);
  }

  return {
    tents,
    beds,
    neighborhood: {
      id: 'N6',
      name: 'N6',
      displayName: 'Neighborhood 6',
      description: 'White Tents',
      isWhiteTent: true,
      tentIds,
    },
  };
};

// N7: 3 regular tents + 1 accessible tent
const createN7Neighborhood = (): { tents: Tent[]; beds: Bed[]; neighborhood: Neighborhood } => {
  const tents: Tent[] = [];
  const beds: Bed[] = [];
  const tentIds: string[] = [];

  // Regular tents: 2 bunks + 4 singles = 8 beds
  for (let i = 1; i <= 3; i++) {
    const tentId = generateId();
    const tentCode = `7${i}`;
    
    const tentBeds: Bed[] = [
      ...createBunkBeds(tentId, 1),
      ...createBunkBeds(tentId, 2),
      ...createSingleBeds(tentId, 4),
    ];

    tents.push({
      id: tentId,
      code: tentCode,
      neighborhoodId: 'N7',
      beds: tentBeds,
      cleaningStatus: 'CLEAN',
      lastUpdated: now(),
    });

    beds.push(...tentBeds);
    tentIds.push(tentId);
  }

  // Accessible tent: 3 single beds + private bathroom
  const accessibleTentId = generateId();
  const accessibleBeds = createSingleBeds(accessibleTentId, 3);
  
  tents.push({
    id: accessibleTentId,
    code: '74 Accessible',
    neighborhoodId: 'N7',
    beds: accessibleBeds,
    cleaningStatus: 'CLEAN',
    hasPrivateBathroom: true,
    hasPrivateShower: true,
    isAccessible: true,
    lastUpdated: now(),
  });

  beds.push(...accessibleBeds);
  tentIds.push(accessibleTentId);

  return {
    tents,
    beds,
    neighborhood: {
      id: 'N7',
      name: 'N7',
      displayName: 'Neighborhood 7',
      tentIds,
    },
  };
};

// VIP: Tents 80-89 with 3 beds each, all have private bathroom/shower
const createVIPNeighborhood = (): { tents: Tent[]; beds: Bed[]; neighborhood: Neighborhood } => {
  const tents: Tent[] = [];
  const beds: Bed[] = [];
  const tentIds: string[] = [];

  for (let i = 80; i <= 89; i++) {
    const tentId = generateId();
    const tentCode = `VIP ${i}`;
    
    const tentBeds = createSingleBeds(tentId, 3);

    tents.push({
      id: tentId,
      code: tentCode,
      neighborhoodId: 'VIP',
      beds: tentBeds,
      cleaningStatus: 'CLEAN',
      hasPrivateBathroom: true,
      hasPrivateShower: true,
      isVIP: true,
      lastUpdated: now(),
    });

    beds.push(...tentBeds);
    tentIds.push(tentId);
  }

  return {
    tents,
    beds,
    neighborhood: {
      id: 'VIP',
      name: 'VIP',
      displayName: 'VIP Neighborhood',
      tentIds,
    },
  };
};

// ============================================================
// FACILITIES GENERATORS
// ============================================================

const createFacilities = (): { areas: FacilityArea[]; facilities: Facility[] } => {
  const areas: FacilityArea[] = [];
  const facilities: Facility[] = [];

  // Area A: Between N1 & N2 - 4 unisex toilets
  const areaAId = 'area_n1_n2';
  const areaAFacilities: Facility[] = [];
  for (let i = 1; i <= 4; i++) {
    const f: Facility = {
      id: generateId(),
      areaId: areaAId,
      label: `TOILET-${i}`,
      type: 'TOILET',
      gender: 'UNISEX',
      cleaningStatus: 'CLEAN',
      workingStatus: 'WORKING',
      lastUpdated: now(),
    };
    areaAFacilities.push(f);
    facilities.push(f);
  }
  areas.push({
    id: areaAId,
    name: 'Between N1 & N2',
    description: '4 Unisex Toilets',
    facilityIds: areaAFacilities.map(f => f.id),
  });

  // Area B: Between N3 & N4 - 2 unisex toilets
  const areaBId = 'area_n3_n4';
  const areaBFacilities: Facility[] = [];
  for (let i = 1; i <= 2; i++) {
    const f: Facility = {
      id: generateId(),
      areaId: areaBId,
      label: `TOILET-${i}`,
      type: 'TOILET',
      gender: 'UNISEX',
      cleaningStatus: 'CLEAN',
      workingStatus: 'WORKING',
      lastUpdated: now(),
    };
    areaBFacilities.push(f);
    facilities.push(f);
  }
  areas.push({
    id: areaBId,
    name: 'Between N3 & N4',
    description: '2 Unisex Toilets',
    facilityIds: areaBFacilities.map(f => f.id),
  });

  // Area C: Between N4 & N7 - 4 unisex toilets
  const areaCId = 'area_n4_n7';
  const areaCFacilities: Facility[] = [];
  for (let i = 1; i <= 4; i++) {
    const f: Facility = {
      id: generateId(),
      areaId: areaCId,
      label: `TOILET-${i}`,
      type: 'TOILET',
      gender: 'UNISEX',
      cleaningStatus: 'CLEAN',
      workingStatus: 'WORKING',
      lastUpdated: now(),
    };
    areaCFacilities.push(f);
    facilities.push(f);
  }
  areas.push({
    id: areaCId,
    name: 'Between N4 & N7',
    description: '4 Unisex Toilets',
    facilityIds: areaCFacilities.map(f => f.id),
  });

  // Area D: Near White Tents - 4 unisex toilets
  const areaDId = 'area_white_tents';
  const areaDFacilities: Facility[] = [];
  for (let i = 1; i <= 4; i++) {
    const f: Facility = {
      id: generateId(),
      areaId: areaDId,
      label: `TOILET-${i}`,
      type: 'TOILET',
      gender: 'UNISEX',
      cleaningStatus: 'CLEAN',
      workingStatus: 'WORKING',
      lastUpdated: now(),
    };
    areaDFacilities.push(f);
    facilities.push(f);
  }
  areas.push({
    id: areaDId,
    name: 'Near White Tents',
    description: '4 Unisex Toilets',
    facilityIds: areaDFacilities.map(f => f.id),
  });

  // Area E: Dining Hall Facilities
  const areaEId = 'area_dining';
  const areaEFacilities: Facility[] = [];

  // Male toilets
  for (let i = 1; i <= 4; i++) {
    const f: Facility = {
      id: generateId(),
      areaId: areaEId,
      label: `M-TOILET-${i}`,
      type: 'TOILET',
      gender: 'MALE',
      cleaningStatus: 'CLEAN',
      workingStatus: 'WORKING',
      lastUpdated: now(),
    };
    areaEFacilities.push(f);
    facilities.push(f);
  }

  // Female toilets
  for (let i = 1; i <= 4; i++) {
    const f: Facility = {
      id: generateId(),
      areaId: areaEId,
      label: `F-TOILET-${i}`,
      type: 'TOILET',
      gender: 'FEMALE',
      cleaningStatus: 'CLEAN',
      workingStatus: 'WORKING',
      lastUpdated: now(),
    };
    areaEFacilities.push(f);
    facilities.push(f);
  }

  // Accessible toilets
  const accMToilet: Facility = {
    id: generateId(),
    areaId: areaEId,
    label: 'ACC-M-TOILET',
    type: 'TOILET',
    gender: 'MALE',
    isAccessible: true,
    cleaningStatus: 'CLEAN',
    workingStatus: 'WORKING',
    lastUpdated: now(),
  };
  areaEFacilities.push(accMToilet);
  facilities.push(accMToilet);

  const accFToilet: Facility = {
    id: generateId(),
    areaId: areaEId,
    label: 'ACC-F-TOILET',
    type: 'TOILET',
    gender: 'FEMALE',
    isAccessible: true,
    cleaningStatus: 'CLEAN',
    workingStatus: 'WORKING',
    lastUpdated: now(),
  };
  areaEFacilities.push(accFToilet);
  facilities.push(accFToilet);

  // Male showers
  for (let i = 1; i <= 8; i++) {
    const f: Facility = {
      id: generateId(),
      areaId: areaEId,
      label: `M-SHOWER-${i}`,
      type: 'SHOWER',
      gender: 'MALE',
      cleaningStatus: 'CLEAN',
      workingStatus: 'WORKING',
      lastUpdated: now(),
    };
    areaEFacilities.push(f);
    facilities.push(f);
  }

  // Female showers
  for (let i = 1; i <= 8; i++) {
    const f: Facility = {
      id: generateId(),
      areaId: areaEId,
      label: `F-SHOWER-${i}`,
      type: 'SHOWER',
      gender: 'FEMALE',
      cleaningStatus: 'CLEAN',
      workingStatus: 'WORKING',
      lastUpdated: now(),
    };
    areaEFacilities.push(f);
    facilities.push(f);
  }

  areas.push({
    id: areaEId,
    name: 'Dining Hall Facilities',
    description: 'Toilets & Showers',
    facilityIds: areaEFacilities.map(f => f.id),
  });

  return { areas, facilities };
};

// ============================================================
// ACTIVITY SPACES
// ============================================================

const createActivitySpaces = (): ActivitySpace[] => [
  { id: 'ohel_moed', name: 'אוהל מועד', description: 'מרחב התכנסות מרכזי' },
  { id: 'bunker_6', name: 'ממ״ד 6', description: 'ממ״ד פעילות' },
  { id: 'bunker_7', name: 'ממ״ד 7', description: 'ממ״ד פעילות' },
  { id: 'bunker_8', name: 'ממ״ד 8', description: 'ממ״ד פעילות' },
  { id: 'dining_hall', name: 'חדר אוכל', description: 'אזור אוכל מרכזי' },
];

// ============================================================
// GENERATE COMPLETE INITIAL STATE
// ============================================================

export const generateInitialVillageState = (): VillageState => {
  // Generate all neighborhoods
  const n1 = createN123Neighborhood(1);
  const n2 = createN123Neighborhood(2);
  const n3 = createN123Neighborhood(3);
  const n4 = createN4Neighborhood();
  const n5 = createN5Neighborhood();
  const n6 = createN6Neighborhood();
  const n7 = createN7Neighborhood();
  const vip = createVIPNeighborhood();

  // Combine neighborhoods
  const allNeighborhoods = [n1, n2, n3, n4, n5, n6, n7, vip];
  
  const neighborhoods: Record<string, Neighborhood> = {};
  const tents: Record<string, Tent> = {};
  const beds: Record<string, Bed> = {};

  for (const n of allNeighborhoods) {
    neighborhoods[n.neighborhood.id] = n.neighborhood;
    for (const tent of n.tents) {
      tents[tent.id] = tent;
    }
    for (const bed of n.beds) {
      beds[bed.id] = bed;
    }
  }

  // Generate facilities
  const { areas, facilities: facilityList } = createFacilities();
  const facilityAreas: Record<string, FacilityArea> = {};
  const facilities: Record<string, Facility> = {};

  for (const area of areas) {
    facilityAreas[area.id] = area;
  }
  for (const facility of facilityList) {
    facilities[facility.id] = facility;
  }

  // Generate activity spaces
  const activitySpaceList = createActivitySpaces();
  const activitySpaces: Record<string, ActivitySpace> = {};
  for (const space of activitySpaceList) {
    activitySpaces[space.id] = space;
  }

  return {
    version: 1,
    lastModified: now(),
    neighborhoods,
    tents,
    beds,
    facilityAreas,
    facilities,
    activitySpaces,
    activityReservations: {},
    facilityReservations: {},
    neighborhoodReservations: {},
    dailyTasks: {},
    activityLog: [],
  };
};
