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
            
            // Extract cancel_at timestamp
            const cancelAt = subscription.cancel_at 
              ? new Date(subscription.cancel_at * 1000).toISOString()
              : null;
            
            // Note: current_period_end extraction removed - handled by customer.subscription.updated
            const { error: updateError } = await supabase
              .from('users')
              .update({
                subscription_type: 'premium',
                stripe_subscription_id: subscriptionId,
                subscription_status: finalStatus,
                stripe_customer_id: subscription.customer,
                subscription_cancel_at: cancelAt,
                // subscription_end_date will be set by customer.subscription.updated event
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

        // Extract cancel_at timestamp
        const cancelAt = subscription.cancel_at 
          ? new Date(subscription.cancel_at * 1000).toISOString()
          : null;

        // Note: current_period_end extraction removed - handled by customer.subscription.updated
        const { error: updateError } = await supabase
          .from('users')
          .update({
            subscription_type: 'premium',
            stripe_subscription_id: subscription.id,
            subscription_status: subscription.status,
            stripe_customer_id: subscription.customer,
            subscription_cancel_at: cancelAt,
            // subscription_end_date will be set by customer.subscription.updated event
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

        console.log('📋 Invoice payment succeeded details:', {
          invoiceId: invoice.id,
          amount: invoice.amount_paid,
          subscriptionId: subscriptionId,
          subscriptionIdType: typeof subscriptionId,
          hasPaymentIntent: !!invoice.payment_intent,
        });

        if (!subscriptionId) {
          // Invoice doesn't have subscriptionId - check PaymentIntent metadata
          const paymentIntentId = invoice.payment_intent;
          if (paymentIntentId) {
            console.log('💳 Invoice has no subscriptionId, checking PaymentIntent metadata:', paymentIntentId);
            
            // Fetch payment intent to get metadata
            const paymentIntentResponse = await fetch(`https://api.stripe.com/v1/payment_intents/${paymentIntentId}`, {
              headers: { 'Authorization': `Bearer ${stripeSecretKey}` }
            });
            
            if (paymentIntentResponse.ok) {
              const paymentIntent = await paymentIntentResponse.json();
              const userId = paymentIntent.metadata?.userId;
              const subscriptionIdFromMetadata = paymentIntent.metadata?.subscriptionId;
              
              // If PaymentIntent has subscriptionId in metadata, it's a subscription payment
              if (subscriptionIdFromMetadata) {
                console.log('💳 Found subscriptionId in PaymentIntent metadata:', subscriptionIdFromMetadata);
                
                // Fetch subscription to get current_period_end
                const subscriptionResponse = await fetch(`https://api.stripe.com/v1/subscriptions/${subscriptionIdFromMetadata}`, {
                  headers: { 'Authorization': `Bearer ${stripeSecretKey}` }
                });
                
                if (subscriptionResponse.ok) {
                  const subscription = await subscriptionResponse.json();
                  
                  console.log('📋 Subscription details from PaymentIntent metadata:', {
                    subscriptionId: subscription.id,
                    status: subscription.status,
                    current_period_end: subscription.current_period_end,
                    userId: subscription.metadata?.userId || userId,
                  });
                  
                  const finalUserId = subscription.metadata?.userId || userId;
                  
                  if (finalUserId) {
                    // Extract cancel_at timestamp
                    const cancelAt = subscription.cancel_at 
                      ? new Date(subscription.cancel_at * 1000).toISOString()
                      : null;
                    
                    // Note: current_period_end extraction removed - handled by customer.subscription.updated
                    const { error } = await supabase
                      .from('users')
                      .update({
                        subscription_type: 'premium',
                        stripe_subscription_id: subscriptionIdFromMetadata,
                        subscription_status: subscription.status || 'active',
                        stripe_customer_id: subscription.customer,
                        subscription_cancel_at: cancelAt,
                        // subscription_end_date will be set by customer.subscription.updated event
                      })
                      .eq('id', finalUserId);
                    
                    if (error) {
                      console.error('❌ Error updating subscription:', error);
                    } else {
                      console.log('✅ Subscription payment succeeded and user updated successfully');
                    }
                  }
                }
              } else {
                // One-time payment (lifetime plan)
                console.log('💳 One-time payment succeeded (lifetime plan):', paymentIntentId);
                
                if (userId) {
                  // Set end date to 20 years from now for lifetime
                  const twentyYearsFromNow = new Date();
                  twentyYearsFromNow.setFullYear(twentyYearsFromNow.getFullYear() + 20);
                  const subscriptionEndDate = twentyYearsFromNow.toISOString();
                  
                  const customerId = paymentIntent.customer;
                  
                  const updateData: any = {
                    subscription_type: 'premium',
                    subscription_end_date: subscriptionEndDate,
                    stripe_subscription_id: null,
                    subscription_status: null,
                  };
                  
                  if (customerId) {
                    updateData.stripe_customer_id = customerId;
                  }
                  
                  const { error } = await supabase
                    .from('users')
                    .update(updateData)
                    .eq('id', userId);
                  
                  if (error) {
                    console.error('❌ Error updating subscription:', error);
                  } else {
                    console.log('✅ Lifetime payment processed, subscription set to 20 years from now');
                  }
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

        console.log('📋 Subscription details from invoice.payment_succeeded:', {
          subscriptionId: subscription.id,
          status: subscription.status,
          current_period_end: subscription.current_period_end,
          hasMetadata: !!subscription.metadata,
          metadata: subscription.metadata,
          userId: userId,
        });

        if (userId) {
          console.log('✅ Subscription payment succeeded, updating user:', userId);
          
          // Extract cancel_at timestamp
          const cancelAt = subscription.cancel_at 
            ? new Date(subscription.cancel_at * 1000).toISOString()
            : null;
          
          // Note: current_period_end extraction removed - handled by customer.subscription.updated
          const { error } = await supabase
            .from('users')
            .update({
              subscription_type: 'premium',
              stripe_subscription_id: subscriptionId,
              subscription_status: 'active',
              stripe_customer_id: subscription.customer,
              subscription_cancel_at: cancelAt,
              // subscription_end_date will be set by customer.subscription.updated event
            })
            .eq('id', userId);

          if (error) {
            console.error('❌ Error updating subscription:', error);
          } else {
            console.log('✅ Subscription payment succeeded and user updated successfully');
          }
        } else {
          console.warn('⚠️ No userId found in subscription metadata, cannot update user');
        }
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object;
        let userId = subscription.metadata?.userId;

        // Comprehensive logging for debugging
        console.log('🔍 customer.subscription.updated - Full subscription object keys:', Object.keys(subscription));
        console.log('🔍 Subscription metadata:', subscription.metadata);
        console.log('🔍 userId from metadata:', userId);
        console.log('🔍 current_period_end exists at root:', 'current_period_end' in subscription);
        console.log('🔍 current_period_end value at root:', subscription.current_period_end);
        console.log('🔍 items.data[0]?.current_period_end:', subscription.items?.data?.[0]?.current_period_end);
        console.log('🔍 cancel_at:', subscription.cancel_at);
        console.log('🔍 subscription.id:', subscription.id);

        // If userId not in metadata, try to look it up by subscription_id
        if (!userId) {
          console.log('⚠️ No userId in subscription metadata, looking up by subscription_id');
          const { data: userData } = await supabase
            .from('users')
            .select('id')
            .eq('stripe_subscription_id', subscription.id)
            .single();
          
          userId = userData?.id;
          console.log('🔍 userId from database lookup:', userId);
        }

        if (userId) {
          console.log('🔄 Subscription updated:', { userId, status: subscription.status });

          // Extract current_period_end - check both root level and items array (for flexible billing)
          let currentPeriodEnd = subscription.current_period_end;
          
          // If not at root level, check in items.data[0] (for flexible billing subscriptions)
          if (!currentPeriodEnd && subscription.items?.data?.[0]?.current_period_end) {
            currentPeriodEnd = subscription.items.data[0].current_period_end;
            console.log('✅ Found current_period_end in items.data[0]:', currentPeriodEnd);
          }
          
          const subscriptionEndDate = currentPeriodEnd 
            ? new Date(currentPeriodEnd * 1000).toISOString()
            : null;
          
          console.log('📅 Subscription end date extraction:', {
            current_period_end: currentPeriodEnd,
            current_period_end_type: typeof currentPeriodEnd,
            converted: subscriptionEndDate,
            isNull: subscriptionEndDate === null,
          });

          // Extract cancel_at timestamp to track scheduled cancellation
          const cancelAt = subscription.cancel_at 
            ? new Date(subscription.cancel_at * 1000).toISOString()
            : null;
          
          console.log('📋 Subscription cancellation status:', {
            cancel_at: cancelAt,
            will_renew: cancelAt === null,
          });

          const { data: updateData, error } = await supabase
            .from('users')
            .update({
              subscription_status: subscription.status,
              subscription_type: subscription.status === 'active' ? 'premium' : 'basic',
              stripe_subscription_id: subscription.id,
              stripe_customer_id: subscription.customer,
              subscription_end_date: subscriptionEndDate,
              subscription_cancel_at: cancelAt,
            })
            .eq('id', userId)
            .select();

          if (error) {
            console.error('❌ Error updating subscription:', error);
          } else {
            console.log('✅ Subscription status updated successfully');
            console.log('✅ Updated user data:', updateData);
            console.log('✅ subscription_end_date saved:', updateData?.[0]?.subscription_end_date);
            console.log('✅ subscription_cancel_at saved:', updateData?.[0]?.subscription_cancel_at);
          }
        } else {
          console.error('❌ Could not find userId for subscription:', subscription.id);
          console.error('❌ Subscription metadata:', subscription.metadata);
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