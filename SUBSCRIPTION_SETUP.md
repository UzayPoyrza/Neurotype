# Stripe Subscriptions Setup Guide

## Overview

The Neurotype app uses Stripe for subscription management with support for monthly, yearly, and lifetime plans. Payments are processed through Supabase Edge Functions for security.

## Step 1: Create Stripe Products & Prices

1. Go to [Stripe Dashboard → Products](https://dashboard.stripe.com/test/products)
2. Create 3 products:

### Monthly Plan
- **Name**: "Monthly Subscription"
- **Description**: "Monthly premium access"
- **Pricing**: 
  - Type: Recurring
  - Price: $9.99
  - Billing period: Monthly
- **Copy the Price ID** (starts with `price_`)

### Yearly Plan
- **Name**: "Yearly Subscription"
- **Description**: "Yearly premium access"
- **Pricing**:
  - Type: Recurring
  - Price: $79.99
  - Billing period: Yearly
- **Copy the Price ID** (starts with `price_`)

### Lifetime Plan
- **Name**: "Lifetime Subscription"
- **Description**: "One-time lifetime access"
- **Pricing**:
  - Type: One-time
  - Price: $199.99
- **Copy the Price ID** (starts with `price_`) - Note: Lifetime will use Payment Intent, but you can still create a price

## Step 2: Update Edge Function with Price IDs

1. Open `supabase/functions/create-subscription/index.ts`
2. Find the `PRICE_IDS` object (around line 10)
3. Replace the placeholder values with your actual Price IDs:

```typescript
const PRICE_IDS: Record<string, string> = {
  monthly: 'price_YOUR_MONTHLY_PRICE_ID',
  yearly: 'price_YOUR_YEARLY_PRICE_ID',
  lifetime: 'price_YOUR_LIFETIME_PRICE_ID', // Optional for lifetime
};
```

**Important**: Replace `YOUR_MONTHLY_PRICE_ID`, `YOUR_YEARLY_PRICE_ID`, and `YOUR_LIFETIME_PRICE_ID` with your actual Stripe Price IDs.

## Step 3: Update Database Schema

Run these SQL commands in Supabase Dashboard → SQL Editor:

```sql
-- Add subscription tracking columns (if not already added)
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT,
ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS cancel_at_period_end BOOLEAN DEFAULT FALSE;

-- Fix existing basic users (set subscription_status to NULL)
UPDATE users 
SET subscription_status = NULL 
WHERE subscription_type = 'basic';

-- Set premium users to 'active' (if they have subscriptions)
UPDATE users 
SET subscription_status = 'active' 
WHERE subscription_type = 'premium' AND subscription_status IS NULL;
```

## Step 4: Deploy Edge Functions

Deploy the Supabase Edge Functions:

```bash
# Get your project reference from Supabase Dashboard
# Replace YOUR_PROJECT_REF with your actual project reference

# Deploy the subscription function
supabase functions deploy create-subscription --project-ref YOUR_PROJECT_REF

# Deploy the payment intent function
supabase functions deploy create-payment-intent --project-ref YOUR_PROJECT_REF

# Deploy the portal session function
supabase functions deploy create-portal-session --project-ref YOUR_PROJECT_REF

# Deploy the webhook handler
supabase functions deploy stripe-webhook --project-ref YOUR_PROJECT_REF
```

## Step 5: Configure Stripe Webhook

1. Go to [Stripe Dashboard → Webhooks](https://dashboard.stripe.com/test/webhooks)
2. Click "Add endpoint" or edit existing endpoint
3. Set the endpoint URL to: `https://YOUR_PROJECT_REF.supabase.co/functions/v1/stripe-webhook`
4. Add these events:
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `charge.refunded`
5. Copy the webhook signing secret
6. Add the secret to your Supabase Edge Function environment variables

## Step 6: Set Environment Variables

In Supabase Dashboard → Edge Functions → Settings:

1. Add `STRIPE_SECRET_KEY` - Your Stripe secret key
2. Add `STRIPE_WEBHOOK_SECRET` - Your webhook signing secret (from Step 5)

## Step 7: Update App Environment Variables

In your app's `.env` file:

```bash
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
```

## Step 8: Test the Flow

### Test Monthly Plan
1. Open app → Profile → Subscription
2. Select Monthly plan
3. Complete payment
4. Verify:
   - Subscription created in Stripe Dashboard
   - User subscription_status updated to 'active'
   - User subscription_type updated to 'premium'
   - Subscription auto-renews monthly

### Test Yearly Plan
1. Select Yearly plan
2. Complete payment
3. Verify:
   - Subscription created in Stripe Dashboard
   - User subscription_status updated to 'active'
   - Subscription auto-renews yearly

### Test Lifetime Plan
1. Select Lifetime plan
2. Complete payment
3. Verify:
   - Payment Intent created in Stripe Dashboard
   - User subscription_type updated to 'premium'
   - User subscription_status set appropriately
   - No recurring subscription created

## How It Works

### Monthly/Yearly Plans (Recurring)
1. User selects plan → App calls `create-subscription` Edge Function
2. Edge Function creates Stripe Customer (if needed)
3. Edge Function creates Stripe Subscription
4. User completes payment → Stripe processes payment
5. `customer.subscription.created` webhook → Updates user in database
6. Monthly/Yearly renewal → `invoice.payment_succeeded` webhook → Maintains subscription
7. Subscription canceled → `customer.subscription.deleted` webhook → Updates user status

### Lifetime Plan (One-Time)
1. User selects plan → App calls `create-payment-intent` Edge Function
2. Edge Function creates Stripe Customer (if needed)
3. Edge Function creates Payment Intent
4. User completes payment → Stripe processes payment
5. `payment_intent.succeeded` webhook → Updates user to premium
6. No renewals (one-time payment)

### Subscription Management
- Users can manage subscriptions via Stripe Customer Portal
- Portal session created via `create-portal-session` Edge Function
- Cancellations handled via webhook events
- `cancel_at_period_end` flag tracks scheduled cancellations

## Database Schema

The subscription system uses these fields in the `users` table:

- `subscription_type`: 'basic' | 'premium'
- `subscription_status`: 'active' | 'canceled' | 'past_due' | null
- `stripe_customer_id`: Stripe customer ID
- `stripe_subscription_id`: Stripe subscription ID (for recurring plans)
- `cancel_at_period_end`: Boolean indicating if subscription will cancel at period end

## Troubleshooting

### "Price ID not configured" error
- Make sure you updated `PRICE_IDS` in `create-subscription/index.ts`
- Verify Price IDs in Stripe Dashboard
- Check that Price IDs are active (not archived)

### Subscription not created
- Check Supabase Edge Function logs
- Verify Stripe API key is correct in Edge Function environment
- Check customer creation succeeded
- Verify webhook is configured correctly

### Webhook not receiving subscription events
- Verify events are added in Stripe Dashboard
- Check webhook endpoint URL is correct
- Verify `STRIPE_WEBHOOK_SECRET` is set in Edge Function environment
- Check webhook signing in Stripe Dashboard

### Payment fails
- Verify Stripe publishable key is correct in app
- Check test mode vs production mode keys match
- Verify card details are correct (use Stripe test cards)
- Check Edge Function logs for errors

### User not upgraded to premium
- Check webhook is receiving events
- Verify webhook handler is updating user correctly
- Check database for subscription_status updates
- Verify RLS policies allow updates

## Testing with Stripe Test Cards

Use Stripe test cards for testing:
- **Success**: `4242 4242 4242 4242`
- **Decline**: `4000 0000 0000 0002`
- **3D Secure**: `4000 0025 0000 3155`

See [Stripe Test Cards](https://stripe.com/docs/testing) for more options.

## Production Checklist

Before going to production:

- [ ] Update Price IDs to production prices
- [ ] Switch Stripe keys to production keys
- [ ] Update webhook endpoint to production URL
- [ ] Test all subscription flows in production mode
- [ ] Set up monitoring for webhook events
- [ ] Configure email receipts in Stripe
- [ ] Set up subscription cancellation emails
- [ ] Test subscription renewal flows
- [ ] Verify customer portal works correctly
- [ ] Set up error alerting

## Support

For issues:
1. Check Supabase Edge Function logs
2. Check Stripe Dashboard for payment/subscription status
3. Review webhook event logs in Stripe Dashboard
4. Check app logs for errors
5. Verify environment variables are set correctly
