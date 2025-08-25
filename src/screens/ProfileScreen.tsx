import React from 'react';
import { View, Text, ScrollView, Switch, StyleSheet } from 'react-native';
import { useStore } from '../store/useStore';
import { theme } from '../styles/theme';
import { TopNav } from '../components/TopNav';

export const ProfileScreen: React.FC = () => {
  const { userProgress, reminderEnabled, toggleReminder } = useStore();

  // Calculate stats
  const totalSessions = userProgress.sessionDeltas.length;
  const recentDeltas = userProgress.sessionDeltas.slice(-7);
  const avgDelta = recentDeltas.length > 0 
    ? recentDeltas.reduce((sum, delta) => sum + (delta.before - delta.after), 0) / recentDeltas.length
    : 0;

  return (
    <View style={styles.container}>
      <TopNav title="Profile" />
      <ScrollView style={styles.scrollView}>
        <View style={styles.content}>
        {/* Form-like Header */}
        <View style={styles.formHeader}>
          <View style={styles.titleField}>
            <View style={styles.infoIcon}>
              <Text style={styles.infoText}>i</Text>
            </View>
            <Text style={styles.titlePlaceholder}>User Profile</Text>
            <View style={styles.checkButton}>
              <Text style={styles.checkText}>✓</Text>
            </View>
          </View>
          
          <View style={styles.descriptionField}>
            <Text style={styles.descriptionPlaceholder}>Your meditation profile and settings</Text>
          </View>
        </View>

        {/* Stats Block */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>
            Your Stats
          </Text>
          
          <View style={styles.statsList}>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Current Streak</Text>
              <Text style={styles.statValue}>
                {userProgress.streak} days
              </Text>
            </View>
            
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Sessions Completed</Text>
              <Text style={styles.statValue}>
                {totalSessions}
              </Text>
            </View>
            
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Avg Anxiety Reduction</Text>
              <Text style={styles.statValue}>
                {avgDelta > 0 ? avgDelta.toFixed(1) : '0'} points
              </Text>
            </View>
          </View>
        </View>

        {/* Neurotype */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>
            Your Neurotype
          </Text>
          
          <View style={styles.neurotypeList}>
            <View style={styles.neurotypeRow}>
              <Text style={styles.neurotypeLabel}>Primary</Text>
              <Text style={styles.neurotypeValue}>Sound</Text>
            </View>
            
            <View style={styles.neurotypeRow}>
              <Text style={styles.neurotypeLabel}>Secondary</Text>
              <Text style={styles.neurotypeValue}>Movement</Text>
            </View>
          </View>
          
          <Text style={styles.neurotypeNote}>
            Based on your meditation patterns and responses
          </Text>
        </View>

        {/* Reminder Toggle */}
        <View style={styles.card}>
          <View style={styles.reminderRow}>
            <View style={styles.reminderContent}>
              <Text style={styles.reminderTitle}>
                Daily Reminder
              </Text>
              <Text style={styles.reminderTime}>
                8:00 PM
              </Text>
            </View>
            <Switch
              testID="toggle-reminder"
              value={reminderEnabled}
              onValueChange={toggleReminder}
              trackColor={{ false: '#e5e7eb', true: '#3b82f6' }}
              thumbColor={reminderEnabled ? '#ffffff' : '#ffffff'}
            />
          </View>
        </View>

        {/* About */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>
            About Neurotype
          </Text>
          
          <Text style={styles.aboutText}>
            The first meditation app that adapts to your brain type, using neuroscience to match you with the meditation method proven to work for you.
          </Text>
          
          <View style={styles.versionInfo}>
            <Text style={styles.versionText}>Version 1.0.0</Text>
            <Text style={styles.versionText}>Built with ❤️ for your mental wellness</Text>
          </View>
        </View>
      </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...theme.common.container,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    ...theme.common.content,
  },
  formHeader: {
    marginBottom: 40,
  },
  titleField: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borders.radius.lg,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderWidth: theme.borders.width.thick,
    borderColor: theme.colors.primary,
    ...theme.shadows.medium,
  },
  infoIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: theme.borders.width.normal,
    borderColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  infoText: {
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.primary,
    fontStyle: 'italic',
  },
  titlePlaceholder: {
    flex: 1,
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.secondary,
    fontFamily: theme.typography.fontFamily,
  },
  checkButton: {
    width: 24,
    height: 24,
    borderRadius: theme.borders.radius.sm,
    backgroundColor: theme.colors.success,
    borderWidth: theme.borders.width.normal,
    borderColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkText: {
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.primary,
  },
  descriptionField: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borders.radius.lg,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderWidth: theme.borders.width.thick,
    borderColor: theme.colors.primary,
    ...theme.shadows.medium,
    marginTop: theme.spacing.sm,
    marginLeft: theme.spacing.xl,
  },
  descriptionPlaceholder: {
    fontSize: theme.typography.sizes.md,
    color: theme.colors.secondary,
    fontFamily: theme.typography.fontFamily,
  },
  card: {
    ...theme.common.card,
    marginBottom: theme.spacing.xxl,
  },
  cardTitle: {
    fontSize: theme.typography.sizes.xl,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.primary,
    marginBottom: theme.spacing.xl,
    fontFamily: theme.typography.fontFamily,
  },
  statsList: {
    gap: theme.spacing.xl,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statLabel: {
    color: theme.colors.secondary,
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.semibold,
    fontFamily: theme.typography.fontFamily,
  },
  statValue: {
    fontSize: theme.typography.sizes.xl,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.primary,
    fontFamily: theme.typography.fontFamily,
  },
  neurotypeList: {
    gap: theme.spacing.lg,
  },
  neurotypeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  neurotypeLabel: {
    color: theme.colors.secondary,
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.semibold,
    fontFamily: theme.typography.fontFamily,
  },
  neurotypeValue: {
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.primary,
    fontFamily: theme.typography.fontFamily,
  },
  neurotypeNote: {
    color: theme.colors.secondary,
    fontSize: theme.typography.sizes.sm,
    fontStyle: 'italic',
    marginTop: theme.spacing.md,
    fontFamily: theme.typography.fontFamily,
  },
  reminderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  reminderContent: {
    flex: 1,
  },
  reminderTitle: {
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.primary,
    marginBottom: theme.spacing.xs,
    fontFamily: theme.typography.fontFamily,
  },
  reminderTime: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.secondary,
    fontFamily: theme.typography.fontFamily,
  },
  aboutText: {
    color: theme.colors.secondary,
    fontSize: theme.typography.sizes.md,
    lineHeight: 24,
    marginBottom: theme.spacing.lg,
    fontFamily: theme.typography.fontFamily,
  },
  versionInfo: {
    alignItems: 'center',
  },
  versionText: {
    color: theme.colors.secondary,
    fontSize: theme.typography.sizes.sm,
    marginBottom: theme.spacing.xs,
    fontFamily: theme.typography.fontFamily,
  },
}); 