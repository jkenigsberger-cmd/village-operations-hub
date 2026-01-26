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

    // Create Alef and Bet tents (using Hebrew letters)
    for (const suffix of ['א', 'ב']) {
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
        isAlef: suffix === 'א',
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

  // ============================================================
  // AREA 1: חדר אוכל - גברים (Male Dining Hall) - Numbers 1-16
  // ============================================================
  const areaMaleId = 'area_dining_male';
  const areaMaleFacilities: Facility[] = [];

  // Showers 1-3
  for (let i = 1; i <= 3; i++) {
    const f: Facility = {
      id: generateId(),
      areaId: areaMaleId,
      label: `מקלחת ${i}`,
      type: 'SHOWER',
      gender: 'MALE',
      cleaningStatus: 'CLEAN',
      workingStatus: 'WORKING',
      lastUpdated: now(),
    };
    areaMaleFacilities.push(f);
    facilities.push(f);
  }

  // Accessible toilet 4
  const accMaleToilet: Facility = {
    id: generateId(),
    areaId: areaMaleId,
    label: 'תא 4 ♿',
    type: 'TOILET',
    gender: 'MALE',
    isAccessible: true,
    cleaningStatus: 'CLEAN',
    workingStatus: 'WORKING',
    lastUpdated: now(),
  };
  areaMaleFacilities.push(accMaleToilet);
  facilities.push(accMaleToilet);

  // Showers 5-12
  for (let i = 5; i <= 12; i++) {
    const f: Facility = {
      id: generateId(),
      areaId: areaMaleId,
      label: `מקלחת ${i}`,
      type: 'SHOWER',
      gender: 'MALE',
      cleaningStatus: 'CLEAN',
      workingStatus: 'WORKING',
      lastUpdated: now(),
    };
    areaMaleFacilities.push(f);
    facilities.push(f);
  }

  // Toilets 13-16
  for (let i = 13; i <= 16; i++) {
    const f: Facility = {
      id: generateId(),
      areaId: areaMaleId,
      label: `תא ${i}`,
      type: 'TOILET',
      gender: 'MALE',
      cleaningStatus: 'CLEAN',
      workingStatus: 'WORKING',
      lastUpdated: now(),
    };
    areaMaleFacilities.push(f);
    facilities.push(f);
  }

  areas.push({
    id: areaMaleId,
    name: 'חדר אוכל - גברים',
    description: 'מקלחות 1-3, 5-12 | תא 4 ♿ | תאים 13-16',
    facilityIds: areaMaleFacilities.map(f => f.id),
  });

  // ============================================================
  // AREA 2: חדר אוכל - נשים (Female Dining Hall) - Numbers 17-32
  // ============================================================
  const areaFemaleId = 'area_dining_female';
  const areaFemaleFacilities: Facility[] = [];

  // Toilets 17-20
  for (let i = 17; i <= 20; i++) {
    const f: Facility = {
      id: generateId(),
      areaId: areaFemaleId,
      label: `תא ${i}`,
      type: 'TOILET',
      gender: 'FEMALE',
      cleaningStatus: 'CLEAN',
      workingStatus: 'WORKING',
      lastUpdated: now(),
    };
    areaFemaleFacilities.push(f);
    facilities.push(f);
  }

  // Accessible toilet 21
  const accFemaleToilet: Facility = {
    id: generateId(),
    areaId: areaFemaleId,
    label: 'תא 21 ♿',
    type: 'TOILET',
    gender: 'FEMALE',
    isAccessible: true,
    cleaningStatus: 'CLEAN',
    workingStatus: 'WORKING',
    lastUpdated: now(),
  };
  areaFemaleFacilities.push(accFemaleToilet);
  facilities.push(accFemaleToilet);

  // Showers 22-32
  for (let i = 22; i <= 32; i++) {
    const f: Facility = {
      id: generateId(),
      areaId: areaFemaleId,
      label: `מקלחת ${i}`,
      type: 'SHOWER',
      gender: 'FEMALE',
      cleaningStatus: 'CLEAN',
      workingStatus: 'WORKING',
      lastUpdated: now(),
    };
    areaFemaleFacilities.push(f);
    facilities.push(f);
  }

  areas.push({
    id: areaFemaleId,
    name: 'חדר אוכל - נשים',
    description: 'תאים 17-20 | תא 21 ♿ | מקלחות 22-32',
    facilityIds: areaFemaleFacilities.map(f => f.id),
  });

  // ============================================================
  // AREA 3: מתא 33 עד 36 (בין שכונה 1 ל-2) - Numbers 33-36
  // ============================================================
  const areaN1N2Id = 'area_n1_n2';
  const areaN1N2Facilities: Facility[] = [];
  for (let i = 33; i <= 36; i++) {
    const f: Facility = {
      id: generateId(),
      areaId: areaN1N2Id,
      label: `תא ${i}`,
      type: 'TOILET',
      gender: 'UNISEX',
      cleaningStatus: 'CLEAN',
      workingStatus: 'WORKING',
      lastUpdated: now(),
    };
    areaN1N2Facilities.push(f);
    facilities.push(f);
  }
  areas.push({
    id: areaN1N2Id,
    name: 'מתא 33 עד 36 (בין שכונה 1 ל-2)',
    description: '4 שירותים',
    facilityIds: areaN1N2Facilities.map(f => f.id),
  });

  // ============================================================
  // AREA 4: מתא 37 עד 38 (בין שכונה 3 ל-4) - Numbers 37-38
  // ============================================================
  const areaN3N4Id = 'area_n3_n4';
  const areaN3N4Facilities: Facility[] = [];
  for (let i = 37; i <= 38; i++) {
    const f: Facility = {
      id: generateId(),
      areaId: areaN3N4Id,
      label: `תא ${i}`,
      type: 'TOILET',
      gender: 'UNISEX',
      cleaningStatus: 'CLEAN',
      workingStatus: 'WORKING',
      lastUpdated: now(),
    };
    areaN3N4Facilities.push(f);
    facilities.push(f);
  }
  areas.push({
    id: areaN3N4Id,
    name: 'מתא 37 עד 38 (בין שכונה 3 ל-4)',
    description: '2 שירותים',
    facilityIds: areaN3N4Facilities.map(f => f.id),
  });

  // ============================================================
  // AREA 5: מתא 39 עד 42 (אוהלים לבנים) - Numbers 39-42
  // ============================================================
  const areaWhiteId = 'area_white_tents';
  const areaWhiteFacilities: Facility[] = [];
  for (let i = 39; i <= 42; i++) {
    const f: Facility = {
      id: generateId(),
      areaId: areaWhiteId,
      label: `תא ${i}`,
      type: 'TOILET',
      gender: 'UNISEX',
      cleaningStatus: 'CLEAN',
      workingStatus: 'WORKING',
      lastUpdated: now(),
    };
    areaWhiteFacilities.push(f);
    facilities.push(f);
  }
  areas.push({
    id: areaWhiteId,
    name: 'מתא 39 עד 42 (אוהלים לבנים)',
    description: '4 שירותים',
    facilityIds: areaWhiteFacilities.map(f => f.id),
  });

  // ============================================================
  // AREA 6: מתא 43 עד 46 (בין שכונה 4 ל-7) - Numbers 43-46
  // ============================================================
  const areaN4N7Id = 'area_n4_n7';
  const areaN4N7Facilities: Facility[] = [];
  for (let i = 43; i <= 46; i++) {
    const f: Facility = {
      id: generateId(),
      areaId: areaN4N7Id,
      label: `תא ${i}`,
      type: 'TOILET',
      gender: 'UNISEX',
      cleaningStatus: 'CLEAN',
      workingStatus: 'WORKING',
      lastUpdated: now(),
    };
    areaN4N7Facilities.push(f);
    facilities.push(f);
  }
  areas.push({
    id: areaN4N7Id,
    name: 'מתא 43 עד 46 (בין שכונה 4 ל-7)',
    description: '4 שירותים',
    facilityIds: areaN4N7Facilities.map(f => f.id),
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
