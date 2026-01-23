import React, { useState, useMemo, useRef } from 'react';
import { useVillage } from '@/context/VillageContext';
import { Tent, TentGender, Bed as BedType, CleaningStatus, WorkingStatus } from '@/types/village';
import { 
  X,
  Users,
  Calendar,
  Sparkles,
  Bath,
  ShowerHead,
  Accessibility,
  MessageSquare,
  User,
  Save,
  Camera,
  AlertTriangle,
  Wrench,
  CheckCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { compressImageFileToDataUrl } from '@/lib/imageCompression';
interface TentDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tent: Tent | null;
}

const genderOptions: { value: TentGender; label: string; icon: string }[] = [
  { value: 'MIXED', label: 'מעורב', icon: '👥' },
  { value: 'MALE', label: 'גברים', icon: '♂️' },
  { value: 'FEMALE', label: 'נשים', icon: '♀️' },
];

const cleaningStatusOptions: { value: CleaningStatus; label: string; className: string }[] = [
  { value: 'CLEAN', label: 'נקי', className: 'bg-green-500 text-white' },
  { value: 'NEEDS_CLEANING', label: 'דורש ניקיון', className: 'bg-yellow-500 text-white' },
  { value: 'CLEANING_IN_PROGRESS', label: 'בתהליך...', className: 'bg-blue-500 text-white' },
];

export const TentDetailModal: React.FC<TentDetailModalProps> = ({
  open,
  onOpenChange,
  tent,
}) => {
  const { 
    state,
    updateTentGroupName,
    updateTentDates,
    updateTentNotes,
    updateTentPeopleCount,
    updateTentGender,
    updateTentPrivateBathroom,
    updateTentPrivateShower,
    updateTentCleaningStatus,
    updateBedGuestName,
    reportTentFacilityIssue,
    resolveTentFacilityIssue,
    addDailyTask,
  } = useVillage();

  const [localGuestNames, setLocalGuestNames] = useState<Record<string, string>>({});
  const [cleaningWorker, setCleaningWorker] = useState('');
  
  // VIP facility maintenance states
  const [showBathroomIssue, setShowBathroomIssue] = useState(false);
  const [showShowerIssue, setShowShowerIssue] = useState(false);
  const [bathroomNotes, setBathroomNotes] = useState('');
  const [bathroomImage, setBathroomImage] = useState<string | null>(null);
  const [showerNotes, setShowerNotes] = useState('');
  const [showerImage, setShowerImage] = useState<string | null>(null);
  const [bathroomStatus, setBathroomStatus] = useState<WorkingStatus>('BROKEN');
  const [showerStatus, setShowerStatus] = useState<WorkingStatus>('BROKEN');
  
  const bathroomFileRef = useRef<HTMLInputElement>(null);
  const showerFileRef = useRef<HTMLInputElement>(null);

  // Get tent ID for dependency - memoize beds as JSON string for stable comparison
  const tentId = tent?.id;
  const bedsJson = tent?.beds ? JSON.stringify(tent.beds.map(b => ({ id: b.id, guestName: b.guestName }))) : '';

  // Initialize local state when tent changes
  React.useEffect(() => {
    if (tentId && tent?.beds) {
      const names: Record<string, string> = {};
      tent.beds.forEach(bed => {
        names[bed.id] = bed.guestName || '';
      });
      setLocalGuestNames(names);
      setCleaningWorker(tent.cleaningAssignedTo || '');
      // Initialize VIP facility states
      setBathroomNotes(tent.bathroomMaintenanceNotes || '');
      setBathroomImage(tent.bathroomMaintenanceImage || null);
      setShowerNotes(tent.showerMaintenanceNotes || '');
      setShowerImage(tent.showerMaintenanceImage || null);
    }
  }, [tentId, bedsJson, tent?.cleaningAssignedTo, tent?.bathroomMaintenanceNotes, tent?.bathroomMaintenanceImage, tent?.showerMaintenanceNotes, tent?.showerMaintenanceImage]);

  // Organize beds by bunk - MUST be before early return to maintain hook order
  const { bunkBeds, singleBeds } = useMemo(() => {
    if (!tent) return { bunkBeds: [], singleBeds: [] };

    const bunks: { top: BedType; bottom: BedType }[] = [];
    const singles: BedType[] = [];

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

  // Stats - also before early return
  const stats = useMemo(() => {
    if (!tent) return { total: 0, free: 0, reserved: 0, occupied: 0 };
    return {
      total: tent.beds.length,
      free: tent.beds.filter(b => b.status === 'FREE').length,
      reserved: tent.beds.filter(b => b.status === 'RESERVED').length,
      occupied: tent.beds.filter(b => b.status === 'OCCUPIED').length,
    };
  }, [tent]);

  if (!tent || !state) return null;

  const isVIP = tent.isVIP;

  const handleGenderChange = (gender: TentGender) => {
    updateTentGender(tent.id, gender);
    toast.success(`האוהל סומן כ: ${genderOptions.find(g => g.value === gender)?.label}`);
  };

  const handleBathroomToggle = (checked: boolean) => {
    updateTentPrivateBathroom(tent.id, checked);
    toast.success(checked ? 'שירותים פרטיים נוספו' : 'שירותים פרטיים הוסרו');
  };

  const handleShowerToggle = (checked: boolean) => {
    updateTentPrivateShower(tent.id, checked);
    toast.success(checked ? 'מקלחת פרטית נוספה' : 'מקלחת פרטית הוסרה');
  };

  const handleGuestNameChange = (bedId: string, name: string) => {
    setLocalGuestNames(prev => ({ ...prev, [bedId]: name }));
  };

  const handleGuestNameBlur = (bedId: string) => {
    const name = localGuestNames[bedId] || '';
    updateBedGuestName(bedId, name);
  };

  const handleSaveAllNames = () => {
    Object.entries(localGuestNames).forEach(([bedId, name]) => {
      updateBedGuestName(bedId, name);
    });
    toast.success('שמות נשמרו');
  };

  const handleCleaningStatusChange = (status: CleaningStatus) => {
    updateTentCleaningStatus(tent.id, status, cleaningWorker || undefined);
    toast.success(`מצב ניקיון: ${cleaningStatusOptions.find(s => s.value === status)?.label}`);
  };

  const handleFileSelect = async (
    event: React.ChangeEvent<HTMLInputElement>, 
    setImage: (img: string | null) => void
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const dataUrl = await compressImageFileToDataUrl(file);
      setImage(dataUrl);
    } catch (error) {
      console.error('Error processing image:', error);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmitBathroomIssue = () => {
    if (!tent) return;
    reportTentFacilityIssue(tent.id, 'bathroom', bathroomStatus, bathroomNotes, bathroomImage || undefined);
    
    // Add maintenance task with facility marker for reliable detection
    const today = new Date().toISOString().split('T')[0];
    addDailyTask({
      type: 'MAINTENANCE',
      status: 'PENDING',
      date: today,
      title: `🚽 שירותים VIP - ${tent.code}`,
      description: `${bathroomStatus === 'BROKEN' ? 'תקול' : 'תחזוקה'}: ${bathroomNotes || 'ללא תיאור'}`,
      entityType: 'TENT',
      entityId: tent.id,
      maintenanceImage: bathroomImage || undefined,
      facilityType: 'bathroom',
    });
    
    setShowBathroomIssue(false);
    toast.success('הבעיה דווחה ונשלחה לתחזוקה');
  };

  const handleSubmitShowerIssue = () => {
    if (!tent) return;
    reportTentFacilityIssue(tent.id, 'shower', showerStatus, showerNotes, showerImage || undefined);
    
    // Add maintenance task with facility marker for reliable detection
    const today = new Date().toISOString().split('T')[0];
    addDailyTask({
      type: 'MAINTENANCE',
      status: 'PENDING',
      date: today,
      title: `🚿 מקלחת VIP - ${tent.code}`,
      description: `${showerStatus === 'BROKEN' ? 'תקול' : 'תחזוקה'}: ${showerNotes || 'ללא תיאור'}`,
      entityType: 'TENT',
      entityId: tent.id,
      maintenanceImage: showerImage || undefined,
      facilityType: 'shower',
    });
    
    setShowShowerIssue(false);
    toast.success('הבעיה דווחה ונשלחה לתחזוקה');
  };

  const handleResolveBathroom = () => {
    if (!tent) return;
    resolveTentFacilityIssue(tent.id, 'bathroom');
    setBathroomNotes('');
    setBathroomImage(null);
    toast.success('השירותים סומנו כתקינים');
  };

  const handleResolveShower = () => {
    if (!tent) return;
    resolveTentFacilityIssue(tent.id, 'shower');
    setShowerNotes('');
    setShowerImage(null);
    toast.success('המקלחת סומנה כתקינה');
  };

  const handleSaveAndClose = () => {
    if (!tent) return;
    
    // Collect all updates to apply in sequence with small delays
    // This ensures all updates are applied correctly
    const guestNameUpdates = Object.entries(localGuestNames);
    
    // Apply all guest name updates
    guestNameUpdates.forEach(([bedId, name]) => {
      updateBedGuestName(bedId, name);
    });
    
    // Save cleaning worker if changed
    if (cleaningWorker !== tent.cleaningAssignedTo) {
      // Small timeout to ensure previous updates are processed
      setTimeout(() => {
        updateTentCleaningStatus(tent.id, tent.cleaningStatus, cleaningWorker || undefined);
      }, 50);
    }
    
    toast.success('השינויים נשמרו');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <span className="text-2xl font-bold">{tent.code}</span>
            {isVIP && (
              <span className="px-2 py-1 bg-amber-500 text-white rounded-full text-sm font-semibold flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                VIP
              </span>
            )}
            {tent.isAccessible && (
              <span className="px-2 py-1 bg-primary text-primary-foreground rounded-full text-sm">
                <Accessibility className="w-3 h-3" />
              </span>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Stats */}
          <div className="flex gap-2 flex-wrap">
            <span className="px-3 py-1.5 bg-green-100 text-green-800 rounded-lg text-sm font-medium">
              {stats.free} פנוי
            </span>
            <span className="px-3 py-1.5 bg-blue-100 text-blue-800 rounded-lg text-sm font-medium">
              {stats.reserved} שמור
            </span>
            <span className="px-3 py-1.5 bg-orange-100 text-orange-800 rounded-lg text-sm font-medium">
              {stats.occupied} תפוס
            </span>
          </div>

          {/* Cleaning Status with Worker Assignment */}
          <div className="space-y-4 p-4 bg-muted/50 rounded-xl">
            <h3 className="font-semibold flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              מצב ניקיון
            </h3>
            
            <div className="flex gap-2 flex-wrap">
              {cleaningStatusOptions.map(option => (
                <Button
                  key={option.value}
                  type="button"
                  variant={tent.cleaningStatus === option.value ? 'default' : 'outline'}
                  onClick={() => handleCleaningStatusChange(option.value)}
                  className={cn('flex-1', tent.cleaningStatus === option.value && option.className)}
                >
                  {option.label}
                </Button>
              ))}
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <User className="w-4 h-4" />
                עובד מוקצה
              </Label>
              <Input
                value={cleaningWorker}
                onChange={(e) => setCleaningWorker(e.target.value)}
                onBlur={() => updateTentCleaningStatus(tent.id, tent.cleaningStatus, cleaningWorker || undefined)}
                placeholder="שם העובד..."
              />
            </div>
            
            {tent.cleaningAssignedTo && (
              <div className="text-sm text-muted-foreground">
                מוקצה ל: <span className="font-semibold">{tent.cleaningAssignedTo}</span>
              </div>
            )}
          </div>

          {/* Group Info */}
          <div className="space-y-4 p-4 bg-muted/50 rounded-xl">
            <h3 className="font-semibold flex items-center gap-2">
              <Users className="w-4 h-4" />
              פרטי הקבוצה
            </h3>
            
            <div className="space-y-2">
              <Label>שם הקבוצה</Label>
              <Input
                value={tent.groupName || ''}
                onChange={(e) => updateTentGroupName(tent.id, e.target.value)}
                placeholder="שם הקבוצה..."
              />
            </div>

            {/* People Count */}
            <div className="space-y-2">
              <Label className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  מספר אנשים
                </span>
                <span className="text-sm text-muted-foreground font-normal">
                  מקסימום: {tent.beds.length} מיטות
                </span>
              </Label>
              <div className="flex items-center gap-3">
                <Input
                  type="number"
                  min={0}
                  max={tent.beds.length}
                  value={tent.peopleCount ?? ''}
                  onChange={(e) => {
                    const value = e.target.value === '' ? undefined : parseInt(e.target.value);
                    updateTentPeopleCount(tent.id, value);
                  }}
                  placeholder={`0 - ${tent.beds.length}`}
                  className="flex-1"
                />
                {tent.peopleCount !== undefined && tent.peopleCount > 0 && (
                  <div className="flex items-center gap-2 px-3 py-2 bg-primary/10 rounded-lg">
                    <Users className="w-4 h-4 text-primary" />
                    <span className="font-semibold text-primary">
                      {tent.peopleCount}/{tent.beds.length}
                    </span>
                  </div>
                )}
              </div>
              {tent.peopleCount !== undefined && tent.peopleCount > tent.beds.length && (
                <p className="text-sm text-destructive flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  הכמות חורגת ממספר המיטות
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Check-in
                </Label>
                <Input
                  type="date"
                  value={tent.checkInDate || ''}
                  onChange={(e) => updateTentDates(tent.id, e.target.value, tent.checkOutDate)}
                />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Check-out
                </Label>
                <Input
                  type="date"
                  value={tent.checkOutDate || ''}
                  onChange={(e) => updateTentDates(tent.id, tent.checkInDate, e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Gender Designation */}
          <div className="space-y-3 p-4 bg-muted/50 rounded-xl">
            <h3 className="font-semibold">הקצאת מגדר</h3>
            <div className="flex gap-2">
              {genderOptions.map(option => (
                <Button
                  key={option.value}
                  type="button"
                  variant={tent.gender === option.value || (!tent.gender && option.value === 'MIXED') ? 'default' : 'outline'}
                  onClick={() => handleGenderChange(option.value)}
                  className="flex-1"
                >
                  <span className="ml-2">{option.icon}</span>
                  {option.label}
                </Button>
              ))}
            </div>
          </div>

          {/* VIP Options - Bathroom & Shower with Maintenance */}
          {isVIP && (
            <div className="space-y-4 p-4 bg-amber-50 border border-amber-200 rounded-xl">
              <h3 className="font-semibold flex items-center gap-2 text-amber-800">
                <Sparkles className="w-4 h-4" />
                אפשרויות VIP
              </h3>
              
              {/* Bathroom Section */}
              <div className="space-y-3 p-3 bg-white/50 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Bath className="w-5 h-5 text-amber-700" />
                    <div>
                      <Label className="text-base">שירותים פרטיים</Label>
                      <p className="text-sm text-muted-foreground">הוסף שירותים לאוהל זה</p>
                    </div>
                  </div>
                  <Switch
                    checked={tent.hasPrivateBathroom || false}
                    onCheckedChange={handleBathroomToggle}
                  />
                </div>
                
                {/* Bathroom Maintenance */}
                {tent.hasPrivateBathroom && (
                  <div className="pt-2 border-t border-amber-200">
                    {tent.bathroomWorkingStatus && tent.bathroomWorkingStatus !== 'WORKING' ? (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className={cn(
                            'px-2 py-1 rounded-full text-xs font-semibold',
                            tent.bathroomWorkingStatus === 'BROKEN' ? 'bg-red-500 text-white' : 'bg-yellow-500 text-white'
                          )}>
                            {tent.bathroomWorkingStatus === 'BROKEN' ? '⚠️ תקול' : '🔧 תחזוקה'}
                          </span>
                          <Button size="sm" variant="outline" onClick={handleResolveBathroom}>
                            <CheckCircle className="w-4 h-4 ml-1" />
                            סמן כתקין
                          </Button>
                        </div>
                        {tent.bathroomMaintenanceImage && (
                          <img 
                            src={tent.bathroomMaintenanceImage} 
                            alt="Issue" 
                            className="w-full h-32 object-cover rounded-lg"
                          />
                        )}
                        {tent.bathroomMaintenanceNotes && (
                          <p className="text-sm text-muted-foreground">{tent.bathroomMaintenanceNotes}</p>
                        )}
                      </div>
                    ) : showBathroomIssue ? (
                      <div className="space-y-3">
                        <div className="flex gap-2">
                          <button
                            onClick={() => setBathroomStatus('BROKEN')}
                            className={cn(
                              'flex-1 px-3 py-2 rounded-lg text-sm font-semibold',
                              bathroomStatus === 'BROKEN' ? 'bg-red-500 text-white' : 'bg-muted'
                            )}
                          >
                            <AlertTriangle className="w-4 h-4 inline ml-1" />
                            תקול
                          </button>
                          <button
                            onClick={() => setBathroomStatus('MAINTENANCE')}
                            className={cn(
                              'flex-1 px-3 py-2 rounded-lg text-sm font-semibold',
                              bathroomStatus === 'MAINTENANCE' ? 'bg-yellow-500 text-white' : 'bg-muted'
                            )}
                          >
                            <Wrench className="w-4 h-4 inline ml-1" />
                            תחזוקה
                          </button>
                        </div>
                        
                        {bathroomImage ? (
                          <div className="relative">
                            <img src={bathroomImage} alt="Preview" className="w-full h-24 object-cover rounded-lg" />
                            <Button 
                              size="sm" 
                              variant="destructive" 
                              className="absolute top-1 left-1"
                              onClick={() => setBathroomImage(null)}
                            >
                              <X className="w-3 h-3" />
                            </Button>
                          </div>
                        ) : (
                          <button
                            onClick={() => bathroomFileRef.current?.click()}
                            className="w-full h-20 border-2 border-dashed border-amber-300 rounded-lg flex items-center justify-center gap-2 hover:bg-amber-100"
                          >
                            <Camera className="w-5 h-5 text-amber-600" />
                            <span className="text-sm text-amber-600">הוסף תמונה</span>
                          </button>
                        )}
                        <input
                          ref={bathroomFileRef}
                          type="file"
                          accept="image/*"
                          capture="environment"
                          onChange={(e) => handleFileSelect(e, setBathroomImage)}
                          className="hidden"
                        />
                        
                        <Textarea
                          value={bathroomNotes}
                          onChange={(e) => setBathroomNotes(e.target.value)}
                          placeholder="תיאור הבעיה..."
                          rows={2}
                        />
                        
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" onClick={() => setShowBathroomIssue(false)} className="flex-1">
                            ביטול
                          </Button>
                          <Button size="sm" onClick={handleSubmitBathroomIssue} className="flex-1">
                            דווח
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full text-amber-700 border-amber-300"
                        onClick={() => setShowBathroomIssue(true)}
                      >
                        <AlertTriangle className="w-4 h-4 ml-2" />
                        דווח על בעיה
                      </Button>
                    )}
                  </div>
                )}
              </div>

              {/* Shower Section */}
              <div className="space-y-3 p-3 bg-white/50 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <ShowerHead className="w-5 h-5 text-amber-700" />
                    <div>
                      <Label className="text-base">מקלחת פרטית</Label>
                      <p className="text-sm text-muted-foreground">הוסף מקלחת לאוהל זה</p>
                    </div>
                  </div>
                  <Switch
                    checked={tent.hasPrivateShower || false}
                    onCheckedChange={handleShowerToggle}
                  />
                </div>
                
                {/* Shower Maintenance */}
                {tent.hasPrivateShower && (
                  <div className="pt-2 border-t border-amber-200">
                    {tent.showerWorkingStatus && tent.showerWorkingStatus !== 'WORKING' ? (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className={cn(
                            'px-2 py-1 rounded-full text-xs font-semibold',
                            tent.showerWorkingStatus === 'BROKEN' ? 'bg-red-500 text-white' : 'bg-yellow-500 text-white'
                          )}>
                            {tent.showerWorkingStatus === 'BROKEN' ? '⚠️ תקול' : '🔧 תחזוקה'}
                          </span>
                          <Button size="sm" variant="outline" onClick={handleResolveShower}>
                            <CheckCircle className="w-4 h-4 ml-1" />
                            סמן כתקין
                          </Button>
                        </div>
                        {tent.showerMaintenanceImage && (
                          <img 
                            src={tent.showerMaintenanceImage} 
                            alt="Issue" 
                            className="w-full h-32 object-cover rounded-lg"
                          />
                        )}
                        {tent.showerMaintenanceNotes && (
                          <p className="text-sm text-muted-foreground">{tent.showerMaintenanceNotes}</p>
                        )}
                      </div>
                    ) : showShowerIssue ? (
                      <div className="space-y-3">
                        <div className="flex gap-2">
                          <button
                            onClick={() => setShowerStatus('BROKEN')}
                            className={cn(
                              'flex-1 px-3 py-2 rounded-lg text-sm font-semibold',
                              showerStatus === 'BROKEN' ? 'bg-red-500 text-white' : 'bg-muted'
                            )}
                          >
                            <AlertTriangle className="w-4 h-4 inline ml-1" />
                            תקול
                          </button>
                          <button
                            onClick={() => setShowerStatus('MAINTENANCE')}
                            className={cn(
                              'flex-1 px-3 py-2 rounded-lg text-sm font-semibold',
                              showerStatus === 'MAINTENANCE' ? 'bg-yellow-500 text-white' : 'bg-muted'
                            )}
                          >
                            <Wrench className="w-4 h-4 inline ml-1" />
                            תחזוקה
                          </button>
                        </div>
                        
                        {showerImage ? (
                          <div className="relative">
                            <img src={showerImage} alt="Preview" className="w-full h-24 object-cover rounded-lg" />
                            <Button 
                              size="sm" 
                              variant="destructive" 
                              className="absolute top-1 left-1"
                              onClick={() => setShowerImage(null)}
                            >
                              <X className="w-3 h-3" />
                            </Button>
                          </div>
                        ) : (
                          <button
                            onClick={() => showerFileRef.current?.click()}
                            className="w-full h-20 border-2 border-dashed border-amber-300 rounded-lg flex items-center justify-center gap-2 hover:bg-amber-100"
                          >
                            <Camera className="w-5 h-5 text-amber-600" />
                            <span className="text-sm text-amber-600">הוסף תמונה</span>
                          </button>
                        )}
                        <input
                          ref={showerFileRef}
                          type="file"
                          accept="image/*"
                          capture="environment"
                          onChange={(e) => handleFileSelect(e, setShowerImage)}
                          className="hidden"
                        />
                        
                        <Textarea
                          value={showerNotes}
                          onChange={(e) => setShowerNotes(e.target.value)}
                          placeholder="תיאור הבעיה..."
                          rows={2}
                        />
                        
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" onClick={() => setShowShowerIssue(false)} className="flex-1">
                            ביטול
                          </Button>
                          <Button size="sm" onClick={handleSubmitShowerIssue} className="flex-1">
                            דווח
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full text-amber-700 border-amber-300"
                        onClick={() => setShowShowerIssue(true)}
                      >
                        <AlertTriangle className="w-4 h-4 ml-2" />
                        דווח על בעיה
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Guest Names */}
          <div className="space-y-4 p-4 bg-muted/50 rounded-xl">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold flex items-center gap-2">
                <User className="w-4 h-4" />
                שמות האורחים
              </h3>
              <Button size="sm" variant="outline" onClick={handleSaveAllNames}>
                <Save className="w-4 h-4 ml-1" />
                שמור
              </Button>
            </div>

            {/* Bunk Beds */}
            {bunkBeds.length > 0 && (
              <div className="space-y-3">
                <Label className="text-sm text-muted-foreground">מיטות קומתיים</Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {bunkBeds.map((bunk, index) => (
                    <div key={`bunk-${index}`} className="p-3 bg-background rounded-lg border">
                      <div className="text-sm font-medium mb-2">מיטת קומתיים {bunk.top.bunkNumber}</div>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground w-16">למעלה:</span>
                          <Input
                            value={localGuestNames[bunk.top.id] || ''}
                            onChange={(e) => handleGuestNameChange(bunk.top.id, e.target.value)}
                            onBlur={() => handleGuestNameBlur(bunk.top.id)}
                            placeholder="שם..."
                            className="h-8 text-sm"
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground w-16">למטה:</span>
                          <Input
                            value={localGuestNames[bunk.bottom.id] || ''}
                            onChange={(e) => handleGuestNameChange(bunk.bottom.id, e.target.value)}
                            onBlur={() => handleGuestNameBlur(bunk.bottom.id)}
                            placeholder="שם..."
                            className="h-8 text-sm"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Single Beds */}
            {singleBeds.length > 0 && (
              <div className="space-y-3">
                <Label className="text-sm text-muted-foreground">מיטות יחיד</Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {singleBeds.map((bed) => (
                    <div key={bed.id} className="flex items-center gap-2">
                      <span className="text-sm font-medium w-20">{bed.label}:</span>
                      <Input
                        value={localGuestNames[bed.id] || ''}
                        onChange={(e) => handleGuestNameChange(bed.id, e.target.value)}
                        onBlur={() => handleGuestNameBlur(bed.id)}
                        placeholder="שם..."
                        className="h-8 text-sm"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              הערות
            </Label>
            <Textarea
              value={tent.notes || ''}
              onChange={(e) => updateTentNotes(tent.id, e.target.value)}
              placeholder="הערות על אוהל זה..."
              rows={3}
            />
          </div>
        </div>

        {/* Close Button */}
        <div className="flex justify-end pt-4 border-t">
          <Button onClick={handleSaveAndClose}>
            שמור וצא
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
