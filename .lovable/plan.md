

# Generate Database Architecture PDF

## What
Create a downloadable PDF document containing the complete database architecture of this project.

## Content (already gathered)
1. **22 Tables** — each with all columns, data types, defaults, and relationships
2. **14 Custom Enums** — allocation_type, app_role, bed_status, bed_type, cleaning_status, facility_gender, facility_type, meal_location, meal_type, reservation_type, task_status, task_type, tent_gender, working_status
3. **6 Database Functions** — has_role, is_allowed_email, handle_new_user, cleanup_stale_vip_tents, create_activity_reservation_safe, update_updated_at_column
4. **3 Edge Functions** — verify-password, submit-guest-form, get-quote-for-form
5. **RLS Policies Summary** — standard pattern + exceptions
6. **Auth & Roles** — allowlist, role assignment, profile sync

## Implementation
Run a Python script using reportlab to generate a formatted PDF to `/mnt/documents/Database_Architecture.pdf`. The script is already written and ready to execute.

## Output
A single professional PDF document, downloadable from the Files panel.

