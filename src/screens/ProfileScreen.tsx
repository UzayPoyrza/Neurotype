import React from 'react';
import { View, Text, ScrollView, Switch, StyleSheet } from 'react-native';
import { useStore } from '../store/useStore';

export const ProfileScreen: React.FC = () => {
  const { userProgress, reminderEnabled, toggleReminder } = useStore();

  // Calculate stats
  const totalSessions = userProgress.sessionDeltas.length;
  const recentDeltas = userProgress.sessionDeltas.slice(-7);
  const avgDelta = recentDeltas.length > 0 
    ? recentDeltas.reduce((sum, delta) => sum + (delta.before - delta.after), 0) / recentDeltas.length
    : 0;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        {/* Header */}
        <Text style={styles.header}>
          Profile
        </Text>

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

        {/* App Info */}
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
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  header: {
    fontSize: 30,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 24,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 24,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#f3f4f6',
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  statsList: {
    gap: 16,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statLabel: {
    color: '#6b7280',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#3b82f6',
  },
  neurotypeList: {
    gap: 12,
  },
  neurotypeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  neurotypeLabel: {
    color: '#6b7280',
  },
  neurotypeValue: {
    fontWeight: '600',
    color: '#111827',
  },
  neurotypeNote: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 16,
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
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  reminderTime: {
    color: '#6b7280',
  },
  aboutText: {
    color: '#6b7280',
    lineHeight: 24,
    marginBottom: 16,
  },
  versionInfo: {
    gap: 8,
  },
  versionText: {
    fontSize: 14,
    color: '#6b7280',
  },
}); 