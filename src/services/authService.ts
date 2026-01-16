import * as AppleAuthentication from 'expo-apple-authentication';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { Platform, Alert } from 'react-native';
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
      // Note: nonce is optional and may not be available in all credential types
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

    // If success, process the redirect URL and create user profile
    if (result.type === 'success' && result.url) {
      console.log('🔵 OAuth redirect received, processing...');
      console.log('🔵 Full redirect URL:', result.url);
      
      // Parse the redirect URL - check both query params and hash fragments
      let code: string | null = null;
      let error: string | null = null;
      let errorDescription: string | null = null;
      
      try {
        const url = new URL(result.url);
        
        // Check query parameters first
        code = url.searchParams.get('code');
        error = url.searchParams.get('error');
        errorDescription = url.searchParams.get('error_description');
        
        // If no code in query params, check hash fragment
        if (!code && url.hash) {
          const hashParams = new URLSearchParams(url.hash.substring(1)); // Remove the #
          code = hashParams.get('code');
          error = hashParams.get('error') || error;
          errorDescription = hashParams.get('error_description') || errorDescription;
        }
        
        // Also check if the code is directly in the path or as a fragment parameter
        if (!code) {
          // Try parsing the entire URL as a Supabase redirect
          // Supabase redirects might have format: neurotype://auth/callback#access_token=...&code=...
          const match = result.url.match(/[#&]code=([^&]+)/);
          if (match) {
            code = decodeURIComponent(match[1]);
          }
        }
      } catch (urlError) {
        console.error('❌ Error parsing redirect URL:', urlError);
        // Try to extract code using regex as fallback
        const match = result.url.match(/[#&?]code=([^&]+)/);
        if (match) {
          code = decodeURIComponent(match[1]);
        }
      }
      
      if (error) {
        console.error('❌ OAuth error in redirect:', error, errorDescription);
        return { success: false, error: errorDescription || error };
      }
      
      // Don't fail if code is missing - Supabase might process the redirect via deep link
      // The deep link handler in App.tsx will process it and trigger auth state change
      if (!code) {
        console.log('ℹ️ No authorization code in redirect URL, but Supabase may process it via deep link');
        console.log('ℹ️ Redirect URL was:', result.url);
        // Continue to polling - Supabase should handle the redirect automatically
      } else {
        console.log('✅ Authorization code extracted from redirect URL');
      }
      
      // Try to get session immediately
      try {
        const { data: { session: urlSession }, error: urlError } = await supabase.auth.getSession();
        
        if (urlSession?.user) {
          console.log('✅ Session found immediately after redirect');
          // Profile creation will be handled by App.tsx auth state change handler
          return {
            success: true,
            userId: urlSession.user.id,
          };
        }
      } catch (sessionError) {
        console.log('ℹ️ Session not immediately available, will poll...');
      }
      
      // Wait for Supabase to process the redirect and create the session
      // The deep link handler in App.tsx should trigger auth state change
      // Poll for session with timeout
      let session = null;
      let attempts = 0;
      const maxAttempts = 20; // Increased attempts to give more time
      
      while (!session && attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 500));
        const { data: { session: currentSession }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('❌ Error getting session:', sessionError);
          return { success: false, error: sessionError.message || 'Failed to create session' };
        }
        
        if (currentSession?.user) {
          session = currentSession;
          break;
        }
        
        attempts++;
      }
      
      if (!session?.user) {
        console.error('❌ Failed to get session after OAuth redirect');
        return { success: false, error: 'Session not created after OAuth redirect' };
      }
      
      console.log('✅ Google sign in successful! User ID:', session.user.id);
      
      // Profile creation will be handled by App.tsx auth state change handler
      return {
        success: true,
        userId: session.user.id,
      };
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
    console.log('🔄 [signOut] Starting logout process...');
    
    // Check if Supabase is configured
    const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
    const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';
    
    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('❌ [signOut] Supabase credentials missing!');
      console.error('❌ [signOut] EXPO_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✅ Set' : '❌ Missing');
      console.error('❌ [signOut] EXPO_PUBLIC_SUPABASE_ANON_KEY:', supabaseAnonKey ? '✅ Set' : '❌ Missing');
      const errorMsg = 'Supabase is not configured.\n\nURL: ' + (supabaseUrl ? 'Set' : 'Missing') + '\nKey: ' + (supabaseAnonKey ? 'Set' : 'Missing') + '\n\nPlease check your environment variables.';
      return { 
        success: false, 
        error: errorMsg
      };
    }
    
    console.log('✅ [signOut] Supabase credentials found, attempting sign out...');
    
    // Check current session before signing out
    const { data: { session: currentSession }, error: sessionCheckError } = await supabase.auth.getSession();
    if (sessionCheckError) {
      console.error('❌ [signOut] Error checking current session:', sessionCheckError);
      console.error('❌ [signOut] Session check error code:', sessionCheckError.code);
      console.error('❌ [signOut] Session check error message:', sessionCheckError.message);
    } else {
      console.log('✅ [signOut] Current session exists:', !!currentSession);
    }
    
    // Attempt to sign out
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      console.error('❌ [signOut] Supabase signOut error:', error);
      console.error('❌ [signOut] Error code:', error.code);
      console.error('❌ [signOut] Error message:', error.message);
      console.error('❌ [signOut] Error status:', error.status);
      
      // Check if it's a network error
      if (error.message?.includes('Network') || error.message?.includes('fetch') || error.code === 'NETWORK_ERROR') {
        console.error('❌ [signOut] Network error detected - check internet connection');
        return { 
          success: false, 
          error: `Network error: ${error.message}. Please check your internet connection.` 
        };
      }
      
      return { success: false, error: error.message };
    }
    
    // Verify sign out was successful
    const { data: { session: verifySession }, error: verifyError } = await supabase.auth.getSession();
    if (verifyError) {
      console.error('❌ [signOut] Error verifying sign out:', verifyError);
    } else if (verifySession) {
      console.warn('⚠️ [signOut] Session still exists after sign out - may need to clear manually');
    } else {
      console.log('✅ [signOut] Session cleared successfully');
    }
    
    console.log('✅ [signOut] Logout successful');
    return { success: true };
  } catch (error: any) {
    console.error('❌ [signOut] Exception during logout:', error);
    console.error('❌ [signOut] Exception type:', typeof error);
    console.error('❌ [signOut] Exception message:', error?.message);
    console.error('❌ [signOut] Exception code:', error?.code);
    console.error('❌ [signOut] Exception stack:', error?.stack);
    
    // Check if it's a network error
    if (error?.message?.includes('Network') || error?.message?.includes('fetch') || error?.code === 'NETWORK_ERROR') {
      console.error('❌ [signOut] Network error detected in exception - check internet connection');
      return { 
        success: false, 
        error: `Network error: ${error.message}. Please check your internet connection.` 
      };
    }
    
    return { 
      success: false, 
      error: error?.message || 'An unexpected error occurred during logout' 
    };
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

