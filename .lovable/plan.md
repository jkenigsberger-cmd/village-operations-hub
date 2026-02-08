

# עדכון שם קבוצה גם בארוחות המטבח

## הבעיה

נמצאו 2 ארוחות מטבח עם השם הישן "השומר החדש":

| תאריך | ארוחה | קבוצה |
|-------|-------|-------|
| 09.02.2026 | ערב | השומר החדש |
| 10.02.2026 | בוקר | השומר החדש |

הסיבה: כשקבוצה משנה שם, הקוד מעדכן את `neighborhood_reservations`, `activity_reservations` ו-`tents`, אבל **לא** את `kitchen_time_slots`.

---

## הפתרון

### שלב 1: ניקוי מיידי

עדכון ה-2 ארוחות הקיימות משם ישן לשם חדש:

```sql
-- עדכון ידני של הארוחות שנשארו עם השם הישן
```

### שלב 2: מניעה לעתיד

הוספת עדכון `kitchen_time_slots` בפונקציית `updateGroup`:

**בקובץ `src/hooks/useAdminGroups.ts`:**

```typescript
// בתוך הבלוק של שינוי שם קבוצה
// הוספה אחרי עדכון 3 הטבלאות הקיימות:

// עדכון שם קבוצה בארוחות מטבח
const { data: kitchenSlots } = await supabase
  .from('kitchen_time_slots')
  .select('id, groups');

if (kitchenSlots) {
  for (const slot of kitchenSlots) {
    if (!slot.groups || !Array.isArray(slot.groups)) continue;
    const hasGroup = slot.groups.some(g => g.name === oldName);
    if (hasGroup) {
      const updatedGroups = slot.groups.map(g => 
        g.name === oldName ? { ...g, name: newName } : g
      );
      await supabase
        .from('kitchen_time_slots')
        .update({ groups: updatedGroups })
        .eq('id', slot.id);
    }
  }
}
```

---

## קבצים לעדכון

| קובץ | שינוי |
|------|-------|
| מסד נתונים | עדכון 2 ארוחות מ-"השומר החדש" ל-"השומר" |
| `src/hooks/useAdminGroups.ts` | הוספת עדכון kitchen_time_slots בשינוי שם |

---

## תוצאה

- ✅ הארוחות יציגו "השומר" במקום "השומר החדש"
- ✅ בעתיד - שינוי שם קבוצה יעדכן גם את הארוחות שלה

