import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAdminGroups } from '@/hooks/useAdminGroups';
import { 
  GroupRecord, 
  ScheduleItem, 
  ScheduleCategory,
  SCHEDULE_LOCATIONS, 
  SCHEDULE_CATEGORY_LABELS 
} from '@/types/adminGroups';
import { BreadcrumbNav } from '@/components/BreadcrumbNav';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { 
  Users, 
  Save, 
  Calendar, 
  Phone, 
  Plus,
  Trash2,
  Loader2,
  ArrowRight,
  Clock
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { he } from 'date-fns/locale';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const emptyScheduleItem = (): ScheduleItem => ({
  id: Math.random().toString(36).substring(2, 11),
  date: format(new Date(), 'yyyy-MM-dd'),
  startTime: '09:00',
  endTime: '',
  category: 'ACTIVITY',
  location: '',
  description: '',
});

const AdminGroupEdit = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isNew = id === 'new';
  const { groups, isLoading, addGroup, updateGroup, getGroup } = useAdminGroups();

  const [formData, setFormData] = useState<Omit<GroupRecord, 'id' | 'createdAt' | 'updatedAt'>>({
    groupName: '',
    reservedBy: '',
    contactPhone: '',
    pax: 10,
    startDate: format(new Date(), 'yyyy-MM-dd'),
    endDate: format(new Date(), 'yyyy-MM-dd'),
    notes: '',
    scheduleItems: [],
    status: 'PLANNED',
  });

  useEffect(() => {
    if (!isNew && id) {
      const existing = getGroup(id);
      if (existing) {
        setFormData({
          groupName: existing.groupName,
          reservedBy: existing.reservedBy,
          contactPhone: existing.contactPhone || '',
          pax: existing.pax,
          startDate: existing.startDate,
          endDate: existing.endDate,
          notes: existing.notes || '',
          scheduleItems: existing.scheduleItems,
          status: existing.status,
        });
      }
    }
  }, [isNew, id, getGroup]);

  const handleSave = () => {
    if (!formData.groupName.trim()) {
      toast.error('נא להזין שם קבוצה');
      return;
    }
    if (!formData.reservedBy.trim()) {
      toast.error('נא להזין שם מזמין');
      return;
    }
    if (formData.pax < 1) {
      toast.error('נא להזין מספר אנשים');
      return;
    }

    if (isNew) {
      addGroup(formData);
      toast.success('הקבוצה נוצרה בהצלחה');
    } else if (id) {
      updateGroup(id, formData);
      toast.success('הקבוצה עודכנה בהצלחה');
    }
    navigate('/admin/groups');
  };

  const addScheduleItem = () => {
    setFormData(prev => ({
      ...prev,
      scheduleItems: [...prev.scheduleItems, emptyScheduleItem()],
    }));
  };

  const updateScheduleItem = (itemId: string, updates: Partial<ScheduleItem>) => {
    setFormData(prev => ({
      ...prev,
      scheduleItems: prev.scheduleItems.map(item =>
        item.id === itemId ? { ...item, ...updates } : item
      ),
    }));
  };

  const removeScheduleItem = (itemId: string) => {
    setFormData(prev => ({
      ...prev,
      scheduleItems: prev.scheduleItems.filter(item => item.id !== itemId),
    }));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <header className="bg-card border-b-2 border-border">
        <div className="container py-6">
          <BreadcrumbNav items={[
            { label: 'ניהול', path: '/settings' },
            { label: 'קבוצות', path: '/admin/groups' },
            { label: isNew ? 'קבוצה חדשה' : formData.groupName || 'עריכה' }
          ]} />
          <div className="flex items-center justify-between">
            <h1 className="text-3xl md:text-4xl font-bold flex items-center gap-3">
              <Users className="w-10 h-10" />
              {isNew ? 'קבוצה חדשה' : 'עריכת קבוצה'}
            </h1>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => navigate('/admin/groups')}>
                ביטול
              </Button>
              <Button size="lg" onClick={handleSave}>
                <Save className="w-5 h-5 ml-2" />
                שמור
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container py-6 space-y-6">
        {/* Basic Info Card */}
        <Card>
          <CardHeader>
            <CardTitle>פרטי הקבוצה</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">שם הקבוצה *</label>
                <Input
                  value={formData.groupName}
                  onChange={(e) => setFormData(prev => ({ ...prev, groupName: e.target.value }))}
                  placeholder="לדוגמה: קבוצת בני עקיבא"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">מי מבצע את ההזמנה *</label>
                <Input
                  value={formData.reservedBy}
                  onChange={(e) => setFormData(prev => ({ ...prev, reservedBy: e.target.value }))}
                  placeholder="שם המזמין"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">טלפון (אופציונלי)</label>
                <Input
                  type="tel"
                  value={formData.contactPhone}
                  onChange={(e) => setFormData(prev => ({ ...prev, contactPhone: e.target.value }))}
                  placeholder="050-0000000"
                  dir="ltr"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">כמות אנשים *</label>
                <Input
                  type="number"
                  min={1}
                  value={formData.pax}
                  onChange={(e) => setFormData(prev => ({ ...prev, pax: parseInt(e.target.value) || 0 }))}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">תאריך התחלה</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-right">
                      <Calendar className="ml-2 h-4 w-4" />
                      {format(parseISO(formData.startDate), 'd בMMMM yyyy', { locale: he })}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarComponent
                      mode="single"
                      selected={parseISO(formData.startDate)}
                      onSelect={(date) => date && setFormData(prev => ({ 
                        ...prev, 
                        startDate: format(date, 'yyyy-MM-dd') 
                      }))}
                      initialFocus
                      className={cn("p-3 pointer-events-auto")}
                    />
                  </PopoverContent>
                </Popover>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">תאריך סיום</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-right">
                      <Calendar className="ml-2 h-4 w-4" />
                      {format(parseISO(formData.endDate), 'd בMMMM yyyy', { locale: he })}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarComponent
                      mode="single"
                      selected={parseISO(formData.endDate)}
                      onSelect={(date) => date && setFormData(prev => ({ 
                        ...prev, 
                        endDate: format(date, 'yyyy-MM-dd') 
                      }))}
                      initialFocus
                      className={cn("p-3 pointer-events-auto")}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">מידע / הערות</label>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="הערות נוספות על הקבוצה..."
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Schedule Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              לו״ז הקבוצה
            </CardTitle>
            <Button onClick={addScheduleItem} variant="outline" size="sm">
              <Plus className="w-4 h-4 ml-1" />
              הוסף שורה
            </Button>
          </CardHeader>
          <CardContent>
            {formData.scheduleItems.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Clock className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>אין פריטים בלו״ז</p>
                <Button onClick={addScheduleItem} variant="link" className="mt-2">
                  <Plus className="w-4 h-4 ml-1" />
                  הוסף פריט ראשון
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {formData.scheduleItems.map((item, index) => (
                  <div key={item.id} className="p-4 bg-muted/50 rounded-lg space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-muted-foreground">פריט {index + 1}</span>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => removeScheduleItem(item.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div className="space-y-1">
                        <label className="text-xs text-muted-foreground">תאריך</label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant="outline" size="sm" className="w-full justify-start text-right">
                              {format(parseISO(item.date), 'd/M', { locale: he })}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <CalendarComponent
                              mode="single"
                              selected={parseISO(item.date)}
                              onSelect={(date) => date && updateScheduleItem(item.id, { 
                                date: format(date, 'yyyy-MM-dd') 
                              })}
                              initialFocus
                              className={cn("p-3 pointer-events-auto")}
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                      
                      <div className="space-y-1">
                        <label className="text-xs text-muted-foreground">שעת התחלה</label>
                        <Input
                          type="time"
                          value={item.startTime}
                          onChange={(e) => updateScheduleItem(item.id, { startTime: e.target.value })}
                          className="h-9"
                        />
                      </div>
                      
                      <div className="space-y-1">
                        <label className="text-xs text-muted-foreground">שעת סיום</label>
                        <Input
                          type="time"
                          value={item.endTime || ''}
                          onChange={(e) => updateScheduleItem(item.id, { endTime: e.target.value })}
                          className="h-9"
                        />
                      </div>
                      
                      <div className="space-y-1">
                        <label className="text-xs text-muted-foreground">קטגוריה</label>
                        <Select 
                          value={item.category}
                          onValueChange={(value: ScheduleCategory) => updateScheduleItem(item.id, { category: value })}
                        >
                          <SelectTrigger className="h-9">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {(Object.keys(SCHEDULE_CATEGORY_LABELS) as ScheduleCategory[]).map(cat => (
                              <SelectItem key={cat} value={cat}>
                                {SCHEDULE_CATEGORY_LABELS[cat]}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-xs text-muted-foreground">מיקום</label>
                        <Select 
                          value={item.location}
                          onValueChange={(value) => updateScheduleItem(item.id, { location: value })}
                        >
                          <SelectTrigger className="h-9">
                            <SelectValue placeholder="בחר מיקום" />
                          </SelectTrigger>
                          <SelectContent>
                            {SCHEDULE_LOCATIONS.map(loc => (
                              <SelectItem key={loc} value={loc}>
                                {loc}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-1">
                        <label className="text-xs text-muted-foreground">תיאור</label>
                        <Input
                          value={item.description}
                          onChange={(e) => updateScheduleItem(item.id, { description: e.target.value })}
                          placeholder="תיאור הפעילות..."
                          className="h-9"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Bottom Save Button */}
        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={() => navigate('/admin/groups')}>
            ביטול
          </Button>
          <Button size="lg" onClick={handleSave}>
            <Save className="w-5 h-5 ml-2" />
            שמור
          </Button>
        </div>
      </main>
    </div>
  );
};

export default AdminGroupEdit;
