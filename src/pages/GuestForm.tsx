import React, { useState } from 'react';
import hadorHabaLogo from '@/assets/hador-haba-logo.png';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { CheckCircle2, Loader2 } from 'lucide-react';

const STEPS = [
  'פרטי קבוצה',
  'העדפות מזון',
  'חלוקת אוהלים',
  'לוח זמנים והערות',
];

const DIET_OPTIONS = [
  { key: 'vegetarian', label: 'צמחוני' },
  { key: 'vegan', label: 'טבעוני' },
  { key: 'glutenFree', label: 'ללא גלוטן' },
  { key: 'lactoseFree', label: 'ללא לקטוז' },
  { key: 'allergies', label: 'אלרגיות' },
];

export default function GuestForm() {
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

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
      <div className="min-h-screen bg-[#faf7f2] flex flex-col items-center justify-center p-6" dir="rtl">
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
    <div className="min-h-screen bg-[#faf7f2]" dir="rtl">
      {/* Header */}
      <div className="flex flex-col items-center pt-8 pb-4 px-4">
        <img src={hadorHabaLogo} alt="הדור הבא" className="h-16 md:h-20 mb-4" />
        <h1 className="text-xl md:text-2xl font-bold text-[#3d3929]">שאלון הכנה לאירוח</h1>
        <p className="text-sm text-[#8a7e6b] mt-1">מלאו את הפרטים כדי שנוכל להתכונן לקראתכם</p>
      </div>

      {/* Progress */}
      <div className="max-w-lg mx-auto px-4 mb-6">
        <div className="flex justify-between mb-2">
          {STEPS.map((s, i) => (
            <div key={i} className="flex flex-col items-center flex-1">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-colors ${
                i <= step ? 'bg-[#b5a07a] text-white border-[#b5a07a]' : 'bg-white text-[#c4b89a] border-[#ddd5c4]'
              }`}>
                {i + 1}
              </div>
              <span className="text-[10px] mt-1 text-[#8a7e6b] text-center leading-tight hidden md:block">{s}</span>
            </div>
          ))}
        </div>
        <div className="h-2 bg-[#e8e0d0] rounded-full overflow-hidden">
          <div className="h-full bg-[#b5a07a] transition-all duration-300 rounded-full" style={{ width: `${progress}%` }} />
        </div>
      </div>

      {/* Form Card */}
      <div className="max-w-lg mx-auto px-4 pb-12">
        <Card className="p-6 bg-white/90 border-[#e8e0d0] shadow-sm">
          <h2 className="text-lg font-bold text-[#3d3929] mb-4">{STEPS[step]}</h2>

          {step === 0 && (
            <div className="space-y-4">
              <div><Label>שם הקבוצה *</Label><Input value={form.group_name} onChange={e => set('group_name', e.target.value)} placeholder="למשל: תנועת הצופים - גדוד 12" /></div>
              <div><Label>שם איש קשר</Label><Input value={form.client_name} onChange={e => set('client_name', e.target.value)} placeholder="שם מלא" /></div>
              <div><Label>ארגון / חברה</Label><Input value={form.client_org} onChange={e => set('client_org', e.target.value)} placeholder="שם הארגון" /></div>
              <div><Label>טלפון</Label><Input type="tel" value={form.client_phone} onChange={e => set('client_phone', e.target.value)} placeholder="050-0000000" /></div>
              <div><Label>אימייל</Label><Input type="email" value={form.client_email} onChange={e => set('client_email', e.target.value)} placeholder="email@example.com" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>סה"כ משתתפים</Label><Input type="number" value={form.total_pax} onChange={e => set('total_pax', e.target.value)} /></div>
                <div><Label>צוות / מדריכים</Label><Input type="number" value={form.staff_count} onChange={e => set('staff_count', e.target.value)} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>בנים</Label><Input type="number" value={form.boys_count} onChange={e => set('boys_count', e.target.value)} /></div>
                <div><Label>בנות</Label><Input type="number" value={form.girls_count} onChange={e => set('girls_count', e.target.value)} /></div>
              </div>
              <div><Label>סוג קבוצה</Label><Input value={form.group_type} onChange={e => set('group_type', e.target.value)} placeholder='למשל: תנועת נוער, בי"ס, חברה...' /></div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">סמנו דרישות תזונה מיוחדות:</p>
              {DIET_OPTIONS.map(opt => (
                <div key={opt.key} className="flex items-center gap-3">
                  <Checkbox
                    checked={!!form.special_diets[opt.key]}
                    onCheckedChange={v => set('special_diets', { ...form.special_diets, [opt.key]: v })}
                  />
                  <Label className="cursor-pointer">{opt.label}</Label>
                  {form.special_diets[opt.key] && (
                    <Input
                      className="flex-1"
                      placeholder="כמות / פירוט"
                      value={String(form.special_diets[`${opt.key}_detail`] || '')}
                      onChange={e => set('special_diets', { ...form.special_diets, [`${opt.key}_detail`]: e.target.value })}
                    />
                  )}
                </div>
              ))}
              <div><Label>הערות נוספות לגבי מזון</Label><Textarea value={form.diet_notes} onChange={e => set('diet_notes', e.target.value)} placeholder="אלרגיות ספציפיות, העדפות מיוחדות..." /></div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">ספרו לנו על העדפות חלוקת האוהלים:</p>
              <Textarea
                value={form.tent_distribution_notes}
                onChange={e => set('tent_distribution_notes', e.target.value)}
                placeholder="למשל: הפרדה בין בנים לבנות, מספר אנשים לאוהל, דרישות נגישות..."
                className="min-h-[120px]"
              />
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div>
                <Label>העדפות לוח זמנים / פעילויות</Label>
                <Textarea
                  value={form.schedule_notes}
                  onChange={e => set('schedule_notes', e.target.value)}
                  placeholder="למשל: שעות פעילות מועדפות, פעילויות מבוקשות..."
                  className="min-h-[100px]"
                />
              </div>
              <div>
                <Label>הערות כלליות</Label>
                <Textarea
                  value={form.general_notes}
                  onChange={e => set('general_notes', e.target.value)}
                  placeholder="כל דבר נוסף שחשוב שנדע..."
                  className="min-h-[100px]"
                />
              </div>
            </div>
          )}

          {error && <p className="text-destructive text-sm mt-3">{error}</p>}

          <div className="flex justify-between mt-6 gap-3">
            {step > 0 && (
              <Button variant="outline" onClick={() => setStep(s => s - 1)} className="border-[#ddd5c4] text-[#3d3929]">
                הקודם
              </Button>
            )}
            <div className="flex-1" />
            {step < STEPS.length - 1 ? (
              <Button onClick={() => setStep(s => s + 1)} className="bg-[#b5a07a] hover:bg-[#a08c6a] text-white">
                הבא
              </Button>
            ) : (
              <Button onClick={handleSubmit} disabled={submitting} className="bg-[#b5a07a] hover:bg-[#a08c6a] text-white">
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'שליחה'}
              </Button>
            )}
          </div>
        </Card>

        <p className="text-center text-xs text-[#b5a07a] mt-8">בית הדור הבא · מקום לחוויות ישראליות</p>
      </div>
    </div>
  );
}
