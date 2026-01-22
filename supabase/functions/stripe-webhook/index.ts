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
        const subscriptionId = metadata.subscriptionId || paymentIntent.metadata?.subscriptionId;

        if (!userId) {
          console.error('❌ No userId in payment intent metadata');
          return new Response(
            JSON.stringify({ error: 'Missing userId' }),
            { status: 400 }
          );
        }

        console.log('✅ Payment succeeded, updating subscription:', { userId, planId, subscriptionId });

        // If this is a subscription payment, update subscription fields
        if (subscriptionId) {
          // Fetch subscription to get current status and customer ID
          const subscriptionResponse = await fetch(`https://api.stripe.com/v1/subscriptions/${subscriptionId}`, {
            headers: { 'Authorization': `Bearer ${stripeSecretKey}` }
          });

          if (subscriptionResponse.ok) {
            const subscription = await subscriptionResponse.json();
            
            // If subscription status is "incomplete" but payment succeeded, 
            // it means the invoice needs to be paid. Update status to "active"
            let finalStatus = subscription.status;
            if (subscription.status === 'incomplete' || subscription.status === 'incomplete_expired') {
              // Payment succeeded, so subscription should be active
              finalStatus = 'active';
              console.log('🔄 Updating subscription status from incomplete to active');
            }
            
            // Convert current_period_end (Unix timestamp) to ISO string for database
            const subscriptionEndDate = subscription.current_period_end 
              ? new Date(subscription.current_period_end * 1000).toISOString()
              : null;
            
            const { error: updateError } = await supabase
              .from('users')
              .update({
                subscription_type: 'premium',
                stripe_subscription_id: subscriptionId,
                subscription_status: finalStatus,
                stripe_customer_id: subscription.customer,
                subscription_end_date: subscriptionEndDate,
              })
              .eq('id', userId);

            if (updateError) {
              console.error('❌ Error updating subscription:', updateError);
              return new Response(
                JSON.stringify({ error: 'Failed to update subscription' }),
                { status: 500 }
              );
            }

            console.log('✅ Subscription updated successfully via webhook (with subscription ID)');
          } else {
            // Fallback: update without fetching subscription
            console.warn('⚠️ Could not fetch subscription, using fallback update');
            const { error: updateError } = await supabase
              .from('users')
              .update({
                subscription_type: 'premium',
                stripe_subscription_id: subscriptionId,
                subscription_status: 'active',
              })
              .eq('id', userId);

            if (updateError) {
              console.error('❌ Error updating subscription:', updateError);
              return new Response(
                JSON.stringify({ error: 'Failed to update subscription' }),
                { status: 500 }
              );
            }

            console.log('✅ Subscription updated successfully via webhook (fallback)');
          }
        } else {
          // One-time payment (lifetime plan)
          // Set end date to 20 years from now
          const twentyYearsFromNow = new Date();
          twentyYearsFromNow.setFullYear(twentyYearsFromNow.getFullYear() + 20);
          const subscriptionEndDate = twentyYearsFromNow.toISOString();
          
          // Get customer ID from payment intent if available
          const customerId = paymentIntent.customer;
          
          const updateData: any = {
            subscription_type: 'premium',
            subscription_end_date: subscriptionEndDate,
            stripe_subscription_id: null, // Explicitly set to null for lifetime
            subscription_status: null, // No subscription status for lifetime
          };
          
          if (customerId) {
            updateData.stripe_customer_id = customerId;
          }
          
          const { error: updateError } = await supabase
            .from('users')
            .update(updateData)
            .eq('id', userId);

          if (updateError) {
            console.error('❌ Error updating subscription:', updateError);
            return new Response(
              JSON.stringify({ error: 'Failed to update subscription' }),
              { status: 500 }
            );
          }

          console.log('✅ Lifetime payment processed, subscription set to 20 years from now');
        }
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

      case 'customer.subscription.created': {
        const subscription = event.data.object;
        const userId = subscription.metadata?.userId;

        if (!userId) {
          console.error('❌ No userId in subscription metadata');
          break;
        }

        console.log('✅ Subscription created, updating user:', { userId, subscriptionId: subscription.id });

        const subscriptionEndDate = subscription.current_period_end 
          ? new Date(subscription.current_period_end * 1000).toISOString()
          : null;

        const { error: updateError } = await supabase
          .from('users')
          .update({
            subscription_type: 'premium',
            stripe_subscription_id: subscription.id,
            subscription_status: subscription.status,
            subscription_end_date: subscriptionEndDate,
          })
          .eq('id', userId);

        if (updateError) {
          console.error('❌ Error updating subscription:', updateError);
        } else {
          console.log('✅ Subscription created and user updated successfully');
        }
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object;
        const subscriptionId = invoice.subscription;

        if (!subscriptionId) {
          // One-time payment (lifetime plan)
          const paymentIntentId = invoice.payment_intent;
          if (paymentIntentId) {
            console.log('💳 One-time payment succeeded (lifetime plan):', paymentIntentId);
            
            // Fetch payment intent to get metadata
            const paymentIntentResponse = await fetch(`https://api.stripe.com/v1/payment_intents/${paymentIntentId}`, {
              headers: { 'Authorization': `Bearer ${stripeSecretKey}` }
            });
            
            if (paymentIntentResponse.ok) {
              const paymentIntent = await paymentIntentResponse.json();
              const userId = paymentIntent.metadata?.userId;
              
              if (userId) {
                console.log('✅ Lifetime payment succeeded, updating user:', userId);
                const { error } = await supabase
                  .from('users')
                  .update({ subscription_type: 'premium' })
                  .eq('id', userId);
                
                if (error) {
                  console.error('❌ Error updating subscription:', error);
                } else {
                  console.log('✅ User updated successfully');
                }
              }
            }
          }
          break;
        }

        // Recurring subscription payment
        console.log('💳 Subscription payment succeeded:', subscriptionId);
        
        const subscriptionResponse = await fetch(`https://api.stripe.com/v1/subscriptions/${subscriptionId}`, {
          headers: { 'Authorization': `Bearer ${stripeSecretKey}` }
        });

        if (!subscriptionResponse.ok) {
          console.error('❌ Failed to fetch subscription:', subscriptionId);
          break;
        }

        const subscription = await subscriptionResponse.json();
        const userId = subscription.metadata?.userId;

        if (userId) {
          console.log('✅ Subscription payment succeeded, updating user:', userId);
          
          const subscriptionEndDate = subscription.current_period_end 
            ? new Date(subscription.current_period_end * 1000).toISOString()
            : null;
          
          console.log('📅 Subscription end date:', {
            current_period_end: subscription.current_period_end,
            converted: subscriptionEndDate,
          });
          
          const { error } = await supabase
            .from('users')
            .update({
              subscription_type: 'premium',
              stripe_subscription_id: subscriptionId,
              subscription_status: 'active',
              stripe_customer_id: subscription.customer,
              subscription_end_date: subscriptionEndDate,
            })
            .eq('id', userId);

          if (error) {
            console.error('❌ Error updating subscription:', error);
          } else {
            console.log('✅ Subscription renewed successfully');
          }
        }
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object;
        const userId = subscription.metadata?.userId;

        if (userId) {
          console.log('🔄 Subscription updated:', { userId, status: subscription.status });

          const subscriptionEndDate = subscription.current_period_end 
            ? new Date(subscription.current_period_end * 1000).toISOString()
            : null;
          
          console.log('📅 Subscription end date:', {
            current_period_end: subscription.current_period_end,
            converted: subscriptionEndDate,
          });

          const { error } = await supabase
            .from('users')
            .update({
              subscription_status: subscription.status,
              subscription_type: subscription.status === 'active' ? 'premium' : 'basic',
              stripe_subscription_id: subscription.id,
              stripe_customer_id: subscription.customer,
              subscription_end_date: subscriptionEndDate,
            })
            .eq('id', userId);

          if (error) {
            console.error('❌ Error updating subscription:', error);
          } else {
            console.log('✅ Subscription status updated successfully');
          }
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        const userId = subscription.metadata?.userId;

        if (userId) {
          console.log('🔄 Subscription canceled, downgrading user:', userId);
          
          const { error } = await supabase
            .from('users')
            .update({
              subscription_type: 'basic',
              subscription_status: 'canceled',
              stripe_subscription_id: null,
            })
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