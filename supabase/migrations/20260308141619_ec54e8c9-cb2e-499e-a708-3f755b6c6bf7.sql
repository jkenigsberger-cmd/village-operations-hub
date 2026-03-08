
-- Make group_id nullable and add group_name column
ALTER TABLE public.guest_form_submissions ALTER COLUMN group_id DROP NOT NULL;
ALTER TABLE public.guest_form_submissions ALTER COLUMN group_id SET DEFAULT gen_random_uuid()::text;
ALTER TABLE public.guest_form_submissions ADD COLUMN group_name text;

-- Drop the unique index on group_id since multiple submissions can now share or have null group_id
DROP INDEX IF EXISTS idx_guest_form_submissions_group_id;
