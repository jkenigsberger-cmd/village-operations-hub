import { TentGender } from "@/types/village";

// Foundation palette colors
export const GENDER_COLORS = {
  female: '#1FAE62',    // ירוק
  male: '#0B2FD6',      // כחול
  mixed: '#FE4C10',     // כתום
  neutral: 'hsl(40, 30%, 96%)',
} as const;

// HSL versions for SVG fills
export const GENDER_HSL = {
  female: { fill: 'hsl(147, 69%, 40%)', stroke: 'hsl(147, 69%, 30%)' },
  male: { fill: 'hsl(228, 90%, 44%)', stroke: 'hsl(228, 90%, 34%)' },
  mixed: { fill: 'hsl(17, 99%, 53%)', stroke: 'hsl(17, 99%, 43%)' },
  neutral: { fill: 'hsl(40, 30%, 96%)', stroke: 'hsl(30, 10%, 50%)' },
} as const;

// === Option A — Solid Chips (DEFAULT) ===
export const GENDER_STYLE_A = {
  female: 'bg-gender-female text-white',
  male: 'bg-gender-male text-white',
  mixed: 'bg-gender-mixed text-white',
} as const;

// === Option B — Bordered Chips ===
export const GENDER_STYLE_B = {
  female: 'bg-gender-female/10 border border-gender-female text-gender-female',
  male: 'bg-gender-male/10 border border-gender-male text-gender-male',
  mixed: 'bg-gender-mixed/10 border border-gender-mixed text-gender-mixed',
} as const;

// === Option C — Compact Segmented (dot + text) ===
export const GENDER_STYLE_C = {
  female: { dotClass: 'bg-gender-female', textClass: 'text-gender-female' },
  male: { dotClass: 'bg-gender-male', textClass: 'text-gender-male' },
  mixed: { dotClass: 'bg-gender-mixed', textClass: 'text-gender-mixed' },
} as const;

// Gender-based colors for tent fill - only when tent has reservation
export function genderColor(gender?: TentGender, hasReservation?: boolean): string {
  if (!hasReservation) return GENDER_HSL.neutral.fill;
  
  switch (gender) {
    case 'FEMALE': return GENDER_HSL.female.fill;
    case 'MALE': return GENDER_HSL.male.fill;
    case 'MIXED': return GENDER_HSL.mixed.fill;
    default: return GENDER_HSL.neutral.fill;
  }
}

export function genderStroke(gender?: TentGender, hasReservation?: boolean): string {
  if (!hasReservation) return GENDER_HSL.neutral.stroke;
  
  switch (gender) {
    case 'FEMALE': return GENDER_HSL.female.stroke;
    case 'MALE': return GENDER_HSL.male.stroke;
    case 'MIXED': return GENDER_HSL.mixed.stroke;
    default: return GENDER_HSL.neutral.stroke;
  }
}

export const GENDER_LEGEND = [
  { color: GENDER_HSL.neutral.fill, label: "לא משובץ" },
  { color: GENDER_HSL.female.fill, label: "נשים" },
  { color: GENDER_HSL.male.fill, label: "גברים" },
  { color: GENDER_HSL.mixed.fill, label: "מעורב" },
];
