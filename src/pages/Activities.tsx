import React, { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useVillage } from '@/context/VillageContext';
import { BreadcrumbNav } from '@/components/BreadcrumbNav';
import { ActivityReservation, ActivitySpace } from '@/types/village';
import { 
  Loader2, 
  CalendarDays, 
  Plus,
  Trash2,
  Clock,
  Users,
  X,
  AlertTriangle,
  Tent
} from 'lucide-react';
import { cn } from '@/lib/utils';

const Activities = () => {
  const [searchParams] = useSearchParams();
  const spaceIdFromUrl = searchParams.get('spaceId') ?? '';
  const { 
    state, 
    isLoading,
    addActivityReservation,
    removeActivityReservation
  } = useVillage();

  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedSpaceId, setSelectedSpaceId] = useState<string>(spaceIdFromUrl);
  const [formData, setFormData] = useState({
    startTime: '09:00',
    endTime: '10:00',
    groupName: '',
    notes: '',
  });
  const [error, setError] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Get active groups: groups with reservations that include the selected date
  const activeGroups = useMemo(() => {
    if (!state) return [];
    
    const groups = new Map<string, { name: string; neighborhoodId?: string; tentIds?: string[] }>();
    const today = selectedDate;

    // From neighborhood reservations
    Object.values(state.neighborhoodReservations).forEach((res) => {
      if (res.checkInDate <= today && res.checkOutDate >= today) {
        if (!groups.has(res.groupName)) {
          groups.set(res.groupName, { 
            name: res.groupName, 
            neighborhoodId: res.neighborhoodId,
            tentIds: res.tentIds 
          });
        }
      }
    });

    // From individual tent reservations (tents with group name and active dates)
    Object.values(state.tents).forEach((tent) => {
      if (tent.groupName && tent.checkInDate && tent.checkOutDate) {
        if (tent.checkInDate <= today && tent.checkOutDate >= today) {
          if (!groups.has(tent.groupName)) {
            groups.set(tent.groupName, { name: tent.groupName });
          }
        }
      }
    });

    return Array.from(groups.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [state, selectedDate]);

  // Get reservations for selected date
  const dayReservations = useMemo(() => {
    if (!state) return [];
    return Object.values(state.activityReservations)
      .filter(r => r.date === selectedDate)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  }, [state, selectedDate]);

  if (isLoading || !state) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  const activitySpaces = Object.values(state.activitySpaces);

  const getSpaceReservations = (spaceId: string) => {
    return dayReservations.filter(r => r.spaceId === spaceId);
  };

  const handleAddReservation = () => {
    setError('');

    if (!selectedSpaceId) {
      setError('Please select a space');
      return;
    }
    if (!formData.groupName.trim()) {
      setError('Please enter a group name');
      return;
    }
    if (formData.startTime >= formData.endTime) {
      setError('End time must be after start time');
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
      setSelectedSpaceId('');
    } else {
      setError('This time slot overlaps with an existing reservation');
    }
  };

  const handleDeleteReservation = (id: string) => {
    removeActivityReservation(id);
    setDeleteConfirmId(null);
  };

  const getSpaceName = (spaceId: string) => {
    return state.activitySpaces[spaceId]?.name || 'Unknown';
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b-2 border-border">
        <div className="container py-6">
          <BreadcrumbNav items={[{ label: 'Activities' }]} />
          <h1 className="text-3xl md:text-4xl font-bold flex items-center gap-3">
            <CalendarDays className="w-10 h-10" />
            Activity Spaces
          </h1>
          <p className="text-muted-foreground text-lg mt-2">
            Reserve spaces for activities and events
          </p>
        </div>
      </header>

      <main className="container py-6 space-y-8">
        {/* Date Selector */}
        <div className="flex flex-wrap items-center gap-4">
          <label className="text-lg font-semibold">Select Date:</label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-4 py-3 text-lg rounded-xl border-2 border-input bg-background focus:outline-none focus:border-primary"
          />
          <button
            onClick={() => setShowAddForm(true)}
            className="ml-auto px-6 py-3 bg-primary text-primary-foreground rounded-xl font-bold text-lg hover:bg-primary/90 flex items-center gap-2"
          >
            <Plus className="w-6 h-6" />
            Add Reservation
          </button>
        </div>

        {/* Spaces Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {activitySpaces.map((space) => {
            const reservations = getSpaceReservations(space.id);
            
            return (
              <button
                key={space.id}
                type="button"
                onClick={() => {
                  setSelectedSpaceId(space.id);
                  setShowAddForm(true);
                }}
                className="tile text-left hover:shadow-lg hover:border-primary/30 transition-all group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-2xl font-bold group-hover:text-primary transition-colors">{space.name}</h3>
                    {space.description && (
                      <p className="text-muted-foreground">{space.description}</p>
                    )}
                  </div>
                  <span className="px-3 py-1 bg-muted rounded-full text-sm font-medium">
                    {reservations.length} booking{reservations.length !== 1 ? 's' : ''}
                  </span>
                </div>

                {reservations.length === 0 ? (
                  <div className="text-center py-6">
                    <Plus className="w-8 h-8 mx-auto text-muted-foreground/50 group-hover:text-primary transition-colors" />
                    <p className="text-muted-foreground mt-2">Click to add reservation</p>
                  </div>
                ) : (
                  <div className="space-y-3" onClick={(e) => e.stopPropagation()}>
                    {reservations.map((res) => (
                      <div 
                        key={res.id}
                        className="p-4 bg-muted/50 rounded-xl"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-2 text-lg font-semibold">
                              <Clock className="w-5 h-5 text-muted-foreground" />
                              {res.startTime} - {res.endTime}
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              <Users className="w-4 h-4 text-muted-foreground" />
                              <span className="font-medium">{res.groupName}</span>
                            </div>
                            {res.notes && (
                              <p className="text-sm text-muted-foreground mt-2">{res.notes}</p>
                            )}
                          </div>
                          
                          {deleteConfirmId === res.id ? (
                            <div className="flex gap-2">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteReservation(res.id);
                                }}
                                className="px-3 py-1 bg-destructive text-destructive-foreground rounded-lg text-sm font-medium"
                              >
                                Delete
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setDeleteConfirmId(null);
                                }}
                                className="px-3 py-1 bg-muted rounded-lg text-sm font-medium"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setDeleteConfirmId(res.id);
                              }}
                              className="p-2 hover:bg-destructive/20 rounded-lg text-muted-foreground hover:text-destructive"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Add Reservation Modal */}
        {showAddForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-background rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl animate-slide-up">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold">New Reservation</h2>
                  <button
                    onClick={() => {
                      setShowAddForm(false);
                      setError('');
                    }}
                    className="p-2 hover:bg-muted rounded-xl"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                {error && (
                  <div className="mb-4 p-4 bg-destructive/10 border-2 border-destructive rounded-xl flex items-center gap-3">
                    <AlertTriangle className="w-5 h-5 text-destructive" />
                    <span className="font-medium">{error}</span>
                  </div>
                )}

                <div className="space-y-4">
                  {/* Space Selection */}
                  <div className="space-y-2">
                    <label className="text-base font-semibold">Space</label>
                    <select
                      value={selectedSpaceId}
                      onChange={(e) => setSelectedSpaceId(e.target.value)}
                      className="w-full px-4 py-3 text-lg rounded-xl border-2 border-input bg-background focus:outline-none focus:border-primary"
                    >
                      <option value="">Select a space...</option>
                      {activitySpaces.map((space) => (
                        <option key={space.id} value={space.id}>
                          {space.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Date */}
                  <div className="space-y-2">
                    <label className="text-base font-semibold">Date</label>
                    <input
                      type="date"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      className="w-full px-4 py-3 text-lg rounded-xl border-2 border-input bg-background focus:outline-none focus:border-primary"
                    />
                  </div>

                  {/* Time - Modern Visual Selector */}
                  <div className="space-y-3">
                    <label className="text-base font-semibold flex items-center gap-2">
                      <Clock className="w-5 h-5 text-muted-foreground" />
                      Horario
                    </label>
                    
                    {/* Quick time blocks */}
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { label: 'Mañana', start: '08:00', end: '12:00', icon: '🌅' },
                        { label: 'Tarde', start: '12:00', end: '17:00', icon: '☀️' },
                        { label: 'Noche', start: '17:00', end: '21:00', icon: '🌙' },
                      ].map((block) => (
                        <button
                          key={block.label}
                          type="button"
                          onClick={() => setFormData({ 
                            ...formData, 
                            startTime: block.start, 
                            endTime: block.end 
                          })}
                          className={cn(
                            "p-3 rounded-xl border-2 transition-all text-center",
                            formData.startTime === block.start && formData.endTime === block.end
                              ? "bg-primary text-primary-foreground border-primary"
                              : "bg-muted/30 hover:bg-muted border-transparent"
                          )}
                        >
                          <span className="text-2xl">{block.icon}</span>
                          <p className="font-semibold text-sm mt-1">{block.label}</p>
                          <p className="text-xs opacity-70">{block.start}-{block.end}</p>
                        </button>
                      ))}
                    </div>

                    {/* Hour picker for custom times */}
                    <div className="bg-muted/30 rounded-xl p-4 space-y-3">
                      <p className="text-sm text-muted-foreground font-medium">O selecciona hora exacta:</p>
                      
                      <div className="flex items-center gap-3">
                        <div className="flex-1">
                          <label className="text-xs text-muted-foreground mb-1 block">Inicio</label>
                          <div className="flex gap-1">
                            {['07:00', '08:00', '09:00', '10:00', '11:00', '12:00'].map((time) => (
                              <button
                                key={`start-${time}`}
                                type="button"
                                onClick={() => setFormData({ ...formData, startTime: time })}
                                className={cn(
                                  "flex-1 py-2 text-xs font-medium rounded-lg transition-all",
                                  formData.startTime === time
                                    ? "bg-primary text-primary-foreground"
                                    : "bg-background hover:bg-muted"
                                )}
                              >
                                {time.split(':')[0]}
                              </button>
                            ))}
                          </div>
                          <div className="flex gap-1 mt-1">
                            {['13:00', '14:00', '15:00', '16:00', '17:00', '18:00'].map((time) => (
                              <button
                                key={`start-${time}`}
                                type="button"
                                onClick={() => setFormData({ ...formData, startTime: time })}
                                className={cn(
                                  "flex-1 py-2 text-xs font-medium rounded-lg transition-all",
                                  formData.startTime === time
                                    ? "bg-primary text-primary-foreground"
                                    : "bg-background hover:bg-muted"
                                )}
                              >
                                {time.split(':')[0]}
                              </button>
                            ))}
                          </div>
                        </div>
                        
                        <span className="text-2xl text-muted-foreground">→</span>
                        
                        <div className="flex-1">
                          <label className="text-xs text-muted-foreground mb-1 block">Fin</label>
                          <div className="flex gap-1">
                            {['08:00', '09:00', '10:00', '11:00', '12:00', '13:00'].map((time) => (
                              <button
                                key={`end-${time}`}
                                type="button"
                                onClick={() => setFormData({ ...formData, endTime: time })}
                                className={cn(
                                  "flex-1 py-2 text-xs font-medium rounded-lg transition-all",
                                  formData.endTime === time
                                    ? "bg-primary text-primary-foreground"
                                    : "bg-background hover:bg-muted"
                                )}
                              >
                                {time.split(':')[0]}
                              </button>
                            ))}
                          </div>
                          <div className="flex gap-1 mt-1">
                            {['14:00', '15:00', '16:00', '17:00', '18:00', '21:00'].map((time) => (
                              <button
                                key={`end-${time}`}
                                type="button"
                                onClick={() => setFormData({ ...formData, endTime: time })}
                                className={cn(
                                  "flex-1 py-2 text-xs font-medium rounded-lg transition-all",
                                  formData.endTime === time
                                    ? "bg-primary text-primary-foreground"
                                    : "bg-background hover:bg-muted"
                                )}
                              >
                                {time.split(':')[0]}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                      
                      {/* Display selected time range */}
                      <div className="text-center pt-2 border-t border-border">
                        <span className="text-lg font-bold text-primary">
                          {formData.startTime} - {formData.endTime}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Group Name - Intelligent Selector */}
                  <div className="space-y-2">
                    <label className="text-base font-semibold">Nombre del Grupo</label>
                    
                    {/* Active groups quick-select */}
                    {activeGroups.length > 0 && (
                      <div className="mb-3">
                        <p className="text-sm text-muted-foreground mb-2 flex items-center gap-2">
                          <Tent className="w-4 h-4" />
                          Grupos hospedados actualmente:
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {activeGroups.map((group) => (
                            <button
                              key={group.name}
                              type="button"
                              onClick={() => setFormData({ ...formData, groupName: group.name })}
                              className={cn(
                                "px-3 py-2 rounded-lg text-sm font-medium border-2 transition-all",
                                formData.groupName === group.name
                                  ? "bg-primary text-primary-foreground border-primary"
                                  : "bg-muted/50 hover:bg-muted border-transparent"
                              )}
                            >
                              {group.name}
                              {group.neighborhoodId && (
                                <span className="ml-1 text-xs opacity-70">
                                  ({group.neighborhoodId})
                                </span>
                              )}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Custom input */}
                    <input
                      type="text"
                      value={formData.groupName}
                      onChange={(e) => setFormData({ ...formData, groupName: e.target.value })}
                      placeholder={activeGroups.length > 0 ? "O ingresa un nombre personalizado..." : "Nombre del grupo..."}
                      className="w-full px-4 py-3 text-lg rounded-xl border-2 border-input bg-background focus:outline-none focus:border-primary"
                    />
                  </div>

                  {/* Notes */}
                  <div className="space-y-2">
                    <label className="text-base font-semibold">Notes (optional)</label>
                    <textarea
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      placeholder="Additional notes..."
                      className="w-full px-4 py-3 text-lg rounded-xl border-2 border-input bg-background resize-none focus:outline-none focus:border-primary"
                      rows={2}
                    />
                  </div>
                </div>

                <div className="flex gap-4 mt-6">
                  <button
                    onClick={() => {
                      setShowAddForm(false);
                      setError('');
                    }}
                    className="flex-1 px-6 py-4 bg-muted text-foreground rounded-xl font-bold text-lg hover:bg-muted/80"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddReservation}
                    className="flex-1 px-6 py-4 bg-primary text-primary-foreground rounded-xl font-bold text-lg hover:bg-primary/90"
                  >
                    Add Reservation
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Activities;
