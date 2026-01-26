import React, { useState, useMemo, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Modal, PanResponder } from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming, 
  withSequence,
  withDelay,
  withRepeat,
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
import { PinIcon } from '../components/icons/PinIcon';
import { RecentIcon } from '../components/icons/RecentIcon';
import { AlphabeticalIcon } from '../components/icons/AlphabeticalIcon';
import { CategoryIcon } from '../components/icons/CategoryIcon';
import { ExploreIcon } from '../components/icons';
import { useStore } from '../store/useStore';
import { mentalHealthModules, MentalHealthModule } from '../data/modules';
import { theme } from '../styles/theme';
import { ExploreScreen as ExploreScreenComponent } from '../components/ExploreScreen';
import { getAllSessions } from '../services/sessionService';

type ExploreStackParamList = {
  ExploreMain: undefined;
  ModuleDetail: { moduleId: string };
  MeditationDetail: { sessionId: string };
};

type ExploreScreenNavigationProp = StackNavigationProp<ExploreStackParamList, 'ExploreMain'>;

// Animated Current Module Indicator Component
const CurrentModuleIndicator: React.FC<{ isVisible: boolean }> = ({ isVisible }) => {
  const opacity = useSharedValue(isVisible ? 1 : 0);
  const scale = useSharedValue(isVisible ? 1 : 0.8);
  const pulseScale = useSharedValue(1);

  useEffect(() => {
    if (isVisible) {
      // Fade in and scale up animation
      opacity.value = withTiming(1, { duration: 400, easing: Easing.out(Easing.cubic) });
      scale.value = withTiming(1, { duration: 400, easing: Easing.out(Easing.back(1.2)) });
      
      // Subtle pulse animation
      pulseScale.value = withRepeat(
        withSequence(
          withTiming(1.05, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        false
      );
    } else {
      opacity.value = withTiming(0, { duration: 200 });
      scale.value = withTiming(0.8, { duration: 200 });
      pulseScale.value = 1;
    }
  }, [isVisible]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { scale: scale.value * pulseScale.value }
    ],
  }));

  return (
    <Animated.View style={[styles.currentModuleBadge, animatedStyle]} pointerEvents="none">
      <Text style={styles.currentModuleText}>Current Module</Text>
    </Animated.View>
  );
};

export const ExploreScreen: React.FC = () => {
  const navigation = useNavigation<ExploreScreenNavigationProp>();
  const addRecentModule = useStore(state => state.addRecentModule);
  const recentModuleIds = useStore(state => state.recentModuleIds);
  const globalBackgroundColor = useStore(state => state.globalBackgroundColor);
  const setGlobalBackgroundColor = useStore(state => state.setGlobalBackgroundColor);
  const setCurrentScreen = useStore(state => state.setCurrentScreen);
  const likedSessionIds = useStore(state => state.likedSessionIds);
  const todayModuleId = useStore(state => state.todayModuleId);
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
  const [allSessions, setAllSessions] = useState<any[]>([]);

  // Set screen context when component mounts
  useEffect(() => {
    setCurrentScreen('explore');
  }, [setCurrentScreen]);

  // Fetch all sessions for liked meditations count only
  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const sessions = await getAllSessions();
        setAllSessions(sessions);
        console.log('[ExploreScreen] ✅ Fetched sessions for liked meditations count:', sessions.length);
      } catch (error) {
        console.error('Error fetching sessions for liked meditations:', error);
      }
    };
    fetchSessions();
  }, []);

  // Define filter categories for top nav pill filters
  const filterCategories: FilterCategory[] = [];

  // Get liked sessions from database
  const likedSessions = allSessions.filter(session => likedSessionIds.includes(session.id));

  // Filter and sort modules
  const filteredModules = useMemo(() => {
    
    // Create pinned "Liked Meditations" item (always show, even when empty)
    const likedMeditationsItem = {
      id: 'liked-meditations',
      title: 'Liked Meditations',
      description: 'View hearted meditations',
      category: 'wellness' as const, // Category for display, but it's its own special item
      color: '#E74C3C',
      meditationCount: likedSessions.length,
      isPinned: true,
      isLikedMeditations: true, // Special flag to identify this as liked meditations
      likedSessions: likedSessions, // Store the actual liked sessions
    };

    // Start with all modules, including the pinned item
    let allModules = [likedMeditationsItem, ...mentalHealthModules];

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      allModules = allModules.filter(module => {
        // Check if title starts with the query
        const matchesTitle = module.title.toLowerCase().startsWith(query);
        // Check if category starts with the query
        const matchesCategory = module.category.toLowerCase().startsWith(query);
        return matchesTitle || matchesCategory;
      });
    }

    // Separate pinned and non-pinned modules
    const pinnedModules = allModules.filter(module => 'isPinned' in module && module.isPinned);
    const regularModules = allModules.filter(module => !('isPinned' in module && module.isPinned));

    // Sort regular modules based on selected sort option
    switch (selectedSort) {
      case 'recents':
        // Sort by recent access, then alphabetically for unaccessed modules
        regularModules.sort((a, b) => {
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
          }
          return a.title.localeCompare(b.title);
        });
        break;
      case 'alphabetical':
        regularModules.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case 'category':
        regularModules.sort((a, b) => {
          if (a.category !== b.category) {
            return a.category.localeCompare(b.category);
          }
          return a.title.localeCompare(b.title);
        });
        break;
    }

    // Return pinned modules first, then regular modules
    return [...pinnedModules, ...regularModules];
  }, [searchQuery, selectedSort, recentModuleIds, likedSessionIds, likedSessions]);

  const handleModulePress = (moduleId: string) => {
    console.log('[ExploreScreen] 👆 User clicked module:', moduleId);
    addRecentModule(moduleId);
    // Don't change global background color - let the detail screen handle its own background
    console.log('[ExploreScreen] 🚀 Navigating to ModuleDetail for:', moduleId);
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

  // Shuffle animation for modules (excluding pinned items)
  const triggerShuffleAnimation = () => {
    setIsShuffling(true);
    
    // Fall down animation for non-pinned modules only
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
    <View style={[styles.container, { backgroundColor: globalBackgroundColor }]}>
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
                <View style={styles.sortingTitleContainer}>
                  {selectedSort === 'recents' ? (
                    <>
                      <RecentIcon size={20} color="#000000" />
                      <Text style={[styles.sortingTitle, { marginLeft: 6 }]}>Recents</Text>
                    </>
                  ) : selectedSort === 'alphabetical' ? (
                    <>
                      <AlphabeticalIcon size={20} color="#141124" />
                      <Text style={[styles.sortingTitle, { marginLeft: 6 }]}>Alphabetical</Text>
                    </>
                  ) : (
                    <>
                      <CategoryIcon size={20} color="#141124" />
                      <Text style={[styles.sortingTitle, { marginLeft: 6 }]}>By Category</Text>
                    </>
                  )}
                </View>
                <Text style={styles.sortingArrow}>⌄</Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Module Grid */}
          <View style={styles.moduleGrid}>
            {/* Create rows of 2 modules each, with pinned item in first position */}
            {Array.from({ length: Math.ceil(filteredModules.length / 2) }, (_, rowIndex) => {
              const modulesInRow = filteredModules.slice(rowIndex * 2, rowIndex * 2 + 2);
              const isLastRow = rowIndex === Math.ceil(filteredModules.length / 2) - 1;
              const hasOnlyOneCard = modulesInRow.length === 1 && isLastRow;
              const isSearching = searchQuery.trim().length > 0;
              
              return (
                <View key={rowIndex} style={styles.moduleRow}>
                  {modulesInRow.map((module, moduleIndex) => {
                    const isPinned = 'isPinned' in module && module.isPinned;
                    const isCurrentModule = module.id === todayModuleId;
                  
                  // Apply animation only to non-pinned modules
                  if (isPinned) {
                    return (
                      <View key={module.id} style={[
                        styles.moduleCardWrapper,
                        // Only apply single card wrapper if we're not searching and it's the only card in the last row
                        hasOnlyOneCard && !isSearching && styles.singleCardWrapper
                      ]}>
                        <TouchableOpacity
                          style={[
                            styles.moduleCard,
                            styles.pinnedModuleCard
                          ]}
                          onPress={() => handleModulePress(module.id)}
                          activeOpacity={0.8}
                        >
                          <View style={styles.moduleCardHeader}>
                            <View style={styles.moduleHeaderLeft}>
                              <View style={[styles.moduleIndicator, { backgroundColor: module.color }]} />
                              <Text style={styles.moduleCategory}>
                                {('isLikedMeditations' in module && module.isLikedMeditations) 
                                  ? 'PINNED' 
                                  : module.category.toUpperCase()}
                              </Text>
                            </View>
                            <View style={styles.pinBadge}>
                              <PinIcon size={14} color="#000000" />
                            </View>
                          </View>
                          
                          <Text style={[
                            styles.moduleTitle,
                            styles.pinnedModuleTitle
                          ]} numberOfLines={2} ellipsizeMode="tail">
                            {module.title}
                          </Text>
                          <Text style={[
                            styles.moduleDescription,
                            ('isLikedMeditations' in module && module.isLikedMeditations) 
                              ? styles.likedMeditationsDescription 
                              : styles.pinnedModuleDescription
                          ]} numberOfLines={2}>
                            {module.description}
                          </Text>
                          
                          <View style={styles.moduleFooter}>
                            <CurrentModuleIndicator isVisible={isCurrentModule} />
                            <View style={styles.moduleArrow}>
                              <Text style={styles.moduleArrowText}>→</Text>
                            </View>
                          </View>
                        </TouchableOpacity>
                      </View>
                    );
                  } else {
                    // Non-pinned modules get the animation
                    return (
                      <Animated.View key={module.id} style={[
                        styles.moduleCardWrapper,
                        // Only apply single card wrapper if we're not searching and it's the only card in the last row
                        hasOnlyOneCard && !isSearching && styles.singleCardWrapper,
                        moduleGridAnimatedStyle
                      ]}>
                        <TouchableOpacity
                          style={styles.moduleCard}
                          onPress={() => handleModulePress(module.id)}
                          activeOpacity={0.8}
                        >
                          <View style={styles.moduleCardHeader}>
                            <View style={styles.moduleHeaderLeft}>
                              <View style={[styles.moduleIndicator, { backgroundColor: module.color }]} />
                              <Text style={styles.moduleCategory}>{module.category.toUpperCase()}</Text>
                            </View>
                          </View>
                          
                          <Text style={styles.moduleTitle} numberOfLines={1} ellipsizeMode="tail">
                            {module.title}
                          </Text>
                          <Text style={[
                            styles.moduleDescription,
                            ('isLikedMeditations' in module && module.isLikedMeditations) 
                              ? styles.likedMeditationsDescription 
                              : null
                          ]} numberOfLines={2}>
                            {module.description}
                          </Text>
                          
                          <View style={styles.moduleFooter}>
                            <CurrentModuleIndicator isVisible={isCurrentModule} />
                            <View style={styles.moduleArrow}>
                              <Text style={styles.moduleArrowText}>→</Text>
                            </View>
                          </View>
                        </TouchableOpacity>
                      </Animated.View>
                    );
                  }
                  })}
                </View>
              );
            })}
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
                    <View style={styles.sortOptionTextContainer}>
                      <RecentIcon size={18} color={selectedSort === 'recents' ? '#000000' : '#8e8e93'} />
                      <Text style={[
                        styles.sortOptionText,
                        selectedSort === 'recents' && styles.sortOptionTextActive,
                        { marginLeft: 6 }
                      ]}>
                        Recents
                      </Text>
                    </View>
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
                    <View style={styles.sortOptionTextContainer}>
                      <AlphabeticalIcon size={18} color={selectedSort === 'alphabetical' ? '#141124' : '#8e8e93'} />
                      <Text style={[
                        styles.sortOptionText,
                        selectedSort === 'alphabetical' && styles.sortOptionTextActive,
                        { marginLeft: 6 }
                      ]}>
                        Alphabetical
                      </Text>
                    </View>
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
                    <View style={styles.sortOptionTextContainer}>
                      <CategoryIcon size={18} color={selectedSort === 'category' ? '#141124' : '#8e8e93'} />
                      <Text style={[
                        styles.sortOptionText,
                        selectedSort === 'category' && styles.sortOptionTextActive,
                        { marginLeft: 6 }
                      ]}>
                        By Category
                      </Text>
                    </View>
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
  ...theme.health, // Use global Apple Health styles
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
    ...theme.health.card,
    marginBottom: 20,
  },
  sortingButton: {
    padding: 16,
  },
  sortingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sortingTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sortingTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000000',
  },
  sortOptionTextContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sortingArrow: {
    fontSize: 16,
    fontWeight: '500',
    color: '#8e8e93',
  },
  moduleGrid: {
    gap: 12,
  },
  // Pinned Module Styles
  pinnedModuleCard: {
    borderWidth: 2,
    borderColor: '#FF6B6B',
    shadowColor: '#FF6B6B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 6,
  },
  pinnedModuleTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 4,
    lineHeight: 20,
  },
  pinnedModuleDescription: {
    fontSize: 13,
    color: '#333333',
    fontWeight: '500',
    lineHeight: 17,
  },
  likedMeditationsDescription: {
    fontSize: 12,
    color: '#8e8e93',
    fontWeight: '400',
    lineHeight: 16,
  },
  pinBadge: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#000000',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
  },
  pinIcon: {
    fontSize: 14,
    color: '#FF6B6B',
    fontWeight: '700',
  },
  pinnedSessionCount: {
    fontSize: 13,
    color: '#555555',
    fontWeight: '600',
  },
  moduleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  moduleCardWrapper: {
    flex: 1,
    marginHorizontal: 6,
  },
  singleCardWrapper: {
    flex: 0,
    width: '48%', // Take up about half the width instead of full width
  },
  moduleCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    height: 140, // Fixed height for consistency
    justifyContent: 'space-between', // Distribute content evenly
  },
  moduleCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8, // Reduced from 12
  },
  moduleHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
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
    fontSize: 16, // Slightly smaller to fit better
    fontWeight: '600',
    color: '#000000',
    marginBottom: 4, // Reduced from 6
    lineHeight: 20, // Add line height for better control
  },
  moduleDescription: {
    fontSize: 12, // Slightly smaller
    color: '#8e8e93',
    fontWeight: '400',
    lineHeight: 16, // Tighter line height
    marginBottom: 8, // Reduced from 12
    flex: 1, // Take available space
  },
  moduleFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 'auto', // Push to bottom
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
  currentModuleBadge: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  currentModuleText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFFFFF',
    letterSpacing: 0.3,
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
    height: 0,
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