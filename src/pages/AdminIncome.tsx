import React, { useState, useMemo } from 'react';
import { AdminLayout } from '@/components/AdminLayout';
import { AdminDateRangeFilter } from '@/components/AdminDateRangeFilter';
import { useAdminFinance } from '@/hooks/useAdminFinance';
import { useAdminGroups } from '@/hooks/useAdminGroups';
import { DateRangeOption, IncomeEntry } from '@/types/adminFinance';
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
import { Plus, Pencil, Trash2, DollarSign, Loader2 } from 'lucide-react';
import { format, parseISO, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import { he } from 'date-fns/locale';

const AdminIncome = () => {
  const { income, isLoading, addIncome, updateIncome, deleteIncome } = useAdminFinance();
  const { groups } = useAdminGroups();

  // Date range state
  const [dateRange, setDateRange] = useState<DateRangeOption>('month');
  const [customStart, setCustomStart] = useState<string>('');
  const [customEnd, setCustomEnd] = useState<string>('');

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<IncomeEntry | null>(null);
  const [formData, setFormData] = useState({ date: '', source: '', amount: '', notes: '' });

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

  // Filter income by date range
  const filteredIncome = useMemo(() => {
    return income.filter((entry) => {
      const entryDate = parseISO(entry.date);
      return isWithinInterval(entryDate, dateRangeBounds);
    });
  }, [income, dateRangeBounds]);

  // Calculate totals
  const totals = useMemo(() => {
    const manualTotal = filteredIncome.reduce((sum, e) => sum + e.amount, 0);
    // Group payments - check if groups have a paidAmount field
    const groupsTotal = groups
      .filter((g) => {
        const start = parseISO(g.startDate);
        return isWithinInterval(start, dateRangeBounds);
      })
      .reduce((sum, g) => sum + ((g as any).paidAmount || 0), 0);
    return {
      manual: manualTotal,
      groups: groupsTotal,
      total: manualTotal + groupsTotal,
    };
  }, [filteredIncome, groups, dateRangeBounds]);

  const openAddModal = () => {
    setEditingEntry(null);
    setFormData({ date: format(new Date(), 'yyyy-MM-dd'), source: '', amount: '', notes: '' });
    setIsModalOpen(true);
  };

  const openEditModal = (entry: IncomeEntry) => {
    setEditingEntry(entry);
    setFormData({
      date: entry.date,
      source: entry.source,
      amount: entry.amount.toString(),
      notes: entry.notes || '',
    });
    setIsModalOpen(true);
  };

  const handleSave = () => {
    const data = {
      date: formData.date,
      source: formData.source,
      amount: parseFloat(formData.amount) || 0,
      notes: formData.notes || undefined,
    };
    if (editingEntry) {
      updateIncome(editingEntry.id, data);
    } else {
      addIncome(data);
    }
    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    if (confirm('למחוק את הרשומה?')) {
      deleteIncome(id);
    }
  };

  if (isLoading) {
    return (
      <AdminLayout title="הכנסות" subtitle="ניהול הכנסות ותקבולים" section="management">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-12 h-12 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="הכנסות" subtitle="ניהול הכנסות ותקבולים" section="management">
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-primary/10 rounded-full">
                <DollarSign className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">סה״כ הכנסות</p>
                <p className="text-2xl font-bold">₪{totals.total.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">סה״כ שולם מקבוצות</p>
            <p className="text-2xl font-bold">₪{totals.groups.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">סה״כ הכנסות ידניות</p>
            <p className="text-2xl font-bold">₪{totals.manual.toLocaleString()}</p>
          </CardContent>
        </Card>
      </div>

      {/* Income Table */}
      <div className="mt-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">הכנסות ידניות</h2>
          <Button onClick={openAddModal}>
            <Plus className="w-4 h-4 ml-2" />
            הוספת הכנסה
          </Button>
        </div>

        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>תאריך</TableHead>
                <TableHead>מקור</TableHead>
                <TableHead>סכום</TableHead>
                <TableHead>הערות</TableHead>
                <TableHead className="w-24">פעולות</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredIncome.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    אין רשומות הכנסה בטווח הנבחר
                  </TableCell>
                </TableRow>
              ) : (
                filteredIncome.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell>{format(parseISO(entry.date), 'd MMM yyyy', { locale: he })}</TableCell>
                    <TableCell>{entry.source}</TableCell>
                    <TableCell className="font-medium">₪{entry.amount.toLocaleString()}</TableCell>
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
            <DialogTitle>{editingEntry ? 'עריכת הכנסה' : 'הוספת הכנסה'}</DialogTitle>
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
              <label className="text-sm font-medium">מקור</label>
              <Input
                value={formData.source}
                onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                placeholder="מאיפה ההכנסה?"
              />
            </div>
            <div>
              <label className="text-sm font-medium">סכום (₪)</label>
              <Input
                type="number"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                placeholder="0"
              />
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
            <Button onClick={handleSave} disabled={!formData.date || !formData.source || !formData.amount}>
              {editingEntry ? 'עדכון' : 'הוספה'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminIncome;
