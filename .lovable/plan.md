

# תיקון סנכרון אוהלי VIP עם מצב הכפר

## הבעיה שזוהתה

כאשר משבצים אוהל VIP דרך מסך השיבוץ, הקוד מנסה לעדכן את האוהל לפי ID שהוא בנה (`VIP_80`), אבל **ה-ID האמיתי של האוהל הוא מזהה רנדומלי** שנוצר ב-`initialData.ts`:

```typescript
const tentId = generateId(); // random ID like "abc123xyz"
const tentCode = `VIP ${i}`; // "VIP 80"
```

לכן הקריאות ל-`updateTentGroupName('VIP_80', ...)` לא עובדות - כי אין אוהל עם ID כזה.

---

## הפתרון

### שינוי 1: הוספת פונקציית עזר למציאת אוהל לפי קוד

**קובץ:** `src/hooks/useGroupAllocation.ts`

הוספת פונקציה שמחפשת אוהל לפי ה-code שלו (למשל "VIP 80") ומחזירה את ה-ID האמיתי:

```typescript
// Helper: Find tent ID by code (e.g., "VIP 80")
const findTentIdByCode = useCallback((tentCode: string): string | undefined => {
  return Object.values(state.tents).find(t => t.code === tentCode)?.id;
}, [state]);
```

### שינוי 2: תיקון `assignVIPConfig`

**קובץ:** `src/hooks/useGroupAllocation.ts`

במקום לבנות ID לא נכון, נמצא את האוהל לפי הקוד שלו:

```typescript
// בתוך assignVIPConfig
const fullTentCode = `VIP ${tentCode}`; // e.g., "VIP 80"
const tentId = findTentIdByCode(fullTentCode);
if (tentId) {
  updateTentGroupName(tentId, group.groupName);
  updateTentDates(tentId, group.startDate, group.endDate);
  if (configToAssign.gender) {
    const villageGender = configToAssign.gender === 'male' ? 'MALE' : 
                         configToAssign.gender === 'female' ? 'FEMALE' : undefined;
    if (villageGender) {
      updateTentGender(tentId, villageGender);
    }
  }
}
```

### שינוי 3: תיקון `unassignVIPConfig`

**קובץ:** `src/hooks/useGroupAllocation.ts`

אותו תיקון לביטול שיבוץ:

```typescript
// בתוך unassignVIPConfig
const fullTentCode = `VIP ${tentCode}`;
const tentId = findTentIdByCode(fullTentCode);
if (tentId) {
  updateTentGroupName(tentId, '');
  updateTentDates(tentId, undefined, undefined);
  updateTentGender(tentId, undefined);
}
```

---

## סיכום קבצים לעדכון

| קובץ | סוג שינוי | תיאור |
|------|-----------|-------|
| `src/hooks/useGroupAllocation.ts` | עדכון | הוספת `findTentIdByCode` + תיקון השיבוץ להשתמש ב-ID האמיתי |

---

## התוצאה הצפויה

לאחר התיקון:

1. **מפת VIP בדשבורד** - תציג צבעי מגדר על אוהלים משובצים
2. **רשת האוהלים בשכונת VIP** - תציג שם קבוצה, תאריכים, ומגדר
3. **לוח השנה** - יציג check-in/check-out של אוהלי VIP
4. **ביטול שיבוץ** - ינקה את האוהל גם בתצוגה הויזואלית

---

## בדיקות קבלה

1. שבץ תצורת VIP (נקבה) לאוהל 83
2. חזור לדשבורד - מפת VIP מראה אוהל 83 בצבע ורוד
3. פתח שכונת VIP - כרטיס אוהל 83 מציג שם קבוצה ותאריכים
4. בטל את השיבוץ - האוהל חוזר להיות ריק בכל התצוגות

