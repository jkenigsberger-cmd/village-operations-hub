import React, { useEffect, useState } from 'react';
import { AdminLayout } from '@/components/AdminLayout';
import { useGuestFormSubmissions, GuestFormSubmission } from '@/hooks/useGuestFormSubmissions';
import { useAdminGroups } from '@/hooks/useAdminGroups';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Copy, Plus, Eye, CheckCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { format } from 'date-fns';

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  pending: { label: 'ממתין', className: 'bg-muted text-muted-foreground' },
  sent: { label: 'נשלח', className: 'bg-blue-100 text-blue-800' },
  submitted: { label: 'מולא', className: 'bg-green-100 text-green-800' },
  reviewed: { label: 'נבדק', className: 'bg-orange-100 text-orange-800' },
};

export default function AdminGuestForms() {
  const { submissions, isLoading, createForGroup, updateStatus, load } = useGuestFormSubmissions();
  const { groups } = useAdminGroups();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const activeGroups = groups.filter(g => g.status !== 'archived');
  const groupsWithForm = new Set(submissions.map(s => s.group_id));

  const copyLink = async (sub: GuestFormSubmission) => {
    const url = `${window.location.origin}/guest-form/${sub.group_id}`;
    await navigator.clipboard.writeText(url);
    if (sub.status === 'pending') {
      await updateStatus(sub.id, 'sent');
    }
    toast({ title: 'הקישור הועתק!', description: url });
  };

  const handleCreate = async (groupId: string) => {
    const { error } = await createForGroup(groupId);
    if (error) {
      toast({ title: 'שגיאה', description: 'לא ניתן ליצור טופס', variant: 'destructive' });
    } else {
      toast({ title: 'טופס נוצר בהצלחה' });
    }
  };

  const handleReview = async (id: string) => {
    await updateStatus(id, 'reviewed');
    toast({ title: 'סומן כנבדק' });
  };

  const getGroupName = (groupId: string) => {
    return groups.find(g => g.id === groupId)?.groupName || groupId;
  };

  return (
    <AdminLayout title="שאלון לקוח" subtitle="שלחו שאלון הכנה ללקוחות וקבלו תשובות" section="management">
      <div className="space-y-6">
        {/* Groups without forms */}
        {activeGroups.filter(g => !groupsWithForm.has(g.id)).length > 0 && (
          <Card className="p-4">
            <h3 className="font-bold mb-3">קבוצות ללא שאלון</h3>
            <div className="flex flex-wrap gap-2">
              {activeGroups.filter(g => !groupsWithForm.has(g.id)).map(g => (
                <Button key={g.id} variant="outline" size="sm" onClick={() => handleCreate(g.id)}>
                  <Plus className="w-4 h-4 ml-1" />
                  {g.groupName}
                </Button>
              ))}
            </div>
          </Card>
        )}

        {/* Submissions table */}
        {isLoading ? (
          <p className="text-center text-muted-foreground py-8">טוען...</p>
        ) : submissions.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">אין שאלונים עדיין. צרו שאלון לקבוצה מהרשימה למעלה.</p>
        ) : (
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>קבוצה</TableHead>
                  <TableHead>סטטוס</TableHead>
                  <TableHead>נשלח</TableHead>
                  <TableHead>פעולות</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {submissions.map(sub => {
                  const config = STATUS_CONFIG[sub.status] || STATUS_CONFIG.pending;
                  const isExpanded = expandedId === sub.id;
                  return (
                    <React.Fragment key={sub.id}>
                      <TableRow className="cursor-pointer" onClick={() => sub.status === 'submitted' || sub.status === 'reviewed' ? setExpandedId(isExpanded ? null : sub.id) : null}>
                        <TableCell className="font-medium">{getGroupName(sub.group_id)}</TableCell>
                        <TableCell>
                          <Badge className={config.className}>{config.label}</Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {sub.submitted_at ? format(new Date(sub.submitted_at), 'dd/MM/yyyy HH:mm') : '—'}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2" onClick={e => e.stopPropagation()}>
                            <Button variant="ghost" size="sm" onClick={() => copyLink(sub)} title="העתק קישור">
                              <Copy className="w-4 h-4" />
                            </Button>
                            {(sub.status === 'submitted') && (
                              <Button variant="ghost" size="sm" onClick={() => handleReview(sub.id)} title="סמן כנבדק">
                                <CheckCircle className="w-4 h-4" />
                              </Button>
                            )}
                            {(sub.status === 'submitted' || sub.status === 'reviewed') && (
                              <Button variant="ghost" size="sm" onClick={() => setExpandedId(isExpanded ? null : sub.id)}>
                                {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                      {isExpanded && (
                        <TableRow>
                          <TableCell colSpan={4} className="bg-muted/30 p-4">
                            <SubmissionDetail sub={sub} />
                          </TableCell>
                        </TableRow>
                      )}
                    </React.Fragment>
                  );
                })}
              </TableBody>
            </Table>
          </Card>
        )}
      </div>
    </AdminLayout>
  );
}

function SubmissionDetail({ sub }: { sub: GuestFormSubmission }) {
  const field = (label: string, value: any) => {
    if (!value) return null;
    return (
      <div className="flex gap-2">
        <span className="font-medium text-sm min-w-[120px]">{label}:</span>
        <span className="text-sm">{typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)}</span>
      </div>
    );
  };

  return (
    <div className="space-y-2">
      <h4 className="font-bold text-sm mb-2">תשובות הלקוח</h4>
      {field('שם', sub.client_name)}
      {field('ארגון', sub.client_org)}
      {field('טלפון', sub.client_phone)}
      {field('אימייל', sub.client_email)}
      {field('סה"כ משתתפים', sub.total_pax)}
      {field('צוות', sub.staff_count)}
      {field('בנים', sub.boys_count)}
      {field('בנות', sub.girls_count)}
      {field('סוג קבוצה', sub.group_type)}
      {sub.special_diets && Object.keys(sub.special_diets).length > 0 && (
        <div>
          <span className="font-medium text-sm">דרישות תזונה:</span>
          <pre className="text-xs bg-background p-2 rounded mt-1 whitespace-pre-wrap">{JSON.stringify(sub.special_diets, null, 2)}</pre>
        </div>
      )}
      {field('חלוקת אוהלים', sub.tent_distribution_notes)}
      {field('לוח זמנים', sub.schedule_notes)}
      {field('הערות כלליות', sub.general_notes)}
    </div>
  );
}
