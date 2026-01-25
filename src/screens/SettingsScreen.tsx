import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Switch, ScrollView, TouchableOpacity, Alert, Linking, ActivityIndicator, AppState, AppStateStatus, DevSettings } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { useStore } from '../store/useStore';
import { theme } from '../styles/theme';
import { updateUserPreferences, getSubscriptionDetails, getUserProfile, getUserPreferences, isPremiumUser } from '../services/userService';
import { useUserId } from '../hooks/useUserId';
import { HowToUseModal } from '../components/HowToUseModal';
import { TimePickerModal } from '../components/TimePickerModal';
import { showErrorAlert, ERROR_TITLES } from '../utils/errorHandler';
import { signOut } from '../services/authService';
import { createPortalSession } from '../services/paymentService';
import { calculateUserStreak } from '../services/progressService';
import { ensureDailyRecommendations } from '../services/recommendationService';
import { getUserEmotionalFeedbackWithSessions } from '../services/feedbackService';
import { scheduleDailyNotification, cancelDailyNotification, requestNotificationPermissions, hasNotificationPermissions, openNotificationSettings } from '../services/notificationService';

type ProfileStackParamList = {
  ProfileMain: undefined;
  Settings: undefined;
  Subscription: undefined;
  Payment: { selectedPlan?: string | null };
};

type SettingsScreenNavigationProp = StackNavigationProp<ProfileStackParamList, 'Settings'>;

export const SettingsScreen: React.FC = () => {
  const navigation = useNavigation<SettingsScreenNavigationProp>();
  const userId = useUserId();
  const {
    reminderEnabled,
    toggleReminder,
    darkThemeEnabled,
    toggleDarkTheme,
    subscriptionType,
    setSubscriptionType,
    resetAppData,
  } = useStore();
  const globalBackgroundColor = useStore(state => state.globalBackgroundColor);
  const setCurrentScreen = useStore(state => state.setCurrentScreen);
  const [backButtonWidth, setBackButtonWidth] = React.useState(0);
  const [showHowToUseModal, setShowHowToUseModal] = useState(false);
  const [showTimePickerModal, setShowTimePickerModal] = useState(false);
  const [isLoadingPortal, setIsLoadingPortal] = useState(false);
  const [hasNotificationPermission, setHasNotificationPermission] = React.useState(true);
  const [reminderHour, setReminderHour] = useState(19);
  const [reminderMinute, setReminderMinute] = useState(0);
  // Get subscription details from store (loaded during app initialization)
  const subscriptionCancelAt = useStore(state => state.subscriptionCancelAt);
  const subscriptionEndDate = useStore(state => state.subscriptionEndDate);
  const subscriptionIsLifetime = useStore(state => state.subscriptionIsLifetime);
  
  // Track if portal was opened to trigger reload on return
  const portalOpenedRef = useRef(false);
  const appStateRef = useRef(AppState.currentState);
  const handleResetAccount = React.useCallback(() => {
    Alert.alert(
      'Reset Account',
      'This will permanently delete all your progress, preferences, and saved sessions. You will start fresh, but your account will remain. This action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Reset Account',
          style: 'destructive',
          onPress: () => {
            resetAppData();
          },
        },
      ],
      { cancelable: true }
    );
  }, [resetAppData]);

  const handleDeleteAccount = React.useCallback(() => {
    Alert.alert(
      'Delete Account',
      'This will permanently delete your account and all associated data. This action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete Account',
          style: 'destructive',
          onPress: () => {
            // TODO: Implement account deletion
            Alert.alert('Not Implemented', 'Account deletion is not yet implemented.');
          },
        },
      ],
      { cancelable: true }
    );
  }, []);

  // Set screen context when component mounts
  React.useEffect(() => {
    setCurrentScreen('settings');
  }, [setCurrentScreen]);

  // Check notification permissions on mount and when screen comes into focus
  const checkNotificationPermissions = React.useCallback(async () => {
    const hasPermission = await hasNotificationPermissions();
    setHasNotificationPermission(hasPermission);
    
    // If permissions are denied and reminder is enabled, turn it off
    if (!hasPermission && reminderEnabled) {
      console.log('⚠️ [Settings] Notifications denied, disabling reminder');
      toggleReminder();
      await cancelDailyNotification();
      
      // Update database if user ID exists
      if (userId) {
        await updateUserPreferences(userId, {
          reminder_enabled: false,
        });
      }
    }
  }, [reminderEnabled, toggleReminder, userId]);

  // Check permissions on mount
  React.useEffect(() => {
    checkNotificationPermissions();
  }, [checkNotificationPermissions]);

  // Check permissions when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      checkNotificationPermissions();
    }, [checkNotificationPermissions])
  );

  // Load reminder time from preferences when screen loads
  useFocusEffect(
    React.useCallback(() => {
      const loadReminderTime = async () => {
        if (userId) {
          const preferences = await getUserPreferences(userId);
          if (preferences?.reminder_time) {
            const [hour, minute] = preferences.reminder_time.split(':').map(Number);
            if (!isNaN(hour) && !isNaN(minute)) {
              setReminderHour(hour);
              setReminderMinute(minute);
              console.log(`✅ [Settings] Loaded reminder time: ${hour}:${minute.toString().padStart(2, '0')}`);
            }
          }
        }
      };
      loadReminderTime();
    }, [userId])
  );

  // Refresh subscription details when screen comes into focus (to catch any updates)
  useFocusEffect(
    React.useCallback(() => {
      const refreshSubscriptionDetails = async () => {
        if (userId && subscriptionType === 'premium') {
          console.log('🔄 [Settings] Screen focused, refreshing subscription details...');
          const details = await getSubscriptionDetails(userId);
          if (details) {
            useStore.getState().setSubscriptionCancelAt(details.cancelAt);
            useStore.getState().setSubscriptionEndDate(details.endDate);
            useStore.getState().setSubscriptionIsLifetime(details.isLifetime);
            console.log('✅ [Settings] Subscription details refreshed on focus');
          }
        }
      };
      refreshSubscriptionDetails();
    }, [userId, subscriptionType])
  );

  // Function to reload all user data (fallback for dev mode)
  const reloadUserData = React.useCallback(async () => {
    if (!userId) return;
    
    try {
      console.log('🔄 [Settings] Reloading all user data after returning from Stripe portal...');
      
      // Reload user profile and subscription
      const userProfile = await getUserProfile(userId);
      if (userProfile) {
        const isPremium = await isPremiumUser(userId);
        const subscriptionType = isPremium ? 'premium' : 'basic';
        useStore.getState().setSubscriptionType(subscriptionType);
        
        if (subscriptionType === 'premium') {
          const details = await getSubscriptionDetails(userId);
          if (details) {
            useStore.getState().setSubscriptionCancelAt(details.cancelAt);
            useStore.getState().setSubscriptionEndDate(details.endDate);
            useStore.getState().setSubscriptionIsLifetime(details.isLifetime);
          }
        } else {
          useStore.getState().setSubscriptionCancelAt(null);
          useStore.getState().setSubscriptionEndDate(null);
          useStore.getState().setSubscriptionIsLifetime(false);
        }
        
        if (userProfile.first_name) {
          useStore.getState().setUserFirstName(userProfile.first_name);
        }
      }
      
      // Reload preferences
      const preferences = await getUserPreferences(userId);
      if (preferences) {
        const currentReminderEnabled = useStore.getState().reminderEnabled;
        if (preferences.reminder_enabled !== currentReminderEnabled) {
          if (preferences.reminder_enabled && !currentReminderEnabled) {
            useStore.getState().toggleReminder();
          } else if (!preferences.reminder_enabled && currentReminderEnabled) {
            useStore.getState().toggleReminder();
          }
        }
      }
      
      // Clear and reload caches
      useStore.getState().clearSessionsCache();
      useStore.getState().clearCalendarCache();
      useStore.getState().clearEmotionalFeedbackCache();
      
      // Sync completed sessions
      await useStore.getState().syncTodayCompletedSessionsFromDatabase(userId);
      
      // Recalculate streak
      const streak = await calculateUserStreak(userId);
      useStore.setState((state) => ({
        userProgress: {
          ...state.userProgress,
          streak: streak,
        },
      }));
      
      // Reload emotional feedback
      const feedbackWithSessions = await getUserEmotionalFeedbackWithSessions(userId, 20);
      // Transform to EmotionalFeedbackEntry format and filter out entries without sessions
      const emotionalFeedbackEntries = feedbackWithSessions
        .filter(({ session }) => session !== null)
        .map(({ feedback }) => ({
          id: feedback.id || `feedback-${feedback.feedback_date}-${feedback.session_id}`,
          sessionId: feedback.session_id,
          label: feedback.label,
          timestampSeconds: feedback.timestamp_seconds,
          date: feedback.feedback_date,
        }));
      useStore.setState({ emotionalFeedbackHistory: emotionalFeedbackEntries });
      
      // Ensure daily recommendations
      const defaultModuleId = useStore.getState().todayModuleId || 'anxiety';
      await ensureDailyRecommendations(userId, defaultModuleId);
      
      console.log('✅ [Settings] User data reloaded successfully');
    } catch (error: any) {
      console.error('❌ [Settings] Error reloading user data:', error);
    }
  }, [userId]);

  // Function to completely reload the app
  const reloadApp = React.useCallback(async () => {
    try {
      console.log('🔄 [Settings] Reloading entire app after returning from Stripe portal...');
      
      // Try to use Updates.reloadAsync() if available (production builds)
      try {
        const Updates = require('expo-updates');
        if (Updates.isEnabled && Updates.reloadAsync) {
          console.log('✅ [Settings] Updates enabled, reloading app...');
          await Updates.reloadAsync();
          return;
        }
      } catch (updatesError) {
        // Updates module not available, continue to fallback
        console.log('⚠️ [Settings] Updates module not available');
      }
      
      // Fallback 1: Use DevSettings.reload() for development mode
      if (__DEV__ && DevSettings && DevSettings.reload) {
        console.log('🔄 [Settings] Using DevSettings.reload() for dev mode...');
        DevSettings.reload();
        return;
      }
      
      // Fallback 2: Reload all data if native reload isn't available
      console.log('⚠️ [Settings] Native reload not available, reloading data instead...');
      await reloadUserData();
    } catch (error: any) {
      console.error('❌ [Settings] Error reloading app:', error);
      // Final fallback to data reload if app reload fails
      await reloadUserData();
    }
  }, [reloadUserData]);

  // Listen for app state changes to detect return from Stripe portal and check notification permissions
  useEffect(() => {
    const subscription = AppState.addEventListener('change', async (nextAppState: AppStateStatus) => {
      const previousAppState = appStateRef.current;
      appStateRef.current = nextAppState;
      
      // If app came back to foreground, check notification permissions
      if (
        (previousAppState === 'background' || previousAppState === 'inactive') &&
        nextAppState === 'active'
      ) {
        // Check notification permissions when app returns to foreground
        // (user might have enabled them in device settings)
        await checkNotificationPermissions();
        
        // If we had opened the portal, reload everything
        if (portalOpenedRef.current) {
          console.log('🔄 [Settings] App returned to foreground after Stripe portal, reloading app...');
          portalOpenedRef.current = false; // Reset flag
          reloadApp();
        }
      }
    });

    return () => {
      subscription.remove();
    };
  }, [reloadUserData, checkNotificationPermissions]);

  // Handle opening Stripe Customer Portal
  const handleManageSubscription = React.useCallback(async () => {
    setIsLoadingPortal(true);
    try {
      console.log('🔐 Opening subscription management portal...');
      const { url } = await createPortalSession();
      
      // Mark that portal was opened
      portalOpenedRef.current = true;
      
      // Open the portal URL immediately (don't await - fire and forget)
      Linking.openURL(url).catch((openError) => {
        portalOpenedRef.current = false; // Reset if failed to open
        console.error('❌ Error opening URL:', openError);
        Alert.alert(
          'Error',
          'Failed to open subscription management. Please try again later.',
          [{ text: 'OK' }]
        );
      });
      
      console.log('✅ Portal opened successfully');
      // Reset loading state immediately after opening browser
      setIsLoadingPortal(false);
    } catch (error: any) {
      portalOpenedRef.current = false; // Reset on error
      setIsLoadingPortal(false);
      console.error('❌ Error opening portal:', error);
      Alert.alert(
        'Error',
        error.message || 'Failed to open subscription management. Please try again later.',
        [{ text: 'OK' }]
      );
    }
  }, []);

  // Handle reminder toggle with database save and notification scheduling
  const handleToggleReminder = React.useCallback(async (value: boolean) => {
    console.log('📱 [SettingsScreen] Toggling reminder to:', value);
    
    const currentValue = reminderEnabled;
    
    // If trying to enable, check permissions first
    if (value) {
      // Check current permission status
      const hasPermission = await hasNotificationPermissions();
      setHasNotificationPermission(hasPermission);
      
      if (!hasPermission) {
        // Permissions denied - show alert with option to open settings
        Alert.alert(
          'Notification Permission Required',
          'To receive daily reminders, please enable notifications in your device settings.',
          [
            {
              text: 'Cancel',
              style: 'cancel',
            },
            {
              text: 'Open Settings',
              onPress: async () => {
                await openNotificationSettings();
              },
            },
          ]
        );
        return; // Don't toggle if permissions are denied
      }
    }
    
    // Update local state immediately for responsive UI
    if (currentValue !== value) {
      toggleReminder(); // This will toggle to the new value
    }
    
    // Handle notifications
    if (value) {
      // Request permissions and schedule notification
      const hasPermission = await requestNotificationPermissions();
      if (hasPermission) {
        // Use saved reminder time if available, otherwise use current state
        const timeToUse = { hour: reminderHour, minute: reminderMinute };
        const scheduled = await scheduleDailyNotification(timeToUse);
        if (!scheduled) {
          console.warn('⚠️ [SettingsScreen] Failed to schedule notification');
          // Revert toggle if scheduling failed
          if (currentValue !== value) {
            toggleReminder();
          }
          Alert.alert(
            'Notification Permission',
            'Please enable notifications in your device settings to receive daily reminders.',
            [
              {
                text: 'Cancel',
                style: 'cancel',
              },
              {
                text: 'Open Settings',
                onPress: async () => {
                  await openNotificationSettings();
                },
              },
            ]
          );
        }
      } else {
        // Revert toggle if permissions denied
        if (currentValue !== value) {
          toggleReminder();
        }
        Alert.alert(
          'Notification Permission Required',
          'To receive daily reminders, please enable notifications in your device settings.',
          [
            {
              text: 'Cancel',
              style: 'cancel',
            },
            {
              text: 'Open Settings',
              onPress: async () => {
                await openNotificationSettings();
              },
            },
          ]
        );
      }
    } else {
      // Cancel notification
      await cancelDailyNotification();
    }
    
    // Save to database
    if (userId) {
      console.log('💾 [SettingsScreen] Saving reminder preference to database...');
      const result = await updateUserPreferences(userId, {
        reminder_enabled: value,
      });
      
      if (result.success) {
        console.log('✅ [SettingsScreen] Reminder preference saved successfully');
      } else {
        console.error('❌ [SettingsScreen] Failed to save reminder preference:', result.error);
        // Revert local state on error
        if (currentValue !== value) {
          toggleReminder(); // Toggle back
        }
        // Revert notification state
        if (value) {
          await cancelDailyNotification();
        } else {
          await scheduleDailyNotification();
        }
        // Show error alert to user
        showErrorAlert(ERROR_TITLES.DATABASE_ERROR, result.error || 'Failed to save reminder preference');
      }
    } else {
      console.warn('⚠️ [SettingsScreen] No user ID, cannot save to database');
      // Revert if no user ID
      if (currentValue !== value) {
        toggleReminder(); // Toggle back
      }
      // Revert notification state
      if (value) {
        await cancelDailyNotification();
      } else {
        await scheduleDailyNotification();
      }
    }
  }, [userId, reminderEnabled, toggleReminder, reminderHour, reminderMinute]);

  // Handle time picker confirmation
  const handleTimeConfirm = React.useCallback(async (hour: number, minute: number) => {
    setReminderHour(hour);
    setReminderMinute(minute);
    
    // Format time as "HH:MM" for database storage
    const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
    
    // Save time to database
    if (userId) {
      console.log('💾 [Settings] Saving reminder time to database...');
      const result = await updateUserPreferences(userId, {
        reminder_time: timeString,
      });
      
      if (!result.success) {
        console.error('❌ [Settings] Failed to save reminder time:', result.error);
        Alert.alert('Error', 'Failed to save reminder time. Please try again.');
        return;
      }
      console.log('✅ [Settings] Reminder time saved successfully');
    }
    
    // If reminder is enabled, reschedule with new time
    if (reminderEnabled) {
      const scheduled = await scheduleDailyNotification({ hour, minute });
      if (scheduled) {
        console.log(`✅ [Settings] Notification rescheduled for ${hour}:${minute.toString().padStart(2, '0')}`);
      } else {
        Alert.alert('Error', 'Failed to update notification time. Please try again.');
      }
    }
  }, [reminderEnabled, userId]);

  return (
    <View style={[styles.container, { backgroundColor: globalBackgroundColor }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
          onLayout={event => {
            const { width } = event.nativeEvent.layout;
            setBackButtonWidth(width);
          }}
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={[styles.headerSpacer, { width: backButtonWidth }]} />
      </View>

      <ScrollView style={[styles.scrollView, { backgroundColor: globalBackgroundColor }]} contentContainerStyle={styles.content}>
        {/* Notifications */}
        <View style={styles.settingSection}>
          <Text style={styles.sectionTitle}>Notifications</Text>
          
          <View style={styles.reminderCard}>
            <View style={styles.reminderHeader}>
              <View style={styles.reminderHeaderContent}>
                <Text style={styles.reminderTitle}>Daily Reminders</Text>
                <Text style={styles.reminderDescription}>Get notified for your meditation sessions</Text>
              </View>
              <Switch
                value={reminderEnabled}
                onValueChange={handleToggleReminder}
                trackColor={{ false: '#e0e0e0', true: '#007AFF' }}
                thumbColor={reminderEnabled ? '#ffffff' : '#ffffff'}
              />
            </View>
            
            {/* Customise Button */}
            <TouchableOpacity 
              style={[
                styles.customiseButton,
                !reminderEnabled && styles.customiseButtonDisabled
              ]}
              onPress={() => {
                if (reminderEnabled) {
                  setShowTimePickerModal(true);
                }
              }}
              disabled={!reminderEnabled}
            >
              <Text style={[
                styles.customiseButtonText,
                !reminderEnabled && styles.customiseButtonTextDisabled
              ]}>
                Customise
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Subscription */}
        <View style={styles.settingSection}>
          <Text style={styles.sectionTitle}>Subscription</Text>
          
          <View style={styles.subscriptionCard}>
            <View style={styles.subscriptionHeader}>
              <Text style={styles.subscriptionTitle}>
                {subscriptionType === 'premium' ? '💎 Premium Plan' : '📱 Basic Plan'}
              </Text>
              <Text style={styles.subscriptionStatus}>
                {subscriptionType === 'premium' ? 'Premium' : 'Basic'}
              </Text>
            </View>
            
            <Text style={styles.subscriptionDescription}>
              {subscriptionType === 'premium' 
                ? 'Enjoy unlimited access to all meditation modules and premium features.'
                : 'Upgrade to Premium for unlimited access to all meditation modules.'
              }
            </Text>

            {subscriptionType === 'premium' && (
              <>
                {subscriptionIsLifetime ? (
                  <View style={styles.lifetimeMessageContainer}>
                    <Text style={styles.lifetimeMessageText}>
                      Thank you for Lifetime subscription
                    </Text>
                  </View>
                ) : subscriptionCancelAt ? (
                  <View style={styles.cancelMessageContainer}>
                    <Text style={styles.cancelMessageText}>
                      Your subscription ends at {new Date(subscriptionCancelAt).toLocaleDateString()}. You can modify your subscription below.
                    </Text>
                  </View>
                ) : subscriptionEndDate ? (
                  <View style={styles.renewalMessageContainer}>
                    <Text style={styles.renewalMessageText}>
                      Your plan will be auto-renewed on {new Date(subscriptionEndDate).toLocaleDateString()}.
                    </Text>
                  </View>
                ) : null}
              </>
            )}
            
            {subscriptionType === 'basic' && (
              <TouchableOpacity 
                style={styles.upgradeButton}
                onPress={() => navigation.navigate('Subscription')}
              >
                <Text style={styles.upgradeButtonText}>Upgrade to Premium</Text>
              </TouchableOpacity>
            )}

            {subscriptionType === 'premium' && !subscriptionIsLifetime && (
              <TouchableOpacity 
                style={styles.manageButton}
                onPress={handleManageSubscription}
                disabled={isLoadingPortal}
              >
                {isLoadingPortal ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <Text style={styles.manageButtonText}>Manage Subscription</Text>
                )}
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* About */}
        <View style={styles.settingSection}>
          <Text style={styles.sectionTitle}>About</Text>
          
          <View style={styles.aboutCard}>
            <Text style={styles.aboutTitle}>Neurotype v1.0.0</Text>
            <Text style={styles.aboutDescription}>
              The first meditation app that adapts to your brain type, using neuroscience to match you with proven meditation methods.
            </Text>
          </View>
        </View>

        {/* Information */}
        <View style={styles.settingSection}>
          <Text style={styles.sectionTitle}>Information</Text>
          
          <TouchableOpacity 
            style={styles.howToUseButton}
            onPress={() => setShowHowToUseModal(true)}
          >
            <Text style={styles.howToUseButtonText}>How to Use the App</Text>
          </TouchableOpacity>
        </View>

        {/* Danger Zone */}
        <View style={styles.settingSection}>
          <Text style={styles.sectionTitle}>Clear Data</Text>

          <View style={styles.resetCard}>
            <Text style={styles.resetTitle}>Reset or Delete Account</Text>
            <Text style={styles.resetDescription}>
              Reset your account to start fresh, or permanently delete your account and all data.
            </Text>

            <View style={styles.resetWarningBox}>
              <Text style={styles.resetWarningTitle}>Warning</Text>
              <Text style={styles.resetWarningText}>
                These actions are permanent. Once you reset or delete, your data cannot be recovered.
              </Text>
            </View>

            <TouchableOpacity style={styles.resetButton} onPress={handleResetAccount}>
              <Text style={styles.resetButtonText}>Reset Account</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.deleteButton} onPress={handleDeleteAccount}>
              <Text style={styles.deleteButtonText}>Delete Account</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Logout */}
        <View style={styles.settingSection}>
          <TouchableOpacity 
            style={styles.logoutButton} 
            onPress={() => {
              Alert.alert(
                'Logout',
                'Are you sure you want to logout?',
                [
                  {
                    text: 'Cancel',
                    style: 'cancel',
                  },
                  {
                    text: 'Logout',
                    style: 'destructive',
                      onPress: async () => {
                        try {
                          console.log('🔄 [Settings] Starting logout process...');
                          
                          // ALWAYS clear local state FIRST, even if Supabase logout fails
                          // This ensures logout works even with connection issues
                          useStore.setState({
                            userId: null,
                            isLoggedIn: false,
                            hasCompletedOnboarding: false,
                            emotionalFeedbackHistory: [],
                          });
                          
                          // Clear all caches
                          useStore.getState().clearSessionsCache();
                          useStore.getState().clearCalendarCache();
                          useStore.setState({ completedTodaySessions: {} });
                          
                          console.log('✅ [Settings] Local state cleared');
                          
                          // Try to sign out from Supabase (but don't fail if this doesn't work)
                          try {
                            const result = await signOut();
                            if (result.success) {
                              console.log('✅ [Settings] Supabase logout successful');
                            } else {
                              console.warn('⚠️ [Settings] Supabase logout failed, but local state cleared:', result.error);
                              // Show warning but don't block logout - local state is already cleared
                              Alert.alert(
                                'Logout Warning',
                                `Local data cleared, but failed to sign out from server.\n\nError: ${result.error || 'Unknown error'}\n\nYou may need to sign out again when connection is restored.`,
                                [{ text: 'OK' }]
                              );
                            }
                          } catch (signOutError: any) {
                            console.error('❌ [Settings] Exception during Supabase logout:', signOutError);
                            // Local state is already cleared, so logout is effectively complete
                            Alert.alert(
                              'Logout Warning',
                              `Local data cleared, but failed to sign out from server.\n\nError: ${signOutError?.message || 'Unknown error'}\n\nYou may need to sign out again when connection is restored.`,
                              [{ text: 'OK' }]
                            );
                          }
                          
                          console.log('✅ [Settings] Logout process completed');
                        } catch (error: any) {
                          console.error('❌ [Settings] Logout exception:', error);
                          console.error('❌ [Settings] Exception type:', typeof error);
                          console.error('❌ [Settings] Exception message:', error?.message);
                          console.error('❌ [Settings] Exception code:', error?.code);
                          console.error('❌ [Settings] Exception stack:', error?.stack);
                          
                          // Even if there's an error, try to clear local state
                          try {
                            useStore.setState({
                              userId: null,
                              isLoggedIn: false,
                              hasCompletedOnboarding: false,
                              emotionalFeedbackHistory: [],
                            });
                            useStore.getState().clearSessionsCache();
                            useStore.getState().clearCalendarCache();
                            useStore.setState({ completedTodaySessions: {} });
                            console.log('✅ [Settings] Local state cleared despite error');
                          } catch (clearError) {
                            console.error('❌ [Settings] Failed to clear local state:', clearError);
                            showErrorAlert(ERROR_TITLES.AUTHENTICATION_FAILED, 'Failed to clear local data. Please restart the app.');
                          }
                        }
                      },
                  },
                ],
                { cancelable: true }
              );
            }}
          >
            <Text style={styles.logoutButtonText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* How to Use Modal */}
      <HowToUseModal
        isVisible={showHowToUseModal}
        onClose={() => setShowHowToUseModal(false)}
      />

      {/* Time Picker Modal */}
      <TimePickerModal
        visible={showTimePickerModal}
        onClose={() => setShowTimePickerModal(false)}
        onConfirm={handleTimeConfirm}
        initialHour={reminderHour}
        initialMinute={reminderMinute}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f2f2f7',
  },
  header: {
    backgroundColor: '#ffffff',
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    backgroundColor: '#f2f2f7',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginRight: 12,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: '#000000',
    textAlign: 'center',
    flex: 1,
  },
  headerSpacer: {
    height: 0,
    marginLeft: 12,
  },
  scrollView: {
    flex: 1,
    backgroundColor: '#f2f2f7',
  },
  content: {
    padding: 20,
    paddingBottom: 100,
  },
  settingSection: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 8,
  },
  settingItem: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingLabel: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 15,
    color: '#8e8e93',
  },
  reminderCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  reminderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  reminderHeaderContent: {
    flex: 1,
    marginRight: 16,
  },
  reminderTitle: {
    fontSize: 19,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 4,
  },
  reminderDescription: {
    fontSize: 15,
    color: '#8e8e93',
  },
  subscriptionCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  subscriptionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  subscriptionTitle: {
    fontSize: 19,
    fontWeight: '700',
    color: '#000000',
  },
  subscriptionStatus: {
    fontSize: 13,
    fontWeight: '600',
    color: '#34c759',
    backgroundColor: '#f2f2f7',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#34c759',
  },
  subscriptionDescription: {
    fontSize: 15,
    color: '#8e8e93',
    lineHeight: 20,
    marginBottom: 16,
  },
  upgradeButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  upgradeButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#ffffff',
  },
  manageButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  manageButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#ffffff',
  },
  cancelMessageContainer: {
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#fff3cd',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ffc107',
    marginBottom: 12,
  },
  cancelMessageText: {
    fontSize: 14,
    color: '#856404',
    lineHeight: 20,
  },
  renewalMessageContainer: {
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#d1ecf1',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#0c5460',
    marginBottom: 12,
  },
  renewalMessageText: {
    fontSize: 14,
    color: '#0c5460',
    lineHeight: 20,
  },
  lifetimeMessageContainer: {
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#d4edda',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#28a745',
    marginBottom: 12,
  },
  lifetimeMessageText: {
    fontSize: 14,
    color: '#155724',
    lineHeight: 20,
    fontWeight: '600',
  },
  aboutCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  aboutTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 8,
  },
  aboutDescription: {
    fontSize: 15,
    color: '#8e8e93',
    lineHeight: 20,
  },
  resetCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  resetTitle: {
    fontSize: 19,
    fontWeight: '700',
    color: '#ff3b30',
    marginBottom: 8,
  },
  resetDescription: {
    fontSize: 15,
    color: '#8e8e93',
    lineHeight: 20,
    marginBottom: 16,
  },
  resetWarningBox: {
    backgroundColor: '#ffecec',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#ff3b30',
    marginBottom: 20,
  },
  resetWarningTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ff3b30',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  resetWarningText: {
    fontSize: 14,
    color: '#d73a2d',
    lineHeight: 18,
  },
  resetButton: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#ff3b30',
    marginBottom: 12,
  },
  resetButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#ff3b30',
  },
  deleteButton: {
    backgroundColor: '#ff3b30',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  deleteButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#ffffff',
  },
  logoutButton: {
    backgroundColor: '#007AFF',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 20,
    marginHorizontal: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  logoutButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#ffffff',
  },
  howToUseButton: {
    backgroundColor: '#007AFF',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 12,
    marginTop: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    alignItems: 'center',
  },
  howToUseButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#ffffff',
  },
  customiseButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  customiseButtonDisabled: {
    backgroundColor: '#e0e0e0',
    opacity: 0.6,
  },
  customiseButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#ffffff',
  },
  customiseButtonTextDisabled: {
    color: '#999999',
  },
});