-- Add distribution_preference JSONB column to groups table for sleeping tent planning
ALTER TABLE groups 
ADD COLUMN IF NOT EXISTS distribution_preference JSONB DEFAULT NULL;