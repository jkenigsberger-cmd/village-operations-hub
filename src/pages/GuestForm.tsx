import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { addDays, parseISO, format, differenceInCalendarDays } from 'date-fns';
import { he } from 'date-fns/locale';
import hadorHabaLogo from '@/assets/hador-haba-logo.png';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { CheckCircle2, Loader2, ArrowRight, ArrowLeft, ChevronDown, AlertTriangle, Sandwich, UtensilsCrossed } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

// ---- Steps ----

const STEPS = [
  'פרטי קבוצה',
  'העדפות מזון',
  'תפריט ארוחות',
  'חלוקת אוהלים',
  'לוח פעילויות',
];

// ---- Constants ----

const TENT_TYPES = [
  { type: 'staff', label: 'אוהלי צוות', beds: 3, maxTents: 10, emoji: '🏕️' },
  { type: 'chevruta', label: 'אוהלי חברותא', beds: 8, maxTents: 31, emoji: '⛺' },
  { type: 'group', label: 'אוהלי קבוצה', beds: 6, maxTents: 9, emoji: '🎪' },
  { type: 'accessible', label: 'אוהל נגיש', beds: 3, maxTents: 1, emoji: '♿' },
];

const DIET_OPTIONS = [
  { key: 'vegetarian', label: '🥬 צמחוני' },
  { key: 'vegan', label: '🌱 טבעוני' },
  { key: 'glutenFree', label: '🌾 צליאק' },
  { key: 'mehadrinKosher', label: '✡️ מהדרין' },
  { key: 'lifeThreatening', label: '⚠️ מסכן חיים' },
  { key: 'nutFree', label: '🥜 ללא אגוזים' },
  { key: 'eggFree', label: '🥚 ללא ביצים' },
  { key: 'lactoseFree', label: '🥛 ללא לקטוז' },
];

type MealType = 'BREAKFAST' | 'LUNCH' | 'DINNER';

const MEAL_LABELS: Record<MealType, string> = {
  BREAKFAST: '🌅 ארוחת בוקר',
  LUNCH: '☀️ ארוחת צהריים',
  DINNER: '🌙 ארוחת ערב',
};

interface GeneratedMeal {
  date: string;
  mealType: MealType;
  sandwichInstead: boolean;
}

interface MealPreferences {
  arrivalLunch: boolean;
  departureLunch: boolean;
  generatedMeals: GeneratedMeal[];
}

// ---- Meal generation logic ----

function generateMeals(
  startDate: string,
  endDate: string,
  arrivalLunch: boolean,
  departureLunch: boolean,
): GeneratedMeal[] {
  if (!startDate || !endDate) return [];

  const start = parseISO(startDate);
  const end = parseISO(endDate);
  const nights = differenceInCalendarDays(end, start);
  if (nights <= 0) return [];

  const meals: GeneratedMeal[] = [];

  // Arrival day
  if (arrivalLunch) {
    meals.push({ date: startDate, mealType: 'LUNCH', sandwichInstead: false });
  }
  meals.push({ date: startDate, mealType: 'DINNER', sandwichInstead: false });

  // Full days in between (day after arrival to day before departure)
  for (let d = 1; d < nights; d++) {
    const dayStr = format(addDays(start, d), 'yyyy-MM-dd');
    meals.push({ date: dayStr, mealType: 'BREAKFAST', sandwichInstead: false });
    meals.push({ date: dayStr, mealType: 'LUNCH', sandwichInstead: false });
    meals.push({ date: dayStr, mealType: 'DINNER', sandwichInstead: false });
  }

  // Departure day
  meals.push({ date: endDate, mealType: 'BREAKFAST', sandwichInstead: false });
  if (departureLunch) {
    meals.push({ date: endDate, mealType: 'LUNCH', sandwichInstead: false });
  }

  return meals;
}

// ---- Quote data type ----

interface QuoteData {
  id: string;
  status: string;
  title: string | null;
  group_id: string | null;
  snapshot: any;
  client_details: any;
}

// ============================================================
// COMPONENT
// ============================================================

export default function GuestForm() {
  const [searchParams] = useSearchParams();
  const quoteId = searchParams.get('quote');

  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');
  const [detailsOpen, setDetailsOpen] = useState(false);

  // Quote loading state
  const [quoteLoading, setQuoteLoading] = useState(!!quoteId);
  const [quoteError, setQuoteError] = useState('');
  const [quoteData, setQuoteData] = useState<QuoteData | null>(null);

  // Main form state
  const [form, setForm] = useState({
    group_name: '',
    client_name: '',
    client_org: '',
    client_phone: '',
    client_email: '',
    total_pax: '',
    staff_count: '',
    participant_count: '',
    boys_count: '',
    girls_count: '',
    group_type: '',
    special_diets: {} as Record<string, boolean | string>,
    diet_notes: '',
    tent_distribution: TENT_TYPES.map(t => ({ type: t.type, girls: 0, boys: 0 })),
    tent_distribution_notes: '',
    schedule_notes: '',
    general_notes: '',
  });

  // Meal preferences state (separate for clarity)
  const [mealPrefs, setMealPrefs] = useState<MealPreferences>({
    arrivalLunch: false,
    departureLunch: false,
    generatedMeals: [],
  });

  const set = (key: string, value: any) => setForm(prev => ({ ...prev, [key]: value }));

  // Derive dates from quote
  const stayStartDate = quoteData?.snapshot?.startDate || '';
  const stayEndDate = quoteData?.snapshot?.endDate || '';
  const stayNights = useMemo(() => {
    if (!stayStartDate || !stayEndDate) return 0;
    try {
      return Math.max(0, differenceInCalendarDays(parseISO(stayEndDate), parseISO(stayStartDate)));
    } catch { return 0; }
  }, [stayStartDate, stayEndDate]);

  const isSleepingGroup = stayNights > 0;

  // Regenerate meals when dates or lunch preferences change
  useEffect(() => {
    if (!isSleepingGroup) {
      setMealPrefs(prev => ({ ...prev, generatedMeals: [] }));
      return;
    }

    setMealPrefs(prev => {
      const newMeals = generateMeals(stayStartDate, stayEndDate, prev.arrivalLunch, prev.departureLunch);

      // Preserve sandwich selections from previous meals where date+type match
      const prevMap = new Map(
        prev.generatedMeals.map(m => [`${m.date}_${m.mealType}`, m.sandwichInstead])
      );

      return {
        ...prev,
        generatedMeals: newMeals.map(m => ({
          ...m,
          sandwichInstead: prevMap.get(`${m.date}_${m.mealType}`) ?? false,
        })),
      };
    });
  }, [stayStartDate, stayEndDate, isSleepingGroup, mealPrefs.arrivalLunch, mealPrefs.departureLunch]);

  const handleLunchToggle = useCallback((type: 'arrival' | 'departure') => {
    setMealPrefs(prev => ({
      ...prev,
      arrivalLunch: type === 'arrival' ? !prev.arrivalLunch : false,
      departureLunch: type === 'departure' ? !prev.departureLunch : false,
    }));
  }, []);

  const handleNoLunch = useCallback(() => {
    setMealPrefs(prev => ({
      ...prev,
      arrivalLunch: false,
      departureLunch: false,
    }));
  }, []);

  const toggleSandwich = useCallback((index: number) => {
    setMealPrefs(prev => ({
      ...prev,
      generatedMeals: prev.generatedMeals.map((m, i) =>
        i === index ? { ...m, sandwichInstead: !m.sandwichInstead } : m
      ),
    }));
  }, []);

  // Load quote data on mount
  useEffect(() => {
    if (!quoteId) {
      setQuoteLoading(false);
      return;
    }

    const loadQuote = async () => {
      try {
        const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
        const res = await fetch(
          `https://${projectId}.supabase.co/functions/v1/get-quote-for-form?quote_id=${encodeURIComponent(quoteId)}`,
          { headers: { 'Content-Type': 'application/json' } }
        );

        if (res.status === 404) {
          setQuoteError('הצעת המחיר לא נמצאה. ייתכן שהקישור אינו תקין.');
          setQuoteLoading(false);
          return;
        }

        if (res.status === 403) {
          setQuoteError('הצעת המחיר טרם אושרה. לא ניתן למלא את השאלון כרגע.');
          setQuoteLoading(false);
          return;
        }

        if (!res.ok) {
          setQuoteError('שגיאה בטעינת נתוני ההצעה.');
          setQuoteLoading(false);
          return;
        }

        const data = await res.json();
        setQuoteData(data as QuoteData);

        const snapshot = data.snapshot as any || {};
        const client = data.client_details as any || {};

        setForm(prev => ({
          ...prev,
          group_name: snapshot.groupName || data.title || prev.group_name,
          client_name: client.contactPerson || client.clientName || prev.client_name,
          client_org: client.clientOrg || prev.client_org,
          client_phone: client.clientPhone || prev.client_phone,
          client_email: client.clientEmail || prev.client_email,
          total_pax: snapshot.totalPax ? String(snapshot.totalPax) : prev.total_pax,
          staff_count: snapshot.staffTotal ? String(snapshot.staffTotal) : prev.staff_count,
          participant_count: snapshot.studentsTotal ? String(snapshot.studentsTotal) : prev.participant_count,
          group_type: snapshot.groupType || prev.group_type,
        }));
      } catch {
        setQuoteError('שגיאה בטעינת נתוני ההצעה.');
      } finally {
        setQuoteLoading(false);
      }
    };

    loadQuote();
  }, [quoteId]);

  // Submit
  const handleSubmit = async () => {
    if (!form.group_name.trim()) {
      setError('יש למלא שם קבוצה');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;

      // Build special_diets payload with meal preferences included
      const specialDietsPayload = {
        ...form.special_diets,
        notes: form.diet_notes,
        mealPreferences: isSleepingGroup ? mealPrefs : undefined,
      };

      const res = await fetch(
        `https://${projectId}.supabase.co/functions/v1/submit-guest-form`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            group_name: form.group_name,
            client_name: form.client_name,
            client_org: form.client_org,
            client_phone: form.client_phone,
            client_email: form.client_email,
            total_pax: form.total_pax ? Number(form.total_pax) : null,
            staff_count: form.staff_count ? Number(form.staff_count) : null,
            participant_count: form.participant_count ? Number(form.participant_count) : null,
            boys_count: form.boys_count ? Number(form.boys_count) : null,
            girls_count: form.girls_count ? Number(form.girls_count) : null,
            group_type: form.group_type,
            special_diets: specialDietsPayload,
            tent_distribution_notes: [
              ...form.tent_distribution.map((row, i) => {
                const t = TENT_TYPES[i];
                const total = row.boys + row.girls;
                if (total === 0) return null;
                return `${t.label} (${t.beds} מיטות): ${row.girls} נשים, ${row.boys} גברים (סה"כ ${total})`;
              }).filter(Boolean),
              form.tent_distribution_notes ? `הערות: ${form.tent_distribution_notes}` : null,
            ].filter(Boolean).join('\n') || null,
            schedule_notes: form.schedule_notes,
            general_notes: form.general_notes,
            quote_id: quoteId || null,
          }),
        }
      );
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed');
      setDone(true);
    } catch (e: any) {
      setError(e.message || 'שגיאה בשליחת הטופס');
    } finally {
      setSubmitting(false);
    }
  };

  // ---- Early return screens ----

  if (quoteLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6" dir="rtl">
        <img src={hadorHabaLogo} alt="הדור הבא" className="h-20 mb-6" />
        <Loader2 className="w-10 h-10 animate-spin text-blue-600 mb-4" />
        <p className="text-muted-foreground">טוען נתוני הצעת מחיר...</p>
      </div>
    );
  }

  if (quoteError) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6" dir="rtl">
        <img src={hadorHabaLogo} alt="הדור הבא" className="h-20 mb-6" />
        <AlertTriangle className="w-16 h-16 text-orange-500 mb-4" />
        <h1 className="text-xl font-bold mb-2">לא ניתן לפתוח את השאלון</h1>
        <p className="text-muted-foreground text-center max-w-md">{quoteError}</p>
        <p className="text-sm text-muted-foreground mt-6">בית הדור הבא · מקום לחוויות ישראליות</p>
      </div>
    );
  }

  if (!quoteId) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6" dir="rtl">
        <img src={hadorHabaLogo} alt="הדור הבא" className="h-20 mb-6" />
        <AlertTriangle className="w-16 h-16 text-orange-500 mb-4" />
        <h1 className="text-xl font-bold mb-2">קישור לא תקין</h1>
        <p className="text-muted-foreground text-center max-w-md">
          שאלון ההכנה נשלח רק מתוך הצעת מחיר מאושרת. אנא פנו לצוות בית הדור הבא לקבלת קישור תקין.
        </p>
        <p className="text-sm text-muted-foreground mt-6">בית הדור הבא · מקום לחוויות ישראליות</p>
      </div>
    );
  }

  if (done) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6" dir="rtl">
        <img src={hadorHabaLogo} alt="הדור הבא" className="h-20 mb-6" />
        <CheckCircle2 className="w-16 h-16 text-green-600 mb-4" />
        <h1 className="text-2xl font-bold mb-2">תודה רבה!</h1>
        <p className="text-muted-foreground text-center">הטופס נשלח בהצלחה. הצוות שלנו יחזור אליכם בהקדם.</p>
        <p className="text-sm text-muted-foreground mt-6">בית הדור הבא · מקום לחוויות ישראליות</p>
      </div>
    );
  }

  // ---- Computed UI values ----

  // If not a sleeping group, skip the meal step (step 2)
  const activeSteps = isSleepingGroup ? STEPS : STEPS.filter((_, i) => i !== 2);
  const totalSteps = activeSteps.length;
  const progress = ((step + 1) / totalSteps) * 100;

  // Map visual step index to logical step content index
  const getLogicalStep = (visualStep: number): number => {
    if (isSleepingGroup) return visualStep;
    // Non-sleeping: skip step 2 (meal plan), so visual 2->3, visual 3->4
    if (visualStep >= 2) return visualStep + 1;
    return visualStep;
  };

  const logicalStep = getLogicalStep(step);

  const isFromQuote = !!quoteData;
  const prefillFields = isFromQuote ? {
    group_name: !!quoteData.snapshot?.groupName || !!quoteData.title,
    client_name: !!(quoteData.client_details?.contactPerson || quoteData.client_details?.clientName),
    client_org: !!quoteData.client_details?.clientOrg,
    client_phone: !!quoteData.client_details?.clientPhone,
    client_email: !!quoteData.client_details?.clientEmail,
  } : {};

  const quoteBanner = isFromQuote ? (
    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4 text-sm text-blue-800">
      <p className="font-semibold mb-1">📋 שאלון זה מקושר להצעת מחיר מאושרת</p>
      <p>חלק מהפרטים מולאו אוטומטית מההצעה. נא להשלים את הפרטים התפעוליים הנוספים.</p>
      {stayStartDate && stayEndDate && (
        <p className="mt-1">
          <strong>תאריכים:</strong> {stayStartDate} — {stayEndDate}
          {stayNights > 0 && ` (${stayNights} לילות)`}
        </p>
      )}
    </div>
  ) : null;

  const formatDateHe = (dateStr: string) => {
    try {
      const d = parseISO(dateStr);
      return format(d, 'EEEE, d בMMMM', { locale: he });
    } catch { return dateStr; }
  };

  const getDayLabel = (dateStr: string): string | null => {
    if (dateStr === stayStartDate) return 'יום הגעה';
    if (dateStr === stayEndDate) return 'יום עזיבה';
    return null;
  };

  // ---- Render ----

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      {/* Header */}
      <div className="flex flex-col items-center pt-8 pb-4 px-4">
        <img src={hadorHabaLogo} alt="הדור הבא" className="h-16 md:h-20 mb-4" />
        <h1 className="text-xl md:text-2xl font-bold text-gray-800">שאלון הכנה לקבוצה מתארחת</h1>
        <p className="text-sm text-gray-500 mt-1">נא למלא את כל הפרטים לפני ההגעה</p>
      </div>

      <div className="h-1 bg-blue-600 max-w-2xl mx-auto rounded-full" />

      {/* Stepper */}
      <div className="max-w-2xl mx-auto px-4 mt-6 mb-2">
        <div className="flex justify-between mb-3">
          {activeSteps.map((s, i) => (
            <div key={i} className="flex flex-col items-center flex-1">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-colors ${
                i <= step
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-400 border-gray-300'
              }`}>
                {i < step ? <CheckCircle2 className="w-5 h-5" /> : i + 1}
              </div>
              <span className="text-[11px] mt-1.5 text-gray-500 text-center leading-tight">{s}</span>
            </div>
          ))}
        </div>
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div className="h-full bg-blue-600 transition-all duration-300 rounded-full" style={{ width: `${progress}%` }} />
        </div>
      </div>

      {/* Form Card */}
      <div className="max-w-2xl mx-auto px-4 pb-12 mt-4">
        {logicalStep === 0 && quoteBanner}

        <Card className="p-6 md:p-8 bg-white border-gray-200 shadow-md">
          <div className="mb-6">
            <h2 className="text-lg font-bold text-gray-800">{activeSteps[step]}</h2>
            <div className="h-0.5 w-12 bg-amber-500 mt-1 rounded-full" />
          </div>

          {/* ========== STEP 0: Group Details ========== */}
          {logicalStep === 0 && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-700">שם הקבוצה *</Label>
                  <Input
                    value={form.group_name}
                    onChange={e => set('group_name', e.target.value)}
                    placeholder="למשל: תנועת הצופים - גדוד 12"
                    className="mt-1"
                    readOnly={!!prefillFields.group_name}
                    disabled={!!prefillFields.group_name}
                  />
                </div>
                <div>
                  <Label className="text-gray-700">סה"כ משתתפים</Label>
                  <Input type="number" value={form.total_pax} onChange={e => set('total_pax', e.target.value)} placeholder="מספר" className="mt-1" />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-700">אפיון קבוצה</Label>
                  <Input value={form.group_type} onChange={e => set('group_type', e.target.value)} placeholder='למשל: תנועת נוער, בי"ס, חברה...' className="mt-1" />
                </div>
                <div>
                  <Label className="text-gray-700">שם איש קשר</Label>
                  <Input
                    value={form.client_name}
                    onChange={e => set('client_name', e.target.value)}
                    placeholder="שם מלא"
                    className="mt-1"
                    readOnly={!!prefillFields.client_name}
                    disabled={!!prefillFields.client_name}
                  />
                </div>
              </div>
              <div>
                <Label className="text-gray-700">טלפון</Label>
                <Input
                  type="tel"
                  value={form.client_phone}
                  onChange={e => set('client_phone', e.target.value)}
                  placeholder="050-0000000"
                  className="mt-1"
                  readOnly={!!prefillFields.client_phone}
                  disabled={!!prefillFields.client_phone}
                />
              </div>

              <Collapsible open={detailsOpen} onOpenChange={setDetailsOpen}>
                <CollapsibleTrigger asChild>
                  <button className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors">
                    <ChevronDown className={`w-4 h-4 transition-transform ${detailsOpen ? 'rotate-180' : ''}`} />
                    פירוט נוסף
                  </button>
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-3 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-gray-700">ארגון / חברה</Label>
                      <Input
                        value={form.client_org}
                        onChange={e => set('client_org', e.target.value)}
                        placeholder="שם הארגון"
                        className="mt-1"
                        readOnly={!!prefillFields.client_org}
                        disabled={!!prefillFields.client_org}
                      />
                    </div>
                    <div>
                      <Label className="text-gray-700">אימייל</Label>
                      <Input
                        type="email"
                        value={form.client_email}
                        onChange={e => set('client_email', e.target.value)}
                        placeholder="email@example.com"
                        className="mt-1"
                        readOnly={!!prefillFields.client_email}
                        disabled={!!prefillFields.client_email}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-gray-700">צוות / מדריכים</Label>
                      <Input type="number" value={form.staff_count} onChange={e => set('staff_count', e.target.value)} className="mt-1" />
                    </div>
                    <div>
                      <Label className="text-gray-700">משתתפים (ללא צוות)</Label>
                      <Input type="number" value={form.participant_count} onChange={e => set('participant_count', e.target.value)} className="mt-1" />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-gray-700">גברים</Label>
                      <Input type="number" value={form.boys_count} onChange={e => set('boys_count', e.target.value)} className="mt-1" />
                    </div>
                    <div>
                      <Label className="text-gray-700">נשים</Label>
                      <Input type="number" value={form.girls_count} onChange={e => set('girls_count', e.target.value)} className="mt-1" />
                    </div>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </div>
          )}

          {/* ========== STEP 1: Diet Preferences ========== */}
          {logicalStep === 1 && (
            <div className="space-y-6">
              <p className="text-sm text-gray-500 text-center">נא לרשום את מספר המשתתפים עבור כל העדפה</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {DIET_OPTIONS.map(opt => (
                  <div key={opt.key} className="bg-gray-50 rounded-xl p-4 flex flex-col items-center gap-2 border border-gray-200">
                    <span className="text-sm font-medium text-gray-700">{opt.label}</span>
                    <Input
                      type="number"
                      min="0"
                      className="text-center bg-white max-w-[80px]"
                      value={String(form.special_diets[`${opt.key}_count`] || '0')}
                      onChange={e => set('special_diets', { ...form.special_diets, [`${opt.key}_count`]: e.target.value })}
                      onFocus={e => e.target.select()}
                    />
                  </div>
                ))}
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
                <h3 className="text-base font-bold text-gray-800 text-center mb-3">תוספות בתשלום</h3>
                <label className="flex items-center justify-center gap-3 cursor-pointer">
                  <span className="text-sm text-gray-700">☕ פינת קפה משודרגת</span>
                  <Checkbox
                    checked={!!form.special_diets['upgraded_coffee']}
                    onCheckedChange={v => set('special_diets', { ...form.special_diets, upgraded_coffee: v })}
                  />
                </label>
              </div>

              <div>
                <Label className="text-gray-700">הערות נוספות לגבי מזון</Label>
                <Textarea value={form.diet_notes} onChange={e => set('diet_notes', e.target.value)} placeholder="אלרגיות ספציפיות, העדפות מיוחדות..." className="mt-1 bg-amber-50/50" />
              </div>
            </div>
          )}

          {/* ========== STEP 2: Meal Plan (sleeping groups only) ========== */}
          {logicalStep === 2 && isSleepingGroup && (
            <div className="space-y-6">
              {/* Stay info banner */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-800">
                <div className="flex flex-wrap gap-x-6 gap-y-1">
                  <span><strong>צ׳ק-אין:</strong> {formatDateHe(stayStartDate)}</span>
                  <span><strong>צ׳ק-אאוט:</strong> {formatDateHe(stayEndDate)}</span>
                  <span><strong>לילות:</strong> {stayNights}</span>
                </div>
              </div>

              {/* Arrival / departure lunch selection */}
              <div className="space-y-3">
                <h3 className="text-base font-semibold text-gray-800">בחירת ארוחת צהריים נוספת</h3>
                <p className="text-sm text-gray-500">
                  ניתן לבחור ארוחת צהריים ביום ההגעה <strong>או</strong> ביום העזיבה (לא שניהם).
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Arrival lunch */}
                  <button
                    type="button"
                    onClick={() => handleLunchToggle('arrival')}
                    className={`rounded-xl border-2 p-4 text-center transition-all ${
                      mealPrefs.arrivalLunch
                        ? 'border-blue-500 bg-blue-50 text-blue-800 shadow-sm'
                        : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    <div className="text-2xl mb-1">🍽️</div>
                    <div className="text-sm font-semibold">צהריים ביום ההגעה</div>
                    <div className="text-xs text-gray-400 mt-0.5">{formatDateHe(stayStartDate)}</div>
                  </button>

                  {/* Departure lunch */}
                  <button
                    type="button"
                    onClick={() => handleLunchToggle('departure')}
                    className={`rounded-xl border-2 p-4 text-center transition-all ${
                      mealPrefs.departureLunch
                        ? 'border-blue-500 bg-blue-50 text-blue-800 shadow-sm'
                        : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    <div className="text-2xl mb-1">🍽️</div>
                    <div className="text-sm font-semibold">צהריים ביום העזיבה</div>
                    <div className="text-xs text-gray-400 mt-0.5">{formatDateHe(stayEndDate)}</div>
                  </button>

                  {/* No extra lunch */}
                  <button
                    type="button"
                    onClick={handleNoLunch}
                    className={`rounded-xl border-2 p-4 text-center transition-all ${
                      !mealPrefs.arrivalLunch && !mealPrefs.departureLunch
                        ? 'border-gray-500 bg-gray-50 text-gray-800 shadow-sm'
                        : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    <div className="text-2xl mb-1">✖️</div>
                    <div className="text-sm font-semibold">ללא צהריים נוספת</div>
                    <div className="text-xs text-gray-400 mt-0.5">רק ארוחות השהייה</div>
                  </button>
                </div>
              </div>

              {/* Generated meal list by day */}
              {mealsByDate.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-base font-semibold text-gray-800">ארוחות במהלך השהייה</h3>
                  <p className="text-sm text-gray-500">
                    עבור כל ארוחה, ניתן לבקש סנדוויץ׳ במקום ארוחה רגילה.
                  </p>

                  {mealsByDate.map(([dateStr, meals]) => {
                    const dayLabel = getDayLabel(dateStr);
                    return (
                      <div key={dateStr} className="border border-gray-200 rounded-xl overflow-hidden">
                        {/* Day header */}
                        <div className="bg-gray-50 px-4 py-2.5 border-b border-gray-200 flex items-center justify-between">
                          <div>
                            <span className="text-sm font-semibold text-gray-700">{formatDateHe(dateStr)}</span>
                            {dayLabel && (
                              <span className="mr-2 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                                {dayLabel}
                              </span>
                            )}
                          </div>
                          <span className="text-xs text-gray-400">{meals.length} ארוחות</span>
                        </div>

                        {/* Meals */}
                        <div className="divide-y divide-gray-100">
                          {meals.map(({ meal, index }) => (
                            <div
                              key={index}
                              className={`flex items-center justify-between px-4 py-3 transition-colors ${
                                meal.sandwichInstead ? 'bg-amber-50/60' : ''
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                {meal.sandwichInstead ? (
                                  <Sandwich className="w-5 h-5 text-amber-600" />
                                ) : (
                                  <UtensilsCrossed className="w-5 h-5 text-gray-400" />
                                )}
                                <div>
                                  <span className={`text-sm font-medium ${meal.sandwichInstead ? 'text-amber-700' : 'text-gray-700'}`}>
                                    {MEAL_LABELS[meal.mealType]}
                                  </span>
                                  {meal.sandwichInstead && (
                                    <span className="block text-xs text-amber-600 font-medium">→ סנדוויץ׳ במקום ארוחה</span>
                                  )}
                                </div>
                              </div>

                              <div className="flex items-center gap-2">
                                <span className="text-xs text-gray-400">סנדוויץ׳</span>
                                <Switch
                                  checked={meal.sandwichInstead}
                                  onCheckedChange={() => toggleSandwich(index)}
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}

                  {/* Summary */}
                  <div className="bg-gray-50 rounded-xl p-4 text-sm text-gray-600">
                    <div className="flex flex-wrap gap-x-6 gap-y-1">
                      <span>סה״כ ארוחות: <strong>{mealPrefs.generatedMeals.length}</strong></span>
                      <span>ארוחות רגילות: <strong>{mealPrefs.generatedMeals.filter(m => !m.sandwichInstead).length}</strong></span>
                      <span>סנדוויצ׳ים: <strong className="text-amber-600">{mealPrefs.generatedMeals.filter(m => m.sandwichInstead).length}</strong></span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ========== STEP 3: Tent Distribution ========== */}
          {logicalStep === 3 && (
            <div className="space-y-5">
              <div className="bg-gray-100 rounded-xl p-4 text-sm text-gray-600 space-y-1">
                <p className="font-semibold text-gray-700 mb-2">סוגי האוהלים הזמינים:</p>
                {TENT_TYPES.map(t => (
                  <p key={t.type}>{t.emoji} {t.label} — {t.beds} מיטות באוהל (עד {t.maxTents} אוהלים)</p>
                ))}
              </div>

              <p className="text-sm text-gray-500 text-center">נא לציין כמה אוהלים מכל סוג עבור גברים ונשים</p>

              <div className="border border-gray-200 rounded-xl overflow-hidden">
                <div className="grid grid-cols-3 bg-gray-50 border-b border-gray-200 text-sm font-semibold text-gray-600">
                  <div className="p-3">סוג האוהל</div>
                  <div className="p-3 text-center">מס׳ אוהלים — נשים</div>
                  <div className="p-3 text-center">מס׳ אוהלים — גברים</div>
                </div>
                {TENT_TYPES.map((t, idx) => {
                  const row = form.tent_distribution[idx];
                  const otherGender = (gender: 'boys' | 'girls') => gender === 'boys' ? row.girls : row.boys;
                  return (
                    <div key={t.type} className={`grid grid-cols-3 items-center border-b border-gray-100 last:border-b-0 ${idx % 2 === 1 ? 'bg-gray-50/50' : ''}`}>
                      <div className="p-3 text-sm font-medium text-gray-700">
                        {t.emoji} {t.label} ({t.beds} מיטות)
                      </div>
                      <div className="p-3 flex justify-center">
                        <Input
                          type="number"
                          min={0}
                          max={t.maxTents - otherGender('girls')}
                          className="text-center bg-white max-w-[70px]"
                          value={String(row.girls || '0')}
                          onChange={e => {
                            const val = Math.max(0, Math.min(Number(e.target.value) || 0, t.maxTents - row.boys));
                            const updated = [...form.tent_distribution];
                            updated[idx] = { ...row, girls: val };
                            set('tent_distribution', updated);
                          }}
                          onFocus={e => e.target.select()}
                        />
                      </div>
                      <div className="p-3 flex justify-center">
                        <Input
                          type="number"
                          min={0}
                          max={t.maxTents - otherGender('boys')}
                          className="text-center bg-white max-w-[70px]"
                          value={String(row.boys || '0')}
                          onChange={e => {
                            const val = Math.max(0, Math.min(Number(e.target.value) || 0, t.maxTents - row.girls));
                            const updated = [...form.tent_distribution];
                            updated[idx] = { ...row, boys: val };
                            set('tent_distribution', updated);
                          }}
                          onFocus={e => e.target.select()}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              <div>
                <Label className="text-gray-700">הערות נוספות לגבי חלוקת אוהלים</Label>
                <Textarea
                  value={form.tent_distribution_notes}
                  onChange={e => set('tent_distribution_notes', e.target.value)}
                  placeholder="למשל: הפרדה מיוחדת, דרישות נגישות נוספות..."
                  className="min-h-[80px] mt-1"
                />
              </div>
            </div>
          )}

          {/* ========== STEP 4: Activities Schedule ========== */}
          {logicalStep === 4 && (
            <div className="space-y-5">
              <div>
                <Label className="text-gray-700">העדפות לוח זמנים / פעילויות</Label>
                <Textarea
                  value={form.schedule_notes}
                  onChange={e => set('schedule_notes', e.target.value)}
                  placeholder="למשל: שעות פעילות מועדפות, פעילויות מבוקשות..."
                  className="min-h-[110px] mt-1"
                />
              </div>
              <div>
                <Label className="text-gray-700">הערות כלליות</Label>
                <Textarea
                  value={form.general_notes}
                  onChange={e => set('general_notes', e.target.value)}
                  placeholder="כל דבר נוסף שחשוב שנדע..."
                  className="min-h-[110px] mt-1"
                />
              </div>
            </div>
          )}

          {error && <p className="text-destructive text-sm mt-3">{error}</p>}

          {/* Navigation buttons */}
          <div className="flex justify-between mt-8 gap-3">
            {step > 0 ? (
              <Button variant="outline" onClick={() => setStep(s => s - 1)} className="border-gray-300 text-gray-600 gap-1">
                הקודם
                <ArrowRight className="w-4 h-4" />
              </Button>
            ) : (
              <div />
            )}
            {step < totalSteps - 1 ? (
              <Button onClick={() => setStep(s => s + 1)} className="bg-blue-600 hover:bg-blue-700 text-white gap-1">
                <ArrowLeft className="w-4 h-4" />
                הבא
              </Button>
            ) : (
              <Button onClick={handleSubmit} disabled={submitting} className="bg-blue-600 hover:bg-blue-700 text-white min-w-[100px]">
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'שליחה'}
              </Button>
            )}
          </div>
        </Card>

        <p className="text-center text-xs text-gray-400 mt-8">בית הדור הבא · מקום לחוויות ישראליות</p>
      </div>
    </div>
  );
}
