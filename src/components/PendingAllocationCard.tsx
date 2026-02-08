import React from 'react';
import { useNavigate } from 'react-router-dom';
import { GroupRecord } from '@/types/adminGroups';
import { AllocationRecord } from '@/types/groupAllocation';
import { computeAllocationStatus } from '@/lib/allocationStatus';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users, Calendar, ArrowLeft, Crown, Home } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { he } from 'date-fns/locale';

interface PendingAllocationCardProps {
  group: GroupRecord;
  allocations: AllocationRecord[];
}

export const PendingAllocationCard: React.FC<PendingAllocationCardProps> = ({ group, allocations }) => {
  const navigate = useNavigate();
  
  // Compute status dynamically from allocations (GOAL 2)
  const statusInfo = computeAllocationStatus(group, allocations);
  
  const staffCount = group.staffCount || 0;
  const participantCount = group.participantCount || (group.pax - staffCount);

  return (
    <Card className={`hover:shadow-md transition-shadow ${
      statusInfo.status === 'fully_allocated' ? 'border-green-400' : ''
    }`}>
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

            {/* Allocation breakdown */}
            <div className="flex flex-wrap gap-3 mt-3 text-sm">
              <div className="flex items-center gap-1">
                <Crown className="w-3.5 h-3.5 text-amber-500" />
                <span className="text-muted-foreground">צוות:</span>
                <span className={`font-semibold ${
                  statusInfo.vipAssigned >= statusInfo.vipRequired ? 'text-green-600' : ''
                }`}>
                  {statusInfo.vipAssigned}/{statusInfo.vipRequired}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <Home className="w-3.5 h-3.5 text-blue-500" />
                <span className="text-muted-foreground">חניכים:</span>
                <span className={`font-semibold ${
                  statusInfo.participantAssigned >= statusInfo.participantRequired ? 'text-green-600' : ''
                }`}>
                  {statusInfo.participantAssigned}/{statusInfo.participantRequired}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-end gap-2 shrink-0">
            <Badge variant={statusInfo.badgeVariant}>
              {statusInfo.label}
            </Badge>
            <Button 
              size="sm" 
              onClick={() => navigate(`/allocation/${group.id}`)}
              className="flex items-center gap-1"
              variant={statusInfo.status === 'fully_allocated' ? 'outline' : 'default'}
            >
              {statusInfo.status === 'fully_allocated' ? 'ערוך שיבוץ' : 'פתח שיבוץ'}
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
