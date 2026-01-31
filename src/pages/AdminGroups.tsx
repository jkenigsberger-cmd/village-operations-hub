import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdminGroups } from '@/hooks/useAdminGroups';
import { GroupRecord, GroupStatus } from '@/types/adminGroups';
import { AdminLayout } from '@/components/AdminLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Users, 
  Plus, 
  Calendar, 
  Phone, 
  Loader2,
  ArrowRight,
  Clock,
  Tent
} from 'lucide-react';
import { format, parseISO, isWithinInterval, isAfter } from 'date-fns';
import { he } from 'date-fns/locale';

const statusLabels: Record<GroupStatus, string> = {
  PLANNED: 'מתוכננת',
  ON_SITE: 'באתר',
  COMPLETED: 'הושלמה',
};

const statusColors: Record<GroupStatus, string> = {
  PLANNED: 'bg-blue-100 text-blue-800',
  ON_SITE: 'bg-green-100 text-green-800',
  COMPLETED: 'bg-muted text-muted-foreground',
};

const getGroupStatus = (group: GroupRecord): GroupStatus => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const startDate = parseISO(group.startDate);
  const endDate = parseISO(group.endDate);
  
  if (isAfter(today, endDate)) return 'COMPLETED';
  if (isWithinInterval(today, { start: startDate, end: endDate })) return 'ON_SITE';
  return 'PLANNED';
};

const AdminGroups = () => {
  const navigate = useNavigate();
  const { groups, isLoading } = useAdminGroups();

  if (isLoading) {
    return (
      <AdminLayout title="קבוצות / הזמנות" subtitle="ניהול קבוצות ולוחות זמנים">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-12 h-12 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  // Sort groups: ON_SITE first, then PLANNED by start date, then COMPLETED
  const sortedGroups = [...groups].sort((a, b) => {
    const statusA = getGroupStatus(a);
    const statusB = getGroupStatus(b);
    const order: Record<GroupStatus, number> = { ON_SITE: 0, PLANNED: 1, COMPLETED: 2 };
    if (order[statusA] !== order[statusB]) return order[statusA] - order[statusB];
    return new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
  });

  return (
    <AdminLayout title="קבוצות / הזמנות" subtitle="ניהול קבוצות ולוחות זמנים">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold">רשימת קבוצות</h2>
        <Button 
          size="lg" 
          onClick={() => navigate('/admin/groups/new')}
          className="text-lg px-6"
        >
          <Plus className="w-5 h-5 ml-2" />
          קבוצה חדשה
        </Button>
      </div>
        {groups.length === 0 ? (
          <Card className="p-12 text-center">
            <div className="flex flex-col items-center gap-4">
              <Tent className="w-16 h-16 text-muted-foreground" />
              <h2 className="text-2xl font-semibold">אין קבוצות עדיין</h2>
              <p className="text-muted-foreground">צור את הקבוצה הראשונה שלך</p>
              <Button size="lg" onClick={() => navigate('/admin/groups/new')}>
                <Plus className="w-5 h-5 ml-2" />
                צור קבוצה
              </Button>
            </div>
          </Card>
        ) : (
          <div className="grid gap-4">
            {sortedGroups.map((group) => {
              const status = getGroupStatus(group);
              return (
                <Card 
                  key={group.id} 
                  className="hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => navigate(`/admin/groups/${group.id}`)}
                >
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-xl font-bold">{group.groupName}</h3>
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusColors[status]}`}>
                            {statusLabels[status]}
                          </span>
                        </div>
                        
                        <div className="flex flex-wrap gap-4 text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            <span>
                              {format(parseISO(group.startDate), 'd MMM', { locale: he })} - {format(parseISO(group.endDate), 'd MMM yyyy', { locale: he })}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Users className="w-4 h-4" />
                            <span>{group.pax} אנשים</span>
                          </div>
                          {group.reservedBy && (
                            <div className="flex items-center gap-1">
                              <span>מזמין: {group.reservedBy}</span>
                            </div>
                          )}
                          {group.contactPhone && (
                            <div className="flex items-center gap-1">
                              <Phone className="w-4 h-4" />
                              <span>{group.contactPhone}</span>
                            </div>
                          )}
                        </div>
                        
                        {group.scheduleItems.length > 0 && (
                          <div className="mt-2 text-sm text-muted-foreground">
                            <Clock className="w-4 h-4 inline ml-1" />
                            {group.scheduleItems.length} פריטים בלו״ז
                          </div>
                        )}
                        
                        {/* Remaining allocation counters */}
                        {group.groupType !== 'יום ללא לינה' && (group.staffCount || group.participantCount) && (
                          <div className="mt-3 flex flex-wrap gap-2">
                            {(group.staffCount !== undefined && group.staffCount > 0) && (
                              <span className="px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                                צוות נשאר: {group.remainingStaff ?? group.staffCount}/{group.staffCount}
                              </span>
                            )}
                            {(group.participantCount !== undefined && group.participantCount > 0) && (
                              <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                חניכים נשאר: {group.remainingParticipants ?? group.participantCount}/{group.participantCount}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                      
                      <Button variant="ghost" size="icon">
                        <ArrowRight className="w-5 h-5" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
    </AdminLayout>
  );
};

export default AdminGroups;
