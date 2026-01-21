/**
 * Payment Service
 * Handles Stripe payment processing via Supabase Edge Functions
 */

import { supabase } from './supabase';

export interface CreatePaymentIntentParams {
  amount: number;
  currency?: string;
  planId: string;
}

export interface PaymentIntentResponse {
  clientSecret: string;
  paymentIntentId: string;
}

/**
 * Create a payment intent via Supabase Edge Function
 * This function calls the Supabase Edge Function which creates a Stripe Payment Intent
 */
export async function createPaymentIntent(
  params: CreatePaymentIntentParams
): Promise<PaymentIntentResponse> {
  try {
    // Get current session to authenticate the request
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session) {
      throw new Error('Not authenticated. Please log in to continue.');
    }

    // Validate input parameters
    if (!params.amount || params.amount <= 0) {
      throw new Error('Invalid amount');
    }

    if (!params.planId) {
      throw new Error('Plan ID is required');
    }

    console.log('💳 Creating payment intent:', {
      amount: params.amount,
      currency: params.currency || 'usd',
      planId: params.planId,
    });

    // Call Supabase Edge Function
    const { data, error } = await supabase.functions.invoke('create-payment-intent', {
      body: {
        amount: params.amount,
        currency: params.currency || 'usd',
        planId: params.planId,
      },
    });

    if (error) {
      console.error('❌ Error calling payment intent function:', error);
      throw new Error(error.message || 'Failed to create payment intent');
    }

    if (!data || !data.clientSecret) {
      throw new Error('Invalid response from payment server');
    }

    console.log('✅ Payment intent created successfully:', data.paymentIntentId);

    return {
      clientSecret: data.clientSecret,
      paymentIntentId: data.paymentIntentId,
    };
  } catch (error: any) {
    console.error('❌ Error in createPaymentIntent:', error);
    throw error;
  }
}

/**
 * Update user subscription after successful payment
 * This updates the subscription_type in the users table to 'premium'
 */
export async function updateUserSubscription(
  userId: string,
  subscriptionType: 'premium'
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!userId) {
      return { success: false, error: 'User ID is required' };
    }

    console.log('🔄 Updating user subscription:', { userId, subscriptionType });

    const { error } = await supabase
      .from('users')
      .update({ subscription_type: subscriptionType })
      .eq('id', userId);

    if (error) {
      console.error('❌ Error updating subscription:', error);
      return { success: false, error: error.message };
    }

    console.log('✅ Subscription updated successfully');
    return { success: true };
  } catch (error: any) {
    console.error('❌ Error in updateUserSubscription:', error);
    return { success: false, error: error.message || 'Unknown error' };
  }
}

