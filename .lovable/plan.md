

# ניקוי הזמנות יתומות ומניעה לעתיד

## הבעיה

נמצאו 3 הזמנות שכונה "יתומות" - הקבוצות שלהן נמחקו או שונה שמן:

| קבוצה | שכונה | סיבה |
|-------|-------|------|
| Dugm | N6 | הקבוצה נמחקה |
| השומר החדש | N1 | שם ישן (עכשיו "השומר") |
| השומר החדש | N4 | שם ישן (עכשיו "השומר") |

---

## הפתרון

### שלב 1: ניקוי מיידי

הרצת SQL למחיקת ההזמנות היתומות:

```sql
DELETE FROM neighborhood_reservations 
WHERE group_name NOT IN (SELECT name FROM groups);
```

### שלב 2: מניעה לעתיד

עדכון הקוד כך שמחיקת/עדכון קבוצה יטפלו גם בהזמנות:

**בקובץ `src/hooks/useAdminGroups.ts`:**

1. **בפונקציית `deleteGroup`** - הוספת קריאה ל-`cascadeDeleteGroupRecords` שכבר קיימת ב-`src/lib/groupLinkedRecords.ts` לפני מחיקת הקבוצה

2. **בפונקציית `updateGroup`** - אם השם משתנה, עדכון גם בטבלאות:
   - `neighborhood_reservations.group_name`
   - `activity_reservations.group_name`
   - `tents.group_name`

---

## קבצים לעדכון

| קובץ | שינוי |
|------|-------|
| מסד נתונים | מחיקת 3 הזמנות יתומות |
| `src/hooks/useAdminGroups.ts` | שילוב cascade delete + עדכון שם בכל הטבלאות |

---

## תוצאה

- ✅ "Dugm" ו-"השומר החדש" ייעלמו מהמערכת
- ✅ מחיקת קבוצה תמחק את כל ההזמנות שלה
- ✅ שינוי שם קבוצה יעדכן את כל ההזמנות

