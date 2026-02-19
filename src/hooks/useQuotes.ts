// ============================================================
// QUOTES HOOK - CRUD + Realtime for quotes table
// ============================================================

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  QuoteRecord,
  QuoteSnapshot,
  QuoteClientDetails,
  QuotePricing,
  QuoteTotals,
  QuoteStatus,
  createEmptySnapshot,
  createEmptyClientDetails,
  createEmptyPricing,
  createEmptyTotals,
} from '@/types/quote';

const mapDbRowToQuote = (row: any): QuoteRecord => ({
  id: row.id,
  groupId: row.group_id,
  version: row.version,
  status: row.status as QuoteStatus,
  currency: row.currency,
  title: row.title,
  snapshot: (row.snapshot as QuoteSnapshot) || createEmptySnapshot(),
  clientDetails: (row.client_details as QuoteClientDetails) || createEmptyClientDetails(),
  pricing: (row.pricing as QuotePricing) || createEmptyPricing(),
  totals: (row.totals as QuoteTotals) || createEmptyTotals(),
  docClientHtml: row.doc_client_html,
  docOperationalHtml: row.doc_operational_html,
  createdBy: row.created_by,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

export const useQuotes = () => {
  const [quotes, setQuotes] = useState<QuoteRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadQuotes = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const { data, error: fetchError } = await supabase
        .from('quotes')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;
      setQuotes((data || []).map(mapDbRowToQuote));
    } catch (err) {
      console.error('Error loading quotes:', err);
      setError(err instanceof Error ? err.message : 'Failed to load quotes');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { loadQuotes(); }, [loadQuotes]);

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel('quotes-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'quotes' }, () => loadQuotes())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [loadQuotes]);

  // Get quotes for a specific group
  const getGroupQuotes = useCallback((groupId: string) => {
    return quotes.filter(q => q.groupId === groupId).sort((a, b) => b.version - a.version);
  }, [quotes]);

  // Get latest quote for a group
  const getLatestQuote = useCallback((groupId: string): QuoteRecord | null => {
    const groupQuotes = getGroupQuotes(groupId);
    return groupQuotes[0] || null;
  }, [getGroupQuotes]);

  // Get next version number
  const getNextVersion = useCallback((groupId: string | null): number => {
    if (!groupId) {
      // For standalone quotes, just use max version + 1
      const standaloneQuotes = quotes.filter(q => !q.groupId);
      return standaloneQuotes.length > 0
        ? Math.max(...standaloneQuotes.map(q => q.version)) + 1
        : 1;
    }
    const groupQuotes = getGroupQuotes(groupId);
    return groupQuotes.length > 0
      ? Math.max(...groupQuotes.map(q => q.version)) + 1
      : 1;
  }, [quotes, getGroupQuotes]);

  // Create a new quote
  const createQuote = useCallback(async (
    data: {
      groupId?: string | null;
      title?: string;
      snapshot: QuoteSnapshot;
      clientDetails: QuoteClientDetails;
      pricing: QuotePricing;
      totals: QuoteTotals;
    }
  ): Promise<QuoteRecord | null> => {
    const version = getNextVersion(data.groupId || null);

    const { data: inserted, error: insertError } = await supabase
      .from('quotes')
      .insert({
        group_id: data.groupId || null,
        title: data.title || null,
        version,
        status: 'draft',
        snapshot: data.snapshot as any,
        client_details: data.clientDetails as any,
        pricing: data.pricing as any,
        totals: data.totals as any,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error creating quote:', insertError);
      throw insertError;
    }
    return inserted ? mapDbRowToQuote(inserted) : null;
  }, [getNextVersion]);

  // Update an existing quote
  const updateQuote = useCallback(async (
    id: string,
    updates: Partial<{
      status: QuoteStatus;
      title: string;
      snapshot: QuoteSnapshot;
      clientDetails: QuoteClientDetails;
      pricing: QuotePricing;
      totals: QuoteTotals;
      docClientHtml: string;
      docOperationalHtml: string;
    }>
  ): Promise<void> => {
    const dbUpdates: any = {};
    if (updates.status !== undefined) dbUpdates.status = updates.status;
    if (updates.title !== undefined) dbUpdates.title = updates.title;
    if (updates.snapshot !== undefined) dbUpdates.snapshot = updates.snapshot;
    if (updates.clientDetails !== undefined) dbUpdates.client_details = updates.clientDetails;
    if (updates.pricing !== undefined) dbUpdates.pricing = updates.pricing;
    if (updates.totals !== undefined) dbUpdates.totals = updates.totals;
    if (updates.docClientHtml !== undefined) dbUpdates.doc_client_html = updates.docClientHtml;
    if (updates.docOperationalHtml !== undefined) dbUpdates.doc_operational_html = updates.docOperationalHtml;

    const { error: updateError } = await supabase
      .from('quotes')
      .update(dbUpdates)
      .eq('id', id);

    if (updateError) {
      console.error('Error updating quote:', updateError);
      throw updateError;
    }
  }, []);

  // Create a new version from existing quote
  const createNewVersion = useCallback(async (
    existingQuote: QuoteRecord,
  ): Promise<QuoteRecord | null> => {
    return createQuote({
      groupId: existingQuote.groupId,
      title: existingQuote.title,
      snapshot: existingQuote.snapshot,
      clientDetails: existingQuote.clientDetails,
      pricing: existingQuote.pricing,
      totals: existingQuote.totals,
    });
  }, [createQuote]);

  // Delete a quote
  const deleteQuote = useCallback(async (id: string): Promise<void> => {
    const { error: deleteError } = await supabase
      .from('quotes')
      .delete()
      .eq('id', id);
    if (deleteError) throw deleteError;
  }, []);

  return {
    quotes,
    isLoading,
    error,
    loadQuotes,
    getGroupQuotes,
    getLatestQuote,
    getNextVersion,
    createQuote,
    updateQuote,
    createNewVersion,
    deleteQuote,
  };
};
