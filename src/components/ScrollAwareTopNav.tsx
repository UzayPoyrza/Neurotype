import React, { useState, useRef, useImperativeHandle, forwardRef, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { theme } from '../styles/theme';

interface ScrollAwareTopNavProps {
  title: string;
  showBackButton?: boolean;
  onBackPress?: () => void;
  rightComponent?: React.ReactNode;
  forceVisible?: boolean; // Programmatic override to force visibility
}

export interface ScrollAwareTopNavRef {
  showNavBar: () => void;
  hideNavBar: () => void;
  setForceVisible: (visible: boolean) => void;
}

export const ScrollAwareTopNav = forwardRef<ScrollAwareTopNavRef, ScrollAwareTopNavProps>(({
  title,
  showBackButton = false,
  onBackPress,
  rightComponent,
  forceVisible = false
}, ref) => {
  const navigation = useNavigation();
  const [isVisible, setIsVisible] = useState(true);
  const [isForceVisible, setIsForceVisible] = useState(forceVisible);
  const translateY = useRef(new Animated.Value(0)).current;
  const navBarHeight = 80; // Height of the navigation bar
  const isAnimating = useRef(false);

  const showNavBar = useCallback(() => {
    if (!isVisible && !isForceVisible && !isAnimating.current) {
      isAnimating.current = true;
      setIsVisible(true);
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }).start(() => {
        isAnimating.current = false;
      });
    }
  }, [isVisible, isForceVisible]);

  const hideNavBar = useCallback(() => {
    if (isVisible && !isForceVisible && !isAnimating.current) {
      isAnimating.current = true;
      setIsVisible(false);
      Animated.spring(translateY, {
        toValue: -navBarHeight,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }).start(() => {
        isAnimating.current = false;
      });
    }
  }, [isVisible, isForceVisible]);

  const setForceVisible = useCallback((visible: boolean) => {
    setIsForceVisible(visible);
    if (visible) {
      setIsVisible(true);
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }).start();
    }
  }, []);

  useImperativeHandle(ref, () => ({
    showNavBar,
    hideNavBar,
    setForceVisible,
  }));

  const handleBackPress = () => {
    if (onBackPress) {
      onBackPress();
    } else {
      navigation.goBack();
    }
  };

  return (
    <Animated.View 
      style={[
        styles.container,
        {
          transform: [{ translateY }],
        }
      ]}
    >
      <View style={styles.content}>
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
  );
});

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.surface,
    borderBottomWidth: theme.borders.width.thick,
    borderBottomColor: theme.colors.primary,
    ...theme.shadows.medium,
    zIndex: 1000,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    paddingTop: theme.spacing.lg + 20, // Extra padding for status bar
    minHeight: 80,
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