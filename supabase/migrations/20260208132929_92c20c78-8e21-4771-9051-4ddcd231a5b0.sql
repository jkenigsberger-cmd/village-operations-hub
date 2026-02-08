-- Add source and group_id columns to kitchen_time_slots for idempotent sync
ALTER TABLE kitchen_time_slots 
ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'manual',
ADD COLUMN IF NOT EXISTS group_id TEXT;