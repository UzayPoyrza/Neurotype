import { initStripe } from '@stripe/stripe-react-native';

const stripePublishableKey = process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY || '';

if (!stripePublishableKey) {
  console.warn(
    'Stripe Publishable Key is not configured. Please set EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY in your .env file.'
  );
}

/**
 * Initialize Stripe
 * Call this in App.tsx before rendering payment components
 */
export async function initializeStripe(): Promise<{ success: boolean; error?: string }> {
  try {
    if (!stripePublishableKey) {
      return { success: false, error: 'Stripe publishable key is missing' };
    }

    if (!stripePublishableKey.startsWith('pk_')) {
      return { success: false, error: 'Invalid Stripe publishable key format' };
    }

    await initStripe({
      publishableKey: stripePublishableKey,
      merchantIdentifier: 'merchant.com.anonymous.Neurotype', // Optional: for Apple Pay
      setReturnUrlSchemeOnAndroid: true, // Required for Android
    });

    console.log('✅ Stripe initialized successfully');
    return { success: true };
  } catch (error: any) {
    console.error('❌ Failed to initialize Stripe:', error);
    return { success: false, error: error.message || 'Unknown error' };
  }
}

export { stripePublishableKey };

