import React, { useState, useMemo } from 'react';
import { useVillage } from '@/context/VillageContext';
import { NeighborhoodId, NeighborhoodReservation } from '@/types/village';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import { 
  Users, 
  Trash2, 
  SparklesIcon, 
  AlertTriangle,
  Calendar,
  X,
  Check,
  AlertCircle,
  CalendarCheck,
  CalendarX,
  Tent as TentIcon,
  Bed,
  Phone,
  User,
  ChevronRight,
  MessageSquare
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface NeighborhoodBulkActionsProps {
  neighborhoodId: NeighborhoodId;
  neighborhoodName: string;
}

export const NeighborhoodBulkActions: React.FC<NeighborhoodBulkActionsProps> = ({
  neighborhoodId,
  neighborhoodName,
}) => {
  const { 
    state,
    reserveNeighborhood, 
    markNeighborhoodDirty, 
    markNeighborhoodClean,
    clearNeighborhoodBeds,
    getNeighborhoodReservations,
    checkNeighborhoodAvailability,
    removeNeighborhoodReservation
  } = useVillage();

  const [showReserveDialog, setShowReserveDialog] = useState(false);
  const [showConfirmClear, setShowConfirmClear] = useState(false);
  const [selectedReservation, setSelectedReservation] = useState<NeighborhoodReservation | null>(null);
  const [availabilityError, setAvailabilityError] = useState<string | null>(null);
  const [reservationForm, setReservationForm] = useState({
    groupName: '',
    checkInDate: new Date().toISOString().split('T')[0],
    checkOutDate: '',
    notes: '',
  });

  const reservations = getNeighborhoodReservations(neighborhoodId);
  const today = new Date().toISOString().split('T')[0];

  // Get upcoming check-ins and check-outs
  const upcomingEvents = useMemo(() => {
    return reservations
      .filter(r => r.checkOutDate >= today)
      .sort((a, b) => a.checkInDate.localeCompare(b.checkInDate));
  }, [reservations, today]);

  // Get reservation details (tents and beds info)
  const getReservationDetails = (reservation: NeighborhoodReservation) => {
    if (!state) return { tents: [], totalBeds: 0, genderSummary: { female: 0, male: 0, mixed: 0 } };

    const neighborhood = state.neighborhoods[neighborhoodId];
    if (!neighborhood) return { tents: [], totalBeds: 0, genderSummary: { female: 0, male: 0, mixed: 0 } };

    let tentIds: string[] = [];
    
    if (reservation.reservationType === 'SPECIFIC_TENTS' && reservation.tentIds) {
      tentIds = reservation.tentIds;
    } else {
      // Full neighborhood - get all tents
      tentIds = neighborhood.tentIds;
    }

    const tents = tentIds.map(id => state.tents[id]).filter(Boolean);
    const totalBeds = tents.reduce((acc, tent) => acc + tent.beds.length, 0);
    
    const genderSummary = {
      female: tents.filter(t => t.gender === 'FEMALE').length,
      male: tents.filter(t => t.gender === 'MALE').length,
      mixed: tents.filter(t => t.gender === 'MIXED' || !t.gender).length,
    };

    return { tents, totalBeds, genderSummary };
  };

  // Check availability when dates change
  const handleDateChange = (field: 'checkInDate' | 'checkOutDate', value: string) => {
    const newForm = { ...reservationForm, [field]: value };
    setReservationForm(newForm);
    
    // Validate dates when both are set
    if (newForm.checkInDate && newForm.checkOutDate) {
      if (newForm.checkInDate >= newForm.checkOutDate) {
        setAvailabilityError('תאריך העזיבה חייב להיות אחרי תאריך ההגעה');
        return;
      }
      
      const availability = checkNeighborhoodAvailability(
        neighborhoodId, 
        newForm.checkInDate, 
        newForm.checkOutDate
      );
      
      if (!availability.available && availability.conflictingReservation) {
        setAvailabilityError(
          `⚠️ התנגשות: "${availability.conflictingReservation.groupName}" כבר יש הזמנה מ-${availability.conflictingReservation.checkInDate} עד ${availability.conflictingReservation.checkOutDate}`
        );
      } else {
        setAvailabilityError(null);
      }
    } else {
      setAvailabilityError(null);
    }
  };

  const handleReserve = () => {
    if (!reservationForm.groupName.trim()) {
      toast.error('שם הקבוצה נדרש');
      return;
    }
    if (!reservationForm.checkInDate || !reservationForm.checkOutDate) {
      toast.error('נא להשלים את כל התאריכים');
      return;
    }
    if (reservationForm.checkInDate >= reservationForm.checkOutDate) {
      toast.error('תאריך העזיבה חייב להיות אחרי תאריך ההגעה');
      return;
    }

    const result = reserveNeighborhood({
      neighborhoodId,
      groupName: reservationForm.groupName.trim(),
      checkInDate: reservationForm.checkInDate,
      checkOutDate: reservationForm.checkOutDate,
      notes: reservationForm.notes,
      reservationType: 'FULL_NEIGHBORHOOD',
    });

    if (result.success) {
      toast.success(`✓ שכונה ${neighborhoodName} הוזמנה עבור ${reservationForm.groupName}`);
      setShowReserveDialog(false);
      setReservationForm({
        groupName: '',
        checkInDate: new Date().toISOString().split('T')[0],
        checkOutDate: '',
        notes: '',
      });
      setAvailabilityError(null);
    } else {
      toast.error(result.error || 'שגיאה ביצירת ההזמנה');
    }
  };

  const handleRemoveReservation = (reservationId: string, groupName: string) => {
    removeNeighborhoodReservation(reservationId);
    toast.success(`הזמנה של "${groupName}" הוסרה`);
  };

  const handleMarkDirty = () => {
    markNeighborhoodDirty(neighborhoodId);
    toast.success(`כל האוהלים ב-${neighborhoodName} סומנו כמלוכלכים`);
  };

  const handleMarkClean = () => {
    markNeighborhoodClean(neighborhoodId);
    toast.success(`כל האוהלים ב-${neighborhoodName} סומנו כנקיים`);
  };

  const handleClearBeds = () => {
    clearNeighborhoodBeds(neighborhoodId);
    toast.success(`כל המיטות ב-${neighborhoodName} שוחררו`);
    setShowConfirmClear(false);
  };

  return (
    <div className="tile p-4 mb-6">
      <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
        <Users className="w-5 h-5" />
        פעולות קבוצתיות - {neighborhoodName}
      </h3>

      <div className="flex flex-wrap gap-3">
        {/* Reserve Neighborhood */}
        <Dialog open={showReserveDialog} onOpenChange={setShowReserveDialog}>
          <DialogTrigger asChild>
            <Button variant="default" className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              הזמן שכונה שלמה
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>הזמנת {neighborhoodName}</DialogTitle>
              <DialogDescription>
                פעולה זו תזמין את כל המיטות בשכונה עבור הקבוצה שצוינה.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="groupName">שם הקבוצה *</Label>
                <Input
                  id="groupName"
                  value={reservationForm.groupName}
                  onChange={(e) => setReservationForm(prev => ({ ...prev, groupName: e.target.value }))}
                  placeholder="לדוג׳: קבוצת בית ספר"
                  maxLength={100}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="checkIn">תאריך צ'ק-אין *</Label>
                  <Input
                    id="checkIn"
                    type="date"
                    value={reservationForm.checkInDate}
                    onChange={(e) => handleDateChange('checkInDate', e.target.value)}
                    min={today}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="checkOut">תאריך צ'ק-אאוט *</Label>
                  <Input
                    id="checkOut"
                    type="date"
                    value={reservationForm.checkOutDate}
                    onChange={(e) => handleDateChange('checkOutDate', e.target.value)}
                    min={reservationForm.checkInDate || today}
                  />
                </div>
              </div>

              {/* Availability Error */}
              {availabilityError && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{availabilityError}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="notes">הערות</Label>
                <Input
                  id="notes"
                  value={reservationForm.notes}
                  onChange={(e) => setReservationForm(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="הערות נוספות..."
                  maxLength={500}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => {
                setShowReserveDialog(false);
                setAvailabilityError(null);
              }}>
                ביטול
              </Button>
              <Button 
                onClick={handleReserve}
                disabled={!!availabilityError}
              >
                <Check className="w-4 h-4 mr-2" />
                הזמן
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Mark All Dirty */}
        <Button 
          variant="outline" 
          onClick={handleMarkDirty}
          className="flex items-center gap-2 border-amber-500 text-amber-700 hover:bg-amber-100 hover:text-amber-800"
        >
          <AlertTriangle className="w-4 h-4" />
          סמן הכל כמלוכלך
        </Button>

        {/* Mark All Clean */}
        <Button 
          variant="outline" 
          onClick={handleMarkClean}
          className="flex items-center gap-2 border-green-500 text-green-700 hover:bg-green-100 hover:text-green-800"
        >
          <SparklesIcon className="w-4 h-4" />
          סמן הכל כנקי
        </Button>

        {/* Clear All Beds */}
        <Dialog open={showConfirmClear} onOpenChange={setShowConfirmClear}>
          <DialogTrigger asChild>
            <Button 
              variant="outline" 
              className="flex items-center gap-2 border-red-500 text-red-700 hover:bg-red-100 hover:text-red-800"
            >
              <Trash2 className="w-4 h-4" />
              שחרר את כל המיטות
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="text-red-600">⚠️ אישור פעולה</DialogTitle>
              <DialogDescription>
                פעולה זו תשחרר את כל המיטות ב-{neighborhoodName}, תמחק הזמנות, 
                שמות אורחים ותאריכים. לא ניתן לבטל פעולה זו.
              </DialogDescription>
            </DialogHeader>
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setShowConfirmClear(false)}>
                ביטול
              </Button>
              <Button variant="destructive" onClick={handleClearBeds}>
                <Trash2 className="w-4 h-4 mr-2" />
                כן, שחרר הכל
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Upcoming Events - Check-ins and Check-outs */}
      {upcomingEvents.length > 0 && (
        <div className="mt-4 pt-4 border-t">
          <h4 className="font-semibold mb-3 flex items-center gap-2">
            <CalendarCheck className="w-4 h-4" />
            הזמנות מתוכננות
          </h4>
          <div className="space-y-2">
            {upcomingEvents.map(r => {
              const isCheckInToday = r.checkInDate === today;
              const isCheckOutToday = r.checkOutDate === today;
              
              return (
                <div 
                  key={r.id} 
                  className={cn(
                    "flex items-center justify-between p-3 rounded-lg border-2 cursor-pointer hover:shadow-md transition-all",
                    isCheckInToday ? "bg-green-50 border-green-300 hover:bg-green-100" :
                    isCheckOutToday ? "bg-orange-50 border-orange-300 hover:bg-orange-100" :
                    "bg-muted border-transparent hover:border-primary/30"
                  )}
                  onClick={() => setSelectedReservation(r)}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{r.groupName}</span>
                      {isCheckInToday && (
                        <span className="text-xs bg-green-600 text-white px-2 py-0.5 rounded-full flex items-center gap-1">
                          <CalendarCheck className="w-3 h-3" />
                          צ'ק-אין היום
                        </span>
                      )}
                      {isCheckOutToday && (
                        <span className="text-xs bg-orange-600 text-white px-2 py-0.5 rounded-full flex items-center gap-1">
                          <CalendarX className="w-3 h-3" />
                          צ'ק-אאוט היום
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">
                      📅 {r.checkInDate} → {r.checkOutDate}
                      {r.tentCount && <span className="ml-2">• {r.tentCount} אוהלים</span>}
                      {r.totalBeds && <span className="ml-2">• {r.totalBeds} מיטות</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <ChevronRight className="w-5 h-5 text-muted-foreground" />
                    <Button 
                      variant="ghost" 
                      size="sm"
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveReservation(r.id, r.groupName);
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* No reservations message */}
      {upcomingEvents.length === 0 && (
        <div className="mt-4 pt-4 border-t text-center text-muted-foreground py-4">
          <Calendar className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p>אין הזמנות מתוכננות לשכונה זו</p>
        </div>
      )}

      {/* Reservation Detail Modal */}
      <Dialog open={!!selectedReservation} onOpenChange={(open) => !open && setSelectedReservation(null)}>
        <DialogContent className="sm:max-w-lg">
          {selectedReservation && (() => {
            const details = getReservationDetails(selectedReservation);
            const isCheckInToday = selectedReservation.checkInDate === today;
            const isCheckOutToday = selectedReservation.checkOutDate === today;
            
            return (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
                    {selectedReservation.groupName}
                  </DialogTitle>
                  <DialogDescription>
                    פרטי ההזמנה להכנה
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                  {/* Status badges */}
                  <div className="flex flex-wrap gap-2">
                    {isCheckInToday && (
                      <span className="text-sm bg-green-600 text-white px-3 py-1 rounded-full flex items-center gap-1">
                        <CalendarCheck className="w-4 h-4" />
                        צ'ק-אין היום
                      </span>
                    )}
                    {isCheckOutToday && (
                      <span className="text-sm bg-orange-600 text-white px-3 py-1 rounded-full flex items-center gap-1">
                        <CalendarX className="w-4 h-4" />
                        צ'ק-אאוט היום
                      </span>
                    )}
                    <span className="text-sm bg-muted px-3 py-1 rounded-full">
                      {selectedReservation.reservationType === 'FULL_NEIGHBORHOOD' ? 'שכונה מלאה' : 'אוהלים ספציפיים'}
                    </span>
                  </div>

                  {/* Dates */}
                  <div className="p-4 bg-muted/50 rounded-xl space-y-2">
                    <h4 className="font-semibold flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      תאריכים
                    </h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Check-in:</span>
                        <p className="font-medium">{selectedReservation.checkInDate}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Check-out:</span>
                        <p className="font-medium">{selectedReservation.checkOutDate}</p>
                      </div>
                    </div>
                  </div>

                  {/* Tents and Beds Summary */}
                  <div className="p-4 bg-muted/50 rounded-xl space-y-3">
                    <h4 className="font-semibold flex items-center gap-2">
                      <TentIcon className="w-4 h-4" />
                      אוהלים ומיטות
                    </h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-3 bg-background rounded-lg">
                        <TentIcon className="w-6 h-6 mx-auto mb-1 text-primary" />
                        <p className="text-2xl font-bold">{details.tents.length}</p>
                        <p className="text-xs text-muted-foreground">אוהלים</p>
                      </div>
                      <div className="text-center p-3 bg-background rounded-lg">
                        <Bed className="w-6 h-6 mx-auto mb-1 text-primary" />
                        <p className="text-2xl font-bold">{details.totalBeds}</p>
                        <p className="text-xs text-muted-foreground">מיטות</p>
                      </div>
                    </div>

                    {/* Gender distribution */}
                    {(selectedReservation.genderDistribution || details.genderSummary) && (
                      <div className="pt-3 border-t">
                        <p className="text-sm font-medium mb-2">התפלגות לפי מגדר:</p>
                        <div className="flex gap-2 flex-wrap">
                          {(selectedReservation.genderDistribution?.female || details.genderSummary.female > 0) && (
                            <span className="text-sm bg-pink-100 text-pink-700 px-3 py-1 rounded-full">
                              ♀ {selectedReservation.genderDistribution?.female || details.genderSummary.female} נשים
                            </span>
                          )}
                          {(selectedReservation.genderDistribution?.male || details.genderSummary.male > 0) && (
                            <span className="text-sm bg-blue-100 text-blue-700 px-3 py-1 rounded-full">
                              ♂ {selectedReservation.genderDistribution?.male || details.genderSummary.male} גברים
                            </span>
                          )}
                          {(selectedReservation.genderDistribution?.mixed || details.genderSummary.mixed > 0) && (
                            <span className="text-sm bg-purple-100 text-purple-700 px-3 py-1 rounded-full">
                              👥 {selectedReservation.genderDistribution?.mixed || details.genderSummary.mixed} מעורב
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Tent list for specific tents */}
                  {selectedReservation.reservationType === 'SPECIFIC_TENTS' && details.tents.length > 0 && (
                    <div className="p-4 bg-muted/50 rounded-xl">
                      <h4 className="font-semibold mb-2">אוהלים שהוזמנו:</h4>
                      <div className="flex flex-wrap gap-2">
                        {details.tents.map(tent => (
                          <span 
                            key={tent.id} 
                            className={cn(
                              "text-sm px-3 py-1 rounded-full border",
                              tent.gender === 'FEMALE' ? "bg-pink-50 border-pink-300 text-pink-700" :
                              tent.gender === 'MALE' ? "bg-blue-50 border-blue-300 text-blue-700" :
                              "bg-purple-50 border-purple-300 text-purple-700"
                            )}
                          >
                            {tent.code} ({tent.beds.length} מיטות)
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Contact info */}
                  {(selectedReservation.contactName || selectedReservation.contactPhone) && (
                    <div className="p-4 bg-muted/50 rounded-xl space-y-2">
                      <h4 className="font-semibold flex items-center gap-2">
                        <User className="w-4 h-4" />
                        איש קשר
                      </h4>
                      {selectedReservation.contactName && (
                        <div className="flex items-center gap-2 text-sm">
                          <User className="w-4 h-4 text-muted-foreground" />
                          <span>{selectedReservation.contactName}</span>
                        </div>
                      )}
                      {selectedReservation.contactPhone && (
                        <div className="flex items-center gap-2 text-sm">
                          <Phone className="w-4 h-4 text-muted-foreground" />
                          <a href={`tel:${selectedReservation.contactPhone}`} className="text-primary hover:underline">
                            {selectedReservation.contactPhone}
                          </a>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Notes */}
                  {selectedReservation.notes && (
                    <div className="p-4 bg-muted/50 rounded-xl space-y-2">
                      <h4 className="font-semibold flex items-center gap-2">
                        <MessageSquare className="w-4 h-4" />
                        הערות
                      </h4>
                      <p className="text-sm text-muted-foreground">{selectedReservation.notes}</p>
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t">
                  <Button variant="outline" onClick={() => setSelectedReservation(null)}>
                    סגור
                  </Button>
                  <Button 
                    variant="destructive"
                    onClick={() => {
                      handleRemoveReservation(selectedReservation.id, selectedReservation.groupName);
                      setSelectedReservation(null);
                    }}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    מחק הזמנה
                  </Button>
                </div>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );
};
