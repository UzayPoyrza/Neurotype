import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { Session } from '../types';
import { SessionCard } from '../components/SessionCard';
import { Sparkline } from '../components/Sparkline';
import { useStore } from '../store/useStore';
import { mockSessions } from '../data/mockData';

interface TodayScreenProps {
  onStartSession: (session: Session) => void;
}

export const TodayScreen: React.FC<TodayScreenProps> = ({ onStartSession }) => {
  const userProgress = useStore(state => state.userProgress);
  
  // Get recommended session (static for MVP)
  const recommendedSession = mockSessions[0]; // Ocean Waves Meditation
  
  // Calculate average delta for last 7 sessions
  const recentDeltas = userProgress.sessionDeltas.slice(-7);
  const avgDelta = recentDeltas.length > 0 
    ? recentDeltas.reduce((sum, delta) => sum + (delta.before - delta.after), 0) / recentDeltas.length
    : 0;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.greeting}>
            Hey 👋
          </Text>
          <View style={styles.streakBadge}>
            <Text style={styles.streakText}>
              {userProgress.streak} day streak
            </Text>
          </View>
        </View>

        {/* Recommended Session */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Recommended for you
          </Text>
          <SessionCard
            session={recommendedSession}
            onStart={onStartSession}
            variant="recommended"
          />
        </View>

        {/* Mini Trend */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>
            Your Progress
          </Text>
          
          {userProgress.sessionDeltas.length > 0 ? (
            <View>
              <Sparkline data={userProgress.sessionDeltas} />
              <View style={styles.progressFooter}>
                <Text style={styles.progressLabel}>
                  Last 7 sessions
                </Text>
                <Text style={styles.progressValue}>
                  Avg: -{avgDelta.toFixed(1)} anxiety
                </Text>
              </View>
            </View>
          ) : (
            <Text style={styles.emptyText}>
              Complete your first session to see your progress
            </Text>
          )}
        </View>

        {/* Quick Stats */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>
            This Week
          </Text>
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {userProgress.sessionDeltas.length}
              </Text>
              <Text style={styles.statLabel}>Sessions</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {userProgress.streak}
              </Text>
              <Text style={styles.statLabel}>Day Streak</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {avgDelta > 0 ? avgDelta.toFixed(1) : '0'}
              </Text>
              <Text style={styles.statLabel}>Avg Reduction</Text>
            </View>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  greeting: {
    fontSize: 30,
    fontWeight: 'bold',
    color: '#111827',
  },
  streakBadge: {
    backgroundColor: '#dbeafe',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
  },
  streakText: {
    color: '#1e40af',
    fontWeight: '600',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
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
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  progressFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },
  progressLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  progressValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#059669',
  },
  emptyText: {
    color: '#6b7280',
    textAlign: 'center',
    paddingVertical: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#3b82f6',
  },
  statLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
}); 