import React from 'react';
import { format, parseISO, addDays, differenceInCalendarDays } from 'date-fns';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { NumericInput } from '@/components/NumericInput';
import { QuoteAvailabilityCalendar } from '@/components/QuoteAvailabilityCalendar';
import {
  QuoteSnapshot,
  QuoteClientDetails,
  QuotePricing,
  QuoteTotals,
  QuoteAudience,
  StudentActivityType,
  QuoteWorkshop,
  QuoteLecture,
  QuoteAddon,
  QuoteCustomAdjustment,
  STUDENT_PRICES,
  ADULT_TENT_PRICES,
  AUDIENCE_LABELS,
  ACTIVITY_TYPE_LABELS,
  WORKSHOP_CATALOG,
  LECTURE_CATALOG,
  COFFEE_CORNER_PRICE_PER_PERSON,
  QUOTE_STATUS_LABELS,
  QuoteStatus,
} from '@/types/quote';
import { Plus, Trash2, Link2, ExternalLink } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

const fc = (n: number) => `₪${n.toLocaleString('he-IL')}`;

interface QuoteEditorTabsProps {
  // State
  editGroupId: string | null;
  editTitle: string;
  editSnapshot: QuoteSnapshot;
  editClientDetails: QuoteClientDetails;
  editPricing: QuotePricing;
  computedTotals: QuoteTotals;
  selectedQuoteId: string | null;
  selectedQuoteStatus?: QuoteStatus;

  // Setters
  setEditTitle: (v: string) => void;
  setEditSnapshot: React.Dispatch<React.SetStateAction<QuoteSnapshot>>;
  setEditClientDetails: React.Dispatch<React.SetStateAction<QuoteClientDetails>>;
  setEditPricing: React.Dispatch<React.SetStateAction<QuotePricing>>;

  // Handlers
  handleAudienceChange: (audience: QuoteAudience) => void;
  handleActivityTypeChange: (type: StudentActivityType) => void;
  addWorkshopFromCatalog: (catalogId: string) => void;
  updateWorkshop: (id: string, updates: Partial<QuoteWorkshop>) => void;
  removeWorkshop: (id: string) => void;
  addLectureFromCatalog: (catalogId: string) => void;
  updateLecture: (id: string, updates: Partial<QuoteLecture>) => void;
  removeLecture: (id: string) => void;
  addAddon: () => void;
  updateAddon: (id: string, updates: Partial<QuoteAddon>) => void;
  removeAddon: (id: string) => void;
  addAdjustment: () => void;
  updateAdjustment: (id: string, updates: Partial<QuoteCustomAdjustment>) => void;
  removeAdjustment: (id: string) => void;

  // Groups for linking
  activeGroups: Array<{ id: string; groupName: string; startDate: string }>;
}

export const QuoteEditorTabs: React.FC<QuoteEditorTabsProps> = ({
  editGroupId,
  editTitle,
  editSnapshot,
  editClientDetails,
  editPricing,
  computedTotals,
  selectedQuoteId,
  selectedQuoteStatus,
  setEditTitle,
  setEditSnapshot,
  setEditClientDetails,
  setEditPricing,
  handleAudienceChange,
  handleActivityTypeChange,
  addWorkshopFromCatalog,
  updateWorkshop,
  removeWorkshop,
  addLectureFromCatalog,
  updateLecture,
  removeLecture,
  addAddon,
  updateAddon,
  removeAddon,
  addAdjustment,
  updateAdjustment,
  removeAdjustment,
  activeGroups,
}) => {
  return (
    <Tabs defaultValue="details" dir="rtl" className="w-full">
      <TabsList className="w-full flex-wrap h-auto gap-1 p-1.5 bg-muted/60 rounded-xl mb-5">
        <TabsTrigger value="details" className="text-xs sm:text-sm rounded-lg">פרטים</TabsTrigger>
        <TabsTrigger value="participants" className="text-xs sm:text-sm rounded-lg">משתתפים ולינה</TabsTrigger>
        <TabsTrigger value="content" className="text-xs sm:text-sm rounded-lg">תוכן</TabsTrigger>
        <TabsTrigger value="extras" className="text-xs sm:text-sm rounded-lg">תוספות והתאמות</TabsTrigger>
        <TabsTrigger value="summary" className="text-xs sm:text-sm rounded-lg">תמחור וסיכום</TabsTrigger>
        <TabsTrigger value="availability" className="text-xs sm:text-sm rounded-lg">זמינות</TabsTrigger>
        <TabsTrigger value="client-link" className="text-xs sm:text-sm rounded-lg">קישור לקוח</TabsTrigger>
      </TabsList>

      {/* ===== TAB 1: פרטים ===== */}
      <TabsContent value="details">
        <Card className="rounded-2xl shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">פרטי ההצעה</CardTitle>
            <p className="text-sm text-muted-foreground">מידע בסיסי על ההצעה, הלקוח והתאריכים</p>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Group link + title + status */}
            <div className="space-y-4">
              {editGroupId && (
                <div className="flex items-center gap-2 text-sm">
                  <Link2 className="w-4 h-4 text-muted-foreground" />
                  <span className="text-muted-foreground">מקושר לקבוצה:</span>
                  <Badge variant="outline">{editSnapshot.groupName}</Badge>
                </div>
              )}
              <div>
                <Label>כותרת ההצעה</Label>
                <Input
                  value={editTitle}
                  onChange={e => setEditTitle(e.target.value)}
                  placeholder="שם / כותרת ההצעה"
                />
              </div>
              {selectedQuoteStatus && (
                <div className="flex items-center gap-2">
                  <Label>סטטוס:</Label>
                  <Badge>{QUOTE_STATUS_LABELS[selectedQuoteStatus]}</Badge>
                </div>
              )}
            </div>

            <Separator />

            {/* Client details */}
            <div>
              <h4 className="font-semibold text-base mb-3">פרטי לקוח</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label>שם לקוח / ארגון *</Label>
                  <Input
                    value={editClientDetails.clientName}
                    onChange={e => setEditClientDetails(prev => ({ ...prev, clientName: e.target.value }))}
                  />
                </div>
                <div>
                  <Label>איש קשר</Label>
                  <Input
                    value={editClientDetails.contactPerson || ''}
                    onChange={e => setEditClientDetails(prev => ({ ...prev, contactPerson: e.target.value }))}
                  />
                </div>
                <div>
                  <Label>אימייל</Label>
                  <Input
                    type="email"
                    value={editClientDetails.clientEmail || ''}
                    onChange={e => setEditClientDetails(prev => ({ ...prev, clientEmail: e.target.value }))}
                    placeholder="email@example.com"
                  />
                </div>
                <div>
                  <Label>טלפון</Label>
                  <Input
                    value={editClientDetails.clientPhone || ''}
                    onChange={e => setEditClientDetails(prev => ({ ...prev, clientPhone: e.target.value }))}
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* Invoice info */}
            <div>
              <h4 className="font-semibold text-base mb-3">פרטי חשבונית</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label>שם לחשבונית</Label>
                  <Input
                    value={editClientDetails.clientOrg || ''}
                    onChange={e => setEditClientDetails(prev => ({ ...prev, clientOrg: e.target.value }))}
                  />
                </div>
                <div>
                  <Label>ח.פ / ע.מ</Label>
                  <Input
                    value={editClientDetails.clientTaxId || ''}
                    onChange={e => setEditClientDetails(prev => ({ ...prev, clientTaxId: e.target.value }))}
                    placeholder="מספר עוסק"
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* Dates */}
            <div>
              <h4 className="font-semibold text-base mb-3">תאריכים</h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <Label>תאריך התחלה</Label>
                  <Input
                    type="date"
                    value={editSnapshot.startDate}
                    onChange={e => {
                      const sd = e.target.value;
                      setEditSnapshot(prev => {
                        const nights = prev.endDate && sd
                          ? Math.max(0, differenceInCalendarDays(parseISO(prev.endDate), parseISO(sd)))
                          : 0;
                        return { ...prev, startDate: sd, nights };
                      });
                    }}
                  />
                </div>
                <div>
                  <Label>תאריך סיום</Label>
                  <Input
                    type="date"
                    value={editSnapshot.endDate}
                    onChange={e => {
                      const ed = e.target.value;
                      setEditSnapshot(prev => {
                        const nights = prev.startDate && ed
                          ? Math.max(0, differenceInCalendarDays(parseISO(ed), parseISO(prev.startDate)))
                          : 0;
                        return { ...prev, endDate: ed, nights };
                      });
                    }}
                  />
                </div>
                <div>
                  <Label>מס׳ לילות</Label>
                  <NumericInput value={editSnapshot.nights} onChange={v => setEditSnapshot(prev => {
                    const endDate = prev.startDate
                      ? format(addDays(parseISO(prev.startDate), v), 'yyyy-MM-dd')
                      : prev.endDate;
                    return { ...prev, nights: v, endDate };
                  })} min={0} />
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-1">נמשך מהמערכת – ניתן לעריכה</p>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      {/* ===== TAB 2: משתתפים ולינה ===== */}
      <TabsContent value="participants">
        <div className="space-y-5">
          {/* Audience + Activity type */}
          <Card className="rounded-2xl shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">קהל יעד וסוג פעילות</CardTitle>
              <p className="text-sm text-muted-foreground">בחר את סוג הפעילות וקהל היעד – המחירים יתעדכנו בהתאם</p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label>קהל יעד</Label>
                  <Select value={editPricing.audience} onValueChange={(v) => handleAudienceChange(v as QuoteAudience)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="students">{AUDIENCE_LABELS.students}</SelectItem>
                      <SelectItem value="adults">{AUDIENCE_LABELS.adults}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>סוג פעילות</Label>
                  <Select value={editPricing.activityType || 'midweek_lodging'} onValueChange={(v) => handleActivityTypeChange(v as StudentActivityType)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(ACTIVITY_TYPE_LABELS).map(([k, v]) => (
                        <SelectItem key={k} value={k}>{v}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Participant counts */}
          <Card className="rounded-2xl shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">מספר משתתפים</CardTitle>
              <p className="text-xs text-muted-foreground">נמשך מהמערכת – ניתן לעריכה ידנית</p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>חניכים</Label>
                  <NumericInput
                    value={editSnapshot.studentsTotal}
                    onChange={v => setEditSnapshot(prev => ({ ...prev, studentsTotal: v, totalPax: v + prev.staffTotal, studentsOverride: true }))}
                    min={0}
                  />
                </div>
                <div>
                  <Label>צוות</Label>
                  <NumericInput
                    value={editSnapshot.staffTotal}
                    onChange={v => setEditSnapshot(prev => ({ ...prev, staffTotal: v, totalPax: prev.studentsTotal + v, staffOverride: true }))}
                    min={0}
                  />
                </div>
                <div>
                  <Label>סה"כ משתתפים</Label>
                  <NumericInput
                    value={editSnapshot.totalPax}
                    onChange={v => setEditSnapshot(prev => ({ ...prev, totalPax: v }))}
                    min={0}
                  />
                </div>
              </div>
              <div>
                <Label className="mt-3 block">שם קבוצה</Label>
                <Input
                  value={editSnapshot.groupName}
                  onChange={e => setEditSnapshot(prev => ({ ...prev, groupName: e.target.value }))}
                />
              </div>
            </CardContent>
          </Card>

          {/* Accommodation pricing */}
          <Card className="rounded-2xl shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">לינה ותמחור בסיס</CardTitle>
            </CardHeader>
            <CardContent>
              {editPricing.audience === 'students' ? (
                <div className="max-w-xs">
                  <Label>מחיר לאדם (אירוח)</Label>
                  <NumericInput
                    value={editPricing.accommodationPricePerPerson || 0}
                    onChange={v => setEditPricing(prev => ({ ...prev, accommodationPricePerPerson: v }))}
                    min={0}
                  />
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label>אוהל 3 מיטות - כמות</Label>
                    <NumericInput
                      value={editSnapshot.tent3Count}
                      onChange={v => setEditSnapshot(prev => ({ ...prev, tent3Count: v, tentCountsOverride: true }))}
                      min={0}
                    />
                    <Label className="mt-2 block">מחיר ללילה</Label>
                    <NumericInput
                      value={editPricing.accommodationPriceTent3 || ADULT_TENT_PRICES.tent3}
                      onChange={v => setEditPricing(prev => ({ ...prev, accommodationPriceTent3: v }))}
                      min={0}
                    />
                  </div>
                  <div>
                    <Label>אוהל 6/8 מיטות - כמות</Label>
                    <NumericInput
                      value={editSnapshot.tent68Count}
                      onChange={v => setEditSnapshot(prev => ({ ...prev, tent68Count: v, tentCountsOverride: true }))}
                      min={0}
                    />
                    <Label className="mt-2 block">מחיר ללילה</Label>
                    <NumericInput
                      value={editPricing.accommodationPriceTent68 || ADULT_TENT_PRICES.tent68}
                      onChange={v => setEditPricing(prev => ({ ...prev, accommodationPriceTent68: v }))}
                      min={0}
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Coffee corner */}
          <Card className="rounded-2xl shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">פינת קפה</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4 flex-wrap">
                <Switch
                  checked={editPricing.coffeeCorner?.enabled || false}
                  onCheckedChange={v => setEditPricing(prev => ({
                    ...prev,
                    coffeeCorner: { enabled: v, pricePerPerson: prev.coffeeCorner?.pricePerPerson || COFFEE_CORNER_PRICE_PER_PERSON },
                  }))}
                />
                <Label>פינת קפה ועוגיות ({fc(editPricing.coffeeCorner?.pricePerPerson || COFFEE_CORNER_PRICE_PER_PERSON)} לאדם)</Label>
                {editPricing.coffeeCorner?.enabled && (
                  <NumericInput
                    value={editPricing.coffeeCorner.pricePerPerson}
                    onChange={v => setEditPricing(prev => ({
                      ...prev,
                      coffeeCorner: { ...prev.coffeeCorner!, pricePerPerson: v },
                    }))}
                    min={0}
                    className="w-28"
                  />
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </TabsContent>

      {/* ===== TAB 3: תוכן ===== */}
      <TabsContent value="content">
        <Card className="rounded-2xl shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">סדנאות והרצאות</CardTitle>
            <p className="text-sm text-muted-foreground">בחר סדנאות והרצאות מהקטלוג</p>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Workshops */}
            <div>
              <h4 className="font-semibold text-base mb-2">סדנאות</h4>
              <div className="flex items-center gap-2">
                <Select onValueChange={addWorkshopFromCatalog}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="בחר סדנה..." />
                  </SelectTrigger>
                  <SelectContent>
                    {WORKSHOP_CATALOG.map(item => {
                      const alreadyAdded = editPricing.workshops.some(w => w.catalogId === item.catalogId);
                      const unavailable = editPricing.audience === 'adults' && item.adultsPrice === null;
                      return (
                        <SelectItem
                          key={item.catalogId}
                          value={item.catalogId}
                          disabled={alreadyAdded || unavailable}
                        >
                          {item.name} — {editPricing.audience === 'students' ? fc(item.studentsPrice) : (item.adultsPrice !== null ? fc(item.adultsPrice) : 'לא זמין')}
                          {alreadyAdded ? ' ✓' : ''}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
              {editPricing.workshops.length > 0 && (
                <div className="mt-3 space-y-1.5">
                  {editPricing.workshops.map(w => (
                    <div key={w.id} className="flex items-center gap-3 rounded-lg border bg-muted/20 px-3 py-2">
                      <span className="flex-1 text-sm font-medium">{w.name}</span>
                      <span className="text-sm text-muted-foreground">{fc(w.price)}</span>
                      <div className="w-16">
                        <NumericInput value={w.quantity} onChange={v => updateWorkshop(w.id, { quantity: v })} min={1} />
                      </div>
                      <span className="text-sm font-semibold w-16 text-left">{fc(w.price * w.quantity)}</span>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => removeWorkshop(w.id)}>
                        <Trash2 className="w-3.5 h-3.5 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <Separator />

            {/* Lectures */}
            <div>
              <h4 className="font-semibold text-base mb-2">הרצאות</h4>
              <div className="flex items-center gap-2">
                <Select onValueChange={addLectureFromCatalog}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="בחר הרצאה..." />
                  </SelectTrigger>
                  <SelectContent>
                    {LECTURE_CATALOG.map(item => {
                      const alreadyAdded = editPricing.lectures.some(l => l.catalogId === item.catalogId);
                      return (
                        <SelectItem
                          key={item.catalogId}
                          value={item.catalogId}
                          disabled={alreadyAdded}
                        >
                          {item.name} — {item.lecturer} — {fc(item.totalWithVat)}{item.includesVat ? ' (כולל מע״מ)' : ''}
                          {alreadyAdded ? ' ✓' : ''}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
              {editPricing.lectures.length > 0 && (
                <div className="mt-3 space-y-1.5">
                  {editPricing.lectures.map(l => {
                    const lTotal = l.includesVat ? l.price + (l.price * l.vatRate) : l.price;
                    return (
                      <div key={l.id} className="flex items-center gap-3 rounded-lg border bg-muted/20 px-3 py-2">
                        <div className="flex-1 min-w-0">
                          <span className="text-sm font-medium block truncate">{l.name}</span>
                          <span className="text-xs text-muted-foreground">{l.lecturer}</span>
                          {l.includesVat && <Badge variant="outline" className="text-[10px] mr-1">כולל מע״מ</Badge>}
                        </div>
                        <span className="text-sm text-muted-foreground">{fc(lTotal)}</span>
                        <div className="w-16">
                          <NumericInput value={l.quantity} onChange={v => updateLecture(l.id, { quantity: v })} min={1} />
                        </div>
                        <span className="text-sm font-semibold w-16 text-left">{fc(lTotal * l.quantity)}</span>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => removeLecture(l.id)}>
                          <Trash2 className="w-3.5 h-3.5 text-destructive" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      {/* ===== TAB 4: תוספות והתאמות ===== */}
      <TabsContent value="extras">
        <Card className="rounded-2xl shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">תוספות והתאמות</CardTitle>
            <p className="text-sm text-muted-foreground">תוספות, התאמות מיוחדות והנחות</p>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Addons */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold text-base">תוספות</h4>
                <Button variant="outline" size="sm" onClick={addAddon} className="gap-1 rounded-lg">
                  <Plus className="w-3 h-3" /> הוסף
                </Button>
              </div>
              {editPricing.addons.map(a => (
                <div key={a.id} className="flex items-end gap-3 mb-2">
                  <div className="flex-1">
                    <Input placeholder="שם תוספת" value={a.name} onChange={e => updateAddon(a.id, { name: e.target.value })} />
                  </div>
                  <div className="w-24">
                    <NumericInput value={a.pricePerPerson} onChange={v => updateAddon(a.id, { pricePerPerson: v })} min={0} />
                  </div>
                  <div className="w-16">
                    <NumericInput value={a.quantity} onChange={v => updateAddon(a.id, { quantity: v })} min={1} />
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => removeAddon(a.id)}>
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              ))}
              {editPricing.addons.length === 0 && (
                <p className="text-sm text-muted-foreground">אין תוספות</p>
              )}
            </div>

            <Separator />

            {/* Custom adjustments */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold text-base">התאמה מיוחדת</h4>
                <Button variant="outline" size="sm" onClick={addAdjustment} className="gap-1 rounded-lg">
                  <Plus className="w-3 h-3" /> הוסף
                </Button>
              </div>
              {editPricing.customAdjustments.map(adj => (
                <div key={adj.id} className="flex items-end gap-3 mb-2">
                  <div className="flex-1">
                    <Input placeholder="תיאור" value={adj.description} onChange={e => updateAdjustment(adj.id, { description: e.target.value })} />
                  </div>
                  <div className="w-28">
                    <Input
                      type="number"
                      value={adj.amount}
                      onChange={e => updateAdjustment(adj.id, { amount: parseFloat(e.target.value) || 0 })}
                      placeholder="סכום (+ או -)"
                    />
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => removeAdjustment(adj.id)}>
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              ))}
              {editPricing.customAdjustments.length === 0 && (
                <p className="text-sm text-muted-foreground">אין התאמות</p>
              )}
            </div>

            <Separator />

            {/* Discount */}
            <div>
              <h4 className="font-semibold text-base mb-3">הנחה</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label>הנחה (%)</Label>
                  <NumericInput
                    value={editPricing.discountPercent}
                    onChange={v => setEditPricing(prev => ({ ...prev, discountPercent: v }))}
                    min={0}
                    max={100}
                  />
                </div>
                <div>
                  <Label>סיבת הנחה</Label>
                  <Input
                    value={editPricing.discountReason || ''}
                    onChange={e => setEditPricing(prev => ({ ...prev, discountReason: e.target.value }))}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      {/* ===== TAB 5: תמחור וסיכום ===== */}
      <TabsContent value="summary">
        <div className="space-y-5">
          {/* Breakdown */}
          <Card className="rounded-2xl shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">פירוט תמחור</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between py-2 border-b">
                  <span>אירוח / לינה</span>
                  <span className="font-medium">{fc(computedTotals.accommodationSubtotal)}</span>
                </div>
                {computedTotals.workshopsSubtotal > 0 && (
                  <div className="flex justify-between py-2 border-b">
                    <span>סדנאות ({editPricing.workshops.length})</span>
                    <span className="font-medium">{fc(computedTotals.workshopsSubtotal)}</span>
                  </div>
                )}
                {computedTotals.lecturesSubtotal > 0 && (
                  <div className="flex justify-between py-2 border-b">
                    <span>הרצאות ({editPricing.lectures.length})</span>
                    <span className="font-medium">{fc(computedTotals.lecturesSubtotal)}</span>
                  </div>
                )}
                {computedTotals.lecturesVatAmount > 0 && (
                  <div className="flex justify-between py-2 border-b text-muted-foreground">
                    <span>מע״מ על הרצאות</span>
                    <span>{fc(computedTotals.lecturesVatAmount)}</span>
                  </div>
                )}
                {computedTotals.coffeeCornerSubtotal > 0 && (
                  <div className="flex justify-between py-2 border-b">
                    <span>פינת קפה ועוגיות</span>
                    <span className="font-medium">{fc(computedTotals.coffeeCornerSubtotal)}</span>
                  </div>
                )}
                {computedTotals.addonsSubtotal > 0 && (
                  <div className="flex justify-between py-2 border-b">
                    <span>תוספות</span>
                    <span className="font-medium">{fc(computedTotals.addonsSubtotal)}</span>
                  </div>
                )}
                {computedTotals.customAdjustmentsSubtotal !== 0 && (
                  <div className="flex justify-between py-2 border-b">
                    <span>התאמות מיוחדות</span>
                    <span className="font-medium">{fc(computedTotals.customAdjustmentsSubtotal)}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Totals */}
          <Card className="rounded-2xl shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">סיכום כספי</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between text-base">
                  <span>סה"כ לפני הנחה</span>
                  <span className="font-semibold">{fc(computedTotals.subtotalBeforeDiscount)}</span>
                </div>
                {computedTotals.discountAmount > 0 && (
                  <div className="flex justify-between text-destructive">
                    <span>הנחה ({editPricing.discountPercent}%{editPricing.discountReason ? ` — ${editPricing.discountReason}` : ''})</span>
                    <span>-{fc(computedTotals.discountAmount)}</span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between text-xl font-bold text-primary">
                  <span>סה״כ לתשלום</span>
                  <span>{fc(computedTotals.totalAfterDiscount)}</span>
                </div>
                <Separator />
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>מקדמה 30%</span>
                  <span>{fc(computedTotals.advancePayment)}</span>
                </div>
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>יתרה 70%</span>
                  <span>{fc(computedTotals.balancePayment)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </TabsContent>

      {/* ===== TAB 6: זמינות ===== */}
      <TabsContent value="availability">
        <Card className="rounded-2xl shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">לוח זמינות</CardTitle>
            <p className="text-sm text-muted-foreground">בדוק זמינות לינה ופעילויות יומיות למניעת אירועים חופפים</p>
          </CardHeader>
          <CardContent>
            <QuoteAvailabilityCalendar
              highlightStart={editSnapshot.startDate || undefined}
              highlightEnd={editSnapshot.endDate || undefined}
            />
          </CardContent>
        </Card>
      </TabsContent>

      {/* ===== TAB 7: קישור לקוח ===== */}
      <TabsContent value="client-link">
        <Card className="rounded-2xl shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">קישור לקוח</CardTitle>
            <p className="text-sm text-muted-foreground">שליחת שאלון הכנה ללקוח ומעקב תשובות</p>
          </CardHeader>
          <CardContent className="space-y-4">
            {selectedQuoteId && selectedQuoteStatus === 'approved' ? (
              <div className="space-y-4">
                <p className="text-sm">ההצעה אושרה – ניתן לשלוח שאלון הכנה ללקוח:</p>
                <Button
                  variant="outline"
                  className="gap-2"
                  onClick={() => {
                    const base = window.location.hostname.includes('lovableproject.com')
                      ? 'https://glowhadorhaba.lovable.app'
                      : window.location.origin;
                    navigator.clipboard.writeText(`${base}/guest-form?quote=${selectedQuoteId}`);
                    toast({ title: 'הקישור הועתק! 📋', description: 'שלחו את הקישור ללקוח למילוי שאלון הכנה' });
                  }}
                >
                  <ExternalLink className="w-4 h-4" />
                  העתק קישור שאלון לקוח
                </Button>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Link2 className="w-10 h-10 mx-auto mb-3 opacity-40" />
                <p className="text-sm">
                  {!selectedQuoteId
                    ? 'שמור את ההצעה תחילה כדי ליצור קישור ללקוח'
                    : 'סמן את ההצעה כ"אושר" כדי לשלוח שאלון הכנה ללקוח'}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
};
