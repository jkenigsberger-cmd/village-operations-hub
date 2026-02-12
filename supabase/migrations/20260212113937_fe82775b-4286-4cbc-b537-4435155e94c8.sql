
-- Step 1: Add new columns to activity_spaces (safe extension, no existing columns removed)
ALTER TABLE public.activity_spaces
  ADD COLUMN IF NOT EXISTS type TEXT,
  ADD COLUMN IF NOT EXISTS number INTEGER,
  ADD COLUMN IF NOT EXISTS display_name TEXT,
  ADD COLUMN IF NOT EXISTS capacity INTEGER,
  ADD COLUMN IF NOT EXISTS active BOOLEAN DEFAULT true;
