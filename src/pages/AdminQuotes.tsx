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
import { QuoteEditorTabs } from '@/components/QuoteEditorTabs';
import { toast } from '@/hooks/use-toast';
import { NumericInput } from '@/components/NumericInput';
import { QuoteAvailabilityCalendar } from '@/components/QuoteAvailabilityCalendar';
import { GuestFormResponseView } from '@/components/GuestFormResponseView';
import { useGuestFormSubmissions } from '@/hooks/useGuestFormSubmissions';

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
  const { submissions } = useGuestFormSubmissions();

  // State
  const [selectedQuoteId, setSelectedQuoteId] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [responseViewQuote, setResponseViewQuote] = useState<{ id: string; groupName: string } | null>(null);
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
    if (!selectedQuoteId) {
      toast({ title: 'יש לשמור את ההצעה לפני הורדה', variant: 'destructive' });
      return;
    }
    // Use selectedQuote if available, otherwise build from form state (covers race condition after save)
    const quoteData: QuoteRecord = selectedQuote || {
      id: selectedQuoteId,
      groupId: editGroupId,
      version: 1,
      status: 'draft' as QuoteStatus,
      currency: 'ILS',
      title: editTitle || null,
      snapshot: editSnapshot,
      clientDetails: editClientDetails,
      pricing: editPricing,
      totals: computedTotals,
      docClientHtml: null,
      docOperationalHtml: null,
      createdBy: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const quoteWithTotals = { ...quoteData, totals: computedTotals };
    const html = buildQuoteDocHTML(type, quoteWithTotals);
    const prefix = type === 'client' ? 'הצעת-מחיר' : 'דף-תפעול';
    const name = editSnapshot.groupName || editTitle || 'ללא-שם';
    downloadDocPDF(html, `${prefix}-${name}-v${quoteData.version}`);
  }, [selectedQuoteId, selectedQuote, computedTotals, editSnapshot, editClientDetails, editPricing, editGroupId, editTitle]);

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
                          {q.status === 'approved' && (() => {
                            const hasSubmission = submissions.some(
                              s => s.quote_id === q.id && (s.status === 'submitted' || s.status === 'reviewed')
                            );
                            return (
                              <>
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
                                {hasSubmission && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="gap-1.5 text-xs bg-emerald-50 border-emerald-300 text-emerald-700 hover:bg-emerald-100 hover:text-emerald-800"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setResponseViewQuote({ id: q.id, groupName: q.snapshot.groupName || q.title || '' });
                                    }}
                                  >
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                    תשובת הלקוח
                                  </Button>
                                )}
                              </>
                            );
                          })()}
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

          {/* Guest Form Response Dialog */}
          <Dialog open={!!responseViewQuote} onOpenChange={(open) => !open && setResponseViewQuote(null)}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0">
              {responseViewQuote && (
                <GuestFormResponseView
                  quoteId={responseViewQuote.id}
                  groupName={responseViewQuote.groupName}
                  onClose={() => setResponseViewQuote(null)}
                />
              )}
            </DialogContent>
          </Dialog>
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

      <div className="flex flex-col-reverse lg:flex-row gap-6">

        {/* ========== LEFT COLUMN: Summary + Actions ========== */}
        <div className="w-full lg:w-[30%] space-y-5 lg:sticky lg:top-20 lg:self-start">

          {/* Selected content basket */}
          <Card className="rounded-2xl shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">תכנים שנבחרו</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
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
                      </div>
                    ))}
                  </div>
                </div>
              )}
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
                          </div>
                          <span className="text-sm font-semibold whitespace-nowrap">{fc(lTotal * l.quantity)}</span>
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
                <Button variant="destructive" onClick={() => setShowDeleteDialog(true)} className="w-full gap-1 rounded-xl text-sm">
                  <Trash2 className="w-3.5 h-3.5" />
                  מחק
                </Button>
              </>
            )}
          </div>
        </div>

        {/* ========== RIGHT COLUMN: Tabbed form ========== */}
        <div className="w-full lg:w-[70%]">
          <QuoteEditorTabs
            editGroupId={editGroupId}
            editTitle={editTitle}
            editSnapshot={editSnapshot}
            editClientDetails={editClientDetails}
            editPricing={editPricing}
            computedTotals={computedTotals}
            selectedQuoteId={selectedQuoteId}
            selectedQuoteStatus={selectedQuote?.status}
            setEditTitle={setEditTitle}
            setEditSnapshot={setEditSnapshot}
            setEditClientDetails={setEditClientDetails}
            setEditPricing={setEditPricing}
            handleAudienceChange={handleAudienceChange}
            handleActivityTypeChange={handleActivityTypeChange}
            addWorkshopFromCatalog={addWorkshopFromCatalog}
            updateWorkshop={updateWorkshop}
            removeWorkshop={removeWorkshop}
            addLectureFromCatalog={addLectureFromCatalog}
            updateLecture={updateLecture}
            removeLecture={removeLecture}
            addAddon={addAddon}
            updateAddon={updateAddon}
            removeAddon={removeAddon}
            addAdjustment={addAdjustment}
            updateAdjustment={updateAdjustment}
            removeAdjustment={removeAdjustment}
            activeGroups={activeGroups}
          />
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
