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
  downloadDocPDF,
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
  CheckCircle2,
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { NumericInput } from '@/components/NumericInput';
import { QuoteAvailabilityCalendar } from '@/components/QuoteAvailabilityCalendar';

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
    if (!selectedQuote) {
      toast({ title: 'יש לשמור את ההצעה לפני הורדה', variant: 'destructive' });
      return;
    }
    const quoteWithTotals = { ...selectedQuote, totals: computedTotals };
    const html = buildQuoteDocHTML(type, quoteWithTotals);
    const prefix = type === 'client' ? 'הצעת-מחיר' : 'דף-תפעול';
    const name = editSnapshot.groupName || editTitle || 'ללא-שם';
    downloadDocPDF(html, `${prefix}-${name}-v${selectedQuote.version}`);
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

      const activityType = prev.activityType || 'midweek_lodging';
      return {
        ...prev,
        audience,
        activityType,
        accommodationPricePerPerson: audience === 'students'
          ? STUDENT_PRICES[activityType]
          : undefined,
        accommodationPriceTent3: (audience === 'adults' && activityType !== 'day_activity') ? ADULT_TENT_PRICES.tent3 : undefined,
        accommodationPriceTent68: (audience === 'adults' && activityType !== 'day_activity') ? ADULT_TENT_PRICES.tent68 : undefined,
        workshops: updatedWorkshops,
      };
    });
  };

  const handleActivityTypeChange = (type: StudentActivityType) => {
    setEditPricing(prev => {
      if (prev.audience === 'adults') {
        return {
          ...prev,
          activityType: type,
          accommodationPriceTent3: type !== 'day_activity' ? ADULT_TENT_PRICES.tent3 : undefined,
          accommodationPriceTent68: type !== 'day_activity' ? ADULT_TENT_PRICES.tent68 : undefined,
        };
      }
      return {
        ...prev,
        activityType: type,
        accommodationPricePerPerson: STUDENT_PRICES[type],
      };
    });
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
                          {q.status === 'approved' && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="gap-1.5 text-xs"
                              onClick={(e) => {
                                e.stopPropagation();
                                const base = window.location.hostname.includes('lovableproject.com')
                                  ? 'https://glowhadorhaba.lovable.app'
                                  : window.location.origin;
                                navigator.clipboard.writeText(`${base}/guest-form?quote=${q.id}`);
                                toast({ title: 'הקישור הועתק! 📋', description: 'שלחו את הקישור ללקוח למילוי שאלון הכנה' });
                              }}
                            >
                              <ClipboardList className="w-3.5 h-3.5" />
                              שאלון לקוח
                            </Button>
                          )}
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

          {/* Availability Calendar */}
          <QuoteAvailabilityCalendar />
        </div>
      </AdminLayout>
    );
  }

  // ============ EDIT VIEW ============
  return (
    <AdminLayout title="הצעת מחיר" subtitle={editSnapshot.groupName || editTitle || 'חדשה'} section="management">
      {/* Top actions bar */}
      <div className="flex flex-wrap gap-3 items-center sticky top-0 z-10 bg-background py-3 -mx-4 px-4 border-b mb-6">
        <Button variant="ghost" onClick={() => { setIsEditing(false); setSelectedQuoteId(null); }} className="gap-2">
          <ArrowRight className="w-4 h-4" />
          חזרה לרשימה
        </Button>
        {selectedQuote && (
          <Badge className={STATUS_COLORS[selectedQuote.status]}>
            {QUOTE_STATUS_LABELS[selectedQuote.status]} • גרסה {selectedQuote.version}
          </Badge>
        )}
        <div className="flex-1" />
      </div>

      {/* 2-column layout: left basket + right form */}
      <div className="flex flex-col-reverse lg:flex-row gap-6">

        {/* ========== LEFT COLUMN: Basket + Summary + Total + Actions ========== */}
        <div className="w-full lg:w-[33%] space-y-5 lg:sticky lg:top-20 lg:self-start">

          {/* Selected content basket */}
          <Card className="rounded-2xl shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">תכנים שנבחרו</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Workshops in basket */}
              {editPricing.workshops.length > 0 && (
                <div>
                  <p className="text-sm font-semibold text-muted-foreground mb-2">סדנאות</p>
                  <div className="space-y-1.5">
                    {editPricing.workshops.map(w => (
                      <div key={w.id} className="flex items-center justify-between gap-2 rounded-lg border bg-muted/30 px-3 py-2">
                        <div className="flex-1 min-w-0">
                          <span className="text-sm font-medium truncate block">{w.name}</span>
                          <span className="text-xs text-muted-foreground">{fc(w.price)} × {w.quantity}</span>
                        </div>
                        <span className="text-sm font-semibold whitespace-nowrap">{fc(w.price * w.quantity)}</span>
                        <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => removeWorkshop(w.id)}>
                          <Trash2 className="w-3.5 h-3.5 text-destructive" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Lectures in basket */}
              {editPricing.lectures.length > 0 && (
                <div>
                  <p className="text-sm font-semibold text-muted-foreground mb-2">הרצאות</p>
                  <div className="space-y-1.5">
                    {editPricing.lectures.map(l => {
                      const lTotal = l.includesVat ? l.price + (l.price * l.vatRate) : l.price;
                      return (
                        <div key={l.id} className="flex items-center justify-between gap-2 rounded-lg border bg-muted/30 px-3 py-2">
                          <div className="flex-1 min-w-0">
                            <span className="text-sm font-medium truncate block">{l.name}</span>
                            <span className="text-xs text-muted-foreground">{l.lecturer} • {fc(lTotal)} × {l.quantity}</span>
                            {l.includesVat && <Badge variant="outline" className="text-[10px] mt-0.5">כולל מע״מ</Badge>}
                          </div>
                          <span className="text-sm font-semibold whitespace-nowrap">{fc(lTotal * l.quantity)}</span>
                          <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => removeLecture(l.id)}>
                            <Trash2 className="w-3.5 h-3.5 text-destructive" />
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {editPricing.workshops.length === 0 && editPricing.lectures.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">לא נבחרו תכנים עדיין</p>
              )}
            </CardContent>
          </Card>

          {/* Subtotals summary */}
          <Card className="rounded-2xl shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">סיכום ביניים</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span>אירוח/לינה</span><span>{fc(computedTotals.accommodationSubtotal)}</span></div>
                {computedTotals.workshopsSubtotal > 0 && <div className="flex justify-between"><span>סדנאות</span><span>{fc(computedTotals.workshopsSubtotal)}</span></div>}
                {computedTotals.lecturesSubtotal > 0 && <div className="flex justify-between"><span>הרצאות</span><span>{fc(computedTotals.lecturesSubtotal)}</span></div>}
                {computedTotals.lecturesVatAmount > 0 && <div className="flex justify-between text-muted-foreground"><span>מע״מ על הרצאות</span><span>{fc(computedTotals.lecturesVatAmount)}</span></div>}
                {computedTotals.coffeeCornerSubtotal > 0 && <div className="flex justify-between"><span>פינת קפה</span><span>{fc(computedTotals.coffeeCornerSubtotal)}</span></div>}
                {computedTotals.addonsSubtotal > 0 && <div className="flex justify-between"><span>תוספות</span><span>{fc(computedTotals.addonsSubtotal)}</span></div>}
                {computedTotals.customAdjustmentsSubtotal !== 0 && <div className="flex justify-between"><span>התאמות</span><span>{fc(computedTotals.customAdjustmentsSubtotal)}</span></div>}
                <Separator />
                <div className="flex justify-between font-medium"><span>סה"כ לפני הנחה</span><span>{fc(computedTotals.subtotalBeforeDiscount)}</span></div>
                {computedTotals.discountAmount > 0 && (
                  <div className="flex justify-between text-destructive"><span>הנחה ({editPricing.discountPercent}%)</span><span>-{fc(computedTotals.discountAmount)}</span></div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Grand total card */}
          <Card className="rounded-2xl shadow-md border-primary/40 bg-primary/5">
            <CardContent className="pt-6 pb-5">
              <div className="text-center space-y-2">
                <p className="text-sm font-semibold text-muted-foreground">סה״כ לתשלום</p>
                <p className="text-4xl font-extrabold text-primary">{fc(computedTotals.totalAfterDiscount)}</p>
                <div className="flex justify-center gap-6 text-sm text-muted-foreground pt-1">
                  <span>מקדמה 30% — {fc(computedTotals.advancePayment)}</span>
                  <span>יתרה 70% — {fc(computedTotals.balancePayment)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action buttons */}
          <div className="space-y-2">
            <Button onClick={handleSave} disabled={isSaving} className="w-full gap-2 h-12 text-base rounded-xl">
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {selectedQuoteId ? 'שמור שינויים' : 'צור טיוטה'}
            </Button>
            {selectedQuoteId && (
              <>
                <div className="grid grid-cols-2 gap-2">
                  <Button variant="outline" onClick={() => handleDownload('client')} className="gap-2 h-11 rounded-xl">
                    <Receipt className="w-4 h-4" />
                    הצעת מחיר ללקוח
                  </Button>
                  <Button variant="outline" onClick={() => handleDownload('operational')} className="gap-2 h-11 rounded-xl">
                    <ClipboardList className="w-4 h-4" />
                    דף תפעול לצוות
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Button variant="outline" onClick={handleNewVersion} disabled={isSaving} className="gap-1 rounded-xl text-sm">
                    <Copy className="w-3.5 h-3.5" />
                    גרסה חדשה
                  </Button>
                  <Button variant="outline" onClick={handleMarkSent} className="gap-1 rounded-xl text-sm">
                    <Send className="w-3.5 h-3.5" />
                    סמן כנשלח
                  </Button>
                </div>
                {selectedQuote?.status !== 'approved' && (
                  <Button
                    variant="outline"
                    className="w-full gap-2 rounded-xl text-sm border-green-300 text-green-700 hover:bg-green-50"
                    onClick={async () => {
                      if (!selectedQuoteId) return;
                      await updateQuote(selectedQuoteId, { status: 'approved' });
                      toast({ title: 'הצעת המחיר אושרה ✅' });
                    }}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    סמן כאושר (לקוח אישר)
                  </Button>
                )}
                {selectedQuote?.status === 'approved' && (
                  <Button
                    variant="outline"
                    className="w-full gap-2 rounded-xl text-sm border-blue-300 text-blue-700 hover:bg-blue-50"
                    onClick={() => {
                      const base = window.location.hostname.includes('lovableproject.com')
                        ? 'https://glowhadorhaba.lovable.app'
                        : window.location.origin;
                      navigator.clipboard.writeText(`${base}/guest-form?quote=${selectedQuoteId}`);
                      toast({ title: 'הקישור הועתק! 📋', description: 'שלחו את הקישור ללקוח למילוי שאלון הכנה' });
                    }}
                  >
                    <ClipboardList className="w-4 h-4" />
                    העתק קישור שאלון לקוח
                  </Button>
                )}
                <Button variant="destructive" onClick={() => setShowDeleteDialog(true)} className="w-full gap-1 rounded-xl text-sm">
                  <Trash2 className="w-3.5 h-3.5" />
                  מחק
                </Button>
              </>
            )}
          </div>

          {/* Availability Calendar in edit view */}
          <QuoteAvailabilityCalendar
            highlightStart={editSnapshot.startDate || undefined}
            highlightEnd={editSnapshot.endDate || undefined}
          />
        </div>

        {/* ========== RIGHT COLUMN: Form blocks ========== */}
        <div className="w-full lg:w-[67%] space-y-5">

          {/* A) סוג פעילות */}
          <Card className="rounded-2xl shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">סוג פעילות</CardTitle>
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

              {/* Accommodation pricing inline */}
              <div className="mt-4 pt-4 border-t border-border">
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
              </div>
            </CardContent>
          </Card>

          {/* B) פרטי לקוח */}
          <Card className="rounded-2xl shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">פרטי לקוח</CardTitle>
            </CardHeader>
            <CardContent>
              {!editGroupId && (
                <div className="mb-4">
                  <Label>כותרת ההצעה</Label>
                  <Input
                    value={editTitle}
                    onChange={e => setEditTitle(e.target.value)}
                    placeholder="שם / כותרת ההצעה"
                  />
                </div>
              )}
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
                  <Label>שם לחשבונית</Label>
                  <Input
                    value={editClientDetails.clientOrg || ''}
                    onChange={e => setEditClientDetails(prev => ({ ...prev, clientOrg: e.target.value }))}
                  />
                </div>
                <div>
                  <Label>ח.פ / ע.מ</Label>
                  <Input
                    value={editClientDetails.clientEmail || ''}
                    onChange={e => setEditClientDetails(prev => ({ ...prev, clientEmail: e.target.value }))}
                    placeholder="מספר עוסק"
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

              {/* Dates */}
              <div className="mt-4 pt-4 border-t border-border">
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

          {/* C) מספר משתתפים */}
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

          {/* D) תכנים */}
          <Card className="rounded-2xl shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">תכנים</CardTitle>
              <p className="text-sm text-muted-foreground">בחר סדנאות והרצאות מהקטלוג – הפריטים יופיעו בסל משמאל</p>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Workshops picker */}
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
                {/* Inline selected workshops with quantity */}
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

              {/* Lectures picker */}
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

          {/* E) תוספות והנחות */}
          <Card className="rounded-2xl shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">תוספות והנחות</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Coffee corner */}
              <div className="flex items-center gap-4 flex-wrap">
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
              </div>

              <Separator />

              {/* Discount */}
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
            </CardContent>
          </Card>
        </div>
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
