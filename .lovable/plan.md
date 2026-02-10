

# תיקון שמירת שעת הגעה ויציאה לקבוצות פעילות יום

## הבעיה

שעת ההגעה (`arrivalTime`) ושעת היציאה (`departureTime`) של קבוצות "יום ללא לינה" **לא נשמרות** כי:
1. אין עמודות `arrival_time` ו-`departure_time` בטבלת `groups` בדאטהבייס
2. ה-hook `useAdminGroups.ts` לא שומר/טוען את השדות האלה

הנתונים מוצגים בטופס אבל נעלמים אחרי רענון.

## הפתרון

### שלב 1: הוספת עמודות לדאטהבייס

```sql
ALTER TABLE public.groups 
  ADD COLUMN arrival_time text,
  ADD COLUMN departure_time text;
```

### שלב 2: עדכון ה-hook

**קובץ: `src/hooks/useAdminGroups.ts`**

1. **טעינה** (`mapDbRowToGroup`): מיפוי `row.arrival_time` ו-`row.departure_time`
2. **יצירה** (`addGroup`): שמירת `arrival_time` ו-`departure_time`
3. **עדכון** (`updateGroup`): מיפוי `updates.arrivalTime` ו-`updates.departureTime`

## פרטים טכניים

| שינוי | קובץ |
|-------|------|
| מיגרציה - 2 עמודות חדשות | `supabase/migrations/...` |
| שמירה/טעינה של שעות | `src/hooks/useAdminGroups.ts` |

### מה לא ישתנה
- הטופס ב-`AdminGroupEdit.tsx` כבר עובד נכון
- תצוגות בלוח שנה, דף היום, ומודל לוח זמנים - כבר קוראות את השדות מה-GroupRecord
