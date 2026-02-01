import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY') || '';
const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') || '';

// Map plan IDs to Stripe Price IDs
// TODO: Replace these with your actual Stripe Price IDs from Stripe Dashboard
const PRICE_IDS: Record<string, string> = {
    monthly: 'price_1ShYJCP71kZZdhinWbnaDW4l',
    yearly: 'price_1ShYJgP71kZZdhingPiAbybL',
    lifetime: 'price_1ShYK4P71kZZdhinYC53Ajgj', // Replace with actual Price ID from Stripe (or use Payment Intent)
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
      );
    }

    const { planId } = await req.json();

    if (!planId) {
      return new Response(
        JSON.stringify({ error: 'Plan ID is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
      );
    }

    if (!stripeSecretKey) {
      return new Response(
        JSON.stringify({ error: 'Payment processing not configured' }),
        { status: 500, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
      );
    }

    const isLifetime = planId === 'lifetime';

    // Get or create Stripe customer
    let customerId: string;
    
    // Check if user already has a customer ID
    const { data: userData } = await supabase
      .from('users')
      .select('stripe_customer_id')
      .eq('id', user.id)
      .single();

    if (userData?.stripe_customer_id) {
      customerId = userData.stripe_customer_id;
      console.log('✅ Using existing customer:', customerId);
    } else {
      // Create new Stripe customer
      console.log('🆕 Creating new Stripe customer for user:', user.id);
      const customerResponse = await fetch('https://api.stripe.com/v1/customers', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${stripeSecretKey}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          'metadata[userId]': user.id,
        }),
      });

      const customer = await customerResponse.json();
      if (!customerResponse.ok) {
        console.error('❌ Failed to create customer:', customer);
        throw new Error(customer.error?.message || 'Failed to create customer');
      }

      customerId = customer.id;
      console.log('✅ Created new customer:', customerId);

      // Save customer ID to database
      const { error: updateError } = await supabase
        .from('users')
        .update({ stripe_customer_id: customerId })
        .eq('id', user.id);

      if (updateError) {
        console.warn('⚠️ Failed to save customer ID to database:', updateError);
        // Continue anyway - customer was created in Stripe
      }
    }

    if (isLifetime) {
      // For lifetime, fetch the Price to get the amount, then create a Payment Intent
      const priceId = PRICE_IDS[planId];
      
      if (!priceId || priceId.includes('YOUR_')) {
        return new Response(
          JSON.stringify({ error: `Price ID not configured for plan: ${planId}` }),
          { status: 400, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
        );
      }
      
      console.log('💳 Fetching Price for lifetime plan:', priceId);
      
      // Fetch the Price to get the amount
      const priceResponse = await fetch(`https://api.stripe.com/v1/prices/${priceId}`, {
        headers: { 'Authorization': `Bearer ${stripeSecretKey}` }
      });
      
      if (!priceResponse.ok) {
        const priceError = await priceResponse.json();
        throw new Error(priceError.error?.message || 'Failed to fetch price');
      }
      
      const price = await priceResponse.json();
      const amount = price.unit_amount; // Amount in cents
      
      console.log('💳 Creating one-time payment intent for lifetime plan, amount:', amount);
      
      const paymentIntentResponse = await fetch('https://api.stripe.com/v1/payment_intents', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${stripeSecretKey}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          amount: amount.toString(),
          currency: price.currency || 'usd',
          customer: customerId,
          'metadata[userId]': user.id,
          'metadata[planId]': planId,
        }),
      });

      const paymentIntent = await paymentIntentResponse.json();
      if (!paymentIntentResponse.ok) {
        console.error('❌ Failed to create payment intent:', paymentIntent);
        throw new Error(paymentIntent.error?.message || 'Failed to create payment intent');
      }

      console.log('✅ Payment intent created:', paymentIntent.id);

      return new Response(
        JSON.stringify({
          clientSecret: paymentIntent.client_secret,
          paymentIntentId: paymentIntent.id,
          type: 'payment_intent',
        }),
        { status: 200, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
      );
    } else {
      // For monthly/yearly, create a Subscription
      const priceId = PRICE_IDS[planId];
      
      if (!priceId || priceId.includes('YOUR_')) {
        return new Response(
          JSON.stringify({ error: `Price ID not configured for plan: ${planId}. Please set PRICE_IDS in the function.` }),
          { status: 400, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
        );
      }

      console.log('💳 Creating subscription for plan:', planId, 'with price:', priceId);

      // Build form-encoded body with nested parameters for Stripe API
      const formData = new URLSearchParams();
      formData.append('customer', customerId);
      formData.append('items[0][price]', priceId);
      formData.append('metadata[userId]', user.id);
      formData.append('metadata[planId]', planId);
      formData.append('payment_behavior', 'default_incomplete');
      formData.append('payment_settings[payment_method_types][0]', 'card');
      formData.append('expand[]', 'latest_invoice');
      formData.append('expand[]', 'latest_invoice.payment_intent');

      const subscriptionResponse = await fetch('https://api.stripe.com/v1/subscriptions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${stripeSecretKey}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData,
      });

      const subscription = await subscriptionResponse.json();
      if (!subscriptionResponse.ok) {
        console.error('❌ Failed to create subscription:', subscription);
        throw new Error(subscription.error?.message || 'Failed to create subscription');
      }

      console.log('✅ Subscription created:', subscription.id);
      console.log('📋 Subscription response structure:', {
        hasLatestInvoice: !!subscription.latest_invoice,
        latestInvoiceType: typeof subscription.latest_invoice,
        hasPaymentIntent: !!subscription.latest_invoice?.payment_intent,
      });

      // Try multiple ways to get the client secret
      let clientSecret: string | null = null;
      const invoice = subscription.latest_invoice;

      // Method 1: From expanded latest_invoice.payment_intent
      if (invoice?.payment_intent?.client_secret) {
        clientSecret = invoice.payment_intent.client_secret;
        console.log('✅ Found client_secret in latest_invoice.payment_intent');
      }
      // Method 1.5: PaymentIntent may be created separately by Stripe
      // Fetch invoice again to get the payment_intent that was just created
      else if (invoice && typeof invoice === 'object' && invoice.id) {
        const invoiceId = invoice.id;
        console.log('⏳ PaymentIntent may be created separately, fetching invoice...');
        
        // Fetch invoice with payment_intent expanded
        const invoiceFetchResponse = await fetch(`https://api.stripe.com/v1/invoices/${invoiceId}?expand[]=payment_intent`, {
          headers: {
            'Authorization': `Bearer ${stripeSecretKey}`,
          },
        });
        
        const fetchedInvoice = await invoiceFetchResponse.json();
        
        // Log what we got from the invoice
        console.log('📋 Fetched invoice details:', {
          id: fetchedInvoice.id,
          status: fetchedInvoice.status,
          hasPaymentIntent: !!fetchedInvoice.payment_intent,
          paymentIntentType: typeof fetchedInvoice.payment_intent,
          paymentIntentValue: fetchedInvoice.payment_intent,
        });
        
        if (fetchedInvoice.payment_intent?.client_secret) {
          clientSecret = fetchedInvoice.payment_intent.client_secret;
          console.log('✅ Found client_secret in fetched invoice');
        } else if (fetchedInvoice.payment_intent && typeof fetchedInvoice.payment_intent === 'string') {
          // PaymentIntent exists but not expanded, fetch it directly
          const paymentIntentId = fetchedInvoice.payment_intent;
          console.log('📥 Fetching PaymentIntent:', paymentIntentId);
          
          const paymentIntentResponse = await fetch(`https://api.stripe.com/v1/payment_intents/${paymentIntentId}`, {
            headers: { 'Authorization': `Bearer ${stripeSecretKey}` }
          });
          
          if (paymentIntentResponse.ok) {
            const paymentIntent = await paymentIntentResponse.json();
            if (paymentIntent.client_secret) {
              clientSecret = paymentIntent.client_secret;
              console.log('✅ Found client_secret in PaymentIntent');
            } else {
              console.error('❌ PaymentIntent has no client_secret:', paymentIntent);
            }
          } else {
            const error = await paymentIntentResponse.json();
            console.error('❌ Failed to fetch PaymentIntent:', error);
          }
        } else {
          console.warn('⚠️ Invoice has no payment_intent field or it is null');
          
          // PaymentIntent was created separately by Stripe but not linked to invoice
          // Find it by listing customer's recent PaymentIntents
          console.log('🔍 Searching for PaymentIntent for customer:', customerId);
          const invoiceAmount = fetchedInvoice.amount_due || fetchedInvoice.total || 0;
          
          const listPaymentIntentsResponse = await fetch(`https://api.stripe.com/v1/payment_intents?customer=${customerId}&limit=5`, {
            headers: { 'Authorization': `Bearer ${stripeSecretKey}` }
          });
          
          if (listPaymentIntentsResponse.ok) {
            const paymentIntentsList = await listPaymentIntentsResponse.json();
            console.log('📋 Found PaymentIntents:', paymentIntentsList.data?.length || 0);
            
            // Find the most recent PaymentIntent that matches the invoice amount
            const matchingPaymentIntent = paymentIntentsList.data?.find((pi: any) => 
              pi.amount === invoiceAmount && 
              pi.status === 'requires_payment_method' || pi.status === 'requires_confirmation'
            );
            
            if (matchingPaymentIntent) {
              console.log('✅ Found matching PaymentIntent:', matchingPaymentIntent.id);
              if (matchingPaymentIntent.client_secret) {
                clientSecret = matchingPaymentIntent.client_secret;
                console.log('✅ Using client_secret from matching PaymentIntent');
              }
            } else {
              console.warn('⚠️ No matching PaymentIntent found');
            }
          }
        }
      }
      
      // Method 2: Invoice exists but no payment_intent (fallback)
      if (!clientSecret && invoice && typeof invoice === 'object' && invoice.id) {
        const invoiceId = invoice.id;
        const invoiceStatus = invoice.status;
        console.log('📥 Invoice exists but no payment_intent. Invoice status:', invoiceStatus);
        
        // If invoice is draft, finalize it first
        if (invoiceStatus === 'draft') {
          console.log('📝 Invoice is draft, finalizing...');
          const finalizeResponse = await fetch(`https://api.stripe.com/v1/invoices/${invoiceId}/finalize`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${stripeSecretKey}`,
              'Content-Type': 'application/x-www-form-urlencoded',
            },
          });
          
          const finalizedInvoice = await finalizeResponse.json();
          
          if (!finalizeResponse.ok) {
            console.error('❌ Failed to finalize invoice:', finalizedInvoice);
            throw new Error(finalizedInvoice.error?.message || 'Failed to finalize invoice');
          }
          
          console.log('✅ Invoice finalized:', finalizedInvoice.id);
          
          // Fetch the finalized invoice with payment_intent expanded
          const invoiceFetchResponse = await fetch(`https://api.stripe.com/v1/invoices/${invoiceId}?expand[]=payment_intent`, {
            headers: {
              'Authorization': `Bearer ${stripeSecretKey}`,
            },
          });
          
          const invoiceWithPaymentIntent = await invoiceFetchResponse.json();
          
          if (invoiceWithPaymentIntent.payment_intent?.client_secret) {
            clientSecret = invoiceWithPaymentIntent.payment_intent.client_secret;
            console.log('✅ Found client_secret after finalizing invoice');
          }
        }
        
        // If invoice is finalized (open) but still no payment_intent
        if (!clientSecret && (invoiceStatus === 'open' || invoiceStatus === 'paid')) {
          console.log('💳 Invoice is finalized but no payment_intent.');
          
          // Check if subscription has pending_setup_intent (for subscriptions)
          if (subscription.pending_setup_intent) {
            console.log('📋 Found pending_setup_intent, fetching...');
            const setupIntentResponse = await fetch(`https://api.stripe.com/v1/setup_intents/${subscription.pending_setup_intent}`, {
              headers: { 'Authorization': `Bearer ${stripeSecretKey}` }
            });
            
            if (setupIntentResponse.ok) {
              const setupIntent = await setupIntentResponse.json();
              if (setupIntent.client_secret) {
                clientSecret = setupIntent.client_secret;
                console.log('✅ Found client_secret in pending_setup_intent');
              }
            }
          }
          
          // If still no client_secret, the invoice needs to be paid differently
          // This shouldn't happen, but if it does, we need to handle it
          if (!clientSecret) {
            console.error('❌ Invoice finalized but no payment method available');
            throw new Error('Unable to process payment. Please try again.');
          }
        }
        
        // If still no client_secret, try fetching invoice again
        if (!clientSecret) {
          const invoiceFetchResponse = await fetch(`https://api.stripe.com/v1/invoices/${invoiceId}?expand[]=payment_intent`, {
            headers: {
              'Authorization': `Bearer ${stripeSecretKey}`,
            },
          });
          const invoiceWithPaymentIntent = await invoiceFetchResponse.json();
          if (invoiceWithPaymentIntent.payment_intent?.client_secret) {
            clientSecret = invoiceWithPaymentIntent.payment_intent.client_secret;
            console.log('✅ Found client_secret in fetched invoice');
          }
        }
      }
      // Method 3: If latest_invoice is just an ID string, fetch it
      else if (typeof invoice === 'string') {
        console.log('📥 Fetching invoice:', invoice);
        
        // First fetch the invoice to check its status
        const invoiceFetchResponse = await fetch(`https://api.stripe.com/v1/invoices/${invoice}?expand[]=payment_intent`, {
          headers: {
            'Authorization': `Bearer ${stripeSecretKey}`,
          },
        });
        
        const fetchedInvoice = await invoiceFetchResponse.json();
        
        if (fetchedInvoice.payment_intent?.client_secret) {
          clientSecret = fetchedInvoice.payment_intent.client_secret;
          console.log('✅ Found client_secret in fetched invoice');
        } else if (fetchedInvoice.status === 'draft') {
          // Invoice is draft, finalize it
          console.log('📝 Invoice is draft, finalizing...');
          const finalizeResponse = await fetch(`https://api.stripe.com/v1/invoices/${invoice}/finalize`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${stripeSecretKey}`,
              'Content-Type': 'application/x-www-form-urlencoded',
            },
          });
          
          const finalizedInvoice = await finalizeResponse.json();
          
          if (finalizeResponse.ok && finalizedInvoice.payment_intent?.client_secret) {
            clientSecret = finalizedInvoice.payment_intent.client_secret;
            console.log('✅ Found client_secret after finalizing invoice');
          }
        } else if (fetchedInvoice.status === 'open' || fetchedInvoice.status === 'paid') {
          // Invoice is finalized but no payment_intent
          console.log('💳 Invoice is finalized but no payment_intent.');
          
          // Get subscription ID from invoice
          const invoiceSubscriptionId = fetchedInvoice.subscription;
          if (invoiceSubscriptionId && typeof invoiceSubscriptionId === 'string') {
            // Fetch subscription to check for pending_setup_intent
            const subResponse = await fetch(`https://api.stripe.com/v1/subscriptions/${invoiceSubscriptionId}`, {
              headers: { 'Authorization': `Bearer ${stripeSecretKey}` }
            });
            
            if (subResponse.ok) {
              const sub = await subResponse.json();
              if (sub.pending_setup_intent) {
                console.log('📋 Found pending_setup_intent, fetching...');
                const setupIntentResponse = await fetch(`https://api.stripe.com/v1/setup_intents/${sub.pending_setup_intent}`, {
                  headers: { 'Authorization': `Bearer ${stripeSecretKey}` }
                });
                
                if (setupIntentResponse.ok) {
                  const setupIntent = await setupIntentResponse.json();
                  if (setupIntent.client_secret) {
                    clientSecret = setupIntent.client_secret;
                    console.log('✅ Found client_secret in pending_setup_intent');
                  }
                }
              }
            }
          }
          
          // If still no client_secret, we can't proceed
          if (!clientSecret) {
            console.error('❌ Invoice finalized but no payment method available');
            throw new Error('Unable to process payment. Please try again.');
          }
        }
      }
      // Method 4: Check for confirmation_secret (newer Stripe API)
      else if (invoice?.confirmation_secret) {
        clientSecret = invoice.confirmation_secret;
        console.log('✅ Found confirmation_secret');
      }

      if (!clientSecret) {
        console.error('❌ No client secret found after all attempts');
        throw new Error('Failed to get client secret from subscription');
      }

      return new Response(
        JSON.stringify({
          clientSecret,
          subscriptionId: subscription.id,
          type: 'subscription',
        }),
        { status: 200, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
      );
    }
  } catch (error: any) {
    console.error('❌ Error in create-subscription:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
    );
  }
});

