

# Role-Based Access Control with Google Sign-In

## Overview

Replace the shared password gate with Google OAuth (managed by Lovable Cloud). Access is invite-only by email. Six power users get admin permissions; all other invited users get viewer (partial edit) permissions.

## Power Users (Admin Role)

| Name | Email |
|------|-------|
| Jonatan | jkenigsberger@gmail.com |
| Adi | Adi@keren-hador.com |
| Gali | gali@keren-hador.com |
| Danielle | danielle@keren-hador.com |
| Shahaf | shahaf@glow-glamping.com |
| Shelly | shelly@glow-glamping.com |

## Implementation Steps

### 1. Configure Google OAuth
- Use the Lovable Cloud social auth tool to enable Google sign-in
- This generates the `@lovable.dev/cloud-auth-js` package and integration files automatically

### 2. Database Migration

**New enum:**
- `app_role` with values `admin`, `viewer`

**New tables:**

`allowed_users` -- whitelist of invited emails
- `id` (uuid, PK)
- `email` (text, unique, not null)
- `invited_by` (uuid, nullable)
- `created_at` (timestamptz)

`user_roles` -- role per user
- `id` (uuid, PK)
- `user_id` (uuid, references auth.users on delete cascade)
- `role` (app_role, not null)
- unique on (user_id, role)

`profiles` -- display info
- `id` (uuid, PK, references auth.users on delete cascade)
- `email` (text)
- `display_name` (text, nullable)
- `avatar_url` (text, nullable)
- `created_at` (timestamptz)

**Security definer functions:**
- `has_role(uuid, app_role)` -- check user role without RLS recursion
- `is_allowed_email(text)` -- check if email is in allowed_users

**Trigger on auth.users insert:**
- Auto-create profile
- Auto-assign role: admin if email matches one of the 6 power users, otherwise viewer

**Seed data:**
- Insert the 6 emails into `allowed_users`

### 3. RLS Policy Updates

All 17 existing tables will be updated from the current open `USING (true)` to:

- **SELECT**: any authenticated user
- **INSERT / DELETE**: admin only (`has_role(auth.uid(), 'admin')`)
- **UPDATE**: admin only, except for "operational" columns

Operational updates allowed for viewers:
- `tents`: cleaning_status, cleaning_assigned_to, maintenance notes/images
- `facilities`: cleaning_status, working_status, maintenance notes/images
- `activity_spaces`: cleaning_status, working_status, maintenance notes/images
- `daily_tasks`: status, completed_at, assigned_to
- `beds`: status, guest_name

New tables (`allowed_users`, `user_roles`, `profiles`):
- SELECT: authenticated
- INSERT/UPDATE/DELETE: admin only (profiles: users can update their own row)

### 4. New Files

- `src/hooks/useAuth.ts` -- hook returning `{ user, role, isLoading, signOut }`
- `src/components/AuthGate.tsx` -- replaces PasswordGate; shows Google sign-in or "access denied"
- `src/pages/UserManagement.tsx` -- admin page: invite users by email, remove users, change roles

### 5. Modified Files

- `src/App.tsx` -- swap PasswordGate for AuthGate, add `/admin/users` route
- `src/pages/Settings.tsx` -- add user management link (admin only)
- `src/pages/Index.tsx` -- hide create/delete actions for viewers
- `src/components/AdminLayout.tsx` -- add user management nav item for admins
- Various admin pages (AdminGroups, AdminGroupEdit, AdminIncome, AdminExpenses, AdminOutsourced, AdminQuotes) -- disable edit/delete buttons for viewers

### 6. Removed Files

- `src/components/PasswordGate.tsx`
- `supabase/functions/verify-password/index.ts`

### 7. Role-Based UI Permissions

| Feature | Admin | Viewer |
|---------|-------|--------|
| View all pages | Yes | Yes |
| Update cleaning/maintenance status | Yes | Yes |
| Report issues | Yes | Yes |
| Update task status | Yes | Yes |
| Create/edit/delete groups | Yes | No |
| Manage allocations | Yes | No |
| Finance (income/expenses/outsourced) | Yes | No |
| Quotes (create/edit/delete) | Yes | No |
| Invite/remove users | Yes | No |
| Change user roles | Yes | No |

### 8. Implementation Order

1. Configure Google OAuth (tool call)
2. Create database tables, functions, triggers, seed data (migration)
3. Update RLS policies on all 17 tables + new tables (migration)
4. Build `useAuth` hook
5. Build `AuthGate` component (with logo + Google sign-in button)
6. Build `UserManagement` page
7. Update `App.tsx` routing
8. Add role-based UI guards across admin pages
9. Remove PasswordGate and verify-password edge function

