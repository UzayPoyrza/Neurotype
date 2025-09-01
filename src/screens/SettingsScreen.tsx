import React from 'react';
import { View, Text, StyleSheet, Switch, ScrollView, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { InstagramStyleScreen } from '../components/InstagramStyleScreen';
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

  return (
    <InstagramStyleScreen 
      title="Settings"
      showBackButton={true}
      onBackPress={() => navigation.goBack()}
    >
      <View style={styles.content}>
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
              trackColor={{ false: '#e5e7eb', true: '#3b82f6' }}
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
              trackColor={{ false: '#e5e7eb', true: '#3b82f6' }}
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
      </View>
    </InstagramStyleScreen>
  );
};

const styles = StyleSheet.create({
  content: {
    ...theme.common.content,
  },
  settingSection: {
    marginBottom: theme.spacing.xxxl,
  },
  sectionTitle: {
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.primary,
    marginBottom: theme.spacing.lg,
    fontFamily: theme.typography.fontFamily,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borders.radius.lg,
    padding: theme.spacing.lg,
    borderWidth: theme.borders.width.normal,
    borderColor: theme.colors.primary,
    ...theme.shadows.small,
    marginBottom: theme.spacing.md,
  },
  settingInfo: {
    flex: 1,
    marginRight: theme.spacing.md,
  },
  settingLabel: {
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.primary,
    marginBottom: theme.spacing.xs,
    fontFamily: theme.typography.fontFamily,
  },
  settingDescription: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.secondary,
    fontFamily: theme.typography.fontFamily,
  },
  subscriptionCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borders.radius.lg,
    padding: theme.spacing.xl,
    borderWidth: theme.borders.width.thick,
    borderColor: theme.colors.primary,
    ...theme.shadows.medium,
  },
  subscriptionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  subscriptionTitle: {
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.primary,
    fontFamily: theme.typography.fontFamily,
  },
  subscriptionStatus: {
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.success,
    backgroundColor: theme.colors.background,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borders.radius.md,
    borderWidth: theme.borders.width.normal,
    borderColor: theme.colors.success,
  },
  subscriptionDescription: {
    fontSize: theme.typography.sizes.md,
    color: theme.colors.secondary,
    lineHeight: 20,
    marginBottom: theme.spacing.lg,
    fontFamily: theme.typography.fontFamily,
  },
  upgradeButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borders.radius.md,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    alignItems: 'center',
    ...theme.shadows.small,
  },
  upgradeButtonText: {
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.surface,
    fontFamily: theme.typography.fontFamily,
  },
  aboutCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borders.radius.lg,
    padding: theme.spacing.lg,
    borderWidth: theme.borders.width.normal,
    borderColor: theme.colors.primary,
    ...theme.shadows.small,
  },
  aboutTitle: {
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.primary,
    marginBottom: theme.spacing.sm,
    fontFamily: theme.typography.fontFamily,
  },
  aboutDescription: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.secondary,
    lineHeight: 18,
    fontFamily: theme.typography.fontFamily,
  },
});