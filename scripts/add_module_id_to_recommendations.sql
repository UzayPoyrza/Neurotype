-- Add module_id column to daily_recommendations table
-- Run this in your Supabase SQL Editor

-- Add the module_id column
ALTER TABLE daily_recommendations 
ADD COLUMN IF NOT EXISTS module_id TEXT;

-- Update existing rows to have a default module_id (anxiety) if they're null
-- This is a safety measure for any existing data
UPDATE daily_recommendations 
SET module_id = 'anxiety' 
WHERE module_id IS NULL;

-- Drop ALL old unique constraints that don't include module_id
-- First, find and drop the constraint on (user_id, recommendation_date, session_id)
ALTER TABLE daily_recommendations 
DROP CONSTRAINT IF EXISTS daily_recommendations_user_id_recommendation_date_session_id_key;

ALTER TABLE daily_recommendations 
DROP CONSTRAINT IF EXISTS daily_recommendations_user_id_recommendation_date_session_i_key;

-- Drop constraint on (user_id, recommendation_date, display_order) if it exists
ALTER TABLE daily_recommendations 
DROP CONSTRAINT IF EXISTS daily_recommendations_user_id_recommendation_date_display_o_key;

-- Drop any other potential old constraints
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT constraint_name 
        FROM information_schema.table_constraints 
        WHERE table_name = 'daily_recommendations' 
        AND constraint_type = 'UNIQUE'
        AND constraint_name NOT LIKE '%module%'
    ) LOOP
        EXECUTE 'ALTER TABLE daily_recommendations DROP CONSTRAINT IF EXISTS ' || quote_ident(r.constraint_name);
    END LOOP;
END $$;

-- Drop the new constraint if it already exists (in case of re-running)
ALTER TABLE daily_recommendations 
DROP CONSTRAINT IF EXISTS daily_recommendations_user_module_date_session_key;

-- Add new unique constraint with module_id
ALTER TABLE daily_recommendations 
ADD CONSTRAINT daily_recommendations_user_module_date_session_key 
UNIQUE (user_id, module_id, recommendation_date, session_id);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_daily_recommendations_user_module_date 
ON daily_recommendations(user_id, module_id, recommendation_date);

-- Verify the column was added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'daily_recommendations' 
AND column_name = 'module_id';

