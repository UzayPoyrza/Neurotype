-- Create Test User for Development
-- Run this SQL in your Supabase SQL Editor to create the test user manually
-- This bypasses RLS policies when run from the SQL Editor

-- Create the test user
INSERT INTO users (id, email, first_name, subscription_type)
VALUES ('00000000-0000-0000-0000-000000000001', 'test@neurotype.dev', 'Test User', 'premium')
ON CONFLICT (id) DO NOTHING;

-- Create default preferences for test user
INSERT INTO user_preferences (user_id, reminder_enabled)
VALUES ('00000000-0000-0000-0000-000000000001', false)
ON CONFLICT (user_id) DO NOTHING;

-- Verify the user was created
SELECT * FROM users WHERE id = '00000000-0000-0000-0000-000000000001';

