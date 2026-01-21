import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY') || '';
const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET') || '';
const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'stripe-signature, content-type',
      },
    });
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    const signature = req.headers.get('stripe-signature');
    if (!signature) {
      console.error('❌ No Stripe signature found');
      return new Response(
        JSON.stringify({ error: 'No signature' }),
        { status: 400 }
      );
    }

    const body = await req.text();
    const event = JSON.parse(body);

    console.log('📥 Webhook received:', event.type, event.id);

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    switch (event.type) {
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object;
        let metadata = {};
        
        if (typeof paymentIntent.metadata === 'string') {
          try {
            metadata = JSON.parse(paymentIntent.metadata);
          } catch {
            metadata = paymentIntent.metadata;
          }
        } else {
          metadata = paymentIntent.metadata;
        }

        const userId = metadata.userId || paymentIntent.metadata?.userId;
        const planId = metadata.planId || paymentIntent.metadata?.planId;

        if (!userId) {
          console.error('❌ No userId in payment intent metadata');
          return new Response(
            JSON.stringify({ error: 'Missing userId' }),
            { status: 400 }
          );
        }

        console.log('✅ Payment succeeded, updating subscription:', { userId, planId });

        const { error: updateError } = await supabase
          .from('users')
          .update({ subscription_type: 'premium' })
          .eq('id', userId);

        if (updateError) {
          console.error('❌ Error updating subscription:', updateError);
          return new Response(
            JSON.stringify({ error: 'Failed to update subscription' }),
            { status: 500 }
          );
        }

        console.log('✅ Subscription updated successfully via webhook');
        break;
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object;
        console.log('❌ Payment failed:', paymentIntent.id);
        break;
      }

      case 'charge.refunded': {
        const charge = event.data.object;
        let metadata = {};
        
        if (typeof charge.metadata === 'string') {
          try {
            metadata = JSON.parse(charge.metadata);
          } catch {
            metadata = charge.metadata;
          }
        } else {
          metadata = charge.metadata;
        }

        const userId = metadata.userId || charge.metadata?.userId;

        if (userId) {
          console.log('🔄 Refund processed, downgrading user:', userId);
          
          const { error } = await supabase
            .from('users')
            .update({ subscription_type: 'basic' })
            .eq('id', userId);

          if (error) {
            console.error('❌ Error downgrading subscription:', error);
          } else {
            console.log('✅ User downgraded successfully');
          }
        }
        break;
      }

      default:
        console.log('ℹ️ Unhandled event type:', event.type);
    }

    return new Response(
      JSON.stringify({ received: true }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('❌ Webhook error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }
});