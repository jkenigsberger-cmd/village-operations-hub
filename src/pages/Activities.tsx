import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useVillage } from '@/context/VillageContext';
import { BreadcrumbNav } from '@/components/BreadcrumbNav';
import { CleaningStatus, WorkingStatus } from '@/types/village';
import { 
  Loader2, 
  CalendarDays, 
  Plus,
  Trash2,
  Clock,
  Users,
  X,
  AlertTriangle,
  Tent,
  Sparkles,
  Wrench,
  CheckCircle,
  Ban
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Generate consistent color for group names
const getGroupColor = (groupName: string): string => {
  let hash = 0;
  for (let i = 0; i < groupName.length; i++) {
    hash = groupName.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash % 360);
  return `hsl(${hue}, 70%, 45%)`;
};

const Activities = () => {
  const [searchParams] = useSearchParams();
  const spaceIdFromUrl = searchParams.get('spaceId') ?? '';
  const { 
    state, 
    isLoading,
    addActivityReservation,
    removeActivityReservation,
    updateActivitySpaceStatus,
    updateActivitySpaceNotes
  } = useVillage();

  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedSpaceId, setSelectedSpaceId] = useState<string>(spaceIdFromUrl);
  const [selectedSpace, setSelectedSpace] = useState<string | null>(null);
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
      setError('Selecciona un espacio');
      return;
    }
    if (!formData.groupName.trim()) {
      setError('Ingresa el nombre del grupo');
      return;
    }
    if (formData.startTime >= formData.endTime) {
      setError('La hora de fin debe ser después del inicio');
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
      setError('Este horario se cruza con una reserva existente');
    }
  };

  const handleDeleteReservation = (id: string) => {
    removeActivityReservation(id);
    setDeleteConfirmId(null);
  };

  const handleStatusChange = (spaceId: string, type: 'cleaning' | 'working', value: string) => {
    if (type === 'cleaning') {
      updateActivitySpaceStatus(spaceId, value as CleaningStatus, undefined);
    } else {
      updateActivitySpaceStatus(spaceId, undefined, value as WorkingStatus);
    }
  };

  const getStatusIcon = (space: typeof activitySpaces[0]) => {
    if (space.workingStatus === 'BROKEN') return <Wrench className="w-5 h-5 text-destructive" />;
    if (space.workingStatus === 'MAINTENANCE') return <Wrench className="w-5 h-5 text-yellow-600" />;
    if (space.workingStatus === 'CLOSED') return <Ban className="w-5 h-5 text-muted-foreground" />;
    if (space.cleaningStatus === 'NEEDS_CLEANING') return <Sparkles className="w-5 h-5 text-yellow-600" />;
    if (space.cleaningStatus === 'CLEANING_IN_PROGRESS') return <Sparkles className="w-5 h-5 text-blue-500" />;
    return <CheckCircle className="w-5 h-5 text-green-600" />;
  };

  const getStatusBg = (space: typeof activitySpaces[0]) => {
    if (space.workingStatus === 'BROKEN') return 'bg-destructive/10 border-destructive/30';
    if (space.workingStatus === 'MAINTENANCE') return 'bg-yellow-500/10 border-yellow-500/30';
    if (space.workingStatus === 'CLOSED') return 'bg-muted border-muted-foreground/30';
    if (space.cleaningStatus === 'NEEDS_CLEANING') return 'bg-yellow-500/10 border-yellow-500/30';
    return '';
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b-2 border-border">
        <div className="container py-6">
          <BreadcrumbNav items={[{ label: 'Common Facilities' }]} />
          <h1 className="text-3xl md:text-4xl font-bold flex items-center gap-3">
            <CalendarDays className="w-10 h-10" />
            Common Facilities
          </h1>
          <p className="text-muted-foreground text-lg mt-2">
            Gestiona reservas, limpieza y mantenimiento
          </p>
        </div>
      </header>

      <main className="container py-6 space-y-6">
        {/* Date Selector */}
        <div className="flex flex-wrap items-center gap-4">
          <label className="text-lg font-semibold">Fecha:</label>
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
            Nueva Reserva
          </button>
        </div>

        {/* Active Groups Legend */}
        {activeGroups.length > 0 && (
          <div className="p-4 bg-muted/30 rounded-xl">
            <p className="text-sm font-semibold text-muted-foreground mb-2 flex items-center gap-2">
              <Tent className="w-4 h-4" />
              Grupos hospedados hoy:
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

        {/* Spaces List */}
        <div className="space-y-4">
          {activitySpaces.map((space) => {
            const reservations = getSpaceReservations(space.id);
            const isExpanded = selectedSpace === space.id;
            
            return (
              <div 
                key={space.id} 
                className={cn("tile overflow-hidden", getStatusBg(space))}
              >
                {/* Space Header */}
                <button
                  type="button"
                  onClick={() => setSelectedSpace(isExpanded ? null : space.id)}
                  className="w-full p-4 flex items-center justify-between text-left hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    {getStatusIcon(space)}
                    <div>
                      <h3 className="text-xl font-bold">{space.name}</h3>
                      {space.description && (
                        <p className="text-sm text-muted-foreground">{space.description}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {reservations.length > 0 && (
                      <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-semibold">
                        {reservations.length} reserva{reservations.length !== 1 ? 's' : ''}
                      </span>
                    )}
                    <Plus 
                      className={cn(
                        "w-6 h-6 transition-transform",
                        isExpanded && "rotate-45"
                      )} 
                    />
                  </div>
                </button>

                {/* Expanded Content */}
                {isExpanded && (
                  <div className="border-t border-border">
                    {/* Status Controls */}
                    <div className="p-4 bg-muted/20 border-b border-border">
                      <div className="flex flex-wrap gap-4">
                        {/* Cleaning Status */}
                        <div className="flex items-center gap-2">
                          <Sparkles className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm font-medium">Limpieza:</span>
                          <div className="flex gap-1">
                            {[
                              { value: 'CLEAN', label: '✓ Limpio', color: 'bg-green-500' },
                              { value: 'NEEDS_CLEANING', label: '🧹 Necesita', color: 'bg-yellow-500' },
                              { value: 'CLEANING_IN_PROGRESS', label: '⏳ En proceso', color: 'bg-blue-500' },
                            ].map((status) => (
                              <button
                                key={status.value}
                                onClick={() => handleStatusChange(space.id, 'cleaning', status.value)}
                                className={cn(
                                  "px-2 py-1 text-xs rounded-lg font-medium transition-all",
                                  space.cleaningStatus === status.value
                                    ? `${status.color} text-white`
                                    : "bg-muted hover:bg-muted/80"
                                )}
                              >
                                {status.label}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Working Status */}
                        <div className="flex items-center gap-2">
                          <Wrench className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm font-medium">Estado:</span>
                          <div className="flex gap-1">
                            {[
                              { value: 'WORKING', label: '✓ OK', color: 'bg-green-500' },
                              { value: 'MAINTENANCE', label: '⚠️ Mant.', color: 'bg-yellow-500' },
                              { value: 'BROKEN', label: '🔧 Roto', color: 'bg-destructive' },
                              { value: 'CLOSED', label: '🚫 Cerrado', color: 'bg-muted-foreground' },
                            ].map((status) => (
                              <button
                                key={status.value}
                                onClick={() => handleStatusChange(space.id, 'working', status.value)}
                                className={cn(
                                  "px-2 py-1 text-xs rounded-lg font-medium transition-all",
                                  space.workingStatus === status.value
                                    ? `${status.color} text-white`
                                    : "bg-muted hover:bg-muted/80"
                                )}
                              >
                                {status.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Notes */}
                      <div className="mt-3">
                        <input
                          type="text"
                          placeholder="Notas del espacio..."
                          value={space.notes || ''}
                          onChange={(e) => updateActivitySpaceNotes(space.id, e.target.value)}
                          className="w-full px-3 py-2 text-sm rounded-lg border border-input bg-background"
                        />
                      </div>
                    </div>

                    {/* Reservations Timeline */}
                    <div className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-semibold flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          Reservas del día
                        </h4>
                        <button
                          onClick={() => {
                            setSelectedSpaceId(space.id);
                            setShowAddForm(true);
                          }}
                          className="px-3 py-1 bg-primary text-primary-foreground rounded-lg text-sm font-medium flex items-center gap-1"
                        >
                          <Plus className="w-4 h-4" />
                          Agregar
                        </button>
                      </div>

                      {reservations.length === 0 ? (
                        <p className="text-muted-foreground text-center py-4">
                          Sin reservas para esta fecha
                        </p>
                      ) : (
                        <div className="space-y-2">
                          {reservations.map((res) => {
                            const groupColor = getGroupColor(res.groupName);
                            return (
                              <div 
                                key={res.id}
                                className="flex items-center gap-3 p-3 rounded-xl"
                                style={{ 
                                  backgroundColor: `${groupColor}15`,
                                  borderLeft: `4px solid ${groupColor}`
                                }}
                              >
                                <div 
                                  className="w-3 h-3 rounded-full flex-shrink-0"
                                  style={{ backgroundColor: groupColor }}
                                />
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span className="font-bold text-lg">
                                      {res.startTime} - {res.endTime}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Users className="w-4 h-4 text-muted-foreground" />
                                    <span 
                                      className="font-semibold"
                                      style={{ color: groupColor }}
                                    >
                                      {res.groupName}
                                    </span>
                                  </div>
                                  {res.notes && (
                                    <p className="text-sm text-muted-foreground mt-1">
                                      📝 {res.notes}
                                    </p>
                                  )}
                                </div>
                                
                                {deleteConfirmId === res.id ? (
                                  <div className="flex gap-2 flex-shrink-0">
                                    <button
                                      onClick={() => handleDeleteReservation(res.id)}
                                      className="px-3 py-1 bg-destructive text-destructive-foreground rounded-lg text-sm font-medium"
                                    >
                                      Eliminar
                                    </button>
                                    <button
                                      onClick={() => setDeleteConfirmId(null)}
                                      className="px-3 py-1 bg-muted rounded-lg text-sm font-medium"
                                    >
                                      No
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => setDeleteConfirmId(res.id)}
                                    className="p-2 hover:bg-destructive/20 rounded-lg text-muted-foreground hover:text-destructive flex-shrink-0"
                                  >
                                    <Trash2 className="w-5 h-5" />
                                  </button>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
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
                  <h2 className="text-2xl font-bold">Nueva Reserva</h2>
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
                    <label className="text-base font-semibold">Espacio</label>
                    <select
                      value={selectedSpaceId}
                      onChange={(e) => setSelectedSpaceId(e.target.value)}
                      className="w-full px-4 py-3 text-lg rounded-xl border-2 border-input bg-background focus:outline-none focus:border-primary"
                    >
                      <option value="">Selecciona un espacio...</option>
                      {activitySpaces.map((space) => (
                        <option key={space.id} value={space.id}>
                          {space.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Date */}
                  <div className="space-y-2">
                    <label className="text-base font-semibold">Fecha</label>
                    <input
                      type="date"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      className="w-full px-4 py-3 text-lg rounded-xl border-2 border-input bg-background focus:outline-none focus:border-primary"
                    />
                  </div>

                  {/* Time - Simple inputs */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-base font-semibold">Hora Inicio</label>
                      <input
                        type="time"
                        value={formData.startTime}
                        onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                        className="w-full px-4 py-3 text-lg rounded-xl border-2 border-input bg-background focus:outline-none focus:border-primary"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-base font-semibold">Hora Fin</label>
                      <input
                        type="time"
                        value={formData.endTime}
                        onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                        className="w-full px-4 py-3 text-lg rounded-xl border-2 border-input bg-background focus:outline-none focus:border-primary"
                      />
                    </div>
                  </div>

                  {/* Group Name - with active groups */}
                  <div className="space-y-2">
                    <label className="text-base font-semibold">Nombre del Grupo</label>
                    
                    {activeGroups.length > 0 && (
                      <div className="mb-3">
                        <p className="text-sm text-muted-foreground mb-2">
                          Grupos hospedados:
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {activeGroups.map((group) => (
                            <button
                              key={group.name}
                              type="button"
                              onClick={() => setFormData({ ...formData, groupName: group.name })}
                              className={cn(
                                "px-3 py-2 rounded-lg text-sm font-medium transition-all border-2",
                                formData.groupName === group.name
                                  ? "text-white border-transparent"
                                  : "bg-muted/50 hover:bg-muted border-transparent"
                              )}
                              style={formData.groupName === group.name ? { backgroundColor: group.color } : {}}
                            >
                              {group.name}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    <input
                      type="text"
                      value={formData.groupName}
                      onChange={(e) => setFormData({ ...formData, groupName: e.target.value })}
                      placeholder="Nombre del grupo..."
                      className="w-full px-4 py-3 text-lg rounded-xl border-2 border-input bg-background focus:outline-none focus:border-primary"
                    />
                  </div>

                  {/* Notes */}
                  <div className="space-y-2">
                    <label className="text-base font-semibold">Notas (opcional)</label>
                    <textarea
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      placeholder="Notas adicionales..."
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
                    Cancelar
                  </button>
                  <button
                    onClick={handleAddReservation}
                    className="flex-1 px-6 py-4 bg-primary text-primary-foreground rounded-xl font-bold text-lg hover:bg-primary/90"
                  >
                    Guardar
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