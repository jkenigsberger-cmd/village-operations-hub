import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface GuestFormSubmission {
  id: string;
  group_id: string | null;
  group_name: string | null;
  quote_id: string | null;
  status: string;
  client_name: string | null;
  client_org: string | null;
  client_phone: string | null;
  client_email: string | null;
  total_pax: number | null;
  staff_count: number | null;
  participant_count: number | null;
  boys_count: number | null;
  girls_count: number | null;
  group_type: string | null;
  special_diets: Record<string, any> | null;
  tent_distribution_notes: string | null;
  schedule_notes: string | null;
  general_notes: string | null;
  submitted_at: string | null;
  created_at: string;
  updated_at: string;
}

export function useGuestFormSubmissions() {
  const [submissions, setSubmissions] = useState<GuestFormSubmission[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('guest_form_submissions')
      .select('*')
      .order('created_at', { ascending: false });
    if (!error && data) setSubmissions(data as unknown as GuestFormSubmission[]);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const createForGroup = useCallback(async (groupId: string) => {
    const { data, error } = await supabase
      .from('guest_form_submissions')
      .insert({ group_id: groupId, status: 'pending' })
      .select()
      .single();
    if (!error && data) {
      setSubmissions(prev => [data as unknown as GuestFormSubmission, ...prev]);
    }
    return { data, error };
  }, []);

  const updateStatus = useCallback(async (id: string, status: string) => {
    const { error } = await supabase
      .from('guest_form_submissions')
      .update({ status })
      .eq('id', id);
    if (!error) {
      setSubmissions(prev => prev.map(s => s.id === id ? { ...s, status } : s));
    }
    return { error };
  }, []);

  return { submissions, isLoading, load, createForGroup, updateStatus };
}
