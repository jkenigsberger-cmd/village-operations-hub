export interface GroupStayNeighborhood {
  neighborhoodId: string;
  neighborhoodName: string;
}

export interface GroupStayVipTent {
  tentNumber: string;
  bedsAssigned: number;
}

export interface GroupStay {
  key: string; // groupId + startDate + endDate
  groupId: string;
  groupName: string;
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  participantsTotal: number;
  staffTotal: number;
  boysCount?: number;
  girlsCount?: number;
  neighborhoods: GroupStayNeighborhood[];
  vipTents: GroupStayVipTent[];
  vipTentCount: number;
  staffCount: number; // declared staff from groups table
  isAllocated: boolean; // true if at least one neighborhood reservation exists
  statusForDay?: 'sleeping' | 'check-in' | 'check-out';
}
