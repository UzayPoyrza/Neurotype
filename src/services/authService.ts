import * as AppleAuthentication from 'expo-apple-authentication';
import * as AuthSession from 'expo-auth-session';
import { Platform } from 'react-native';
import { supabase } from './supabase';
import { createUserProfile } from './userService';

/**
 * Sign in with Apple
 */
export async function signInWithApple(): Promise<{
  success: boolean;
  userId?: string;
  error?: string;
}> {
  try {
    if (Platform.OS !== 'ios') {
      return { success: false, error: 'Apple Sign In is only available on iOS' };
    }

    const credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
    });

    if (!credential.identityToken) {
      return { success: false, error: 'No identity token received' };
    }

    // Sign in with Supabase using the identity token
    const { data, error } = await supabase.auth.signInWithIdToken({
      provider: 'apple',
      token: credential.identityToken,
      nonce: credential.nonce,
    });

    if (error || !data.user) {
      return { success: false, error: error?.message || 'Authentication failed' };
    }

    // Create or update user profile
    const email = credential.email || data.user.email || '';
    const firstName = credential.fullName?.givenName || undefined;
    
    await createUserProfile(data.user.id, email, firstName);

    return {
      success: true,
      userId: data.user.id,
    };
  } catch (error: any) {
    if (error.code === 'ERR_REQUEST_CANCELED') {
      return { success: false, error: 'Sign in cancelled' };
    }
    console.error('Apple sign in error:', error);
    return { success: false, error: error.message || 'Failed to sign in with Apple' };
  }
}

/**
 * Sign in with Google
 */
export async function signInWithGoogle(): Promise<{
  success: boolean;
  userId?: string;
  error?: string;
}> {
  try {
    const redirectUri = AuthSession.makeRedirectUri({
      scheme: 'neurotype',
      path: 'auth/callback',
    });

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectUri,
      },
    });

    if (error) {
      return { success: false, error: error.message };
    }

    // OAuth will redirect back to app - handled by auth state listener
    return { success: true };
  } catch (error: any) {
    console.error('Google sign in error:', error);
    return { success: false, error: error.message || 'Failed to sign in with Google' };
  }
}

/**
 * Sign out
 */
export async function signOut(): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Get current session
 */
export async function getCurrentSession(): Promise<{
  userId: string | null;
  email: string | null;
}> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      return { userId: null, email: null };
    }
    return {
      userId: session.user.id,
      email: session.user.email || null,
    };
  } catch (error) {
    console.error('Error getting session:', error);
    return { userId: null, email: null };
  }
}

