import React, { useState, useMemo, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Modal, PanResponder } from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming, 
  withSequence,
  withDelay,
  Easing,
  runOnJS 
} from 'react-native-reanimated';
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
  const [modalVisible, setModalVisible] = useState(false);
  const overlayOpacity = useSharedValue(0);
  const modalTranslateY = useSharedValue(300); // Start below screen
  const [isShuffling, setIsShuffling] = useState(false);
  const moduleOpacity = useSharedValue(1);
  const moduleScale = useSharedValue(1);

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

  // Animate modal when visibility changes
  useEffect(() => {
    if (showSortModal) {
      // Show modal immediately
      setModalVisible(true);
      
      // Reset modal position immediately before animating
      modalTranslateY.value = 300; // Start below screen
      overlayOpacity.value = 0;
      
      // Animate both overlay and modal smoothly - slide up from bottom
      overlayOpacity.value = withTiming(1, { duration: 150 });
      modalTranslateY.value = withTiming(0, { 
        duration: 400, 
        easing: Easing.out(Easing.cubic) 
      });
    } else {
      // Animate out - slide back down faster
      overlayOpacity.value = withTiming(0, { duration: 100 });
      modalTranslateY.value = withTiming(300, { 
        duration: 200, 
        easing: Easing.in(Easing.cubic) 
      });
      
      // Hide modal after animation completes
      setTimeout(() => {
        setModalVisible(false);
      }, 200);
    }
  }, [showSortModal]);

  // Animated styles using reanimated
  const overlayAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: overlayOpacity.value,
    };
  });

  const modalAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: modalTranslateY.value }],
    };
  });

  const moduleGridAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: moduleOpacity.value,
      transform: [{ scale: moduleScale.value }],
    };
  });

  // Shuffle animation for modules
  const triggerShuffleAnimation = () => {
    setIsShuffling(true);
    
    // Fall down animation
    moduleOpacity.value = withTiming(0, { duration: 200 });
    moduleScale.value = withTiming(0.8, { duration: 200 });
    
    // After falling, shuffle back up
    setTimeout(() => {
      moduleOpacity.value = withTiming(1, { duration: 300, easing: Easing.out(Easing.back(1.2)) });
      moduleScale.value = withTiming(1, { duration: 300, easing: Easing.out(Easing.back(1.2)) });
      setIsShuffling(false);
    }, 250);
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
        // If swiped up more than 50 pixels, close modal with animation
        if (gestureState.dy < -50) {
          setShowSortModal(false); // This will trigger the useEffect animation
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
        <Animated.View style={[styles.moduleGrid, moduleGridAnimatedStyle]}>
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
        </Animated.View>

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
          visible={modalVisible}
          animationType="none"
          transparent={true}
          onRequestClose={() => setShowSortModal(false)}
        >
          <View style={styles.modalContainer}>
            <Animated.View 
              style={[styles.modalOverlay, overlayAnimatedStyle]}
            />
            <TouchableOpacity 
              style={styles.overlayTouchable}
              activeOpacity={1}
              onPress={() => setShowSortModal(false)}
            />
            <Animated.View 
              style={[styles.sortModal, modalAnimatedStyle]} 
              {...panResponder.panHandlers}
            >
              <View style={styles.sortModalHeader}>
                <Text style={styles.sortModalTitle}>Sort by</Text>
              </View>
              
              <View style={styles.sortOptions}>
                <TouchableOpacity 
                  style={styles.sortOption}
                  onPress={() => {
                    if (selectedSort !== 'recents') {
                      setShowSortModal(false);
                      // Trigger shuffle after modal closes
                      setTimeout(() => {
                        setSelectedSort('recents');
                        triggerShuffleAnimation();
                      }, 250); // Wait for modal to close
                    } else {
                      setShowSortModal(false);
                    }
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
                    if (selectedSort !== 'alphabetical') {
                      setShowSortModal(false);
                      // Trigger shuffle after modal closes
                      setTimeout(() => {
                        setSelectedSort('alphabetical');
                        triggerShuffleAnimation();
                      }, 250); // Wait for modal to close
                    } else {
                      setShowSortModal(false);
                    }
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
                    if (selectedSort !== 'category') {
                      setShowSortModal(false);
                      // Trigger shuffle after modal closes
                      setTimeout(() => {
                        setSelectedSort('category');
                        triggerShuffleAnimation();
                      }, 250); // Wait for modal to close
                    } else {
                      setShowSortModal(false);
                    }
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
              
              <TouchableOpacity 
                style={styles.cancelButton}
                onPress={() => setShowSortModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </Animated.View>
          </View>
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
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  overlayTouchable: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
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
  sortModalHeader: {
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.lg,
    borderBottomWidth: theme.borders.width.normal,
    borderBottomColor: theme.colors.primary,
  },
  cancelButton: {
    backgroundColor: theme.colors.background,
    borderWidth: theme.borders.width.normal,
    borderColor: '#ff4444',
    borderRadius: theme.borders.radius.md,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    marginBottom: theme.spacing.lg,
    alignSelf: 'center',
    ...theme.shadows.small,
  },
  cancelButtonText: {
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.semibold,
    color: '#ff4444',
    fontFamily: theme.typography.fontFamily,
    textAlign: 'center',
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
    minHeight: 600, // Ensure enough height for web scrolling
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