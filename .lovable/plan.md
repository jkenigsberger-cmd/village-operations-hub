
# ארגון מחדש: לוח שיבוצים, לשונית שיבוצים נפרדת, ולוח שנה בשכונות

## סיכום הבקשה

1. **דשבורד הבית** - להציג רק שיבוצים ליום הנוכחי (במקום כל הממתינים)
2. **לשונית שיבוצים חדשה** - טאב נפרד בתפריט הראשי לכל השיבוצים הממתינים + התראה כשיש ממתינים
3. **לוח שנה בתצוגת שכונה** - לבחור תאריך ולראות הזמנות עתידיות + שיבוצים לאותה שכונה

---

## מבנה השינויים

### 1. דשבורד (Index.tsx) - שיבוצים ליום הנוכחי בלבד

**שינוי ב-`PendingAllocationsSection`:**
- סינון רק לקבוצות ש-`startDate` או `endDate` הוא היום
- שינוי הכותרת ל-"שיבוצים להיום"

```typescript
const todayAllocations = useMemo(() => {
  const todayStr = format(new Date(), 'yyyy-MM-dd');
  return pendingAllocationGroups.filter(g => 
    g.startDate === todayStr || g.endDate === todayStr
  );
}, [pendingAllocationGroups]);
```

### 2. הוספת טאב "שיבוצים" לתפריט הראשי

**שינוי ב-`menuItems`:**
- הוספת פריט `allocation` עם אייקון `ClipboardList`
- הצגת באדג' עם מספר הקבוצות הממתינות (כל הקבוצות, לא רק היום)

```typescript
{ key: 'allocations', label: 'שיבוצים', icon: ClipboardList, count: pendingAllocationGroups.length }
```

**הוספת סקשן `allocations`:**
- רשימת כל הקבוצות הממתינות לשיבוץ (לא משנה התאריך)
- קישור מהיר לעמוד `/allocation/:id`

### 3. לוח שנה בתצוגת שכונה (Neighborhood.tsx)

**הוספת רכיב `NeighborhoodCalendar`:**
- בורר תאריכים עם ניווט ימינה/שמאלה
- הצגת הזמנות/שיבוצים לשכונה הנבחרת לפי תאריך

**מקורות נתונים:**
1. `neighborhoodReservations` - הזמנות קיימות לשכונה
2. `allocations` מ-`useGroupAllocation` - שיבוצים פעילים
3. `tents` עם `checkInDate/checkOutDate` - אוהלים בודדים עם תפוסה

**תצוגה:**
- רשימת קבוצות/הזמנות פעילות לתאריך הנבחר
- אינדיקטור תפוסה לכל אוהל (כמה מיטות תפוסות)
- לחיצה על קבוצה פותחת מודל עם פרטים

---

## קבצים לעדכון

| קובץ | שינויים |
|------|----------|
| `src/pages/Index.tsx` | סינון שיבוצים להיום בלבד + הוספת טאב שיבוצים |
| `src/pages/Neighborhood.tsx` | הוספת בורר תאריך + תצוגת הזמנות לתאריך |
| `src/components/NeighborhoodDatePicker.tsx` | רכיב חדש - בורר תאריך עם ניווט |
| `src/components/NeighborhoodBookingsList.tsx` | רכיב חדש - רשימת הזמנות/שיבוצים לתאריך |
| `src/lib/translations.ts` | הוספת תרגומים חדשים |

---

## תכנון טכני מפורט

### א. Index.tsx - שינויים

1. **הוספת `MenuSection`:**
```typescript
type MenuSection = 'overview' | 'calendar' | 'allocations' | 'neighborhoods' | ...
```

2. **הוספת באדג' לתפריט:**
```typescript
{ key: 'allocations', label: 'שיבוצים', icon: ClipboardList, count: pendingAllocationGroups.length }
```

3. **סינון `todayAllocations` לסקשן overview:**
```typescript
const todayAllocations = useMemo(() => {
  const todayStr = format(new Date(), 'yyyy-MM-dd');
  return pendingAllocationGroups.filter(g => {
    const start = g.startDate;
    const end = g.endDate;
    return start === todayStr || end === todayStr || 
           (start <= todayStr && end >= todayStr);
  });
}, [pendingAllocationGroups]);
```

4. **סקשן `allocations` מלא:**
```typescript
{activeSection === 'allocations' && (
  <section>
    <h2>שיבוצים ממתינים</h2>
    {pendingAllocationGroups.map(group => (
      <PendingAllocationCard key={group.id} group={group} />
    ))}
  </section>
)}
```

### ב. Neighborhood.tsx - הוספת לוח שנה

1. **State חדש:**
```typescript
const [viewDate, setViewDate] = useState<Date>(new Date());
```

2. **חישוב הזמנות לתאריך:**
```typescript
const bookingsForDate = useMemo(() => {
  const dateStr = format(viewDate, 'yyyy-MM-dd');
  // 1. Neighborhood reservations
  const nReservations = Object.values(state.neighborhoodReservations || {})
    .filter(r => r.neighborhoodId === neighborhoodId && 
                 r.checkInDate <= dateStr && r.checkOutDate >= dateStr);
  // 2. Tent-level bookings
  const tentBookings = neighborhood.tentIds
    .map(id => state.tents[id])
    .filter(t => t.checkInDate && t.checkOutDate &&
                 t.checkInDate <= dateStr && t.checkOutDate >= dateStr);
  return { nReservations, tentBookings };
}, [state, viewDate, neighborhoodId]);
```

3. **רכיב בורר תאריך:**
- כפתורי ניווט: `<`, `>`, "היום"
- Popover עם Calendar

4. **רשימת הזמנות:**
- כרטיסים לכל קבוצה/הזמנה
- צבע לפי מגדר
- מספר אוהלים/מיטות

### ג. רכיבים חדשים

**NeighborhoodDatePicker.tsx:**
```typescript
interface Props {
  value: Date;
  onChange: (date: Date) => void;
}
// Popover עם Calendar + כפתורי ניווט
```

**NeighborhoodBookingsList.tsx:**
```typescript
interface Props {
  neighborhoodId: NeighborhoodId;
  date: Date;
}
// רשימת הזמנות/שיבוצים לתאריך
```

---

## תרגומים להוספה

```typescript
nav: {
  allocations: 'שיבוצים',
},
pages: {
  allAllocations: 'כל השיבוצים',
  todayAllocations: 'שיבוצים להיום',
},
messages: {
  noAllocationsToday: 'אין שיבוצים להיום',
  noAllocations: 'אין שיבוצים ממתינים',
},
neighborhood: {
  bookingsForDate: 'הזמנות לתאריך',
  noBookingsForDate: 'אין הזמנות לתאריך זה',
},
```

---

## תוצאות צפויות

1. **דשבורד:**
   - סקשן "שיבוצים להיום" מציג רק קבוצות שמגיעות/עוזבות/שוהות היום
   - טאב "שיבוצים" בתפריט עם באדג' אדום אם יש ממתינים

2. **טאב שיבוצים:**
   - רשימה מלאה של כל הקבוצות הממתינות לשיבוץ
   - קישור מהיר לעמוד שיבוץ

3. **תצוגת שכונה:**
   - בורר תאריך בחלק העליון
   - רשימת הזמנות/שיבוצים פעילים לתאריך הנבחר
   - העובד יכול לראות מה מתוכנן לעתיד

---

## הערות יישום

- שימוש ב-`date-fns` לחישובי תאריכים (כבר מותקן)
- שימוש ברכיבי UI קיימים: `Calendar`, `Popover`, `Button`, `Card`
- שמירה על עקרון "Minimal Change" - לא נוגעים בלוגיקות אחרות
- תמיכה ב-RTL כמו שאר האפליקציה

