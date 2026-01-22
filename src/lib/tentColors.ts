import { TentGender } from "@/types/village";

// Gender-based colors for tent fill - only when tent has reservation
export function genderColor(gender?: TentGender, hasReservation?: boolean): string {
  if (!hasReservation) return "hsl(40, 30%, 96%)";
  
  switch (gender) {
    case 'FEMALE': return "hsl(330, 70%, 75%)";
    case 'MALE': return "hsl(210, 70%, 65%)";
    case 'MIXED': return "hsl(270, 60%, 70%)";
    default: return "hsl(40, 30%, 96%)";
  }
}

export function genderStroke(gender?: TentGender, hasReservation?: boolean): string {
  if (!hasReservation) return "hsl(30, 10%, 50%)";
  
  switch (gender) {
    case 'FEMALE': return "hsl(330, 60%, 50%)";
    case 'MALE': return "hsl(210, 60%, 45%)";
    case 'MIXED': return "hsl(270, 50%, 50%)";
    default: return "hsl(30, 10%, 50%)";
  }
}

export const GENDER_LEGEND = [
  { color: "hsl(40, 30%, 96%)", label: "Sin Asignar" },
  { color: "hsl(330, 70%, 75%)", label: "♀ Femenino" },
  { color: "hsl(210, 70%, 65%)", label: "♂ Masculino" },
  { color: "hsl(270, 60%, 70%)", label: "👥 Mixto" },
];
