/**
 * Notification Service
 * Handles scheduling and managing daily notifications
 */

import * as Notifications from 'expo-notifications';
import { Platform, Linking } from 'react-native';

export interface NotificationTime {
  hour: number; // 0-23
  minute: number; // 0-59
}

const NOTIFICATION_IDENTIFIER = 'daily-meditation-reminder';

// Track if handler has been set
let notificationHandlerSet = false;

/**
 * Configure notification behavior (lazy initialization)
 * This is called lazily to avoid errors if native module isn't ready
 */
function ensureNotificationHandler() {
  if (!notificationHandlerSet) {
    try {
      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: true,
          shouldShowBanner: true,
          shouldShowList: true,
        }),
      });
      notificationHandlerSet = true;
    } catch (error) {
      console.warn('⚠️ [Notifications] Could not set notification handler:', error);
    }
  }
}

/**
 * Request notification permissions
 */
export async function requestNotificationPermissions(): Promise<boolean> {
  try {
    // Ensure handler is set before using notifications
    ensureNotificationHandler();
    
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.warn('⚠️ [Notifications] Permission not granted');
      return false;
    }

    // On Android, we need to create a notification channel
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Default',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }

    console.log('✅ [Notifications] Permissions granted');
    return true;
  } catch (error) {
    console.error('❌ [Notifications] Error requesting permissions:', error);
    return false;
  }
}

/**
 * Check if notification permissions are granted
 */
export async function hasNotificationPermissions(): Promise<boolean> {
  try {
    // Ensure handler is set before using notifications
    ensureNotificationHandler();
    
    const { status } = await Notifications.getPermissionsAsync();
    return status === 'granted';
  } catch (error) {
    console.error('❌ [Notifications] Error checking permissions:', error);
    return false;
  }
}

/**
 * Schedule a daily notification at the specified time
 * @param time - The time to send the notification (default: 9:00 AM)
 */
export async function scheduleDailyNotification(
  time: NotificationTime = { hour: 9, minute: 0 }
): Promise<boolean> {
  try {
    // Ensure handler is set before using notifications
    ensureNotificationHandler();
    
    // First, cancel any existing notifications
    await cancelDailyNotification();

    // Request permissions if not already granted
    const hasPermission = await requestNotificationPermissions();
    if (!hasPermission) {
      console.warn('⚠️ [Notifications] Cannot schedule notification without permissions');
      return false;
    }

    // Schedule the notification
    // For daily repeating notifications, use type: 'daily' with hour and minute
    const trigger: any = {
      type: 'daily',
      hour: time.hour,
      minute: time.minute,
    };
    
    // Add channelId for Android
    if (Platform.OS === 'android') {
      trigger.channelId = 'default';
    }
    
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Time for Meditation 🧘',
        body: 'Take a moment to practice mindfulness and check in with yourself today.',
        sound: true,
        priority: Notifications.AndroidNotificationPriority.HIGH,
      },
      trigger: trigger,
      identifier: NOTIFICATION_IDENTIFIER,
    });

    console.log(`✅ [Notifications] Daily notification scheduled for ${time.hour}:${time.minute.toString().padStart(2, '0')}`);
    return true;
  } catch (error) {
    console.error('❌ [Notifications] Error scheduling notification:', error);
    return false;
  }
}

/**
 * Cancel the daily notification
 */
export async function cancelDailyNotification(): Promise<void> {
  try {
    // Ensure handler is set before using notifications
    ensureNotificationHandler();
    
    await Notifications.cancelScheduledNotificationAsync(NOTIFICATION_IDENTIFIER);
    console.log('✅ [Notifications] Daily notification cancelled');
  } catch (error) {
    console.error('❌ [Notifications] Error cancelling notification:', error);
  }
}

/**
 * Get all scheduled notifications (for debugging)
 */
export async function getScheduledNotifications(): Promise<Notifications.NotificationRequest[]> {
  try {
    // Ensure handler is set before using notifications
    ensureNotificationHandler();
    
    return await Notifications.getAllScheduledNotificationsAsync();
  } catch (error) {
    console.error('❌ [Notifications] Error getting scheduled notifications:', error);
    return [];
  }
}

/**
 * Check if daily notification is scheduled
 */
export async function isDailyNotificationScheduled(): Promise<boolean> {
  try {
    const notifications = await getScheduledNotifications();
    return notifications.some(n => n.identifier === NOTIFICATION_IDENTIFIER);
  } catch (error) {
    console.error('❌ [Notifications] Error checking if notification is scheduled:', error);
    return false;
  }
}

/**
 * Open device settings for the app
 */
export async function openNotificationSettings(): Promise<void> {
  try {
    if (Platform.OS === 'ios') {
      await Linking.openURL('app-settings:');
    } else {
      // Android
      await Linking.openSettings();
    }
  } catch (error) {
    console.error('❌ [Notifications] Error opening settings:', error);
  }
}

/**
 * Schedule a test notification X seconds from now
 * Useful for testing notification functionality
 * @param secondsFromNow - Number of seconds from now to schedule the notification (default: 5)
 */
export async function scheduleTestNotification(secondsFromNow: number = 5): Promise<boolean> {
  try {
    ensureNotificationHandler();
    
    // Request permissions if not already granted
    const hasPermission = await requestNotificationPermissions();
    if (!hasPermission) {
      console.warn('⚠️ [Notifications] Cannot schedule test notification without permissions');
      return false;
    }

    // Schedule the test notification
    // Create a trigger with proper type
    const trigger: any = {
      type: 'timeInterval',
      seconds: secondsFromNow,
    };
    
    // Add channelId for Android
    if (Platform.OS === 'android') {
      trigger.channelId = 'default';
    }
    
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Time for Meditation 🧘',
        body: 'Take a moment to practice mindfulness and check in with yourself today.',
        sound: true,
        priority: Notifications.AndroidNotificationPriority.HIGH,
      },
      trigger: trigger,
      identifier: 'test-notification',
    });

    console.log(`✅ [Notifications] Test notification scheduled for ${secondsFromNow} second(s) from now`);
    return true;
  } catch (error) {
    console.error('❌ [Notifications] Error scheduling test notification:', error);
    return false;
  }
}

