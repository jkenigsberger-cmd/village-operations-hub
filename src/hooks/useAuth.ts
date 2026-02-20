import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User, Session } from '@supabase/supabase-js';

type AppRole = 'admin' | 'viewer' | null;

interface AuthState {
  user: User | null;
  session: Session | null;
  role: AppRole;
  isAllowed: boolean | null; // null = loading
  isLoading: boolean;
  signOut: () => Promise<void>;
}

export function useAuth(): AuthState {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<AppRole>(null);
  const [isAllowed, setIsAllowed] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchRoleAndAllowed = useCallback(async (currentUser: User | null) => {
    if (!currentUser?.email) {
      setRole(null);
      setIsAllowed(false);
      setIsLoading(false);
      return;
    }

    try {
      // Check if email is allowed
      const { data: allowedData } = await supabase
        .from('allowed_users')
        .select('id')
        .ilike('email', currentUser.email)
        .maybeSingle();

      if (!allowedData) {
        setIsAllowed(false);
        setRole(null);
        setIsLoading(false);
        return;
      }

      setIsAllowed(true);

      // Fetch role
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', currentUser.id)
        .maybeSingle();

      setRole((roleData?.role as AppRole) ?? 'viewer');
    } catch {
      setIsAllowed(false);
      setRole(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, newSession) => {
        setSession(newSession);
        setUser(newSession?.user ?? null);
        if (newSession?.user) {
          // Defer to avoid Supabase client deadlock
          setTimeout(() => fetchRoleAndAllowed(newSession.user), 0);
        } else {
          setRole(null);
          setIsAllowed(null);
          setIsLoading(false);
        }
      }
    );

    // THEN get initial session
    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      setSession(initialSession);
      setUser(initialSession?.user ?? null);
      if (initialSession?.user) {
        fetchRoleAndAllowed(initialSession.user);
      } else {
        setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [fetchRoleAndAllowed]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    // Clear old password gate tokens
    localStorage.removeItem('village_auth_token');
    localStorage.removeItem('village_auth_expiry');
  }, []);

  return { user, session, role, isAllowed, isLoading, signOut };
}
