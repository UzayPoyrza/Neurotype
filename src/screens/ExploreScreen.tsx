import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Session, Modality, Goal } from '../types';
import { SessionCard } from '../components/SessionCard';
import { Chip } from '../components/Chip';
import { SearchBar } from '../components/SearchBar';
import { FilterCategory, FilterSelection } from '../components/SpotifyFilterBar';
import { useStore } from '../store/useStore';
import { mockSessions } from '../data/mockData';
import { theme } from '../styles/theme';
import { ExploreScreen as ExploreScreenComponent } from '../components/ExploreScreen';

export const ExploreScreen: React.FC = () => {
  const { filters, setFilters } = useStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [filterSelection, setFilterSelection] = useState<FilterSelection | undefined>();

  // Define filter categories for Spotify-style filter bar
  const filterCategories: FilterCategory[] = [
    {
      id: 'modality',
      label: 'Modality',
      multiSelect: false,
      options: [
        { id: 'all', label: 'All Modalities' },
        { id: 'sound', label: 'Sound', badge: 12 },
        { id: 'movement', label: 'Movement', badge: 8 },
        { id: 'mantra', label: 'Mantra', badge: 6 },
        { id: 'visualization', label: 'Visualization', badge: 9 },
        { id: 'somatic', label: 'Somatic', badge: 5 },
        { id: 'mindfulness', label: 'Mindfulness', badge: 15 },
      ],
    },
    {
      id: 'goal',
      label: 'Goal',
      multiSelect: true,
      options: [
        { id: 'all', label: 'All Goals' },
        { id: 'anxiety', label: 'Anxiety Relief', badge: 18 },
        { id: 'focus', label: 'Focus & Clarity', badge: 14 },
        { id: 'sleep', label: 'Better Sleep', badge: 11 },
        { id: 'stress', label: 'Stress Reduction', badge: 16 },
        { id: 'creativity', label: 'Creativity', badge: 7 },
      ],
    },
    {
      id: 'duration',
      label: 'Duration',
      multiSelect: false,
      options: [
        { id: 'all', label: 'Any Duration' },
        { id: 'short', label: 'Short (5-10 min)', badge: 22 },
        { id: 'medium', label: 'Medium (10-20 min)', badge: 18 },
        { id: 'long', label: 'Long (20+ min)', badge: 8 },
      ],
    },
    {
      id: 'level',
      label: 'Level',
      multiSelect: false,
      options: [
        { id: 'all', label: 'All Levels' },
        { id: 'beginner', label: 'Beginner', badge: 25 },
        { id: 'intermediate', label: 'Intermediate', badge: 15 },
        { id: 'advanced', label: 'Advanced', badge: 8 },
      ],
    },
  ];

  const modalities: (Modality | 'all')[] = ['all', 'sound', 'movement', 'mantra', 'visualization', 'somatic', 'mindfulness'];
  const goals: (Goal | 'all')[] = ['all', 'anxiety', 'focus', 'sleep'];

  const filteredSessions = useMemo(() => {
    return mockSessions.filter(session => {
      // Filter by Spotify filter bar selections
      if (filterSelection) {
        const { parentId, optionIds } = filterSelection;
        
        if (parentId === 'modality' && !optionIds.includes('all')) {
          if (!optionIds.includes(session.modality)) return false;
        }
        
        if (parentId === 'goal' && !optionIds.includes('all')) {
          if (!optionIds.includes(session.goal)) return false;
        }
        
        // Add more filtering logic for duration and level when those fields are added to sessions
      }
      
      // Legacy filtering (keeping for backward compatibility)
      if (filters.modality !== 'all' && session.modality !== filters.modality) return false;
      if (filters.goal !== 'all' && session.goal !== filters.goal) return false;
      
      // Filter by search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = session.title.toLowerCase().includes(query);
        const matchesModality = session.modality.toLowerCase().includes(query);
        const matchesGoal = session.goal.toLowerCase().includes(query);
        
        if (!matchesTitle && !matchesModality && !matchesGoal) {
          return false;
        }
      }
      
      return true;
    });
  }, [filters, searchQuery, filterSelection]);

  const handleFilterSelectionChange = (selection: FilterSelection) => {
    setFilterSelection(selection);
  };

  return (
    <ExploreScreenComponent 
      searchComponent={
        <SearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search interventions..."
          onFocus={() => setIsSearchFocused(true)}
          onBlur={() => setIsSearchFocused(false)}
        />
      }
      filterCategories={filterCategories}
      onFilterSelectionChange={handleFilterSelectionChange}
      filterSelection={filterSelection}
      isSearchFocused={isSearchFocused}
    >
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
    </ExploreScreenComponent>
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