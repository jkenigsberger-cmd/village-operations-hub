

# תיקון הצגת הזמנות ובדיקת התנגשויות בלוח השעות

## הבעיות שזוהו

### 1. הצגת צבע בלוח השעות לא לוגית לשעות
הפונקציה `getReservationSpan` מחשבת את מספר השעות רק לפי השעה השלמה:
```typescript
const getReservationSpan = (reservation: ActivityReservation): number => {
  const startHour = parseInt(reservation.startTime.split(':')[0]);
  const endHour = parseInt(reservation.endTime.split(':')[0]);
  return endHour - startHour;
};
```
**בעיה**: אם הזמנה מ-09:30 עד 10:30, זה מחשב `10 - 9 = 1` שורה, אבל מציג רק בשורת 09:00.

### 2. אין מניעת התנגשויות עם מרווח 15 דקות
הבדיקה הנוכחית ב-`VillageContext.addActivityReservation` בודקת חפיפה ישירה, אך לא מוודאת מרווח של 15 דקות בין הזמנות.

### 3. הבדיקה צריכה לחול על כל מקורות ההזמנות
- הזמנה ישירה מדף Activities ✓ (יש בדיקה)
- סנכרון קבוצות לינה (`groupSync`) - מזהה התנגשות אבל לא מונע אותה
- קבוצות יום - משתמשות ב-`groupSync`

---

## הפתרון המוצע

### שינוי 1: תיקון חישוב ה-Span לתמיכה בדקות

הפונקציה צריכה לחשב לפי דקות ולעגל למעלה:

```typescript
const getReservationSpan = (reservation: ActivityReservation): number => {
  const [startH, startM] = reservation.startTime.split(':').map(Number);
  const [endH, endM] = reservation.endTime.split(':').map(Number);
  const startMinutes = startH * 60 + startM;
  const endMinutes = endH * 60 + endM;
  // חישוב כמה שורות (שעות) הבלוק צריך לתפוס
  return Math.ceil((endMinutes - startMinutes) / 60);
};
```

### שינוי 2: תיקון `getReservationForHour` לתמיכה בדקות

הפונקציה צריכה להשוות לפי דקות ולא לפי מחרוזות:

```typescript
const getReservationForHour = (hour: string): ActivityReservation | null => {
  const hourMinutes = parseInt(hour.split(':')[0]) * 60;
  return spaceReservations.find(r => {
    const [startH, startM] = r.startTime.split(':').map(Number);
    const [endH, endM] = r.endTime.split(':').map(Number);
    const startMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;
    return hourMinutes >= startMinutes && hourMinutes < endMinutes;
  }) || null;
};
```

### שינוי 3: הוספת בדיקת מרווח 15 דקות

פונקציית עזר חדשה לבדיקת חפיפה עם מרווח:

```typescript
const timeRangesOverlapWithGap = (
  start1: string, end1: string,
  start2: string, end2: string,
  gapMinutes: number = 15
): boolean => {
  const toMinutes = (t: string) => {
    const [h, m] = t.split(':').map(Number);
    return h * 60 + m;
  };
  
  const s1 = toMinutes(start1);
  const e1 = toMinutes(end1);
  const s2 = toMinutes(start2);
  const e2 = toMinutes(end2);
  
  // חפיפה קיימת אם אין מרווח של gapMinutes בין ההזמנות
  return s1 < (e2 + gapMinutes) && s2 < (e1 + gapMinutes);
};
```

### שינוי 4: עדכון הבדיקה ב-VillageContext

```typescript
const addActivityReservation = useCallback((reservation) => {
  // ... existing code ...
  
  for (const existing of existingReservations) {
    if (timeRangesOverlapWithGap(
      newStart, newEnd,
      existing.startTime, existing.endTime,
      15 // מרווח 15 דקות
    )) {
      return false; // התנגשות!
    }
  }
  
  // ... rest of code ...
}, []);
```

### שינוי 5: עדכון הבדיקה ב-groupSync

```typescript
// בפונקציה syncGroupToModules
if (timeRangesOverlapWithGap(
  item.startTime, itemEnd,
  res.start_time, res.end_time,
  15
)) {
  hasConflict = true;
  // ...
}
```

ו**חשוב**: כאשר יש התנגשות, להחזיר שגיאה ברורה למשתמש במקום ליצור הזמנה עם סטטוס `conflict`.

---

## סיכום קבצים לעדכון

| קובץ | שינוי |
|------|-------|
| `src/pages/Activities.tsx` | תיקון `getReservationSpan`, `getReservationForHour`, `isReservationStart` לתמיכה בדקות |
| `src/context/VillageContext.tsx` | הוספת פונקציה `timeRangesOverlapWithGap` ועדכון בדיקת החפיפה ב-`addActivityReservation` |
| `src/lib/groupSync.ts` | עדכון `timeRangesOverlap` לכלול מרווח 15 דקות + מניעת יצירת הזמנות מתנגשות (או הצגת שגיאה ברורה) |

---

## תוצאה צפויה

1. ✅ הצגה נכונה של הזמנות גם עם שעות לא עגולות (09:30-10:30)
2. ✅ מניעת יצירת הזמנה חדשה אם אין מרווח של 15 דקות מהזמנה קיימת
3. ✅ הודעת שגיאה ברורה כאשר יש התנגשות
4. ✅ הכלל חל על כל מקורות ההזמנות:
   - הזמנה ידנית מדף Activities
   - סנכרון קבוצות לינה
   - סנכרון קבוצות יום

