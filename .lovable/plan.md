
## למה אתה עדיין לא רואה את זה (שורש הבעיה)
למרות שמצאנו את ה־ID הנכון של אוהל VIP לפי `code`, הסנכרון עדיין “נעלם” בגלל בעיית **דריסה (overwrite) של state** ב־`VillageContext`:

ב־`assignVIPConfig` אנחנו קוראים ברצף:
1) `updateTentGroupName(...)`
2) `updateTentDates(...)`
3) `updateTentGender(...)`

אבל ב־`VillageContext.tsx` הפונקציות האלה **לא משתמשות** ב־functional update (`saveState(prev => ...)`) אלא ב־`saveState({ ...state, ... })` עם `state` מה־closure.  
התוצאה: הקריאה האחרונה (בדרך כלל `updateTentGender`) שומרת “צילום” ישן של האוהל ומוחקת את השם/תאריכים שנכתבו רגע קודם. לכן:
- אין `groupName` / `checkInDate` / `checkOutDate` → אין “Reservation”
- במפה וברשת זה נראה כאילו כל האוהלים ריקים

בנוסף, גם אם יופיע שם הקבוצה, כרגע המיטות נשארות `FREE`, ולכן הרשת מראה `0/3` (מבלבל לעובדים).

---

## מה ניישם כדי שזה יוצג במפה וברשת (וגם “0/3” יהפוך ל־“3/3”)
### 1) תיקון דריסת state ב־VillageContext (הקריטי)
נעדכן ב־`src/context/VillageContext.tsx` את הפונקציות הבאות לעבוד עם `saveState(prev => ...)`:
- `updateTentGroupName`
- `updateTentDates`
- `updateTentGender`

כך כמה עדכונים רצופים לאוהל לא ימחקו אחד את השני.

בנוסף נשדרג את `updateTentDates` כדי לאפשר ניקוי תאריכים בצורה מפורשת:
- `undefined` = להשאיר כמו שהוא (התנהגות קיימת)
- `null` = לנקות (להפוך ל־`undefined`)

נעדכן גם את ה־types של הפונקציות ב־`VillageContextType` בהתאם.

### 2) לגרום לכך שהרשת/מפה תראה “בשימוש” באמת (מיטות RESERVED)
כדי שהעובדים יבינו מיד “האוהל תפוס” וגם שהרשת תציג `3/3` במקום `0/3`, נוסיף פעולה אטומית שמסמנת מיטות כ־`RESERVED` באוהל VIP שהוקצה.

נוסיף ב־`src/context/VillageContext.tsx` פונקציה חדשה (מינימלית וממוקדת) למשל:
- `setTentReservedBeds(tentId: string, reservedCount: number)`

היא תעשה functional `saveState(prev => ...)` ותעדכן **באותה שמירה**:
- `prev.tents[tentId].beds` (המערך בתוך האוהל)
- `prev.beds[bedId]` (מפת המיטות הגלובלית)

לוגיקה בטוחה:
- להפוך `FREE -> RESERVED` עבור N מיטות ראשונות (עד max beds)
- בהורדה/ניקוי: להפוך `RESERVED -> FREE` רק אם אין שם אורח (`guestName`) ורק אם הסטטוס הוא `RESERVED` (לא לגעת ב־`OCCUPIED/BLOCKED`)

### 3) עדכון useGroupAllocation כדי לסנכרן מלא (שם+תאריכים+מגדר+מיטות)
בקובץ `src/hooks/useGroupAllocation.ts`:
- ב־`assignVIPConfig` אחרי שמצאנו `actualTentId`:
  - `updateTentGroupName(actualTentId, group.groupName)`
  - `updateTentDates(actualTentId, group.startDate, group.endDate)`
  - `updateTentGender(actualTentId, ...)` לפי המגדר
  - `setTentReservedBeds(actualTentId, min(bedsBeingAssigned, tentBedsLength))`
- ב־`unassignVIPConfig`:
  - `updateTentGroupName(actualTentId, '')`
  - `updateTentDates(actualTentId, null, null)` כדי לנקות
  - `updateTentGender(actualTentId, undefined)` כדי לנקות
  - `setTentReservedBeds(actualTentId, 0)` כדי לשחרר (בצורה בטוחה)

### 4) “ריפוי” נתונים שכבר שובצו בעבר (כדי שלא תצטרך לשבץ מחדש)
כי כבר ביצעת שיבוצים לפני שהתיקון הזה קיים, נוסיף ב־`useGroupAllocation` `useEffect` קטן שמופעל כש־`state` ו־`groups` זמינים, ועובר על:
- כל `group.vipTentConfigs` עם `assignedTentCode`
- מוצא את אוהל ה־VIP בפועל לפי code
- אם האוהל חסר `groupName`/תאריכים (או נראה ריק) — משלים את השדות ומסמן מיטות `RESERVED`

האפקט יהיה “שמרני” כדי לא לדרוס מצב ידני:
- נעדכן רק אם האוהל ריק (`!tent.groupName && !tent.checkInDate && !tent.checkOutDate`) או אם הוא כבר שייך לאותה קבוצה אבל חסרים שדות.

---

## קבצים שנשנה
1) `src/context/VillageContext.tsx`
   - מעבר של `updateTentGroupName/updateTentDates/updateTentGender` ל־functional updates
   - שדרוג `updateTentDates` לתמוך ב־`null` לניקוי
   - הוספת `setTentReservedBeds` (עדכון מיטות אטומי)
   - עדכון `VillageContextType` (חתימות)

2) `src/hooks/useGroupAllocation.ts`
   - שימוש ב־`setTentReservedBeds`
   - ניקוי תאריכים עם `null` ב־unassign
   - הוספת `useEffect` “ריפוי” לסנכרון שיבוצים קיימים

---

## בדיקות קבלה (מה אתה אמור לראות אחרי הפרסום)
1) במסך השיבוץ (`/allocation/:id`):
   - שיבוץ אוהל VIP מצליח

2) בשכונת VIP (`/neighborhood/VIP`) ברשת:
   - על כרטיס האוהל מופיע שם הקבוצה ותאריכים
   - הספירה משתנה ל־`3/3` (או לפי התכנון עד המקסימום של האוהל)

3) בשכונת VIP במפה:
   - אוהלים משובצים צבועים לפי מגדר (כי יש Reservation פעיל)

4) בדשבורד (MiniMap VIP):
   - אוהלים משובצים מסומנים/צבועים בהתאם

5) רענון דף (F5):
   - הנתונים נשארים (נשמרו ב־LocalStorage)

---

## הערות בטיחות (Minimal change)
- אין שינוי במבנה LocalStorage או מפת הכפר.
- לא נוגעים בלוגיקות מפה/לוח שנה/Booking Engine מעבר לעדכון ממוקד של פעולות עדכון אוהל כדי למנוע דריסות.
- השינוי הוא ממוקד כדי ש־VIP allocation ייחשב “Reservation” לכל המערכת (רשת+מפה+קיבולת).

