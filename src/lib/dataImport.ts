// Data import utility - Import localStorage data to Cloud database
import { supabase } from '@/integrations/supabase/client';
import { VillageState, Tent, Bed, Facility, FacilityArea, ActivitySpace, Neighborhood } from '@/types/village';
import { GroupRecord, ADMIN_GROUPS_STORAGE_KEY } from '@/types/adminGroups';
import { KitchenState } from '@/types/kitchen';
import { AllocationRecord, ALLOCATIONS_STORAGE_KEY } from '@/types/groupAllocation';
import { 
  IncomeEntry, 
  ExpenseEntry, 
  OutsourcedEntry,
  ADMIN_INCOME_STORAGE_KEY,
  ADMIN_EXPENSES_STORAGE_KEY,
  ADMIN_OUTSOURCED_STORAGE_KEY
} from '@/types/adminFinance';

const VILLAGE_STORAGE_KEY = 'aharonson_farm_village_state';
const KITCHEN_STORAGE_KEY = 'aharonson_farm_kitchen_state';

export interface ImportResult {
  success: boolean;
  message: string;
  stats?: {
    neighborhoods: number;
    tents: number;
    beds: number;
    facilities: number;
    facilityAreas: number;
    activitySpaces: number;
    groups: number;
    kitchenSlots: number;
    allocations: number;
    income: number;
    expenses: number;
    outsourced: number;
  };
}

// Import village state (tents, beds, neighborhoods, facilities, etc.)
export async function importVillageState(state: VillageState): Promise<ImportResult> {
  try {
    // 1. Import neighborhoods first (foreign key dependency)
    const neighborhoods = Object.values(state.neighborhoods);
    if (neighborhoods.length > 0) {
      const neighborhoodRows = neighborhoods.map(n => ({
        id: n.id,
        name: n.name,
        display_name: n.displayName,
        description: n.description || null,
        has_double_tents: n.hasDoubleTents || false,
        is_white_tent: n.isWhiteTent || false
      }));
      
      const { error: nError } = await supabase.from('neighborhoods').upsert(neighborhoodRows, { onConflict: 'id' });
      if (nError) throw new Error(`Failed to import neighborhoods: ${nError.message}`);
    }

    // 2. Import facility areas
    const facilityAreas = Object.values(state.facilityAreas);
    if (facilityAreas.length > 0) {
      const areaRows = facilityAreas.map(fa => ({
        id: fa.id,
        name: fa.name,
        description: fa.description
      }));
      
      const { error: faError } = await supabase.from('facility_areas').upsert(areaRows, { onConflict: 'id' });
      if (faError) throw new Error(`Failed to import facility areas: ${faError.message}`);
    }

    // 3. Import tents (depends on neighborhoods)
    const tents = Object.values(state.tents);
    if (tents.length > 0) {
      const tentRows = tents.map(t => ({
        id: t.id,
        neighborhood_id: t.neighborhoodId,
        code: t.code,
        double_tent_id: t.doubleTentId || null,
        is_alef: t.isAlef || null,
        group_name: t.groupName || null,
        people_count: t.peopleCount || null,
        check_in_date: t.checkInDate || null,
        check_out_date: t.checkOutDate || null,
        notes: t.notes || null,
        cleaning_status: t.cleaningStatus || 'CLEAN',
        cleaning_assigned_to: t.cleaningAssignedTo || null,
        gender: t.gender || null,
        has_private_bathroom: t.hasPrivateBathroom || false,
        has_private_shower: t.hasPrivateShower || false,
        bathroom_working_status: t.bathroomWorkingStatus || null,
        bathroom_maintenance_notes: t.bathroomMaintenanceNotes || null,
        bathroom_maintenance_image: t.bathroomMaintenanceImage || null,
        shower_working_status: t.showerWorkingStatus || null,
        shower_maintenance_notes: t.showerMaintenanceNotes || null,
        shower_maintenance_image: t.showerMaintenanceImage || null,
        is_accessible: t.isAccessible || false,
        is_vip: t.isVIP || false
      }));
      
      const { error: tError } = await supabase.from('tents').upsert(tentRows, { onConflict: 'id' });
      if (tError) throw new Error(`Failed to import tents: ${tError.message}`);
    }

    // 4. Import beds (depends on tents)
    const beds = Object.values(state.beds);
    if (beds.length > 0) {
      const bedRows = beds.map(b => ({
        id: b.id,
        tent_id: b.tentId,
        label: b.label,
        bed_type: b.type,
        bunk_number: b.bunkNumber || null,
        status: b.status || 'FREE',
        guest_name: b.guestName || null
      }));
      
      const { error: bError } = await supabase.from('beds').upsert(bedRows, { onConflict: 'id' });
      if (bError) throw new Error(`Failed to import beds: ${bError.message}`);
    }

    // 5. Import facilities (depends on facility areas)
    const facilities = Object.values(state.facilities);
    if (facilities.length > 0) {
      const facilityRows = facilities.map(f => ({
        id: f.id,
        area_id: f.areaId,
        label: f.label,
        facility_type: f.type,
        gender: f.gender || 'UNISEX',
        is_accessible: f.isAccessible || false,
        cleaning_status: f.cleaningStatus || 'CLEAN',
        working_status: f.workingStatus || 'WORKING',
        notes: f.notes || null,
        maintenance_image: f.maintenanceImage || null,
        maintenance_notes: f.maintenanceNotes || null
      }));
      
      const { error: fError } = await supabase.from('facilities').upsert(facilityRows, { onConflict: 'id' });
      if (fError) throw new Error(`Failed to import facilities: ${fError.message}`);
    }

    // 6. Import activity spaces
    const activitySpaces = Object.values(state.activitySpaces);
    if (activitySpaces.length > 0) {
      const spaceRows = activitySpaces.map(as => ({
        id: as.id,
        name: as.name,
        description: as.description || null,
        cleaning_status: as.cleaningStatus || null,
        cleaning_notes: as.cleaningNotes || null,
        working_status: as.workingStatus || null,
        notes: as.notes || null,
        maintenance_image: as.maintenanceImage || null,
        maintenance_notes: as.maintenanceNotes || null
      }));
      
      const { error: asError } = await supabase.from('activity_spaces').upsert(spaceRows, { onConflict: 'id' });
      if (asError) throw new Error(`Failed to import activity spaces: ${asError.message}`);
    }

    // 7. Import neighborhood reservations
    const neighborhoodReservations = Object.values(state.neighborhoodReservations || {});
    if (neighborhoodReservations.length > 0) {
      const nrRows = neighborhoodReservations.map(nr => ({
        id: nr.id,
        neighborhood_id: nr.neighborhoodId,
        group_name: nr.groupName,
        check_in_date: nr.checkInDate,
        check_out_date: nr.checkOutDate,
        reservation_type: nr.reservationType,
        tent_ids: nr.tentIds ? JSON.parse(JSON.stringify(nr.tentIds)) : null,
        tent_count: nr.tentCount || null,
        gender_distribution: nr.genderDistribution ? JSON.parse(JSON.stringify(nr.genderDistribution)) : null,
        total_beds: nr.totalBeds || null,
        total_people: nr.totalPeople || null,
        contact_name: nr.contactName || null,
        contact_phone: nr.contactPhone || null,
        notes: nr.notes || null
      }));
      
      const { error: nrError } = await supabase.from('neighborhood_reservations').upsert(nrRows, { onConflict: 'id' });
      if (nrError) throw new Error(`Failed to import neighborhood reservations: ${nrError.message}`);
    }

    // 8. Import activity reservations
    const activityReservations = Object.values(state.activityReservations || {});
    if (activityReservations.length > 0) {
      const arRows = activityReservations.map(ar => ({
        id: ar.id,
        space_id: ar.spaceId,
        date: ar.date,
        start_time: ar.startTime,
        end_time: ar.endTime,
        group_name: ar.groupName,
        notes: ar.notes || null,
        source: ar.source || 'manual',
        group_id: ar.groupId || null,
        status: ar.status || 'confirmed'
      }));
      
      const { error: arError } = await supabase.from('activity_reservations').upsert(arRows, { onConflict: 'id' });
      if (arError) throw new Error(`Failed to import activity reservations: ${arError.message}`);
    }

    // 9. Import facility reservations
    const facilityReservations = Object.values(state.facilityReservations || {});
    if (facilityReservations.length > 0) {
      const frRows = facilityReservations.map(fr => ({
        id: fr.id,
        facility_id: fr.facilityId,
        date: fr.date,
        start_time: fr.startTime,
        end_time: fr.endTime,
        group_name: fr.groupName,
        number_of_people: fr.numberOfPeople || null,
        group_color: fr.groupColor || null,
        notes: fr.notes || null
      }));
      
      const { error: frError } = await supabase.from('facility_reservations').upsert(frRows, { onConflict: 'id' });
      if (frError) throw new Error(`Failed to import facility reservations: ${frError.message}`);
    }

    // 10. Import daily tasks
    const dailyTasks = Object.values(state.dailyTasks || {});
    if (dailyTasks.length > 0) {
      const dtRows = dailyTasks.map(dt => ({
        id: dt.id,
        date: dt.date,
        task_type: dt.type,
        title: dt.title,
        description: dt.description || null,
        entity_type: dt.entityType || null,
        entity_id: dt.entityId || null,
        status: dt.status || 'PENDING',
        assigned_to: dt.assignedTo || null,
        maintenance_image: dt.maintenanceImage || null,
        facility_type: dt.facilityType || null,
        completed_at: dt.completedAt || null
      }));
      
      const { error: dtError } = await supabase.from('daily_tasks').upsert(dtRows, { onConflict: 'id' });
      if (dtError) throw new Error(`Failed to import daily tasks: ${dtError.message}`);
    }

    return {
      success: true,
      message: 'Village state imported successfully',
      stats: {
        neighborhoods: neighborhoods.length,
        tents: tents.length,
        beds: beds.length,
        facilities: facilities.length,
        facilityAreas: facilityAreas.length,
        activitySpaces: activitySpaces.length,
        groups: 0,
        kitchenSlots: 0,
        allocations: 0,
        income: 0,
        expenses: 0,
        outsourced: 0
      }
    };
  } catch (error) {
    console.error('Error importing village state:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to import village state'
    };
  }
}

// Import admin groups
export async function importGroups(groups: GroupRecord[]): Promise<ImportResult> {
  try {
    if (groups.length === 0) {
      return { success: true, message: 'No groups to import', stats: { neighborhoods: 0, tents: 0, beds: 0, facilities: 0, facilityAreas: 0, activitySpaces: 0, groups: 0, kitchenSlots: 0, allocations: 0, income: 0, expenses: 0, outsourced: 0 } };
    }

    const groupRows = groups.map(g => ({
      id: g.id,
      name: g.groupName,
      contact_name: g.reservedBy || null,
      contact_phone: g.contactPhone || null,
      arrival_date: g.startDate,
      departure_date: g.endDate,
      total_pax: g.pax,
      staff_count: g.staffCount || 0,
      participant_count: g.participantCount || 0,
      vip_people_per_tent: g.vipPeoplePerTent || 3,
      remaining_staff: g.remainingStaff || 0,
      remaining_participants: g.remainingParticipants || 0,
      notes: g.notes || null,
      status: g.isArchived ? 'archived' : (g.status || 'confirmed'),
      meal_plan: JSON.parse(JSON.stringify(g.mealsPlan || {})),
      schedule_items: JSON.parse(JSON.stringify(g.scheduleItems || [])),
      vip_tent_configs: JSON.parse(JSON.stringify(g.vipTentConfigs || []))
    }));

    const { error } = await supabase.from('groups').upsert(groupRows, { onConflict: 'id' });
    if (error) throw new Error(`Failed to import groups: ${error.message}`);

    return {
      success: true,
      message: `Imported ${groups.length} groups`,
      stats: { neighborhoods: 0, tents: 0, beds: 0, facilities: 0, facilityAreas: 0, activitySpaces: 0, groups: groups.length, kitchenSlots: 0, allocations: 0, income: 0, expenses: 0, outsourced: 0 }
    };
  } catch (error) {
    console.error('Error importing groups:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to import groups'
    };
  }
}

// Import kitchen time slots
export async function importKitchenState(state: KitchenState): Promise<ImportResult> {
  try {
    const timeSlots = Object.values(state.timeSlots);
    if (timeSlots.length === 0) {
      return { success: true, message: 'No kitchen slots to import', stats: { neighborhoods: 0, tents: 0, beds: 0, facilities: 0, facilityAreas: 0, activitySpaces: 0, groups: 0, kitchenSlots: 0, allocations: 0, income: 0, expenses: 0, outsourced: 0 } };
    }

    const slotRows = timeSlots.map(ts => ({
      id: ts.id,
      date: ts.date,
      meal_type: ts.mealType,
      time: ts.time,
      location: ts.location,
      total_pax: ts.totalPax,
      special_diets: JSON.parse(JSON.stringify(ts.specialDiets)),
      groups: JSON.parse(JSON.stringify(ts.groups))
    }));

    const { error } = await supabase.from('kitchen_time_slots').upsert(slotRows, { onConflict: 'id' });
    if (error) throw new Error(`Failed to import kitchen slots: ${error.message}`);

    return {
      success: true,
      message: `Imported ${timeSlots.length} kitchen time slots`,
      stats: { neighborhoods: 0, tents: 0, beds: 0, facilities: 0, facilityAreas: 0, activitySpaces: 0, groups: 0, kitchenSlots: timeSlots.length, allocations: 0, income: 0, expenses: 0, outsourced: 0 }
    };
  } catch (error) {
    console.error('Error importing kitchen state:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to import kitchen state'
    };
  }
}

// Import allocations
export async function importAllocations(allocations: AllocationRecord[]): Promise<ImportResult> {
  try {
    if (allocations.length === 0) {
      return { success: true, message: 'No allocations to import', stats: { neighborhoods: 0, tents: 0, beds: 0, facilities: 0, facilityAreas: 0, activitySpaces: 0, groups: 0, kitchenSlots: 0, allocations: 0, income: 0, expenses: 0, outsourced: 0 } };
    }

    const allocRows = allocations.map(a => ({
      id: a.id,
      group_id: a.groupId,
      date_range_start: a.dateRangeStart,
      date_range_end: a.dateRangeEnd,
      allocation_type: a.allocationType,
      resource_id: a.resourceId,
      resource_label: a.resourceLabel,
      beds_assigned: a.bedsAssigned
    }));

    const { error } = await supabase.from('allocations').upsert(allocRows, { onConflict: 'id' });
    if (error) throw new Error(`Failed to import allocations: ${error.message}`);

    return {
      success: true,
      message: `Imported ${allocations.length} allocations`,
      stats: { neighborhoods: 0, tents: 0, beds: 0, facilities: 0, facilityAreas: 0, activitySpaces: 0, groups: 0, kitchenSlots: 0, allocations: allocations.length, income: 0, expenses: 0, outsourced: 0 }
    };
  } catch (error) {
    console.error('Error importing allocations:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to import allocations'
    };
  }
}

// Import finance data
export async function importFinanceData(
  income: IncomeEntry[],
  expenses: ExpenseEntry[],
  outsourced: OutsourcedEntry[]
): Promise<ImportResult> {
  try {
    // Import income - map 'source' field to 'group_name' in DB
    if (income.length > 0) {
      const incomeRows = income.map(i => ({
        id: i.id,
        group_name: i.source, // IncomeEntry uses 'source', DB uses 'group_name'
        amount: i.amount,
        description: i.notes || null, // IncomeEntry uses 'notes', DB uses 'description'
        date: i.date
      }));

      const { error } = await supabase.from('income').upsert(incomeRows, { onConflict: 'id' });
      if (error) throw new Error(`Failed to import income: ${error.message}`);
    }

    // Import expenses - map 'notes' field to 'description' in DB
    if (expenses.length > 0) {
      const expenseRows = expenses.map(e => ({
        id: e.id,
        category: e.category,
        amount: e.amount,
        description: e.notes || null, // ExpenseEntry uses 'notes', DB uses 'description'
        date: e.date
      }));

      const { error } = await supabase.from('expenses').upsert(expenseRows, { onConflict: 'id' });
      if (error) throw new Error(`Failed to import expenses: ${error.message}`);
    }

    // Import outsourced - map 'name' field to 'worker_name' in DB
    if (outsourced.length > 0) {
      const outsourcedRows = outsourced.map(o => ({
        id: o.id,
        worker_name: o.name, // OutsourcedEntry uses 'name', DB uses 'worker_name'
        role: o.role,
        hours: o.hours || 0,
        hourly_rate: o.hourlyRate || 0,
        date: o.date,
        notes: o.notes || null
      }));

      const { error } = await supabase.from('outsourced').upsert(outsourcedRows, { onConflict: 'id' });
      if (error) throw new Error(`Failed to import outsourced: ${error.message}`);
    }

    return {
      success: true,
      message: `Imported ${income.length} income, ${expenses.length} expenses, ${outsourced.length} outsourced entries`,
      stats: { neighborhoods: 0, tents: 0, beds: 0, facilities: 0, facilityAreas: 0, activitySpaces: 0, groups: 0, kitchenSlots: 0, allocations: 0, income: income.length, expenses: expenses.length, outsourced: outsourced.length }
    };
  } catch (error) {
    console.error('Error importing finance data:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to import finance data'
    };
  }
}

// Import all data from localStorage
export async function importAllFromLocalStorage(): Promise<ImportResult> {
  const results: ImportResult[] = [];
  const stats = {
    neighborhoods: 0,
    tents: 0,
    beds: 0,
    facilities: 0,
    facilityAreas: 0,
    activitySpaces: 0,
    groups: 0,
    kitchenSlots: 0,
    allocations: 0,
    income: 0,
    expenses: 0,
    outsourced: 0
  };

  try {
    // 1. Import village state
    const villageStateStr = localStorage.getItem(VILLAGE_STORAGE_KEY);
    if (villageStateStr) {
      const villageState = JSON.parse(villageStateStr) as VillageState;
      const result = await importVillageState(villageState);
      results.push(result);
      if (result.stats) {
        stats.neighborhoods = result.stats.neighborhoods;
        stats.tents = result.stats.tents;
        stats.beds = result.stats.beds;
        stats.facilities = result.stats.facilities;
        stats.facilityAreas = result.stats.facilityAreas;
        stats.activitySpaces = result.stats.activitySpaces;
      }
    }

    // 2. Import groups
    const groupsStr = localStorage.getItem(ADMIN_GROUPS_STORAGE_KEY);
    if (groupsStr) {
      const groups = JSON.parse(groupsStr) as GroupRecord[];
      const result = await importGroups(groups);
      results.push(result);
      if (result.stats) {
        stats.groups = result.stats.groups;
      }
    }

    // 3. Import kitchen state
    const kitchenStateStr = localStorage.getItem(KITCHEN_STORAGE_KEY);
    if (kitchenStateStr) {
      const kitchenState = JSON.parse(kitchenStateStr) as KitchenState;
      const result = await importKitchenState(kitchenState);
      results.push(result);
      if (result.stats) {
        stats.kitchenSlots = result.stats.kitchenSlots;
      }
    }

    // 4. Import allocations
    const allocationsStr = localStorage.getItem(ALLOCATIONS_STORAGE_KEY);
    if (allocationsStr) {
      const allocations = JSON.parse(allocationsStr) as AllocationRecord[];
      const result = await importAllocations(allocations);
      results.push(result);
      if (result.stats) {
        stats.allocations = result.stats.allocations;
      }
    }

    // 5. Import finance data
    const incomeStr = localStorage.getItem(ADMIN_INCOME_STORAGE_KEY);
    const expensesStr = localStorage.getItem(ADMIN_EXPENSES_STORAGE_KEY);
    const outsourcedStr = localStorage.getItem(ADMIN_OUTSOURCED_STORAGE_KEY);
    
    const income = incomeStr ? JSON.parse(incomeStr) as IncomeEntry[] : [];
    const expenses = expensesStr ? JSON.parse(expensesStr) as ExpenseEntry[] : [];
    const outsourced = outsourcedStr ? JSON.parse(outsourcedStr) as OutsourcedEntry[] : [];
    
    if (income.length > 0 || expenses.length > 0 || outsourced.length > 0) {
      const result = await importFinanceData(income, expenses, outsourced);
      results.push(result);
      if (result.stats) {
        stats.income = result.stats.income;
        stats.expenses = result.stats.expenses;
        stats.outsourced = result.stats.outsourced;
      }
    }

    // Check if any imports failed
    const failedResults = results.filter(r => !r.success);
    if (failedResults.length > 0) {
      return {
        success: false,
        message: `Some imports failed: ${failedResults.map(r => r.message).join('; ')}`,
        stats
      };
    }

    return {
      success: true,
      message: 'All data imported successfully from browser storage',
      stats
    };
  } catch (error) {
    console.error('Error importing all data:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to import data'
    };
  }
}

// Check if localStorage has data to import
export function hasLocalStorageData(): boolean {
  const villageState = localStorage.getItem(VILLAGE_STORAGE_KEY);
  const groups = localStorage.getItem(ADMIN_GROUPS_STORAGE_KEY);
  const kitchenState = localStorage.getItem(KITCHEN_STORAGE_KEY);
  
  return !!(villageState || groups || kitchenState);
}

// Clear all localStorage data after successful import
export function clearLocalStorageData(): void {
  localStorage.removeItem(VILLAGE_STORAGE_KEY);
  localStorage.removeItem(ADMIN_GROUPS_STORAGE_KEY);
  localStorage.removeItem(KITCHEN_STORAGE_KEY);
  localStorage.removeItem(ALLOCATIONS_STORAGE_KEY);
  localStorage.removeItem(ADMIN_INCOME_STORAGE_KEY);
  localStorage.removeItem(ADMIN_EXPENSES_STORAGE_KEY);
  localStorage.removeItem(ADMIN_OUTSOURCED_STORAGE_KEY);
}
