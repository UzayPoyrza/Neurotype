import React, { useRef, useImperativeHandle, forwardRef, useCallback, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, PanResponder } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../contexts/ThemeContext';

interface InstagramStyleNavProps {
  title?: string | React.ReactNode;
  searchComponent?: React.ReactNode;
  showBackButton?: boolean;
  onBackPress?: () => void;
  leftComponent?: React.ReactNode;
  rightComponent?: React.ReactNode;
  scrollY?: Animated.Value;
  onScrollEnd?: (direction: 'up' | 'down') => void;
  contentHeight?: number;
  scrollViewHeight?: number;
  isSearchFocused?: boolean;
  forceInitialPosition?: 'up' | 'down';
  backgroundColor?: string;
}

export interface InstagramStyleNavRef {
  showRevealBar: () => void;
  hideRevealBar: () => void;
  snapToNearest: () => void;
}

export const InstagramStyleNav = forwardRef<InstagramStyleNavRef, InstagramStyleNavProps>(({
  title,
  searchComponent,
  showBackButton = false,
  onBackPress,
  leftComponent,
  rightComponent,
  scrollY,
  onScrollEnd,
  contentHeight = 0,
  scrollViewHeight = 0,
  isSearchFocused = false,
  forceInitialPosition,
  backgroundColor,
}, ref) => {
  const navigation = useNavigation();
  const theme = useTheme();
  const revealTranslateY = useRef(new Animated.Value(0)).current;
  const isAnimating = useRef(false);
  const lastScrollY = useRef(0);
  const scrollDirection = useRef<'up' | 'down' | null>(null);
  const revealBarHeight = 60; // Height of the RevealBar
  const slideRange = 60; // Height of TopShell - how far to slide

  // Animated value for the top shell border
  const topShellBorderOpacity = useRef(new Animated.Value(0)).current;
  // Animated value for the reveal bar content opacity
  const revealBarContentOpacity = useRef(new Animated.Value(1)).current;

  const bgColor = backgroundColor || theme.colors.background;
  const borderColor = theme.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';

  // Snap to nearest state (fully shown or fully hidden)
  const snapToNearest = useCallback(() => {
    if (isAnimating.current) return;

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
  }, [revealTranslateY, slideRange, onScrollEnd]);

  // Scroll-linked 1:1 movement
  React.useEffect(() => {
    if (scrollY && !isSearchFocused) {
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
      // Position exactly like when scrolling down (line under dynamic island)
      revealTranslateY.setValue(-slideRange); // -60px - same as when navigation moves up
      // Stop any ongoing animations
      revealTranslateY.stopAnimation();
    }
  }, [isSearchFocused, revealTranslateY, slideRange]);

  // Force initial position
  React.useEffect(() => {
    if (forceInitialPosition === 'up') {
      // Position exactly like when scrolling down (line under dynamic island)
      revealTranslateY.setValue(-slideRange); // -60px - same as when navigation moves up
    } else if (forceInitialPosition === 'down') {
      revealTranslateY.setValue(0); // Default position
    }
  }, [forceInitialPosition, revealTranslateY, slideRange]);

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
    if (!isAnimating.current) {
      isAnimating.current = true;
      Animated.timing(revealTranslateY, {
        toValue: 0,
        duration: 160,
        useNativeDriver: true,
      }).start(() => {
        isAnimating.current = false;
      });
    }
  }, [revealTranslateY]);

  const hideRevealBar = useCallback(() => {
    if (!isAnimating.current) {
      isAnimating.current = true;
      Animated.timing(revealTranslateY, {
        toValue: -slideRange,
        duration: 160,
        useNativeDriver: true,
      }).start(() => {
        isAnimating.current = false;
      });
    }
  }, [revealTranslateY, slideRange]);

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
            backgroundColor: bgColor,
            borderBottomColor: borderColor,
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
            {searchComponent}
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
            {/* Left side - Back button, custom component, or empty space */}
            <View style={styles.leftSection}>
              {showBackButton && (
                <TouchableOpacity
                  style={[
                    styles.backButton,
                    {
                      backgroundColor: theme.colors.background,
                      borderColor: borderColor,
                    },
                  ]}
                  onPress={handleBackPress}
                  testID="top-nav-back-button"
                >
                  <Text style={[styles.backButtonText, { color: theme.colors.primary }]}>←</Text>
                </TouchableOpacity>
              )}
              {!showBackButton && leftComponent}
            </View>

            {/* Center - Title */}
            <View style={styles.centerSection}>
              {typeof title === 'string' ? (
                <Text style={[styles.title, { color: theme.colors.primary }]} numberOfLines={1}>
                  {title}
                </Text>
              ) : (
                title
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
      <Animated.View style={[styles.topShell, { backgroundColor: bgColor }]}>
        <View style={styles.topShellContent}>
          {/* Status bar padding only - no interactive elements */}
        </View>
        {/* Animated border that appears when reveal bar slides behind */}
        <Animated.View
          style={[
            styles.topShellBorder,
            {
              backgroundColor: borderColor,
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
    height: 2,
  },
  revealBar: {
    borderBottomWidth: 2,
    height: 60,
    position: 'absolute',
    top: 60, // Start below TopShell
    left: 0,
    right: 0,
    zIndex: 1000, // Below TopShell
  },
  searchContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  revealBarContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
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
    borderRadius: 10,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 17,
    fontWeight: '700',
    fontFamily: 'System',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    fontFamily: 'System',
    textAlign: 'center',
  },
});
