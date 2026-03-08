

# Pilot: Client Guest Form (שאלון לקוח)

## Overview
Build a public guest form that clients fill via a shareable link, with responses flowing into a new admin tab. The form header will use the **hador-haba-logo.png** (already in `src/assets/`) displayed exactly like the reference site — centered logo above the title.

## Implementation Steps

### 1. Database Migration
Create `guest_form_submissions` table with fields for client info, pax counts, dietary needs, tent notes, schedule notes, and a `status` column (`pending` | `sent` | `submitted` | `reviewed`). RLS: authenticated users get full CRUD via `has_role('admin')`. No public access (edge function handles public inserts).

### 2. Edge Function: `submit-guest-form`
- Add to `supabase/config.toml` with `verify_jwt = false`
- POST endpoint accepting `group_id` + form data
- Validates group exists, upserts into `guest_form_submissions` with status `submitted`
- CORS headers for public access

### 3. Public Form Page: `src/pages/GuestForm.tsx`
- Route: `/guest-form/:groupId` placed **outside** `<AuthGate>` in `App.tsx`
- Header: centered `hador-haba-logo.png` (same style as the reference screenshot — logo on top, title below, subtitle under that)
- 4-step wizard (RTL Hebrew):
  1. פרטי קבוצה (group details, pax, contact)
  2. העדפות מזון (dietary needs)
  3. חלוקת אוהלים (tent distribution notes)
  4. לוח פעילויות (schedule/activity notes)
- Progress bar + step indicators matching the reference design
- On submit → calls edge function → thank-you screen
- Footer: "בית הדור הבא · מקום לחוויות ישראליות"

### 4. Admin Page: `src/pages/AdminGuestForms.tsx`
- Route: `/admin/guest-forms`
- Add "שאלון לקוח" tab to `managementNavItems` in `AdminLayout.tsx` with `ClipboardList` icon
- Lists groups with color-coded status badges:
  - **Grey** — pending (form created, not sent)
  - **Blue** — link sent to client
  - **Green** — client submitted
  - **Orange** — admin reviewed
- "Create Form" button per group, "Copy Link" button (sets status to `sent`)
- Click submitted form → expandable view of client answers
- "Mark as Reviewed" button

### 5. Hook: `src/hooks/useGuestFormSubmissions.ts`
- CRUD operations for `guest_form_submissions`
- Used by both admin page and potentially the form page for pre-fill

### 6. Routing Changes in `App.tsx`
- Move `BrowserRouter` to wrap both public and auth-gated routes
- `/guest-form/:groupId` outside AuthGate
- `/admin/guest-forms` inside AuthGate

### Files Summary

| File | Action |
|------|--------|
| `supabase/migrations/...` | Create `guest_form_submissions` table + RLS |
| `supabase/config.toml` | Add `submit-guest-form` function config |
| `supabase/functions/submit-guest-form/index.ts` | Edge function |
| `src/pages/GuestForm.tsx` | Public multi-step form |
| `src/pages/AdminGuestForms.tsx` | Admin list + review |
| `src/hooks/useGuestFormSubmissions.ts` | Data hook |
| `src/components/AdminLayout.tsx` | Add nav tab |
| `src/App.tsx` | Add routes, restructure for public access |

