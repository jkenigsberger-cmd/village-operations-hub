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
        <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-4" />
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

  // Parse meal preferences
  const mealPreferences = specialDiets.mealPreferences || null;
  const generatedMeals: any[] = mealPreferences?.generatedMeals || [];

  // Parse schedule
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

  // Parse drivers/security from general_notes
  const generalNotes = submission.general_notes || '';

  const formatDate = (dateStr: string) => {
    try { return format(parseISO(dateStr), 'EEEE, d בMMMM', { locale: he }); } catch { return dateStr; }
  };
  const formatShortDate = (dateStr: string) => {
    try { return format(parseISO(dateStr), 'dd/MM/yyyy', { locale: he }); } catch { return dateStr; }
  };

  const statusConfig = STATUS_LABELS[submission.status] || STATUS_LABELS.submitted;

  // Group meals by date
  const mealsByDate = new Map<string, any[]>();
  generatedMeals.forEach((m: any) => {
    if (!mealsByDate.has(m.date)) mealsByDate.set(m.date, []);
    mealsByDate.get(m.date)!.push(m);
  });

  return (
    <div className="min-h-[60vh] bg-gray-50" dir="rtl">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
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
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-6 space-y-6">
        {/* Section 1: Client & Group Details */}
        <SectionCard icon={<Users className="w-5 h-5 text-blue-600" />} title="פרטי לקוח / קבוצה">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <CountField label="בנים" value={submission.boys_count} />
            <CountField label="בנות" value={submission.girls_count} />
            <CountField label="צוות / מלווים" value={submission.staff_count} />
            <CountField label="סה״כ משתתפים" value={submission.total_pax} highlight />
          </div>
          {submission.tent_distribution_notes && (
            <div className="mt-4 bg-amber-50 border border-amber-200 rounded-lg p-4">
              <p className="text-sm font-medium text-amber-800 mb-1">הערות לינה</p>
              <p className="text-sm text-amber-900 whitespace-pre-line">{submission.tent_distribution_notes}</p>
            </div>
          )}
        </SectionCard>

        {/* Section 3: Food & Meals */}
        <SectionCard icon={<UtensilsCrossed className="w-5 h-5 text-orange-600" />} title="ארוחות והעדפות מזון">
          {/* Dietary requirements */}
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

          {/* Coffee corner */}
          {specialDiets.coffeeCorner && (
            <div className="mb-4 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 inline-flex items-center gap-2">
              <span>☕</span>
              <span className="text-sm font-medium text-amber-800">פינת קפה ועוגיות</span>
            </div>
          )}

          {/* Meal plan */}
          {generatedMeals.length > 0 && (
            <div>
              <p className="text-sm font-medium mb-2 text-muted-foreground">תפריט ארוחות</p>
              {mealPreferences?.arrivalLunch && (
                <p className="text-xs text-blue-600 mb-1">✓ ארוחת צהריים ביום הגעה</p>
              )}
              {mealPreferences?.departureLunch && (
                <p className="text-xs text-blue-600 mb-2">✓ ארוחת צהריים ביום עזיבה</p>
              )}
              <div className="space-y-3">
                {Array.from(mealsByDate.entries()).map(([date, meals]) => (
                  <div key={date} className="bg-white border rounded-lg p-3">
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
            <div className="mb-4 bg-purple-50 border border-purple-200 rounded-lg px-4 py-2 inline-flex items-center gap-2">
              <Calendar className="w-4 h-4 text-purple-600" />
              <span className="text-sm font-medium text-purple-800">שעת הגעה: {arrivalTime}</span>
            </div>
          )}
          {scheduleItems.length > 0 ? (
            <div className="space-y-3">
              {scheduleItems.map((item: any, idx: number) => (
                <div key={idx} className="bg-white border rounded-lg p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        {item.startTime && (
                          <span className="text-sm font-mono bg-gray-100 px-2 py-0.5 rounded">
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
            <div className="mt-3 bg-gray-50 border rounded-lg p-3">
              <p className="text-sm whitespace-pre-line">{scheduleFreeText}</p>
            </div>
          )}
        </SectionCard>

        {/* Section 5: Notes */}
        {generalNotes && (
          <SectionCard icon={<MessageSquare className="w-5 h-5 text-gray-600" />} title="הערות / בקשות מיוחדות">
            <p className="text-sm whitespace-pre-line">{generalNotes}</p>
          </SectionCard>
        )}
      </div>
    </div>
  );
};

// ---- Helper components ----

const SectionCard: React.FC<{ icon: React.ReactNode; title: string; children: React.ReactNode }> = ({ icon, title, children }) => (
  <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
    <div className="flex items-center gap-2 px-6 py-4 border-b bg-gray-50/50">
      {icon}
      <h2 className="text-base font-bold">{title}</h2>
    </div>
    <div className="px-6 py-4">{children}</div>
  </div>
);

const ReadOnlyField: React.FC<{ label: string; value?: string | null }> = ({ label, value }) => {
  if (!value) return null;
  return (
    <div>
      <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
      <p className="text-sm font-medium">{value}</p>
    </div>
  );
};

const CountField: React.FC<{ label: string; value?: number | null; highlight?: boolean }> = ({ label, value, highlight }) => {
  if (value == null && !highlight) return null;
  return (
    <div className={`text-center rounded-lg px-3 py-2 ${highlight ? 'bg-blue-50 border-2 border-blue-300' : 'bg-gray-50 border border-gray-200'}`}>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`text-xl font-bold ${highlight ? 'text-blue-700' : ''}`}>{value ?? 0}</p>
    </div>
  );
};
