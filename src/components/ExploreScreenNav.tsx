import React, { useRef, useImperativeHandle, forwardRef, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, PanResponder } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { theme } from '../styles/theme';
import { SpotifyFilterBar, FilterCategory, FilterSelection } from './SpotifyFilterBar';

interface ExploreScreenNavProps {
  title?: string;
  titleComponent?: React.ReactNode;
  searchComponent?: React.ReactNode;
  filterCategories: FilterCategory[];
  onFilterSelectionChange: (selection: FilterSelection) => void;
  filterSelection?: FilterSelection;
  showBackButton?: boolean;
  onBackPress?: () => void;
  rightComponent?: React.ReactNode;
  scrollY?: Animated.Value;
  onScrollEnd?: (direction: 'up' | 'down') => void;
  contentHeight?: number;
  scrollViewHeight?: number;
  isSearchFocused?: boolean;
}

export interface ExploreScreenNavRef {
  showRevealBar: () => void;
  hideRevealBar: () => void;
  snapToNearest: () => void;
}

export const ExploreScreenNav = forwardRef<ExploreScreenNavRef, ExploreScreenNavProps>(({
  title,
  titleComponent,
  searchComponent,
  filterCategories,
  onFilterSelectionChange,
  filterSelection,
  showBackButton = false,
  onBackPress,
  rightComponent,
  scrollY,
  onScrollEnd,
  contentHeight = 0,
  scrollViewHeight = 0,
  isSearchFocused = false
}, ref) => {
  const navigation = useNavigation();
  const revealTranslateY = useRef(new Animated.Value(0)).current;
  const isAnimating = useRef(false);
  const lastScrollY = useRef(0);
  const scrollDirection = useRef<'up' | 'down' | null>(null);
  const revealBarHeight = 120; // Increased height to accommodate filter bar
  const slideRange = 120; // Full height of RevealBar - slide it completely behind TopShell
  
  // Animated value for the top shell border
  const topShellBorderOpacity = useRef(new Animated.Value(0)).current;
  // Animated value for the reveal bar content opacity
  const revealBarContentOpacity = useRef(new Animated.Value(1)).current;
  
  // Snap to nearest state (fully shown or fully hidden)
  const snapToNearest = useCallback(() => {
    if (isAnimating.current || isSearchFocused) return;
    
    const currentTranslateY = (revealTranslateY as any)._value || 0;
    const threshold = slideRange / 2;
    const targetValue = currentTranslateY > -threshold ? 0 : -slideRange;
    
    isAnimating.current = true;
    Animated.timing(revealTranslateY, {
      toValue: targetValue,
      duration: 160, // 140-180ms as specified
      useNativeDriver: true,
    }).start(() => {
      isAnimating.current = false;
      if (onScrollEnd) {
        onScrollEnd(targetValue === 0 ? 'up' : 'down');
      }
    });
  }, [revealTranslateY, slideRange, onScrollEnd, isSearchFocused]);

  // Scroll-linked 1:1 movement
  React.useEffect(() => {
    if (scrollY && !isSearchFocused && !isAnimating.current) {
      const listener = scrollY.addListener(({ value }) => {
        const scrollDifference = value - lastScrollY.current;
        
        // Only move for real scroll events (not bounce)
        if (Math.abs(scrollDifference) > 3 && value >= 0) {
          const currentTranslateY = (revealTranslateY as any)._value || 0;
          
          // Check if we're at the bottom of the content and scrolling down
          const isAtBottom = contentHeight > 0 && scrollViewHeight > 0 && 
            value + scrollViewHeight >= contentHeight - 10;
          
          // Check if we're in the bottom 10% of the page
          const scrollableHeight = contentHeight - scrollViewHeight;
          const bottom5PercentThreshold = scrollableHeight * 0.9999;
          const isInBottom10Percent = value >= bottom5PercentThreshold;
          
          if ((isAtBottom && scrollDifference > 0) || isInBottom10Percent) {
            // At bottom and scrolling down OR in bottom 10% - keep RevealBar hidden
            revealTranslateY.setValue(-slideRange);
          } else {
            // Normal 1:1 movement
            const newTranslateY = scrollDifference > 0 
              ? Math.max(currentTranslateY - Math.abs(scrollDifference), -slideRange)
              : Math.min(currentTranslateY + Math.abs(scrollDifference), 0);
            
            revealTranslateY.setValue(newTranslateY);
          }
          
          scrollDirection.current = scrollDifference > 0 ? 'down' : 'up';
        }
        
        lastScrollY.current = value;
      });

      return () => scrollY.removeListener(listener);
    }
  }, [scrollY, revealTranslateY, revealBarHeight, contentHeight, scrollViewHeight, isSearchFocused]);

  // Force navigation to stay visible when search is focused
  React.useEffect(() => {
    if (isSearchFocused) {
      // Immediately show the navigation and prevent any movement
      revealTranslateY.setValue(0);
      // Stop any ongoing animations
      revealTranslateY.stopAnimation();
      // Prevent any scroll-linked movement
      if (scrollY) {
        scrollY.stopAnimation();
      }
    }
  }, [isSearchFocused, revealTranslateY, scrollY]);

  // Animate top shell border and reveal bar content based on reveal bar position
  React.useEffect(() => {
    const listener = revealTranslateY.addListener(({ value }) => {
      // Calculate opacity based on how much the reveal bar has moved up
      const progress = Math.abs(value) / slideRange;
      
      // Top border fades in much later and more gradually
      // Use a steep curve that only becomes visible in the last 20% of the animation
      const borderOpacity = progress < 0.8 ? 0 : Math.pow((progress - 0.8) / 0.2, 3);
      topShellBorderOpacity.setValue(Math.min(borderOpacity, 1));
      
      // Calculate content opacity with stronger fade effect
      // Use exponential curve for more pronounced fade
      const contentOpacity = Math.max(Math.pow(1 - progress, 2), 0);
      revealBarContentOpacity.setValue(contentOpacity);
    });

    return () => revealTranslateY.removeListener(listener);
  }, [revealTranslateY, topShellBorderOpacity, revealBarContentOpacity, slideRange]);

  const showRevealBar = useCallback(() => {
    if (!isAnimating.current && !isSearchFocused) {
      isAnimating.current = true;
      Animated.timing(revealTranslateY, {
        toValue: 0,
        duration: 160,
        useNativeDriver: true,
      }).start(() => {
        isAnimating.current = false;
      });
    }
  }, [revealTranslateY, isSearchFocused]);

  const hideRevealBar = useCallback(() => {
    if (!isAnimating.current && !isSearchFocused) {
      isAnimating.current = true;
      Animated.timing(revealTranslateY, {
        toValue: -slideRange,
        duration: 160,
        useNativeDriver: true,
      }).start(() => {
        isAnimating.current = false;
      });
    }
  }, [revealTranslateY, slideRange, isSearchFocused]);

  useImperativeHandle(ref, () => ({
    showRevealBar,
    hideRevealBar,
    snapToNearest,
  }));

  const handleBackPress = () => {
    if (onBackPress) {
      onBackPress();
    } else {
      navigation.goBack();
    }
  };

  return (
    <View style={styles.container}>
      {/* RevealBar - Slides behind TopShell */}
      <Animated.View 
        style={[
          styles.revealBar,
          {
            transform: [{ translateY: revealTranslateY }],
          }
        ]}
      >
        {searchComponent ? (
          <Animated.View 
            style={[
              styles.searchContainer,
              {
                opacity: revealBarContentOpacity,
              }
            ]}
          >
            <View style={styles.searchWrapper}>
              {searchComponent}
            </View>
            <View style={styles.filterWrapper}>
              <SpotifyFilterBar
                categories={filterCategories}
                onSelectionChange={onFilterSelectionChange}
                initialSelection={filterSelection}
                style={styles.filterBar}
              />
            </View>
          </Animated.View>
        ) : (
          <Animated.View 
            style={[
              styles.revealBarContent,
              {
                opacity: revealBarContentOpacity,
              }
            ]}
          >
            {/* Left side - Back button or empty space */}
            <View style={styles.leftSection}>
              {showBackButton && (
                <TouchableOpacity
                  style={styles.backButton}
                  onPress={handleBackPress}
                  testID="top-nav-back-button"
                >
                  <Text style={styles.backButtonText}>←</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Center - Title */}
            <View style={styles.centerSection}>
              {titleComponent || (
                <Text style={styles.title} numberOfLines={1}>
                  {title}
                </Text>
              )}
            </View>

            {/* Right side - Optional component or empty space */}
            <View style={styles.rightSection}>
              {rightComponent}
            </View>
          </Animated.View>
        )}
      </Animated.View>

      {/* TopShell - Always visible and in front */}
      <Animated.View style={styles.topShell}>
        <View style={styles.topShellContent}>
          {/* Status bar padding only - no interactive elements */}
        </View>
        {/* Animated border that appears when reveal bar slides behind */}
        <Animated.View 
          style={[
            styles.topShellBorder,
            {
              opacity: topShellBorderOpacity,
            }
          ]}
        />
      </Animated.View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
  },
  topShell: {
    backgroundColor: '#ffffff',
    height: 60, // Fixed height for status bar + padding
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1001, // Higher than container to stay in front
  },
  topShellContent: {
    flex: 1,
    paddingTop: 20, // Status bar padding
  },
  topShellBorder: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: theme.borders.width.thick,
    backgroundColor: theme.colors.primary,
  },
  revealBar: {
    backgroundColor: '#ffffff',
    borderBottomWidth: theme.borders.width.thick,
    borderBottomColor: theme.colors.primary,
    height: 120, // Increased height to accommodate filter bar
    position: 'absolute',
    top: 60, // Start below TopShell
    left: 0,
    right: 0,
    zIndex: 1000, // Below TopShell
  },
  searchContainer: {
    flex: 1,
    paddingVertical: theme.spacing.md,
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  searchWrapper: {
    width: '100%',
    paddingHorizontal: theme.spacing.lg,
    alignItems: 'center',
  },
  filterWrapper: {
    width: '100%',
    marginHorizontal: -theme.spacing.lg, // Break out of parent padding
  },
  filterBar: {
    marginTop: theme.spacing.xs, // Reduced from sm to xs for closer spacing
  },
  revealBarContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    flex: 1,
  },
  leftSection: {
    flex: 1,
    alignItems: 'flex-start',
  },
  centerSection: {
    flex: 2,
    alignItems: 'center',
  },
  rightSection: {
    flex: 1,
    alignItems: 'flex-end',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: theme.borders.radius.md,
    backgroundColor: theme.colors.background,
    borderWidth: theme.borders.width.normal,
    borderColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...theme.shadows.small,
  },
  backButtonText: {
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.primary,
    fontFamily: theme.typography.fontFamily,
  },
  title: {
    fontSize: theme.typography.sizes.xl,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.primary,
    fontFamily: theme.typography.fontFamily,
    textAlign: 'center',
  },
}); 