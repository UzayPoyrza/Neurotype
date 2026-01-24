import React, { useState } from 'react';
import { View, Text, StyleSheet, Switch, ScrollView, TouchableOpacity, Alert, Linking, ActivityIndicator } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { useStore } from '../store/useStore';
import { theme } from '../styles/theme';
import { updateUserPreferences, getSubscriptionDetails } from '../services/userService';
import { useUserId } from '../hooks/useUserId';
import { HowToUseModal } from '../components/HowToUseModal';
import { showErrorAlert, ERROR_TITLES } from '../utils/errorHandler';
import { signOut } from '../services/authService';
import { createPortalSession } from '../services/paymentService';

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
  const [isLoadingPortal, setIsLoadingPortal] = useState(false);
  // Get subscription details from store (loaded during app initialization)
  const subscriptionCancelAt = useStore(state => state.subscriptionCancelAt);
  const subscriptionEndDate = useStore(state => state.subscriptionEndDate);
  const subscriptionIsLifetime = useStore(state => state.subscriptionIsLifetime);
  const handleResetAccount = React.useCallback(() => {
    Alert.alert(
      'Reset Account',
      'This will permanently delete all your progress, preferences, and saved data. This action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Reset Everything',
          style: 'destructive',
          onPress: () => {
            resetAppData();
          },
        },
      ],
      { cancelable: true }
    );
  }, [resetAppData]);

  // Set screen context when component mounts
  React.useEffect(() => {
    setCurrentScreen('settings');
  }, [setCurrentScreen]);

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

  // Handle opening Stripe Customer Portal
  const handleManageSubscription = React.useCallback(async () => {
    setIsLoadingPortal(true);
    try {
      console.log('🔐 Opening subscription management portal...');
      const { url } = await createPortalSession();
      
      // Open the portal URL
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
        console.log('✅ Portal opened successfully');
      } else {
        throw new Error('Cannot open portal URL');
      }
    } catch (error: any) {
      console.error('❌ Error opening portal:', error);
      Alert.alert(
        'Error',
        error.message || 'Failed to open subscription management. Please try again later.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsLoadingPortal(false);
    }
  }, []);

  // Handle reminder toggle with database save
  const handleToggleReminder = React.useCallback(async (value: boolean) => {
    console.log('📱 [SettingsScreen] Toggling reminder to:', value);
    
    const currentValue = reminderEnabled;
    
    // Update local state immediately for responsive UI
    if (currentValue !== value) {
      toggleReminder(); // This will toggle to the new value
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
        // Show error alert to user
        showErrorAlert(ERROR_TITLES.DATABASE_ERROR, result.error || 'Failed to save reminder preference');
      }
    } else {
      console.warn('⚠️ [SettingsScreen] No user ID, cannot save to database');
      // Revert if no user ID
      if (currentValue !== value) {
        toggleReminder(); // Toggle back
      }
    }
  }, [userId, reminderEnabled, toggleReminder]);

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
          
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Daily Reminders</Text>
              <Text style={styles.settingDescription}>Get notified for your meditation sessions</Text>
            </View>
            <Switch
              value={reminderEnabled}
              onValueChange={handleToggleReminder}
              trackColor={{ false: '#e0e0e0', true: '#007AFF' }}
              thumbColor={reminderEnabled ? '#ffffff' : '#ffffff'}
            />
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
                  <ActivityIndicator color="#007AFF" />
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
            <Text style={styles.resetTitle}>Reset Account</Text>
            <Text style={styles.resetDescription}>
              Remove all personal progress, preferences, and saved sessions to start fresh.
            </Text>

            <View style={styles.resetWarningBox}>
              <Text style={styles.resetWarningTitle}>Warning</Text>
              <Text style={styles.resetWarningText}>
                This action is permanent. Once you reset, your data cannot be recovered.
              </Text>
            </View>

            <TouchableOpacity style={styles.resetButton} onPress={handleResetAccount}>
              <Text style={styles.resetButtonText}>Reset Account</Text>
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
    backgroundColor: '#f2f2f7',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  manageButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#007AFF',
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
    backgroundColor: '#ff3b30',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  resetButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#ffffff',
  },
  logoutButton: {
    backgroundColor: '#ffffff',
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
    color: '#007AFF',
  },
  howToUseButton: {
    backgroundColor: '#ffffff',
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
    color: '#007AFF',
  },
});