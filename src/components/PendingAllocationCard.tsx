import React from 'react';
import { useNavigate } from 'react-router-dom';
import { GroupRecord } from '@/types/adminGroups';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users, Calendar, ArrowLeft } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { he } from 'date-fns/locale';

interface PendingAllocationCardProps {
  group: GroupRecord;
}

export const PendingAllocationCard: React.FC<PendingAllocationCardProps> = ({ group }) => {
  const navigate = useNavigate();
  
  const staffCount = group.staffCount || 0;
  const participantCount = group.participantCount || (group.pax - staffCount);
  const remainingStaff = group.remainingStaff ?? staffCount;
  const remainingParticipants = group.remainingParticipants ?? participantCount;
  
  const allocatedStaff = staffCount - remainingStaff;
  const allocatedParticipants = participantCount - remainingParticipants;
  
  const statusBadge = group.assignmentStatus === 'pending_capacity_issue' 
    ? { label: 'בעיה בזמינות', variant: 'destructive' as const }
    : { label: 'ממתין לשיבוץ', variant: 'secondary' as const };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h4 className="font-bold text-lg truncate">{group.groupName}</h4>
            
            <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
              <Calendar className="w-4 h-4 shrink-0" />
              <span>
                {format(parseISO(group.startDate), 'd MMM', { locale: he })} - {format(parseISO(group.endDate), 'd MMM', { locale: he })}
              </span>
              <span className="mx-1">|</span>
              <Users className="w-4 h-4 shrink-0" />
              <span>{group.pax} אנשים</span>
            </div>

            <div className="flex flex-wrap gap-3 mt-3 text-sm">
              <div className="flex items-center gap-1">
                <span className="text-muted-foreground">צוות:</span>
                <span className="font-semibold">{allocatedStaff}/{staffCount}</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-muted-foreground">חניכים:</span>
                <span className="font-semibold">{allocatedParticipants}/{participantCount}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-end gap-2 shrink-0">
            <Badge variant={statusBadge.variant}>{statusBadge.label}</Badge>
            <Button 
              size="sm" 
              onClick={() => navigate(`/allocation/${group.id}`)}
              className="flex items-center gap-1"
            >
              פתח שיבוץ
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
