import React, { useState, useEffect, useCallback } from 'react';
import { AdminLayout } from '@/components/AdminLayout';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { UserPlus, Trash2, Shield, Eye, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface AllowedUser {
  id: string;
  email: string;
  created_at: string;
}

interface UserWithRole {
  email: string;
  allowedId: string;
  role: string | null;
  userId: string | null;
  displayName: string | null;
  avatarUrl: string | null;
  hasSignedIn: boolean;
}

const UserManagement: React.FC = () => {
  const { role } = useAuth();
  const { toast } = useToast();
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<UserWithRole | null>(null);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const { data: allowed } = await supabase
        .from('allowed_users')
        .select('*')
        .order('created_at', { ascending: true });

      const { data: roles } = await supabase.from('user_roles').select('*');
      const { data: profiles } = await supabase.from('profiles').select('*');

      const merged: UserWithRole[] = (allowed ?? []).map((au: AllowedUser) => {
        const profile = profiles?.find((p: any) => p.email?.toLowerCase() === au.email.toLowerCase());
        const userRole = profile ? roles?.find((r: any) => r.user_id === profile.id) : null;
        return {
          email: au.email,
          allowedId: au.id,
          role: userRole?.role ?? null,
          userId: profile?.id ?? null,
          displayName: profile?.display_name ?? null,
          avatarUrl: profile?.avatar_url ?? null,
          hasSignedIn: !!profile,
        };
      });

      setUsers(merged);
    } catch {
      toast({ title: 'שגיאה בטעינת משתמשים', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { loadUsers(); }, [loadUsers]);

  if (role !== 'admin') {
    return (
      <AdminLayout title="ניהול משתמשים" section="management">
        <p className="text-center text-muted-foreground py-12">אין לך הרשאה לצפות בדף זה.</p>
      </AdminLayout>
    );
  }

  const handleInvite = async () => {
    const email = inviteEmail.trim();
    if (!email) return;

    const { error } = await supabase.from('allowed_users').insert({ email });
    if (error) {
      if (error.code === '23505') {
        toast({ title: 'המייל כבר קיים ברשימה', variant: 'destructive' });
      } else {
        toast({ title: 'שגיאה בהזמנה', variant: 'destructive' });
      }
      return;
    }

    toast({ title: `${email} הוזמן בהצלחה` });
    setInviteEmail('');
    setInviteModalOpen(false);
    loadUsers();
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    const { error } = await supabase
      .from('user_roles')
      .update({ role: newRole as any })
      .eq('user_id', userId);

    if (error) {
      toast({ title: 'שגיאה בעדכון תפקיד', variant: 'destructive' });
      return;
    }
    toast({ title: 'התפקיד עודכן' });
    loadUsers();
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const { error } = await supabase.from('allowed_users').delete().eq('id', deleteTarget.allowedId);
    if (error) {
      toast({ title: 'שגיאה בהסרה', variant: 'destructive' });
      return;
    }
    toast({ title: `${deleteTarget.email} הוסר` });
    setDeleteTarget(null);
    loadUsers();
  };

  return (
    <AdminLayout title="ניהול משתמשים" subtitle="הזמנה, הסרה ושינוי תפקידים" section="management">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-semibold">{users.length} משתמשים</h2>
        <Button onClick={() => setInviteModalOpen(true)} className="gap-2">
          <UserPlus className="w-4 h-4" />
          הזמן משתמש
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="rounded-lg border bg-card overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-right">משתמש</TableHead>
                <TableHead className="text-right">תפקיד</TableHead>
                <TableHead className="text-right">סטטוס</TableHead>
                <TableHead className="text-right w-20">פעולות</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((u) => (
                <TableRow key={u.allowedId}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      {u.avatarUrl ? (
                        <img src={u.avatarUrl} alt="" className="w-8 h-8 rounded-full" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-medium">
                          {u.email[0].toUpperCase()}
                        </div>
                      )}
                      <div>
                        {u.displayName && <div className="font-medium">{u.displayName}</div>}
                        <div className="text-sm text-muted-foreground">{u.email}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {u.hasSignedIn && u.userId ? (
                      <Select
                        value={u.role ?? 'viewer'}
                        onValueChange={(val) => handleRoleChange(u.userId!, val)}
                      >
                        <SelectTrigger className="w-28">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">
                            <span className="flex items-center gap-1"><Shield className="w-3 h-3" /> מנהל</span>
                          </SelectItem>
                          <SelectItem value="viewer">
                            <span className="flex items-center gap-1"><Eye className="w-3 h-3" /> צופה</span>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <span className="text-muted-foreground text-sm">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {u.hasSignedIn ? (
                      <Badge variant="default">פעיל</Badge>
                    ) : (
                      <Badge variant="secondary">ממתין</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setDeleteTarget(u)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Invite Modal */}
      <Dialog open={inviteModalOpen} onOpenChange={setInviteModalOpen}>
        <DialogContent dir="rtl">
          <DialogHeader>
            <DialogTitle>הזמן משתמש חדש</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Input
              type="email"
              placeholder="כתובת מייל"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              dir="ltr"
            />
            <p className="text-sm text-muted-foreground mt-2">
              המשתמש יוכל להתחבר עם Google לאחר ההזמנה. ברירת מחדל: צופה.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setInviteModalOpen(false)}>ביטול</Button>
            <Button onClick={handleInvite} disabled={!inviteEmail.trim()}>הזמן</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent dir="rtl">
          <DialogHeader>
            <DialogTitle>הסרת משתמש</DialogTitle>
          </DialogHeader>
          <p>האם להסיר את {deleteTarget?.email} מהמערכת?</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>ביטול</Button>
            <Button variant="destructive" onClick={handleDelete}>הסר</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default UserManagement;
