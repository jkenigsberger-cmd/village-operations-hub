import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { lovable } from '@/integrations/lovable/index';
import hadorHabaLogo from '@/assets/hador-haba-logo.png';
import glowLogo from '@/assets/glow-logo.png';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

interface AuthGateProps {
  children: React.ReactNode;
}

export default function AuthGate({ children }: AuthGateProps) {
  const { user, isAllowed, isLoading } = useAuth();
  const [signingIn, setSigningIn] = useState(false);
  const [error, setError] = useState('');

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Not logged in — show sign-in screen
  if (!user) {
    const handleSignIn = async () => {
      setSigningIn(true);
      setError('');
      try {
        const result = await lovable.auth.signInWithOAuth('google', {
          redirect_uri: window.location.origin,
        });
        if (result.error) {
          setError('שגיאה בהתחברות. נסה שוב.');
        }
      } catch {
        setError('שגיאה בהתחברות. נסה שוב.');
      } finally {
        setSigningIn(false);
      }
    };

    return (
      <div dir="rtl" className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="w-full max-w-sm flex flex-col items-center gap-6">
          <img src={hadorHabaLogo} alt="הדור הבא" className="h-24 object-contain" />
          <div className="flex items-center gap-2 opacity-80">
            <span className="text-sm text-muted-foreground">by:</span>
            <img src={glowLogo} alt="GLOW" className="h-7 object-contain" />
            <span className="text-sm text-muted-foreground">By: Glow Glamping</span>
          </div>

          <Button
            onClick={handleSignIn}
            disabled={signingIn}
            className="w-full mt-4 gap-2"
            size="lg"
          >
            {signingIn ? (
              <Loader2 className="animate-spin" />
            ) : (
              <>
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                התחבר עם Google
              </>
            )}
          </Button>

          {error && <p className="text-sm text-destructive text-center">{error}</p>}
        </div>
      </div>
    );
  }

  // Logged in but not allowed
  if (isAllowed === false) {
    return (
      <div dir="rtl" className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="w-full max-w-sm flex flex-col items-center gap-6 text-center">
          <img src={hadorHabaLogo} alt="הדור הבא" className="h-24 object-contain" />
          <h2 className="text-xl font-bold text-foreground">אין גישה</h2>
          <p className="text-muted-foreground">
            המייל {user.email} לא מורשה לגשת למערכת.
            <br />
            פנה למנהל המערכת לקבלת גישה.
          </p>
          <Button
            variant="outline"
            onClick={async () => {
              await (await import('@/integrations/supabase/client')).supabase.auth.signOut();
            }}
          >
            התנתק
          </Button>
        </div>
      </div>
    );
  }

  // Allowed — render app
  return <>{children}</>;
}
