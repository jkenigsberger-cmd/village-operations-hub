import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdminGroups } from '@/hooks/useAdminGroups';
import { GroupRecord, GroupStatus } from '@/types/adminGroups';
import { getLinkedRecordsDescription, cascadeDeleteGroupRecords } from '@/lib/groupLinkedRecords';
import { AdminLayout } from '@/components/AdminLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
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
  AlertTriangle,
  XCircle
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
  
  // Modal states
  const [choiceDialogOpen, setChoiceDialogOpen] = useState(false);
  const [confirmDeleteDialogOpen, setConfirmDeleteDialogOpen] = useState(false);
  const [restoreDialogOpen, setRestoreDialogOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<GroupRecord | null>(null);

  if (isLoading) {
    return (
      <AdminLayout title="קבוצות / הזמנות" subtitle="ניהול קבוצות ולוחות זמנים" section="groups">
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

  // Open the choice modal (Archive vs Delete)
  const handleRemoveClick = (e: React.MouseEvent, group: GroupRecord) => {
    e.stopPropagation();
    setSelectedGroup(group);
    setChoiceDialogOpen(true);
  };

  // Handle archive choice
  const handleArchiveChoice = () => {
    if (selectedGroup) {
      archiveGroup(selectedGroup.id);
      toast.success('הקבוצה הועברה לארכיון');
    }
    setChoiceDialogOpen(false);
    setSelectedGroup(null);
  };

  // Handle permanent delete choice - show confirmation
  const handlePermanentDeleteChoice = () => {
    setChoiceDialogOpen(false);
    setConfirmDeleteDialogOpen(true);
  };

  // Confirm permanent delete
  const confirmPermanentDelete = async () => {
    if (selectedGroup) {
      try {
        await cascadeDeleteGroupRecords(selectedGroup.id, selectedGroup.groupName);
        await deleteGroup(selectedGroup.id);
        toast.success('הקבוצה וכל המידע המשויך נמחקו לצמיתות');
      } catch (error) {
        console.error('Error deleting group:', error);
        toast.error('שגיאה במחיקת הקבוצה');
      }
    }
    setConfirmDeleteDialogOpen(false);
    setSelectedGroup(null);
  };

  // Handle restore click
  const handleRestoreClick = (e: React.MouseEvent, group: GroupRecord) => {
    e.stopPropagation();
    setSelectedGroup(group);
    setRestoreDialogOpen(true);
  };

  // Confirm restore
  const confirmRestore = () => {
    if (selectedGroup) {
      restoreGroup(selectedGroup.id);
      toast.success('הקבוצה שוחזרה מהארכיון');
    }
    setRestoreDialogOpen(false);
    setSelectedGroup(null);
  };

  // Direct permanent delete from archived group
  const handleDirectPermanentDelete = (e: React.MouseEvent, group: GroupRecord) => {
    e.stopPropagation();
    setSelectedGroup(group);
    setConfirmDeleteDialogOpen(true);
  };

  return (
    <AdminLayout title="קבוצות / הזמנות" subtitle="ניהול קבוצות ולוחות זמנים" section="groups">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-3 md:gap-4 flex-wrap">
          <h2 className="text-lg md:text-xl font-bold">רשימת קבוצות</h2>
          <div className="flex items-center gap-2">
            <Switch 
              id="show-archived" 
              checked={showArchived} 
              onCheckedChange={setShowArchived}
            />
            <Label htmlFor="show-archived" className="text-xs md:text-sm text-muted-foreground">
              ארכיון ({archivedGroups.length})
            </Label>
          </div>
        </div>
        <Button 
          size="lg" 
          onClick={() => navigate('/admin/groups/new')}
          className="text-base md:text-lg px-4 md:px-6 w-full sm:w-auto"
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
            
            return (
              <Card 
                key={group.id} 
                className={`hover:shadow-md transition-shadow cursor-pointer ${isArchivedGroup ? 'opacity-60' : ''}`}
                onClick={() => navigate(`/admin/groups/${group.id}`)}
              >
                <CardContent className="p-4 md:p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 md:gap-3 mb-2 flex-wrap">
                        <h3 className="text-lg md:text-xl font-bold truncate">{group.groupName}</h3>
                        <span className={`px-2 md:px-3 py-1 rounded-full text-xs md:text-sm font-medium ${statusColors[status]}`}>
                          {statusLabels[status]}
                        </span>
                        {isArchivedGroup && (
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300">
                            <Archive className="w-3 h-3 inline ml-1" />
                            ארכיון
                          </span>
                        )}
                        {group.upgradedCoffee && (
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
                            ☕ קפה משודרג
                          </span>
                        )}
                      </div>
                      
                      <div className="flex flex-wrap gap-2 md:gap-4 text-xs md:text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 md:w-4 md:h-4" />
                          <span>
                            {format(parseISO(group.startDate), 'd MMM', { locale: he })} - {format(parseISO(group.endDate), 'd MMM', { locale: he })}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="w-3 h-3 md:w-4 md:h-4" />
                          <span>{group.pax} אנשים</span>
                        </div>
                        {group.contactPhone && (
                          <div className="flex items-center gap-1">
                            <Phone className="w-3 h-3 md:w-4 md:h-4" />
                            <span className="hidden sm:inline">{group.contactPhone}</span>
                          </div>
                        )}
                      </div>
                      
                      {/* Remaining allocation counters */}
                      {group.groupType !== 'יום ללא לינה' && (group.staffCount || group.participantCount) && (
                        <div className="mt-2 md:mt-3 flex flex-wrap gap-1 md:gap-2">
                          {(group.staffCount !== undefined && group.staffCount > 0) && (() => {
                            const remaining = group.remainingStaff ?? group.staffCount;
                            const total = group.staffCount;
                            const assigned = total - remaining;
                            return (
                              <span className="px-2 py-0.5 rounded-full text-[10px] md:text-xs font-medium bg-amber-100 text-amber-800">
                                צוות: {assigned}/{total}
                              </span>
                            );
                          })()}
                          {(group.participantCount !== undefined && group.participantCount > 0) && (() => {
                            const remaining = group.remainingParticipants ?? group.participantCount;
                            const total = group.participantCount;
                            const assigned = total - remaining;
                            return (
                              <span className="px-2 py-0.5 rounded-full text-[10px] md:text-xs font-medium bg-blue-100 text-blue-800">
                                חניכים: {assigned}/{total}
                              </span>
                            );
                          })()}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {/* Action buttons */}
                      {isArchivedGroup ? (
                        <>
                          <Button 
                            variant="outline" 
                            size="icon"
                            onClick={(e) => handleRestoreClick(e, group)}
                            title="שחזר מהארכיון"
                          >
                            <RotateCcw className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="icon"
                            onClick={(e) => handleDirectPermanentDelete(e, group)}
                            title="מחיקה לצמיתות"
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </>
                      ) : (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={(e) => handleRemoveClick(e, group)}
                          className="gap-2"
                        >
                          <XCircle className="w-4 h-4" />
                          הסר קבוצה
                        </Button>
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

      {/* Choice Modal: Archive vs Permanent Delete */}
      <AlertDialog open={choiceDialogOpen} onOpenChange={setChoiceDialogOpen}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <XCircle className="w-5 h-5 text-primary" />
              הסרת קבוצה
            </AlertDialogTitle>
            <AlertDialogDescription className="text-right">
              מה ברצונך לעשות עם הקבוצה '{selectedGroup?.groupName}'?
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          {/* Show linked records info if any */}
          {selectedGroup && getLinkedRecordsDescription(selectedGroup.id, selectedGroup.groupName) && (
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3 text-sm">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                <span className="text-amber-800 dark:text-amber-200">
                  לקבוצה זו יש נתונים משויכים: {getLinkedRecordsDescription(selectedGroup.id, selectedGroup.groupName)}
                </span>
              </div>
            </div>
          )}
          
          <AlertDialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
            <AlertDialogCancel>ביטול</AlertDialogCancel>
            <Button
              onClick={handleArchiveChoice}
              className="gap-2"
            >
              <Archive className="w-4 h-4" />
              העבר לארכיון
            </Button>
            <Button
              variant="destructive"
              onClick={handlePermanentDeleteChoice}
              className="gap-2"
            >
              <Trash2 className="w-4 h-4" />
              מחיקה לצמיתות
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Permanent Delete Confirmation Modal */}
      <AlertDialog open={confirmDeleteDialogOpen} onOpenChange={setConfirmDeleteDialogOpen}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="w-5 h-5" />
              מחיקה לצמיתות
            </AlertDialogTitle>
            <AlertDialogDescription className="text-right">
              <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 text-destructive">
                האם אתה בטוח שברצונך למחוק את הקבוצה '{selectedGroup?.groupName}'?
                <br /><br />
                פעולה זו תמחק את הקבוצה ואת כל המידע המשויך אליה (שיבוצים/הזמנות/ארוחות).
                <br />
                <strong>לא ניתן לשחזר.</strong>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row-reverse gap-2">
            <AlertDialogCancel>ביטול</AlertDialogCancel>
            <Button
              variant="destructive"
              onClick={confirmPermanentDelete}
              className="gap-2"
            >
              <Trash2 className="w-4 h-4" />
              מחק לצמיתות
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Restore Confirmation Dialog */}
      <AlertDialog open={restoreDialogOpen} onOpenChange={setRestoreDialogOpen}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <RotateCcw className="w-5 h-5 text-primary" />
              שחזור מארכיון
            </AlertDialogTitle>
            <AlertDialogDescription className="text-right">
              האם לשחזר את הקבוצה '{selectedGroup?.groupName}' מהארכיון?
              <br />
              הקבוצה תוצג שוב ברשימה הפעילה.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row-reverse gap-2">
            <AlertDialogCancel>ביטול</AlertDialogCancel>
            <AlertDialogAction onClick={confirmRestore}>
              שחזר
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
};

export default AdminGroups;