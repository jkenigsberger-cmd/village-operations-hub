// @refresh reset - Force full refresh when this file changes
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AllocationRecord, AllocationType } from '@/types/groupAllocation';

// Helper to generate random IDs
const generateId = () => Math.random().toString(36).substring(2, 11);

export const useSupabaseAllocations = () => {
  const [allocations, setAllocations] = useState<AllocationRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load all allocations from Supabase
  const loadAllocations = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('allocations')
        .select('*')
        .order('date_range_start', { ascending: true });

      if (fetchError) throw fetchError;

      // Transform database rows to AllocationRecord format
      const allocationRecords: AllocationRecord[] = (data || []).map(a => ({
        id: a.id,
        groupId: a.group_id,
        dateRangeStart: a.date_range_start,
        dateRangeEnd: a.date_range_end,
        allocationType: a.allocation_type as AllocationType,
        resourceId: a.resource_id,
        resourceLabel: a.resource_label,
        bedsAssigned: a.beds_assigned,
        createdAt: a.created_at
      }));

      setAllocations(allocationRecords);
      return allocationRecords;
    } catch (err) {
      console.error('Error loading allocations from Supabase:', err);
      setError(err instanceof Error ? err.message : 'Failed to load allocations');
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    loadAllocations();
  }, [loadAllocations]);

  // Set up realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel('allocations-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'allocations' }, () => loadAllocations())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadAllocations]);

  // Add an allocation
  const addAllocation = useCallback(async (
    groupId: string,
    allocationType: AllocationType,
    resourceId: string,
    resourceLabel: string,
    bedsAssigned: number,
    dateRangeStart: string,
    dateRangeEnd: string
  ): Promise<string> => {
    const id = generateId();
    
    const { error: insertError } = await supabase.from('allocations').insert({
      id,
      group_id: groupId,
      allocation_type: allocationType,
      resource_id: resourceId,
      resource_label: resourceLabel,
      beds_assigned: bedsAssigned,
      date_range_start: dateRangeStart,
      date_range_end: dateRangeEnd
    });

    if (insertError) throw insertError;
    return id;
  }, []);

  // Remove an allocation
  const removeAllocation = useCallback(async (allocationId: string) => {
    const { error: deleteError } = await supabase.from('allocations').delete().eq('id', allocationId);
    if (deleteError) throw deleteError;
  }, []);

  // Get allocations for a group
  const getGroupAllocations = useCallback((groupId: string) => {
    return allocations.filter(a => a.groupId === groupId);
  }, [allocations]);

  // Get allocations for a resource
  const getResourceAllocations = useCallback((resourceId: string) => {
    return allocations.filter(a => a.resourceId === resourceId);
  }, [allocations]);

  return {
    allocations,
    isLoading,
    error,
    loadAllocations,
    addAllocation,
    removeAllocation,
    getGroupAllocations,
    getResourceAllocations,
  };
};
