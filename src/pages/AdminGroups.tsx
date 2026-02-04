import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdminGroups } from '@/hooks/useAdminGroups';
import { GroupRecord, GroupStatus } from '@/types/adminGroups';
import { hasLinkedRecords, getLinkedRecordsDescription } from '@/lib/groupLinkedRecords';
import { AdminLayout } from '@/components/AdminLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { 
  Users, 
  Plus, 
  Calendar, 
  Phone, 
  Loader2,
  ArrowRight,
  Clock,
  Tent,
  Trash2,
  Archive,
  RotateCcw,
  AlertCircle
} from 'lucide-react';
import { format, parseISO, isWithinInterval, isAfter } from 'date-fns';
import { he } from 'date-fns/locale';
import { toast } from 'sonner';

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
  const { groups, activeGroups, archivedGroups, isLoading, deleteGroup, archiveGroup, restoreGroup } = useAdminGroups();
  
  const [showArchived, setShowArchived] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [archiveDialogOpen, setArchiveDialogOpen] = useState(false);
  const [restoreDialogOpen, setRestoreDialogOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<GroupRecord | null>(null);

  if (isLoading) {
    return (
      <AdminLayout title="קבוצות / הזמנות" subtitle="ניהול קבוצות ולוחות זמנים">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-12 h-12 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  // Determine which groups to show
  const displayGroups = showArchived ? groups : activeGroups;

  // Sort groups: ON_SITE first, then PLANNED by start date, then COMPLETED, archived last
  const sortedGroups = [...displayGroups].sort((a, b) => {
    // Archived groups always at the bottom
    if (a.isArchived !== b.isArchived) {
      return a.isArchived ? 1 : -1;
    }
    const statusA = getGroupStatus(a);
    const statusB = getGroupStatus(b);
    const order: Record<GroupStatus, number> = { ON_SITE: 0, PLANNED: 1, COMPLETED: 2 };
    if (order[statusA] !== order[statusB]) return order[statusA] - order[statusB];
    return new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
  });

  const handleDeleteClick = (e: React.MouseEvent, group: GroupRecord) => {
    e.stopPropagation();
    const canDelete = !hasLinkedRecords(group.id, group.groupName);
    if (!canDelete) {
      // Show info toast about why deletion is blocked
      const description = getLinkedRecordsDescription(group.id, group.groupName);
      toast.error(`לא ניתן למחוק קבוצה עם ${description}. ניתן להעביר לארכיון.`);
      return;
    }
    setSelectedGroup(group);
    setDeleteDialogOpen(true);
  };

  const handleArchiveClick = (e: React.MouseEvent, group: GroupRecord) => {
    e.stopPropagation();
    setSelectedGroup(group);
    setArchiveDialogOpen(true);
  };

  const handleRestoreClick = (e: React.MouseEvent, group: GroupRecord) => {
    e.stopPropagation();
    setSelectedGroup(group);
    setRestoreDialogOpen(true);
  };

  const confirmDelete = () => {
    if (selectedGroup) {
      deleteGroup(selectedGroup.id);
      toast.success('הקבוצה נמחקה');
    }
    setDeleteDialogOpen(false);
    setSelectedGroup(null);
  };

  const confirmArchive = () => {
    if (selectedGroup) {
      archiveGroup(selectedGroup.id);
      toast.success('הקבוצה הועברה לארכיון');
    }
    setArchiveDialogOpen(false);
    setSelectedGroup(null);
  };

  const confirmRestore = () => {
    if (selectedGroup) {
      restoreGroup(selectedGroup.id);
      toast.success('הקבוצה הוחזרה מהארכיון');
    }
    setRestoreDialogOpen(false);
    setSelectedGroup(null);
  };

  const canDeleteGroup = (group: GroupRecord) => !hasLinkedRecords(group.id, group.groupName);

  return (
    <AdminLayout title="קבוצות / הזמנות" subtitle="ניהול קבוצות ולוחות זמנים">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-bold">רשימת קבוצות</h2>
          <div className="flex items-center gap-2 mr-4">
            <Switch 
              id="show-archived" 
              checked={showArchived} 
              onCheckedChange={setShowArchived}
            />
            <Label htmlFor="show-archived" className="text-sm text-muted-foreground">
              הצג ארכיון ({archivedGroups.length})
            </Label>
          </div>
        </div>
        <Button 
          size="lg" 
          onClick={() => navigate('/admin/groups/new')}
          className="text-lg px-6"
        >
          <Plus className="w-5 h-5 ml-2" />
          קבוצה חדשה
        </Button>
      </div>
      
      {sortedGroups.length === 0 ? (
        <Card className="p-12 text-center">
          <div className="flex flex-col items-center gap-4">
            <Tent className="w-16 h-16 text-muted-foreground" />
            <h2 className="text-2xl font-semibold">
              {showArchived ? 'אין קבוצות' : 'אין קבוצות פעילות'}
            </h2>
            <p className="text-muted-foreground">
              {showArchived ? 'צור את הקבוצה הראשונה שלך' : 'צור קבוצה חדשה או הצג את הארכיון'}
            </p>
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
            const isArchivedGroup = group.isArchived;
            const canDelete = canDeleteGroup(group);
            
            return (
              <Card 
                key={group.id} 
                className={`hover:shadow-md transition-shadow cursor-pointer ${isArchivedGroup ? 'opacity-60' : ''}`}
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
                        {isArchivedGroup && (
                          <span className="px-3 py-1 rounded-full text-sm font-medium bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300">
                            <Archive className="w-3 h-3 inline ml-1" />
                            ארכיון
                          </span>
                        )}
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
                    
                    <div className="flex items-center gap-2">
                      {/* Action buttons */}
                      {isArchivedGroup ? (
                        <Button 
                          variant="outline" 
                          size="icon"
                          onClick={(e) => handleRestoreClick(e, group)}
                          title="החזר מהארכיון"
                        >
                          <RotateCcw className="w-4 h-4" />
                        </Button>
                      ) : (
                        <>
                          <Button 
                            variant="outline" 
                            size="icon"
                            onClick={(e) => handleArchiveClick(e, group)}
                            title="העבר לארכיון"
                          >
                            <Archive className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="icon"
                            onClick={(e) => handleDeleteClick(e, group)}
                            disabled={!canDelete}
                            title={canDelete ? 'מחק קבוצה' : 'לא ניתן למחוק קבוצה עם שיבוצים'}
                            className={!canDelete ? 'opacity-50 cursor-not-allowed' : ''}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </>
                      )}
                      <Button variant="ghost" size="icon">
                        <ArrowRight className="w-5 h-5" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Trash2 className="w-5 h-5 text-destructive" />
              מחיקת קבוצה
            </AlertDialogTitle>
            <AlertDialogDescription className="text-right">
              אתה בטוח שברצונך למחוק את הקבוצה '{selectedGroup?.groupName}'?
              <br />
              <strong className="text-destructive">הפעולה לא ניתנת לשחזור.</strong>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row-reverse gap-2">
            <AlertDialogCancel>ביטול</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              מחק
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Archive Confirmation Dialog */}
      <AlertDialog open={archiveDialogOpen} onOpenChange={setArchiveDialogOpen}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Archive className="w-5 h-5 text-primary" />
              העברה לארכיון
            </AlertDialogTitle>
            <AlertDialogDescription className="text-right">
              האם להעביר את הקבוצה '{selectedGroup?.groupName}' לארכיון?
              <br />
              הקבוצה תוסתר מהרשימה אך הנתונים יישמרו.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row-reverse gap-2">
            <AlertDialogCancel>ביטול</AlertDialogCancel>
            <AlertDialogAction onClick={confirmArchive}>
              העבר לארכיון
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Restore Confirmation Dialog */}
      <AlertDialog open={restoreDialogOpen} onOpenChange={setRestoreDialogOpen}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <RotateCcw className="w-5 h-5 text-primary" />
              החזרה מארכיון
            </AlertDialogTitle>
            <AlertDialogDescription className="text-right">
              האם להחזיר את הקבוצה '{selectedGroup?.groupName}' מהארכיון?
              <br />
              הקבוצה תוצג שוב ברשימה הפעילה.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row-reverse gap-2">
            <AlertDialogCancel>ביטול</AlertDialogCancel>
            <AlertDialogAction onClick={confirmRestore}>
              החזר מהארכיון
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
};

export default AdminGroups;
