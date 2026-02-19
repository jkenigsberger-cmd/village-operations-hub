import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { differenceInCalendarDays, parseISO, addDays, format } from 'date-fns';
import { AdminLayout } from '@/components/AdminLayout';
import { useQuotes } from '@/hooks/useQuotes';
import { useAdminGroups } from '@/hooks/useAdminGroups';
import { useSupabaseAllocations } from '@/hooks/useSupabaseAllocations';
import {
  QuoteRecord,
  QuoteSnapshot,
  QuoteClientDetails,
  QuotePricing,
  QuoteTotals,
  QuoteStatus,
  QuoteAudience,
  StudentActivityType,
  QuoteWorkshop,
  QuoteLecture,
  QuoteAddon,
  QuoteCustomAdjustment,
  createEmptySnapshot,
  createEmptyClientDetails,
  createEmptyPricing,
  createEmptyTotals,
  STUDENT_PRICES,
  ADULT_TENT_PRICES,
  WORKSHOP_PRICES,
  COFFEE_CORNER_PRICE_PER_PERSON,
  VAT_RATE,
  QUOTE_STATUS_LABELS,
  AUDIENCE_LABELS,
  ACTIVITY_TYPE_LABELS,
  WORKSHOP_CATALOG,
  LECTURE_CATALOG,
} from '@/types/quote';
import {
  buildQuoteSnapshotFromSupabase,
  computeQuoteTotals,
  buildQuoteDocHTML,
  downloadDocHTML,
} from '@/lib/quoteUtils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  FileText,
  Plus,
  Save,
  Send,
  Download,
  Trash2,
  Copy,
  Loader2,
  ArrowRight,
  Receipt,
  ClipboardList,
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { NumericInput } from '@/components/NumericInput';

import { he } from 'date-fns/locale';

const generateId = () => Math.random().toString(36).substring(2, 11);

const STATUS_COLORS: Record<QuoteStatus, string> = {
  draft: 'bg-muted text-muted-foreground',
  sent: 'bg-blue-100 text-blue-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
  expired: 'bg-orange-100 text-orange-800',
};

const AdminQuotes = () => {
  const { quotes, isLoading: quotesLoading, createQuote, updateQuote, createNewVersion, deleteQuote } = useQuotes();
  const { groups, activeGroups } = useAdminGroups();
  const { allocations } = useSupabaseAllocations();

  // State
  const [selectedQuoteId, setSelectedQuoteId] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Edit form state
  const [editGroupId, setEditGroupId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editSnapshot, setEditSnapshot] = useState<QuoteSnapshot>(createEmptySnapshot());
  const [editClientDetails, setEditClientDetails] = useState<QuoteClientDetails>(createEmptyClientDetails());
  const [editPricing, setEditPricing] = useState<QuotePricing>(createEmptyPricing());

  const selectedQuote = useMemo(() =>
    quotes.find(q => q.id === selectedQuoteId) || null,
    [quotes, selectedQuoteId]
  );

  // Compute totals live
  const computedTotals = useMemo(() =>
    computeQuoteTotals(editSnapshot, editPricing),
    [editSnapshot, editPricing]
  );

  // Load quote into edit form
  const loadQuoteIntoForm = useCallback((quote: QuoteRecord) => {
    setEditGroupId(quote.groupId);
    setEditTitle(quote.title || '');
    setEditSnapshot(quote.snapshot);
    setEditClientDetails(quote.clientDetails);
    setEditPricing(quote.pricing);
  }, []);

  // Start new quote
  const handleNewQuote = useCallback((groupId?: string) => {
    if (groupId) {
      const group = groups.find(g => g.id === groupId);
      if (group) {
        const snapshot = buildQuoteSnapshotFromSupabase(group, allocations, group.vipTentConfigs);
        setEditSnapshot(snapshot);
        setEditGroupId(groupId);
        setEditTitle('');
        setEditClientDetails({
          clientName: group.reservedBy || group.groupName,
          clientPhone: group.contactPhone,
        });
        setEditPricing(createEmptyPricing());
      }
    } else {
      setEditGroupId(null);
      setEditTitle('');
      setEditSnapshot(createEmptySnapshot());
      setEditClientDetails(createEmptyClientDetails());
      setEditPricing(createEmptyPricing());
    }
    setSelectedQuoteId(null);
    setIsEditing(true);
  }, [groups, allocations]);

  // Save quote
  const handleSave = useCallback(async () => {
    setIsSaving(true);
    try {
      const totals = computeQuoteTotals(editSnapshot, editPricing);

      if (selectedQuoteId) {
        await updateQuote(selectedQuoteId, {
          title: editTitle || undefined,
          snapshot: editSnapshot,
          clientDetails: editClientDetails,
          pricing: editPricing,
          totals,
        });
        toast({ title: 'הצעת המחיר נשמרה בהצלחה' });
      } else {
        const created = await createQuote({
          groupId: editGroupId,
          title: editTitle || undefined,
          snapshot: editSnapshot,
          clientDetails: editClientDetails,
          pricing: editPricing,
          totals,
        });
        if (created) {
          setSelectedQuoteId(created.id);
          toast({ title: 'הצעת מחיר חדשה נוצרה' });
        }
      }
    } catch (err) {
      toast({ title: 'שגיאה בשמירה', description: String(err), variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  }, [selectedQuoteId, editGroupId, editTitle, editSnapshot, editClientDetails, editPricing, updateQuote, createQuote]);

  // Create new version
  const handleNewVersion = useCallback(async () => {
    if (!selectedQuote) return;
    setIsSaving(true);
    try {
      const newQuote = await createNewVersion(selectedQuote);
      if (newQuote) {
        setSelectedQuoteId(newQuote.id);
        loadQuoteIntoForm(newQuote);
        toast({ title: `גרסה ${newQuote.version} נוצרה` });
      }
    } catch (err) {
      toast({ title: 'שגיאה ביצירת גרסה', variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  }, [selectedQuote, createNewVersion, loadQuoteIntoForm]);

  // Mark as sent
  const handleMarkSent = useCallback(async () => {
    if (!selectedQuoteId) return;
    await updateQuote(selectedQuoteId, { status: 'sent' });
    toast({ title: 'הצעת המחיר סומנה כנשלחה' });
  }, [selectedQuoteId, updateQuote]);

  // Download documents
  const handleDownload = useCallback((type: 'client' | 'operational') => {
    if (!selectedQuote) return;
    const quoteWithTotals = { ...selectedQuote, totals: computedTotals };
    const html = buildQuoteDocHTML(type, quoteWithTotals);
    const prefix = type === 'client' ? 'הצעת-מחיר' : 'דף-תפעול';
    const name = editSnapshot.groupName || editTitle || 'ללא-שם';
    downloadDocHTML(html, `${prefix}-${name}-v${selectedQuote.version}.html`);
  }, [selectedQuote, computedTotals, editSnapshot.groupName, editTitle]);

  // Delete
  const handleDelete = useCallback(async () => {
    if (!selectedQuoteId) return;
    await deleteQuote(selectedQuoteId);
    setSelectedQuoteId(null);
    setIsEditing(false);
    setShowDeleteDialog(false);
    toast({ title: 'ההצעה נמחקה' });
  }, [selectedQuoteId, deleteQuote]);

  // When audience changes, update accommodation price and filter incompatible content
  const handleAudienceChange = (audience: QuoteAudience) => {
    setEditPricing(prev => {
      // Filter out workshops not available for new audience
      const filteredWorkshops = prev.workshops.filter(w => {
        const catalogItem = WORKSHOP_CATALOG.find(c => c.catalogId === w.catalogId);
        if (!catalogItem) return false;
        return audience === 'students' || catalogItem.adultsPrice !== null;
      });

      // Update prices for remaining workshops
      const updatedWorkshops: QuoteWorkshop[] = filteredWorkshops.map(w => {
        const catalogItem = WORKSHOP_CATALOG.find(c => c.catalogId === w.catalogId)!;
        const price = audience === 'students' ? catalogItem.studentsPrice : catalogItem.adultsPrice!;
        return { ...w, price, audience };
      });

      const removedCount = prev.workshops.length - updatedWorkshops.length;
      if (removedCount > 0) {
        toast({ title: `הוסרו ${removedCount} תכנים שאינם זמינים לקהל שנבחר` });
      }

      return {
        ...prev,
        audience,
        activityType: audience === 'students' ? (prev.activityType || 'midweek_lodging') : undefined,
        accommodationPricePerPerson: audience === 'students'
          ? STUDENT_PRICES[prev.activityType || 'midweek_lodging']
          : undefined,
        accommodationPriceTent3: audience === 'adults' ? ADULT_TENT_PRICES.tent3 : undefined,
        accommodationPriceTent68: audience === 'adults' ? ADULT_TENT_PRICES.tent68 : undefined,
        workshops: updatedWorkshops,
      };
    });
  };

  const handleActivityTypeChange = (type: StudentActivityType) => {
    setEditPricing(prev => ({
      ...prev,
      activityType: type,
      accommodationPricePerPerson: STUDENT_PRICES[type],
    }));
  };

  // Workshop helpers - catalog based
  const addWorkshopFromCatalog = (catalogId: string) => {
    const item = WORKSHOP_CATALOG.find(c => c.catalogId === catalogId);
    if (!item) return;
    const price = editPricing.audience === 'students' ? item.studentsPrice : item.adultsPrice!;
    setEditPricing(prev => ({
      ...prev,
      workshops: [...prev.workshops, {
        id: generateId(),
        catalogId: item.catalogId,
        name: item.name,
        price,
        audience: prev.audience,
        quantity: 1,
      }],
    }));
  };

  const updateWorkshop = (id: string, updates: Partial<QuoteWorkshop>) => {
    setEditPricing(prev => ({
      ...prev,
      workshops: prev.workshops.map(w => w.id === id ? { ...w, ...updates } : w),
    }));
  };

  const removeWorkshop = (id: string) => {
    setEditPricing(prev => ({
      ...prev,
      workshops: prev.workshops.filter(w => w.id !== id),
    }));
  };

  // Lecture helpers - catalog based
  const addLectureFromCatalog = (catalogId: string) => {
    const item = LECTURE_CATALOG.find(c => c.catalogId === catalogId);
    if (!item) return;
    setEditPricing(prev => ({
      ...prev,
      lectures: [...prev.lectures, {
        id: generateId(),
        catalogId: item.catalogId,
        name: item.name,
        lecturer: item.lecturer,
        price: item.price,
        includesVat: item.includesVat,
        vatRate: item.vatRate,
        quantity: 1,
      }],
    }));
  };

  const updateLecture = (id: string, updates: Partial<QuoteLecture>) => {
    setEditPricing(prev => ({
      ...prev,
      lectures: prev.lectures.map(l => l.id === id ? { ...l, ...updates } : l),
    }));
  };

  const removeLecture = (id: string) => {
    setEditPricing(prev => ({
      ...prev,
      lectures: prev.lectures.filter(l => l.id !== id),
    }));
  };

  // Addon helpers
  const addAddon = () => {
    setEditPricing(prev => ({
      ...prev,
      addons: [...prev.addons, { id: generateId(), name: '', pricePerPerson: 0, quantity: 1 }],
    }));
  };

  const updateAddon = (id: string, updates: Partial<QuoteAddon>) => {
    setEditPricing(prev => ({
      ...prev,
      addons: prev.addons.map(a => a.id === id ? { ...a, ...updates } : a),
    }));
  };

  const removeAddon = (id: string) => {
    setEditPricing(prev => ({
      ...prev,
      addons: prev.addons.filter(a => a.id !== id),
    }));
  };

  // Custom adjustments
  const addAdjustment = () => {
    setEditPricing(prev => ({
      ...prev,
      customAdjustments: [...prev.customAdjustments, { id: generateId(), description: '', amount: 0 }],
    }));
  };

  const updateAdjustment = (id: string, updates: Partial<QuoteCustomAdjustment>) => {
    setEditPricing(prev => ({
      ...prev,
      customAdjustments: prev.customAdjustments.map(a => a.id === id ? { ...a, ...updates } : a),
    }));
  };

  const removeAdjustment = (id: string) => {
    setEditPricing(prev => ({
      ...prev,
      customAdjustments: prev.customAdjustments.filter(a => a.id !== id),
    }));
  };

  // Format currency
  const fc = (n: number) => `₪${n.toLocaleString('he-IL')}`;

  if (quotesLoading) {
    return (
      <AdminLayout title="הצעות מחיר" subtitle="ניהול הצעות מחיר לקבוצות" section="management">
        <div className="flex justify-center py-20">
          <Loader2 className="w-10 h-10 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  // ============ LIST VIEW ============
  if (!isEditing && !selectedQuoteId) {
    return (
      <AdminLayout title="הצעות מחיר" subtitle="ניהול הצעות מחיר לקבוצות" section="management">
        <div className="space-y-6">
          {/* Actions */}
          <div className="flex flex-wrap gap-3">
            <Button onClick={() => handleNewQuote()} className="gap-2">
              <Plus className="w-4 h-4" />
              הצעה חדשה (עצמאית)
            </Button>
            <Select onValueChange={(v) => handleNewQuote(v)}>
              <SelectTrigger className="w-64">
                <SelectValue placeholder="הצעה חדשה מקבוצה..." />
              </SelectTrigger>
              <SelectContent>
                {activeGroups.map(g => (
                  <SelectItem key={g.id} value={g.id}>
                    {g.groupName} ({format(parseISO(g.startDate), 'dd/MM', { locale: he })})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Quotes list */}
          {quotes.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg">אין הצעות מחיר עדיין</p>
                <p>צור הצעה חדשה כדי להתחיל</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {quotes.map(q => {
                const group = q.groupId ? groups.find(g => g.id === q.groupId) : null;
                return (
                  <Card
                    key={q.id}
                    className="cursor-pointer hover:border-primary/50 transition-colors"
                    onClick={() => {
                      setSelectedQuoteId(q.id);
                      loadQuoteIntoForm(q);
                      setIsEditing(true);
                    }}
                  >
                    <CardContent className="py-4">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-3">
                          <FileText className="w-5 h-5 text-muted-foreground" />
                          <div>
                            <div className="font-bold">
                              {q.snapshot.groupName || q.title || 'ללא שם'}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              גרסה {q.version} • {format(parseISO(q.createdAt), 'dd/MM/yyyy', { locale: he })}
                              {group && ` • ${group.groupName}`}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-bold text-lg">{fc(q.totals.totalAfterDiscount)}</span>
                          <Badge className={STATUS_COLORS[q.status]}>
                            {QUOTE_STATUS_LABELS[q.status]}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </AdminLayout>
    );
  }

  // ============ EDIT VIEW ============
  return (
    <AdminLayout title="הצעת מחיר" subtitle={editSnapshot.groupName || editTitle || 'חדשה'} section="management">
      <div className="space-y-6">
        {/* Top actions bar */}
        <div className="flex flex-wrap gap-3 items-center sticky top-0 z-10 bg-background py-3 -mx-4 px-4 border-b">
          <Button variant="ghost" onClick={() => { setIsEditing(false); setSelectedQuoteId(null); }} className="gap-2">
            <ArrowRight className="w-4 h-4" />
            חזרה לרשימה
          </Button>
          <div className="flex-1" />
          <Button onClick={handleSave} disabled={isSaving} className="gap-2">
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            שמור
          </Button>
          {selectedQuoteId && (
            <>
              <Button variant="outline" onClick={handleNewVersion} disabled={isSaving} className="gap-2">
                <Copy className="w-4 h-4" />
                גרסה חדשה
              </Button>
              <Button variant="outline" onClick={handleMarkSent} className="gap-2">
                <Send className="w-4 h-4" />
                סמן כנשלח
              </Button>
              <Button variant="outline" onClick={() => handleDownload('client')} className="gap-2">
                <Receipt className="w-4 h-4" />
                הורד ללקוח
              </Button>
              <Button variant="outline" onClick={() => handleDownload('operational')} className="gap-2">
                <ClipboardList className="w-4 h-4" />
                הורד תפעול
              </Button>
              <Button variant="destructive" size="icon" onClick={() => setShowDeleteDialog(true)}>
                <Trash2 className="w-4 h-4" />
              </Button>
            </>
          )}
        </div>

        {/* Status badge */}
        {selectedQuote && (
          <div className="flex items-center gap-3">
            <Badge className={STATUS_COLORS[selectedQuote.status]}>
              {QUOTE_STATUS_LABELS[selectedQuote.status]}
            </Badge>
            <span className="text-sm text-muted-foreground">גרסה {selectedQuote.version}</span>
          </div>
        )}

        {/* Title for standalone */}
        {!editGroupId && (
          <Card>
            <CardHeader><CardTitle>כותרת הצעה</CardTitle></CardHeader>
            <CardContent>
              <Input
                value={editTitle}
                onChange={e => setEditTitle(e.target.value)}
                placeholder="שם / כותרת ההצעה"
              />
            </CardContent>
          </Card>
        )}

        {/* Client details */}
        <Card>
          <CardHeader><CardTitle>פרטי לקוח</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>שם לקוח *</Label>
              <Input
                value={editClientDetails.clientName}
                onChange={e => setEditClientDetails(prev => ({ ...prev, clientName: e.target.value }))}
              />
            </div>
            <div>
              <Label>ארגון</Label>
              <Input
                value={editClientDetails.clientOrg || ''}
                onChange={e => setEditClientDetails(prev => ({ ...prev, clientOrg: e.target.value }))}
              />
            </div>
            <div>
              <Label>טלפון</Label>
              <Input
                value={editClientDetails.clientPhone || ''}
                onChange={e => setEditClientDetails(prev => ({ ...prev, clientPhone: e.target.value }))}
              />
            </div>
            <div>
              <Label>דוא"ל</Label>
              <Input
                value={editClientDetails.clientEmail || ''}
                onChange={e => setEditClientDetails(prev => ({ ...prev, clientEmail: e.target.value }))}
              />
            </div>
            <div>
              <Label>איש קשר</Label>
              <Input
                value={editClientDetails.contactPerson || ''}
                onChange={e => setEditClientDetails(prev => ({ ...prev, contactPerson: e.target.value }))}
              />
            </div>
          </CardContent>
        </Card>

        {/* Snapshot / Group details */}
        <Card>
          <CardHeader><CardTitle>פרטי פעילות</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>שם קבוצה</Label>
              <Input
                value={editSnapshot.groupName}
                onChange={e => setEditSnapshot(prev => ({ ...prev, groupName: e.target.value }))}
              />
            </div>
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
            <div>
              <Label>סה"כ משתתפים</Label>
              <NumericInput
                value={editSnapshot.totalPax}
                onChange={v => setEditSnapshot(prev => ({ ...prev, totalPax: v }))}
                min={0}
              />
            </div>
            <div>
              <Label>חניכים</Label>
              <NumericInput
                value={editSnapshot.studentsTotal}
                onChange={v => setEditSnapshot(prev => ({ ...prev, studentsTotal: v, studentsOverride: true }))}
                min={0}
              />
            </div>
            <div>
              <Label>צוות</Label>
              <NumericInput
                value={editSnapshot.staffTotal}
                onChange={v => setEditSnapshot(prev => ({ ...prev, staffTotal: v, staffOverride: true }))}
                min={0}
              />
            </div>
          </CardContent>
        </Card>

        {/* Pricing config */}
        <Card>
          <CardHeader><CardTitle>תמחור</CardTitle></CardHeader>
          <CardContent className="space-y-6">
            {/* Audience */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

              {editPricing.audience === 'students' && (
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
              )}
            </div>

            {/* Accommodation pricing */}
            {editPricing.audience === 'students' ? (
              <div>
                <Label>מחיר לאדם (אירוח)</Label>
                <NumericInput
                  value={editPricing.accommodationPricePerPerson || 0}
                  onChange={v => setEditPricing(prev => ({ ...prev, accommodationPricePerPerson: v }))}
                  min={0}
                />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

            <Separator />

            {/* Workshops - catalog based */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold">סדנאות</h3>
                <Select onValueChange={addWorkshopFromCatalog}>
                  <SelectTrigger className="w-56">
                    <SelectValue placeholder="הוסף סדנה..." />
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
                          {item.name}
                          {unavailable ? ' (לא זמין לקהל זה)' : ''}
                          {alreadyAdded ? ' (כבר נוסף)' : ''}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
              {editPricing.workshops.map(w => (
                <div key={w.id} className="flex items-center gap-3 mb-2 p-2 rounded border bg-muted/30">
                  <div className="flex-1 font-medium text-sm">{w.name}</div>
                  <div className="text-sm text-muted-foreground">{fc(w.price)}</div>
                  <div className="w-20">
                    <NumericInput value={w.quantity} onChange={v => updateWorkshop(w.id, { quantity: v })} min={1} />
                  </div>
                  <div className="text-sm font-medium w-20 text-left">{fc(w.price * w.quantity)}</div>
                  <Button variant="ghost" size="icon" onClick={() => removeWorkshop(w.id)}>
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>

            <Separator />

            {/* Lectures - catalog based */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold">הרצאות</h3>
                <Select onValueChange={addLectureFromCatalog}>
                  <SelectTrigger className="w-56">
                    <SelectValue placeholder="הוסף הרצאה..." />
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
                          {item.name} - {item.lecturer}
                          {alreadyAdded ? ' (כבר נוסף)' : ''}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
              {editPricing.lectures.map(l => {
                const totalPrice = l.includesVat ? l.price + (l.price * l.vatRate) : l.price;
                return (
                  <div key={l.id} className="flex items-center gap-3 mb-2 p-2 rounded border bg-muted/30">
                    <div className="flex-1">
                      <div className="font-medium text-sm">{l.name}</div>
                      <div className="text-xs text-muted-foreground">{l.lecturer}</div>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {fc(totalPrice)}
                      {l.includesVat && <Badge variant="outline" className="mr-1 text-xs">כולל מע״מ</Badge>}
                    </div>
                    <div className="w-20">
                      <NumericInput value={l.quantity} onChange={v => updateLecture(l.id, { quantity: v })} min={1} />
                    </div>
                    <div className="text-sm font-medium w-20 text-left">{fc(totalPrice * l.quantity)}</div>
                    <Button variant="ghost" size="icon" onClick={() => removeLecture(l.id)}>
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                );
              })}
            </div>

            <Separator />

            {/* Coffee corner */}
            <div className="flex items-center gap-4">
              <Switch
                checked={editPricing.coffeeCorner?.enabled || false}
                onCheckedChange={v => setEditPricing(prev => ({
                  ...prev,
                  coffeeCorner: { enabled: v, pricePerPerson: prev.coffeeCorner?.pricePerPerson || COFFEE_CORNER_PRICE_PER_PERSON },
                }))}
              />
              <Label>פינת קפה ({fc(editPricing.coffeeCorner?.pricePerPerson || COFFEE_CORNER_PRICE_PER_PERSON)} לאדם)</Label>
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

            <Separator />

            {/* Addons */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold">תוספות</h3>
                <Button variant="outline" size="sm" onClick={addAddon} className="gap-1">
                  <Plus className="w-3 h-3" /> הוסף תוספת
                </Button>
              </div>
              {editPricing.addons.map(a => (
                <div key={a.id} className="flex items-end gap-3 mb-2">
                  <div className="flex-1">
                    <Input placeholder="שם תוספת" value={a.name} onChange={e => updateAddon(a.id, { name: e.target.value })} />
                  </div>
                  <div className="w-28">
                    <NumericInput value={a.pricePerPerson} onChange={v => updateAddon(a.id, { pricePerPerson: v })} min={0} />
                  </div>
                  <div className="w-20">
                    <NumericInput value={a.quantity} onChange={v => updateAddon(a.id, { quantity: v })} min={1} />
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => removeAddon(a.id)}>
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>

            <Separator />

            {/* Custom adjustments */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold">התאמות מותאמות</h3>
                <Button variant="outline" size="sm" onClick={addAdjustment} className="gap-1">
                  <Plus className="w-3 h-3" /> הוסף התאמה
                </Button>
              </div>
              {editPricing.customAdjustments.map(adj => (
                <div key={adj.id} className="flex items-end gap-3 mb-2">
                  <div className="flex-1">
                    <Input placeholder="תיאור" value={adj.description} onChange={e => updateAdjustment(adj.id, { description: e.target.value })} />
                  </div>
                  <div className="w-32">
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
            </div>

            <Separator />

            {/* Discount */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
          </CardContent>
        </Card>

        {/* Totals summary */}
        <Card className="border-primary/30">
          <CardHeader><CardTitle>סיכום</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span>אירוח/לינה</span><span>{fc(computedTotals.accommodationSubtotal)}</span></div>
              {computedTotals.workshopsSubtotal > 0 && <div className="flex justify-between"><span>סדנאות</span><span>{fc(computedTotals.workshopsSubtotal)}</span></div>}
              {computedTotals.lecturesSubtotal > 0 && <div className="flex justify-between"><span>הרצאות</span><span>{fc(computedTotals.lecturesSubtotal)}</span></div>}
              {computedTotals.lecturesVatAmount > 0 && <div className="flex justify-between text-muted-foreground"><span>מע"מ על הרצאות</span><span>{fc(computedTotals.lecturesVatAmount)}</span></div>}
              {computedTotals.coffeeCornerSubtotal > 0 && <div className="flex justify-between"><span>פינת קפה</span><span>{fc(computedTotals.coffeeCornerSubtotal)}</span></div>}
              {computedTotals.addonsSubtotal > 0 && <div className="flex justify-between"><span>תוספות</span><span>{fc(computedTotals.addonsSubtotal)}</span></div>}
              {computedTotals.customAdjustmentsSubtotal !== 0 && <div className="flex justify-between"><span>התאמות</span><span>{fc(computedTotals.customAdjustmentsSubtotal)}</span></div>}
              <Separator />
              <div className="flex justify-between font-medium"><span>סה"כ לפני הנחה</span><span>{fc(computedTotals.subtotalBeforeDiscount)}</span></div>
              {computedTotals.discountAmount > 0 && (
                <div className="flex justify-between text-destructive"><span>הנחה ({editPricing.discountPercent}%)</span><span>-{fc(computedTotals.discountAmount)}</span></div>
              )}
              <Separator />
              <div className="flex justify-between text-lg font-bold">
                <span>סה"כ לתשלום</span>
                <span className="text-primary">{fc(computedTotals.totalAfterDiscount)}</span>
              </div>
              <div className="flex justify-between text-sm text-muted-foreground mt-2">
                <span>מקדמה (30%)</span><span>{fc(computedTotals.advancePayment)}</span>
              </div>
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>יתרה (70%)</span><span>{fc(computedTotals.balancePayment)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Delete dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>מחיקת הצעת מחיר</DialogTitle>
          </DialogHeader>
          <p>האם למחוק את הצעת המחיר? פעולה זו לא ניתנת לביטול.</p>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>ביטול</Button>
            <Button variant="destructive" onClick={handleDelete}>מחק</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminQuotes;
