import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SpotifyFilterBar, FilterCategory, FilterSelection } from './SpotifyFilterBar';
import { theme } from '../styles/theme';

export const SpotifyFilterBarDemo: React.FC = () => {
  const [filterSelection, setFilterSelection] = useState<FilterSelection | undefined>();

  // Sample filter categories for demonstration
  const demoCategories: FilterCategory[] = [
    {
      id: 'genre',
      label: 'Genre',
      multiSelect: false,
      options: [
        { id: 'all', label: 'All Genres' },
        { id: 'pop', label: 'Pop', badge: 125 },
        { id: 'rock', label: 'Rock', badge: 89 },
        { id: 'jazz', label: 'Jazz', badge: 45 },
        { id: 'classical', label: 'Classical', badge: 67 },
        { id: 'electronic', label: 'Electronic', badge: 78 },
      ],
    },
    {
      id: 'mood',
      label: 'Mood',
      multiSelect: true,
      options: [
        { id: 'all', label: 'All Moods' },
        { id: 'energetic', label: 'Energetic', badge: 156 },
        { id: 'chill', label: 'Chill', badge: 134 },
        { id: 'focused', label: 'Focused', badge: 98 },
        { id: 'romantic', label: 'Romantic', badge: 67 },
        { id: 'workout', label: 'Workout', badge: 89 },
      ],
    },
    {
      id: 'duration',
      label: 'Duration',
      multiSelect: false,
      options: [
        { id: 'all', label: 'Any Length' },
        { id: 'short', label: 'Short (< 3 min)', badge: 234 },
        { id: 'medium', label: 'Medium (3-6 min)', badge: 456 },
        { id: 'long', label: 'Long (> 6 min)', badge: 178 },
      ],
    },
  ];

  const handleFilterSelectionChange = (selection: FilterSelection) => {
    setFilterSelection(selection);
    console.log('Filter selection changed:', selection);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Spotify Filter Bar Demo</Text>
      
      <SpotifyFilterBar
        categories={demoCategories}
        onSelectionChange={handleFilterSelectionChange}
        initialSelection={filterSelection}
      />
      
      <ScrollView style={styles.content}>
        <View style={styles.selectionInfo}>
          <Text style={styles.sectionTitle}>Current Selection:</Text>
          {filterSelection ? (
            <View style={styles.selectionDetails}>
              <Text style={styles.selectionText}>
                Category: {filterSelection.parentId}
              </Text>
              <Text style={styles.selectionText}>
                Options: {filterSelection.optionIds.join(', ')}
              </Text>
            </View>
          ) : (
            <Text style={styles.noSelection}>No filters selected</Text>
          )}
        </View>
        
        <View style={styles.features}>
          <Text style={styles.sectionTitle}>Features:</Text>
          <Text style={styles.featureText}>• Horizontal scrolling primary filters</Text>
          <Text style={styles.featureText}>• Tap to reveal secondary options</Text>
          <Text style={styles.featureText}>• Smooth slide/fade animations</Text>
          <Text style={styles.featureText}>• Badge indicators for active selections</Text>
          <Text style={styles.featureText}>• Support for single and multi-select</Text>
          <Text style={styles.featureText}>• Fully accessible with screen reader support</Text>
          <Text style={styles.featureText}>• Responsive design for small screens</Text>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  title: {
    fontSize: theme.typography.sizes.xl,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.primary,
    textAlign: 'center',
    paddingVertical: theme.spacing.lg,
    fontFamily: theme.typography.fontFamily,
  },
  content: {
    flex: 1,
    paddingHorizontal: theme.spacing.lg,
  },
  selectionInfo: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borders.radius.lg,
    padding: theme.spacing.lg,
    marginVertical: theme.spacing.lg,
    borderWidth: theme.borders.width.normal,
    borderColor: theme.colors.primary,
    ...theme.shadows.medium,
  },
  sectionTitle: {
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.primary,
    marginBottom: theme.spacing.md,
    fontFamily: theme.typography.fontFamily,
  },
  selectionDetails: {
    gap: theme.spacing.sm,
  },
  selectionText: {
    fontSize: theme.typography.sizes.md,
    color: theme.colors.secondary,
    fontFamily: theme.typography.fontFamily,
  },
  noSelection: {
    fontSize: theme.typography.sizes.md,
    color: theme.colors.secondary,
    fontStyle: 'italic',
    fontFamily: theme.typography.fontFamily,
  },
  features: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borders.radius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
    borderWidth: theme.borders.width.normal,
    borderColor: theme.colors.primary,
    ...theme.shadows.medium,
  },
  featureText: {
    fontSize: theme.typography.sizes.md,
    color: theme.colors.secondary,
    marginBottom: theme.spacing.sm,
    fontFamily: theme.typography.fontFamily,
  },
}); 