import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Animated,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import { theme } from '../styles/theme';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

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
  
  const secondaryRowHeight = useRef(new Animated.Value(0)).current;
  const secondaryRowOpacity = useRef(new Animated.Value(0)).current;

  const handlePrimaryChipPress = useCallback((categoryId: string) => {
    if (activeCategory === categoryId) {
      // Close secondary row
      setActiveCategory(null);
      Animated.parallel([
        Animated.timing(secondaryRowHeight, {
          toValue: 0,
          duration: 200,
          useNativeDriver: false,
        }),
        Animated.timing(secondaryRowOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: false,
        }),
      ]).start();
    } else {
      // Open secondary row
      setActiveCategory(categoryId);
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      Animated.parallel([
        Animated.timing(secondaryRowHeight, {
          toValue: 1,
          duration: 200,
          useNativeDriver: false,
        }),
        Animated.timing(secondaryRowOpacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: false,
        }),
      ]).start();
    }
  }, [activeCategory, secondaryRowHeight, secondaryRowOpacity]);

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
      // Single-select mode
      newSelections = [optionId];
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
  }, [selections, categories, onSelectionChange]);

  const handleBackPress = useCallback(() => {
    setActiveCategory(null);
    Animated.parallel([
      Animated.timing(secondaryRowHeight, {
        toValue: 0,
        duration: 200,
        useNativeDriver: false,
      }),
      Animated.timing(secondaryRowOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: false,
      }),
    ]).start();
  }, [secondaryRowHeight, secondaryRowOpacity]);

  const getActiveCategory = () => categories.find(cat => cat.id === activeCategory);

  const hasActiveSelections = (categoryId: string) => {
    const categorySelections = selections[categoryId] || [];
    return categorySelections.length > 0;
  };

  const getSelectionCount = (categoryId: string) => {
    const categorySelections = selections[categoryId] || [];
    return categorySelections.length;
  };

  return (
    <View style={[styles.container, style]}>
      {/* Primary Filter Row */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.primaryRow}
        style={styles.primaryScrollView}
        bounces={true}
        alwaysBounceHorizontal={true}
        decelerationRate="fast"
      >
        {categories.map((category) => (
          <TouchableOpacity
            key={category.id}
            style={[
              styles.primaryChip,
              activeCategory === category.id && styles.activePrimaryChip,
            ]}
            onPress={() => handlePrimaryChipPress(category.id)}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel={`${category.label} filter${hasActiveSelections(category.id) ? `, ${getSelectionCount(category.id)} selected` : ''}`}
            accessibilityState={{ selected: activeCategory === category.id }}
          >
            <Text style={[
              styles.primaryChipText,
              activeCategory === category.id && styles.activePrimaryChipText,
            ]}>
              {category.label}
            </Text>
            {hasActiveSelections(category.id) && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>
                  {getSelectionCount(category.id)}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Secondary Filter Row */}
      <Animated.View
        style={[
          styles.secondaryRow,
          {
            opacity: secondaryRowOpacity,
            maxHeight: secondaryRowHeight.interpolate({
              inputRange: [0, 1],
              outputRange: [0, 60],
            }),
          },
        ]}
      >
        {activeCategory && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.secondaryRowContent}
            bounces={true}
            alwaysBounceHorizontal={true}
            decelerationRate="fast"
          >
            {/* Back Button */}
            <TouchableOpacity
              style={styles.backChip}
              onPress={handleBackPress}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Go back to primary filters"
            >
              <Text style={styles.backChipText}>× Back</Text>
            </TouchableOpacity>

            {/* Secondary Options */}
            {getActiveCategory()?.options.map((option) => {
              const isSelected = (selections[activeCategory] || []).includes(option.id);
              return (
                <TouchableOpacity
                  key={option.id}
                  style={[
                    styles.secondaryChip,
                    isSelected && styles.selectedSecondaryChip,
                  ]}
                  onPress={() => handleSecondaryChipPress(activeCategory, option.id)}
                  activeOpacity={0.7}
                  accessibilityRole="button"
                  accessibilityLabel={`${option.label}${isSelected ? ', selected' : ''}`}
                  accessibilityState={{ selected: isSelected }}
                >
                  <Text style={[
                    styles.secondaryChipText,
                    isSelected && styles.selectedSecondaryChipText,
                  ]}>
                    {option.label}
                  </Text>
                  {option.badge && (
                    <View style={styles.optionBadge}>
                      <Text style={styles.optionBadgeText}>
                        {option.badge}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}
      </Animated.View>
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
  secondaryRow: {
    borderTopWidth: theme.borders.width.thin,
    borderTopColor: theme.colors.filter.separator,
    backgroundColor: 'transparent',
    overflow: 'hidden',
  },
  secondaryRowContent: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    gap: theme.spacing.md,
    paddingRight: theme.spacing.xxxl, // Extra padding on the right for infinite scroll feel
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