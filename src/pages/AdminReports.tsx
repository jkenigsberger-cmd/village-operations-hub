import React, { useState, useMemo } from 'react';
import { AdminLayout } from '@/components/AdminLayout';
import { AdminDateRangeFilter } from '@/components/AdminDateRangeFilter';
import { useAdminFinance } from '@/hooks/useAdminFinance';
import { useAdminGroups } from '@/hooks/useAdminGroups';
import { DateRangeOption } from '@/types/adminFinance';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, Receipt, UserCheck, TrendingUp, TrendingDown, Loader2 } from 'lucide-react';
import { parseISO, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, isWithinInterval, format } from 'date-fns';
import { he } from 'date-fns/locale';

const AdminReports = () => {
  const { income, expenses, outsourced, isLoading } = useAdminFinance();
  const { groups } = useAdminGroups();

  // Date range state
  const [dateRange, setDateRange] = useState<DateRangeOption>('month');
  const [customStart, setCustomStart] = useState<string>('');
  const [customEnd, setCustomEnd] = useState<string>('');

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

  // Calculate all totals
  const reportData = useMemo(() => {
    // Manual income
    const filteredIncome = income.filter((e) => isWithinInterval(parseISO(e.date), dateRangeBounds));
    const manualIncomeTotal = filteredIncome.reduce((sum, e) => sum + e.amount, 0);

    // Group payments
    const filteredGroups = groups.filter((g) => isWithinInterval(parseISO(g.startDate), dateRangeBounds));
    const groupPaymentsTotal = filteredGroups.reduce((sum, g) => sum + ((g as any).paidAmount || 0), 0);

    const totalIncome = manualIncomeTotal + groupPaymentsTotal;

    // Expenses
    const filteredExpenses = expenses.filter((e) => isWithinInterval(parseISO(e.date), dateRangeBounds));
    const totalExpenses = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);

    // Category breakdown for expenses
    const expenseByCategory: Record<string, number> = {};
    filteredExpenses.forEach((e) => {
      expenseByCategory[e.category] = (expenseByCategory[e.category] || 0) + e.amount;
    });
    const topExpenseCategories = Object.entries(expenseByCategory)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    // Outsourced
    const filteredOutsourced = outsourced.filter((e) => isWithinInterval(parseISO(e.date), dateRangeBounds));
    const totalOutsourced = filteredOutsourced.reduce((sum, e) => sum + (e.total || 0), 0);

    // Net result
    const netResult = totalIncome - totalExpenses - totalOutsourced;

    // Biggest groups by payment
    const biggestGroups = filteredGroups
      .filter((g) => (g as any).paidAmount > 0)
      .sort((a, b) => ((b as any).paidAmount || 0) - ((a as any).paidAmount || 0))
      .slice(0, 5);

    return {
      totalIncome,
      manualIncomeTotal,
      groupPaymentsTotal,
      totalExpenses,
      totalOutsourced,
      netResult,
      topExpenseCategories,
      biggestGroups,
    };
  }, [income, expenses, outsourced, groups, dateRangeBounds]);

  if (isLoading) {
    return (
      <AdminLayout title="דוחות" subtitle="סיכום פיננסי">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-12 h-12 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  const isPositive = reportData.netResult >= 0;

  return (
    <AdminLayout title="דוחות" subtitle="סיכום פיננסי">
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-full">
                <DollarSign className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">סה״כ הכנסות</p>
                <p className="text-2xl font-bold">₪{reportData.totalIncome.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-full">
                <Receipt className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">סה״כ הוצאות</p>
                <p className="text-2xl font-bold">₪{reportData.totalExpenses.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-full">
                <UserCheck className="w-6 h-6 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">עובדים חיצוניים</p>
                <p className="text-2xl font-bold">₪{reportData.totalOutsourced.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className={isPositive ? 'border-green-500' : 'border-red-500'}>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className={`p-3 rounded-full ${isPositive ? 'bg-green-100 dark:bg-green-900/30' : 'bg-red-100 dark:bg-red-900/30'}`}>
                {isPositive ? (
                  <TrendingUp className="w-6 h-6 text-green-600 dark:text-green-400" />
                ) : (
                  <TrendingDown className="w-6 h-6 text-red-600 dark:text-red-400" />
                )}
              </div>
              <div>
                <p className="text-sm text-muted-foreground">תוצאה</p>
                <p className={`text-2xl font-bold ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                  ₪{reportData.netResult.toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Breakdown Lists */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        {/* Top Expense Categories */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">הוצאות לפי קטגוריה</CardTitle>
          </CardHeader>
          <CardContent>
            {reportData.topExpenseCategories.length === 0 ? (
              <p className="text-muted-foreground">אין הוצאות בטווח הנבחר</p>
            ) : (
              <div className="space-y-3">
                {reportData.topExpenseCategories.map(([category, amount]) => (
                  <div key={category} className="flex justify-between items-center">
                    <span>{category}</span>
                    <span className="font-medium">₪{amount.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Biggest Groups */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">קבוצות לפי סכום ששולם</CardTitle>
          </CardHeader>
          <CardContent>
            {reportData.biggestGroups.length === 0 ? (
              <p className="text-muted-foreground">אין קבוצות עם תשלום בטווח הנבחר</p>
            ) : (
              <div className="space-y-3">
                {reportData.biggestGroups.map((group) => (
                  <div key={group.id} className="flex justify-between items-center">
                    <span>{group.groupName}</span>
                    <span className="font-medium">₪{((group as any).paidAmount || 0).toLocaleString()}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Info note */}
      <Card className="mt-6 bg-muted/30">
        <CardContent className="p-4">
          <p className="text-sm text-muted-foreground">
            * דוח זה הינו אינפורמטיבי בלבד ואינו מהווה דוח חשבונאי מוסמך.
            הנתונים מחושבים על סמך הרשומות שהוזנו לטווח התאריכים הנבחר.
          </p>
        </CardContent>
      </Card>
    </AdminLayout>
  );
};

export default AdminReports;
