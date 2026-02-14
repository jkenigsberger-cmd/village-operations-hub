

# Translate Gender Legend from Spanish to Hebrew

## Problem
The neighborhood map legend displays Spanish text: "Sin Asignar", "Femenino", "Masculino", "Mixto" instead of Hebrew.

## Fix

### File: `src/lib/tentColors.ts` (lines 24-29)
Update the `GENDER_LEGEND` array labels to Hebrew:

| Current (Spanish) | New (Hebrew) |
|---|---|
| Sin Asignar | לא משובץ |
| Femenino | ♀ נקבה |
| Masculino | ♂ זכר |
| Mixto | מעורב |

Single file change, 4 strings replaced. No logic or layout changes needed.
