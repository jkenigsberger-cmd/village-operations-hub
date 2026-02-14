import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAdminGroups } from '@/hooks/useAdminGroups';
import { useVillage } from '@/context/VillageContext';
import { useKitchenData } from '@/hooks/useKitchenData';
import { useGroupAllocation } from '@/hooks/useGroupAllocation';
import { getLinkedRecordsDescription, cascadeDeleteGroupRecords } from '@/lib/groupLinkedRecords';
import { syncGroupToModules, SyncResult, preValidateScheduleConflicts } from '@/lib/groupSync';
import { 
  GroupRecord, 
  GroupType,
  AssignmentStatus,
  ScheduleItem, 
  ScheduleCategory,
  VIPTentConfig,
  MealPlanItem,
  SCHEDULE_LOCATIONS, 
  SCHEDULE_CATEGORY_LABELS,
  SPACE_ID_MAP 
} from '@/types/adminGroups';
import { DistributionPreference } from '@/types/distributionPreference';
import { MealType, MEAL_LABELS } from '@/types/kitchen';
import { CapacityCheckResult } from '@/types/groupAllocation';
import { BreadcrumbNav } from '@/components/BreadcrumbNav';
import { VIPTentPlanner } from '@/components/VIPTentPlanner';
import { NumericInput } from '@/components/NumericInput';
import { SleepingTentDistributionSection } from '@/components/SleepingTentDistributionSection';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { 
  Users, 
  Save, 
  Calendar, 
  Phone, 
  Plus,
  Trash2,
  Loader2,
  Clock,
  Building2,
  ChefHat,
  AlertCircle,
  Sun,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  UserCheck,
  Tent,
  Archive,
  Utensils
} from 'lucide-react';
import { format, parseISO, isWithinInterval, isSameDay } from 'date-fns';
import { he } from 'date-fns/locale';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

// Empty schedule item with sensible defaults
const emptyScheduleItem = (defaultDate?: string): ScheduleItem => ({
  id: Math.random().toString(36).substring(2, 11),
  date: defaultDate || format(new Date(), 'yyyy-MM-dd'),
  startTime: '09:00',
  endTime: '10:00',
  category: 'ACTIVITY',
  location: '',
  description: '',
});

// Empty meal plan item
const emptyMealPlanItem = (defaultDate?: string, defaultPax?: number): MealPlanItem => ({
  id: Math.random().toString(36).substring(2, 11),
  date: defaultDate || format(new Date(), 'yyyy-MM-dd'),
  mealType: 'LUNCH',
  time: '13:00',
  location: 'DINING_HALL',
  pax: defaultPax ?? 0,
});

// Validate schedule item time range
const validateScheduleItemTime = (item: ScheduleItem): string | null => {
  if (item.startTime && item.endTime && item.startTime >= item.endTime) {
    return 'שעת הסיום חייבת להיות אחרי שעת ההתחלה';
  }
  return null;
};

// Date coherence validation types
interface DateValidationError {
  id: string;
  type: 'schedule' | 'meal';
  date: string;
  description: string;
}

// Check if a date is within the group's date range (inclusive)
const isDateInRange = (itemDate: string, startDate: string, endDate: string): boolean => {
  const date = parseISO(itemDate);
  const start = parseISO(startDate);
  const end = parseISO(endDate);
  
  return isSameDay(date, start) || isSameDay(date, end) || 
         isWithinInterval(date, { start, end });
};

// Validate all items are within group date range
const validateDateCoherence = (
  startDate: string,
  endDate: string,
  scheduleItems: ScheduleItem[],
  mealsPlan: MealPlanItem[]
): DateValidationError[] => {
  const errors: DateValidationError[] = [];
  
  // Validate schedule items
  scheduleItems.forEach(item => {
    if (!isDateInRange(item.date, startDate, endDate)) {
      errors.push({
        id: item.id,
        type: 'schedule',
        date: item.date,
        description: `${SCHEDULE_CATEGORY_LABELS[item.category]}${item.description ? ` - ${item.description}` : ''}`,
      });
    }
  });
  
  // Validate meals
  mealsPlan.forEach(meal => {
    if (!isDateInRange(meal.date, startDate, endDate)) {
      errors.push({
        id: meal.id,
        type: 'meal',
        date: meal.date,
        description: `${MEAL_LABELS[meal.mealType]} ${meal.time}`,
      });
    }
  });
  
  return errors;
};

// Space booking modal component
interface SpaceBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { spaceId: string; date: string; startTime: string; endTime: string; notes?: string }) => void;
  groupDates: { start: string; end: string };
}

const SpaceBookingModal: React.FC<SpaceBookingModalProps> = ({ isOpen, onClose, onSubmit, groupDates }) => {
  const [spaceId, setSpaceId] = useState('');
  const [date, setDate] = useState(groupDates.start);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('12:00');
  const [notes, setNotes] = useState('');

  const handleSubmit = () => {
    if (!spaceId || !date || !startTime || !endTime) {
      toast.error('נא למלא את כל השדות');
      return;
    }
    if (startTime >= endTime) {
      toast.error('שעת סיום חייבת להיות אחרי שעת התחלה');
      return;
    }
    onSubmit({ spaceId, date, startTime, endTime, notes });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            הזמנת מרחב
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">מרחב</label>
            <Select value={spaceId} onValueChange={setSpaceId}>
              <SelectTrigger>
                <SelectValue placeholder="בחר מרחב" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(SPACE_ID_MAP).map(([name, id]) => (
                  <SelectItem key={id} value={id}>{name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">תאריך</label>
            <Input 
              type="date" 
              value={date} 
              onChange={(e) => setDate(e.target.value)}
              min={groupDates.start}
              max={groupDates.end}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">שעת התחלה</label>
              <Input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">שעת סיום</label>
              <Input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">הערות (אופציונלי)</label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>ביטול</Button>
          <Button onClick={handleSubmit}>הזמן מרחב</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// Meal booking modal component
interface MealBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { mealType: MealType; date: string; time: string; location: 'DINING_HALL' | 'OUTSIDE'; pax: number }) => void;
  groupDates: { start: string; end: string };
  defaultPax: number;
}

const MealBookingModal: React.FC<MealBookingModalProps> = ({ isOpen, onClose, onSubmit, groupDates, defaultPax }) => {
  const [mealType, setMealType] = useState<MealType>('LUNCH');
  const [date, setDate] = useState(groupDates.start);
  const [time, setTime] = useState('13:00');
  const [location, setLocation] = useState<'DINING_HALL' | 'OUTSIDE'>('DINING_HALL');
  const [pax, setPax] = useState(defaultPax);

  const handleSubmit = () => {
    if (!date || !time) {
      toast.error('נא למלא את כל השדות');
      return;
    }
    onSubmit({ mealType, date, time, location, pax });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ChefHat className="w-5 h-5" />
            הוספת ארוחה
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">סוג ארוחה</label>
            <Select value={mealType} onValueChange={(v) => setMealType(v as MealType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="BREAKFAST">{MEAL_LABELS.BREAKFAST}</SelectItem>
                <SelectItem value="LUNCH">{MEAL_LABELS.LUNCH}</SelectItem>
                <SelectItem value="DINNER">{MEAL_LABELS.DINNER}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">תאריך</label>
            <Input 
              type="date" 
              value={date} 
              onChange={(e) => setDate(e.target.value)}
              min={groupDates.start}
              max={groupDates.end}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">שעה</label>
            <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">מיקום</label>
            <Select value={location} onValueChange={(v) => setLocation(v as 'DINING_HALL' | 'OUTSIDE')}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="DINING_HALL">חדר אוכל</SelectItem>
                <SelectItem value="OUTSIDE">מחוץ לחדר אוכל</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">מספר סועדים</label>
            <NumericInput value={pax} onChange={setPax} min={1} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>ביטול</Button>
          <Button onClick={handleSubmit}>הוסף ארוחה</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// Capacity Check Result Display
interface CapacityResultDisplayProps {
  result: CapacityCheckResult | null;
}

const CapacityResultDisplay: React.FC<CapacityResultDisplayProps> = ({ result }) => {
  if (!result) return null;

  return (
    <div className={cn(
      "p-4 rounded-lg border-2 space-y-3",
      result.isAvailable 
        ? "bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-800" 
        : "bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-800"
    )}>
      <div className="flex items-center gap-2 font-semibold text-lg">
        {result.isAvailable ? (
          <>
            <CheckCircle2 className="w-6 h-6 text-green-600" />
            <span className="text-green-700 dark:text-green-400">✅ יש מספיק מקום</span>
          </>
        ) : (
          <>
            <XCircle className="w-6 h-6 text-red-600" />
            <span className="text-red-700 dark:text-red-400">❌ אין מספיק מקום</span>
          </>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
        {/* VIP / Staff */}
        <div className={cn(
          "p-3 rounded-lg",
          result.vipBeds.shortage > 0 ? "bg-red-100 dark:bg-red-900/30" : "bg-green-100 dark:bg-green-900/30"
        )}>
          <div className="font-medium flex items-center gap-2">
            <UserCheck className="w-4 h-4" />
            צוות (VIP)
          </div>
          <div className="mt-1">
            נדרש: {result.vipBeds.required} | זמין: {result.vipBeds.available}
            {result.vipBeds.shortage > 0 && (
              <span className="text-red-600 font-bold mr-2">
                (חסר: {result.vipBeds.shortage})
              </span>
            )}
          </div>
        </div>

        {/* Participants */}
        <div className={cn(
          "p-3 rounded-lg",
          result.participantBeds.shortage > 0 ? "bg-red-100 dark:bg-red-900/30" : "bg-green-100 dark:bg-green-900/30"
        )}>
          <div className="font-medium flex items-center gap-2">
            <Tent className="w-4 h-4" />
            חניכים (שכונות)
          </div>
          <div className="mt-1">
            נדרש: {result.participantBeds.required} | זמין: {result.participantBeds.available}
            {result.participantBeds.shortage > 0 && (
              <span className="text-red-600 font-bold mr-2">
                (חסר: {result.participantBeds.shortage})
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Locked Neighborhoods */}
      {result.lockedNeighborhoods.length > 0 && (
        <div className="p-3 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
          <div className="font-medium flex items-center gap-2 text-amber-800 dark:text-amber-200">
            <AlertTriangle className="w-4 h-4" />
            שכונות תפוסות
          </div>
          <ul className="mt-1 text-sm">
            {result.lockedNeighborhoods.map(n => (
              <li key={n.id}>• {n.name} - {n.groupName}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

const AdminGroupEdit = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isNew = id === 'new';
  const { groups, isLoading, addGroup, updateGroup, getGroup, deleteGroup, archiveGroup, addLinkedSpaceReservation, addLinkedKitchenSlot } = useAdminGroups();
  const { addActivityReservation } = useVillage();
  const { addTimeSlot } = useKitchenData();
  const { checkCapacity } = useGroupAllocation();

  const [spaceModalOpen, setSpaceModalOpen] = useState(false);
  const [mealModalOpen, setMealModalOpen] = useState(false);
  const [choiceDialogOpen, setChoiceDialogOpen] = useState(false);
  const [confirmDeleteDialogOpen, setConfirmDeleteDialogOpen] = useState(false);
  const [startDateOpen, setStartDateOpen] = useState(false);
  const [endDateOpen, setEndDateOpen] = useState(false);
  const [openScheduleDateId, setOpenScheduleDateId] = useState<string | null>(null);
  const [openMealDateId, setOpenMealDateId] = useState<string | null>(null);
  const [capacityResult, setCapacityResult] = useState<CapacityCheckResult | null>(null);
  const [isCheckingCapacity, setIsCheckingCapacity] = useState(false);
  const [vipTentConfigs, setVipTentConfigs] = useState<VIPTentConfig[]>([]);
  const [mealsPlan, setMealsPlan] = useState<MealPlanItem[]>([]);
  const [distributionPreference, setDistributionPreference] = useState<DistributionPreference | null>(null);
  const [conflictErrors, setConflictErrors] = useState<Record<string, string>>({});
  const [newItemId, setNewItemId] = useState<string | null>(null);
  const scheduleCardRef = useRef<HTMLDivElement>(null);

  const [formData, setFormData] = useState<Omit<GroupRecord, 'id' | 'createdAt' | 'updatedAt'>>({
    groupName: '',
    reservedBy: '',
    contactPhone: '',
    pax: 10,
    startDate: format(new Date(), 'yyyy-MM-dd'),
    endDate: format(new Date(), 'yyyy-MM-dd'),
    notes: '',
    scheduleItems: [],
    status: 'PLANNED',
    groupType: 'לינה',
    arrivalTime: '09:00',
    departureTime: '17:00',
    staffCount: 0,
    participantCount: 10,
    vipPeoplePerTent: 3,
    vipTentConfigs: [],
    mealsPlan: [],
    remainingStaff: 0,
    remainingParticipants: 10,
    assignmentStatus: 'pending_allocation' as AssignmentStatus,
  });

  useEffect(() => {
    if (!isNew && id) {
      const existing = getGroup(id);
      if (existing) {
        setFormData({
          groupName: existing.groupName,
          reservedBy: existing.reservedBy,
          contactPhone: existing.contactPhone || '',
          pax: existing.pax,
          startDate: existing.startDate,
          endDate: existing.endDate,
          notes: existing.notes || '',
          scheduleItems: existing.scheduleItems,
          status: existing.status,
          groupType: existing.groupType || 'לינה',
          arrivalTime: existing.arrivalTime || '09:00',
          departureTime: existing.departureTime || '17:00',
          linkedSpaceReservationIds: existing.linkedSpaceReservationIds,
          linkedKitchenSlotIds: existing.linkedKitchenSlotIds,
          staffCount: existing.staffCount || 0,
          participantCount: existing.participantCount || (existing.pax - (existing.staffCount || 0)),
          vipPeoplePerTent: existing.vipPeoplePerTent || 3,
          vipTentConfigs: existing.vipTentConfigs || [],
          mealsPlan: existing.mealsPlan || [],
          remainingStaff: existing.remainingStaff ?? existing.staffCount ?? 0,
          remainingParticipants: existing.remainingParticipants ?? (existing.pax - (existing.staffCount || 0)),
          assignmentStatus: existing.assignmentStatus || 'pending_allocation',
          boysCount: existing.boysCount,
          girlsCount: existing.girlsCount,
        });
        // Load VIP tent configs into local state
        setVipTentConfigs(existing.vipTentConfigs || []);
        setMealsPlan(existing.mealsPlan || []);
        setDistributionPreference(existing.distributionPreference || null);
      }
    }
  }, [isNew, id, getGroup]);

  // Auto-calculate participant count when pax or staffCount changes
  useEffect(() => {
    const staffCount = formData.staffCount || 0;
    const participantCount = Math.max(0, formData.pax - staffCount);
    
    if (participantCount !== formData.participantCount) {
      setFormData(prev => ({
        ...prev,
        participantCount,
        remainingParticipants: participantCount,
      }));
    }
  }, [formData.pax, formData.staffCount]);

  // Update remaining staff when staffCount changes (for new groups)
  useEffect(() => {
    if (isNew) {
      setFormData(prev => ({
        ...prev,
        remainingStaff: prev.staffCount || 0,
      }));
    }
  }, [formData.staffCount, isNew]);

  // Validate all schedule items for time range errors
  const scheduleValidationErrors = useMemo(() => {
    const errors: Record<string, string> = {};
    formData.scheduleItems.forEach(item => {
      const error = validateScheduleItemTime(item);
      if (error) {
        errors[item.id] = error;
      }
    });
    return errors;
  }, [formData.scheduleItems]);

  const hasScheduleErrors = Object.keys(scheduleValidationErrors).length > 0;

  // Validate date coherence - all items must be within group date range
  const dateCoherenceErrors = useMemo(() => {
    return validateDateCoherence(
      formData.startDate,
      formData.endDate,
      formData.scheduleItems,
      mealsPlan
    );
  }, [formData.startDate, formData.endDate, formData.scheduleItems, mealsPlan]);

  const hasDateCoherenceErrors = dateCoherenceErrors.length > 0;
  
  // Create a Set of invalid item IDs for quick lookup
  const invalidItemIds = useMemo(() => {
    return new Set(dateCoherenceErrors.map(e => e.id));
  }, [dateCoherenceErrors]);

  const handleCapacityCheck = () => {
    setIsCheckingCapacity(true);
    
    // Create a temporary group record for checking
    const tempGroup: GroupRecord = {
      ...formData,
      id: id || 'temp',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const result = checkCapacity(tempGroup);
    setCapacityResult(result);
    setIsCheckingCapacity(false);
  };

  const handleSave = async () => {
    if (!formData.groupName.trim()) {
      toast.error('נא להזין שם קבוצה');
      return;
    }
    if (!formData.reservedBy.trim()) {
      toast.error('נא להזין שם מזמין');
      return;
    }
    if (formData.pax < 1) {
      toast.error('נא להזין מספר אנשים');
      return;
    }
    if ((formData.staffCount || 0) > formData.pax) {
      toast.error('מספר הצוות לא יכול להיות גדול ממספר האנשים הכולל');
      return;
    }
    if (hasScheduleErrors) {
      toast.error('יש שגיאות בלו״ז - נא לתקן את שעות הסיום');
      return;
    }
    
    // Validate date coherence before saving
    if (hasDateCoherenceErrors) {
      toast.error('נמצאו פריטים מחוץ לטווח התאריכים של הקבוצה - נא לתקן לפני שמירה');
      return;
    }

    // PRE-VALIDATE schedule conflicts BEFORE saving
    const preSaveConflicts = await preValidateScheduleConflicts(
      formData.scheduleItems,
      formData.groupName,
      isNew ? undefined : id,
    );

    if (preSaveConflicts.length > 0) {
      const errorMap: Record<string, string> = {};
      preSaveConflicts.forEach(conflict => {
        if (conflict.scheduleItemId) {
          errorMap[conflict.scheduleItemId] = `תפוס: ${conflict.space} ${conflict.date} ${conflict.time} (${conflict.existingGroup}). בחרו שעה אחרת.`;
        }
      });
      setConflictErrors(errorMap);
      toast.error('לא ניתן לשמור – יש התנגשות בלוח הזמנים. תקנו את הפריטים המסומנים.');
      setTimeout(() => {
        scheduleCardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
      return; // Block save entirely
    }

    // Clear any stale conflict errors
    setConflictErrors({});

    // Determine assignmentStatus based on capacity check
    let assignmentStatus: AssignmentStatus = 'pending_allocation';
    const isDayUseGroup = formData.groupType === 'יום ללא לינה';
    
    // For lodging groups, check if there's a capacity issue
    if (!isDayUseGroup && capacityResult && !capacityResult.isAvailable) {
      assignmentStatus = 'pending_capacity_issue';
      toast.warning('נשמר כטיוטה – אין מספיק מקום בתאריכים שנבחרו');
    }
    
    // Initialize remaining counters for new groups
    const staffCount = formData.staffCount || 0;
    const participantCount = formData.pax - staffCount;

    // Include vipTentConfigs, mealsPlan, distributionPreference, and assignmentStatus in the data to save
    const dataToSave = {
      ...formData,
      vipTentConfigs,
      mealsPlan,
      distributionPreference: isDayUseGroup ? undefined : distributionPreference,
      assignmentStatus: isDayUseGroup ? undefined : assignmentStatus,
      remainingStaff: isNew ? staffCount : formData.remainingStaff,
      remainingParticipants: isNew ? participantCount : formData.remainingParticipants,
    };

    let savedGroup: GroupRecord | undefined;
    
    if (isNew) {
      savedGroup = await addGroup(dataToSave);
    } else if (id) {
      await updateGroup(id, dataToSave);
      savedGroup = { ...dataToSave, id, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    }

    // Sync group data to Kitchen and Spaces modules
    if (savedGroup) {
      const syncResult = await syncGroupToModules(savedGroup);
      
      if (syncResult.conflicts.length > 0) {
        // Build error map from conflicts
        const errorMap: Record<string, string> = {};
        syncResult.conflicts.forEach(conflict => {
          if (conflict.scheduleItemId) {
            errorMap[conflict.scheduleItemId] = `תפוס: ${conflict.space} ${conflict.date} ${conflict.time} (${conflict.existingGroup}). בחרו שעה אחרת.`;
          }
        });
        setConflictErrors(errorMap);
        
        // Show persistent toast but do NOT navigate
        toast.warning(`הקבוצה נשמרה, אך ${syncResult.conflicts.length} הזמנות מרחב לא נוצרו בגלל התנגשות. תקנו את הפריטים המסומנים ושמרו שוב.`);
        
        // Scroll to schedule section
        setTimeout(() => {
          scheduleCardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
        
        return; // Stay on page
      } else {
        const syncInfo = [];
        if (syncResult.kitchenSlotsCreated > 0) syncInfo.push(`${syncResult.kitchenSlotsCreated} ארוחות`);
        if (syncResult.spaceBookingsCreated > 0) syncInfo.push(`${syncResult.spaceBookingsCreated} הזמנות מרחב`);
        
        if (syncInfo.length > 0) {
          toast.success(`הקבוצה נשמרה וסונכרנה: ${syncInfo.join(', ')}`);
        } else {
          toast.success(isNew ? 'הקבוצה נוצרה בהצלחה' : 'הקבוצה עודכנה בהצלחה');
        }
      }
    }
    
    navigate('/admin/groups');
  };

  const addScheduleItem = () => {
    const newItem = emptyScheduleItem(formData.startDate);
    setFormData(prev => ({
      ...prev,
      scheduleItems: [...prev.scheduleItems, newItem],
    }));
    setNewItemId(newItem.id);
    setTimeout(() => setNewItemId(null), 2500);
  };

  const updateScheduleItem = (itemId: string, updates: Partial<ScheduleItem>) => {
    setFormData(prev => ({
      ...prev,
      scheduleItems: prev.scheduleItems.map(item =>
        item.id === itemId ? { ...item, ...updates } : item
      ),
    }));
    // Clear conflict error when user modifies the item
    setConflictErrors(prev => {
      if (prev[itemId]) {
        const { [itemId]: _, ...rest } = prev;
        return rest;
      }
      return prev;
    });
  };

  const removeScheduleItem = (itemId: string) => {
    setFormData(prev => ({
      ...prev,
      scheduleItems: prev.scheduleItems.filter(item => item.id !== itemId),
    }));
  };

  // Meal plan handlers
  const addMealPlanItem = () => {
    const newItem = emptyMealPlanItem(formData.startDate, formData.pax || 0);
    setMealsPlan(prev => [...prev, newItem]);
    setNewItemId(newItem.id);
    setTimeout(() => setNewItemId(null), 2500);
  };

  const updateMealPlanItem = (itemId: string, updates: Partial<MealPlanItem>) => {
    setMealsPlan(prev => prev.map(item =>
      item.id === itemId ? { ...item, ...updates } : item
    ));
  };

  const removeMealPlanItem = (itemId: string) => {
    setMealsPlan(prev => prev.filter(item => item.id !== itemId));
  };

  // Handle space booking
  const handleSpaceBooking = (data: { spaceId: string; date: string; startTime: string; endTime: string; notes?: string }) => {
    const success = addActivityReservation({
      spaceId: data.spaceId,
      date: data.date,
      startTime: data.startTime,
      endTime: data.endTime,
      groupName: formData.groupName,
      notes: data.notes,
    });

    if (success) {
      toast.success('המרחב הוזמן בהצלחה');
      setSpaceModalOpen(false);
    } else {
      toast.error('המרחב תפוס בשעות אלה! נא לבחור שעות אחרות');
    }
  };

  // Handle meal booking
  const handleMealBooking = async (data: { mealType: MealType; date: string; time: string; location: 'DINING_HALL' | 'OUTSIDE'; pax: number }) => {
    const slotId = await addTimeSlot(
      data.date,
      data.mealType,
      data.time,
      data.location,
      data.pax,
      { vegetarian: 0, vegan: 0, glutenFree: 0, lactoseFree: 0, allergies: 0, notes: `קבוצה: ${formData.groupName}` },
      [{ name: formData.groupName, pax: data.pax }]
    );

    if (slotId) {
      toast.success('הארוחה נוספה בהצלחה');
      setMealModalOpen(false);
      if (!isNew && id) {
        await addLinkedKitchenSlot(id, slotId);
      }
    } else {
      toast.error('שגיאה בהוספת הארוחה');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  const isDayUse = formData.groupType === 'יום ללא לינה';

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <header className="bg-card border-b-2 border-border">
        <div className="container py-6">
          <BreadcrumbNav items={[
            { label: 'ניהול', path: '/settings' },
            { label: 'קבוצות', path: '/admin/groups' },
            { label: isNew ? 'קבוצה חדשה' : formData.groupName || 'עריכה' }
          ]} />
          <div className="flex flex-col md:flex-row md:items-center gap-3 md:justify-between">
            <h1 className="text-2xl md:text-4xl font-bold flex items-center gap-3">
              <Users className="w-8 h-8 md:w-10 md:h-10" />
              {isNew ? 'קבוצה חדשה' : 'עריכת קבוצה'}
            </h1>
            <div className="flex gap-2 w-full md:w-auto flex-row-reverse md:flex-row">
              <Button size="lg" onClick={handleSave} disabled={hasScheduleErrors || hasDateCoherenceErrors} className="flex-1 md:flex-initial">
                <Save className="w-5 h-5 ml-2" />
                שמור
              </Button>
              <Button variant="outline" onClick={() => navigate('/admin/groups')} className="flex-1 md:flex-initial">
                ביטול
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container py-6 space-y-6">
        {/* Basic Info Card */}
        <Card>
          <CardHeader>
            <CardTitle>פרטי הקבוצה</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Group Type Selector */}
            <div className="p-4 bg-muted/50 rounded-lg space-y-3">
              <label className="text-sm font-medium">סוג קבוצה</label>
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
                <Button
                  type="button"
                  variant={!isDayUse ? 'default' : 'outline'}
                  onClick={() => setFormData(prev => ({ ...prev, groupType: 'לינה' }))}
                  className="flex-1 whitespace-normal text-center h-auto py-3 text-sm"
                >
                  <Users className="w-4 h-4 ml-2" />
                  לינה
                </Button>
                <Button
                  type="button"
                  variant={isDayUse ? 'default' : 'outline'}
                  onClick={() => setFormData(prev => ({ 
                    ...prev, 
                    groupType: 'יום ללא לינה',
                    endDate: prev.startDate // Day-use is single day
                  }))}
                  className="flex-1 whitespace-normal text-center h-auto py-3 text-sm"
                >
                  <Sun className="w-4 h-4 ml-2" />
                  פעילות יום ללא לינה
                </Button>
              </div>
              {isDayUse && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground mt-2">
                  <AlertCircle className="w-4 h-4" />
                  קבוצת יום - ללא הקצאת אוהלים
                </div>
              )}
            </div>

            {/* DATES SECTION - NOW FIRST */}
            <div className="p-4 bg-accent/30 rounded-lg border border-accent space-y-4">
              <h4 className="font-medium flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                {isDayUse ? 'תאריך ושעות הפעילות' : 'תאריכי השהייה'}
              </h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">{isDayUse ? 'תאריך הפעילות *' : 'תאריך הגעה *'}</label>
                  <Popover open={startDateOpen} onOpenChange={setStartDateOpen}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-right">
                        <Calendar className="ml-2 h-4 w-4" />
                        {format(parseISO(formData.startDate), 'd בMMMM yyyy', { locale: he })}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarComponent
                        mode="single"
                        selected={parseISO(formData.startDate)}
                        onSelect={(date) => {
                          if (!date) return;
                          setFormData(prev => {
                            const newStartDate = format(date, 'yyyy-MM-dd');
                            return { 
                              ...prev, 
                              startDate: newStartDate,
                              endDate: prev.groupType === 'יום ללא לינה' ? newStartDate : prev.endDate
                            };
                          });
                          setStartDateOpen(false);
                        }}
                        initialFocus
                        className={cn("p-3 pointer-events-auto")}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                
                {/* End date - hidden for day-use groups */}
                {!isDayUse && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">תאריך עזיבה *</label>
                    <Popover open={endDateOpen} onOpenChange={setEndDateOpen}>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-start text-right">
                          <Calendar className="ml-2 h-4 w-4" />
                          {format(parseISO(formData.endDate), 'd בMMMM yyyy', { locale: he })}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <CalendarComponent
                          mode="single"
                          selected={parseISO(formData.endDate)}
                          onSelect={(date) => {
                            if (!date) return;
                            setFormData(prev => ({ 
                              ...prev, 
                              endDate: format(date, 'yyyy-MM-dd') 
                            }));
                            setEndDateOpen(false);
                          }}
                          initialFocus
                          className={cn("p-3 pointer-events-auto")}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                )}
              </div>

              {/* Day-use specific time fields */}
              {isDayUse && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      שעת הגעה
                    </label>
                    <Input
                      type="time"
                      value={formData.arrivalTime || '09:00'}
                      onChange={(e) => setFormData(prev => ({ ...prev, arrivalTime: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      שעת סיום
                    </label>
                    <Input
                      type="time"
                      value={formData.departureTime || '17:00'}
                      onChange={(e) => setFormData(prev => ({ ...prev, departureTime: e.target.value }))}
                    />
                  </div>
                </div>
              )}

              {/* Capacity Check Button - show after dates are set for lodging groups */}
              {!isDayUse && formData.startDate && formData.endDate && (
                <div className="pt-2 space-y-3">
                  <Button 
                    type="button" 
                    variant="secondary" 
                    onClick={handleCapacityCheck}
                    disabled={isCheckingCapacity}
                    className="w-full md:w-auto"
                  >
                    {isCheckingCapacity ? (
                      <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4 ml-2" />
                    )}
                    בדיקת זמינות
                  </Button>
                  
                  {/* Capacity Result */}
                  <CapacityResultDisplay result={capacityResult} />
                </div>
              )}
            </div>

            {/* Basic contact/group info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">שם הקבוצה *</label>
                <Input
                  value={formData.groupName}
                  onChange={(e) => setFormData(prev => ({ ...prev, groupName: e.target.value }))}
                  placeholder="לדוגמה: קבוצת בני עקיבא"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">מי מבצע את ההזמנה *</label>
                <Input
                  value={formData.reservedBy}
                  onChange={(e) => setFormData(prev => ({ ...prev, reservedBy: e.target.value }))}
                  placeholder="שם המזמין"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">טלפון (אופציונלי)</label>
                <Input
                  type="tel"
                  value={formData.contactPhone}
                  onChange={(e) => setFormData(prev => ({ ...prev, contactPhone: e.target.value }))}
                  placeholder="050-0000000"
                  dir="ltr"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">{isDayUse ? 'כמות משתתפים *' : 'כמות אנשים כוללת *'}</label>
                <NumericInput
                  value={formData.pax}
                  onChange={(val) => setFormData(prev => ({ ...prev, pax: val }))}
                  min={1}
                  showStepper
                />
              </div>
            </div>

            {/* Staff/Participant breakdown for lodging groups */}
            {!isDayUse && (
              <div className="p-4 bg-primary/5 rounded-lg border border-primary/20 space-y-4">
                <h4 className="font-medium flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  חלוקת צוות וחניכים
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">צוות (VIP)</label>
                    <NumericInput
                      value={formData.staffCount || 0}
                      onChange={(val) => setFormData(prev => ({ 
                        ...prev, 
                        staffCount: Math.min(val, prev.pax),
                        remainingStaff: Math.min(val, prev.pax),
                      }))}
                      min={0}
                      max={formData.pax}
                      showStepper
                    />
                    <p className="text-xs text-muted-foreground">יוקצו לאוהלי VIP</p>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">חניכים</label>
                    <NumericInput
                      value={formData.participantCount || 0}
                      onChange={() => {}}
                      disabled
                    />
                    <p className="text-xs text-muted-foreground">אוטומטי (סה״כ - צוות)</p>
                  </div>

                </div>

                {/* Optional Gender Breakdown */}
                <div className="p-3 bg-muted/30 rounded-lg space-y-3">
                  <h5 className="text-sm font-medium text-muted-foreground">
                    פירוט חניכים לפי מגדר (אופציונלי)
                  </h5>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-sm font-medium">בנים</label>
                      <NumericInput
                        value={formData.boysCount ?? 0}
                        onChange={(val) => setFormData(prev => ({ ...prev, boysCount: val || undefined }))}
                        min={0}
                        className="h-14 text-lg md:h-12 md:text-base"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-sm font-medium">בנות</label>
                      <NumericInput
                        value={formData.girlsCount ?? 0}
                        onChange={(val) => setFormData(prev => ({ ...prev, girlsCount: val || undefined }))}
                        min={0}
                        className="h-14 text-lg md:h-12 md:text-base"
                      />
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground font-medium">
                    סה"כ חניכים: {(formData.boysCount || 0) + (formData.girlsCount || 0)}
                  </div>
                  {/* Gender validation warning */}
                  {(formData.boysCount || formData.girlsCount) && (
                    (() => {
                      const sum = (formData.boysCount || 0) + (formData.girlsCount || 0);
                      const target = formData.participantCount || 0;
                      if (sum !== target) {
                        return (
                          <div className="flex items-center gap-2 text-amber-600 text-sm">
                            <AlertTriangle className="w-4 h-4" />
                            <span>הסכום ({sum}) לא תואם למספר החניכים ({target})</span>
                          </div>
                        );
                      }
                      return (
                        <div className="flex items-center gap-2 text-green-600 text-sm">
                          <CheckCircle2 className="w-4 h-4" />
                          <span>בנים ({formData.boysCount || 0}) + בנות ({formData.girlsCount || 0}) = {sum} ✓</span>
                        </div>
                      );
                    })()
                  )}
                </div>

                {/* VIP Tent Planner */}
                <VIPTentPlanner
                  staffCount={formData.staffCount || 0}
                  vipTentConfigs={vipTentConfigs}
                  onConfigsChange={setVipTentConfigs}
                />

                {/* Remaining counters for existing groups */}
                {!isNew && (
                  <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                    <div className="p-3 bg-background rounded-lg text-center">
                      <div className="text-2xl font-bold text-primary">{formData.remainingStaff || 0}</div>
                      <div className="text-sm text-muted-foreground">צוות נשאר לשבץ</div>
                    </div>
                    <div className="p-3 bg-background rounded-lg text-center">
                      <div className="text-2xl font-bold text-primary">{formData.remainingParticipants || 0}</div>
                      <div className="text-sm text-muted-foreground">חניכים נשאר לשבץ</div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Sleeping Tent Distribution Preference - lodging groups only */}
            {!isDayUse && (
              <SleepingTentDistributionSection
                participantCount={formData.participantCount || 0}
                preference={distributionPreference}
                onChange={setDistributionPreference}
                disabled={!formData.startDate}
                boysCount={formData.boysCount}
                girlsCount={formData.girlsCount}
              />
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium">מידע / הערות</label>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="הערות נוספות על הקבוצה..."
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions for Day-Use Groups */}
        {isDayUse && !isNew && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sun className="w-5 h-5" />
                פעולות מהירות
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-3">
                <Button onClick={() => setSpaceModalOpen(true)} variant="outline" className="gap-2">
                  <Building2 className="w-4 h-4" />
                  הזמן מרחב
                </Button>
                <Button onClick={() => setMealModalOpen(true)} variant="outline" className="gap-2">
                  <ChefHat className="w-4 h-4" />
                  הוסף ארוחה
                </Button>
              </div>
              <p className="text-sm text-muted-foreground mt-3">
                הזמנות מרחבים וארוחות יופיעו בלוח השנה ויהיו נגישות לכל הצוות
              </p>
            </CardContent>
          </Card>
        )}

        {/* Schedule Card (לו״ז) */}
        <Card ref={scheduleCardRef} className={cn(!formData.startDate && "opacity-60")}>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              לו״ז הקבוצה
            </CardTitle>
            <Button 
              onClick={addScheduleItem} 
              variant="outline" 
              size="sm"
              disabled={!formData.startDate}
            >
              <Plus className="w-4 h-4 ml-1" />
              הוסף שורה
            </Button>
          </CardHeader>
          <CardContent>
            {/* Prompt to set dates first */}
            {!formData.startDate && (
              <div className="bg-amber-100 dark:bg-amber-900/30 border border-amber-300 dark:border-amber-700 rounded-lg p-4 flex items-center gap-3 text-amber-800 dark:text-amber-200">
                <Calendar className="w-5 h-5 flex-shrink-0" />
                <span className="text-sm font-medium">יש לבחור תאריך הגעה ותאריך עזיבה לפני מילוי לו״ז</span>
              </div>
            )}
            {formData.startDate && (
              <>
                {/* Conflict errors alert banner */}
                {Object.keys(conflictErrors).length > 0 && (
                  <Alert variant="destructive" className="mb-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="flex items-center justify-between">
                      <span>לא ניתן לשמור – יש התנגשות בלוח הזמנים. תקנו את הפריטים המסומנים.</span>
                      <Button variant="outline" size="sm" onClick={() => navigate('/admin/groups')} className="mr-2 whitespace-nowrap">
                        חזור לרשימה
                      </Button>
                    </AlertDescription>
                  </Alert>
                )}
                {/* Date coherence errors banner */}
                {hasDateCoherenceErrors && (
                  <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4 mb-4">
                    <div className="flex items-center gap-2 text-destructive font-medium mb-2">
                      <AlertCircle className="w-5 h-5 flex-shrink-0" />
                      <span>נמצאו פריטים מחוץ לטווח התאריכים של הקבוצה</span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">
                      התאריכים חייבים להיות בין {format(parseISO(formData.startDate), 'd/M/yyyy', { locale: he })} ל-{format(parseISO(formData.endDate), 'd/M/yyyy', { locale: he })}
                    </p>
                    <ul className="text-sm space-y-1">
                      {dateCoherenceErrors.map(error => (
                        <li key={error.id} className="flex items-center gap-2 text-destructive">
                          <span>•</span>
                          <span>{error.type === 'schedule' ? 'לו״ז' : 'ארוחה'}:</span>
                          <span className="font-medium">{format(parseISO(error.date), 'd/M/yyyy', { locale: he })}</span>
                          <span className="text-muted-foreground">- {error.description}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {hasScheduleErrors && (
                  <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-3 mb-4 flex items-center gap-2 text-destructive">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span className="text-sm">יש שגיאות בלו״ז - נא לתקן לפני שמירה</span>
                  </div>
                )}
                {formData.scheduleItems.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Clock className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>אין פריטים בלו״ז</p>
                    <Button onClick={addScheduleItem} variant="link" className="mt-2">
                      <Plus className="w-4 h-4 ml-1" />
                      הוסף פריט ראשון
                    </Button>
                  </div>
                ) : (
              <div className="space-y-4">
                {formData.scheduleItems.map((item, index) => {
                  const timeError = scheduleValidationErrors[item.id];
                  const hasDateError = invalidItemIds.has(item.id);
                  const conflictError = conflictErrors[item.id];
                  return (
                    <div 
                      key={item.id} 
                      ref={item.id === newItemId ? (el) => { el?.scrollIntoView({ behavior: 'smooth', block: 'center' }); } : undefined}
                      className={cn(
                        "p-4 rounded-lg space-y-3 transition-colors duration-[2000ms]",
                        item.id === newItemId ? "bg-primary/20 ring-2 ring-primary/40" :
                        conflictError ? "bg-destructive/10 border-2 border-destructive" :
                      (timeError || hasDateError) ? "bg-destructive/10 border-2 border-destructive/50" : "bg-muted/50"
                    )}>
                      {conflictError && (
                        <div className="flex items-center gap-2 text-destructive text-sm font-medium">
                          <AlertCircle className="w-4 h-4 flex-shrink-0" />
                          {conflictError}
                        </div>
                      )}
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-muted-foreground">פריט {index + 1}</span>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => removeScheduleItem(item.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <div className="space-y-1">
                          <label className={cn("text-xs", hasDateError ? "text-destructive font-medium" : "text-muted-foreground")}>
                            תאריך {hasDateError && '⚠️'}
                          </label>
                          <Popover open={openScheduleDateId === item.id} onOpenChange={(open) => setOpenScheduleDateId(open ? item.id : null)}>
                            <PopoverTrigger asChild>
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className={cn(
                                  "w-full justify-start text-right",
                                  hasDateError && "border-destructive text-destructive"
                                )}
                              >
                                {format(parseISO(item.date), 'd/M', { locale: he })}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <CalendarComponent
                                mode="single"
                                selected={parseISO(item.date)}
                                onSelect={(date) => {
                                  if (!date) return;
                                  updateScheduleItem(item.id, { date: format(date, 'yyyy-MM-dd') });
                                  setOpenScheduleDateId(null);
                                }}
                                initialFocus
                                className={cn("p-3 pointer-events-auto")}
                              />
                            </PopoverContent>
                          </Popover>
                          {hasDateError && (
                            <div className="flex gap-1 mt-1">
                              <Button 
                                variant="link" 
                                size="sm" 
                                className="h-auto p-0 text-xs text-destructive"
                                onClick={() => updateScheduleItem(item.id, { date: formData.startDate })}
                              >
                                עדכן לתאריך הגעה
                              </Button>
                            </div>
                          )}
                        </div>
                        
                        <div className="space-y-1">
                          <label className="text-xs text-muted-foreground">שעת התחלה</label>
                          <Input
                            type="time"
                            value={item.startTime}
                            onChange={(e) => updateScheduleItem(item.id, { startTime: e.target.value })}
                            className="h-9"
                          />
                        </div>
                        
                        <div className="space-y-1">
                          <label className="text-xs text-muted-foreground">שעת סיום</label>
                          <Input
                            type="time"
                            value={item.endTime || ''}
                            onChange={(e) => updateScheduleItem(item.id, { endTime: e.target.value })}
                            className={cn("h-9", timeError && "border-destructive")}
                          />
                          {timeError && (
                            <p className="text-xs text-destructive">{timeError}</p>
                          )}
                        </div>
                        
                        <div className="space-y-1">
                          <label className="text-xs text-muted-foreground">קטגוריה</label>
                          <Select 
                            value={item.category}
                            onValueChange={(value: ScheduleCategory) => updateScheduleItem(item.id, { category: value })}
                          >
                            <SelectTrigger className="h-9">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {(Object.keys(SCHEDULE_CATEGORY_LABELS) as ScheduleCategory[]).map(cat => (
                                <SelectItem key={cat} value={cat}>
                                  {SCHEDULE_CATEGORY_LABELS[cat]}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-xs text-muted-foreground">מיקום</label>
                          <Select 
                            value={item.location}
                            onValueChange={(value) => updateScheduleItem(item.id, { location: value })}
                          >
                            <SelectTrigger className="h-9">
                              <SelectValue placeholder="בחר מיקום" />
                            </SelectTrigger>
                            <SelectContent>
                              {SCHEDULE_LOCATIONS.map(loc => (
                                <SelectItem key={loc} value={loc}>
                                  {loc}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div className="space-y-1">
                          <label className="text-xs text-muted-foreground">תיאור</label>
                          <Input
                            value={item.description}
                            onChange={(e) => updateScheduleItem(item.id, { description: e.target.value })}
                            placeholder="תיאור הפעילות..."
                            className="h-9"
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Meals Plan Card (ארוחות) */}
        <Card className={cn(!formData.startDate && "opacity-60")}>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Utensils className="w-5 h-5" />
              ארוחות
            </CardTitle>
            <Button 
              onClick={addMealPlanItem} 
              variant="outline" 
              size="sm"
              disabled={!formData.startDate}
            >
              <Plus className="w-4 h-4 ml-1" />
              הוסף ארוחה
            </Button>
          </CardHeader>
          <CardContent>
            {/* Prompt to set dates first */}
            {!formData.startDate && (
              <div className="bg-amber-100 dark:bg-amber-900/30 border border-amber-300 dark:border-amber-700 rounded-lg p-4 flex items-center gap-3 text-amber-800 dark:text-amber-200">
                <Calendar className="w-5 h-5 flex-shrink-0" />
                <span className="text-sm font-medium">יש לבחור תאריך הגעה ותאריך עזיבה לפני מילוי ארוחות</span>
              </div>
            )}
            {formData.startDate && (
              <>
                {mealsPlan.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Utensils className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>אין ארוחות מתוכננות</p>
                    <Button onClick={addMealPlanItem} variant="link" className="mt-2">
                      <Plus className="w-4 h-4 ml-1" />
                      הוסף ארוחה ראשונה
                    </Button>
                  </div>
                ) : (
              <div className="space-y-4">
                {mealsPlan.map((meal, index) => {
                  const hasMealDateError = invalidItemIds.has(meal.id);
                  return (
                    <div 
                      key={meal.id} 
                      ref={meal.id === newItemId ? (el) => { el?.scrollIntoView({ behavior: 'smooth', block: 'center' }); } : undefined}
                      className={cn(
                        "p-4 rounded-lg space-y-3 transition-colors duration-[2000ms]",
                        meal.id === newItemId ? "bg-primary/20 ring-2 ring-primary/40" :
                        hasMealDateError ? "bg-destructive/10 border-2 border-destructive/50" : "bg-muted/50"
                    )}>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-muted-foreground">ארוחה {index + 1}</span>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => removeMealPlanItem(meal.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <div className="space-y-1">
                          <label className={cn("text-xs", hasMealDateError ? "text-destructive font-medium" : "text-muted-foreground")}>
                            תאריך {hasMealDateError && '⚠️'}
                          </label>
                          <Popover open={openMealDateId === meal.id} onOpenChange={(open) => setOpenMealDateId(open ? meal.id : null)}>
                            <PopoverTrigger asChild>
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className={cn(
                                  "w-full justify-start text-right",
                                  hasMealDateError && "border-destructive text-destructive"
                                )}
                              >
                                {format(parseISO(meal.date), 'd/M', { locale: he })}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <CalendarComponent
                                mode="single"
                                selected={parseISO(meal.date)}
                                onSelect={(date) => {
                                  if (!date) return;
                                  updateMealPlanItem(meal.id, { date: format(date, 'yyyy-MM-dd') });
                                  setOpenMealDateId(null);
                                }}
                                initialFocus
                                className={cn("p-3 pointer-events-auto")}
                              />
                            </PopoverContent>
                          </Popover>
                          {hasMealDateError && (
                            <div className="flex gap-1 mt-1">
                              <Button 
                                variant="link" 
                                size="sm" 
                                className="h-auto p-0 text-xs text-destructive"
                                onClick={() => updateMealPlanItem(meal.id, { date: formData.startDate })}
                              >
                                עדכן לתאריך הגעה
                              </Button>
                            </div>
                          )}
                        </div>
                      
                      <div className="space-y-1">
                        <label className="text-xs text-muted-foreground">סוג ארוחה</label>
                        <Select 
                          value={meal.mealType}
                          onValueChange={(value: 'BREAKFAST' | 'LUNCH' | 'DINNER') => updateMealPlanItem(meal.id, { mealType: value })}
                        >
                          <SelectTrigger className="h-9">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="BREAKFAST">{MEAL_LABELS.BREAKFAST}</SelectItem>
                            <SelectItem value="LUNCH">{MEAL_LABELS.LUNCH}</SelectItem>
                            <SelectItem value="DINNER">{MEAL_LABELS.DINNER}</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-1">
                        <label className="text-xs text-muted-foreground">שעה</label>
                        <Input
                          type="time"
                          value={meal.time}
                          onChange={(e) => updateMealPlanItem(meal.id, { time: e.target.value })}
                          className="h-9"
                        />
                      </div>
                      
                      <div className="space-y-1">
                        <label className="text-xs text-muted-foreground">מיקום</label>
                        <Select 
                          value={meal.location}
                          onValueChange={(value: 'DINING_HALL' | 'OUTSIDE') => updateMealPlanItem(meal.id, { location: value })}
                        >
                          <SelectTrigger className="h-9">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="DINING_HALL">חדר אוכל</SelectItem>
                            <SelectItem value="OUTSIDE">מחוץ לחדר אוכל</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-xs text-muted-foreground">כמות סועדים</label>
                        <NumericInput
                          value={meal.pax}
                          onChange={(val) => updateMealPlanItem(meal.id, { pax: val })}
                          min={0}
                        />
                      </div>
                    </div>
                    
                    {/* Special needs - always shown */}
                    <div className="mt-3 pt-3 border-t space-y-3">
                        <label className="text-xs font-medium text-muted-foreground">צרכים מיוחדים</label>
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                          <div className="space-y-1">
                            <label className="text-xs text-muted-foreground">🌱 צמחוני</label>
                            <NumericInput
                              value={meal.specialDiets?.vegetarian || 0}
                              onChange={(val) => updateMealPlanItem(meal.id, { 
                                specialDiets: { 
                                  ...meal.specialDiets, 
                                  vegetarian: val,
                                  vegan: meal.specialDiets?.vegan || 0,
                                  glutenFree: meal.specialDiets?.glutenFree || 0,
                                  lactoseFree: meal.specialDiets?.lactoseFree || 0,
                                  allergies: meal.specialDiets?.allergies || 0,
                                  allergiesNotes: meal.specialDiets?.allergiesNotes || ''
                                } 
                              })}
                              min={0}
                              max={meal.pax}
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-xs text-muted-foreground">🥬 טבעוני</label>
                            <NumericInput
                              value={meal.specialDiets?.vegan || 0}
                              onChange={(val) => updateMealPlanItem(meal.id, { 
                                specialDiets: { 
                                  ...meal.specialDiets, 
                                  vegetarian: meal.specialDiets?.vegetarian || 0,
                                  vegan: val,
                                  glutenFree: meal.specialDiets?.glutenFree || 0,
                                  lactoseFree: meal.specialDiets?.lactoseFree || 0,
                                  allergies: meal.specialDiets?.allergies || 0,
                                  allergiesNotes: meal.specialDiets?.allergiesNotes || ''
                                } 
                              })}
                              min={0}
                              max={meal.pax}
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-xs text-muted-foreground">🚫 ללא גלוטן</label>
                            <NumericInput
                              value={meal.specialDiets?.glutenFree || 0}
                              onChange={(val) => updateMealPlanItem(meal.id, { 
                                specialDiets: { 
                                  ...meal.specialDiets, 
                                  vegetarian: meal.specialDiets?.vegetarian || 0,
                                  vegan: meal.specialDiets?.vegan || 0,
                                  glutenFree: val,
                                  lactoseFree: meal.specialDiets?.lactoseFree || 0,
                                  allergies: meal.specialDiets?.allergies || 0,
                                  allergiesNotes: meal.specialDiets?.allergiesNotes || ''
                                } 
                              })}
                              min={0}
                              max={meal.pax}
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-xs text-muted-foreground">🥛 ללא לקטוז</label>
                            <NumericInput
                              value={meal.specialDiets?.lactoseFree || 0}
                              onChange={(val) => updateMealPlanItem(meal.id, { 
                                specialDiets: { 
                                  ...meal.specialDiets, 
                                  vegetarian: meal.specialDiets?.vegetarian || 0,
                                  vegan: meal.specialDiets?.vegan || 0,
                                  glutenFree: meal.specialDiets?.glutenFree || 0,
                                  lactoseFree: val,
                                  allergies: meal.specialDiets?.allergies || 0,
                                  allergiesNotes: meal.specialDiets?.allergiesNotes || ''
                                } 
                              })}
                              min={0}
                              max={meal.pax}
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-xs text-muted-foreground">🥜 אלרגיות</label>
                            <NumericInput
                              value={meal.specialDiets?.allergies || 0}
                              onChange={(val) => updateMealPlanItem(meal.id, { 
                                specialDiets: { 
                                  ...meal.specialDiets, 
                                  vegetarian: meal.specialDiets?.vegetarian || 0,
                                  vegan: meal.specialDiets?.vegan || 0,
                                  glutenFree: meal.specialDiets?.glutenFree || 0,
                                  lactoseFree: meal.specialDiets?.lactoseFree || 0,
                                  allergies: val,
                                  allergiesNotes: meal.specialDiets?.allergiesNotes || ''
                                } 
                              })}
                              min={0}
                              max={meal.pax}
                            />
                          </div>
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs text-muted-foreground">✏️ הערות נוספות</label>
                          <Textarea
                            value={meal.specialDiets?.allergiesNotes || ''}
                            onChange={(e) => updateMealPlanItem(meal.id, { 
                              specialDiets: { 
                                ...meal.specialDiets, 
                                vegetarian: meal.specialDiets?.vegetarian || 0,
                                vegan: meal.specialDiets?.vegan || 0,
                                glutenFree: meal.specialDiets?.glutenFree || 0,
                                lactoseFree: meal.specialDiets?.lactoseFree || 0,
                                allergies: meal.specialDiets?.allergies || 0,
                                allergiesNotes: e.target.value
                              } 
                            })}
                            placeholder="פירוט אלרגיות או צרכים מיוחדים נוספים..."
                            rows={2}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Remove Group Section (only for existing groups) */}
        {!isNew && id && (
          <Card className="border-destructive/50">
            <CardHeader>
              <CardTitle className="text-destructive flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                פעולות מתקדמות
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-4">
                <p className="text-sm text-muted-foreground">
                  הסרת קבוצה מהמערכת. תוכל לבחור בין ארכיון (שמירה) למחיקה לצמיתות.
                </p>
                <Button 
                  variant="outline"
                  onClick={() => setChoiceDialogOpen(true)}
                  className="w-full sm:w-auto gap-2"
                >
                  <XCircle className="w-4 h-4" />
                  הסר קבוצה
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Bottom Save Button */}
        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={() => navigate('/admin/groups')}>
            ביטול
          </Button>
          <Button size="lg" onClick={handleSave} disabled={hasScheduleErrors || hasDateCoherenceErrors}>
            <Save className="w-5 h-5 ml-2" />
            שמור
          </Button>
        </div>
      </main>

      {/* Space Booking Modal */}
      <SpaceBookingModal
        isOpen={spaceModalOpen}
        onClose={() => setSpaceModalOpen(false)}
        onSubmit={handleSpaceBooking}
        groupDates={{ start: formData.startDate, end: formData.endDate }}
      />

      {/* Meal Booking Modal */}
      <MealBookingModal
        isOpen={mealModalOpen}
        onClose={() => setMealModalOpen(false)}
        onSubmit={handleMealBooking}
        groupDates={{ start: formData.startDate, end: formData.endDate }}
        defaultPax={formData.pax}
      />

      {/* Choice Modal: Archive vs Permanent Delete */}
      <AlertDialog open={choiceDialogOpen} onOpenChange={setChoiceDialogOpen}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <XCircle className="w-5 h-5 text-primary" />
              הסרת קבוצה
            </AlertDialogTitle>
            <AlertDialogDescription className="text-right">
              מה ברצונך לעשות עם הקבוצה '{formData.groupName}'?
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          {/* Show linked records info if any */}
          {id && getLinkedRecordsDescription(id, formData.groupName) && (
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3 text-sm">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                <span className="text-amber-800 dark:text-amber-200">
                  לקבוצה זו יש נתונים משויכים: {getLinkedRecordsDescription(id, formData.groupName)}
                </span>
              </div>
            </div>
          )}
          
          <AlertDialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
            <AlertDialogCancel>ביטול</AlertDialogCancel>
            <Button
              onClick={() => {
                if (id) {
                  archiveGroup(id);
                  toast.success('הקבוצה הועברה לארכיון');
                  setChoiceDialogOpen(false);
                  navigate('/admin/groups');
                }
              }}
              className="gap-2"
            >
              <Archive className="w-4 h-4" />
              העבר לארכיון
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                setChoiceDialogOpen(false);
                setConfirmDeleteDialogOpen(true);
              }}
              className="gap-2"
            >
              <Trash2 className="w-4 h-4" />
              מחיקה לצמיתות
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Permanent Delete Confirmation Modal */}
      <AlertDialog open={confirmDeleteDialogOpen} onOpenChange={setConfirmDeleteDialogOpen}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="w-5 h-5" />
              מחיקה לצמיתות
            </AlertDialogTitle>
            <AlertDialogDescription className="text-right">
              <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 text-destructive">
                האם אתה בטוח שברצונך למחוק את הקבוצה '{formData.groupName}'?
                <br /><br />
                פעולה זו תמחק את הקבוצה ואת כל המידע המשויך אליה (שיבוצים/הזמנות/ארוחות).
                <br />
                <strong>לא ניתן לשחזר.</strong>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row-reverse gap-2">
            <AlertDialogCancel>ביטול</AlertDialogCancel>
            <Button
              variant="destructive"
              onClick={async () => {
                if (id) {
                  try {
                    await cascadeDeleteGroupRecords(id, formData.groupName);
                    await deleteGroup(id);
                    toast.success('הקבוצה וכל המידע המשויך נמחקו לצמיתות');
                    setConfirmDeleteDialogOpen(false);
                    navigate('/admin/groups');
                  } catch (error) {
                    console.error('Error deleting group:', error);
                    toast.error('שגיאה במחיקת הקבוצה');
                  }
                }
              }}
              className="gap-2"
            >
              <Trash2 className="w-4 h-4" />
              מחק לצמיתות
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminGroupEdit;
