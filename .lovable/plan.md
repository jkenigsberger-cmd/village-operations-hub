
# Rename "הגדרות" to "הנהלה-הזמנות"

## What will change

The Settings button and page title will be renamed from "הגדרות" (Settings) to "הנהלה-הזמנות" (Management-Bookings) across the entire app.

## Technical Details

### 1. Update translation strings

**File: `src/lib/translations.ts`**

| Key | Before | After |
|-----|--------|-------|
| `nav.settings` | `'הגדרות'` | `'הנהלה-הזמנות'` |
| `pages.settings` | `'הגדרות'` | `'הנהלה-הזמנות'` |
| `pages.settingsData` | `'הגדרות ונתונים'` | `'הנהלה-הזמנות'` |

### 2. Update hardcoded breadcrumb

**File: `src/components/AdminLayout.tsx`** (line 35)

Change the breadcrumb label from `'הגדרות'` to `'הנהלה-הזמנות'`.

No other files need changes since `Index.tsx` and `Settings.tsx` already reference `HE.nav.settings` and `HE.pages.settingsData` from translations.
