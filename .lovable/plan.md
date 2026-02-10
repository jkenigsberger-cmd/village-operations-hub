

# הוספת צבעי מגדר לאוהלי לינה בתכנון חלוקה

## מה ישתנה

בקטע "העדפת חלוקה לאוהלי לינה" — כשהפרדה לפי מגדר מופעלת, כל אוהל (Badge או כרטיס) יקבל צבע רקע לפי המגדר:

- **בנים** — רקע כחול בהיר (כמו MALE ב-VIP)
- **בנות** — רקע ורוד בהיר (כמו FEMALE ב-VIP)
- **מעורב** — רקע סגול בהיר (כמו MIXED ב-VIP)
- **ללא בחירה** — ללא שינוי (ברירת מחדל)

## פרטים טכניים

### קובץ: `src/components/SleepingTentDistributionSection.tsx`

הוספת פונקציית עזר שממפה את ערכי `TentGender` של ההעדפה (`BOYS`/`GIRLS`/`MIXED`) לצבעי רקע וגבול:

```typescript
function distributionGenderStyle(gender?: TentGender): { bg: string; border: string } {
  switch (gender) {
    case 'BOYS':  return { bg: 'hsl(210, 55%, 92%)', border: 'hsl(210, 60%, 70%)' };
    case 'GIRLS': return { bg: 'hsl(330, 55%, 92%)', border: 'hsl(330, 60%, 70%)' };
    case 'MIXED': return { bg: 'hsl(270, 40%, 92%)', border: 'hsl(270, 50%, 70%)' };
    default:      return { bg: '', border: '' };
  }
}
```

שלושה מקומות שישתנו:

1. **מצב אחיד (uniform)** — ה-Badge בשורה 360: הוספת inline style לרקע וגבול לפי `tent.gender`
2. **מצב טווחים (ranges)** — ה-Badge בשורה 448: אותו דבר
3. **מצב מותאם (custom)** — ה-div כרטיס בשורה 481: הוספת סגנון צבע מגדרי במקום/בנוסף ל-bg-muted

שינוי אחד בקובץ אחד בלבד. ללא שינוי בלוגיקה, שמירה, או הקצאות.
