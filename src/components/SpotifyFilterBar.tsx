import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming, 
  withSpring,
  Easing 
} from 'react-native-reanimated';
import { theme } from '../styles/theme';

export interface FilterOption {
  id: string;
  label: string;
  badge?: number;
}

export interface FilterCategory {
  id: string;
  label: string;
  options: FilterOption[];
  multiSelect?: boolean;
}

export interface FilterSelection {
  parentId: string;
  optionIds: string[];
}

interface SpotifyFilterBarProps {
  categories: FilterCategory[];
  onSelectionChange: (selection: FilterSelection) => void;
  initialSelection?: FilterSelection;
  style?: any;
}

interface AnimatedFilterChipProps {
  category: FilterCategory;
  isSelected: boolean;
  selectionCount: number;
  onPress: () => void;
}

const AnimatedFilterChip: React.FC<AnimatedFilterChipProps> = ({
  category,
  isSelected,
  selectionCount,
  onPress,
}) => {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  });

  const handlePress = () => {
    // Bounce animation
    scale.value = withSpring(0.95, { damping: 15, stiffness: 400 });
    setTimeout(() => {
      scale.value = withSpring(1, { damping: 15, stiffness: 400 });
    }, 100);
    
    onPress();
  };

  return (
    <TouchableOpacity onPress={handlePress} activeOpacity={0.7}>
      <Animated.View style={[
        styles.primaryChip,
        isSelected && styles.activePrimaryChip,
        animatedStyle
      ]}>
        <Text style={[
          styles.primaryChipText,
          isSelected && styles.activePrimaryChipText,
        ]}>
          {category.label}
        </Text>
        {isSelected && selectionCount > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{selectionCount}</Text>
          </View>
        )}
      </Animated.View>
    </TouchableOpacity>
  );
};

interface AnimatedSecondaryChipProps {
  option: FilterOption;
  isSelected: boolean;
  onPress: () => void;
}

const AnimatedSecondaryChip: React.FC<AnimatedSecondaryChipProps> = ({
  option,
  isSelected,
  onPress,
}) => {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  });

  const handlePress = () => {
    // Bounce animation
    scale.value = withSpring(0.9, { damping: 15, stiffness: 400 });
    setTimeout(() => {
      scale.value = withSpring(1, { damping: 15, stiffness: 400 });
    }, 100);
    
    onPress();
  };

  return (
    <TouchableOpacity onPress={handlePress} activeOpacity={0.7}>
      <Animated.View style={[
        styles.secondaryChip,
        isSelected && styles.selectedSecondaryChip,
        animatedStyle
      ]}>
        <Text style={[
          styles.secondaryChipText,
          isSelected && styles.selectedSecondaryChipText,
        ]}>
          {option.label}
        </Text>
        {option.badge && (
          <View style={styles.optionBadge}>
            <Text style={styles.optionBadgeText}>{option.badge}</Text>
          </View>
        )}
      </Animated.View>
    </TouchableOpacity>
  );
};

export const SpotifyFilterBar: React.FC<SpotifyFilterBarProps> = ({
  categories,
  onSelectionChange,
  initialSelection,
  style,
}) => {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [selections, setSelections] = useState<Record<string, string[]>>(
    initialSelection ? { [initialSelection.parentId]: initialSelection.optionIds } : {}
  );
  
  // Animation for transition between primary and secondary filters
  const filterOpacity = useSharedValue(1);
  const filterTranslateX = useSharedValue(0);

  const handlePrimaryChipPress = useCallback((categoryId: string) => {
    if (activeCategory === categoryId) {
      // Close secondary options with animation
      filterOpacity.value = withTiming(0, { duration: 150 });
      filterTranslateX.value = withTiming(30, { duration: 150 });
      
      setTimeout(() => {
        setActiveCategory(null);
        filterOpacity.value = withTiming(1, { duration: 200 });
        filterTranslateX.value = withTiming(0, { duration: 200 });
      }, 150);
    } else {
      // Open secondary options with animation
      filterOpacity.value = withTiming(0, { duration: 150 });
      filterTranslateX.value = withTiming(-30, { duration: 150 });
      
      setTimeout(() => {
        setActiveCategory(categoryId);
        filterOpacity.value = withTiming(1, { duration: 200 });
        filterTranslateX.value = withTiming(0, { duration: 200 });
      }, 150);
    }
  }, [activeCategory, filterOpacity, filterTranslateX]);

  const handleSecondaryChipPress = useCallback((categoryId: string, optionId: string) => {
    const category = categories.find(cat => cat.id === categoryId);
    if (!category) return;

    const currentSelections = selections[categoryId] || [];
    let newSelections: string[];

    if (category.multiSelect) {
      // Multi-select mode
      if (currentSelections.includes(optionId)) {
        newSelections = currentSelections.filter(id => id !== optionId);
      } else {
        newSelections = [...currentSelections, optionId];
      }
    } else {
      // Single-select mode - allow deselection
      if (currentSelections.includes(optionId)) {
        // Deselect if already selected
        newSelections = [];
        
        // Update state immediately
        const updatedSelections = {
          ...selections,
          [categoryId]: newSelections,
        };
        setSelections(updatedSelections);
        onSelectionChange({
          parentId: categoryId,
          optionIds: newSelections,
        });
        
        // Close secondary filters and return to primary with animation
        filterOpacity.value = withTiming(0, { duration: 150 });
        filterTranslateX.value = withTiming(30, { duration: 150 });
        
        setTimeout(() => {
          setActiveCategory(null);
          filterOpacity.value = withTiming(1, { duration: 200 });
          filterTranslateX.value = withTiming(0, { duration: 200 });
        }, 150);
        
        return; // Exit early to avoid duplicate state update
      } else {
        // Select new option
        newSelections = [optionId];
      }
    }

    const updatedSelections = {
      ...selections,
      [categoryId]: newSelections,
    };

    setSelections(updatedSelections);
    onSelectionChange({
      parentId: categoryId,
      optionIds: newSelections,
    });
  }, [selections, categories, onSelectionChange, filterOpacity, filterTranslateX]);

  const handleBackPress = useCallback(() => {
    // Animate back to primary filters
    filterOpacity.value = withTiming(0, { duration: 150 });
    filterTranslateX.value = withTiming(30, { duration: 150 });
    
    setTimeout(() => {
      setActiveCategory(null);
      filterOpacity.value = withTiming(1, { duration: 200 });
      filterTranslateX.value = withTiming(0, { duration: 200 });
    }, 150);
  }, [filterOpacity, filterTranslateX]);

  const getActiveCategory = () => categories.find(cat => cat.id === activeCategory);

  const hasActiveSelections = (categoryId: string) => {
    const categorySelections = selections[categoryId] || [];
    return categorySelections.length > 0;
  };

  const getSelectionCount = (categoryId: string) => {
    const categorySelections = selections[categoryId] || [];
    return categorySelections.length;
  };

  // Animated style for filter transition
  const filterAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: filterOpacity.value,
      transform: [{ translateX: filterTranslateX.value }],
    };
  });

  return (
    <View style={[styles.container, style]}>
      {/* Single Filter Row - Primary and Secondary in same row */}
      <Animated.ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.primaryRow}
        style={[styles.primaryScrollView, filterAnimatedStyle]}
        bounces={true}
        alwaysBounceHorizontal={true}
        decelerationRate="fast"
      >
        {/* Show primary categories when no category is active */}
        {!activeCategory && categories.map((category) => {
          const isSelected = hasActiveSelections(category.id);
          return (
            <AnimatedFilterChip
              key={category.id}
              category={category}
              isSelected={isSelected}
              selectionCount={getSelectionCount(category.id)}
              onPress={() => handlePrimaryChipPress(category.id)}
            />
          );
        })}

        {/* Show secondary options when a category is active */}
        {activeCategory && (
          <>
            {/* Back Button */}
            <TouchableOpacity
              style={styles.backChip}
              onPress={handleBackPress}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Go back to primary filters"
            >
              <Text style={styles.backChipText}>← Back</Text>
            </TouchableOpacity>

            {/* Secondary Options */}
            {getActiveCategory()?.options.map((option) => {
              const isSelected = (selections[activeCategory] || []).includes(option.id);
              return (
                <AnimatedSecondaryChip
                  key={option.id}
                  option={option}
                  isSelected={isSelected}
                  onPress={() => handleSecondaryChipPress(activeCategory, option.id)}
                />
              );
            })}
          </>
        )}
      </Animated.ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'transparent',
  },
  primaryScrollView: {
    maxHeight: 60,
  },
  primaryRow: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    gap: theme.spacing.md,
    paddingRight: theme.spacing.xxxl, // Extra padding on the right for infinite scroll feel
  },
  primaryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borders.radius.xxl,
    backgroundColor: theme.colors.filter.inactive,
    borderWidth: theme.borders.width.normal,
    borderColor: theme.colors.filter.border,
    minHeight: 36,
    ...theme.shadows.small,
  },
  activePrimaryChip: {
    backgroundColor: theme.colors.filter.active,
  },
  primaryChipText: {
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.filter.active,
    fontFamily: theme.typography.fontFamily,
  },
  activePrimaryChipText: {
    color: theme.colors.filter.inactive,
  },
  badge: {
    backgroundColor: theme.colors.filter.badge,
    borderRadius: theme.borders.radius.xl,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: theme.spacing.sm,
    paddingHorizontal: 4,
  },
  badgeText: {
    fontSize: theme.typography.sizes.xs,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.filter.active,
    fontFamily: theme.typography.fontFamily,
  },
  backChip: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borders.radius.xxl,
    backgroundColor: theme.colors.background,
    borderWidth: theme.borders.width.normal,
    borderColor: theme.colors.filter.border,
    minHeight: 36,
    ...theme.shadows.small,
  },
  backChipText: {
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.filter.active,
    fontFamily: theme.typography.fontFamily,
  },
  secondaryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borders.radius.xxl,
    backgroundColor: theme.colors.filter.inactive,
    borderWidth: theme.borders.width.normal,
    borderColor: theme.colors.filter.border,
    minHeight: 36,
    ...theme.shadows.small,
  },
  selectedSecondaryChip: {
    backgroundColor: theme.colors.filter.active,
  },
  secondaryChipText: {
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.filter.active,
    fontFamily: theme.typography.fontFamily,
  },
  selectedSecondaryChipText: {
    color: theme.colors.filter.inactive,
  },
  optionBadge: {
    backgroundColor: theme.colors.filter.badge,
    borderRadius: theme.borders.radius.xl,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: theme.spacing.sm,
    paddingHorizontal: 3,
  },
  optionBadgeText: {
    fontSize: theme.typography.sizes.xs,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.filter.active,
    fontFamily: theme.typography.fontFamily,
  },
}); 