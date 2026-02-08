

# תיקון סנכרון קבוצות וארוחות

## הבעיה שזוהתה

כל פעם ששומרים קבוצה, נוצרות ארוחות **חדשות** בנוסף לישנות במקום להחליף אותן.

### מצב נוכחי במסד הנתונים:
- קבוצה "השומר החדש" עם 2 ארוחות בתוכנית (ערב 09.02, בוקר 10.02)
- **4 ארוחות** בטבלת המטבח עם אותה קבוצה (כפילויות!)

### הגורם הטכני:
טבלת `kitchen_time_slots` חסרה עמודות `source` ו-`group_id` שנדרשות כדי לזהות ולמחוק ארוחות ישנות לפני יצירת חדשות.

---

## הפתרון

### שלב 1: הוספת עמודות לטבלת המטבח

```sql
ALTER TABLE kitchen_time_slots 
ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'manual',
ADD COLUMN IF NOT EXISTS group_id TEXT;
```

### שלב 2: עדכון פונקציית הסנכרון

**בקובץ `src/lib/groupSync.ts`:**

לפני יצירת ארוחות חדשות - מחיקת הישנות:

```typescript
// מחיקת ארוחות ישנות של הקבוצה
await supabase
  .from('kitchen_time_slots')
  .delete()
  .eq('source', 'groupSync')
  .eq('group_id', group.id);

// יצירת ארוחות חדשות עם source ו-group_id
const slotsToInsert = group.mealsPlan
  .filter(meal => meal.pax > 0)
  .map(meal => ({
    ...existingMapping,
    source: 'groupSync',
    group_id: group.id,
  }));
```

### שלב 3: ניקוי כפילויות קיימות

מחיקת הארוחות הכפולות שנוצרו עד כה.

---

## קבצים לעדכון

| קובץ | שינוי |
|------|-------|
| מסד נתונים | הוספת עמודות `source`, `group_id` לטבלת `kitchen_time_slots` |
| `src/lib/groupSync.ts` | מחיקת ארוחות ישנות לפני יצירת חדשות |
| מסד נתונים | ניקוי כפילויות קיימות |

---

## תוצאה

- ✅ עריכת קבוצה תעדכן ארוחות קיימות במקום ליצור כפילויות
- ✅ שינוי שם קבוצה יתעדכן גם בארוחות
- ✅ מחיקת קבוצה תמחק גם את הארוחות שלה

