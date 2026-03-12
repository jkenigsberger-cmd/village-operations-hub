

# Gender Display Redesign — Labels + Colors

## Summary

Replace all pink/blue/purple gender styling with the foundation palette, and update Hebrew labels from בנים/בנות/נקבה/זכר to גברים/נשים throughout the app. No logic, data, or schema changes.

## Color Mapping (Foundation Palette)

| Gender | New Color | Hex | Use |
|--------|-----------|-----|-----|
| נשים (Female) | ירוק | #1FAE62 | Fill, badges, strokes |
| גברים (Male) | כחול | #0B2FD6 | Fill, badges, strokes |
| מעורב (Mixed) | כתום | #FE4C10 | Fill, badges, strokes |
| לא משובץ | — | existing neutral | No change |

Light tints for backgrounds: ~15% opacity versions of each.

## 3 Design Variants

All three will be implemented as a single centralized style system in `src/lib/tentColors.ts`. We will implement **Option A** as the default throughout the app, and include Options B and C as exported constants so they can be easily swapped.

**Option A — Solid Chips**: Solid background badge with white text. Bold and clear.
- נשים: `bg-[#1FAE62] text-white`
- גברים: `bg-[#0B2FD6] text-white`
- מעורב: `bg-[#FE4C10] text-white`

**Option B — Bordered Chips**: White/light background with colored border and colored text. Elegant.
- נשים: `bg-[#1FAE62]/10 border border-[#1FAE62] text-[#1FAE62]`
- גברים: `bg-[#0B2FD6]/10 border border-[#0B2FD6] text-[#0B2FD6]`
- מעורב: `bg-[#FE4C10]/10 border border-[#FE4C10] text-[#FE4C10]`

**Option C — Compact Segmented**: Minimal inline tags for dense screens.
- Small rounded pills, colored left dot + text, no border.

## Files to Modify (14 files, labels + colors only)

### 1. `src/lib/tentColors.ts` — Central color system
- Replace HSL pink/blue/purple with `#1FAE62` / `#0B2FD6` / `#FE4C10`
- Update `GENDER_LEGEND` labels: `♀ נקבה` → `נשים`, `♂ זכר` → `גברים`
- Export 3 variant style sets (A/B/C)

### 2. `src/index.css` — CSS custom properties
- Update `--gender-female`, `--gender-male`, `--gender-unisex` to new palette

### 3. `src/components/TentCard.tsx`
- `getGenderStyles`: Replace pink/blue/purple with foundation colors
- `getGenderBadge`: Labels `♀️` → `נשים`, `♂️` → `גברים`, colors updated

### 4. `src/components/VIPConfigCard.tsx`
- `genderLabel`: `♀️ נקבה` → `נשים`, `♂️ זכר` → `גברים`
- Replace pink/blue border/bg classes with foundation colors

### 5. `src/components/VIPTentPlanner.tsx`
- Select items: `♀️ נקבה` → `נשים`, `♂️ זכר` → `גברים`

### 6. `src/components/TentDetailModal.tsx`
- `genderOptions` labels: already says גברים/נשים, update colors
- VIP config label: `נקבה`/`זכר` → `נשים`/`גברים`

### 7. `src/components/NeighborhoodMap.tsx`
- Inline `genderColor`/`genderStroke`: update to foundation palette
- Legend: update labels and colors

### 8. `src/components/VIPNeighborhoodMap.tsx`
- Inline `genderColor`/`genderStroke`: update to foundation palette

### 9. `src/components/MiniMapCircular.tsx`
- Uses imported `genderColor`/`genderStroke` from tentColors — auto-fixed

### 10. `src/components/MiniMapVIP.tsx`
- Uses imported `genderColor`/`genderStroke` from tentColors — auto-fixed

### 11. `src/components/NeighborhoodBookingsList.tsx`
- Uses imported `genderColor` — auto-fixed
- Badge labels already say נשים/גברים — keep

### 12. `src/components/NeighborhoodReservationModal.tsx`
- Gender selector buttons: Replace pink-500/blue-500/purple-500 with foundation colors
- Gender summary spans: Replace pink-600/blue-600/purple-600
- Labels: keep נשים/גברים/מעורב (already correct)

### 13. `src/components/NeighborhoodBulkActions.tsx`
- Gender distribution spans: Replace pink-100/blue-100/purple-100 with foundation colors

### 14. `src/components/GroupStayDetailDrawer.tsx` + `SleepingDetailDrawer.tsx`
- Replace inline HSL blue/pink dots with foundation colors
- Labels: `בנים` → `גברים`, `בנות` → `נשים`

### 15. `src/components/DistributionPreferenceDisplay.tsx` + `DistributionRequirementsPanel.tsx`
- `GENDER_LABELS`: `BOYS: 'בנים'` → `BOYS: 'גברים'`, `GIRLS: 'בנות'` → `GIRLS: 'נשים'`

### 16. `src/components/SleepingTentDistributionSection.tsx`
- `GENDER_LABELS`: same update
- `distributionGenderStyle`: Replace HSL blue/pink with foundation palette

### 17. `src/components/NeighborhoodTile.tsx`
- Pax display: `ב:` / `בנ:` → `ג:` / `נ:` (abbreviated גברים/נשים)

### 18. `src/pages/AdminGroupEdit.tsx`
- Field labels: `בנים` → `גברים`, `בנות` → `נשים`
- Validation text: same update

### 19. `src/lib/tentColors.ts` (legend)
- Already covered above

## What does NOT change
- Database columns (`gender`, `boysCount`, `girlsCount`, `gender_distribution`)
- Stored enum values (`MALE`, `FEMALE`, `MIXED`, `BOYS`, `GIRLS`)
- Any allocation logic, filters, sync, or calculations
- Form field keys (`boysCount`, `girlsCount`)

