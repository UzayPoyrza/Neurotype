/**
 * User Service
 * Handles user profile and preferences
 */

import { supabase } from './supabase';

export interface UserProfile {
  id: string;
  email: string;
  first_name?: string;
  subscription_type: 'basic' | 'premium';
}

export interface UserPreferences {
  user_id: string;
  reminder_enabled: boolean;
  reminder_time?: string; // Format: "HH:MM" (24-hour format, e.g., "09:00" or "21:30")
  dark_theme_enabled?: boolean;
}

export interface SubscriptionData {
  subscription_type: 'basic' | 'premium';
  subscription_status: string | null;
  subscription_end_date: string | null;
  subscription_cancel_at: string | null;
}

export interface SubscriptionDetails {
  isPremium: boolean;
  isLifetime: boolean;
  cancelAt: string | null;
  endDate: string | null;
  status: string | null;
}

export interface UserConsentData {
  termsAcceptedAt: string; // ISO timestamp
  privacyAcceptedAt: string; // ISO timestamp
  healthDataPrivacyAcceptedAt: string; // ISO timestamp
}

/**
 * Get user profile
 * Includes 5-second timeout to prevent hanging
 */
export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  const timeoutMs = 5000; // 5 seconds for read operations
  
  const timeoutPromise = new Promise<UserProfile | null>((_, reject) => {
    setTimeout(() => {
      reject(new Error('getUserProfile timed out after 5 seconds'));
    }, timeoutMs);
  });

  const getProfilePromise = async (): Promise<UserProfile | null> => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        // PGRST116 means no rows found - this is expected when user doesn't exist yet
        if (error.code === 'PGRST116') {
          return null;
        }
        console.error('Error fetching user profile:', error);
        return null;
      }

      if (!data) {
        return null;
      }

      return {
        id: data.id,
        email: data.email,
        first_name: data.first_name || undefined,
        subscription_type: data.subscription_type as 'basic' | 'premium',
      };
    } catch (error) {
      console.error('Error in getUserProfile:', error);
      return null;
    }
  };

  try {
    const result = await Promise.race([getProfilePromise(), timeoutPromise]);
    return result;
  } catch (error: any) {
    console.error('❌ [getUserProfile] Timed out or failed:', error);
    return null; // Return null on timeout so createUserProfile can proceed
  }
}

/**
 * Get user preferences
 */
export async function getUserPreferences(userId: string): Promise<UserPreferences | null> {
  try {
    const { data, error } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error || !data) {
      // If no preferences exist, return defaults
      if (error?.code === 'PGRST116') {
        return {
          user_id: userId,
          reminder_enabled: false,
          reminder_time: undefined,
        };
      }
      console.error('Error fetching user preferences:', error);
      return null;
    }

    return {
      user_id: data.user_id,
      reminder_enabled: data.reminder_enabled,
      reminder_time: data.reminder_time || undefined,
      dark_theme_enabled: data.dark_theme_enabled ?? true,
    };
  } catch (error) {
    console.error('Error in getUserPreferences:', error);
    return null;
  }
}

/**
 * Update user preferences
 */
export async function updateUserPreferences(
  userId: string,
  preferences: Partial<Omit<UserPreferences, 'user_id'>>
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('user_preferences')
      .upsert({
        user_id: userId,
        ...preferences,
      });

    if (error) {
      console.error('Error updating user preferences:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error: any) {
    console.error('Error in updateUserPreferences:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Create user profile (called after authentication)
 * Includes 15-second timeout to prevent hanging
 */
export async function createUserProfile(
  userId: string,
  email: string,
  firstName?: string,
  consentData?: UserConsentData
): Promise<{ success: boolean; error?: string }> {
  const timeoutMs = 15000; // 15 seconds
  
  // Wrap the entire operation in a timeout
  const timeoutPromise = new Promise<{ success: boolean; error: string }>((_, reject) => {
    setTimeout(() => {
      reject(new Error('Profile creation timed out after 15 seconds'));
    }, timeoutMs);
  });

  const createProfilePromise = async (): Promise<{ success: boolean; error?: string }> => {
    try {
      // Check if user already exists
      console.log('🔵 [createUserProfile] Checking if user already exists:', userId);
      const existingProfile = await getUserProfile(userId);
      
      if (existingProfile) {
        // User already exists, return success
        console.log('✅ [createUserProfile] User already exists, skipping creation');
        return { success: true };
      }
      
      console.log('🔵 [createUserProfile] User does not exist, creating new profile...');

      // Create new user with basic subscription
      const { error } = await supabase
        .from('users')
        .insert({
          id: userId,
          email,
          first_name: firstName || null,
          subscription_type: 'basic', // New users start with basic subscription
        });

      if (error) {
        // If user already exists (race condition), that's okay
        if (error.code === '23505') {
          console.log('✅ [createUserProfile] User was created by another process (race condition)');
          return { success: true };
        }
        console.error('❌ [createUserProfile] Error creating user profile:', error);
        return { success: false, error: error.message };
      }

      console.log('✅ [createUserProfile] User profile created, creating default preferences...');

      // Create default preferences (non-critical, but handle errors properly)
      try {
        const { error: prefError } = await supabase.from('user_preferences').insert({
          user_id: userId,
        });
        
        if (prefError) {
          console.warn('⚠️ [createUserProfile] Failed to create default preferences (non-critical):', prefError);
          // Don't fail the entire operation if preferences creation fails
        } else {
          console.log('✅ [createUserProfile] Default preferences created');
        }
      } catch (prefError) {
        console.warn('⚠️ [createUserProfile] Exception creating default preferences (non-critical):', prefError);
        // Don't fail the entire operation if preferences creation fails
      }

      // Record user consents if provided
      if (consentData) {
        console.log('🔵 [createUserProfile] Recording user consents...');
        try {
          const consents = [
            {
              user_id: userId,
              consent_type: 'terms_of_service',
              accepted_at: consentData.termsAcceptedAt,
            },
            {
              user_id: userId,
              consent_type: 'privacy_policy',
              accepted_at: consentData.privacyAcceptedAt,
            },
            {
              user_id: userId,
              consent_type: 'consumer_health_data_privacy',
              accepted_at: consentData.healthDataPrivacyAcceptedAt,
            },
          ];

          const { error: consentError } = await supabase
            .from('user_consents')
            .insert(consents);

          if (consentError) {
            console.error('❌ [createUserProfile] Error recording user consents:', consentError);
            // Don't fail the entire operation if consent recording fails, but log it
            // This is important for compliance, so we should retry or handle it
          } else {
            console.log('✅ [createUserProfile] User consents recorded successfully');
          }
        } catch (consentError) {
          console.error('❌ [createUserProfile] Exception recording user consents:', consentError);
          // Don't fail the entire operation, but this should be addressed
        }
      } else {
        console.warn('⚠️ [createUserProfile] No consent data provided - consents not recorded');
      }

      console.log('✅ [createUserProfile] User profile creation completed successfully');
      return { success: true };
    } catch (error: any) {
      console.error('❌ [createUserProfile] Exception in profile creation:', error);
      return { success: false, error: error.message || 'Unknown error' };
    }
  };

  try {
    // Race between timeout and actual operation
    const result = await Promise.race([createProfilePromise(), timeoutPromise]);
    return result;
  } catch (error: any) {
    console.error('❌ [createUserProfile] Profile creation failed or timed out:', error);
      return { 
      success: false, 
      error: error.message || 'Profile creation timed out after 15 seconds' 
    };
  }
}

/**
 * Check if a user has valid premium subscription
 * This is the authoritative function to determine premium status
 * 
 * Validates:
 * - subscription_type === 'premium'
 * - For regular subscriptions: subscription_status === 'active' (or 'trialing')
 * - For lifetime subscriptions: subscription_status === null AND subscription_end_date is in the future
 * 
 * @param userId - User ID to check
 * @returns Promise<boolean> - true if user has valid premium subscription
 */
export async function isPremiumUser(userId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('subscription_type, subscription_status, subscription_end_date, subscription_cancel_at')
      .eq('id', userId)
      .single();

    if (error || !data) {
      console.warn('⚠️ [isPremiumUser] Could not fetch user subscription data:', error);
      return false;
    }

    return validatePremiumStatus(data as SubscriptionData);
  } catch (error) {
    console.error('❌ [isPremiumUser] Error checking premium status:', error);
    return false;
  }
}

/**
 * Validate premium status from subscription data
 * Can be used with already-fetched data to avoid extra database calls
 * 
 * Handles both regular subscriptions (with subscription_status) and lifetime subscriptions (subscription_status = null)
 * 
 * @param subscriptionData - Subscription data from database
 * @returns boolean - true if subscription is valid premium
 */
export function validatePremiumStatus(subscriptionData: SubscriptionData): boolean {
  const now = new Date();

  // 1. Must have premium subscription type
  if (subscriptionData.subscription_type !== 'premium') {
    return false;
  }

  // 2. Handle lifetime subscriptions (subscription_status is null)
  if (!subscriptionData.subscription_status) {
    // Lifetime subscription - validate end date is in the future
    if (subscriptionData.subscription_end_date) {
      const endDate = new Date(subscriptionData.subscription_end_date);
      return endDate > now;
    }
    // No end date = invalid lifetime subscription
    return false;
  }

  // 3. Handle regular subscriptions (subscription_status exists)
  // Status must be active or trialing
  const validStatuses = ['active', 'trialing'];
  if (!validStatuses.includes(subscriptionData.subscription_status)) {
    return false;
  }

  // For regular subscriptions, status check is sufficient
  // Stripe webhooks will update status when subscription expires/cancels
  return true;
}

/**
 * Get detailed subscription information for display purposes
 * 
 * @param userId - User ID to check
 * @returns Promise<SubscriptionDetails> - Detailed subscription information
 */
export async function getSubscriptionDetails(userId: string): Promise<SubscriptionDetails | null> {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('subscription_type, subscription_status, subscription_end_date, subscription_cancel_at')
      .eq('id', userId)
      .single();

    if (error || !data) {
      console.warn('⚠️ [getSubscriptionDetails] Could not fetch user subscription data:', error);
      return null;
    }

    const isPremium = validatePremiumStatus(data as SubscriptionData);
    const isLifetime = data.subscription_status === null && data.subscription_type === 'premium';

    return {
      isPremium,
      isLifetime,
      cancelAt: data.subscription_cancel_at,
      endDate: data.subscription_end_date,
      status: data.subscription_status,
    };
  } catch (error) {
    console.error('❌ [getSubscriptionDetails] Error fetching subscription details:', error);
    return null;
  }
}

/**
 * Create a delete or reset account request
 * This will be processed by a scheduled database function within 24 hours
 * 
 * @param userId - User ID
 * @param requestType - Either 'delete' or 'reset'
 * @returns Promise with success status and optional error message
 */
export async function createDeleteOrResetRequest(
  userId: string,
  requestType: 'delete' | 'reset'
): Promise<{ success: boolean; error?: string }> {
  try {
    console.log(`🔵 [createDeleteOrResetRequest] Creating ${requestType} request for user:`, userId);

    // Validate request type
    if (requestType !== 'delete' && requestType !== 'reset') {
      return { 
        success: false, 
        error: 'Invalid request type. Must be "delete" or "reset"' 
      };
    }

    // Check if user exists
    const userProfile = await getUserProfile(userId);
    if (!userProfile) {
      return { 
        success: false, 
        error: 'User not found' 
      };
    }

    // First, try to use the database function if it exists
    try {
      const { data, error } = await supabase.rpc('create_delete_or_reset_request', {
        p_user_id: userId,
        p_request_type: requestType,
      });

      if (!error) {
        console.log(`✅ [createDeleteOrResetRequest] ${requestType} request created via function. Request ID:`, data);
        return { success: true };
      }

      // If function doesn't exist (42883 error), fall back to direct insert
      if (error.code === '42883' || error.message?.includes('function') || error.message?.includes('does not exist')) {
        console.log('⚠️ [createDeleteOrResetRequest] Database function not found, using direct insert');
      } else {
        // Other error from function call
        console.error('❌ [createDeleteOrResetRequest] Error calling function:', error);
        return { 
          success: false, 
          error: error.message || 'Failed to create request' 
        };
      }
    } catch (rpcError: any) {
      // Function might not exist, fall through to direct insert
      if (rpcError.code === '42883' || rpcError.message?.includes('function') || rpcError.message?.includes('does not exist')) {
        console.log('⚠️ [createDeleteOrResetRequest] Database function not found, using direct insert');
      } else {
        throw rpcError;
      }
    }

    // Fallback: Direct insert into delete_or_reset table
    // Delete any existing pending request for this user first
    await supabase
      .from('delete_or_reset')
      .delete()
      .eq('user_id', userId)
      .eq('status', 'pending');

    // Insert new request
    const { data, error } = await supabase
      .from('delete_or_reset')
      .insert({
        user_id: userId,
        request_type: requestType,
        status: 'pending',
      })
      .select()
      .single();

    if (error) {
      console.error('❌ [createDeleteOrResetRequest] Error creating request:', error);
      return { 
        success: false, 
        error: error.message || 'Failed to create request' 
      };
    }

    console.log(`✅ [createDeleteOrResetRequest] ${requestType} request created successfully. Request ID:`, data?.id);
    return { success: true };
  } catch (error: any) {
    console.error('❌ [createDeleteOrResetRequest] Exception creating request:', error);
    return { 
      success: false, 
      error: error.message || 'An unexpected error occurred' 
    };
  }
}

