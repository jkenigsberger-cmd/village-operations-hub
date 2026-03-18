import React, { useEffect, useState, useCallback } from 'react';
import { format, parseISO } from 'date-fns';
import { he } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, X, Calendar, Users, UtensilsCrossed, Clock, MessageSquare, FileText } from 'lucide-react';
import hadorHabaLogo from '@/assets/hador-haba-logo.png';

interface GuestFormResponseViewProps {
  quoteId: string;
  groupName: string;
  onClose: () => void;
}

const DIET_LABELS: Record<string, string> = {
  vegetarian: '🥬 צמחוני',
  vegan: '🌱 טבעוני',
  glutenFree: '🌾 צליאק',
  mehadrinKosher: '✡️ מהדרין',
  lifeThreatening: '⚠️ מסכן חיים',
  nutFree: '🥜 ללא אגוזים',
  eggFree: '🥚 ללא ביצים',
  lactoseFree: '🥛 ללא לקטוז',
};

const MEAL_TYPE_LABELS: Record<string, string> = {
  BREAKFAST: '🌅 ארוחת בוקר',
  LUNCH: '☀️ ארוחת צהריים',
  DINNER: '🌙 ארוחת ערב',
};

const LOCATION_LABELS: Record<string, string> = {
  classroom: 'כיתה',
  outdoor: 'מתחם חוץ',
  offsite: 'מחוץ לחווה',
};

const STATUS_LABELS: Record<string, { label: string; className: string }> = {
  pending: { label: 'ממתין', className: 'bg-yellow-100 text-yellow-800' },
  submitted: { label: 'נשלח', className: 'bg-green-100 text-green-800' },
  reviewed: { label: 'נבדק', className: 'bg-blue-100 text-blue-800' },
};

// Parse tent_distribution_notes into per-group notes
function parseLodgingNotes(raw: string | null): { students: string; staff: string; drivers: string } {
  const result = { students: '', staff: '', drivers: '' };
  if (!raw) return result;
  const lines = raw.split('\n');
  for (const line of lines) {
    if (line.startsWith('צרכי לינה תלמידים:')) result.students = line.replace('צרכי לינה תלמידים:', '').trim();
    else if (line.startsWith('צרכי לינה צוות/מלווים:')) result.staff = line.replace('צרכי לינה צוות/מלווים:', '').trim();
    else if (line.startsWith('צרכי לינה נהגים/אבטחה/אחרים:')) result.drivers = line.replace('צרכי לינה נהגים/אבטחה/אחרים:', '').trim();
  }
  return result;
}

export const GuestFormResponseView: React.FC<GuestFormResponseViewProps> = ({
  quoteId,
  groupName,
  onClose,
}) => {
  const [submission, setSubmission] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('guest_form_submissions')
      .select('*')
      .eq('quote_id', quoteId)
      .in('status', ['submitted', 'reviewed'])
      .order('submitted_at', { ascending: false })
      .limit(1);
    if (data && data.length > 0) setSubmission(data[0]);
    setLoading(false);
  }, [quoteId]);

  useEffect(() => { load(); }, [load]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">טוען תשובת לקוח...</p>
      </div>
    );
  }

  if (!submission) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <FileText className="w-12 h-12 text-muted-foreground/50 mb-4" />
        <p className="text-muted-foreground">לא נמצאה תשובת לקוח עבור הצעה זו</p>
      </div>
    );
  }

  const specialDiets = (typeof submission.special_diets === 'object' && submission.special_diets) || {};
  const dietEntries = Object.entries(DIET_LABELS)
    .map(([key, label]) => ({ key, label, count: Number(specialDiets[key]) || 0 }))
    .filter(d => d.count > 0);
  const dietNotes = specialDiets.notes || '';

  const mealPreferences = specialDiets.mealPreferences || null;
  const generatedMeals: any[] = mealPreferences?.generatedMeals || [];

  let scheduleData: { items?: any[]; freeText?: string; arrivalTime?: string } = {};
  try {
    if (submission.schedule_notes) {
      scheduleData = typeof submission.schedule_notes === 'string'
        ? JSON.parse(submission.schedule_notes)
        : submission.schedule_notes;
    }
  } catch { /* ignore */ }
  const scheduleItems: any[] = scheduleData.items || [];
  const scheduleFreeText = scheduleData.freeText || '';
  const arrivalTime = scheduleData.arrivalTime || '';

  const generalNotes = submission.general_notes || '';
  const lodgingNotes = parseLodgingNotes(submission.tent_distribution_notes);

  const formatDate = (dateStr: string) => {
    try { return format(parseISO(dateStr), 'EEEE, d בMMMM', { locale: he }); } catch { return dateStr; }
  };
  const formatShortDate = (dateStr: string) => {
    try { return format(parseISO(dateStr), 'dd/MM/yyyy', { locale: he }); } catch { return dateStr; }
  };

  const statusConfig = STATUS_LABELS[submission.status] || STATUS_LABELS.submitted;

  const mealsByDate = new Map<string, any[]>();
  generatedMeals.forEach((m: any) => {
    if (!mealsByDate.has(m.date)) mealsByDate.set(m.date, []);
    mealsByDate.get(m.date)!.push(m);
  });

  const boysCount = submission.boys_count || 0;
  const girlsCount = submission.girls_count || 0;
  const studentTotal = boysCount + girlsCount;
  const staffMen = Number(specialDiets.staffMen) || 0;
  const staffWomen = Number(specialDiets.staffWomen) || 0;
  const staffCount = staffMen + staffWomen || submission.staff_count || 0;
  const driversMen = Number(specialDiets.driversMen) || 0;
  const driversWomen = Number(specialDiets.driversWomen) || 0;
  const driversCount = driversMen + driversWomen || ((submission.total_pax || 0) - studentTotal - staffCount);
  const totalPax = submission.total_pax || 0;

  return (
    <div className="min-h-[60vh] bg-muted/30" dir="rtl">
      {/* Header */}
      <div className="bg-background border-b sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img src={hadorHabaLogo} alt="הדור הבא" className="h-10" />
            <div>
              <h1 className="text-lg font-bold">{groupName || submission.group_name || 'תשובת לקוח'}</h1>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Badge className={statusConfig.className}>{statusConfig.label}</Badge>
                {submission.submitted_at && (
                  <span>הוגש: {formatShortDate(submission.submitted_at)}</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Section 1: Client & Group Details */}
        <SectionCard icon={<Users className="w-5 h-5 text-primary" />} title="פרטי לקוח / קבוצה">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <ReadOnlyField label="שם קבוצה" value={submission.group_name} />
            <ReadOnlyField label="סוג קבוצה" value={submission.group_type} />
            <ReadOnlyField label="שם איש קשר" value={submission.client_name} />
            <ReadOnlyField label="ארגון / מוסד" value={submission.client_org} />
            <ReadOnlyField label="טלפון" value={submission.client_phone} />
            <ReadOnlyField label="דוא״ל" value={submission.client_email} />
          </div>
        </SectionCard>

        {/* Section 2: Participants & Lodging */}
        <SectionCard icon={<Users className="w-5 h-5 text-green-600" />} title="משתתפים ולינה">
          <div className="space-y-4">
            {/* Students card */}
            <ParticipantGroupCard title="תלמידים" subtotal={studentTotal}>
              <div className="grid grid-cols-2 gap-3">
                <CountRow label="בנים" value={boysCount} />
                <CountRow label="בנות" value={girlsCount} />
              </div>
              {lodgingNotes.students && (
                <NoteBlock text={lodgingNotes.students} />
              )}
            </ParticipantGroupCard>

            {/* Staff card */}
            <ParticipantGroupCard title="צוות / מלווים" subtotal={staffCount}>
              <CountRow label="צוות / מלווים" value={staffCount} />
              {lodgingNotes.staff && (
                <NoteBlock text={lodgingNotes.staff} />
              )}
            </ParticipantGroupCard>

            {/* Drivers/Security card */}
            {(driversCount > 0 || lodgingNotes.drivers) && (
              <ParticipantGroupCard title="נהגים, אבטחה ואחרים" subtotal={driversCount > 0 ? driversCount : undefined}>
                {driversCount > 0 && <CountRow label="נהגים / אבטחה / אחרים" value={driversCount} />}
                {lodgingNotes.drivers && (
                  <NoteBlock text={lodgingNotes.drivers} />
                )}
              </ParticipantGroupCard>
            )}

            {/* Grand total */}
            <div className="bg-blue-50 border-2 border-blue-200 rounded-xl px-5 py-3 flex items-center justify-between">
              <span className="font-bold text-blue-900">סה״כ משתתפים</span>
              <span className="text-2xl font-bold text-blue-700">{totalPax}</span>
            </div>
          </div>
        </SectionCard>

        {/* Section 3: Food & Meals */}
        <SectionCard icon={<UtensilsCrossed className="w-5 h-5 text-orange-600" />} title="ארוחות והעדפות מזון">
          {dietEntries.length > 0 && (
            <div className="mb-4">
              <p className="text-sm font-medium mb-2 text-muted-foreground">דרישות תזונה מיוחדות</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {dietEntries.map(d => (
                  <div key={d.key} className="bg-orange-50 border border-orange-200 rounded-lg px-3 py-2 text-center">
                    <span className="text-sm">{d.label}</span>
                    <span className="block text-lg font-bold text-orange-700">{d.count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {dietNotes && (
            <div className="mb-4 bg-orange-50 border border-orange-200 rounded-lg p-3">
              <p className="text-sm font-medium text-orange-800 mb-1">הערות תזונה</p>
              <p className="text-sm text-orange-900">{dietNotes}</p>
            </div>
          )}

          {specialDiets.coffeeCorner && (
            <div className="mb-4 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 inline-flex items-center gap-2">
              <span>☕</span>
              <span className="text-sm font-medium text-amber-800">פינת קפה ועוגיות</span>
            </div>
          )}

          {generatedMeals.length > 0 && (
            <div>
              <p className="text-sm font-medium mb-2 text-muted-foreground">תפריט ארוחות</p>
              {mealPreferences?.arrivalLunch && (
                <p className="text-xs text-primary mb-1">✓ ארוחת צהריים ביום הגעה</p>
              )}
              {mealPreferences?.departureLunch && (
                <p className="text-xs text-primary mb-2">✓ ארוחת צהריים ביום עזיבה</p>
              )}
              <div className="space-y-3">
                {Array.from(mealsByDate.entries()).map(([date, meals]) => (
                  <div key={date} className="bg-background border border-border rounded-xl p-4">
                    <p className="text-sm font-semibold mb-2">{formatDate(date)}</p>
                    <div className="flex flex-wrap gap-2">
                      {meals.map((m: any, i: number) => (
                        <span
                          key={i}
                          className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full ${
                            m.sandwichInstead
                              ? 'bg-yellow-100 text-yellow-800 border border-yellow-300'
                              : 'bg-green-50 text-green-800 border border-green-200'
                          }`}
                        >
                          {MEAL_TYPE_LABELS[m.mealType] || m.mealType}
                          {m.sandwichInstead && ' 🥪 (כריך)'}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {dietEntries.length === 0 && generatedMeals.length === 0 && !dietNotes && (
            <p className="text-sm text-muted-foreground">לא צוינו העדפות מזון</p>
          )}
        </SectionCard>

        {/* Section 4: Schedule */}
        <SectionCard icon={<Clock className="w-5 h-5 text-purple-600" />} title="לוח זמנים">
          {arrivalTime && (
            <div className="mb-4 bg-purple-50 border border-purple-200 rounded-xl px-4 py-2 inline-flex items-center gap-2">
              <Calendar className="w-4 h-4 text-purple-600" />
              <span className="text-sm font-medium text-purple-800">שעת הגעה: {arrivalTime}</span>
            </div>
          )}
          {scheduleItems.length > 0 ? (
            <div className="space-y-3">
              {scheduleItems.map((item: any, idx: number) => (
                <div key={idx} className="bg-background border border-border rounded-xl p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        {item.startTime && (
                          <span className="text-sm font-mono bg-muted px-2 py-0.5 rounded">
                            {item.startTime}{item.endTime ? ` – ${item.endTime}` : ''}
                          </span>
                        )}
                        {item.location && (
                          <Badge variant="outline" className="text-xs">
                            {LOCATION_LABELS[item.location] || item.location}
                          </Badge>
                        )}
                      </div>
                      {item.activityName && (
                        <p className="font-medium">{item.activityName}</p>
                      )}
                      {item.notes && (
                        <p className="text-sm text-muted-foreground mt-1">{item.notes}</p>
                      )}
                    </div>
                    {item.participantCount && (
                      <div className="text-center bg-blue-50 border border-blue-200 rounded-lg px-3 py-1">
                        <span className="text-xs text-blue-600">משתתפים</span>
                        <span className="block text-lg font-bold text-blue-800">{item.participantCount}</span>
                      </div>
                    )}
                  </div>
                  {item.date && (
                    <p className="text-xs text-muted-foreground mt-2">{formatDate(item.date)}</p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            !scheduleFreeText && !arrivalTime && (
              <p className="text-sm text-muted-foreground">לא צוין לוח זמנים</p>
            )
          )}
          {scheduleFreeText && (
            <div className="mt-3 bg-muted/50 border border-border rounded-xl p-3">
              <p className="text-sm whitespace-pre-line">{scheduleFreeText}</p>
            </div>
          )}
        </SectionCard>

        {/* Section 5: Notes */}
        {generalNotes && (
          <SectionCard icon={<MessageSquare className="w-5 h-5 text-muted-foreground" />} title="הערות / בקשות מיוחדות">
            <p className="text-sm whitespace-pre-line">{generalNotes}</p>
          </SectionCard>
        )}
      </div>
    </div>
  );
};

// ---- Helper components ----

const SectionCard: React.FC<{ icon: React.ReactNode; title: string; children: React.ReactNode }> = ({ icon, title, children }) => (
  <div className="bg-background rounded-xl border border-border shadow-md overflow-hidden">
    <div className="px-6 py-4 border-b border-border">
      <div className="flex items-center gap-2">
        {icon}
        <h2 className="text-base font-bold">{title}</h2>
      </div>
      <div className="h-0.5 w-12 bg-amber-500 rounded-full mt-2" />
    </div>
    <div className="px-6 py-5">{children}</div>
  </div>
);

const ParticipantGroupCard: React.FC<{ title: string; subtotal?: number; children: React.ReactNode }> = ({ title, subtotal, children }) => (
  <div className="border border-border rounded-xl overflow-hidden">
    <div className="bg-muted/40 px-4 py-2.5 border-b border-border">
      <span className="text-sm font-bold">{title}</span>
    </div>
    <div className="px-4 py-3 space-y-2">
      {children}
    </div>
    {subtotal != null && (
      <div className="bg-muted/60 border-t border-border px-4 py-2 flex items-center justify-between">
        <span className="text-sm text-muted-foreground font-medium">סה״כ {title}</span>
        <span className="text-lg font-bold">{subtotal}</span>
      </div>
    )}
  </div>
);

const CountRow: React.FC<{ label: string; value: number }> = ({ label, value }) => (
  <div className="bg-muted/30 rounded-lg px-4 py-2.5 flex items-center justify-between">
    <span className="text-sm text-muted-foreground">{label}</span>
    <span className="text-base font-bold">{value}</span>
  </div>
);

const NoteBlock: React.FC<{ text: string }> = ({ text }) => (
  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mt-1">
    <p className="text-sm text-amber-900 whitespace-pre-line">{text}</p>
  </div>
);

const ReadOnlyField: React.FC<{ label: string; value?: string | null }> = ({ label, value }) => {
  if (!value) return null;
  return (
    <div className="bg-muted/30 rounded-lg px-4 py-2.5">
      <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
      <p className="text-sm font-medium">{value}</p>
    </div>
  );
};
