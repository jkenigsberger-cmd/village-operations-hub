import React, { useState, useMemo } from 'react';
import { AdminLayout } from '@/components/AdminLayout';
import { AdminDateRangeFilter } from '@/components/AdminDateRangeFilter';
import { useAdminFinance } from '@/hooks/useAdminFinance';
import { DateRangeOption, OutsourcedEntry } from '@/types/adminFinance';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Plus, Pencil, Trash2, UserCheck, Loader2 } from 'lucide-react';
import { format, parseISO, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import { he } from 'date-fns/locale';

const AdminOutsourced = () => {
  const { outsourced, isLoading, addOutsourced, updateOutsourced, deleteOutsourced } = useAdminFinance();

  // Date range state
  const [dateRange, setDateRange] = useState<DateRangeOption>('month');
  const [customStart, setCustomStart] = useState<string>('');
  const [customEnd, setCustomEnd] = useState<string>('');

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<OutsourcedEntry | null>(null);
  const [formData, setFormData] = useState({
    date: '',
    name: '',
    role: '',
    hours: '',
    hourlyRate: '',
    notes: '',
  });

  // Calculate date range bounds
  const dateRangeBounds = useMemo(() => {
    const now = new Date();
    switch (dateRange) {
      case 'today':
        return { start: startOfDay(now), end: endOfDay(now) };
      case 'week':
        return { start: startOfWeek(now, { locale: he }), end: endOfWeek(now, { locale: he }) };
      case 'month':
        return { start: startOfMonth(now), end: endOfMonth(now) };
      case 'custom':
        return {
          start: customStart ? startOfDay(parseISO(customStart)) : startOfMonth(now),
          end: customEnd ? endOfDay(parseISO(customEnd)) : endOfMonth(now),
        };
    }
  }, [dateRange, customStart, customEnd]);

  // Filter by date range
  const filteredOutsourced = useMemo(() => {
    return outsourced.filter((entry) => {
      const entryDate = parseISO(entry.date);
      return isWithinInterval(entryDate, dateRangeBounds);
    });
  }, [outsourced, dateRangeBounds]);

  // Calculate totals
  const totals = useMemo(() => {
    const totalHours = filteredOutsourced.reduce((sum, e) => sum + e.hours, 0);
    const totalCost = filteredOutsourced.reduce((sum, e) => sum + (e.total || 0), 0);
    return { hours: totalHours, cost: totalCost };
  }, [filteredOutsourced]);

  const openAddModal = () => {
    setEditingEntry(null);
    setFormData({
      date: format(new Date(), 'yyyy-MM-dd'),
      name: '',
      role: '',
      hours: '',
      hourlyRate: '',
      notes: '',
    });
    setIsModalOpen(true);
  };

  const openEditModal = (entry: OutsourcedEntry) => {
    setEditingEntry(entry);
    setFormData({
      date: entry.date,
      name: entry.name,
      role: entry.role,
      hours: entry.hours.toString(),
      hourlyRate: entry.hourlyRate?.toString() || '',
      notes: entry.notes || '',
    });
    setIsModalOpen(true);
  };

  const handleSave = () => {
    const data = {
      date: formData.date,
      name: formData.name,
      role: formData.role,
      hours: parseFloat(formData.hours) || 0,
      hourlyRate: formData.hourlyRate ? parseFloat(formData.hourlyRate) : undefined,
      notes: formData.notes || undefined,
    };
    if (editingEntry) {
      updateOutsourced(editingEntry.id, data);
    } else {
      addOutsourced(data);
    }
    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    if (confirm('למחוק את הרשומה?')) {
      deleteOutsourced(id);
    }
  };

  if (isLoading) {
    return (
      <AdminLayout title="עובדים חיצוניים" subtitle="ניהול שעות עובדים חיצוניים">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-12 h-12 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="עובדים חיצוניים" subtitle="ניהול שעות עובדים חיצוניים">
      {/* Date Range Filter */}
      <AdminDateRangeFilter
        selectedRange={dateRange}
        customStart={customStart}
        customEnd={customEnd}
        onRangeChange={setDateRange}
        onCustomStartChange={setCustomStart}
        onCustomEndChange={setCustomEnd}
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-primary/10 rounded-full">
                <UserCheck className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">סה״כ שעות</p>
                <p className="text-2xl font-bold">{totals.hours.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">סה״כ עלות</p>
            <p className="text-2xl font-bold">₪{totals.cost.toLocaleString()}</p>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <div className="mt-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">רשימת עובדים חיצוניים</h2>
          <Button onClick={openAddModal}>
            <Plus className="w-4 h-4 ml-2" />
            הוספת רשומה
          </Button>
        </div>

        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>תאריך</TableHead>
                <TableHead>שם / חברה</TableHead>
                <TableHead>תפקיד</TableHead>
                <TableHead>שעות</TableHead>
                <TableHead>תעריף</TableHead>
                <TableHead>סה״כ</TableHead>
                <TableHead>הערות</TableHead>
                <TableHead className="w-24">פעולות</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOutsourced.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                    אין רשומות בטווח הנבחר
                  </TableCell>
                </TableRow>
              ) : (
                filteredOutsourced.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell>{format(parseISO(entry.date), 'd MMM yyyy', { locale: he })}</TableCell>
                    <TableCell>{entry.name}</TableCell>
                    <TableCell>{entry.role}</TableCell>
                    <TableCell>{entry.hours}</TableCell>
                    <TableCell>{entry.hourlyRate ? `₪${entry.hourlyRate}` : '-'}</TableCell>
                    <TableCell className="font-medium">
                      {entry.total ? `₪${entry.total.toLocaleString()}` : '-'}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{entry.notes || '-'}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openEditModal(entry)}>
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(entry.id)}>
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>
      </div>

      {/* Add/Edit Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingEntry ? 'עריכת רשומה' : 'הוספת עובד חיצוני'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium">תאריך</label>
              <Input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm font-medium">שם / חברה</label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="שם העובד או החברה"
              />
            </div>
            <div>
              <label className="text-sm font-medium">תפקיד</label>
              <Input
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                placeholder="תפקיד או סוג עבודה"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">שעות</label>
                <Input
                  type="number"
                  value={formData.hours}
                  onChange={(e) => setFormData({ ...formData, hours: e.target.value })}
                  placeholder="0"
                />
              </div>
              <div>
                <label className="text-sm font-medium">תעריף לשעה (₪) - אופציונלי</label>
                <Input
                  type="number"
                  value={formData.hourlyRate}
                  onChange={(e) => setFormData({ ...formData, hourlyRate: e.target.value })}
                  placeholder="0"
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">הערות</label>
              <Input
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="הערות (אופציונלי)"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              ביטול
            </Button>
            <Button onClick={handleSave} disabled={!formData.date || !formData.name || !formData.hours}>
              {editingEntry ? 'עדכון' : 'הוספה'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminOutsourced;
