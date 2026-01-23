-- Add subscription_cancel_at_period_end column to track if subscription will auto-renew
-- Run this in Supabase Dashboard → SQL Editor

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS subscription_cancel_at_period_end BOOLEAN DEFAULT FALSE;

-- Update existing premium users to have cancel_at_period_end = false (assuming they're active)
UPDATE users 
SET subscription_cancel_at_period_end = FALSE 
WHERE subscription_type = 'premium' AND subscription_cancel_at_period_end IS NULL;

-- Set to NULL for basic users (no subscription)
UPDATE users 
SET subscription_cancel_at_period_end = NULL 
WHERE subscription_type = 'basic';

