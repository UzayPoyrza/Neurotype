import React from 'react';
import { View, Text, StyleSheet, Switch, ScrollView, TouchableOpacity } from 'react-native';
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
  } = useStore();
  const globalBackgroundColor = useStore(state => state.globalBackgroundColor);
  const setCurrentScreen = useStore(state => state.setCurrentScreen);

  // Set screen context when component mounts
  React.useEffect(() => {
    setCurrentScreen('settings');
  }, [setCurrentScreen]);

  return (
    <View style={[styles.container, { backgroundColor: globalBackgroundColor }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
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

        {/* Appearance */}
        <View style={styles.settingSection}>
          <Text style={styles.sectionTitle}>Appearance</Text>
          
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Dark Theme</Text>
              <Text style={styles.settingDescription}>Switch to dark mode interface</Text>
            </View>
            <Switch
              value={darkThemeEnabled}
              onValueChange={toggleDarkTheme}
              trackColor={{ false: '#e0e0e0', true: '#007AFF' }}
              thumbColor={darkThemeEnabled ? '#ffffff' : '#ffffff'}
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
  },
  backButton: {
    alignSelf: 'flex-start',
    backgroundColor: '#f2f2f7',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginBottom: 16,
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
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 16,
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
});