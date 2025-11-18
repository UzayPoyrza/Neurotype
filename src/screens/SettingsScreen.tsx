import React from 'react';
import { View, Text, StyleSheet, Switch, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useStore } from '../store/useStore';
import { theme } from '../styles/theme';

export const SettingsScreen: React.FC = () => {
  const navigation = useNavigation();
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
              onValueChange={toggleReminder}
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
                {subscriptionType === 'premium' ? 'Active' : 'Free'}
              </Text>
            </View>
            
            <Text style={styles.subscriptionDescription}>
              {subscriptionType === 'premium' 
                ? 'Enjoy unlimited access to all meditation modules and premium features.'
                : 'Upgrade to Premium for unlimited access to all meditation modules.'
              }
            </Text>
            
            {subscriptionType === 'basic' && (
              <TouchableOpacity style={styles.upgradeButton}>
                <Text style={styles.upgradeButtonText}>Upgrade to Premium</Text>
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
                    onPress: () => {
                      useStore.getState().logout();
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
    backgroundColor: '#fff5f5',
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    borderWidth: 1,
    borderColor: '#ff3b30',
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
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  logoutButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#ff3b30',
  },
});