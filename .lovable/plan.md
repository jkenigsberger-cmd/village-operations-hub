
# סנכרון מרחבים משותפים - תיקון מקור הנתונים

## הבעיה שזוהתה

כאשר קבוצה נוצרת ומסונכרנת (דרך `syncGroupToModules`), ההזמנות נשמרות ב-**Supabase** בטבלת `activity_reservations`.

אבל כאשר נכנסים לדף מתקנים משותפים (Activities), הנתונים נקראים מ-**localStorage** דרך `useVillageData`.

זה אומר שיש שני מקורות נתונים שונים לחלוטין:
- **groupSync** → כותב ל-Supabase ✓
- **Activities page** → קורא מ-localStorage ✗

לכן ההזמנות שנוצרו מהקבוצה לא מופיעות בלוח הזמנים של הממ״ד.

## הפתרון

לעדכן את `VillageContext` כך שישתמש ב-`useSupabaseVillage` במקום `useVillageData`.

הקובץ `useSupabaseVillage.ts` כבר קיים ומכיל את כל הפונקציות הנדרשות - רק צריך לחבר אותו.

## שינויים נדרשים

### קובץ: `src/context/VillageContext.tsx`

| לפני | אחרי |
|------|------|
| `import { useVillageData } from '@/hooks/useVillageData'` | `import { useSupabaseVillage } from '@/hooks/useSupabaseVillage'` |
| `const { state, isLoading, saveState, ... } = useVillageData()` | `const { state, isLoading, ... } = useSupabaseVillage()` |

כמו כן, כל הפונקציות שכותבות למידע (כמו `updateBedStatus`, `addActivityReservation` וכו') צריכות להשתמש בפונקציות של `useSupabaseVillage` במקום לעדכן localStorage.

## זרימת נתונים מתוקנת

```text
┌─────────────────────────────────────────────────────────────┐
│                      לפני התיקון                            │
├─────────────────────────────────────────────────────────────┤
│  Admin Groups ─── syncGroupToModules ───▶ Supabase DB       │
│                                                             │
│  Activities Page ◀─── useVillageData ─── localStorage       │
│                                                             │
│  ⚠️ נתונים לא מסונכרנים!                                    │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                      אחרי התיקון                            │
├─────────────────────────────────────────────────────────────┤
│  Admin Groups ─── syncGroupToModules ───▶ Supabase DB       │
│                                              ▲              │
│  Activities Page ◀─── useSupabaseVillage ────┘              │
│                                                             │
│  ✓ נתונים מסונכרנים!                                        │
└─────────────────────────────────────────────────────────────┘
```

## מבנה השינוי

הפונקציות ב-`VillageContext` מתחלקות לשתי קטגוריות:

**פונקציות חישוב (נשארות כמו שהן):**
- `getNeighborhoodSummary`
- `getTentSummary`
- `getTodaySummary`
- `checkNeighborhoodAvailability`
- וכו'

**פונקציות כתיבה (צריכות לעבור ל-Supabase):**
- `updateBedStatus` → קריאה ל-`updateBed` מ-Supabase hook
- `addActivityReservation` → קריאה ל-`addActivityReservation` מ-Supabase hook
- וכו'

## סיכום קבצים לעדכון

| קובץ | סוג שינוי |
|------|-----------|
| `src/context/VillageContext.tsx` | החלפת hook מקור הנתונים + עדכון כל פונקציות הכתיבה |

## תוצאה צפויה

1. ✅ הזמנות שנוצרות מסנכרון קבוצות יופיעו בדף מתקנים משותפים
2. ✅ כל הנתונים יהיו מסונכרנים בזמן אמת (realtime כבר מוגדר ב-Supabase hook)
3. ✅ הנתונים יהיו עקביים בכל הדפים
4. ✅ ניתן יהיה לעבוד מכמה מכשירים במקביל

## הערה חשובה

שמות המתקנים ב-Supabase הם באנגלית ("Bunker 6") אבל ב-`initialData.ts` הם בעברית ("ממ״ד 6"). לאחר העברה ל-Supabase, ייתכן שיהיה צורך לעדכן את שמות המתקנים בטבלת `activity_spaces` לעברית:

```sql
UPDATE activity_spaces SET name = 'ממ״ד 6' WHERE id = 'bunker_6';
UPDATE activity_spaces SET name = 'ממ״ד 7' WHERE id = 'bunker_7';
UPDATE activity_spaces SET name = 'ממ״ד 8' WHERE id = 'bunker_8';
UPDATE activity_spaces SET name = 'אוהל מועד' WHERE id = 'ohel_moed';
UPDATE activity_spaces SET name = 'חדר אוכל' WHERE id = 'dining_hall';
```
