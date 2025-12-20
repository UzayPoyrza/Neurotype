import React, { useState, useMemo } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Modal, 
  ScrollView,
  Dimensions
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { MentalHealthModule } from '../data/modules';
import { theme } from '../styles/theme';
import { useStore } from '../store/useStore';

interface ModuleGridModalProps {
  modules: MentalHealthModule[];
  selectedModuleId: string;
  isVisible: boolean;
  onModuleSelect: (moduleId: string) => void;
  onClose: () => void;
}

type SortOption = 'alphabetical' | 'category' | 'recent';

export const ModuleGridModal: React.FC<ModuleGridModalProps> = ({
  modules,
  selectedModuleId,
  isVisible,
  onModuleSelect,
  onClose,
}) => {
  const { width } = Dimensions.get('window');
  const cardWidth = (width - 48) / 2; // 2 columns with tighter padding
  const [pressedCard, setPressedCard] = useState<string | null>(null);
  const [selectedSort, setSelectedSort] = useState<SortOption>('recent');
  const [isShuffling, setIsShuffling] = useState(false);
  const recentModuleIds = useStore(state => state.recentModuleIds);
  const addRecentModule = useStore(state => state.addRecentModule);
  
  // Animation values for shuffle effect
  const moduleOpacity = useSharedValue(1);
  const moduleScale = useSharedValue(1);

  const handleModuleSelect = (moduleId: string) => {
    addRecentModule(moduleId);
    onModuleSelect(moduleId);
    onClose();
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'disorder': return '🧠';
      case 'wellness': return '🌱';
      case 'skill': return '⚡';
      default: return '🔹';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'disorder': return '#FF6B6B'; // Red for disorders
      case 'wellness': return '#4ECDC4'; // Teal for wellness
      case 'skill': return '#9B59B6'; // Purple for skills
      default: return '#8e8e93'; // Gray fallback
    }
  };

  const getCategoryLabel = (category: string) => {
    return category.charAt(0).toUpperCase() + category.slice(1);
  };

  // Convert hex color to rgba with opacity
  const hexToRgba = (hex: string, opacity: number) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (result) {
      const r = parseInt(result[1], 16);
      const g = parseInt(result[2], 16);
      const b = parseInt(result[3], 16);
      return `rgba(${r}, ${g}, ${b}, ${opacity})`;
    }
    return `rgba(0, 0, 0, ${opacity})`;
  };

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

  // Animated style for module grid
  const moduleGridAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: moduleOpacity.value,
      transform: [{ scale: moduleScale.value }],
    };
  });

  // Sort modules based on selected sort option
  const sortedModules = useMemo(() => {
    const modulesCopy = [...modules];
    
    switch (selectedSort) {
      case 'alphabetical':
        modulesCopy.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case 'category':
        modulesCopy.sort((a, b) => {
          if (a.category !== b.category) {
            return a.category.localeCompare(b.category);
          }
          return a.title.localeCompare(b.title);
        });
        break;
      case 'recent':
        modulesCopy.sort((a, b) => {
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
    }
    
    return modulesCopy;
  }, [modules, selectedSort, recentModuleIds]);

  // Handle sort change with animation
  const handleSortChange = (sortOption: SortOption) => {
    if (selectedSort !== sortOption) {
      triggerShuffleAnimation();
      setTimeout(() => {
        setSelectedSort(sortOption);
      }, 250);
    }
  };

  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      presentationStyle="formSheet"
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>Choose Your Journey</Text>
            <Text style={styles.subtitle}>
              Select a mental health focus area to get started
            </Text>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeText}>✕</Text>
          </TouchableOpacity>
        </View>

        {/* Sort Options */}
        <View style={styles.sortSection}>
          <View style={styles.sortContainer}>
            <Text style={styles.sortIcon}>⇅</Text>
            <TouchableOpacity
              style={[
                styles.sortButton,
                selectedSort === 'recent' && styles.sortButtonActive
              ]}
              onPress={() => handleSortChange('recent')}
              activeOpacity={0.7}
            >
              <Text style={[
                styles.sortButtonText,
                selectedSort === 'recent' && styles.sortButtonTextActive
              ]}>
                Recent
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.sortButton,
                selectedSort === 'alphabetical' && styles.sortButtonActive
              ]}
              onPress={() => handleSortChange('alphabetical')}
              activeOpacity={0.7}
            >
              <Text style={[
                styles.sortButtonText,
                selectedSort === 'alphabetical' && styles.sortButtonTextActive
              ]}>
                A-Z
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.sortButton,
                selectedSort === 'category' && styles.sortButtonActive
              ]}
              onPress={() => handleSortChange('category')}
              activeOpacity={0.7}
            >
              <Text style={[
                styles.sortButtonText,
                selectedSort === 'category' && styles.sortButtonTextActive
              ]}>
                Category
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Module Grid */}
        <Animated.View style={[styles.scrollViewContainer, moduleGridAnimatedStyle]}>
          <ScrollView 
            style={styles.scrollView}
            contentContainerStyle={styles.gridContainer}
            showsVerticalScrollIndicator={false}
          >
            {sortedModules.map((module) => {
            const isSelected = module.id === selectedModuleId;
            
            return (
              <TouchableOpacity
                key={module.id}
                style={[
                  styles.moduleCard,
                  { width: cardWidth },
                  isSelected && styles.selectedCard,
                  pressedCard === module.id && styles.pressedCard
                ]}
                onPress={() => handleModuleSelect(module.id)}
                onPressIn={() => setPressedCard(module.id)}
                onPressOut={() => setPressedCard(null)}
                activeOpacity={1}
              >
                {/* Gradient Background Overlay */}
                <View style={[styles.gradientOverlay, { backgroundColor: hexToRgba(module.color, 0.08) }]} />
                
                {/* Module Icon */}
                <View style={[styles.iconContainer, { backgroundColor: module.color }]}>
                  <Text style={styles.categoryIcon}>
                    {getCategoryIcon(module.category)}
                  </Text>
                </View>

                {/* Selected Indicator */}
                {isSelected && (
                  <View style={styles.selectedIndicator}>
                    <View style={[styles.selectedDot, { backgroundColor: module.color }]} />
                  </View>
                )}

                {/* Module Info */}
                <View style={styles.moduleContent}>
                  <Text 
                    style={[
                      styles.moduleTitle, 
                      isSelected && styles.selectedTitle
                    ]} 
                    numberOfLines={2} 
                    ellipsizeMode="tail"
                  >
                    {module.title}
                  </Text>
                  
                  <Text 
                    style={styles.moduleDescription} 
                    numberOfLines={2} 
                    ellipsizeMode="tail"
                  >
                    {module.description}
                  </Text>

                  {/* Category Badge */}
                  <View style={styles.categoryContainer}>
                    <View style={[
                      styles.categoryBadge, 
                      { backgroundColor: hexToRgba(getCategoryColor(module.category), 0.12) }
                    ]}>
                      <Text style={[
                        styles.categoryText,
                        { color: getCategoryColor(module.category) }
                      ]}>
                        {getCategoryLabel(module.category)}
                      </Text>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: theme.health.container.backgroundColor,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingTop: 40,
    paddingBottom: 12,
    borderBottomWidth: 0,
    borderBottomColor: 'transparent',
    position: 'relative',
  },
  headerContent: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 4,
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#e5e5ea',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 0,
    borderColor: 'transparent',
    position: 'absolute',
    right: 20,
    top: 40,
  },
  closeText: {
    fontSize: 16,
    color: '#000000',
    fontWeight: '600',
  },
  subtitle: {
    fontSize: 15,
    color: '#8e8e93',
    textAlign: 'center',
    marginTop: 0,
    marginBottom: 0,
    fontWeight: '400',
    lineHeight: 19,
  },
  sortSection: {
    paddingHorizontal: 20,
    paddingBottom: 8,
    paddingTop: 4,
  },
  sortContainer: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sortIcon: {
    fontSize: 16,
    color: '#8e8e93',
    fontWeight: '500',
    marginRight: 4,
  },
  sortButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f2f2f7',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  sortButtonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  sortButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
  },
  sortButtonTextActive: {
    color: '#ffffff',
    fontWeight: '600',
  },
  scrollViewContainer: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  gridContainer: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 40,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  moduleCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#f2f2f7',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    overflow: 'hidden',
    position: 'relative',
    height: 200,
    justifyContent: 'flex-start',
  },
  selectedCard: {
    borderWidth: 2,
    borderColor: '#007AFF',
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 4,
  },
  pressedCard: {
    transform: [{ scale: 0.98 }],
    opacity: 0.9,
  },
  gradientOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 80,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 16,
    alignSelf: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  categoryIcon: {
    fontSize: 28,
  },
  selectedIndicator: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  selectedDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  moduleContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
    flex: 1,
    justifyContent: 'flex-start',
  },
  moduleTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 8,
    textAlign: 'center',
    lineHeight: 22,
    letterSpacing: -0.2,
  },
  selectedTitle: {
    color: '#007AFF',
  },
  moduleDescription: {
    fontSize: 13,
    color: '#8e8e93',
    textAlign: 'center',
    lineHeight: 18,
    fontWeight: '400',
    paddingHorizontal: 4,
    marginBottom: 8,
  },
  categoryContainer: {
    alignItems: 'center',
    marginTop: 'auto',
    marginBottom: -2,
  },
  categoryBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'center',
  },
  categoryText: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
});