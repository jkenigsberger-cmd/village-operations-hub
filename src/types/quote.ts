// ============================================================
// QUOTE TYPES - Financial Quote/Proposal Management
// ============================================================

/** Target audience determines pricing model */
export type QuoteAudience = 'students' | 'adults';

/** Activity type for students pricing */
export type StudentActivityType = 'day_activity' | 'midweek_lodging' | 'weekend_lodging';

/** Quote lifecycle status */
export type QuoteStatus = 'draft' | 'sent' | 'approved' | 'rejected' | 'expired';

/** Workshop audience for pricing */
export type WorkshopAudience = 'students' | 'adults';

// ---- Snapshot: captures group state at quote creation ----

export interface QuoteSnapshot {
  // Group info (optional if standalone)
  groupId?: string;
  groupName: string;
  startDate: string; // YYYY-MM-DD (from groups.arrival_date)
  endDate: string;   // YYYY-MM-DD (from groups.departure_date)
  groupType?: string;

  // Participant counts (from allocations or manual override)
  studentsTotal: number;
  staffTotal: number;
  totalPax: number;

  // For adults lodging: tent breakdown
  tent3Count: number;  // Number of 3-bed tents
  tent68Count: number; // Number of 6/8-bed tents

  // Nights calculation
  nights: number;

  // Override flags
  studentsOverride?: boolean;
  staffOverride?: boolean;
  tentCountsOverride?: boolean;
}

// ---- Client details ----

export interface QuoteClientDetails {
  clientName: string;
  clientOrg?: string;
  clientPhone?: string;
  clientEmail?: string;
  contactPerson?: string;
}

// ---- Pricing configuration ----

// ---- Catalog definitions ----

export interface WorkshopCatalogItem {
  catalogId: string;
  name: string;
  studentsPrice: number;
  adultsPrice: number | null; // null = not available for adults
}

export interface LectureCatalogItem {
  catalogId: string;
  name: string;
  lecturer: string;
  price: number;
  includesVat: boolean;
  vatRate: number;
  totalWithVat: number; // price + vat if applicable
}

export const WORKSHOP_CATALOG: WorkshopCatalogItem[] = [
  { catalogId: 'ws_pnim_chutz', name: 'ענייני פנים ענייני חוץ', studentsPrice: 750, adultsPrice: 1500 },
  { catalogId: 'ws_tikvah', name: 'יוצרים תקווה', studentsPrice: 750, adultsPrice: 1500 },
  { catalogId: 'ws_rotzeh', name: 'מי שרוצה מצליח', studentsPrice: 750, adultsPrice: null },
  { catalogId: 'ws_shiraretz', name: 'שירארץ', studentsPrice: 750, adultsPrice: 1500 },
  { catalogId: 'ws_stickers', name: 'סדנת סטיקרים', studentsPrice: 750, adultsPrice: 1500 },
  { catalogId: 'ws_kol_sheli', name: 'הקול שלי במרחב', studentsPrice: 750, adultsPrice: null },
  { catalogId: 'ws_narrativim', name: 'סדנת נרטיבים', studentsPrice: 750, adultsPrice: null },
  { catalogId: 'ws_ometz', name: 'סדנת אומץ', studentsPrice: 750, adultsPrice: 1500 },
  { catalogId: 'ws_pedagogia', name: 'פדגוגיה של חוויה (עדי פאר)', studentsPrice: 750, adultsPrice: 1500 },
];

export const LECTURE_CATALOG: LectureCatalogItem[] = [
  { catalogId: 'lec_pedagogia_tikvah', name: 'פדגוגיה של תקווה', lecturer: 'שירלי רימון ברכה', price: 2500, includesVat: false, vatRate: 0, totalWithVat: 2500 },
  { catalogId: 'lec_chinuch_narrativi', name: 'חינוך כמעשה נרטיבי', lecturer: 'שירלי רימון ברכה', price: 2500, includesVat: false, vatRate: 0, totalWithVat: 2500 },
  { catalogId: 'lec_yehudit_demo', name: 'יהודית ודמוקרטית', lecturer: 'שירלי רימון ברכה', price: 2500, includesVat: false, vatRate: 0, totalWithVat: 2500 },
  { catalogId: 'lec_ecosystem', name: 'בניית אקוסיסטם חינוכי', lecturer: 'רותי אנזל', price: 1500, includesVat: false, vatRate: 0, totalWithVat: 1500 },
  { catalogId: 'lec_latzet_midaatenu', name: 'לצאת מדעתנו', lecturer: 'מירב לשם גונן', price: 5000, includesVat: true, vatRate: 0.18, totalWithVat: 5900 },
];

// ---- Pricing line items ----

export interface QuoteWorkshop {
  id: string;
  catalogId: string;
  name: string;
  price: number;
  audience: WorkshopAudience;
  quantity: number;
}

export interface QuoteLecture {
  id: string;
  catalogId: string;
  name: string;
  lecturer: string;
  price: number;
  includesVat: boolean;
  vatRate: number;
  quantity: number;
}

export interface QuoteAddon {
  id: string;
  name: string;
  pricePerPerson: number;
  quantity: number; // number of people
  description?: string;
}

export interface QuoteCustomAdjustment {
  id: string;
  description: string;
  amount: number; // positive = surcharge, negative = discount
}

export interface QuotePricing {
  audience: QuoteAudience;
  activityType?: StudentActivityType; // only for students

  // Base accommodation pricing
  accommodationPricePerPerson?: number; // for students
  accommodationPriceTent3?: number;     // for adults (per tent per night)
  accommodationPriceTent68?: number;    // for adults (per tent per night)

  // Content items
  workshops: QuoteWorkshop[];
  lectures: QuoteLecture[];

  // Addons
  coffeeCorner?: {
    enabled: boolean;
    pricePerPerson: number;
  };
  addons: QuoteAddon[];

  // Custom adjustments
  customAdjustments: QuoteCustomAdjustment[];

  // Discount
  discountPercent: number;
  discountReason?: string;
}

// ---- Computed totals ----

export interface QuoteTotals {
  accommodationSubtotal: number;
  workshopsSubtotal: number;
  lecturesSubtotal: number;
  lecturesVatAmount: number;
  addonsSubtotal: number;
  coffeeCornerSubtotal: number;
  customAdjustmentsSubtotal: number;
  subtotalBeforeDiscount: number;
  discountAmount: number;
  totalAfterDiscount: number;
  advancePayment: number;  // 30%
  balancePayment: number;  // 70%
}

// ---- Full quote record (DB row) ----

export interface QuoteRecord {
  id: string;
  groupId: string | null;
  version: number;
  status: QuoteStatus;
  currency: string;
  title: string | null;
  snapshot: QuoteSnapshot;
  clientDetails: QuoteClientDetails;
  pricing: QuotePricing;
  totals: QuoteTotals;
  docClientHtml: string | null;
  docOperationalHtml: string | null;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
}

// ---- Defaults / constants ----

export const STUDENT_PRICES: Record<StudentActivityType, number> = {
  day_activity: 125,
  midweek_lodging: 190,
  weekend_lodging: 250,
};

export const ADULT_TENT_PRICES = {
  tent3: 340,
  tent68: 250,
};

export const WORKSHOP_PRICES: Record<WorkshopAudience, number> = {
  students: 750,
  adults: 1500,
};

export const COFFEE_CORNER_PRICE_PER_PERSON = 15;
export const ADVANCE_PAYMENT_RATE = 0.30;
export const VAT_RATE = 0.18;

export const QUOTE_STATUS_LABELS: Record<QuoteStatus, string> = {
  draft: 'טיוטה',
  sent: 'נשלח',
  approved: 'אושר',
  rejected: 'נדחה',
  expired: 'פג תוקף',
};

export const AUDIENCE_LABELS: Record<QuoteAudience, string> = {
  students: 'תלמידים',
  adults: 'מבוגרים',
};

export const ACTIVITY_TYPE_LABELS: Record<StudentActivityType, string> = {
  day_activity: 'יום פעילות',
  midweek_lodging: 'לינה אמצע שבוע',
  weekend_lodging: 'לינה סוף שבוע',
};

export const createEmptySnapshot = (): QuoteSnapshot => ({
  groupName: '',
  startDate: '',
  endDate: '',
  studentsTotal: 0,
  staffTotal: 0,
  totalPax: 0,
  tent3Count: 0,
  tent68Count: 0,
  nights: 0,
});

export const createEmptyClientDetails = (): QuoteClientDetails => ({
  clientName: '',
});

export const createEmptyPricing = (): QuotePricing => ({
  audience: 'students',
  activityType: 'midweek_lodging',
  accommodationPricePerPerson: STUDENT_PRICES.midweek_lodging,
  workshops: [],
  lectures: [],
  addons: [],
  customAdjustments: [],
  discountPercent: 0,
});

export const createEmptyTotals = (): QuoteTotals => ({
  accommodationSubtotal: 0,
  workshopsSubtotal: 0,
  lecturesSubtotal: 0,
  lecturesVatAmount: 0,
  addonsSubtotal: 0,
  coffeeCornerSubtotal: 0,
  customAdjustmentsSubtotal: 0,
  subtotalBeforeDiscount: 0,
  discountAmount: 0,
  totalAfterDiscount: 0,
  advancePayment: 0,
  balancePayment: 0,
});
