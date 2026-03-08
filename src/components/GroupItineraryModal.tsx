import React, { useMemo } from 'react';
import { CalendarEvent, getActivitySpaceLabel } from '@/types/village';
import { GroupRecord } from '@/types/adminGroups';
import { useAdminGroups } from '@/hooks/useAdminGroups';
import { useKitchenData } from '@/hooks/useKitchenData';
import { useVillage } from '@/context/VillageContext';
import { MEAL_LABELS, LOCATION_LABELS, DIETARY_CATEGORIES } from '@/types/kitchen';
import { format, parseISO, isSameDay } from 'date-fns';
import { he } from 'date-fns/locale';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useIsMobile } from '@/hooks/use-mobile';
import { 
  Users, 
  Calendar, 
  Clock, 
  MapPin, 
  AlertTriangle,
  ChefHat,
  LogIn,
  LogOut,
  Flame,
  ExternalLink,
  ClipboardList
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface GroupItineraryModalProps {
  event: CalendarEvent | null;
  selectedDate: Date;
  isOpen: boolean;
  onClose: () => void;
}

interface ItineraryItem {
  time: string;
  endTime?: string;
  type: 'arrival' | 'departure' | 'meal' | 'space' | 'activity' | 'other';
  title: string;
  subtitle?: string;
  details?: string[];
  icon: React.ReactNode;
}

export const GroupItineraryModal: React.FC<GroupItineraryModalProps> = ({
  event,
  selectedDate,
  isOpen,
  onClose,
}) => {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const { groups } = useAdminGroups();
  const { state: kitchenState } = useKitchenData();
  const { state: villageState } = useVillage();

  // Find group by name from event
  const group = useMemo(() => {
    if (!event?.groupName) return null;
    return groups.find(g => g.groupName === event.groupName) || null;
  }, [event, groups]);

  const dateStr = format(selectedDate, 'yyyy-MM-dd');

  // Build itinerary items for the selected date
  const itineraryItems = useMemo((): ItineraryItem[] => {
    if (!group || !event) return [];
    
    const items: ItineraryItem[] = [];
    const selectedDateObj = selectedDate;
    const groupStartDate = parseISO(group.startDate);
    const groupEndDate = parseISO(group.endDate);

    // Check if this is arrival day
    if (isSameDay(selectedDateObj, groupStartDate)) {
      items.push({
        time: group.arrivalTime || '09:00',
        type: 'arrival',
        title: 'הגעה',
        subtitle: `קבוצת ${group.groupName}`,
        icon: <LogIn className="w-5 h-5 text-green-500" />,
      });
    }

    // Get meals for this date (from kitchen slots)
    Object.values(kitchenState.timeSlots).forEach(slot => {
      if (slot.date !== dateStr) return;
      
      // Kitchen slots don't have group name association directly,
      // but we show all meals for the day as they serve all groups
      const specialDetails: string[] = [];
      DIETARY_CATEGORIES.forEach(({ key, label }) => {
        const count = (slot.specialDiets as any)[key] || 0;
        if (count > 0) specialDetails.push(`${label}: ${count}`);
      });

      items.push({
        time: slot.time,
        type: 'meal',
        title: MEAL_LABELS[slot.mealType],
        subtitle: `${LOCATION_LABELS[slot.location]} | ${slot.totalPax} איש`,
        details: specialDetails.length > 0 ? specialDetails : undefined,
        icon: <ChefHat className="w-5 h-5 text-amber-500" />,
      });
    });

    // Get space/facility reservations for this date
    if (villageState) {
      // Facility reservations
      Object.values(villageState.facilityReservations || {}).forEach(res => {
        if (res.date !== dateStr) return;
        if (res.groupName !== group.groupName) return;

        const space = villageState.activitySpaces[res.facilityId];
        items.push({
          time: res.startTime,
          endTime: res.endTime,
          type: 'space',
          title: space ? getActivitySpaceLabel(space) : res.facilityId,
          subtitle: res.numberOfPeople ? `${res.numberOfPeople} איש` : undefined,
          details: res.notes ? [res.notes] : undefined,
          icon: <Flame className="w-5 h-5 text-orange-500" />,
        });
      });

      // Activity reservations
      Object.values(villageState.activityReservations || {}).forEach(res => {
        if (res.date !== dateStr) return;
        if (res.groupName !== group.groupName) return;

        const space = villageState.activitySpaces[res.spaceId];
        items.push({
          time: res.startTime,
          endTime: res.endTime,
          type: 'activity',
          title: space ? getActivitySpaceLabel(space) : res.spaceId,
          details: res.notes ? [res.notes] : undefined,
          icon: <Flame className="w-5 h-5 text-orange-500" />,
        });
      });
    }

    // Get schedule items from group record
    group.scheduleItems.forEach(item => {
      if (item.date !== dateStr) return;

      items.push({
        time: item.startTime,
        endTime: item.endTime,
        type: 'other',
        title: item.description,
        subtitle: item.location,
        icon: <ClipboardList className="w-5 h-5 text-blue-500" />,
      });
    });

    // Check if this is departure day
    if (isSameDay(selectedDateObj, groupEndDate)) {
      items.push({
        time: group.departureTime || '10:00',
        type: 'departure',
        title: 'יציאה',
        subtitle: `קבוצת ${group.groupName}`,
        icon: <LogOut className="w-5 h-5 text-blue-500" />,
      });
    }

    // Sort by time
    items.sort((a, b) => a.time.localeCompare(b.time));

    return items;
  }, [group, event, selectedDate, dateStr, kitchenState, villageState]);

  const handleOpenGroup = () => {
    if (group) {
      navigate(`/admin/groups/${group.id}`);
      onClose();
    }
  };

  const handleOpenKitchen = () => {
    navigate('/kitchen');
    onClose();
  };

  const hasMeals = itineraryItems.some(item => item.type === 'meal');

  // Content component to avoid duplication
  const ModalContent = () => (
    <div className="flex flex-col h-full" dir="rtl">
      {/* Group Summary Section */}
      {group ? (
        <div className="p-4 bg-muted/30 rounded-lg mb-4 border border-border">
          <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-primary" />
            פרטי קבוצה
          </h3>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">סוג:</span>
              <span className="font-medium">{group.groupType}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">סה״כ:</span>
              <span className="font-medium">{group.pax} איש</span>
            </div>
            {(group.staffCount || group.participantCount) && (
              <>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">צוות:</span>
                  <span className="font-medium">{group.staffCount || 0}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">חניכים:</span>
                  <span className="font-medium">{group.participantCount || 0}</span>
                </div>
              </>
            )}
            <div className="col-span-2 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <span>
                {format(parseISO(group.startDate), 'dd/MM', { locale: he })} – {format(parseISO(group.endDate), 'dd/MM', { locale: he })}
              </span>
            </div>
            {group.arrivalTime && isSameDay(selectedDate, parseISO(group.startDate)) && (
              <div className="flex items-center gap-2">
                <LogIn className="w-4 h-4 text-green-500" />
                <span>הגעה: {group.arrivalTime}</span>
              </div>
            )}
            {group.upgradedCoffee && (
              <div className="col-span-2 flex items-center gap-2 px-2 py-1 bg-amber-500/10 rounded-md border border-amber-500/30">
                <span className="text-base">☕</span>
                <span className="text-sm font-medium text-amber-700 dark:text-amber-400">קפה משודרג</span>
              </div>
            )}
            {group.departureTime && isSameDay(selectedDate, parseISO(group.endDate)) && (
              <div className="flex items-center gap-2">
                <LogOut className="w-4 h-4 text-blue-500" />
                <span>יציאה: {group.departureTime}</span>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="p-4 bg-yellow-500/10 rounded-lg mb-4 border border-yellow-500/30 text-center">
          <AlertTriangle className="w-6 h-6 text-yellow-600 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">
            לא נמצאו פרטי קבוצה מלאים במערכת
          </p>
        </div>
      )}

      {/* Daily Schedule Section */}
      <div className="flex-1">
        <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
          <Clock className="w-5 h-5 text-primary" />
          לוח זמנים – {format(selectedDate, 'dd/MM', { locale: he })}
        </h3>
        
        <ScrollArea className="h-[300px] lg:h-[350px]">
          {itineraryItems.length > 0 ? (
            <div className="space-y-3 pr-1">
              {itineraryItems.map((item, index) => (
                <div
                  key={index}
                  className="flex gap-3 p-3 rounded-lg bg-muted/20 border border-border/50"
                >
                  <div className="flex-shrink-0 pt-1">
                    {item.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                      <Clock className="w-3 h-3" />
                      <span className="font-medium">
                        {item.time}
                        {item.endTime && ` – ${item.endTime}`}
                      </span>
                    </div>
                    <div className="font-semibold">{item.title}</div>
                    {item.subtitle && (
                      <div className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                        <MapPin className="w-3 h-3" />
                        {item.subtitle}
                      </div>
                    )}
                    {item.details && item.details.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {item.details.map((detail, i) => (
                          <span
                            key={i}
                            className="text-xs px-2 py-1 bg-yellow-500/20 text-yellow-700 dark:text-yellow-400 rounded-full flex items-center gap-1"
                          >
                            <AlertTriangle className="w-3 h-3" />
                            {detail}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Calendar className="w-10 h-10 mx-auto mb-2 opacity-50" />
              <p>אין אירועים מתוכננים לקבוצה זו ביום זה</p>
            </div>
          )}
        </ScrollArea>
      </div>

      {/* Quick Actions */}
      <div className="flex gap-2 mt-4 pt-4 border-t border-border">
        {group && (
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleOpenGroup}
            className="gap-2"
          >
            <ExternalLink className="w-4 h-4" />
            פתח קבוצה
          </Button>
        )}
        {hasMeals && (
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleOpenKitchen}
            className="gap-2"
          >
            <ChefHat className="w-4 h-4" />
            פתח במטבח
          </Button>
        )}
      </div>
    </div>
  );

  const title = event?.groupName 
    ? `לו״ז יומי – ${event.groupName} – ${format(selectedDate, 'dd/MM/yyyy', { locale: he })}`
    : 'לו״ז יומי';

  if (isMobile) {
    return (
      <Drawer open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DrawerContent className="max-h-[90vh]" dir="rtl">
          <DrawerHeader className="border-b border-border">
            <DrawerTitle className="text-right flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              {title}
            </DrawerTitle>
          </DrawerHeader>
          <div className="p-4 overflow-auto">
            <ModalContent />
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            {title}
          </DialogTitle>
        </DialogHeader>
        <ModalContent />
      </DialogContent>
    </Dialog>
  );
};
