// @refresh reset - Force full refresh when this file changes
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  IncomeEntry,
  ExpenseEntry,
  OutsourcedEntry,
  ExpenseCategory,
} from '@/types/adminFinance';

const generateId = () => Math.random().toString(36).substring(2, 11);

export const useAdminFinance = () => {
  const [income, setIncome] = useState<IncomeEntry[]>([]);
  const [expenses, setExpenses] = useState<ExpenseEntry[]>([]);
  const [outsourced, setOutsourced] = useState<OutsourcedEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load all data from database
  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      
      const [incomeRes, expensesRes, outsourcedRes] = await Promise.all([
        supabase.from('income').select('*'),
        supabase.from('expenses').select('*'),
        supabase.from('outsourced').select('*'),
      ]);

      if (incomeRes.data) {
        setIncome(incomeRes.data.map(row => ({
          id: row.id,
          date: row.date,
          source: row.group_name, // Map group_name to source
          amount: Number(row.amount),
          notes: row.description || undefined,
          createdAt: row.created_at,
          updatedAt: row.updated_at,
        })));
      }

      if (expensesRes.data) {
        setExpenses(expensesRes.data.map(row => ({
          id: row.id,
          date: row.date,
          amount: Number(row.amount),
          category: row.category as ExpenseCategory,
          notes: row.description || undefined,
          createdAt: row.created_at,
          updatedAt: row.updated_at,
        })));
      }

      if (outsourcedRes.data) {
        setOutsourced(outsourcedRes.data.map(row => ({
          id: row.id,
          date: row.date,
          name: row.worker_name,
          role: row.role,
          hours: Number(row.hours),
          hourlyRate: Number(row.hourly_rate),
          total: Number(row.hours) * Number(row.hourly_rate),
          notes: row.notes || undefined,
          createdAt: row.created_at,
          updatedAt: row.updated_at,
        })));
      }
    } catch (error) {
      console.error('Error loading admin finance data:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  useEffect(() => {
    const channels = [
      supabase.channel('income-changes').on('postgres_changes', { event: '*', schema: 'public', table: 'income' }, () => loadData()),
      supabase.channel('expenses-changes').on('postgres_changes', { event: '*', schema: 'public', table: 'expenses' }, () => loadData()),
      supabase.channel('outsourced-changes').on('postgres_changes', { event: '*', schema: 'public', table: 'outsourced' }, () => loadData()),
    ];
    channels.forEach(c => c.subscribe());
    return () => { channels.forEach(c => supabase.removeChannel(c)); };
  }, [loadData]);

  const addIncome = useCallback(async (entry: Omit<IncomeEntry, 'id' | 'createdAt' | 'updatedAt'>) => {
    const id = generateId();
    const { error } = await supabase.from('income').insert({
      id, group_name: entry.source, date: entry.date, amount: entry.amount, description: entry.notes || null,
    });
    if (error) throw error;
    const now = new Date().toISOString();
    return { ...entry, id, createdAt: now, updatedAt: now } as IncomeEntry;
  }, []);

  const updateIncome = useCallback(async (id: string, updates: Partial<Omit<IncomeEntry, 'id' | 'createdAt'>>) => {
    const dbUpdates: Record<string, unknown> = {};
    if (updates.source !== undefined) dbUpdates.group_name = updates.source;
    if (updates.date !== undefined) dbUpdates.date = updates.date;
    if (updates.amount !== undefined) dbUpdates.amount = updates.amount;
    if (updates.notes !== undefined) dbUpdates.description = updates.notes || null;
    const { error } = await supabase.from('income').update(dbUpdates).eq('id', id);
    if (error) throw error;
  }, []);

  const deleteIncome = useCallback(async (id: string) => {
    const { error } = await supabase.from('income').delete().eq('id', id);
    if (error) throw error;
  }, []);

  const addExpense = useCallback(async (entry: Omit<ExpenseEntry, 'id' | 'createdAt' | 'updatedAt'>) => {
    const id = generateId();
    const { error } = await supabase.from('expenses').insert({
      id, date: entry.date, amount: entry.amount, category: entry.category, description: entry.notes || null,
    });
    if (error) throw error;
    const now = new Date().toISOString();
    return { ...entry, id, createdAt: now, updatedAt: now } as ExpenseEntry;
  }, []);

  const updateExpense = useCallback(async (id: string, updates: Partial<Omit<ExpenseEntry, 'id' | 'createdAt'>>) => {
    const dbUpdates: Record<string, unknown> = {};
    if (updates.date !== undefined) dbUpdates.date = updates.date;
    if (updates.amount !== undefined) dbUpdates.amount = updates.amount;
    if (updates.category !== undefined) dbUpdates.category = updates.category;
    if (updates.notes !== undefined) dbUpdates.description = updates.notes || null;
    const { error } = await supabase.from('expenses').update(dbUpdates).eq('id', id);
    if (error) throw error;
  }, []);

  const deleteExpense = useCallback(async (id: string) => {
    const { error } = await supabase.from('expenses').delete().eq('id', id);
    if (error) throw error;
  }, []);

  const addOutsourced = useCallback(async (entry: Omit<OutsourcedEntry, 'id' | 'createdAt' | 'updatedAt' | 'total'>) => {
    const id = generateId();
    const { error } = await supabase.from('outsourced').insert({
      id, date: entry.date, worker_name: entry.name, role: entry.role,
      hours: entry.hours || 0, hourly_rate: entry.hourlyRate || 0, notes: entry.notes || null,
    });
    if (error) throw error;
    const now = new Date().toISOString();
    return { ...entry, id, total: (entry.hours || 0) * (entry.hourlyRate || 0), createdAt: now, updatedAt: now } as OutsourcedEntry;
  }, []);

  const updateOutsourced = useCallback(async (id: string, updates: Partial<Omit<OutsourcedEntry, 'id' | 'createdAt' | 'total'>>) => {
    const dbUpdates: Record<string, unknown> = {};
    if (updates.date !== undefined) dbUpdates.date = updates.date;
    if (updates.name !== undefined) dbUpdates.worker_name = updates.name;
    if (updates.role !== undefined) dbUpdates.role = updates.role;
    if (updates.hours !== undefined) dbUpdates.hours = updates.hours;
    if (updates.hourlyRate !== undefined) dbUpdates.hourly_rate = updates.hourlyRate;
    if (updates.notes !== undefined) dbUpdates.notes = updates.notes || null;
    const { error } = await supabase.from('outsourced').update(dbUpdates).eq('id', id);
    if (error) throw error;
  }, []);

  const deleteOutsourced = useCallback(async (id: string) => {
    const { error } = await supabase.from('outsourced').delete().eq('id', id);
    if (error) throw error;
  }, []);

  return {
    income, expenses, outsourced, isLoading,
    addIncome, updateIncome, deleteIncome,
    addExpense, updateExpense, deleteExpense,
    addOutsourced, updateOutsourced, deleteOutsourced,
  };
};
