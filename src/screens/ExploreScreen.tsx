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
    <View style={styles.container}>
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
          <View style={styles.sortingCard}>
            <TouchableOpacity 
              style={styles.sortingButton}
              onPress={() => setShowSortModal(true)}
            >
              <View style={styles.sortingHeader}>
                <Text style={styles.sortingTitle}>
                  {selectedSort === 'recents' ? '📚 Recents' : 
                   selectedSort === 'alphabetical' ? '🔤 Alphabetical' : 
                   '📂 By Category'}
                </Text>
                <Text style={styles.sortingArrow}>⌄</Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Module Grid */}
          <Animated.View style={[styles.moduleGrid, moduleGridAnimatedStyle]}>
            {filteredModules.map((module) => (
              <View key={module.id} style={styles.moduleCardWrapper}>
                <TouchableOpacity
                  style={styles.moduleCard}
                  onPress={() => handleModulePress(module.id)}
                  activeOpacity={0.8}
                >
                  <View style={styles.moduleCardHeader}>
                    <View style={[styles.moduleIndicator, { backgroundColor: module.color }]} />
                    <Text style={styles.moduleCategory}>{module.category.toUpperCase()}</Text>
                  </View>
                  
                  <Text style={styles.moduleTitle}>{module.title}</Text>
                  <Text style={styles.moduleDescription} numberOfLines={2}>
                    {module.description}
                  </Text>
                  
                  <View style={styles.moduleFooter}>
                    <Text style={styles.sessionCount}>
                      {module.meditationCount} sessions
                    </Text>
                    <View style={styles.moduleArrow}>
                      <Text style={styles.moduleArrowText}>→</Text>
                    </View>
                  </View>
                </TouchableOpacity>
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
                  <View style={styles.dragHandle} />
                  <Text style={styles.sortModalTitle}>Sort by</Text>
                </View>
                
                <View style={styles.sortOptions}>
                  <TouchableOpacity 
                    style={[styles.sortOption, selectedSort === 'recents' && styles.sortOptionActive]}
                    onPress={() => {
                      if (selectedSort !== 'recents') {
                        setShowSortModal(false);
                        setTimeout(() => {
                          setSelectedSort('recents');
                          triggerShuffleAnimation();
                        }, 250);
                      } else {
                        setShowSortModal(false);
                      }
                    }}
                  >
                    <Text style={[
                      styles.sortOptionText,
                      selectedSort === 'recents' && styles.sortOptionTextActive
                    ]}>
                      📚 Recents
                    </Text>
                    {selectedSort === 'recents' && (
                      <Text style={styles.checkMark}>✓</Text>
                    )}
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={[styles.sortOption, selectedSort === 'alphabetical' && styles.sortOptionActive]}
                    onPress={() => {
                      if (selectedSort !== 'alphabetical') {
                        setShowSortModal(false);
                        setTimeout(() => {
                          setSelectedSort('alphabetical');
                          triggerShuffleAnimation();
                        }, 250);
                      } else {
                        setShowSortModal(false);
                      }
                    }}
                  >
                    <Text style={[
                      styles.sortOptionText,
                      selectedSort === 'alphabetical' && styles.sortOptionTextActive
                    ]}>
                      🔤 Alphabetical
                    </Text>
                    {selectedSort === 'alphabetical' && (
                      <Text style={styles.checkMark}>✓</Text>
                    )}
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={[styles.sortOption, selectedSort === 'category' && styles.sortOptionActive]}
                    onPress={() => {
                      if (selectedSort !== 'category') {
                        setShowSortModal(false);
                        setTimeout(() => {
                          setSelectedSort('category');
                          triggerShuffleAnimation();
                        }, 250);
                      } else {
                        setShowSortModal(false);
                      }
                    }}
                  >
                    <Text style={[
                      styles.sortOptionText,
                      selectedSort === 'category' && styles.sortOptionTextActive
                    ]}>
                      📂 By Category
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

          {/* Bottom spacing */}
          <View style={styles.bottomSpacing} />
        </View>
      </ExploreScreenComponent>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f2f2f7', // iOS system background
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 120,
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
  sortingCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  sortingButton: {
    padding: 16,
  },
  sortingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sortingTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000000',
  },
  sortingArrow: {
    fontSize: 16,
    fontWeight: '500',
    color: '#8e8e93',
  },
  moduleGrid: {
    gap: 12,
  },
  moduleCardWrapper: {
    marginBottom: 12,
  },
  moduleCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  moduleCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  moduleIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  moduleCategory: {
    fontSize: 11,
    fontWeight: '600',
    color: '#8e8e93',
    letterSpacing: 0.5,
  },
  moduleTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 8,
  },
  moduleDescription: {
    fontSize: 15,
    color: '#8e8e93',
    fontWeight: '400',
    lineHeight: 20,
    marginBottom: 16,
  },
  moduleFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sessionCount: {
    fontSize: 13,
    color: '#8e8e93',
    fontWeight: '500',
  },
  moduleArrow: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#f2f2f7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  moduleArrowText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  emptyText: {
    color: '#000000',
    textAlign: 'center',
    fontSize: 17,
    fontWeight: '600',
  },
  emptySubtext: {
    color: '#8e8e93',
    textAlign: 'center',
    marginTop: 8,
    fontSize: 15,
    fontWeight: '400',
  },
  bottomSpacing: {
    height: 40,
  },
  // Modal styles
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
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
    maxHeight: '50%',
    paddingBottom: 40,
  },
  sortModalHeader: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f2f2f7',
  },
  dragHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#c7c7cc',
    marginBottom: 16,
  },
  sortModalTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000000',
  },
  sortOptions: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  sortOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f2f2f7',
  },
  sortOptionActive: {
    backgroundColor: '#f2f2f7',
    borderRadius: 12,
    marginHorizontal: -12,
    paddingHorizontal: 12,
    borderBottomWidth: 0,
    marginBottom: 4,
  },
  sortOptionText: {
    fontSize: 17,
    fontWeight: '400',
    color: '#000000',
  },
  sortOptionTextActive: {
    fontWeight: '600',
    color: '#007AFF',
  },
  checkMark: {
    fontSize: 17,
    fontWeight: '600',
    color: '#007AFF',
  },
  cancelButton: {
    backgroundColor: '#ff3b30',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
    marginTop: 16,
    marginHorizontal: 20,
    alignSelf: 'center',
  },
  cancelButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#ffffff',
    textAlign: 'center',
  },
}); 