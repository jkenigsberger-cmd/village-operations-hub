import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

const CLEANUP_KEY = 'vip_cleanup_last_run';
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

/**
 * App-level fallback: runs cleanup_stale_vip_tents() once per day
 * when an admin opens the app. This is a belt-and-suspenders safeguard
 * in addition to the pg_cron job that runs at 03:00 daily.
 */
export const useVipCleanup = () => {
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    const lastRun = localStorage.getItem(CLEANUP_KEY);
    const now = Date.now();

    if (lastRun && now - Number(lastRun) < ONE_DAY_MS) return;

    supabase.rpc('cleanup_stale_vip_tents' as any)
      .then(({ error }) => {
        if (!error) {
          localStorage.setItem(CLEANUP_KEY, String(now));
          console.log('[VIP Cleanup] Stale tent data cleaned');
        } else {
          console.warn('[VIP Cleanup] Failed:', error.message);
        }
      });
  }, []);
};
