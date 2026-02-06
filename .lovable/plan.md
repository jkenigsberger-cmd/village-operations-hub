
# תיקון באגי שיבוץ VIP ותצוגת שכונות

## הבעיות שזוהו

### בעיה 1: שיבוץ כפול של אוהל VIP לאותה קבוצה
**מקור הבאג:** בפונקציה `getAvailableVIPTents` (בקובץ `useGroupAllocation.ts`), הבדיקה לאוהלים תפוסים מחפשת קונפליקטים רק בקבוצות **אחרות** (שורה 397-401):
```typescript
const conflictingGroup = groups.find(g => {
  if (excludeGroupId && g.id === excludeGroupId) return false; // <-- פה הבעיה!
  ...
});
```
הקוד מדלג על הקבוצה הנוכחית, ולכן לא בודק אם אוהל כבר שובץ לתצורה אחרת **באותה קבוצה**.

### בעיה 2: שיבוץ VIP לא מוצג במפות השכונות בדשבורד
**מקור הבעיה:** כאשר משבצים אוהל VIP דרך מסך השיבוץ, הנתונים נשמרים רק ב-`group.vipTentConfigs[].assignedTentCode` (במערכת הקבוצות), אך **לא מעודכנים** ב-`state.tents` של הכפר. מפות המיני בדשבורד קוראות מ-`state.tents`, ולכן לא רואות את השיבוצים.

---

## הפתרון

### תיקון 1: מניעת שיבוץ כפול בתוך אותה קבוצה

**קובץ:** `src/hooks/useGroupAllocation.ts`

**שינוי:** בפונקציה `getAvailableVIPTents`, הוספת בדיקה גם לתוך הקבוצה הנוכחית:

```typescript
// Check if tent is already assigned WITHIN the current group
const currentGroup = excludeGroupId ? groups.find(g => g.id === excludeGroupId) : null;
if (currentGroup?.vipTentConfigs?.some(config => config.assignedTentCode === tentCode)) {
  return {
    tentCode,
    available: false,
    conflictingGroup: currentGroup.groupName + ' (כבר שובץ)'
  };
}
```

### תיקון 2: סנכרון שיבוץ VIP עם מצב הכפר

**קובץ:** `src/hooks/useGroupAllocation.ts`

**שינוי:** בפונקציה `assignVIPConfig`, הוספת עדכון לאוהל ב-Village State:

```typescript
// After updating group vipTentConfigs, also sync to village tents
const tentId = `VIP_${tentCode}`;
// Use the village context to update the tent with group info
// This requires adding useVillage() to the hook or passing a callback
```

**בעיה:** ה-hook `useGroupAllocation` לא מחזיק ישירות את הפונקציות לעדכון אוהלים מ-VillageContext. 

**פתרון:** הוספת קריאה ל-`updateTentGroupName`, `updateTentDates`, ו-`updateTentGender` מתוך ה-VillageContext בזמן השיבוץ.

---

## פירוט השינויים

### קובץ: `src/hooks/useGroupAllocation.ts`

1. **שורות ~354-414 (`getAvailableVIPTents`):**
   - הוספת בדיקה לתצורות שכבר שובצו **בתוך** הקבוצה הנוכחית
   - זה ימנע שיבוץ של אותו אוהל לשתי תצורות באותה קבוצה

2. **שורות ~424-464 (`assignVIPConfig`):**
   - הוספת callback parameter או שימוש ב-context לעדכון ה-tent ב-village state
   - עדכון: `groupName`, `checkInDate`, `checkOutDate`, `gender`

### אפשרות מימוש A - הרחבת ה-Hook:

הוספת פרמטרים ל-`useGroupAllocation` לקבלת פונקציות מ-VillageContext:

```typescript
export const useGroupAllocation = (villageCallbacks?: {
  updateTentGroupName?: (tentId: string, groupName: string) => void;
  updateTentDates?: (tentId: string, checkIn?: string, checkOut?: string) => void;
  updateTentGender?: (tentId: string, gender: TentGender) => void;
}) => {
  // ...
}
```

### אפשרות מימוש B (מומלצת) - שימוש ישיר ב-Context:

הוספת `useVillage()` ישירות ב-hook:

```typescript
export const useGroupAllocation = () => {
  const { state, updateTentGroupName, updateTentDates, updateTentGender } = useVillage();
  // ... שאר הקוד
}
```

ובפונקציית `assignVIPConfig`:

```typescript
const assignVIPConfig = useCallback((
  groupId: string, 
  configId: string, 
  tentCode: string
): boolean => {
  // ... existing validation code ...
  
  // Update village tent state
  const tentId = `VIP_${tentCode}`;
  updateTentGroupName(tentId, group.groupName);
  updateTentDates(tentId, group.startDate, group.endDate);
  if (configToAssign.gender) {
    updateTentGender(tentId, configToAssign.gender === 'male' ? 'MALE' : 'FEMALE');
  }
  
  // ... existing group update code ...
  
  return true;
}, [..., updateTentGroupName, updateTentDates, updateTentGender]);
```

### קובץ: `src/components/VIPAllocationTab.tsx`

- אין שינוי נדרש - התיקון ב-hook יספיק

---

## בדיקות קבלה

1. **בדיקת מניעת כפילות:**
   - פתח מסך שיבוץ לקבוצה
   - שבץ תצורה לאוהל VIP 80
   - נסה לשבץ תצורה נוספת לאוהל VIP 80
   - **צפוי:** האוהל מסומן כ"תפוס" ולא ניתן לשיבוץ

2. **בדיקת תצוגת מפות:**
   - שבץ תצורת VIP לאוהל 83
   - חזור לדשבורד הראשי
   - **צפוי:** מפת VIP מציגה את אוהל 83 בצבע המגדר המתאים

3. **בדיקת דף השכונה:**
   - נווט לשכונת VIP
   - **צפוי:** האוהל המשובץ מציג את שם הקבוצה ותאריכים

4. **בדיקת ביטול שיבוץ:**
   - בטל שיבוץ של אוהל VIP
   - **צפוי:** האוהל חוזר להיות ריק גם במפות וגם בשכונה

---

## סיכום קבצים לעדכון

| קובץ | סוג שינוי | תיאור |
|------|-----------|--------|
| `src/hooks/useGroupAllocation.ts` | עדכון | תיקון `getAvailableVIPTents` + הוספת סנכרון ב-`assignVIPConfig` ו-`unassignVIPConfig` |

---

## הערות בטיחות

- **לא משנה** לוגיקת מטבח/חללים משותפים
- **לא משנה** את מבנה הנתונים הקיים
- **לא משנה** את מפות השכונות (רק את הנתונים שהן קוראות)
- שמירת תאימות לאחור מלאה
