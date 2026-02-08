-- Add group_type column to groups table
ALTER TABLE public.groups 
ADD COLUMN group_type text NOT NULL DEFAULT 'לינה';