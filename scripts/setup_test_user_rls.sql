-- Optional: Allow test user creation from client (for development only)
-- This creates an RLS policy that allows inserting the test user
-- WARNING: Only use this in development! Remove or restrict in production.

-- Policy to allow inserting the test user
CREATE POLICY "Allow test user creation"
ON users
FOR INSERT
TO anon
WITH CHECK (id = '00000000-0000-0000-0000-000000000001');

-- Policy to allow inserting test user preferences
CREATE POLICY "Allow test user preferences creation"
ON user_preferences
FOR INSERT
TO anon
WITH CHECK (user_id = '00000000-0000-0000-0000-000000000001');

-- Note: You may need to drop existing policies first if they conflict
-- DROP POLICY IF EXISTS "Allow test user creation" ON users;
-- DROP POLICY IF EXISTS "Allow test user preferences creation" ON user_preferences;

