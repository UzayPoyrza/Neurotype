import React, { useRef, useImperativeHandle, forwardRef, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, PanResponder } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { theme } from '../styles/theme';

interface InstagramStyleNavProps {
  title: string;
  showBackButton?: boolean;
  onBackPress?: () => void;
  rightComponent?: React.ReactNode;
  scrollY?: Animated.Value;
  onScrollEnd?: (direction: 'up' | 'down') => void;
  contentHeight?: number;
  scrollViewHeight?: number;
}

export interface InstagramStyleNavRef {
  showRevealBar: () => void;
  hideRevealBar: () => void;
  snapToNearest: () => void;
}

export const InstagramStyleNav = forwardRef<InstagramStyleNavRef, InstagramStyleNavProps>(({
  title,
  showBackButton = false,
  onBackPress,
  rightComponent,
  scrollY,
  onScrollEnd,
  contentHeight = 0,
  scrollViewHeight = 0
}, ref) => {
  const navigation = useNavigation();
  const revealTranslateY = useRef(new Animated.Value(0)).current;
  const isAnimating = useRef(false);
  const lastScrollY = useRef(0);
  const scrollDirection = useRef<'up' | 'down' | null>(null);
  const revealBarHeight = 60; // Height of the RevealBar
  
  // Snap to nearest state (fully shown or fully hidden)
  const snapToNearest = useCallback(() => {
    if (isAnimating.current) return;
    
    const currentTranslateY = (revealTranslateY as any)._value || 0;
    const threshold = revealBarHeight / 2;
    const targetValue = currentTranslateY > -threshold ? 0 : -revealBarHeight;
    
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
  }, [revealTranslateY, revealBarHeight, onScrollEnd]);

  // Scroll-linked 1:1 movement
  React.useEffect(() => {
    if (scrollY) {
      const listener = scrollY.addListener(({ value }) => {
        const scrollDifference = value - lastScrollY.current;
        
        // Only move for real scroll events (not bounce)
        if (Math.abs(scrollDifference) > 3 && value >= 0) {
          const currentTranslateY = (revealTranslateY as any)._value || 0;
          
          // Check if we're at the bottom of the content and scrolling down
          const isAtBottom = contentHeight > 0 && scrollViewHeight > 0 && 
            value + scrollViewHeight >= contentHeight - 10;
          
          // 1:1 movement with scroll, but prevent movement when at bottom and scrolling down
          if (isAtBottom && scrollDifference > 0) {
            // At bottom and scrolling down - keep RevealBar hidden
            revealTranslateY.setValue(-revealBarHeight);
          } else {
            // Normal 1:1 movement
            const newTranslateY = scrollDifference > 0 
              ? Math.max(currentTranslateY - Math.abs(scrollDifference), -revealBarHeight)
              : Math.min(currentTranslateY + Math.abs(scrollDifference), 0);
            
            revealTranslateY.setValue(newTranslateY);
          }
          
          // To this:
          // Check if we're in the bottom 10% of the page
          const scrollableHeight = contentHeight - scrollViewHeight;
          const bottom5PercentThreshold = scrollableHeight * 0.9999;
          const isInBottom10Percent = value >= bottom5PercentThreshold;
          
          if ((isAtBottom && scrollDifference > 0) || isInBottom10Percent) {
            // At bottom and scrolling down OR in bottom 10% - keep RevealBar hidden
            revealTranslateY.setValue(-revealBarHeight);
          } else {
            // Normal 1:1 movement
            const newTranslateY = scrollDifference > 0 
              ? Math.max(currentTranslateY - Math.abs(scrollDifference), -revealBarHeight)
              : Math.min(currentTranslateY + Math.abs(scrollDifference), 0);
            
            revealTranslateY.setValue(newTranslateY);
          }
          
          scrollDirection.current = scrollDifference > 0 ? 'down' : 'up';
        }
        
        lastScrollY.current = value;
      });

      return () => scrollY.removeListener(listener);
    }
  }, [scrollY, revealTranslateY, revealBarHeight, contentHeight, scrollViewHeight]);

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
        toValue: -revealBarHeight,
        duration: 160,
        useNativeDriver: true,
      }).start(() => {
        isAnimating.current = false;
      });
    }
  }, [revealTranslateY, revealBarHeight]);

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
      {/* TopShell - Always visible, pinned to safe area */}
      <View style={styles.topShell}>
        <View style={styles.topShellContent}>
          {/* Status bar padding only - no interactive elements */}
        </View>
      </View>

      {/* RevealBar - Slides under TopShell */}
      <Animated.View 
        style={[
          styles.revealBar,
          {
            transform: [{ translateY: revealTranslateY }],
          }
        ]}
      >
        <View style={styles.revealBarContent}>
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
            <Text style={styles.title} numberOfLines={1}>
              {title}
            </Text>
          </View>

          {/* Right side - Optional component or empty space */}
          <View style={styles.rightSection}>
            {rightComponent}
          </View>
        </View>
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
  },
  topShellContent: {
    flex: 1,
    paddingTop: 20, // Status bar padding
  },
  revealBar: {
    backgroundColor: '#ffffff',
    borderBottomWidth: theme.borders.width.thick,
    borderBottomColor: theme.colors.primary,
    height: 60,
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