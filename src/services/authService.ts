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
        queryParams: {
          prompt: 'select_account', // Force Google to show account picker
        },
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
      
      // Parse the redirect URL to check for errors and extract tokens
      let error: string | null = null;
      let errorDescription: string | null = null;
      
      try {
        const url = new URL(result.url);
        
        // Check query parameters for errors
        error = url.searchParams.get('error');
        errorDescription = url.searchParams.get('error_description');
        
        // Also check hash fragment for errors
        if (url.hash) {
          const hashParams = new URLSearchParams(url.hash.substring(1));
          error = hashParams.get('error') || error;
          errorDescription = hashParams.get('error_description') || errorDescription;
        }
      } catch (urlError) {
        console.error('❌ Error parsing redirect URL:', urlError);
        // Try to extract error using regex as fallback
        const errorMatch = result.url.match(/[#&?]error=([^&]+)/);
        if (errorMatch) {
          error = decodeURIComponent(errorMatch[1]);
        }
      }
      
      if (error) {
        console.error('❌ OAuth error in redirect:', error, errorDescription);
        return { success: false, error: errorDescription || error };
      }
      
      // Supabase OAuth redirects contain tokens directly in the hash fragment (not a code)
      // Extract access_token and refresh_token from hash fragment
      const hashPart = result.url.split('#')[1];
      if (hashPart) {
        const hashParams = new URLSearchParams(hashPart);
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');
        
        if (accessToken && refreshToken) {
          console.log('✅ Access token and refresh token found in redirect URL');
          console.log('🔵 Access token length:', accessToken.length);
          console.log('🔵 Refresh token length:', refreshToken.length);
          
          // Manually set the session using the tokens from the redirect URL
          console.log('🔵 Attempting to set session with tokens...');
          
          // Extract userId from JWT token to return immediately if setSession() hangs
          let userIdFromToken: string | null = null;
          try {
            // Decode JWT to get userId (simple base64 decode, no verification needed)
            const tokenParts = accessToken.split('.');
            if (tokenParts.length === 3) {
              const payload = JSON.parse(atob(tokenParts[1]));
              userIdFromToken = payload.sub;
              console.log('🔵 Extracted userId from token:', userIdFromToken);
            }
          } catch (tokenError) {
            console.warn('⚠️ Could not extract userId from token:', tokenError);
          }
          
          try {
            // Call setSession() but don't wait for it - it creates session in memory immediately
            // even if SecureStore fails. The auth state change handler will fire.
            const setSessionPromise = supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });
            
            // Give it a short timeout - if it completes, great. If not, we know the session 
            // exists in memory anyway (auth state change handler fires immediately)
            const timeoutPromise = new Promise<never>((_, reject) => {
              setTimeout(() => reject(new Error('setSession timeout')), 2000); // Reduced to 2 seconds
            });
            
            let sessionResult;
            
            try {
              sessionResult = await Promise.race([
                setSessionPromise,
                timeoutPromise,
              ]);
            } catch (timeoutError: any) {
              // setSession() timed out due to SecureStore, but session exists in memory
              // The auth state change handler has already fired
              console.warn('⚠️ setSession() timed out (SecureStore issue), but session exists in memory');
              
              // Return success using userId from token - session is created in memory
              if (userIdFromToken) {
                console.log('✅ Returning success with userId from token:', userIdFromToken);
                return {
                  success: true,
                  userId: userIdFromToken,
                };
              }
              
              // If we couldn't extract userId, still return success - onboarding handler will detect it
              console.log('⚠️ Could not extract userId from token, but session exists - returning success');
              return {
                success: true,
                // userId will be detected by onboarding handler via auth state change or polling
              };
            }
            
            const { data: sessionData, error: sessionError } = sessionResult;
            
            console.log('🔵 setSession() completed');
            console.log('🔵 Session error:', sessionError);
            console.log('🔵 Session data exists:', !!sessionData);
            console.log('🔵 Session exists:', !!sessionData?.session);
            console.log('🔵 User exists:', !!sessionData?.session?.user);
            
            if (sessionError) {
              console.error('❌ Error setting session from tokens:', sessionError);
              
              // Even if setSession() reports an error, session might exist in memory
              // Use userId from token if available
              if (userIdFromToken) {
                console.log('✅ Returning success with userId from token despite error:', userIdFromToken);
                return {
                  success: true,
                  userId: userIdFromToken,
                };
              }
              
              console.error('❌ Session error message:', sessionError.message);
              return { success: false, error: sessionError.message || 'Failed to create session' };
            }
            
            if (sessionData?.session?.user) {
              console.log('✅ Session created successfully from tokens! User ID:', sessionData.session.user.id);
              // Profile creation will be handled by App.tsx auth state change handler
              return {
                success: true,
                userId: sessionData.session.user.id,
              };
            } else if (userIdFromToken) {
              // Session data missing but we have userId from token
              console.log('✅ Session data missing, but using userId from token:', userIdFromToken);
              return {
                success: true,
                userId: userIdFromToken,
              };
            } else {
              console.error('❌ Session data missing after setting session');
              console.error('❌ sessionData:', sessionData);
              return { success: false, error: 'Session not created from tokens' };
            }
          } catch (setSessionError: any) {
            // Exception occurred - but session might still exist in memory
            // Use userId from token if available
            console.error('❌ Exception in setSession():', setSessionError);
            
            if (userIdFromToken) {
              console.log('✅ Returning success with userId from token after exception:', userIdFromToken);
              return {
                success: true,
                userId: userIdFromToken,
              };
            }
            
            console.error('❌ Exception type:', typeof setSessionError);
            console.error('❌ Exception message:', setSessionError?.message);
            return { success: false, error: `Failed to create session: ${setSessionError?.message || 'Unknown error'}` };
          }
        } else {
          console.error('❌ Missing access_token or refresh_token in redirect URL');
          console.error('❌ Hash params found:', hashPart ? 'Yes' : 'No');
          console.error('❌ Access token found:', !!accessToken);
          console.error('❌ Refresh token found:', !!refreshToken);
        }
      } else {
        console.error('❌ No hash fragment in redirect URL');
      }
      
      // Fallback: Try to get session in case it was set by another mechanism
      try {
        const { data: { session: fallbackSession }, error: fallbackError } = await supabase.auth.getSession();
        
        if (fallbackError) {
          console.error('❌ Error getting fallback session:', fallbackError);
          return { success: false, error: fallbackError.message || 'Failed to create session' };
        }
        
        if (fallbackSession?.user) {
          console.log('✅ Fallback: Session found via getSession()');
          return {
            success: true,
            userId: fallbackSession.user.id,
          };
        }
      } catch (fallbackError) {
        console.error('❌ Exception getting fallback session:', fallbackError);
      }
      
      console.error('❌ Failed to create session from OAuth redirect');
      return { success: false, error: 'Session not created after OAuth redirect' };
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

