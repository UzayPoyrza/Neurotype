import React, { useRef, useImperativeHandle, forwardRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { theme } from '../styles/theme';

interface TwoLayerHeaderProps {
  title: string;
  showBackButton?: boolean;
  onBackPress?: () => void;
  rightComponent?: React.ReactNode;
  forceRevealVisible?: boolean;
  scrollY?: Animated.Value;
}

export interface TwoLayerHeaderRef {
  showRevealBar: () => void;
  hideRevealBar: () => void;
  setForceRevealVisible: (visible: boolean) => void;
}

export const TwoLayerHeader = forwardRef<TwoLayerHeaderRef, TwoLayerHeaderProps>(({
  title,
  showBackButton = false,
  onBackPress,
  rightComponent,
  forceRevealVisible = false,
  scrollY
}, ref) => {
  const navigation = useNavigation();
  const [isRevealVisible, setIsRevealVisible] = React.useState(true);
  const [isForceRevealVisible, setIsForceRevealVisible] = React.useState(forceRevealVisible);
  const revealTranslateY = useRef(new Animated.Value(0)).current;
  const isAnimating = useRef(false);
  const headerHeight = 80;

  // Scroll-linked animation
  React.useEffect(() => {
    if (scrollY) {
      let lastValue = 0;
      const listener = scrollY.addListener(({ value }) => {
        const scrollDifference = value - lastValue;
        
        // Only move header for real scroll events
        if (Math.abs(scrollDifference) > 3 && value >= 0) {
          const currentTranslateY = revealTranslateY._value;
          const newTranslateY = scrollDifference > 0 
            ? Math.max(currentTranslateY - Math.abs(scrollDifference), -headerHeight)
            : Math.min(currentTranslateY + Math.abs(scrollDifference), 0);
          
          revealTranslateY.setValue(newTranslateY);
        }
        
        lastValue = value;
      });

      return () => scrollY.removeListener(listener);
    }
  }, [scrollY, revealTranslateY, headerHeight]);

  const showRevealBar = () => {
    if (!isForceRevealVisible && !isAnimating.current) {
      isAnimating.current = true;
      setIsRevealVisible(true);
      Animated.spring(revealTranslateY, {
        toValue: 0,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }).start(() => {
        isAnimating.current = false;
      });
    }
  };

  const hideRevealBar = () => {
    if (!isForceRevealVisible && !isAnimating.current) {
      isAnimating.current = true;
      setIsRevealVisible(false);
      Animated.spring(revealTranslateY, {
        toValue: -headerHeight,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }).start(() => {
        isAnimating.current = false;
      });
    }
  };

  const setForceRevealVisible = (visible: boolean) => {
    setIsForceRevealVisible(visible);
    if (visible) {
      setIsRevealVisible(true);
      Animated.spring(revealTranslateY, {
        toValue: 0,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }).start();
    }
  };

  useImperativeHandle(ref, () => ({
    showRevealBar,
    hideRevealBar,
    setForceRevealVisible,
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
      {/* RevealBar - Always visible at top */}
      <View style={styles.revealBar}>
        <View style={styles.revealBarContent}>
          <View style={styles.revealIndicator}>
            <View style={styles.indicatorDot} />
          </View>
        </View>
      </View>

      {/* TopShell - Scroll-linked, follows scroll position 1:1 */}
      <Animated.View 
        style={[
          styles.topShell,
          {
            transform: [{ translateY: revealTranslateY }],
          }
        ]}
      >
        <View style={styles.topShellContent}>
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

          <View style={styles.centerSection}>
            <Text style={styles.title} numberOfLines={1}>
              {title}
            </Text>
          </View>

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
    backgroundColor: theme.colors.surface,
    borderBottomWidth: theme.borders.width.thick,
    borderBottomColor: theme.colors.primary,
    ...theme.shadows.medium,
  },
  topShellContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    paddingTop: theme.spacing.lg + 20,
    minHeight: 80,
  },
  revealBar: {
    backgroundColor: theme.colors.surface,
    borderBottomWidth: theme.borders.width.normal,
    borderBottomColor: theme.colors.secondary,
    height: 60,
    ...theme.shadows.small,
  },
  revealBarContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
  },
  revealIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  indicatorDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: theme.colors.secondary,
    marginHorizontal: 2,
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