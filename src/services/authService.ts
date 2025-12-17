import * as AppleAuthentication from 'expo-apple-authentication';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
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
    // Always use neurotype:// for dev builds and production
    const redirectUri = AuthSession.makeRedirectUri({
      scheme: 'neurotype',
      path: 'auth/callback',
    });

    console.log('🔵 Google OAuth redirect URI:', redirectUri);

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectUri,
        skipBrowserRedirect: true, // We'll handle opening the browser ourselves
      },
    });

    if (error) {
      console.error('❌ Supabase OAuth error:', error);
      return { success: false, error: error.message };
    }

    if (!data?.url) {
      console.error('❌ No OAuth URL returned from Supabase');
      return { success: false, error: 'Failed to get OAuth URL' };
    }

    console.log('🔵 OAuth URL generated, opening browser...');
    console.log('🔵 Full OAuth URL:', data.url);
    console.log('🔵 Redirect URI:', redirectUri);

    // Validate URL before opening
    try {
      new URL(data.url);
      console.log('✅ OAuth URL is valid');
    } catch (urlError) {
      console.error('❌ Invalid OAuth URL:', urlError);
      return { success: false, error: 'Invalid OAuth URL generated' };
    }

    // Manually open the browser with the OAuth URL
    console.log('🔵 Opening browser with URL...');
    let result;
    try {
      result = await WebBrowser.openAuthSessionAsync(data.url, redirectUri);
    } catch (browserError: any) {
      console.error('❌ Error opening browser:', browserError);
      return { success: false, error: browserError.message || 'Failed to open browser' };
    }

    console.log('🔵 Browser result type:', result.type);
    if (result.type === 'success' && result.url) {
      console.log('🔵 Redirect URL received:', result.url.substring(0, 100) + '...');
    }

    if (result.type === 'cancel') {
      return { success: false, error: 'Sign in cancelled' };
    }

    if (result.type === 'dismiss') {
      return { success: false, error: 'Sign in dismissed' };
    }

    // If success, the auth state listener will handle the rest
    // The URL contains the auth code/token that Supabase will process
    if (result.type === 'success' && result.url) {
      console.log('🔵 OAuth redirect received, processing...');
      // The redirect URL contains the auth code - Supabase will process it
      // The auth state listener will pick up the session change
      return { success: true };
    }

    return { success: false, error: 'Unexpected browser result' };
  } catch (error: any) {
    console.error('❌ Google sign in error:', error);
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

