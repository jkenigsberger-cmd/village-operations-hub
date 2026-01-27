import { useState, useEffect, useCallback } from 'react';
import { GroupRecord, ADMIN_GROUPS_STORAGE_KEY } from '@/types/adminGroups';

export const useAdminGroups = () => {
  const [groups, setGroups] = useState<GroupRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load groups from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(ADMIN_GROUPS_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as GroupRecord[];
        setGroups(parsed);
      }
    } catch (error) {
      console.error('Error loading admin groups:', error);
    }
    setIsLoading(false);
  }, []);

  // Save groups to localStorage
  const saveGroups = useCallback((newGroups: GroupRecord[]) => {
    setGroups(newGroups);
    try {
      localStorage.setItem(ADMIN_GROUPS_STORAGE_KEY, JSON.stringify(newGroups));
    } catch (error) {
      console.error('Error saving admin groups:', error);
    }
  }, []);

  // Add a new group
  const addGroup = useCallback((group: Omit<GroupRecord, 'id' | 'createdAt' | 'updatedAt'>) => {
    const now = new Date().toISOString();
    const newGroup: GroupRecord = {
      ...group,
      id: Math.random().toString(36).substring(2, 11),
      createdAt: now,
      updatedAt: now,
    };
    saveGroups([...groups, newGroup]);
    return newGroup;
  }, [groups, saveGroups]);

  // Update an existing group
  const updateGroup = useCallback((id: string, updates: Partial<Omit<GroupRecord, 'id' | 'createdAt'>>) => {
    const updatedGroups = groups.map(group => 
      group.id === id 
        ? { ...group, ...updates, updatedAt: new Date().toISOString() }
        : group
    );
    saveGroups(updatedGroups);
  }, [groups, saveGroups]);

  // Delete a group
  const deleteGroup = useCallback((id: string) => {
    saveGroups(groups.filter(group => group.id !== id));
  }, [groups, saveGroups]);

  // Get a single group by ID
  const getGroup = useCallback((id: string) => {
    return groups.find(group => group.id === id);
  }, [groups]);

  return {
    groups,
    isLoading,
    addGroup,
    updateGroup,
    deleteGroup,
    getGroup,
  };
};
