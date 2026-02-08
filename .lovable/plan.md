

# תיקון שמירת "העדפת חלוקה לאוהלי לינה"

## הבעיה

העדפת החלוקה לאוהלי לינה **לא נשמרת ולא נטענת** מכיוון שה-hook `useAdminGroups.ts` חסר את הקוד לטיפול בשדה `distribution_preference`.

**השדה קיים בדאטהבייס** (עמודת JSONB בטבלת groups), אבל ה-hook לא:
1. שומר אותו בעת יצירת קבוצה
2. שומר אותו בעת עדכון קבוצה  
3. טוען אותו בעת קריאת קבוצות

## הפתרון

עדכון הקובץ `src/hooks/useAdminGroups.ts` בשלושה מקומות:

### 1. טעינה - הוספה ל-`mapDbRowToGroup`

```typescript
const mapDbRowToGroup = (row: any): GroupRecord => ({
  // ... existing mappings ...
  distributionPreference: row.distribution_preference || undefined,  // הוסף שורה זו
});
```

### 2. יצירה - הוספה ל-`addGroup`

```typescript
const { error } = await supabase.from('groups').insert({
  // ... existing fields ...
  distribution_preference: group.distributionPreference 
    ? JSON.parse(JSON.stringify(group.distributionPreference)) 
    : null,  // הוסף שורה זו
});
```

### 3. עדכון - הוספה ל-`updateGroup`

```typescript
// הוסף את הבלוק הזה אחרי שאר המיפויים:
if (updates.distributionPreference !== undefined) {
  dbUpdates.distribution_preference = updates.distributionPreference 
    ? JSON.parse(JSON.stringify(updates.distributionPreference)) 
    : null;
}
```

---

## פרטים טכניים

| קובץ | שינוי |
|------|-------|
| `src/hooks/useAdminGroups.ts` | הוספת מיפוי `distributionPreference` בשלושה מקומות |

### מה לא ישתנה
- לוגיקת השיבוץ
- טבלאות allocations ו-neighborhood_reservations
- VIP, לוח שנה, מטבח

---

## בדיקות קבלה

1. יצירת קבוצה חדשה עם העדפת חלוקה → נשמרת
2. רענון הדף → ההעדפה נטענת לטופס
3. עדכון קבוצה קיימת עם העדפה → נשמרת
4. פתיחת טאב שיבוצים → הפאנל מציג את ההעדפה
5. הזנת נתונים מומלצים (לחיצה על "חלק אוטומטית") → נשמרת

