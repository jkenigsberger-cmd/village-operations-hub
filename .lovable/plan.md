

# תיקון: סנכרון שיבוץ VIP עם מצב הכפר

## הבעיות שזוהו

### בעיה 1: `getAvailableVIPTents` מחפשת אוהל לפי ID שגוי

**קובץ:** `src/hooks/useGroupAllocation.ts` (שורות 398-399)

```typescript
// הקוד הנוכחי (באג!):
const tentId = `VIP_${tentCode}`;  // יוצר "VIP_80" עם קו תחתון
const tent = state.tents[tentId]; // מנסה לגשת לפי ID - אבל ה-ID הוא רנדומלי!
```

**בעיה כפולה:**
1. השימוש בקו תחתון (`VIP_80`) במקום רווח (`VIP 80`)
2. ניסיון לגשת לאוהל לפי `code` כאילו היה `id` - אבל ה-ID של האוהלים הוא מחרוזת רנדומלית!

### בעיה 2: הפונקציה לא משתמשת ב-`findTentIdByCode`

בעוד שתיקנו את `assignVIPConfig` ו-`unassignVIPConfig` להשתמש ב-`findTentIdByCode`, הפונקציה `getAvailableVIPTents` עדיין משתמשת בגישה הישנה והשגויה.

---

## הפתרון

### שינוי 1: תיקון `getAvailableVIPTents` להשתמש ב-`findTentIdByCode`

**קובץ:** `src/hooks/useGroupAllocation.ts`

**לפני (שורות 397-412):**
```typescript
// Check village state for existing bookings
if (state) {
  const tentId = `VIP_${tentCode}`;  // שגוי!
  const tent = state.tents[tentId];
  if (tent && tent.checkInDate && tent.checkOutDate && tent.groupName) {
    // ...
  }
}
```

**אחרי:**
```typescript
// Check village state for existing bookings
if (state) {
  const fullTentCode = `VIP ${tentCode}`; // "VIP 80"
  const actualTentId = findTentIdByCode(fullTentCode);
  const tent = actualTentId ? state.tents[actualTentId] : null;
  if (tent && tent.checkInDate && tent.checkOutDate && tent.groupName) {
    // ...
  }
}
```

---

## סיכום הקובץ לעדכון

| קובץ | שינוי |
|------|-------|
| `src/hooks/useGroupAllocation.ts` | תיקון `getAvailableVIPTents` שורות ~397-412 להשתמש ב-`findTentIdByCode` |

---

## בדיקות קבלה

1. **שיבוץ אוהל VIP:**
   - צור קבוצה עם צוות
   - פתח מסך שיבוץ ושבץ תצורה לאוהל VIP 80
   - **צפוי:** הודעת הצלחה

2. **תצוגת שכונת VIP:**
   - נווט לשכונת VIP
   - **צפוי:** אוהל 80 מציג את שם הקבוצה ותאריכים

3. **מפת VIP בדשבורד:**
   - חזור לדשבורד
   - **צפוי:** מפת VIP מציגה צבע מגדר על אוהל 80

4. **מניעת שיבוץ כפול:**
   - נסה לשבץ תצורה נוספת לאוהל 80
   - **צפוי:** האוהל מסומן כתפוס

