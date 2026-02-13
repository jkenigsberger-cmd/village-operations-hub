import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import hadorHabaLogo from '@/assets/hador-haba-logo.png';
import glowLogo from '@/assets/glow-logo.png';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2 } from 'lucide-react';

const AUTH_TOKEN_KEY = 'village_auth_token';
const AUTH_EXPIRY_KEY = 'village_auth_expiry';
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

function isAuthenticated(): boolean {
  const token = localStorage.getItem(AUTH_TOKEN_KEY);
  const expiry = localStorage.getItem(AUTH_EXPIRY_KEY);
  if (token && expiry && Date.now() < parseInt(expiry)) {
    return true;
  }
  // Clean up expired
  localStorage.removeItem(AUTH_TOKEN_KEY);
  localStorage.removeItem(AUTH_EXPIRY_KEY);
  return false;
}

export default function PasswordGate({ children }: { children: React.ReactNode }) {
  const [authed, setAuthed] = useState(() => isAuthenticated());
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setAuthed(isAuthenticated());
  }, []);

  if (authed) return <>{children}</>;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) return;

    setLoading(true);
    setError('');

    try {
      const { data, error: fnError } = await supabase.functions.invoke('verify-password', {
        body: { password: password.trim() },
      });

      if (fnError) throw fnError;

      if (data?.valid) {
        localStorage.setItem(AUTH_TOKEN_KEY, 'authenticated');
        localStorage.setItem(AUTH_EXPIRY_KEY, (Date.now() + SEVEN_DAYS_MS).toString());
        setAuthed(true);
      } else {
        setError('סיסמה שגויה');
      }
    } catch {
      setError('שגיאה בחיבור. נסה שוב.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div dir="rtl" className="min-h-screen flex items-center justify-center bg-[hsl(var(--background))] p-4">
      <div className="w-full max-w-sm flex flex-col items-center gap-6">
        <img src={hadorHabaLogo} alt="הדור הבא" className="h-24 object-contain" />
        <div className="flex items-center gap-2 opacity-60">
          <span className="text-sm text-muted-foreground">by:</span>
          <img src={glowLogo} alt="GLOW" className="h-5 object-contain" />
          <span className="text-sm text-muted-foreground">By: Glow Glamping</span>
        </div>

        <form onSubmit={handleSubmit} className="w-full flex flex-col gap-4 mt-4">
          <Input
            type="password"
            placeholder="הכנס סיסמה"
            value={password}
            onChange={(e) => { setPassword(e.target.value); setError(''); }}
            autoFocus
            className="text-center text-lg"
          />
          {error && <p className="text-sm text-destructive text-center">{error}</p>}
          <Button type="submit" disabled={loading || !password.trim()} className="w-full">
            {loading ? <Loader2 className="animate-spin" /> : 'כניסה'}
          </Button>
        </form>
      </div>
    </div>
  );
}
