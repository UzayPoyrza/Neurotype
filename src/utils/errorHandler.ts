import { Alert } from 'react-native';

/**
 * Maps error messages to user-friendly messages
 */
const ERROR_MESSAGES: Record<string, string> = {
  // Authentication errors
  'Sign in cancelled': 'Sign in was cancelled',
  'Sign in dismissed': 'Sign in was dismissed',
  'No identity token received': 'Unable to verify your identity. Please try again.',
  'Authentication failed': 'Authentication failed. Please try again.',
  'Failed to sign in with Apple': 'Unable to sign in with Apple. Please try again.',
  'Failed to sign in with Google': 'Unable to sign in with Google. Please try again.',
  'Failed to get OAuth URL': 'Unable to start sign in process. Please check your internet connection.',
  'Invalid OAuth URL generated': 'Sign in configuration error. Please try again later.',
  'Failed to open browser': 'Unable to open browser for sign in. Please check your device settings.',
  'Unexpected browser result': 'Sign in process was interrupted. Please try again.',
  'ERR_REQUEST_CANCELED': 'Sign in was cancelled',
  
  // Network errors
  'Network request failed': 'No internet connection. Please check your network and try again.',
  'Failed to fetch': 'Unable to connect to server. Please check your internet connection.',
  'timeout': 'Request timed out. Please try again.',
  
  // Database errors
  'PGRST116': 'Data not found',
  '23505': 'This record already exists',
  '42501': 'Permission denied',
  'Delete blocked by RLS policy': 'Unable to save changes. Please try again.',
  
  // Generic errors
  'An error occurred': 'Something went wrong. Please try again.',
};

/**
 * Gets a user-friendly error message from an error
 */
export function getUserFriendlyErrorMessage(error: string | Error | unknown): string {
  if (typeof error === 'string') {
    // Check if we have a mapped message
    if (ERROR_MESSAGES[error]) {
      return ERROR_MESSAGES[error];
    }
    
    // Check for partial matches (case-insensitive)
    const lowerError = error.toLowerCase();
    for (const [key, message] of Object.entries(ERROR_MESSAGES)) {
      if (lowerError.includes(key.toLowerCase())) {
        return message;
      }
    }
    
    return error;
  }
  
  if (error instanceof Error) {
    // Check error message
    if (ERROR_MESSAGES[error.message]) {
      return ERROR_MESSAGES[error.message];
    }
    
    // Check error code
    if ('code' in error && typeof error.code === 'string' && ERROR_MESSAGES[error.code]) {
      return ERROR_MESSAGES[error.code];
    }
    
    // Check for network errors
    if (error.message.includes('Network') || error.message.includes('fetch')) {
      return ERROR_MESSAGES['Network request failed'];
    }
    
    return error.message || 'An unexpected error occurred';
  }
  
  return 'An unexpected error occurred';
}

/**
 * Shows an error alert to the user
 */
export function showErrorAlert(
  title: string,
  error: string | Error | unknown,
  onDismiss?: () => void
): void {
  const message = getUserFriendlyErrorMessage(error);
  
  // Log the error for debugging
  console.error('[Error Alert]', title, ':', message, error);
  
  // Ensure we always show an alert, even if message is empty
  const displayMessage = message || 'An unexpected error occurred';
  
  try {
    Alert.alert(
      title,
      displayMessage,
      [
        {
          text: 'OK',
          onPress: onDismiss,
          style: 'default',
        },
      ],
      { cancelable: true }
    );
  } catch (alertError) {
    // Fallback if Alert.alert fails
    console.error('[Error Alert] Failed to show alert:', alertError);
    // Try again with a simpler call
    setTimeout(() => {
      try {
        Alert.alert(title, displayMessage);
      } catch (e) {
        console.error('[Error Alert] Second attempt also failed:', e);
      }
    }, 100);
  }
}

/**
 * Shows a success alert to the user
 */
export function showSuccessAlert(
  title: string,
  message: string,
  onDismiss?: () => void
): void {
  Alert.alert(
    title,
    message,
    [
      {
        text: 'OK',
        onPress: onDismiss,
        style: 'default',
      },
    ],
    { cancelable: true }
  );
}

/**
 * Common error alert titles
 */
export const ERROR_TITLES = {
  AUTHENTICATION_FAILED: 'Sign In Failed',
  NETWORK_ERROR: 'Connection Error',
  DATABASE_ERROR: 'Save Error',
  UNKNOWN_ERROR: 'Error',
  NOT_AVAILABLE: 'Not Available',
} as const;

