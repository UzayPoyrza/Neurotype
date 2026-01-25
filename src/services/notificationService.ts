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
    
    console.log('📱 [Notifications] Checking notification permissions...');
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    console.log(`📱 [Notifications] Current permission status: ${existingStatus}`);
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      console.log('📱 [Notifications] Requesting notification permissions...');
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
      console.log(`📱 [Notifications] Permission request result: ${status}`);
    }

    if (finalStatus !== 'granted') {
      console.warn(`⚠️ [Notifications] Permission not granted. Status: ${finalStatus}`);
      return false;
    }

    // On Android, we need to create a notification channel
    if (Platform.OS === 'android') {
      console.log('📱 [Notifications] Setting up Android notification channel...');
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Default',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
      console.log('✅ [Notifications] Android notification channel created');
    }

    console.log('✅ [Notifications] Permissions granted');
    return true;
  } catch (error: any) {
    console.error('❌ [Notifications] Error requesting permissions:', error);
    console.error('❌ [Notifications] Permission error details:', {
      message: error?.message,
      code: error?.code,
      stack: error?.stack,
      name: error?.name,
    });
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
    // For daily repeating notifications, use type: 'calendar' with repeats: true
    const trigger: any = {
      type: 'calendar',
      hour: time.hour,
      minute: time.minute,
      repeats: true, // This makes it repeat daily
    };
    
    // Add channelId for Android
    if (Platform.OS === 'android') {
      trigger.channelId = 'default';
    }
    
    const currentTime = new Date().toLocaleTimeString();
    console.log(`📅 [Notifications] Scheduling daily notification with trigger:`, JSON.stringify(trigger, null, 2));
    console.log(`🕐 [Notifications] Current time: ${currentTime}`);
    
    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Daily Meditation Reminder 🧘',
        body: 'Don\'t forget to complete your meditation today!',
        sound: true,
        priority: Notifications.AndroidNotificationPriority.HIGH,
      },
      trigger: trigger,
      identifier: NOTIFICATION_IDENTIFIER,
    });

    console.log(`✅ [Notifications] Daily notification scheduled successfully. ID: ${notificationId}`);
    console.log(`✅ [Notifications] Scheduled for ${time.hour}:${time.minute.toString().padStart(2, '0')} daily`);
    console.log(`🕐 [Notifications] Current time: ${new Date().toLocaleTimeString()}`);
    
    // Verify the notification was actually scheduled
    const scheduledNotifications = await getScheduledNotifications();
    const ourNotification = scheduledNotifications.find(n => n.identifier === NOTIFICATION_IDENTIFIER);
    
    if (ourNotification) {
      console.log(`✅ [Notifications] Verification: Notification found in scheduled list`);
      console.log(`🕐 [Notifications] Current time: ${new Date().toLocaleTimeString()}`);
      console.log(`📋 [Notifications] Notification details:`, JSON.stringify({
        identifier: ourNotification.identifier,
        trigger: ourNotification.trigger,
        content: ourNotification.content,
      }, null, 2));
    } else {
      console.warn(`⚠️ [Notifications] Warning: Notification not found in scheduled list after scheduling`);
      console.log(`🕐 [Notifications] Current time: ${new Date().toLocaleTimeString()}`);
      console.log(`📋 [Notifications] All scheduled notifications:`, JSON.stringify(scheduledNotifications.map(n => ({
        identifier: n.identifier,
        trigger: n.trigger,
      })), null, 2));
    }
    
    return true;
  } catch (error: any) {
    console.error('❌ [Notifications] Error scheduling notification:', error);
    console.error('❌ [Notifications] Error details:', {
      message: error?.message,
      code: error?.code,
      stack: error?.stack,
      name: error?.name,
    });
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
    
    console.log(`📱 [Notifications] Cancelling notification with identifier: ${NOTIFICATION_IDENTIFIER}`);
    await Notifications.cancelScheduledNotificationAsync(NOTIFICATION_IDENTIFIER);
    
    // Verify it was cancelled
    const scheduledNotifications = await getScheduledNotifications();
    const stillExists = scheduledNotifications.some(n => n.identifier === NOTIFICATION_IDENTIFIER);
    
    if (stillExists) {
      console.warn(`⚠️ [Notifications] Warning: Notification still exists after cancellation attempt`);
    } else {
      console.log('✅ [Notifications] Daily notification cancelled successfully');
    }
  } catch (error: any) {
    console.error('❌ [Notifications] Error cancelling notification:', error);
    console.error('❌ [Notifications] Cancellation error details:', {
      message: error?.message,
      code: error?.code,
      stack: error?.stack,
      name: error?.name,
    });
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


