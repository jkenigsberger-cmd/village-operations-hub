import React, { useState, useMemo } from 'react';
import { useVillage } from '@/context/VillageContext';
import { useAdminGroups } from '@/hooks/useAdminGroups';
import { DailyTask, DailyTaskType, DailyTaskStatus } from '@/types/village';
import { format, addDays, subDays } from 'date-fns';
import { he } from 'date-fns/locale';
import { 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Check, 
  Clock, 
  Trash2,
  ClipboardList,
  Sparkles,
  LogIn,
  LogOut,
  Wrench,
  FileText
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
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { toast } from 'sonner';

const taskTypeConfig: Record<DailyTaskType, { label: string; icon: React.ElementType; color: string }> = {
  CLEANING: { label: 'ניקיון', icon: Sparkles, color: 'bg-blue-100 text-blue-700 border-blue-300' },
  CHECKOUT: { label: 'CHECK OUT', icon: LogOut, color: 'bg-orange-100 text-orange-700 border-orange-300' },
  CHECKIN: { label: 'CHECK IN', icon: LogIn, color: 'bg-green-100 text-green-700 border-green-300' },
  MAINTENANCE: { label: 'תחזוקה', icon: Wrench, color: 'bg-red-100 text-red-700 border-red-300' },
  CUSTOM: { label: 'אחר', icon: FileText, color: 'bg-gray-100 text-gray-700 border-gray-300' },
};

const statusConfig: Record<DailyTaskStatus, { label: string; color: string }> = {
  PENDING: { label: 'ממתין', color: 'bg-yellow-100 text-yellow-700' },
  IN_PROGRESS: { label: 'בתהליך', color: 'bg-blue-100 text-blue-700' },
  COMPLETED: { label: 'הושלם', color: 'bg-green-100 text-green-700' },
};

export const DailyTasksCalendar: React.FC = () => {
  const { getDailyTasks, addDailyTask, updateDailyTaskStatus, removeDailyTask, getTodaySummary } = useVillage();
  const { archivedGroups } = useAdminGroups();
  
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [newTask, setNewTask] = useState<Partial<DailyTask>>({
    type: 'CUSTOM',
    title: '',
    description: '',
    status: 'PENDING',
  });

  // Get archived group names to filter them out
  const archivedGroupNames = useMemo(() => 
    new Set(archivedGroups.map(g => g.groupName)), 
    [archivedGroups]
  );

  const dateStr = format(selectedDate, 'yyyy-MM-dd');
  const tasks = getDailyTasks(dateStr);
  const rawTodaySummary = getTodaySummary();

  // Filter out archived groups from today summary
  const todaySummary = useMemo(() => ({
    ...rawTodaySummary,
    checkIns: rawTodaySummary.checkIns.filter(t => !t.groupName || !archivedGroupNames.has(t.groupName)),
    checkOuts: rawTodaySummary.checkOuts.filter(t => !t.groupName || !archivedGroupNames.has(t.groupName)),
    tentsToCleaning: rawTodaySummary.tentsToCleaning.filter(t => !t.groupName || !archivedGroupNames.has(t.groupName)),
  }), [rawTodaySummary, archivedGroupNames]);

  // Auto-generated tasks from check-ins/check-outs/cleaning
  const autoTasks = useMemo(() => {
    const today = format(new Date(), 'yyyy-MM-dd');
    if (dateStr !== today) return [];

    const generated: { type: DailyTaskType; title: string; description: string }[] = [];

    todaySummary.checkOuts.forEach(tent => {
      generated.push({
        type: 'CHECKOUT',
        title: `CHECK OUT: ${tent.code}`,
        description: tent.groupName ? `קבוצה: ${tent.groupName}` : '',
      });
    });

    todaySummary.checkIns.forEach(tent => {
      generated.push({
        type: 'CHECKIN',
        title: `CHECK IN: ${tent.code}`,
        description: tent.groupName ? `קבוצה: ${tent.groupName}` : '',
      });
    });

    todaySummary.tentsToCleaning.forEach(tent => {
      generated.push({
        type: 'CLEANING',
        title: `ניקיון: ${tent.code}`,
        description: '',
      });
    });

    todaySummary.facilitiesNeedAttention.forEach(facility => {
      generated.push({
        type: 'MAINTENANCE',
        title: `טיפול: ${facility.label}`,
        description: facility.notes || '',
      });
    });

    return generated;
  }, [dateStr, todaySummary]);

  const handlePrevDay = () => setSelectedDate(subDays(selectedDate, 1));
  const handleNextDay = () => setSelectedDate(addDays(selectedDate, 1));

  const handleAddTask = () => {
    if (!newTask.title) {
      toast.error('יש להזין כותרת');
      return;
    }

    addDailyTask({
      date: dateStr,
      type: newTask.type || 'CUSTOM',
      title: newTask.title,
      description: newTask.description,
      status: 'PENDING',
    });

    toast.success('המשימה נוספה');
    setShowAddDialog(false);
    setNewTask({ type: 'CUSTOM', title: '', description: '', status: 'PENDING' });
  };

  const handleStatusChange = (taskId: string, status: DailyTaskStatus) => {
    updateDailyTaskStatus(taskId, status);
    if (status === 'COMPLETED') {
      toast.success('המשימה הושלמה ✓');
    }
  };

  const handleDelete = (taskId: string) => {
    removeDailyTask(taskId);
    toast.success('המשימה נמחקה');
  };

  const isToday = format(new Date(), 'yyyy-MM-dd') === dateStr;

  return (
    <div className="tile p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <ClipboardList className="w-6 h-6" />
          משימות היום
        </h2>

        {/* Date Navigation */}
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={handlePrevDay}>
            <ChevronLeft className="w-4 h-4" />
          </Button>

          <Popover open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" className="min-w-[200px]">
                {format(selectedDate, "EEEE, d בMMMM", { locale: he })}
                {isToday && <span className="ml-2 text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded">היום</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => {
                  if (date) {
                    setSelectedDate(date);
                    setIsDatePickerOpen(false);
                  }
                }}
                initialFocus
              />
            </PopoverContent>
          </Popover>

          <Button variant="outline" size="icon" onClick={handleNextDay}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Auto-generated tasks for today */}
      {isToday && autoTasks.length > 0 && (
        <div className="mb-6">
          <h3 className="font-semibold text-muted-foreground mb-3 text-sm uppercase">
            משימות אוטומטיות מהמערכת
          </h3>
          <div className="space-y-2">
            {autoTasks.map((task, idx) => {
              const config = taskTypeConfig[task.type];
              const Icon = config.icon;
              return (
                <div 
                  key={`auto-${idx}`}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-lg border",
                    config.color
                  )}
                >
                  <Icon className="w-5 h-5" />
                  <div className="flex-1">
                    <span className="font-medium">{task.title}</span>
                    {task.description && (
                      <span className="text-sm ml-2 opacity-75">{task.description}</span>
                    )}
                  </div>
                  <span className="text-xs px-2 py-1 bg-white/50 rounded">
                    {config.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Manual Tasks */}
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-semibold text-muted-foreground text-sm uppercase">
          משימות ידניות
        </h3>
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button size="sm" className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              הוסף משימה
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>משימה חדשה</DialogTitle>
              <DialogDescription>
                הוסף משימה ל-{format(selectedDate, "d בMMMM", { locale: he })}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>סוג משימה</Label>
                <Select 
                  value={newTask.type} 
                  onValueChange={(value) => setNewTask(prev => ({ ...prev, type: value as DailyTaskType }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="בחר סוג" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(taskTypeConfig).map(([key, config]) => (
                      <SelectItem key={key} value={key}>
                        <span className="flex items-center gap-2">
                          <config.icon className="w-4 h-4" />
                          {config.label}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="title">כותרת *</Label>
                <Input
                  id="title"
                  value={newTask.title}
                  onChange={(e) => setNewTask(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="לדוגמה: בדוק גנרטור"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">תיאור</Label>
                <Textarea
                  id="description"
                  value={newTask.description}
                  onChange={(e) => setNewTask(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="פרטים נוספים..."
                  rows={3}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                ביטול
              </Button>
              <Button onClick={handleAddTask}>
                <Plus className="w-4 h-4 mr-2" />
                הוסף
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {tasks.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <ClipboardList className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p>אין משימות ידניות ליום זה</p>
        </div>
      ) : (
        <div className="space-y-3">
          {tasks.map(task => {
            const typeConfig = taskTypeConfig[task.type];
            const sConfig = statusConfig[task.status];
            const Icon = typeConfig.icon;

            return (
              <div 
                key={task.id}
                className={cn(
                  "flex items-center gap-3 p-4 rounded-lg border-2 transition-all",
                  task.status === 'COMPLETED' ? 'opacity-60 bg-muted' : 'bg-card',
                  typeConfig.color.replace('bg-', 'border-').split(' ')[0]
                )}
              >
                <Icon className="w-5 h-5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className={cn(
                    "font-medium",
                    task.status === 'COMPLETED' && 'line-through'
                  )}>
                    {task.title}
                  </div>
                  {task.description && (
                    <div className="text-sm text-muted-foreground truncate">
                      {task.description}
                    </div>
                  )}
                </div>

                {/* Status badge */}
                <span className={cn("text-xs px-2 py-1 rounded", sConfig.color)}>
                  {sConfig.label}
                </span>

                {/* Actions */}
                <div className="flex items-center gap-1">
                  {task.status !== 'COMPLETED' && (
                    <>
                      {task.status === 'PENDING' && (
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => handleStatusChange(task.id, 'IN_PROGRESS')}
                          title="התחל"
                        >
                          <Clock className="w-4 h-4" />
                        </Button>
                      )}
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => handleStatusChange(task.id, 'COMPLETED')}
                        title="השלם"
                        className="text-green-600"
                      >
                        <Check className="w-4 h-4" />
                      </Button>
                    </>
                  )}
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => handleDelete(task.id)}
                    title="מחק"
                    className="text-red-600"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
