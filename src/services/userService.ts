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
        };
      }
      console.error('Error fetching user preferences:', error);
      return null;
    }

    return {
      user_id: data.user_id,
      reminder_enabled: data.reminder_enabled,
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
  firstName?: string
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

