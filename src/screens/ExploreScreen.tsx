import React, { useState, useMemo, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Modal, PanResponder } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { Session, Modality, Goal } from '../types';
import { SessionCard } from '../components/SessionCard';
import { ModuleCard } from '../components/ModuleCard';
import { Chip } from '../components/Chip';
import { SearchBar } from '../components/SearchBar';
import { FilterCategory, FilterSelection } from '../components/SpotifyFilterBar';
import { ExploreIcon } from '../components/icons';
import { useStore } from '../store/useStore';
import { mockSessions } from '../data/mockData';
import { mentalHealthModules, MentalHealthModule } from '../data/modules';
import { theme } from '../styles/theme';
import { ExploreScreen as ExploreScreenComponent } from '../components/ExploreScreen';

type ExploreStackParamList = {
  ExploreMain: undefined;
  ModuleDetail: { moduleId: string };
};

type ExploreScreenNavigationProp = StackNavigationProp<ExploreStackParamList, 'ExploreMain'>;

export const ExploreScreen: React.FC = () => {
  const navigation = useNavigation<ExploreScreenNavigationProp>();
  const addRecentModule = useStore(state => state.addRecentModule);
  const recentModuleIds = useStore(state => state.recentModuleIds);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [selectedSort, setSelectedSort] = useState<string>('recents');
  const [showSortModal, setShowSortModal] = useState(false);

  // Define filter categories for top nav pill filters
  const filterCategories: FilterCategory[] = [
    {
      id: 'modality',
      label: 'Modality',
      multiSelect: false,
      options: [
        { id: 'all', label: 'All Modalities' },
        { id: 'sound', label: 'Sound', badge: 12 },
        { id: 'movement', label: 'Movement', badge: 8 },
        { id: 'mindfulness', label: 'Mindfulness', badge: 15 },
        { id: 'visualization', label: 'Visualization', badge: 9 },
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
      ],
    },
  ];

  // Filter and sort modules
  const filteredModules = useMemo(() => {
    let modules = mentalHealthModules.filter(module => {
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

    // Sort modules based on selected sort option
    switch (selectedSort) {
      case 'recents':
        // Sort by recent access, then alphabetically for unaccessed modules
        modules = modules.sort((a, b) => {
          const aRecentIndex = recentModuleIds.indexOf(a.id);
          const bRecentIndex = recentModuleIds.indexOf(b.id);
          
          if (aRecentIndex !== -1 && bRecentIndex !== -1) {
            // Both are recent, sort by recent order
            return aRecentIndex - bRecentIndex;
          } else if (aRecentIndex !== -1) {
            // Only a is recent
            return -1;
          } else if (bRecentIndex !== -1) {
            // Only b is recent
            return 1;
          } else {
            // Neither is recent, sort alphabetically
            return a.title.localeCompare(b.title);
          }
        });
        break;
      case 'alphabetical':
        modules = modules.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case 'category':
        modules = modules.sort((a, b) => {
          if (a.category !== b.category) {
            return a.category.localeCompare(b.category);
          }
          return a.title.localeCompare(b.title);
        });
        break;
    }

    return modules;
  }, [searchQuery, selectedSort, recentModuleIds]);

  const handleModulePress = (moduleId: string) => {
    addRecentModule(moduleId);
    navigation.navigate('ModuleDetail', { moduleId });
  };

  const handleFilterSelectionChange = (selection: FilterSelection) => {
    // Reserved for future top nav filtering functionality
  };

  // Pan responder for swipe-to-dismiss modal
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        // Only respond to upward swipes
        return Math.abs(gestureState.dy) > Math.abs(gestureState.dx) && gestureState.dy < -10;
      },
      onPanResponderMove: (evt, gestureState) => {
        // Allow upward movement
        if (gestureState.dy < 0) {
          // Could add visual feedback here
        }
      },
      onPanResponderRelease: (evt, gestureState) => {
        // If swiped up more than 50 pixels, close modal
        if (gestureState.dy < -50) {
          setShowSortModal(false);
        }
      },
    })
  ).current;

  const titleComponent = (
    <View style={styles.titleContainer}>
      <ExploreIcon size={20} color={theme.colors.primary} focused={true} />
      <Text style={styles.titleText}>Your Library</Text>
    </View>
  );

  return (
    <ExploreScreenComponent 
      titleComponent={titleComponent}
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
      filterSelection={undefined}
      isSearchFocused={isSearchFocused}
    >
      <View style={styles.content}>
        {/* Sorting Section */}
        <View style={styles.sortingSection}>
          <TouchableOpacity 
            style={styles.sortingButton}
            onPress={() => setShowSortModal(true)}
          >
            <View style={styles.sortingHeader}>
              <Text style={styles.sortingArrow}>↓</Text>
              <Text style={styles.sortingTitle}>
                {selectedSort === 'recents' ? 'Recents' : 
                 selectedSort === 'alphabetical' ? 'Alphabetical' : 
                 'By Category'}
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Module Grid */}
        <View style={styles.moduleGrid}>
          {/* Create rows of 2 modules each */}
          {Array.from({ length: Math.ceil(filteredModules.length / 2) }, (_, rowIndex) => (
            <View key={rowIndex} style={styles.moduleRow}>
              {filteredModules.slice(rowIndex * 2, rowIndex * 2 + 2).map((module) => (
                <View key={module.id} style={styles.moduleCardWrapper}>
                  <ModuleCard
                    module={module}
                    onPress={handleModulePress}
                  />
                </View>
              ))}
            </View>
          ))}
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

        {/* Sort Modal */}
        <Modal
          visible={showSortModal}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowSortModal(false)}
        >
          <TouchableOpacity 
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setShowSortModal(false)}
          >
            <View style={styles.sortModal} {...panResponder.panHandlers}>
              {/* Modal Handle */}
              <View style={styles.modalHandle} />
              
              <View style={styles.sortModalHeader}>
                <Text style={styles.sortModalTitle}>Sort by</Text>
              </View>
              
              <View style={styles.sortOptions}>
                <TouchableOpacity 
                  style={styles.sortOption}
                  onPress={() => {
                    setSelectedSort('recents');
                    setShowSortModal(false);
                  }}
                >
                  <Text style={[
                    styles.sortOptionText,
                    selectedSort === 'recents' && styles.sortOptionTextActive
                  ]}>
                    Recents
                  </Text>
                  {selectedSort === 'recents' && (
                    <Text style={styles.checkMark}>✓</Text>
                  )}
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.sortOption}
                  onPress={() => {
                    setSelectedSort('alphabetical');
                    setShowSortModal(false);
                  }}
                >
                  <Text style={[
                    styles.sortOptionText,
                    selectedSort === 'alphabetical' && styles.sortOptionTextActive
                  ]}>
                    Alphabetical
                  </Text>
                  {selectedSort === 'alphabetical' && (
                    <Text style={styles.checkMark}>✓</Text>
                  )}
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.sortOption}
                  onPress={() => {
                    setSelectedSort('category');
                    setShowSortModal(false);
                  }}
                >
                  <Text style={[
                    styles.sortOptionText,
                    selectedSort === 'category' && styles.sortOptionTextActive
                  ]}>
                    By Category
                  </Text>
                  {selectedSort === 'category' && (
                    <Text style={styles.checkMark}>✓</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </TouchableOpacity>
        </Modal>
      </View>
    </ExploreScreenComponent>
  );
};

const styles = StyleSheet.create({
  content: {
    ...theme.common.content,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  titleText: {
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.primary,
    fontFamily: theme.typography.fontFamily,
  },
  sortingSection: {
    marginBottom: theme.spacing.xl,
  },
  sortingButton: {
    alignSelf: 'flex-start',
  },
  sortingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  sortingArrow: {
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.primary,
    fontFamily: theme.typography.fontFamily,
  },
  sortingTitle: {
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.primary,
    fontFamily: theme.typography.fontFamily,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  sortModal: {
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: theme.borders.radius.xl,
    borderTopRightRadius: theme.borders.radius.xl,
    borderWidth: theme.borders.width.thick,
    borderBottomWidth: 0,
    borderColor: theme.colors.primary,
    ...theme.shadows.medium,
    maxHeight: '50%',
    paddingBottom: 40, // Account for safe area
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: theme.colors.disabled,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  sortModalHeader: {
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.lg,
    borderBottomWidth: theme.borders.width.normal,
    borderBottomColor: theme.colors.primary,
  },
  sortModalTitle: {
    fontSize: theme.typography.sizes.xl,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.primary,
    fontFamily: theme.typography.fontFamily,
  },
  sortOptions: {
    paddingHorizontal: theme.spacing.lg,
  },
  sortOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: theme.spacing.lg,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borders.radius.md,
    paddingHorizontal: theme.spacing.lg,
    marginVertical: theme.spacing.xs,
    borderWidth: theme.borders.width.normal,
    borderColor: theme.colors.primary,
    ...theme.shadows.small,
  },
  sortOptionText: {
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.primary,
    fontFamily: theme.typography.fontFamily,
  },
  sortOptionTextActive: {
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.success,
  },
  checkMark: {
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.success,
  },
  moduleGrid: {
    gap: theme.spacing.md,
  },
  moduleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.md,
  },
  moduleCardWrapper: {
    // No additional styles needed - ModuleCard handles its own sizing
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