

# Changes: Universal Guest Form Link + Copy Button in Quotes Page

## What's changing

The guest form should NOT be per-group. Instead, it's a **single universal link** (`/guest-form`) that any new client can fill out with their group details. The admin gets the responses in the existing admin tab.

### 1. Remove `groupId` from the guest form route
- Change route from `/guest-form/:groupId` to `/guest-form`
- Update `GuestForm.tsx`: remove `useParams`, add a "group name" field the client fills in themselves
- The edge function `submit-guest-form` should no longer require/validate `group_id` from the `groups` table — instead accept `group_name` as a text field, and make `group_id` optional (auto-generate one or use the group name as identifier)

### 2. Add "שאלון לקוח" copy-link button in AdminQuotes
- In the list view actions area (line ~405), add a button next to "הצעה חדשה":
  ```
  שאלון לקוח 📋
  ```
- On click: copies the permanent link `{origin}/guest-form` to clipboard and shows a toast "הקישור הועתק!"

### 3. Simplify AdminGuestForms page
- Remove the "groups without forms" section (no longer per-group)
- Show all submissions as a list, each with the client-provided group name and color-coded status badges
- Keep the expandable detail view and "mark as reviewed" functionality

### 4. Update edge function
- Make `group_id` optional — generate a UUID if not provided
- Accept `group_name` as a required text field instead of validating against existing groups
- Remove the group existence check

### 5. Update database
- Make `group_id` column have a default value (auto-generated) so submissions without a pre-existing group work
- Or change `group_id` to nullable and add a `group_name` text column

### Files to edit

| File | Change |
|------|--------|
| `src/pages/GuestForm.tsx` | Remove `useParams`, add group name input field, update submission |
| `src/pages/AdminQuotes.tsx` | Add "שאלון לקוח" copy-link button next to new quote buttons |
| `src/pages/AdminGuestForms.tsx` | Remove per-group creation, show all submissions by client-provided name |
| `src/App.tsx` | Change route to `/guest-form` (no param) |
| `supabase/functions/submit-guest-form/index.ts` | Make group_id optional, accept group_name, remove group validation |
| DB migration | Make `group_id` have a default or nullable, ensure `group_name` field exists |

