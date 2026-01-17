import React, { useState, useMemo } from 'react';
import { useVillage } from '@/context/VillageContext';
import { NeighborhoodId, NeighborhoodReservation } from '@/types/village';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { 
  CalendarIcon, 
  CheckCircle, 
  AlertTriangle, 
  Users, 
  Phone, 
  User, 
  Clock,
  StickyNote,
  Tent
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface ReservationFormProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  preselectedNeighborhood?: NeighborhoodId;
}

const neighborhoodOrder: NeighborhoodId[] = ['N1', 'N2', 'N3', 'N4', 'N5', 'N6', 'N7', 'VIP'];

export const ReservationForm: React.FC<ReservationFormProps> = ({
  open,
  onClose,
  onSuccess,
  preselectedNeighborhood
}) => {
  const { 
    state, 
    reserveNeighborhood, 
    checkNeighborhoodAvailability,
    getNeighborhoodReservations 
  } = useVillage();

  // Form state
  const [reservationType, setReservationType] = useState<'full' | 'partial'>('full');
  const [selectedNeighborhood, setSelectedNeighborhood] = useState<NeighborhoodId | ''>(preselectedNeighborhood || '');
  const [groupName, setGroupName] = useState('');
  const [checkInDate, setCheckInDate] = useState<Date | undefined>();
  const [checkOutDate, setCheckOutDate] = useState<Date | undefined>();
  const [selectedTents, setSelectedTents] = useState<string[]>([]);
  
  // Optional fields toggles
  const [showPeople, setShowPeople] = useState(false);
  const [showContact, setShowContact] = useState(false);
  const [showPhone, setShowPhone] = useState(false);
  const [showArrivalTime, setShowArrivalTime] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  
  // Optional field values
  const [numberOfPeople, setNumberOfPeople] = useState('');
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [arrivalTime, setArrivalTime] = useState('');
  const [specialNotes, setSpecialNotes] = useState('');

  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Check availability when dates change
  const availability = useMemo(() => {
    if (!selectedNeighborhood || !checkInDate || !checkOutDate) {
      return { available: true };
    }
    return checkNeighborhoodAvailability(
      selectedNeighborhood,
      format(checkInDate, 'yyyy-MM-dd'),
      format(checkOutDate, 'yyyy-MM-dd')
    );
  }, [selectedNeighborhood, checkInDate, checkOutDate, checkNeighborhoodAvailability]);

  // Get tents for selected neighborhood
  const neighborhoodTents = useMemo(() => {
    if (!state || !selectedNeighborhood) return [];
    const neighborhood = state.neighborhoods[selectedNeighborhood];
    if (!neighborhood) return [];
    return neighborhood.tentIds.map(id => state.tents[id]).filter(Boolean);
  }, [state, selectedNeighborhood]);

  // Calculate total beds
  const totalBeds = useMemo(() => {
    if (reservationType === 'full') {
      return neighborhoodTents.reduce((acc, tent) => acc + tent.beds.length, 0);
    }
    return selectedTents.reduce((acc, tentId) => {
      const tent = state?.tents[tentId];
      return acc + (tent?.beds.length || 0);
    }, 0);
  }, [reservationType, neighborhoodTents, selectedTents, state]);

  const handleSubmit = () => {
    setError(null);

    // Validation
    if (!selectedNeighborhood) {
      setError('Please select a neighborhood');
      return;
    }
    if (!groupName.trim()) {
      setError('Please enter a group name');
      return;
    }
    if (!checkInDate || !checkOutDate) {
      setError('Please select check-in and check-out dates');
      return;
    }
    if (checkInDate >= checkOutDate) {
      setError('Check-out date must be after check-in date');
      return;
    }
    if (reservationType === 'partial' && selectedTents.length === 0) {
      setError('Please select at least one tent');
      return;
    }

    setIsSubmitting(true);

    const reservation: Omit<NeighborhoodReservation, 'id' | 'createdAt'> = {
      neighborhoodId: selectedNeighborhood,
      groupName: groupName.trim(),
      checkInDate: format(checkInDate, 'yyyy-MM-dd'),
      checkOutDate: format(checkOutDate, 'yyyy-MM-dd'),
      isPartialReservation: reservationType === 'partial',
      tentIds: reservationType === 'partial' ? selectedTents : undefined,
      numberOfPeople: showPeople && numberOfPeople ? parseInt(numberOfPeople) : undefined,
      contactName: showContact && contactName ? contactName.trim() : undefined,
      contactPhone: showPhone && contactPhone ? contactPhone.trim() : undefined,
      arrivalTime: showArrivalTime && arrivalTime ? arrivalTime : undefined,
      specialNotes: showNotes && specialNotes ? specialNotes.trim() : undefined
    };

    const result = reserveNeighborhood(reservation);
    
    setIsSubmitting(false);

    if (result.success) {
      // Reset form
      setGroupName('');
      setCheckInDate(undefined);
      setCheckOutDate(undefined);
      setSelectedTents([]);
      setShowPeople(false);
      setShowContact(false);
      setShowPhone(false);
      setShowArrivalTime(false);
      setShowNotes(false);
      setNumberOfPeople('');
      setContactName('');
      setContactPhone('');
      setArrivalTime('');
      setSpecialNotes('');
      
      onSuccess?.();
      onClose();
    } else {
      setError(result.error || 'Failed to create reservation');
    }
  };

  const toggleTent = (tentId: string) => {
    setSelectedTents(prev => 
      prev.includes(tentId) 
        ? prev.filter(id => id !== tentId)
        : [...prev, tentId]
    );
  };

  if (!state) return null;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2">
            <CalendarIcon className="w-6 h-6" />
            New Reservation
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Reservation Type */}
          <div className="space-y-2">
            <Label className="text-base font-semibold">Reservation Type</Label>
            <div className="flex gap-4">
              <Button
                type="button"
                variant={reservationType === 'full' ? 'default' : 'outline'}
                onClick={() => setReservationType('full')}
                className="flex-1"
              >
                Full Neighborhood
              </Button>
              <Button
                type="button"
                variant={reservationType === 'partial' ? 'default' : 'outline'}
                onClick={() => setReservationType('partial')}
                className="flex-1"
              >
                Specific Tents
              </Button>
            </div>
          </div>

          {/* Neighborhood Selection */}
          <div className="space-y-2">
            <Label className="text-base font-semibold">Select Neighborhood</Label>
            <Select 
              value={selectedNeighborhood} 
              onValueChange={(v) => setSelectedNeighborhood(v as NeighborhoodId)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Choose a neighborhood" />
              </SelectTrigger>
              <SelectContent>
                {neighborhoodOrder.map((id) => {
                  const neighborhood = state.neighborhoods[id];
                  if (!neighborhood) return null;
                  return (
                    <SelectItem key={id} value={id}>
                      {neighborhood.displayName}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          {/* Availability Status */}
          {selectedNeighborhood && checkInDate && checkOutDate && (
            <div className={`p-3 rounded-lg flex items-center gap-2 ${
              availability.available 
                ? 'bg-green-50 text-green-700 border border-green-200' 
                : 'bg-destructive/10 text-destructive border border-destructive/20'
            }`}>
              {availability.available ? (
                <>
                  <CheckCircle className="w-5 h-5" />
                  <span className="font-semibold">Available for these dates</span>
                </>
              ) : (
                <>
                  <AlertTriangle className="w-5 h-5" />
                  <span className="font-semibold">
                    Conflict: {availability.conflictingReservation?.groupName} 
                    ({availability.conflictingReservation?.checkInDate} - {availability.conflictingReservation?.checkOutDate})
                  </span>
                </>
              )}
            </div>
          )}

          {/* Tent Selection (for partial reservations) */}
          {reservationType === 'partial' && selectedNeighborhood && (
            <div className="space-y-2">
              <Label className="text-base font-semibold">Select Tents</Label>
              <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto border rounded-lg p-3">
                {neighborhoodTents.map((tent) => {
                  const isSelected = selectedTents.includes(tent.id);
                  const hasReservation = tent.beds.some(b => b.status === 'RESERVED' || b.status === 'OCCUPIED');
                  
                  return (
                    <div
                      key={tent.id}
                      onClick={() => !hasReservation && toggleTent(tent.id)}
                      className={cn(
                        "p-3 rounded-lg border cursor-pointer transition-all",
                        isSelected && "border-primary bg-primary/5",
                        hasReservation && "opacity-50 cursor-not-allowed bg-muted",
                        !isSelected && !hasReservation && "hover:border-primary/50"
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <Checkbox checked={isSelected} disabled={hasReservation} />
                        <div>
                          <div className="font-semibold">{tent.code}</div>
                          <div className="text-xs text-muted-foreground">
                            {tent.beds.length} beds
                          </div>
                        </div>
                      </div>
                      {hasReservation && (
                        <div className="text-xs text-destructive mt-1">🔒 Occupied</div>
                      )}
                    </div>
                  );
                })}
              </div>
              <p className="text-sm text-muted-foreground">
                Selected: {selectedTents.length} tents, {totalBeds} beds
              </p>
            </div>
          )}

          {/* Basic Info */}
          <div className="space-y-4 pt-2 border-t">
            <h3 className="font-semibold text-muted-foreground">BASIC INFORMATION (Required)</h3>
            
            <div className="space-y-2">
              <Label htmlFor="groupName">Group Name</Label>
              <Input
                id="groupName"
                placeholder="e.g., School Group San José"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Check-in Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !checkInDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {checkInDate ? format(checkInDate, "PPP") : "Select date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={checkInDate}
                      onSelect={setCheckInDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label>Check-out Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !checkOutDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {checkOutDate ? format(checkOutDate, "PPP") : "Select date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={checkOutDate}
                      onSelect={setCheckOutDate}
                      disabled={(date) => checkInDate ? date <= checkInDate : false}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>

          {/* Optional Fields */}
          <div className="space-y-4 pt-2 border-t">
            <h3 className="font-semibold text-muted-foreground">ADDITIONAL INFORMATION (Optional)</h3>
            
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant={showPeople ? 'secondary' : 'outline'}
                size="sm"
                onClick={() => setShowPeople(!showPeople)}
              >
                <Users className="w-4 h-4 mr-1" />
                Number of people
              </Button>
              <Button
                type="button"
                variant={showContact ? 'secondary' : 'outline'}
                size="sm"
                onClick={() => setShowContact(!showContact)}
              >
                <User className="w-4 h-4 mr-1" />
                Contact person
              </Button>
              <Button
                type="button"
                variant={showPhone ? 'secondary' : 'outline'}
                size="sm"
                onClick={() => setShowPhone(!showPhone)}
              >
                <Phone className="w-4 h-4 mr-1" />
                Phone
              </Button>
              <Button
                type="button"
                variant={showArrivalTime ? 'secondary' : 'outline'}
                size="sm"
                onClick={() => setShowArrivalTime(!showArrivalTime)}
              >
                <Clock className="w-4 h-4 mr-1" />
                Arrival time
              </Button>
              <Button
                type="button"
                variant={showNotes ? 'secondary' : 'outline'}
                size="sm"
                onClick={() => setShowNotes(!showNotes)}
              >
                <StickyNote className="w-4 h-4 mr-1" />
                Special notes
              </Button>
            </div>

            <div className="space-y-3">
              {showPeople && (
                <div className="space-y-1">
                  <Label htmlFor="numberOfPeople">Number of People</Label>
                  <Input
                    id="numberOfPeople"
                    type="number"
                    placeholder="e.g., 32"
                    value={numberOfPeople}
                    onChange={(e) => setNumberOfPeople(e.target.value)}
                  />
                </div>
              )}
              {showContact && (
                <div className="space-y-1">
                  <Label htmlFor="contactName">Contact Person</Label>
                  <Input
                    id="contactName"
                    placeholder="e.g., Juan Pérez"
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                  />
                </div>
              )}
              {showPhone && (
                <div className="space-y-1">
                  <Label htmlFor="contactPhone">Phone Number</Label>
                  <Input
                    id="contactPhone"
                    type="tel"
                    placeholder="e.g., +1 234 567 8900"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                  />
                </div>
              )}
              {showArrivalTime && (
                <div className="space-y-1">
                  <Label htmlFor="arrivalTime">Expected Arrival Time</Label>
                  <Input
                    id="arrivalTime"
                    type="time"
                    value={arrivalTime}
                    onChange={(e) => setArrivalTime(e.target.value)}
                  />
                </div>
              )}
              {showNotes && (
                <div className="space-y-1">
                  <Label htmlFor="specialNotes">Special Notes</Label>
                  <Textarea
                    id="specialNotes"
                    placeholder="e.g., Group of children ages 10-12, dietary restrictions..."
                    value={specialNotes}
                    onChange={(e) => setSpecialNotes(e.target.value)}
                    rows={3}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Error message */}
          {error && (
            <div className="p-3 rounded-lg bg-destructive/10 text-destructive flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              {error}
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={isSubmitting || !availability.available}
          >
            {isSubmitting ? 'Creating...' : 'Create Reservation'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
