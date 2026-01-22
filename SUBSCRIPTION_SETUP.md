# Stripe Subscriptions Setup Guide

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
  monthly: 'price_1ShYJCP71kZZdhinWbnaDW4l',
  yearly: 'price_1ShYJgP71kZZdhingPiAbybL',
  lifetime: 'price_1ShYK4P71kZZdhinYC53Ajgj', // Optional for lifetime
};
```

## Step 3: Update Database Schema

Run these SQL commands in Supabase Dashboard → SQL Editor:

```sql
-- Add subscription tracking columns (if not already added)
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT,
ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT NULL;

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

```bash
# Deploy the new subscription function
supabase functions deploy create-subscription --project-ref uwevibncyrfudcfhcuux

# Redeploy webhook with subscription event handlers
supabase functions deploy stripe-webhook --project-ref uwevibncyrfudcfhcuux
```

## Step 5: Update Stripe Webhook Configuration

1. Go to [Stripe Dashboard → Webhooks](https://dashboard.stripe.com/test/webhooks)
2. Click on your webhook endpoint
3. Click "Add events"
4. Add these events:
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
5. Keep existing events:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `charge.refunded`

## Step 6: Test the Flow

1. Test Monthly Plan:
   - Should create a subscription
   - Should auto-renew monthly
   - Check Stripe Dashboard → Subscriptions

2. Test Yearly Plan:
   - Should create a subscription
   - Should auto-renew yearly
   - Check Stripe Dashboard → Subscriptions

3. Test Lifetime Plan:
   - Should create a one-time Payment Intent
   - Should not create a subscription
   - Check Stripe Dashboard → Payments

## How It Works

### Monthly/Yearly Plans (Recurring)
1. User pays → Creates Stripe Subscription
2. First payment succeeds → `customer.subscription.created` webhook
3. Monthly/Yearly renewal → `invoice.payment_succeeded` webhook
4. Subscription canceled → `customer.subscription.deleted` webhook

### Lifetime Plan (One-Time)
1. User pays → Creates Payment Intent
2. Payment succeeds → `payment_intent.succeeded` webhook
3. No renewals (one-time payment)

## Troubleshooting

### "Price ID not configured" error
- Make sure you updated `PRICE_IDS` in `create-subscription/index.ts`
- Verify Price IDs in Stripe Dashboard

### Subscription not created
- Check Supabase Edge Function logs
- Verify Stripe API key is correct
- Check customer creation succeeded

### Webhook not receiving subscription events
- Verify events are added in Stripe Dashboard
- Check webhook endpoint URL is correct
- Verify JWT is disabled for webhook function

