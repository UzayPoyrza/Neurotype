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
 */
export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error || !data) {
      console.error('Error fetching user profile:', error);
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
 */
export async function createUserProfile(
  userId: string,
  email: string,
  firstName?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('users')
      .insert({
        id: userId,
        email,
        first_name: firstName || null,
      });

    if (error) {
      // If user already exists, that's okay
      if (error.code === '23505') {
        return { success: true };
      }
      console.error('Error creating user profile:', error);
      return { success: false, error: error.message };
    }

    // Create default preferences
    await supabase.from('user_preferences').insert({
      user_id: userId,
    });

    return { success: true };
  } catch (error: any) {
    console.error('Error in createUserProfile:', error);
    return { success: false, error: error.message };
  }
}

