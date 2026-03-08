import React, { useState } from 'react';
import { AdminLayout } from '@/components/AdminLayout';
import { useGuestFormSubmissions, GuestFormSubmission } from '@/hooks/useGuestFormSubmissions';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CheckCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { format } from 'date-fns';

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  pending: { label: 'ממתין', className: 'bg-muted text-muted-foreground' },
  sent: { label: 'נשלח', className: 'bg-blue-100 text-blue-800' },
  submitted: { label: 'מולא', className: 'bg-green-100 text-green-800' },
  reviewed: { label: 'נבדק', className: 'bg-orange-100 text-orange-800' },
};

export default function AdminGuestForms() {
  const { submissions, isLoading, updateStatus } = useGuestFormSubmissions();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const handleReview = async (id: string) => {
    await updateStatus(id, 'reviewed');
    toast({ title: 'סומן כנבדק' });
  };

  return (
    <AdminLayout title="שאלון לקוח" subtitle="תשובות שאלוני הכנה מלקוחות" section="management">
      <div className="space-y-6">
        {isLoading ? (
          <p className="text-center text-muted-foreground py-8">טוען...</p>
        ) : submissions.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">אין שאלונים עדיין. העתיקו את הקישור מדף הצעות המחיר ושלחו ללקוחות.</p>
        ) : (
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>שם קבוצה</TableHead>
                  <TableHead>איש קשר</TableHead>
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
                      <TableRow className="cursor-pointer" onClick={() => (sub.status === 'submitted' || sub.status === 'reviewed') ? setExpandedId(isExpanded ? null : sub.id) : null}>
                        <TableCell className="font-medium">{sub.group_name || sub.group_id || '—'}</TableCell>
                        <TableCell className="text-sm">{sub.client_name || '—'}</TableCell>
                        <TableCell>
                          <Badge className={config.className}>{config.label}</Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {sub.submitted_at ? format(new Date(sub.submitted_at), 'dd/MM/yyyy HH:mm') : '—'}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2" onClick={e => e.stopPropagation()}>
                            {sub.status === 'submitted' && (
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
                          <TableCell colSpan={5} className="bg-muted/30 p-4">
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
      {field('שם קבוצה', sub.group_name)}
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
