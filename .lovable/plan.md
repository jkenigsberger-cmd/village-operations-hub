

# ניהול מחיקה וארכיון קבוצות - תוכנית מקיפה

## שתי הבעיות שזוהו

### 1. מחיקת קבוצה לא מנקה נתונים משויכים (הבקשה הקודמת)
כאשר קבוצה נמחקת לצמיתות, כל השיבוצים, הזמנות המרחבים, הזמנות השכונות והארוחות נשארים במערכת.

### 2. קבוצות בארכיון עדיין מוצגות בלוחות זמנים (הבקשה החדשה)
קבוצה בארכיון עדיין מופיעה ב:
- לוח שנה ראשי (MasterCalendar) - **נבדק: כבר מסונן!** ✓
- הזמנות מרחבים (activity_reservations) - **לא מסונן**
- הזמנות שכונות (neighborhood_reservations) - **לא מסונן**
- ארוחות במטבח (kitchen_time_slots) - **לא מסונן**
- אוהלים (tents) - **לא מסונן**
- סיכום יומי בדשבורד (Check-ins/Check-outs) - **לא מסונן**

---

## הפתרון המוצע

### חלק א: מחיקת נתונים בקסקדה (Cascade Delete)

שכתוב `src/lib/groupLinkedRecords.ts` לשימוש ב-Supabase:

```text
┌─────────────────────────────────────────────────────┐
│  cascadeDeleteGroupRecords(groupId, groupName)      │
│                                                     │
│  1. DELETE FROM allocations                         │
│     WHERE group_id = groupId                        │
│                                                     │
│  2. DELETE FROM neighborhood_reservations           │
│     WHERE group_name = groupName                    │
│                                                     │
│  3. DELETE FROM activity_reservations               │
│     WHERE group_id = groupId OR group_name = name   │
│                                                     │
│  4. UPDATE kitchen_time_slots                       │
│     Remove group from 'groups' JSON array           │
│                                                     │
│  5. UPDATE tents                                    │
│     SET group_name = null, check_in_date = null,    │
│         check_out_date = null, gender = 'MIXED'     │
│     WHERE group_name = groupName                    │
└─────────────────────────────────────────────────────┘
```

### חלק ב: הסתרת נתונים של קבוצות בארכיון

כאשר קבוצה מועברת לארכיון:
- **הנתונים נשמרים** (ניתן לשחזור ולערוך)
- **הנתונים לא מוצגים** בתצוגות תפעוליות

יש להוסיף סינון בקבצים הבאים:

| קובץ | סינון נדרש |
|------|------------|
| `src/hooks/useSupabaseVillage.ts` | סינון אוהלים לפי `group_name` של קבוצות לא-בארכיון |
| `src/components/MasterCalendar.tsx` | **כבר מסונן** - `!g.isArchived` |
| `src/context/VillageContext.tsx` | ב-`getTodaySummary` - סינון check-ins/outs של קבוצות בארכיון |

**גישה אלטרנטיבית (פשוטה יותר):**
במקום לסנן בכל מקום, ניתן לנקות את הנתונים בעת העברה לארכיון - **אבל** המשתמש ביקש שהנתונים יישמרו לעריכה עתידית.

---

## סיכום השינויים

### קובץ 1: `src/lib/groupLinkedRecords.ts`
שכתוב מלא:
- הפונקציות יהפכו ל-`async`
- שימוש ב-Supabase client במקום localStorage
- `getLinkedRecordsSummary` - שליפת נתונים מ-5 טבלאות
- `cascadeDeleteGroupRecords` - מחיקה/עדכון ב-5 טבלאות

### קובץ 2: `src/pages/AdminGroupEdit.tsx`
עדכון הקריאה ל-cascade delete:
```typescript
// לפני:
cascadeDeleteGroupRecords(id, formData.groupName);
deleteGroup(id);

// אחרי:
await cascadeDeleteGroupRecords(id, formData.groupName);
await deleteGroup(id);
```

### קובץ 3: `src/pages/AdminGroups.tsx`
עדכון הקריאה ל-cascade delete בדיוק כמו למעלה.

### קובץ 4: `src/context/VillageContext.tsx`
בפונקציה `getTodaySummary`:
- הוספת פרמטר `archivedGroupNames: string[]`
- סינון check-ins/check-outs שה-`groupName` שלהם לא ברשימת הארכיון

### קובץ 5: `src/hooks/useSupabaseVillage.ts`
בפונקציה שטוענת נתונים:
- הוספת join או בדיקה נגד `groups` table לקבלת `isArchived`
- החזרת דגל `isArchived` עם כל reservation/tent לצורך סינון בצד הלקוח

---

## מה נשאר ללא שינוי
- לוגיקת הארכיון עצמה (Archive/Restore)
- `MasterCalendar` - כבר מסנן קבוצות בארכיון
- `getSleepingGroups` - כבר מסנן קבוצות בארכיון
- `groupNeedsAllocation` - כבר מסנן קבוצות בארכיון

---

## תוצאה צפויה

**מחיקה לצמיתות:**
1. ✅ כל השיבוצים (VIP + שכונות) נמחקים
2. ✅ כל הזמנות המרחבים נמחקות
3. ✅ הזמנות השכונות נמחקות
4. ✅ הקבוצה מוסרת מארוחות במטבח
5. ✅ אוהלים משוחררים
6. ✅ הקבוצה עצמה נמחקת

**העברה לארכיון:**
1. ✅ כל הנתונים נשמרים לעריכה
2. ✅ הנתונים לא מופיעים בלוח שנה
3. ✅ הנתונים לא מופיעים בסיכום יומי
4. ✅ הנתונים לא מופיעים בהתראות
5. ✅ ניתן לשחזר מהארכיון ולראות הכל מחדש

