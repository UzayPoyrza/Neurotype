import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { Session, Modality, Goal } from '../types';
import { SessionCard } from '../components/SessionCard';
import { Chip } from '../components/Chip';
import { useStore } from '../store/useStore';
import { mockSessions } from '../data/mockData';

interface ExploreScreenProps {
  onStartSession: (session: Session) => void;
}

const modalities: (Modality | 'all')[] = ['all', 'sound', 'movement', 'mantra', 'visualization', 'somatic', 'mindfulness'];
const goals: (Goal | 'all')[] = ['all', 'anxiety', 'focus', 'sleep'];

export const ExploreScreen: React.FC<ExploreScreenProps> = ({ onStartSession }) => {
  const { filters, setFilters } = useStore();

  const filteredSessions = mockSessions.filter(session => {
    const modalityMatch = filters.modality === 'all' || session.modality === filters.modality;
    const goalMatch = filters.goal === 'all' || session.goal === filters.goal;
    return modalityMatch && goalMatch;
  });

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        {/* Header */}
        <Text style={styles.header}>
          Explore
        </Text>

        {/* Modality Filters */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Modality
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsRow}>
            {modalities.map((modality) => (
              <View key={modality} style={styles.chipContainer}>
                <Chip
                  label={modality === 'all' ? 'All' : modality.charAt(0).toUpperCase() + modality.slice(1)}
                  selected={filters.modality === modality}
                  onPress={() => setFilters({ ...filters, modality })}
                  variant="modality"
                />
              </View>
            ))}
          </ScrollView>
        </View>

        {/* Goal Filters */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Goal
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsRow}>
            {goals.map((goal) => (
              <View key={goal} style={styles.chipContainer}>
                <Chip
                  label={goal === 'all' ? 'All' : goal.charAt(0).toUpperCase() + goal.slice(1)}
                  selected={filters.goal === goal}
                  onPress={() => setFilters({ ...filters, goal })}
                  variant="goal"
                />
              </View>
            ))}
          </ScrollView>
        </View>

        {/* Results Count */}
        <View style={styles.resultsCount}>
          <Text style={styles.resultsText}>
            {filteredSessions.length} session{filteredSessions.length !== 1 ? 's' : ''} found
          </Text>
        </View>

        {/* Session List */}
        <View style={styles.sessionList}>
          {filteredSessions.map((session) => (
            <SessionCard
              key={session.id}
              session={session}
              onStart={onStartSession}
              variant="list"
            />
          ))}
        </View>

        {filteredSessions.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>
              No sessions match your current filters.
            </Text>
            <Text style={styles.emptySubtext}>
              Try adjusting your selection.
            </Text>
          </View>
        )}
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
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  chipsRow: {
    flexDirection: 'row',
  },
  chipContainer: {
    marginRight: 8,
  },
  resultsCount: {
    marginBottom: 16,
  },
  resultsText: {
    color: '#6b7280',
  },
  sessionList: {
    marginBottom: 24,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyText: {
    color: '#6b7280',
    textAlign: 'center',
  },
  emptySubtext: {
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 8,
  },
}); 