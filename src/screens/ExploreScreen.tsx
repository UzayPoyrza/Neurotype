import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Session, Modality, Goal } from '../types';
import { SessionCard } from '../components/SessionCard';
import { Chip } from '../components/Chip';
import { useStore } from '../store/useStore';
import { mockSessions } from '../data/mockData';
import { theme } from '../styles/theme';
import { InstagramStyleScreen } from '../components/InstagramStyleScreen';

export const ExploreScreen: React.FC = () => {
  const { filters, setFilters } = useStore();

  const modalities: (Modality | 'all')[] = ['all', 'sound', 'movement', 'mantra', 'visualization', 'somatic', 'mindfulness'];
  const goals: (Goal | 'all')[] = ['all', 'anxiety', 'focus', 'sleep'];

  const filteredSessions = mockSessions.filter(session => {
    if (filters.modality !== 'all' && session.modality !== filters.modality) return false;
    if (filters.goal !== 'all' && session.goal !== filters.goal) return false;
    return true;
  });

  return (
    <InstagramStyleScreen title="Explore">
      <View style={styles.content}>
        {/* Form-like Header */}
        <View style={styles.formHeader}>
          <View style={styles.titleField}>
            <View style={styles.infoIcon}>
              <Text style={styles.infoText}>i</Text>
            </View>
            <Text style={styles.titlePlaceholder}>Intervention Library</Text>
            <View style={styles.checkButton}>
              <Text style={styles.checkText}>✓</Text>
            </View>
          </View>
          
          <View style={styles.descriptionField}>
            <Text style={styles.descriptionPlaceholder}>Evidence-based meditation protocols</Text>
          </View>
        </View>

        {/* Filter Methodology */}
        <View style={styles.methodologySection}>
          <Text style={styles.sectionTitle}>
            FILTERING METHODOLOGY
          </Text>
          <Text style={styles.sectionSubtitle}>
            Select parameters to narrow intervention options
          </Text>

          {/* Modality Filters */}
          <View style={styles.filterSection}>
            <Text style={styles.filterLabel}>
              NEUROLOGICAL MODALITY:
            </Text>
            <View style={styles.chipsRow}>
              {modalities.map(modality => (
                <View key={modality} style={styles.chipContainer}>
                  <Chip
                    label={modality === 'all' ? 'All Modalities' : modality}
                    selected={filters.modality === modality}
                    onPress={() => setFilters({ ...filters, modality })}
                  />
                </View>
              ))}
            </View>
          </View>

          {/* Goal Filters */}
          <View style={styles.filterSection}>
            <Text style={styles.filterLabel}>
              THERAPEUTIC OUTCOME:
            </Text>
            <View style={styles.chipsRow}>
              {goals.map(goal => (
                <View key={goal} style={styles.chipContainer}>
                  <Chip
                    label={goal === 'all' ? 'All Goals' : goal}
                    selected={filters.goal === goal}
                    onPress={() => setFilters({ ...filters, goal })}
                  />
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* Results Analysis */}
        <View style={styles.resultsSection}>
          <Text style={styles.sectionTitle}>
            RESULTS ANALYSIS
          </Text>
          <View style={styles.resultsHeader}>
            <Text style={styles.resultsText}>
              {filteredSessions.length} interventions match your criteria
            </Text>
          </View>
        </View>

        {/* Intervention List */}
        <View style={styles.interventionsSection}>
          <Text style={styles.sectionTitle}>
            AVAILABLE INTERVENTIONS
          </Text>
          
          {filteredSessions.length > 0 ? (
            <View style={styles.sessionList}>
              {filteredSessions.map(session => (
                <SessionCard
                  key={session.id}
                  session={session}
                  onStart={() => {}}
                  variant="list"
                />
              ))}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>
                No interventions match current criteria
              </Text>
              <Text style={styles.emptySubtext}>
                Try adjusting your modality or goal filters
              </Text>
            </View>
          )}
        </View>

        {/* Research Notes */}
        <View style={styles.notesSection}>
          <Text style={styles.sectionTitle}>
            RESEARCH NOTES
          </Text>
          <View style={styles.notesBox}>
            <Text style={styles.notesText}>
              • All protocols based on peer-reviewed neuroscience research
            </Text>
            <Text style={styles.notesText}>
              • Efficacy measured through standardized anxiety scales
            </Text>
            <Text style={styles.notesText}>
              • Recommended session duration: 5-15 minutes for optimal results
            </Text>
            <Text style={styles.notesText}>
              • Consistency is key: aim for daily practice for 21+ days
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
  methodologySection: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: theme.typography.sizes.xl,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.primary,
    marginBottom: theme.spacing.sm,
    fontFamily: theme.typography.fontFamily,
  },
  sectionSubtitle: {
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.medium,
    color: theme.colors.secondary,
    marginBottom: theme.spacing.xl,
    fontFamily: theme.typography.fontFamily,
  },
  filterSection: {
    marginBottom: 25,
  },
  filterLabel: {
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.primary,
    marginBottom: theme.spacing.md,
    fontFamily: theme.typography.fontFamily,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.md,
  },
  chipContainer: {
    marginBottom: theme.spacing.sm,
  },
  resultsSection: {
    marginBottom: 25,
  },
  resultsHeader: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borders.radius.lg,
    padding: theme.spacing.lg,
    borderWidth: theme.borders.width.thick,
    borderColor: theme.colors.primary,
    ...theme.shadows.medium,
  },
  resultsText: {
    color: theme.colors.primary,
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.weights.semibold,
    fontFamily: theme.typography.fontFamily,
  },
  interventionsSection: {
    marginBottom: 25,
  },
  sessionList: {
    gap: theme.spacing.lg,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 50,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borders.radius.lg,
    borderWidth: theme.borders.width.thick,
    borderColor: theme.colors.primary,
    ...theme.shadows.medium,
  },
  emptyText: {
    color: theme.colors.primary,
    textAlign: 'center',
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.semibold,
    fontFamily: theme.typography.fontFamily,
  },
  emptySubtext: {
    color: theme.colors.secondary,
    textAlign: 'center',
    marginTop: theme.spacing.md,
    fontSize: theme.typography.sizes.md,
    fontFamily: theme.typography.fontFamily,
    fontWeight: theme.typography.weights.medium,
  },
  notesSection: {
    marginBottom: 20,
  },
  notesBox: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borders.radius.lg,
    padding: theme.spacing.xl,
    borderWidth: theme.borders.width.thick,
    borderColor: theme.colors.primary,
    ...theme.shadows.medium,
  },
  notesText: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.secondary,
    marginBottom: theme.spacing.sm,
    fontFamily: theme.typography.fontFamily,
    lineHeight: 20,
  },
}); 