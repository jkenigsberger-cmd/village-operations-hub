// ============================================================
// ADMIN FINANCE DATA TYPES - Income, Expenses, Outsourced Workers
// ============================================================

export interface IncomeEntry {
  id: string;
  date: string; // YYYY-MM-DD
  source: string;
  amount: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ExpenseEntry {
  id: string;
  date: string; // YYYY-MM-DD
  category: ExpenseCategory;
  amount: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type ExpenseCategory = 'מטבח' | 'עובדים חיצוניים' | 'אחר';

export const EXPENSE_CATEGORIES: ExpenseCategory[] = ['מטבח', 'עובדים חיצוניים', 'אחר'];

export interface OutsourcedEntry {
  id: string;
  date: string; // YYYY-MM-DD
  name: string; // שם / חברה
  role: string; // תפקיד
  hours: number;
  hourlyRate?: number; // תעריף לשעה (optional)
  total?: number; // calculated = hours * hourlyRate
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// Storage keys for localStorage
export const ADMIN_INCOME_STORAGE_KEY = 'af_admin_income';
export const ADMIN_EXPENSES_STORAGE_KEY = 'af_admin_expenses';
export const ADMIN_OUTSOURCED_STORAGE_KEY = 'af_admin_outsourced';

// Date range filter options
export type DateRangeOption = 'today' | 'week' | 'month' | 'custom';

export const DATE_RANGE_LABELS: Record<DateRangeOption, string> = {
  today: 'היום',
  week: 'השבוע',
  month: 'החודש',
  custom: 'מותאם אישית',
};
