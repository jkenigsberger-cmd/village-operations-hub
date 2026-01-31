import { useState, useEffect, useCallback } from 'react';
import {
  IncomeEntry,
  ExpenseEntry,
  OutsourcedEntry,
  ADMIN_INCOME_STORAGE_KEY,
  ADMIN_EXPENSES_STORAGE_KEY,
  ADMIN_OUTSOURCED_STORAGE_KEY,
} from '@/types/adminFinance';

const generateId = () => Math.random().toString(36).substring(2, 11);

export const useAdminFinance = () => {
  const [income, setIncome] = useState<IncomeEntry[]>([]);
  const [expenses, setExpenses] = useState<ExpenseEntry[]>([]);
  const [outsourced, setOutsourced] = useState<OutsourcedEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const storedIncome = localStorage.getItem(ADMIN_INCOME_STORAGE_KEY);
      if (storedIncome) setIncome(JSON.parse(storedIncome));

      const storedExpenses = localStorage.getItem(ADMIN_EXPENSES_STORAGE_KEY);
      if (storedExpenses) setExpenses(JSON.parse(storedExpenses));

      const storedOutsourced = localStorage.getItem(ADMIN_OUTSOURCED_STORAGE_KEY);
      if (storedOutsourced) setOutsourced(JSON.parse(storedOutsourced));
    } catch (error) {
      console.error('Error loading admin finance data:', error);
    }
    setIsLoading(false);
  }, []);

  // Save income to localStorage
  const saveIncome = useCallback((newIncome: IncomeEntry[]) => {
    setIncome(newIncome);
    try {
      localStorage.setItem(ADMIN_INCOME_STORAGE_KEY, JSON.stringify(newIncome));
    } catch (error) {
      console.error('Error saving income:', error);
    }
  }, []);

  // Save expenses to localStorage
  const saveExpenses = useCallback((newExpenses: ExpenseEntry[]) => {
    setExpenses(newExpenses);
    try {
      localStorage.setItem(ADMIN_EXPENSES_STORAGE_KEY, JSON.stringify(newExpenses));
    } catch (error) {
      console.error('Error saving expenses:', error);
    }
  }, []);

  // Save outsourced to localStorage
  const saveOutsourced = useCallback((newOutsourced: OutsourcedEntry[]) => {
    setOutsourced(newOutsourced);
    try {
      localStorage.setItem(ADMIN_OUTSOURCED_STORAGE_KEY, JSON.stringify(newOutsourced));
    } catch (error) {
      console.error('Error saving outsourced:', error);
    }
  }, []);

  // Income CRUD
  const addIncome = useCallback((entry: Omit<IncomeEntry, 'id' | 'createdAt' | 'updatedAt'>) => {
    const now = new Date().toISOString();
    const newEntry: IncomeEntry = { ...entry, id: generateId(), createdAt: now, updatedAt: now };
    saveIncome([...income, newEntry]);
    return newEntry;
  }, [income, saveIncome]);

  const updateIncome = useCallback((id: string, updates: Partial<Omit<IncomeEntry, 'id' | 'createdAt'>>) => {
    const updated = income.map(e => e.id === id ? { ...e, ...updates, updatedAt: new Date().toISOString() } : e);
    saveIncome(updated);
  }, [income, saveIncome]);

  const deleteIncome = useCallback((id: string) => {
    saveIncome(income.filter(e => e.id !== id));
  }, [income, saveIncome]);

  // Expenses CRUD
  const addExpense = useCallback((entry: Omit<ExpenseEntry, 'id' | 'createdAt' | 'updatedAt'>) => {
    const now = new Date().toISOString();
    const newEntry: ExpenseEntry = { ...entry, id: generateId(), createdAt: now, updatedAt: now };
    saveExpenses([...expenses, newEntry]);
    return newEntry;
  }, [expenses, saveExpenses]);

  const updateExpense = useCallback((id: string, updates: Partial<Omit<ExpenseEntry, 'id' | 'createdAt'>>) => {
    const updated = expenses.map(e => e.id === id ? { ...e, ...updates, updatedAt: new Date().toISOString() } : e);
    saveExpenses(updated);
  }, [expenses, saveExpenses]);

  const deleteExpense = useCallback((id: string) => {
    saveExpenses(expenses.filter(e => e.id !== id));
  }, [expenses, saveExpenses]);

  // Outsourced CRUD
  const addOutsourced = useCallback((entry: Omit<OutsourcedEntry, 'id' | 'createdAt' | 'updatedAt' | 'total'>) => {
    const now = new Date().toISOString();
    const total = entry.hours && entry.hourlyRate ? entry.hours * entry.hourlyRate : undefined;
    const newEntry: OutsourcedEntry = { ...entry, id: generateId(), total, createdAt: now, updatedAt: now };
    saveOutsourced([...outsourced, newEntry]);
    return newEntry;
  }, [outsourced, saveOutsourced]);

  const updateOutsourced = useCallback((id: string, updates: Partial<Omit<OutsourcedEntry, 'id' | 'createdAt' | 'total'>>) => {
    const updated = outsourced.map(e => {
      if (e.id !== id) return e;
      const merged = { ...e, ...updates, updatedAt: new Date().toISOString() };
      merged.total = merged.hours && merged.hourlyRate ? merged.hours * merged.hourlyRate : undefined;
      return merged;
    });
    saveOutsourced(updated);
  }, [outsourced, saveOutsourced]);

  const deleteOutsourced = useCallback((id: string) => {
    saveOutsourced(outsourced.filter(e => e.id !== id));
  }, [outsourced, saveOutsourced]);

  return {
    income,
    expenses,
    outsourced,
    isLoading,
    addIncome,
    updateIncome,
    deleteIncome,
    addExpense,
    updateExpense,
    deleteExpense,
    addOutsourced,
    updateOutsourced,
    deleteOutsourced,
  };
};
