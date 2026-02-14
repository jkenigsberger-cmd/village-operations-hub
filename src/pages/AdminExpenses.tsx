import React, { useState, useMemo } from 'react';
import { AdminLayout } from '@/components/AdminLayout';
import { AdminDateRangeFilter } from '@/components/AdminDateRangeFilter';
import { useAdminFinance } from '@/hooks/useAdminFinance';
import { DateRangeOption, ExpenseEntry, EXPENSE_CATEGORIES, ExpenseCategory } from '@/types/adminFinance';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Pencil, Trash2, Receipt, Loader2 } from 'lucide-react';
import { format, parseISO, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import { he } from 'date-fns/locale';

const AdminExpenses = () => {
  const { expenses, isLoading, addExpense, updateExpense, deleteExpense } = useAdminFinance();

  // Date range state
  const [dateRange, setDateRange] = useState<DateRangeOption>('month');
  const [customStart, setCustomStart] = useState<string>('');
  const [customEnd, setCustomEnd] = useState<string>('');

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<ExpenseEntry | null>(null);
  const [formData, setFormData] = useState({ date: '', category: 'אחר' as ExpenseCategory, amount: '', notes: '' });

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

  // Filter expenses by date range
  const filteredExpenses = useMemo(() => {
    return expenses.filter((entry) => {
      const entryDate = parseISO(entry.date);
      return isWithinInterval(entryDate, dateRangeBounds);
    });
  }, [expenses, dateRangeBounds]);

  // Calculate total
  const totalExpenses = useMemo(() => {
    return filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
  }, [filteredExpenses]);

  // Category breakdown
  const categoryBreakdown = useMemo(() => {
    const breakdown: Record<string, number> = {};
    filteredExpenses.forEach((e) => {
      breakdown[e.category] = (breakdown[e.category] || 0) + e.amount;
    });
    return Object.entries(breakdown).sort((a, b) => b[1] - a[1]);
  }, [filteredExpenses]);

  const openAddModal = () => {
    setEditingEntry(null);
    setFormData({ date: format(new Date(), 'yyyy-MM-dd'), category: 'אחר', amount: '', notes: '' });
    setIsModalOpen(true);
  };

  const openEditModal = (entry: ExpenseEntry) => {
    setEditingEntry(entry);
    setFormData({
      date: entry.date,
      category: entry.category,
      amount: entry.amount.toString(),
      notes: entry.notes || '',
    });
    setIsModalOpen(true);
  };

  const handleSave = () => {
    const data = {
      date: formData.date,
      category: formData.category,
      amount: parseFloat(formData.amount) || 0,
      notes: formData.notes || undefined,
    };
    if (editingEntry) {
      updateExpense(editingEntry.id, data);
    } else {
      addExpense(data);
    }
    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    if (confirm('למחוק את הרשומה?')) {
      deleteExpense(id);
    }
  };

  if (isLoading) {
    return (
      <AdminLayout title="הוצאות" subtitle="ניהול הוצאות" section="management">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-12 h-12 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="הוצאות" subtitle="ניהול הוצאות" section="management">
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
              <div className="p-3 bg-destructive/10 rounded-full">
                <Receipt className="w-6 h-6 text-destructive" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">סה״כ הוצאות</p>
                <p className="text-2xl font-bold">₪{totalExpenses.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground mb-2">פילוח לפי קטגוריה</p>
            <div className="space-y-1">
              {categoryBreakdown.map(([cat, amount]) => (
                <div key={cat} className="flex justify-between text-sm">
                  <span>{cat}</span>
                  <span className="font-medium">₪{amount.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Expenses Table */}
      <div className="mt-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">רשימת הוצאות</h2>
          <Button onClick={openAddModal}>
            <Plus className="w-4 h-4 ml-2" />
            הוספת הוצאה
          </Button>
        </div>

        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>תאריך</TableHead>
                <TableHead>קטגוריה</TableHead>
                <TableHead>סכום</TableHead>
                <TableHead>הערות</TableHead>
                <TableHead className="w-24">פעולות</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredExpenses.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    אין רשומות הוצאה בטווח הנבחר
                  </TableCell>
                </TableRow>
              ) : (
                filteredExpenses.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell>{format(parseISO(entry.date), 'd MMM yyyy', { locale: he })}</TableCell>
                    <TableCell>{entry.category}</TableCell>
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
            <DialogTitle>{editingEntry ? 'עריכת הוצאה' : 'הוספת הוצאה'}</DialogTitle>
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
              <label className="text-sm font-medium">קטגוריה</label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData({ ...formData, category: value as ExpenseCategory })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {EXPENSE_CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
            <Button onClick={handleSave} disabled={!formData.date || !formData.amount}>
              {editingEntry ? 'עדכון' : 'הוספה'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminExpenses;
