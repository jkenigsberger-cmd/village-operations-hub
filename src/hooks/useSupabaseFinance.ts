// @refresh reset - Force full refresh when this file changes
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { IncomeEntry, ExpenseEntry, OutsourcedEntry, ExpenseCategory } from '@/types/adminFinance';

// Helper to generate random IDs
const generateId = () => Math.random().toString(36).substring(2, 11);

export const useSupabaseFinance = () => {
  const [income, setIncome] = useState<IncomeEntry[]>([]);
  const [expenses, setExpenses] = useState<ExpenseEntry[]>([]);
  const [outsourced, setOutsourced] = useState<OutsourcedEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load all finance data from Supabase
  const loadFinanceData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const [incomeRes, expensesRes, outsourcedRes] = await Promise.all([
        supabase.from('income').select('*').order('date', { ascending: false }),
        supabase.from('expenses').select('*').order('date', { ascending: false }),
        supabase.from('outsourced').select('*').order('date', { ascending: false })
      ]);

      if (incomeRes.error) throw incomeRes.error;
      if (expensesRes.error) throw expensesRes.error;
      if (outsourcedRes.error) throw outsourcedRes.error;

      // Transform income entries (map DB fields to type fields)
      const incomeEntries: IncomeEntry[] = (incomeRes.data || []).map(i => ({
        id: i.id,
        date: i.date,
        source: i.group_name, // DB uses group_name, type uses source
        amount: Number(i.amount),
        notes: i.description || undefined,
        createdAt: i.created_at,
        updatedAt: i.updated_at
      }));

      // Transform expense entries
      const expenseEntries: ExpenseEntry[] = (expensesRes.data || []).map(e => ({
        id: e.id,
        date: e.date,
        category: e.category as ExpenseCategory,
        amount: Number(e.amount),
        notes: e.description || undefined,
        createdAt: e.created_at,
        updatedAt: e.updated_at
      }));

      // Transform outsourced entries
      const outsourcedEntries: OutsourcedEntry[] = (outsourcedRes.data || []).map(o => ({
        id: o.id,
        date: o.date,
        name: o.worker_name,
        role: o.role,
        hours: Number(o.hours),
        hourlyRate: Number(o.hourly_rate) || undefined,
        total: Number(o.hours) * (Number(o.hourly_rate) || 0) || undefined,
        notes: o.notes || undefined,
        createdAt: o.created_at,
        updatedAt: o.updated_at
      }));

      setIncome(incomeEntries);
      setExpenses(expenseEntries);
      setOutsourced(outsourcedEntries);

      return { income: incomeEntries, expenses: expenseEntries, outsourced: outsourcedEntries };
    } catch (err) {
      console.error('Error loading finance data from Supabase:', err);
      setError(err instanceof Error ? err.message : 'Failed to load finance data');
      return { income: [], expenses: [], outsourced: [] };
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    loadFinanceData();
  }, [loadFinanceData]);

  // Income CRUD
  const addIncome = useCallback(async (entry: Omit<IncomeEntry, 'id' | 'createdAt' | 'updatedAt'>) => {
    const id = generateId();
    
    const { error: insertError } = await supabase.from('income').insert({
      id,
      group_name: entry.source, // Map source to group_name in DB
      amount: entry.amount,
      description: entry.notes || null,
      date: entry.date
    });

    if (insertError) throw insertError;

    const newEntry: IncomeEntry = {
      ...entry,
      id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await loadFinanceData();
    return newEntry;
  }, [loadFinanceData]);

  const updateIncome = useCallback(async (id: string, updates: Partial<Omit<IncomeEntry, 'id' | 'createdAt'>>) => {
    const dbUpdates: Record<string, unknown> = {};
    
    if (updates.source !== undefined) dbUpdates.group_name = updates.source;
    if (updates.amount !== undefined) dbUpdates.amount = updates.amount;
    if (updates.notes !== undefined) dbUpdates.description = updates.notes || null;
    if (updates.date !== undefined) dbUpdates.date = updates.date;

    const { error: updateError } = await supabase.from('income').update(dbUpdates).eq('id', id);
    if (updateError) throw updateError;
    
    await loadFinanceData();
  }, [loadFinanceData]);

  const deleteIncome = useCallback(async (id: string) => {
    const { error: deleteError } = await supabase.from('income').delete().eq('id', id);
    if (deleteError) throw deleteError;
    await loadFinanceData();
  }, [loadFinanceData]);

  // Expenses CRUD
  const addExpense = useCallback(async (entry: Omit<ExpenseEntry, 'id' | 'createdAt' | 'updatedAt'>) => {
    const id = generateId();
    
    const { error: insertError } = await supabase.from('expenses').insert({
      id,
      category: entry.category,
      amount: entry.amount,
      description: entry.notes || null,
      date: entry.date
    });

    if (insertError) throw insertError;

    const newEntry: ExpenseEntry = {
      ...entry,
      id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await loadFinanceData();
    return newEntry;
  }, [loadFinanceData]);

  const updateExpense = useCallback(async (id: string, updates: Partial<Omit<ExpenseEntry, 'id' | 'createdAt'>>) => {
    const dbUpdates: Record<string, unknown> = {};
    
    if (updates.category !== undefined) dbUpdates.category = updates.category;
    if (updates.amount !== undefined) dbUpdates.amount = updates.amount;
    if (updates.notes !== undefined) dbUpdates.description = updates.notes || null;
    if (updates.date !== undefined) dbUpdates.date = updates.date;

    const { error: updateError } = await supabase.from('expenses').update(dbUpdates).eq('id', id);
    if (updateError) throw updateError;
    
    await loadFinanceData();
  }, [loadFinanceData]);

  const deleteExpense = useCallback(async (id: string) => {
    const { error: deleteError } = await supabase.from('expenses').delete().eq('id', id);
    if (deleteError) throw deleteError;
    await loadFinanceData();
  }, [loadFinanceData]);

  // Outsourced CRUD
  const addOutsourced = useCallback(async (entry: Omit<OutsourcedEntry, 'id' | 'createdAt' | 'updatedAt' | 'total'>) => {
    const id = generateId();
    
    const { error: insertError } = await supabase.from('outsourced').insert({
      id,
      worker_name: entry.name,
      role: entry.role,
      hours: entry.hours || 0,
      hourly_rate: entry.hourlyRate || 0,
      date: entry.date,
      notes: entry.notes || null
    });

    if (insertError) throw insertError;

    const total = (entry.hours || 0) * (entry.hourlyRate || 0) || undefined;
    const newEntry: OutsourcedEntry = {
      ...entry,
      id,
      total,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await loadFinanceData();
    return newEntry;
  }, [loadFinanceData]);

  const updateOutsourced = useCallback(async (id: string, updates: Partial<Omit<OutsourcedEntry, 'id' | 'createdAt' | 'total'>>) => {
    const dbUpdates: Record<string, unknown> = {};
    
    if (updates.name !== undefined) dbUpdates.worker_name = updates.name;
    if (updates.role !== undefined) dbUpdates.role = updates.role;
    if (updates.hours !== undefined) dbUpdates.hours = updates.hours;
    if (updates.hourlyRate !== undefined) dbUpdates.hourly_rate = updates.hourlyRate;
    if (updates.date !== undefined) dbUpdates.date = updates.date;
    if (updates.notes !== undefined) dbUpdates.notes = updates.notes || null;

    const { error: updateError } = await supabase.from('outsourced').update(dbUpdates).eq('id', id);
    if (updateError) throw updateError;
    
    await loadFinanceData();
  }, [loadFinanceData]);

  const deleteOutsourced = useCallback(async (id: string) => {
    const { error: deleteError } = await supabase.from('outsourced').delete().eq('id', id);
    if (deleteError) throw deleteError;
    await loadFinanceData();
  }, [loadFinanceData]);

  return {
    income,
    expenses,
    outsourced,
    isLoading,
    error,
    loadFinanceData,
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
