import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useVillage } from '@/context/VillageContext';
import { BreadcrumbNav } from '@/components/BreadcrumbNav';
import { CleaningStatus, WorkingStatus, ActivityReservation, ActivitySpace } from '@/types/village';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ActivitySpaceReportModal } from '@/components/ActivitySpaceReportModal';
import { 
  Loader2, 
  CalendarDays, 
  Plus,
  Trash2,
  Clock,
  Users,
  X,
  Tent,
  Sparkles,
  Wrench,
  CheckCircle,
  Ban,
  Settings,
  Calendar,
  Save,
  Camera
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { timeToMinutes } from '@/lib/timeUtils';

// Generate consistent color for group names
const getGroupColor = (groupName: string): string => {
  let hash = 0;
  for (let i = 0; i < groupName.length; i++) {
    hash = groupName.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash % 360);
  return `hsl(${hue}, 70%, 45%)`;
};

// Hours range for the grid (6:00 - 22:00)
const HOURS = Array.from({ length: 17 }, (_, i) => {
  const hour = i + 6;
  return `${hour.toString().padStart(2, '0')}:00`;
});

const Activities = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const spaceIdFromUrl = searchParams.get('spaceId') ?? '';
  const focusId = searchParams.get('focus');
  const { 
    state, 
    isLoading,
    addActivityReservation,
    removeActivityReservation,
    updateActivitySpaceStatus,
    updateActivitySpaceNotes,
    reportActivitySpaceIssue,
    resolveActivitySpaceIssue
  } = useVillage();

  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedSpaceId, setSelectedSpaceId] = useState<string>(focusId || spaceIdFromUrl || '');
  const [formData, setFormData] = useState({
    startTime: '09:00',
    endTime: '10:00',
    groupName: '',
    notes: '',
  });
  const [error, setError] = useState('');
  const [selectedReservation, setSelectedReservation] = useState<ActivityReservation | null>(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportStatus, setReportStatus] = useState<WorkingStatus>('BROKEN');
  const [cleaningNote, setCleaningNote] = useState('');

  // Get active groups: groups with reservations that include the selected date
  const activeGroups = useMemo(() => {
    if (!state) return [];
    
    const groups = new Map<string, { name: string; neighborhoodId?: string; color: string }>();
    const today = selectedDate;

    // From neighborhood reservations
    Object.values(state.neighborhoodReservations).forEach((res) => {
      if (res.checkInDate <= today && res.checkOutDate >= today) {
        if (!groups.has(res.groupName)) {
          groups.set(res.groupName, { 
            name: res.groupName, 
            neighborhoodId: res.neighborhoodId,
            color: getGroupColor(res.groupName)
          });
        }
      }
    });

    // From individual tent reservations
    Object.values(state.tents).forEach((tent) => {
      if (tent.groupName && tent.checkInDate && tent.checkOutDate) {
        if (tent.checkInDate <= today && tent.checkOutDate >= today) {
          if (!groups.has(tent.groupName)) {
            groups.set(tent.groupName, { 
              name: tent.groupName,
              color: getGroupColor(tent.groupName)
            });
          }
        }
      }
    });

    return Array.from(groups.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [state, selectedDate]);

  // Get reservations for selected date and space
  const spaceReservations = useMemo(() => {
    if (!state || !selectedSpaceId) return [];
    return Object.values(state.activityReservations)
      .filter(r => r.date === selectedDate && r.spaceId === selectedSpaceId)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  }, [state, selectedDate, selectedSpaceId]);

  if (isLoading || !state) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  const activitySpaces = Object.values(state.activitySpaces);
  const currentSpace = activitySpaces.find(s => s.id === selectedSpaceId);

  // Set first space if none selected
  if (!selectedSpaceId && activitySpaces.length > 0) {
    setSelectedSpaceId(activitySpaces[0].id);
  }

  const BUFFER = 15; // minutes buffer before and after reservation

  // Get reservation for a specific hour slot (using buffered range)
  const getReservationForHour = (hour: string): ActivityReservation | null => {
    return spaceReservations.find(r => {
      const hourMin = timeToMinutes(hour);
      const bufferedStart = timeToMinutes(r.startTime) - BUFFER;
      const bufferedEnd = timeToMinutes(r.endTime) + BUFFER;
      return hourMin >= bufferedStart && hourMin < bufferedEnd;
    }) || null;
  };

  // Check if this hour is the start row of a reservation block (using buffered start)
  const isReservationStart = (hour: string): boolean => {
    return spaceReservations.some(r => {
      const bufferedStartHour = Math.floor((timeToMinutes(r.startTime) - BUFFER) / 60);
      const hourValue = parseInt(hour.split(':')[0]);
      return hourValue === bufferedStartHour;
    });
  };

  // Get reservation span using buffered times
  const getReservationSpanForRow = (reservation: ActivityReservation): number => {
    const bufferedStart = timeToMinutes(reservation.startTime) - BUFFER;
    const bufferedEnd = timeToMinutes(reservation.endTime) + BUFFER;
    return Math.max(1, Math.ceil((bufferedEnd - bufferedStart) / 60));
  };

  const handleHourClick = (hour: string) => {
    const reservation = getReservationForHour(hour);
    if (reservation) {
      setSelectedReservation(reservation);
    } else {
      // Open add form with this hour pre-selected
      const startHour = parseInt(hour.split(':')[0]);
      const endHour = Math.min(startHour + 1, 22);
      setFormData({
        startTime: hour,
        endTime: `${endHour.toString().padStart(2, '0')}:00`,
        groupName: '',
        notes: '',
      });
      setShowAddForm(true);
    }
  };

  const handleAddReservation = () => {
    setError('');

    if (!selectedSpaceId) {
      setError('בחר מתקן');
      return;
    }
    if (!formData.groupName.trim()) {
      setError('הכנס שם קבוצה');
      return;
    }
    if (formData.startTime >= formData.endTime) {
      setError('שעת הסיום חייבת להיות אחרי ההתחלה');
      return;
    }

    const success = addActivityReservation({
      spaceId: selectedSpaceId,
      date: selectedDate,
      startTime: formData.startTime,
      endTime: formData.endTime,
      groupName: formData.groupName.trim(),
      notes: formData.notes.trim(),
    });

    if (success) {
      setShowAddForm(false);
      setFormData({ startTime: '09:00', endTime: '10:00', groupName: '', notes: '' });
    } else {
      setError('הזמן מתנגש עם הזמנה קיימת');
    }
  };

  const handleDeleteReservation = (id: string) => {
    removeActivityReservation(id);
    setSelectedReservation(null);
  };

  const handleStatusChange = (spaceId: string, type: 'cleaning' | 'working', value: string) => {
    if (type === 'cleaning') {
      // Pass cleaning note only when marking as needs cleaning
      const noteToSave = value === 'NEEDS_CLEANING' ? cleaningNote : undefined;
      updateActivitySpaceStatus(spaceId, value as CleaningStatus, undefined, noteToSave);
      if (value === 'CLEAN') {
        setCleaningNote(''); // Reset the input
      }
    } else {
      // For BROKEN or MAINTENANCE, open the report modal
      if (value === 'BROKEN' || value === 'MAINTENANCE') {
        setReportStatus(value as WorkingStatus);
        setShowReportModal(true);
      } else if (value === 'WORKING') {
        // Resolve the issue
        resolveActivitySpaceIssue(spaceId);
      } else {
        updateActivitySpaceStatus(spaceId, undefined, value as WorkingStatus);
      }
    }
  };

  const handleReportSubmit = (data: { status: WorkingStatus; notes: string; image?: string }) => {
    if (currentSpace) {
      reportActivitySpaceIssue(currentSpace.id, data.status, data.notes, data.image);
    }
  };

  const getStatusIcon = (space: typeof activitySpaces[0]) => {
    if (space.workingStatus === 'BROKEN') return <Wrench className="w-4 h-4 text-destructive" />;
    if (space.workingStatus === 'MAINTENANCE') return <Wrench className="w-4 h-4 text-yellow-600" />;
    if (space.workingStatus === 'CLOSED') return <Ban className="w-4 h-4 text-muted-foreground" />;
    if (space.cleaningStatus === 'NEEDS_CLEANING') return <Sparkles className="w-4 h-4 text-yellow-600" />;
    if (space.cleaningStatus === 'CLEANING_IN_PROGRESS') return <Sparkles className="w-4 h-4 text-blue-500" />;
    return <CheckCircle className="w-4 h-4 text-green-600" />;
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b-2 border-border">
        <div className="container py-6">
          <BreadcrumbNav items={[{ label: 'מתקנים משותפים' }]} />
          <h1 className="text-3xl md:text-4xl font-bold flex items-center gap-3">
            <CalendarDays className="w-10 h-10" />
            מתקנים משותפים
          </h1>
          <p className="text-muted-foreground text-lg mt-2">
            ניהול הזמנות, ניקיון ותחזוקה
          </p>
        </div>
      </header>

      <main className="container py-6 space-y-6">
        {/* Date Selector */}
        <div className="flex flex-wrap items-center gap-4">
          <label className="text-lg font-semibold">תאריך:</label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-4 py-3 text-lg rounded-xl border-2 border-input bg-background focus:outline-none focus:border-primary"
          />
        </div>

        {/* Active Groups Legend */}
        {activeGroups.length > 0 && (
          <div className="p-4 bg-muted/30 rounded-xl">
            <p className="text-sm font-semibold text-muted-foreground mb-2 flex items-center gap-2">
              <Tent className="w-4 h-4" />
              קבוצות מאוכסנות היום:
            </p>
            <div className="flex flex-wrap gap-2">
              {activeGroups.map((group) => (
                <span
                  key={group.name}
                  className="px-3 py-1 rounded-full text-sm font-medium text-white"
                  style={{ backgroundColor: group.color }}
                >
                  {group.name}
                  {group.neighborhoodId && ` (${group.neighborhoodId})`}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Space Selector */}
        <div className="flex flex-wrap gap-2">
          {activitySpaces.map((space) => (
            <button
              key={space.id}
              onClick={() => setSelectedSpaceId(space.id)}
              className={cn(
                "px-4 py-2 rounded-xl font-medium text-sm flex items-center gap-2 transition-all border-2",
                selectedSpaceId === space.id
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card border-border hover:border-primary/50"
              )}
            >
              {getStatusIcon(space)}
              {space.name}
            </button>
          ))}
        </div>

        {/* Main Content with Tabs */}
        {currentSpace && (
          <div className="tile p-0 overflow-hidden">
            <Tabs defaultValue="reservas" className="w-full">
              <TabsList className="w-full justify-start rounded-none border-b bg-muted/30 p-0 h-auto">
                <TabsTrigger 
                  value="reservas" 
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-6 py-3 text-base font-semibold"
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  הזמנות
                </TabsTrigger>
                <TabsTrigger 
                  value="estado" 
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-6 py-3 text-base font-semibold"
                >
                  <Settings className="w-4 h-4 mr-2" />
                  מצב והערות
                </TabsTrigger>
              </TabsList>

              {/* Reservations Tab - Hourly Grid */}
              <TabsContent value="reservas" className="m-0 p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold flex items-center gap-2">
                    <Clock className="w-5 h-5" />
                    {currentSpace.name} - {selectedDate}
                  </h3>
                  <button
                    onClick={() => setShowAddForm(true)}
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-xl font-medium flex items-center gap-2"
                  >
                    <Plus className="w-5 h-5" />
                    הזמנה חדשה
                  </button>
                </div>

                {/* Hourly Grid Table */}
                <div className="border rounded-xl overflow-hidden">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-muted/50">
                        <th className="text-right p-3 font-semibold text-sm w-20 border-l">שעה</th>
                        <th className="text-right p-3 font-semibold text-sm">הזמנה</th>
                      </tr>
                    </thead>
                    <tbody>
                      {HOURS.map((hour, index) => {
                        const reservation = getReservationForHour(hour);
                        const isStart = reservation && isReservationStart(hour);
                        const span = reservation ? getReservationSpanForRow(reservation) : 1;
                        const groupColor = reservation ? getGroupColor(reservation.groupName) : '';
                        
                        // Skip rendering if this hour is part of a reservation but not the start
                        if (reservation && !isStart) {
                          return (
                            <tr key={hour} className="border-t">
                              <td className="p-3 font-mono text-sm font-semibold text-muted-foreground border-r bg-muted/20">
                                {hour}
                              </td>
                            </tr>
                          );
                        }

                        return (
                          <tr 
                            key={hour} 
                            className={cn(
                              "border-t transition-colors",
                              !reservation && "hover:bg-muted/30 cursor-pointer"
                            )}
                            onClick={() => !reservation && handleHourClick(hour)}
                          >
                            <td className="p-3 font-mono text-sm font-semibold text-muted-foreground border-r bg-muted/20">
                              {hour}
                            </td>
                            <td 
                              className="p-0"
                              rowSpan={reservation ? span : 1}
                            >
                              {reservation ? (
                                <button
                                  type="button"
                                  onClick={() => setSelectedReservation(reservation)}
                                  className="w-full h-full text-left p-3 transition-all hover:brightness-110"
                                  style={{ 
                                    backgroundColor: groupColor,
                                    minHeight: `${span * 44}px`
                                  }}
                                >
                                  <div className="text-white font-bold text-lg">
                                    {reservation.groupName}
                                  </div>
                                  <div className="text-white/90 text-sm flex items-center gap-2">
                                    <Clock className="w-3 h-3" />
                                    {reservation.startTime} - {reservation.endTime}
                                  </div>
                                  {reservation.notes && (
                                    <div className="text-white/80 text-xs mt-1">
                                      📝 {reservation.notes}
                                    </div>
                                  )}
                                </button>
                              ) : (
                                <div className="p-3 text-muted-foreground/50 text-sm">
                                  לחץ להזמנה
                                </div>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </TabsContent>

              {/* Status Tab */}
              <TabsContent value="estado" className="m-0 p-6">
                <h3 className="text-xl font-bold mb-6">{currentSpace.name}</h3>
                
                <div className="space-y-6">
                  {/* Cleaning Status */}
                  <div>
                    <label className="flex items-center gap-2 text-sm font-semibold text-muted-foreground mb-3">
                      <Sparkles className="w-4 h-4" />
                      מצב ניקיון
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {[
                        { value: 'CLEAN', label: '✓ נקי', bg: 'bg-green-500' },
                        { value: 'NEEDS_CLEANING', label: '🧹 דורש ניקיון', bg: 'bg-yellow-500' },
                        { value: 'CLEANING_IN_PROGRESS', label: '⏳ בתהליך ניקיון', bg: 'bg-blue-500' },
                      ].map((status) => (
                        <button
                          key={status.value}
                          onClick={() => handleStatusChange(currentSpace.id, 'cleaning', status.value)}
                          className={cn(
                            "px-4 py-3 rounded-xl font-medium text-base transition-all border-2",
                            currentSpace.cleaningStatus === status.value
                              ? `${status.bg} text-white border-transparent`
                              : "bg-muted border-border hover:border-primary/50"
                          )}
                        >
                          {status.label}
                        </button>
                      ))}
                    </div>
                    
                    {/* Cleaning Notes Input */}
                    <div className="mt-3">
                      <input
                        type="text"
                        value={cleaningNote}
                        onChange={(e) => setCleaningNote(e.target.value)}
                        placeholder="הערת ניקיון (אופציונלי)..."
                        className="w-full px-4 py-2 rounded-xl border-2 border-input bg-background focus:outline-none focus:border-primary text-sm"
                      />
                      {currentSpace.cleaningNotes && currentSpace.cleaningStatus !== 'CLEAN' && (
                        <p className="text-sm text-muted-foreground mt-2">
                          📝 הערה קיימת: {currentSpace.cleaningNotes}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Working Status */}
                  <div>
                    <label className="flex items-center gap-2 text-sm font-semibold text-muted-foreground mb-3">
                      <Wrench className="w-4 h-4" />
                      מצב תפעולי
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {[
                        { value: 'WORKING', label: '✓ תקין', bg: 'bg-green-500' },
                        { value: 'MAINTENANCE', label: '⚠️ בתחזוקה', bg: 'bg-yellow-500' },
                        { value: 'BROKEN', label: '🔧 תקול', bg: 'bg-destructive' },
                        { value: 'CLOSED', label: '🚫 סגור', bg: 'bg-muted-foreground' },
                      ].map((status) => (
                        <button
                          key={status.value}
                          onClick={() => handleStatusChange(currentSpace.id, 'working', status.value)}
                          className={cn(
                            "px-4 py-3 rounded-xl font-medium text-base transition-all border-2",
                            currentSpace.workingStatus === status.value
                              ? `${status.bg} text-white border-transparent`
                              : "bg-muted border-border hover:border-primary/50"
                          )}
                        >
                          {status.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Current Maintenance Info */}
                  {(currentSpace.workingStatus === 'BROKEN' || currentSpace.workingStatus === 'MAINTENANCE') && (
                    <div className="p-4 rounded-xl bg-destructive/10 border-2 border-destructive/30">
                      <h4 className="font-semibold text-destructive mb-2 flex items-center gap-2">
                        <Wrench className="w-4 h-4" />
                        בעיה שדווחה
                      </h4>
                      {currentSpace.maintenanceImage && (
                        <img
                          src={currentSpace.maintenanceImage}
                          alt="תמונת הבעיה"
                          className="w-full max-h-48 object-cover rounded-lg mb-3"
                        />
                      )}
                      {currentSpace.maintenanceNotes && (
                        <p className="text-sm text-muted-foreground mb-3">
                          {currentSpace.maintenanceNotes}
                        </p>
                      )}
                      <button
                        onClick={() => {
                          setReportStatus(currentSpace.workingStatus as WorkingStatus);
                          setShowReportModal(true);
                        }}
                        className="px-4 py-2 bg-muted rounded-lg text-sm font-medium flex items-center gap-2"
                      >
                        <Camera className="w-4 h-4" />
                        ערוך דיווח
                      </button>
                    </div>
                  )}

                  {/* Notes */}
                  <div>
                    <label className="flex items-center gap-2 text-sm font-semibold text-muted-foreground mb-3">
                      📝 הערות למתקן
                    </label>
                    <textarea
                      value={currentSpace.notes || ''}
                      onChange={(e) => updateActivitySpaceNotes(currentSpace.id, e.target.value)}
                      placeholder="הוסף הערות על מתקן זה..."
                      className="w-full px-4 py-3 rounded-xl border-2 border-input bg-background focus:outline-none focus:border-primary min-h-[120px] text-base"
                    />
                  </div>

                  {/* Save and Exit Button */}
                  <div className="pt-4 border-t">
                    <button
                      onClick={() => navigate('/')}
                      className="w-full px-6 py-4 bg-primary text-primary-foreground rounded-xl font-bold text-lg flex items-center justify-center gap-3 hover:bg-primary/90 transition-colors"
                    >
                      <Save className="w-6 h-6" />
                      שמור וצא
                    </button>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        )}

        {/* Add Reservation Modal */}
        {showAddForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-card rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-card p-4 border-b flex items-center justify-between">
                <h2 className="text-xl font-bold">הזמנה חדשה</h2>
                <button
                  onClick={() => {
                    setShowAddForm(false);
                    setError('');
                  }}
                  className="p-2 hover:bg-muted rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-4 space-y-4">
                {/* Space Display */}
                <div>
                  <label className="text-sm font-semibold text-muted-foreground">מתקן</label>
                  <p className="text-lg font-bold">{currentSpace?.name}</p>
                </div>

                {/* Date */}
                <div>
                  <label className="text-sm font-semibold text-muted-foreground">תאריך</label>
                  <p className="text-lg font-bold">{selectedDate}</p>
                </div>

                {/* Time Selection */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-semibold text-muted-foreground mb-1 block">
                      שעת התחלה
                    </label>
                    <select
                      value={formData.startTime}
                      onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                      className="w-full px-3 py-3 rounded-xl border-2 border-input bg-background text-lg font-mono"
                    >
                      {HOURS.map(hour => (
                        <option key={hour} value={hour}>{hour}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-muted-foreground mb-1 block">
                      שעת סיום
                    </label>
                    <select
                      value={formData.endTime}
                      onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                      className="w-full px-3 py-3 rounded-xl border-2 border-input bg-background text-lg font-mono"
                    >
                      {HOURS.map(hour => (
                        <option key={hour} value={hour}>{hour}</option>
                      ))}
                      <option value="22:00">22:00</option>
                    </select>
                  </div>
                </div>

                {/* Group Selection */}
                <div>
                  <label className="text-sm font-semibold text-muted-foreground mb-2 block">
                    קבוצה
                  </label>
                  
                  {/* Quick select for active groups */}
                  {activeGroups.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-2">
                      {activeGroups.map((group) => (
                        <button
                          key={group.name}
                          type="button"
                          onClick={() => setFormData({ ...formData, groupName: group.name })}
                          className={cn(
                            "px-3 py-1.5 rounded-full text-sm font-medium transition-all border-2",
                            formData.groupName === group.name
                              ? "text-white border-transparent"
                              : "border-border hover:border-primary/50"
                          )}
                          style={{ 
                            backgroundColor: formData.groupName === group.name ? group.color : undefined 
                          }}
                        >
                          {group.name}
                        </button>
                      ))}
                    </div>
                  )}
                  
                  <input
                    type="text"
                    value={formData.groupName}
                    onChange={(e) => setFormData({ ...formData, groupName: e.target.value })}
                    placeholder="או הקלד שם קבוצה..."
                    className="w-full px-4 py-3 rounded-xl border-2 border-input bg-background focus:outline-none focus:border-primary"
                  />
                </div>

                {/* Notes */}
                <div>
                  <label className="text-sm font-semibold text-muted-foreground mb-1 block">
                    הערות (אופציונלי)
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="הוסף הערות..."
                    className="w-full px-4 py-3 rounded-xl border-2 border-input bg-background focus:outline-none focus:border-primary min-h-[80px]"
                  />
                </div>

                {error && (
                  <div className="p-3 bg-destructive/10 text-destructive rounded-xl text-sm font-medium">
                    {error}
                  </div>
                )}
              </div>

              <div className="sticky bottom-0 bg-card p-4 border-t flex gap-3">
                <button
                  onClick={() => {
                    setShowAddForm(false);
                    setError('');
                  }}
                  className="flex-1 px-4 py-3 bg-muted rounded-xl font-semibold"
                >
                  ביטול
                </button>
                <button
                  onClick={handleAddReservation}
                  className="flex-1 px-4 py-3 bg-primary text-primary-foreground rounded-xl font-semibold"
                >
                  שמור הזמנה
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Reservation Detail Modal */}
        {selectedReservation && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-card rounded-2xl max-w-md w-full">
              <div 
                className="p-6 rounded-t-2xl"
                style={{ backgroundColor: getGroupColor(selectedReservation.groupName) }}
              >
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-white">{selectedReservation.groupName}</h2>
                  <button
                    onClick={() => setSelectedReservation(null)}
                    className="p-2 hover:bg-white/20 rounded-lg text-white"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-4">
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-muted-foreground" />
                  <span className="text-lg font-semibold">
                    {selectedReservation.startTime} - {selectedReservation.endTime}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-muted-foreground" />
                  <span className="text-lg">{selectedReservation.date}</span>
                </div>

                {selectedReservation.notes && (
                  <div className="p-3 bg-muted/30 rounded-xl">
                    <p className="text-sm font-semibold text-muted-foreground mb-1">הערות:</p>
                    <p>{selectedReservation.notes}</p>
                  </div>
                )}
              </div>

              <div className="p-4 border-t flex gap-3">
                <button
                  onClick={() => setSelectedReservation(null)}
                  className="flex-1 px-4 py-3 bg-muted rounded-xl font-semibold"
                >
                  סגור
                </button>
                <button
                  onClick={() => handleDeleteReservation(selectedReservation.id)}
                  className="px-6 py-3 bg-destructive text-destructive-foreground rounded-xl font-semibold flex items-center gap-2"
                >
                  <Trash2 className="w-5 h-5" />
                  מחק
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Report Issue Modal */}
        {currentSpace && (
          <ActivitySpaceReportModal
            isOpen={showReportModal}
            onClose={() => setShowReportModal(false)}
            space={currentSpace}
            selectedStatus={reportStatus}
            onSubmit={handleReportSubmit}
          />
        )}
      </main>
    </div>
  );
};

export default Activities;
