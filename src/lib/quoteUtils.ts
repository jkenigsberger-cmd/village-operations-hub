// ============================================================
// QUOTE UTILITIES - Snapshot building, pricing computation, HTML doc generation
// ============================================================

import { format, differenceInCalendarDays, parseISO } from 'date-fns';
import { he } from 'date-fns/locale';
import {
  QuoteSnapshot,
  QuotePricing,
  QuoteTotals,
  QuoteClientDetails,
  QuoteRecord,
  ADVANCE_PAYMENT_RATE,
  VAT_RATE,
  STUDENT_PRICES,
  ADULT_TENT_PRICES,
  QUOTE_STATUS_LABELS,
  AUDIENCE_LABELS,
  ACTIVITY_TYPE_LABELS,
} from '@/types/quote';
import { GroupRecord } from '@/types/adminGroups';
import { AllocationRecord } from '@/types/groupAllocation';
import { VIPTentConfig } from '@/types/adminGroups';

// ---- Build snapshot from existing data ----

export const buildQuoteSnapshotFromSupabase = (
  group: GroupRecord,
  allocations: AllocationRecord[],
  vipTentConfigs?: VIPTentConfig[],
): QuoteSnapshot => {
  const startDate = group.startDate;
  const endDate = group.endDate;
  const nights = Math.max(0, differenceInCalendarDays(parseISO(endDate), parseISO(startDate)));

  // Sum beds from allocations for this group
  const groupAllocations = allocations.filter(a => a.groupId === group.id);
  const participantBeds = groupAllocations
    .filter(a => a.allocationType === 'NEIGHBORHOOD' || a.allocationType === 'TENT')
    .reduce((sum, a) => sum + a.bedsAssigned, 0);
  const vipBeds = groupAllocations
    .filter(a => a.allocationType === 'VIP_TENT')
    .reduce((sum, a) => sum + a.bedsAssigned, 0);

  // Tent counts from VIP configs (for adults pricing)
  const configs = vipTentConfigs || group.vipTentConfigs || [];
  const tent3Count = configs.filter(c => c.bedsPlanned <= 3).length;
  const tent68Count = configs.filter(c => c.bedsPlanned > 3).length;

  return {
    groupId: group.id,
    groupName: group.groupName,
    startDate,
    endDate,
    groupType: group.groupType,
    studentsTotal: participantBeds || group.participantCount || 0,
    staffTotal: vipBeds || group.staffCount || 0,
    totalPax: group.pax,
    tent3Count,
    tent68Count,
    nights,
  };
};

// ---- Compute totals ----

export const computeQuoteTotals = (
  snapshot: QuoteSnapshot,
  pricing: QuotePricing,
): QuoteTotals => {
  let accommodationSubtotal = 0;

  if (pricing.audience === 'students') {
    const pricePerPerson = pricing.accommodationPricePerPerson || 0;
    if (pricing.activityType === 'day_activity') {
      accommodationSubtotal = pricePerPerson * snapshot.studentsTotal;
    } else {
      // Lodging: multiply by sleeping nights
      accommodationSubtotal = pricePerPerson * snapshot.studentsTotal * Math.max(1, snapshot.nights);
    }
  } else {
    // Adults: per tent per night
    const priceTent3 = pricing.accommodationPriceTent3 || ADULT_TENT_PRICES.tent3;
    const priceTent68 = pricing.accommodationPriceTent68 || ADULT_TENT_PRICES.tent68;
    const nights = Math.max(1, snapshot.nights);
    accommodationSubtotal =
      (snapshot.tent3Count * priceTent3 * nights) +
      (snapshot.tent68Count * priceTent68 * nights);
  }

  const workshopsSubtotal = pricing.workshops.reduce(
    (sum, w) => sum + w.price * w.quantity, 0
  );

  let lecturesSubtotal = 0;
  let lecturesVatAmount = 0;
  for (const lec of pricing.lectures) {
    const base = lec.price * lec.quantity;
    lecturesSubtotal += base;
    if (lec.includesVat) {
      lecturesVatAmount += base * lec.vatRate;
    }
  }

  const coffeeCornerSubtotal = pricing.coffeeCorner?.enabled
    ? (pricing.coffeeCorner.pricePerPerson * (snapshot.staffTotal || 0))
    : 0;

  const addonsSubtotal = pricing.addons.reduce(
    (sum, a) => sum + a.pricePerPerson * a.quantity, 0
  );

  const customAdjustmentsSubtotal = pricing.customAdjustments.reduce(
    (sum, adj) => sum + adj.amount, 0
  );

  const subtotalBeforeDiscount =
    accommodationSubtotal +
    workshopsSubtotal +
    lecturesSubtotal +
    lecturesVatAmount +
    coffeeCornerSubtotal +
    addonsSubtotal +
    customAdjustmentsSubtotal;

  const discountAmount = subtotalBeforeDiscount * (pricing.discountPercent / 100);
  const totalAfterDiscount = subtotalBeforeDiscount - discountAmount;
  const advancePayment = Math.round(totalAfterDiscount * ADVANCE_PAYMENT_RATE);
  const balancePayment = totalAfterDiscount - advancePayment;

  return {
    accommodationSubtotal,
    workshopsSubtotal,
    lecturesSubtotal,
    lecturesVatAmount,
    addonsSubtotal,
    coffeeCornerSubtotal,
    customAdjustmentsSubtotal,
    subtotalBeforeDiscount,
    discountAmount,
    totalAfterDiscount,
    advancePayment,
    balancePayment,
  };
};

// ---- Format helpers ----

const formatCurrency = (amount: number): string =>
  `₪${amount.toLocaleString('he-IL')}`;

const formatDate = (dateStr: string): string => {
  if (!dateStr) return '';
  try {
    return format(parseISO(dateStr), 'dd/MM/yyyy', { locale: he });
  } catch {
    return dateStr;
  }
};

// ---- HTML Document Generation ----

export const buildQuoteDocHTML = (
  type: 'client' | 'operational',
  quote: QuoteRecord,
): string => {
  if (type === 'client') return buildClientDocHTML(quote);
  return buildOperationalDocHTML(quote);
};

const getBaseUrl = (): string => {
  if (typeof window !== 'undefined') return window.location.origin;
  return '';
};

const commonStyles = `
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Arial', 'Helvetica', sans-serif; direction: rtl; text-align: right; color: #333; line-height: 1.6; padding: 40px; max-width: 800px; margin: 0 auto; }
    h1 { font-size: 24px; color: #0b2fd6; margin-bottom: 8px; }
    h2 { font-size: 18px; color: #0b2fd6; margin-top: 24px; margin-bottom: 12px; border-bottom: 2px solid #7a9be6; padding-bottom: 4px; }
    h3 { font-size: 15px; margin-top: 16px; margin-bottom: 8px; }
    .header { text-align: center; margin-bottom: 32px; padding: 24px 16px; background: none; color: #333; position: relative; }
    .header .subtitle { color: #666; font-size: 14px; }
    .header h1 { color: #0b2fd6; }
    .header-logo { height: 96px; width: auto; margin-bottom: 12px; }
    table { width: 100%; border-collapse: collapse; margin: 12px 0; }
    th, td { padding: 8px 12px; border: 1px solid #ddd; text-align: right; font-size: 13px; }
    th { background: #e8eefa; font-weight: bold; }
    .total-row { font-weight: bold; background: #f0f2fc; }
    .grand-total { font-size: 18px; color: #0b2fd6; font-weight: bold; }
    .payment-box { background: #e8eefa; padding: 16px; border-radius: 8px; margin-top: 16px; }
    .note { font-size: 12px; color: #888; margin-top: 24px; }
    .badge { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 12px; font-weight: bold; }
    .vat-note { color: #c0392b; font-size: 11px; }
    .postcard { margin-top: 18px; text-align: center; }
    .postcard-container { max-width: 100%; width: 100%; margin: 0 auto; }
    .postcard-label { font-size: 13px; color: #888; margin-bottom: 6px; }
    .postcard-img { width: 100%; height: 200px; object-fit: contain; background: transparent; padding: 0; border-radius: 0; border: none; box-shadow: none; }
    .pricing-section { page-break-inside: avoid; }
    .intro-section { margin-bottom: 28px; }
    .intro-section .intro-subtitle { font-size: 16px; color: #0b2fd6; font-weight: bold; margin-bottom: 10px; text-align: center; }
    .intro-section .intro-paragraph { font-size: 13px; margin-bottom: 14px; line-height: 1.8; }
    .intro-section h3 { font-size: 14px; color: #0b2fd6; margin-bottom: 8px; margin-top: 14px; }
    .intro-section ul { list-style: none; padding: 0; margin: 0 0 10px 0; }
    .intro-section ul li { font-size: 13px; line-height: 1.8; padding-right: 12px; position: relative; }
    .intro-section ul li::before { content: "–"; position: absolute; right: 0; color: #0b2fd6; }
    .intro-section .track-item { font-size: 13px; line-height: 1.8; margin-bottom: 2px; }
    .intro-section .track-name { font-weight: bold; color: #0b2fd6; }
    .intro-section .transition-line { font-size: 14px; font-weight: bold; color: #0b2fd6; margin-top: 16px; }
    .terms { margin-top: 32px; page-break-before: always; }
    .terms h2 { font-size: 18px; color: #0b2fd6; margin-top: 24px; margin-bottom: 12px; border-bottom: 2px solid #7a9be6; padding-bottom: 4px; }
    .terms h3 { font-size: 14px; margin-top: 14px; margin-bottom: 6px; font-weight: bold; }
    .terms p, .terms li { font-size: 13px; line-height: 1.8; }
    .terms ul { list-style: disc; padding-right: 20px; margin: 4px 0; }
    .signature-block { margin-top: 32px; }
    .signature-line { display: inline-block; min-width: 180px; border-bottom: 1px solid #333; margin: 0 8px; }
    .signature-row { margin-top: 20px; font-size: 13px; line-height: 2.4; }
    .org-details { background: #f8f9fc; border: 1px solid #d0d5e4; padding: 14px 18px; border-radius: 8px; margin-top: 18px; font-size: 13px; line-height: 1.8; }
    @media print {
      body { padding: 20px; margin: 0; }
      @page { size: A4; margin: 15mm; }
      .pricing-section { page-break-inside: avoid; }
      .payment-box { page-break-inside: avoid; }
      table { page-break-inside: avoid; }
    }
  </style>
`;

const buildClientDocHTML = (quote: QuoteRecord): string => {
  const { snapshot: s, clientDetails: c, pricing: p, totals: t } = quote;
  const audienceLabel = AUDIENCE_LABELS[p.audience];
  const activityLabel = p.activityType ? ACTIVITY_TYPE_LABELS[p.activityType] : '';

  let accommodationRows = '';
  if (p.audience === 'students') {
    accommodationRows = `
      <tr>
        <td>${activityLabel} - אירוח</td>
        <td>${s.studentsTotal}</td>
        <td>${formatCurrency(p.accommodationPricePerPerson || 0)}</td>
        <td>${formatCurrency(t.accommodationSubtotal)}</td>
      </tr>`;
  } else {
    if (s.tent3Count > 0) {
      accommodationRows += `
        <tr>
          <td>אוהל 3 מיטות × ${s.nights} לילות</td>
          <td>${s.tent3Count}</td>
          <td>${formatCurrency(p.accommodationPriceTent3 || ADULT_TENT_PRICES.tent3)}</td>
          <td>${formatCurrency(s.tent3Count * (p.accommodationPriceTent3 || ADULT_TENT_PRICES.tent3) * Math.max(1, s.nights))}</td>
        </tr>`;
    }
    if (s.tent68Count > 0) {
      accommodationRows += `
        <tr>
          <td>אוהל 6/8 מיטות × ${s.nights} לילות</td>
          <td>${s.tent68Count}</td>
          <td>${formatCurrency(p.accommodationPriceTent68 || ADULT_TENT_PRICES.tent68)}</td>
          <td>${formatCurrency(s.tent68Count * (p.accommodationPriceTent68 || ADULT_TENT_PRICES.tent68) * Math.max(1, s.nights))}</td>
        </tr>`;
    }
  }

  const workshopRows = p.workshops.map(w => `
    <tr>
      <td>סדנה: ${w.name}</td>
      <td>${w.quantity}</td>
      <td>${formatCurrency(w.price)}</td>
      <td>${formatCurrency(w.price * w.quantity)}</td>
    </tr>`).join('');

  const lectureRows = p.lectures.map(l => `
    <tr>
      <td>הרצאה: ${l.name} ${l.includesVat ? '<span class="vat-note">(+ מע"מ)</span>' : ''}</td>
      <td>${l.quantity}</td>
      <td>${formatCurrency(l.price)}</td>
      <td>${formatCurrency(l.price * l.quantity)}${l.includesVat ? ` <span class="vat-note">+ ${formatCurrency(l.price * l.quantity * l.vatRate)} מע"מ</span>` : ''}</td>
    </tr>`).join('');

  const coffeeRow = p.coffeeCorner?.enabled ? `
    <tr>
      <td>פינת קפה ועוגיות</td>
      <td>${s.totalPax}</td>
      <td>${formatCurrency(p.coffeeCorner.pricePerPerson)}</td>
      <td>${formatCurrency(t.coffeeCornerSubtotal)}</td>
    </tr>` : '';

  const addonRows = p.addons.map(a => `
    <tr>
      <td>${a.name}${a.description ? ` (${a.description})` : ''}</td>
      <td>${a.quantity}</td>
      <td>${formatCurrency(a.pricePerPerson)}</td>
      <td>${formatCurrency(a.pricePerPerson * a.quantity)}</td>
    </tr>`).join('');

  const adjustmentRows = p.customAdjustments.map(adj => `
    <tr>
      <td>${adj.description}</td>
      <td>-</td>
      <td>-</td>
      <td>${adj.amount >= 0 ? '+' : ''}${formatCurrency(adj.amount)}</td>
    </tr>`).join('');

  return `<!DOCTYPE html>
<html lang="he" dir="rtl">
<head><meta charset="UTF-8"><title>הצעת מחיר - ${s.groupName || quote.title || ''}</title>${commonStyles}</head>
<body>
  <div class="header">
    <img src="${getBaseUrl()}/assets/quote-logo.png" alt="בית הדור הבא" class="header-logo" onerror="this.style.display='none'">
    <h1>בית הדור הבא – חוות אהרונסון</h1>
    
  </div>

  <div class="intro-section">
    <div class="intro-subtitle">הצעת מחיר לסמינרים וימי עיון לצוותי חינוך</div>
    <p class="intro-paragraph">בית הדור הבא מציע מרחב לחיבור, העמקה ודיאלוג. בהמשך לשיחתנו, להלן הצעתנו עבור פעילות לצוותי חינוך:</p>
    <h3>עקרונות החוויה בבית הדור הבא:</h3>
    <ul>
      <li>חיבור בין עשייה להעמקה — שילוב בין פעילות מעשית לשיח משמעותי</li>
      <li>מרחב לקול האישי — יצירת הזדמנויות לביטוי אישי ולהקשבה</li>
      <li>רב-מימדיות — שילוב מגוון החושים ליצירת חוויה עמוקה ועוצמתית</li>
      <li>חיבור לערכי הליבה — אהבת המדינה ואנשיה, זיקה ליהדות וערכים ליברליים</li>
    </ul>
    <h3>יש לנו שלושה מסלולי תוכן אפשריים:</h3>
    <div class="track-item"><span class="track-name">שיבולת</span> — תוכן מלא של הגוף המתארח, השתלבות בסדר היום של בית הדור הבא</div>
    <div class="track-item"><span class="track-name">אלומה</span> — תוכן של הגוף המתארח, עם סדנה מלאה אחת של בית הדור הבא ביום, והשתלבות בסדר היום של בית הדור הבא</div>
    <div class="track-item"><span class="track-name">שדה</span> — תוכן מלא ומותאם אישית של בית הדור הבא</div>
    <div class="transition-line">עלויות פעילות:</div>
  </div>

  <h2>פרטי לקוח</h2>
  <table>
    <tr><td><strong>שם לקוח:</strong></td><td>${c.clientName}</td></tr>
    ${c.clientOrg ? `<tr><td><strong>ארגון:</strong></td><td>${c.clientOrg}</td></tr>` : ''}
    ${c.clientPhone ? `<tr><td><strong>טלפון:</strong></td><td>${c.clientPhone}</td></tr>` : ''}
    ${c.clientEmail ? `<tr><td><strong>דוא"ל:</strong></td><td>${c.clientEmail}</td></tr>` : ''}
    ${c.contactPerson ? `<tr><td><strong>איש קשר:</strong></td><td>${c.contactPerson}</td></tr>` : ''}
  </table>

  <h2>פרטי פעילות</h2>
  <table>
    <tr><td><strong>שם קבוצה:</strong></td><td>${s.groupName || quote.title || ''}</td></tr>
    <tr><td><strong>קהל יעד:</strong></td><td>${audienceLabel}</td></tr>
    ${activityLabel ? `<tr><td><strong>סוג פעילות:</strong></td><td>${activityLabel}</td></tr>` : ''}
    <tr><td><strong>תאריכים:</strong></td><td>${formatDate(s.startDate)} - ${formatDate(s.endDate)}</td></tr>
    ${s.nights > 0 ? `<tr><td><strong>מס׳ לילות:</strong></td><td>${s.nights}</td></tr>` : ''}
    <tr><td><strong>סה"כ משתתפים:</strong></td><td>${s.totalPax}</td></tr>
  </table>

  <div class="pricing-section">
  <h2>פירוט תמחור</h2>
  <table>
    <tr><th>פריט</th><th>כמות</th><th>מחיר יחידה</th><th>סה"כ</th></tr>
    ${accommodationRows}
    ${workshopRows}
    ${lectureRows}
    ${coffeeRow}
    ${addonRows}
    ${adjustmentRows}
    <tr class="total-row"><td colspan="3">סה"כ לפני הנחה</td><td>${formatCurrency(t.subtotalBeforeDiscount)}</td></tr>
    ${p.discountPercent > 0 ? `<tr><td colspan="3">הנחה ${p.discountPercent}%${p.discountReason ? ` (${p.discountReason})` : ''}</td><td>-${formatCurrency(t.discountAmount)}</td></tr>` : ''}
    <tr class="total-row"><td colspan="3" class="grand-total">סה"כ לתשלום</td><td class="grand-total">${formatCurrency(t.totalAfterDiscount)}</td></tr>
  </table>

  <div class="payment-box">
    <h3>תנאי תשלום</h3>
    <p>מקדמה (30%): <strong>${formatCurrency(t.advancePayment)}</strong></p>
    <p>יתרה (70%): <strong>${formatCurrency(t.balancePayment)}</strong></p>
  </div>

  <p class="note">גרסה: ${quote.version} | סטטוס: ${QUOTE_STATUS_LABELS[quote.status]}</p>
  </div>

  <div class="org-details">
    <p><strong>ח.פ:</strong> קרן שמש הדור הבא (ע"ר) — 580786812</p>
    <p><strong>פרטי חשבון הבנק:</strong> קרן שמש הדור הבא (ע"ר) בנק הפועלים- 12 סניף- 170 חשבון- 368365</p>
  </div>

  <div class="terms">
    <h2>תנאי ההסכם</h2>
    <p>הצעת המחיר תקפה למשך 14 יום מיום שליחתה בכתב.</p>
    <p>רק שליחה חזרה של מסמך זה חתום משמעה סגירת ההזמנה.</p>

    <h3>תשלום</h3>
    <p>תשלום מקדמה - בסך 30% מערך העסקה - ישולם חודש לפני הגעה | שאר התשלום - 70% מערך העסקה - ישולם ביום ההגעה.</p>

    <h3>ביטול עסקה</h3>
    <ul>
      <li>עד 7 ימים לפני ההגעה - ייגבו דמי ביטול בסך 5% או 100 ש״ח - הנמוך מביניהם</li>
      <li>פחות מ-7 ימים לפני ההגעה - ייגבו דמי ביטול בסך של 25% מערך ההזמנה</li>
    </ul>

    <h3>שינויים</h3>
    <ul>
      <li>ניתן לעשות שינויים בהזמנה לרבות מספר משתתפים וארוחות עד 10 ימים לפני הפעילות בבית</li>
      <li>דרישת התשלום תישלח לפי מספר המשתתפים שנמסר 10 ימים לפני תחילת הפעילות או לפי מספר המגיעים בפועל - לפי הגבוה מביניהם</li>
      <li>ניתן לעדכן בהעדפות ואלרגיות למזון עד 10 ימים לפני, לאחר מכן לא ניתן להבטיח שיהיה אוכל מתאים</li>
    </ul>

    <h3>כללי הבית</h3>
    <ul>
      <li>לא ניתן להכניס אוכל מכל סוג לבית הדור הבא</li>
      <li>כל נזק לציוד או מתקני הבית יחויב בעלות תיקון הנזק</li>
    </ul>

    <div class="signature-block">
      <h3>אישור ההצעה וחתימה</h3>
      <div class="signature-row">
        שם מלא: <span class="signature-line"></span>
        תפקיד: <span class="signature-line"></span>
        חתימה: <span class="signature-line"></span>
      </div>
      <div class="signature-row">
        שם הגוף המשלם: <span class="signature-line"></span>
        ח.פ / ע.ר: <span class="signature-line"></span>
      </div>
    </div>
  </div>

  <div class="postcard">
    <div class="postcard-container">
      <div class="postcard-label">מחכים לכם בבית הדור הבא</div>
      <img src="${getBaseUrl()}/assets/quote-footer-photo.jpg" alt="חוות אהרונסון" class="postcard-img" onerror="this.parentElement.parentElement.style.display='none'">
    </div>
  </div>
</body></html>`;
};

const buildOperationalDocHTML = (quote: QuoteRecord): string => {
  const { snapshot: s, pricing: p, totals: t } = quote;
  const audienceLabel = AUDIENCE_LABELS[p.audience];

  return `<!DOCTYPE html>
<html lang="he" dir="rtl">
<head><meta charset="UTF-8"><title>דף תפעול - ${s.groupName || quote.title || ''}</title>${commonStyles}</head>
<body>
  <div class="header">
    <img src="${getBaseUrl()}/assets/quote-logo.png" alt="בית הדור הבא" class="header-logo" onerror="this.style.display='none'">
    <h1>דף תפעול לצוות</h1>
    <div class="subtitle">בית הדור הבא – חוות אהרונסון</div>
  </div>

  <h2>פרטי קבוצה</h2>
  <table>
    <tr><td><strong>שם:</strong></td><td>${s.groupName || quote.title || ''}</td></tr>
    <tr><td><strong>קהל:</strong></td><td>${audienceLabel}</td></tr>
    <tr><td><strong>תאריכים:</strong></td><td>${formatDate(s.startDate)} - ${formatDate(s.endDate)} (${s.nights} לילות)</td></tr>
    <tr><td><strong>סה"כ משתתפים:</strong></td><td>${s.totalPax}</td></tr>
    <tr><td><strong>חניכים:</strong></td><td>${s.studentsTotal}</td></tr>
    <tr><td><strong>צוות:</strong></td><td>${s.staffTotal}</td></tr>
  </table>

  ${p.audience === 'adults' ? `
  <h2>אוהלים</h2>
  <table>
    <tr><th>סוג</th><th>כמות</th></tr>
    <tr><td>אוהלי 3 מיטות</td><td>${s.tent3Count}</td></tr>
    <tr><td>אוהלי 6/8 מיטות</td><td>${s.tent68Count}</td></tr>
  </table>` : ''}

  <h2>תכנים</h2>
  <table>
    <tr><th>פריט</th><th>כמות</th><th>הערות</th></tr>
    ${p.workshops.map(w => `<tr><td>סדנה: ${w.name}</td><td>${w.quantity}</td><td>-</td></tr>`).join('')}
    ${p.lectures.map(l => `<tr><td>הרצאה: ${l.name}</td><td>${l.quantity}</td><td>${l.includesVat ? 'כולל מע"מ' : '-'}</td></tr>`).join('')}
    ${!p.workshops.length && !p.lectures.length ? '<tr><td colspan="3">לא הוגדרו תכנים</td></tr>' : ''}
  </table>

  ${p.coffeeCorner?.enabled ? '<h3>✓ פינת קפה</h3>' : ''}

  ${p.addons.length > 0 ? `
  <h2>תוספות</h2>
  <table>
    <tr><th>תוספת</th><th>כמות</th><th>הערות</th></tr>
    ${p.addons.map(a => `<tr><td>${a.name}</td><td>${a.quantity}</td><td>${a.description || '-'}</td></tr>`).join('')}
  </table>` : ''}

  <h2>סיכום פיננסי</h2>
  <table>
    <tr><td>סה"כ</td><td>${formatCurrency(t.totalAfterDiscount)}</td></tr>
    <tr><td>מקדמה (30%)</td><td>${formatCurrency(t.advancePayment)}</td></tr>
    <tr><td>יתרה (70%)</td><td>${formatCurrency(t.balancePayment)}</td></tr>
  </table>

  <p class="note">גרסה: ${quote.version} | הופק: ${formatDate(quote.createdAt)}</p>
</body></html>`;
};

// ---- Download helper ----

export const downloadDocPDF = (html: string, _filename: string): void => {
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;
  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.onload = () => {
    printWindow.print();
  };
};
