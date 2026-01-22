import React, { useState, useMemo } from 'react';
import { useVillage } from '@/context/VillageContext';
import { BreadcrumbNav } from '@/components/BreadcrumbNav';
import { GroupSelector, ActiveGroup } from '@/components/GroupSelector';
import { ActivityReservation, ActivitySpace } from '@/types/village';
import { 
  Loader2, 
  CalendarDays, 
  Plus,
  Trash2,
  Clock,
  Users,
  X,
  AlertTriangle
} from 'lucide-react';
import { cn } from '@/lib/utils';

const Activities = () => {
  const { 
    state, 
    isLoading,
    addActivityReservation,
    removeActivityReservation
  } = useVillage();

  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedSpaceId, setSelectedSpaceId] = useState<string>('');
  const [formData, setFormData] = useState({
    startTime: '09:00',
    endTime: '10:00',
    groupName: '',
    notes: '',
  });
  const [error, setError] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  if (isLoading || !state) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  const activitySpaces = Object.values(state.activitySpaces);

  // Get reservations for selected date
  const dayReservations = useMemo(() => {
    return Object.values(state.activityReservations)
      .filter(r => r.date === selectedDate)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  }, [state.activityReservations, selectedDate]);

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
              <div key={space.id} className="tile">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-2xl font-bold">{space.name}</h3>
                    {space.description && (
                      <p className="text-muted-foreground">{space.description}</p>
                    )}
                  </div>
                  <span className="px-3 py-1 bg-muted rounded-full text-sm font-medium">
                    {reservations.length} booking{reservations.length !== 1 ? 's' : ''}
                  </span>
                </div>

                {reservations.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    No reservations for this date
                  </p>
                ) : (
                  <div className="space-y-3">
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
                                onClick={() => handleDeleteReservation(res.id)}
                                className="px-3 py-1 bg-destructive text-destructive-foreground rounded-lg text-sm font-medium"
                              >
                                Delete
                              </button>
                              <button
                                onClick={() => setDeleteConfirmId(null)}
                                className="px-3 py-1 bg-muted rounded-lg text-sm font-medium"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setDeleteConfirmId(res.id)}
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
              </div>
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

                  {/* Time */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-base font-semibold">Start Time</label>
                      <input
                        type="time"
                        value={formData.startTime}
                        onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                        className="w-full px-4 py-3 text-lg rounded-xl border-2 border-input bg-background focus:outline-none focus:border-primary"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-base font-semibold">End Time</label>
                      <input
                        type="time"
                        value={formData.endTime}
                        onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                        className="w-full px-4 py-3 text-lg rounded-xl border-2 border-input bg-background focus:outline-none focus:border-primary"
                      />
                    </div>
                  </div>

                  {/* Group Name */}
                  <div className="space-y-2">
                    <label className="text-base font-semibold">Nombre del Grupo</label>
                    <GroupSelector
                      date={selectedDate}
                      selectedGroup={formData.groupName}
                      onSelectGroup={(groupName) => setFormData({ ...formData, groupName })}
                      state={state}
                      placeholder="Seleccionar grupo..."
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
