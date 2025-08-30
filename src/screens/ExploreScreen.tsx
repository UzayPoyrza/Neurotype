import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { Session, Modality, Goal } from '../types';
import { SessionCard } from '../components/SessionCard';
import { ModuleCard } from '../components/ModuleCard';
import { Chip } from '../components/Chip';
import { SearchBar } from '../components/SearchBar';
import { FilterCategory, FilterSelection } from '../components/SpotifyFilterBar';
import { useStore } from '../store/useStore';
import { mockSessions } from '../data/mockData';
import { mentalHealthModules, MentalHealthModule } from '../data/modules';
import { theme } from '../styles/theme';
import { ExploreScreen as ExploreScreenComponent } from '../components/ExploreScreen';

export const ExploreScreen: React.FC = () => {
  const setActiveModuleId = useStore(state => state.setActiveModuleId);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Define filter categories for module filtering
  const filterCategories: FilterCategory[] = [
    {
      id: 'category',
      label: 'Category',
      multiSelect: false,
      options: [
        { id: 'all', label: 'All Categories' },
        { id: 'disorder', label: 'Mental Health Disorders', badge: 6 },
        { id: 'wellness', label: 'Wellness & Recovery', badge: 3 },
        { id: 'skill', label: 'Skills & Techniques', badge: 3 },
      ],
    },
  ];

  // Filter modules based on search and category
  const filteredModules = useMemo(() => {
    return mentalHealthModules.filter(module => {
      // Filter by category
      if (selectedCategory !== 'all' && module.category !== selectedCategory) {
        return false;
      }
      
      // Filter by search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = module.title.toLowerCase().includes(query);
        const matchesDescription = module.description.toLowerCase().includes(query);
        
        if (!matchesTitle && !matchesDescription) {
          return false;
        }
      }
      
      return true;
    });
  }, [searchQuery, selectedCategory]);

  const handleModulePress = (moduleId: string) => {
    setActiveModuleId(moduleId);
  };

  const handleFilterSelectionChange = (selection: FilterSelection) => {
    if (selection.parentId === 'category') {
      setSelectedCategory(selection.optionIds[0] || 'all');
    }
  };

  return (
    <ExploreScreenComponent 
      searchComponent={
        <SearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search mental health modules..."
          onFocus={() => setIsSearchFocused(true)}
          onBlur={() => setIsSearchFocused(false)}
        />
      }
      filterCategories={filterCategories}
      onFilterSelectionChange={handleFilterSelectionChange}
      filterSelection={{ parentId: 'category', optionIds: [selectedCategory] }}
      isSearchFocused={isSearchFocused}
    >
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Mental Health Modules</Text>
          <Text style={styles.headerSubtitle}>
            Choose a module to explore guided meditations
          </Text>
        </View>

        {/* Module Grid */}
        <View style={styles.moduleGrid}>
          <FlatList
            data={filteredModules}
            renderItem={({ item }) => (
              <ModuleCard
                module={item}
                onPress={handleModulePress}
              />
            )}
            keyExtractor={(item) => item.id}
            numColumns={2}
            columnWrapperStyle={styles.row}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.gridContainer}
            ItemSeparatorComponent={() => <View style={{ height: theme.spacing.md }} />}
          />
        </View>

        {/* Empty State */}
        {filteredModules.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>
              No modules match your search
            </Text>
            <Text style={styles.emptySubtext}>
              Try adjusting your search or category filter
            </Text>
          </View>
        )}
      </View>
    </ExploreScreenComponent>
  );
};

const styles = StyleSheet.create({
  content: {
    ...theme.common.content,
  },
  header: {
    marginBottom: theme.spacing.xl,
  },
  headerTitle: {
    fontSize: theme.typography.sizes.xxl,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.primary,
    fontFamily: theme.typography.fontFamily,
    marginBottom: theme.spacing.sm,
  },
  headerSubtitle: {
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.medium,
    color: theme.colors.secondary,
    fontFamily: theme.typography.fontFamily,
  },
  moduleGrid: {
    flex: 1,
  },
  gridContainer: {
    paddingBottom: theme.spacing.xl,
  },
  row: {
    justifyContent: 'space-between',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borders.radius.lg,
    borderWidth: theme.borders.width.thick,
    borderColor: theme.colors.primary,
    ...theme.shadows.medium,
    marginTop: theme.spacing.xl,
  },
  emptyText: {
    color: theme.colors.primary,
    textAlign: 'center',
    fontSize: theme.typography.sizes.lg,
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
}); 