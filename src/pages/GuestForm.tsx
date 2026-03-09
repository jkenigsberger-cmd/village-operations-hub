import React, { useState } from 'react';
import hadorHabaLogo from '@/assets/hador-haba-logo.png';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { CheckCircle2, Loader2, ArrowRight, ArrowLeft, ChevronDown } from 'lucide-react';

const STEPS = [
  'פרטי קבוצה',
  'העדפות מזון',
  'חלוקת אוהלים',
  'לוח פעילויות',
];

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

export default function GuestForm() {
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');
  const [detailsOpen, setDetailsOpen] = useState(false);

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

  const set = (key: string, value: any) => setForm(prev => ({ ...prev, [key]: value }));

  const handleSubmit = async () => {
    if (!form.group_name.trim()) {
      setError('יש למלא שם קבוצה');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
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
            special_diets: { ...form.special_diets, notes: form.diet_notes },
            tent_distribution_notes: form.tent_distribution_notes,
            schedule_notes: form.schedule_notes,
            general_notes: form.general_notes,
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

  const progress = ((step + 1) / STEPS.length) * 100;

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      {/* Header */}
      <div className="flex flex-col items-center pt-8 pb-4 px-4">
        <img src={hadorHabaLogo} alt="הדור הבא" className="h-16 md:h-20 mb-4" />
        <h1 className="text-xl md:text-2xl font-bold text-gray-800">שאלון הכנה לקבוצה מתארחת</h1>
        <p className="text-sm text-gray-500 mt-1">נא למלא את כל הפרטים לפני ההגעה</p>
      </div>

      {/* Blue accent bar */}
      <div className="h-1 bg-blue-600 max-w-2xl mx-auto rounded-full" />

      {/* Stepper */}
      <div className="max-w-2xl mx-auto px-4 mt-6 mb-2">
        <div className="flex justify-between mb-3">
          {STEPS.map((s, i) => (
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
        {/* Progress bar */}
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div className="h-full bg-blue-600 transition-all duration-300 rounded-full" style={{ width: `${progress}%` }} />
        </div>
      </div>

      {/* Form Card */}
      <div className="max-w-2xl mx-auto px-4 pb-12 mt-4">
        <Card className="p-6 md:p-8 bg-white border-gray-200 shadow-md">
          {/* Section title with accent underline */}
          <div className="mb-6">
            <h2 className="text-lg font-bold text-gray-800">{STEPS[step]}</h2>
            <div className="h-0.5 w-12 bg-amber-500 mt-1 rounded-full" />
          </div>

          {step === 0 && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-700">שם הקבוצה *</Label>
                  <Input value={form.group_name} onChange={e => set('group_name', e.target.value)} placeholder="למשל: תנועת הצופים - גדוד 12" className="mt-1" />
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
                  <Input value={form.client_name} onChange={e => set('client_name', e.target.value)} placeholder="שם מלא" className="mt-1" />
                </div>
              </div>
              <div>
                <Label className="text-gray-700">טלפון</Label>
                <Input type="tel" value={form.client_phone} onChange={e => set('client_phone', e.target.value)} placeholder="050-0000000" className="mt-1" />
              </div>

              {/* Collapsible extra details */}
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
                      <Input value={form.client_org} onChange={e => set('client_org', e.target.value)} placeholder="שם הארגון" className="mt-1" />
                    </div>
                    <div>
                      <Label className="text-gray-700">אימייל</Label>
                      <Input type="email" value={form.client_email} onChange={e => set('client_email', e.target.value)} placeholder="email@example.com" className="mt-1" />
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
                      <Label className="text-gray-700">בנים</Label>
                      <Input type="number" value={form.boys_count} onChange={e => set('boys_count', e.target.value)} className="mt-1" />
                    </div>
                    <div>
                      <Label className="text-gray-700">בנות</Label>
                      <Input type="number" value={form.girls_count} onChange={e => set('girls_count', e.target.value)} className="mt-1" />
                    </div>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </div>
          )}

          {step === 1 && (
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

              {/* Upgraded coffee add-on */}
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

          {step === 2 && (
            <div className="space-y-5">
              {/* Info box */}
              <div className="bg-gray-100 rounded-xl p-4 text-sm text-gray-600 space-y-1">
                <p className="font-semibold text-gray-700 mb-2">סוגי האוהלים הזמינים:</p>
                {TENT_TYPES.map(t => (
                  <p key={t.type}>{t.emoji} {t.label} — {t.beds} מיטות באוהל (עד {t.maxTents} אוהלים)</p>
                ))}
              </div>

              <p className="text-sm text-gray-500 text-center">נא לציין כמה אוהלים מכל סוג עבור בנים ובנות</p>

              {/* Table */}
              <div className="border border-gray-200 rounded-xl overflow-hidden">
                {/* Header */}
                <div className="grid grid-cols-3 bg-gray-50 border-b border-gray-200 text-sm font-semibold text-gray-600">
                  <div className="p-3">סוג האוהל</div>
                  <div className="p-3 text-center">מס׳ אוהלים — בנות</div>
                  <div className="p-3 text-center">מס׳ אוהלים — בנים</div>
                </div>
                {/* Rows */}
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

          {step === 3 && (
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
            {step < STEPS.length - 1 ? (
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
