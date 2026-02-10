

# תיקון: מספר בנים/בנות מתאפס ל-10

## הבעיה

כשמזינים מספר בשדות "בנים" או "בנות", הערך מתאפס ל-10 אוטומטית.

**הסיבה**: הרכיב `NumericInput` מקבל `max={formData.participantCount || 0}`, וכשיוצרים קבוצה חדשה ה-`participantCount` הוא 10 כברירת מחדל. כשיוצאים מהשדה (blur), הרכיב חותך את הערך ל-max (כלומר 10).

## הפתרון

להסיר את מגבלת ה-`max` מהשדות בנים ובנות. במקום חסימה, כבר קיימת **אזהרה ויזואלית** כשהסכום לא תואם את מספר החניכים — וזה מספיק.

## פרטים טכניים

**קובץ: `src/pages/AdminGroupEdit.tsx`**

שורות 1016-1017 ו-1025-1026 — הסרת `max` מ-NumericInput:

```diff
 <NumericInput
   value={formData.boysCount ?? 0}
   onChange={(val) => setFormData(prev => ({ ...prev, boysCount: val || undefined }))}
   min={0}
-  max={formData.participantCount || 0}
 />

 <NumericInput
   value={formData.girlsCount ?? 0}
   onChange={(val) => setFormData(prev => ({ ...prev, girlsCount: val || undefined }))}
   min={0}
-  max={formData.participantCount || 0}
 />
```

שינוי אחד בקובץ אחד בלבד.

