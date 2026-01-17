import React, { useState } from 'react';
import { NeighborhoodReservation, NeighborhoodId } from '@/types/village';
import { useVillage } from '@/context/VillageContext';
import { Button } from '@/components/ui/button';
import { 
  Calendar, 
  Copy, 
  Trash2, 
  Edit, 
  Check, 
  Users, 
  Phone, 
  User, 
  Clock,
  MapPin,
  Bed
} from 'lucide-react';
import { format, parseISO, differenceInDays } from 'date-fns';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface ReservationCardProps {
  reservation: NeighborhoodReservation;
  onEdit?: (reservation: NeighborhoodReservation) => void;
}

export const ReservationCard: React.FC<ReservationCardProps> = ({ 
  reservation,
  onEdit 
}) => {
  const { state, removeNeighborhoodReservation, clearNeighborhoodBeds } = useVillage();
  const [copied, setCopied] = useState(false);

  if (!state) return null;

  const neighborhood = state.neighborhoods[reservation.neighborhoodId];
  const nights = differenceInDays(
    parseISO(reservation.checkOutDate), 
    parseISO(reservation.checkInDate)
  );

  // Calculate total beds
  const totalBeds = neighborhood?.tentIds.reduce((acc, tentId) => {
    const tent = state.tents[tentId];
    return acc + (tent?.beds.length || 0);
  }, 0) || 0;

  const generateCopyText = () => {
    let text = `📅 RESERVATION CONFIRMATION\n`;
    text += `━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
    text += `🏕️ Location: ${neighborhood?.displayName} - Aharonson Farm\n`;
    text += `👥 Group: ${reservation.groupName}\n`;
    text += `📅 Check-in: ${format(parseISO(reservation.checkInDate), 'EEEE, MMMM d, yyyy')}\n`;
    text += `📅 Check-out: ${format(parseISO(reservation.checkOutDate), 'EEEE, MMMM d, yyyy')}\n`;
    text += `🌙 Nights: ${nights}\n`;
    text += `🛏️ Capacity: ${totalBeds} beds\n`;
    
    if (reservation.numberOfPeople) {
      text += `👤 People: ${reservation.numberOfPeople}\n`;
    }
    if (reservation.contactName) {
      text += `📞 Contact: ${reservation.contactName}\n`;
    }
    if (reservation.contactPhone) {
      text += `☎️ Phone: ${reservation.contactPhone}\n`;
    }
    if (reservation.arrivalTime) {
      text += `⏰ Arrival: ${reservation.arrivalTime}\n`;
    }
    if (reservation.specialNotes) {
      text += `\n📝 Notes: ${reservation.specialNotes}\n`;
    }
    
    text += `\n¡We look forward to seeing you!\n`;
    
    return text;
  };

  const handleCopy = async () => {
    const text = generateCopyText();
    await navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success('Reservation info copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDelete = () => {
    clearNeighborhoodBeds(reservation.neighborhoodId);
    removeNeighborhoodReservation(reservation.id);
    toast.success('Reservation deleted');
  };

  const isUpcoming = parseISO(reservation.checkInDate) > new Date();
  const isActive = parseISO(reservation.checkInDate) <= new Date() && 
                   parseISO(reservation.checkOutDate) >= new Date();

  return (
    <div className={`tile p-5 ${isActive ? 'border-primary border-2' : ''}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          {/* Header */}
          <div className="flex items-center gap-2 mb-2">
            <MapPin className="w-5 h-5 text-primary" />
            <span className="font-bold text-lg">{neighborhood?.displayName}</span>
            {isActive && (
              <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-primary text-primary-foreground">
                ACTIVE
              </span>
            )}
            {reservation.isPartialReservation && (
              <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-muted text-muted-foreground">
                Partial
              </span>
            )}
          </div>

          {/* Group name */}
          <h3 className="text-xl font-bold mb-3">"{reservation.groupName}"</h3>

          {/* Dates */}
          <div className="flex items-center gap-4 text-muted-foreground mb-3">
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              <span>{format(parseISO(reservation.checkInDate), 'MMM d')}</span>
              <span>→</span>
              <span>{format(parseISO(reservation.checkOutDate), 'MMM d, yyyy')}</span>
            </div>
            <span className="text-sm">({nights} nights)</span>
          </div>

          {/* Quick info */}
          <div className="flex flex-wrap gap-3 text-sm">
            <div className="flex items-center gap-1 text-muted-foreground">
              <Bed className="w-4 h-4" />
              <span>{totalBeds} beds</span>
            </div>
            {reservation.numberOfPeople && (
              <div className="flex items-center gap-1 text-muted-foreground">
                <Users className="w-4 h-4" />
                <span>{reservation.numberOfPeople} people</span>
              </div>
            )}
            {reservation.contactName && (
              <div className="flex items-center gap-1 text-muted-foreground">
                <User className="w-4 h-4" />
                <span>{reservation.contactName}</span>
              </div>
            )}
            {reservation.arrivalTime && (
              <div className="flex items-center gap-1 text-muted-foreground">
                <Clock className="w-4 h-4" />
                <span>{reservation.arrivalTime}</span>
              </div>
            )}
          </div>

          {/* Notes */}
          {reservation.specialNotes && (
            <p className="mt-3 text-sm text-muted-foreground bg-muted/50 p-2 rounded">
              📝 {reservation.specialNotes}
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopy}
            className="flex items-center gap-2"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-green-600" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                Copy Info
              </>
            )}
          </Button>
          
          {onEdit && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEdit(reservation)}
              className="flex items-center gap-2"
            >
              <Edit className="w-4 h-4" />
              Edit
            </Button>
          )}

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-2 text-destructive hover:text-destructive"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Reservation?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will delete the reservation for "{reservation.groupName}" and free all beds in {neighborhood?.displayName}. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </div>
  );
};
