

# Redesign Guest Form to Match Reference Layout

## What Changes

Redesign `src/pages/GuestForm.tsx` to match the reference form's cleaner, more spacious, professional layout while keeping all existing fields and submission logic intact.

## Key Differences (Current vs Reference)

| Aspect | Current | Reference (Target) |
|--------|---------|---------------------|
| Background | Warm beige `#faf7f2` | Clean white/light gray |
| Title | "שאלון הכנה לאירוח" | "שאלון הכנה לקבוצה מתארחת" |
| Subtitle | "מלאו את הפרטים..." | "נא למלא את כל הפרטים לפני ההגעה" |
| Header bar | None | Blue accent line below header |
| Stepper | Small circles, beige palette | Larger numbered circles with labels always visible, blue active color |
| Progress bar | Beige/gold | Blue |
| Card section title | Inside card, plain | Inside card with orange/gold underline accent |
| Form layout | Single column, cramped | 2-column grid for paired fields (name+pax, type+contact) |
| Step 1 fields | Many fields (org, email, boys/girls) | Simplified: group name, pax, type, contact name, phone |
| Buttons | Gold "הבא" / "הקודם" | Blue "← הבא" and disabled gray "הקודם ←" with arrows |
| Card width | `max-w-lg` | Wider `max-w-2xl` |

## Changes — Single File: `src/pages/GuestForm.tsx`

### 1. Visual Overhaul
- Background: change to `bg-white` or `bg-gray-50`
- Add a blue accent bar (`bg-blue-600 h-1`) below the header
- Stepper circles: larger (`w-10 h-10`), blue active color (`bg-blue-600`), always show step labels (remove `hidden md:block`)
- Progress bar: blue instead of gold
- Card: wider (`max-w-2xl`), white bg, subtle shadow, section title with orange underline accent
- Buttons: blue primary (`bg-blue-600`), outlined gray for "הקודם", add arrow icons (← →)

### 2. Step 1 Layout Simplification
- Use 2-column grid for paired fields: שם הקבוצה + מס׳ משתתפים, אפיון קבוצה + שם איש הקשר
- Phone field full width
- Remove email/org/staff/boys/girls from step 1 — move email and org to step 4 as optional, keep boys/girls in step 1 but as a collapsible "פירוט נוסף" section
- **Alternative**: Keep all fields but reorganize into 2-column grid rows matching the reference's spacing

### 3. Step Labels
- Rename step 4 from "לוח זמנים והערות" to "לוח פעילויות" to match reference

### 4. Footer
- Keep "בית הדור הבא · מקום לחוויות ישראליות" centered below card

### No Backend Changes
- All form fields, submission logic, and edge function call remain identical
- Only visual/layout changes in the single component file

