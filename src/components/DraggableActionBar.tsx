import React, { useRef, useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
} from 'react-native';
import { theme } from '../styles/theme';

interface DraggableActionBarProps {
  primaryAction: {
    title: string;
    onPress: () => void;
    icon?: string;
  };
  secondaryAction: {
    title: string;
    onPress: () => void;
    icon?: string;
  };
  primaryColor?: string;
  secondaryColor?: string;
  themeColor?: string;
  onScroll?: (scrollY: number) => void;
  tabTransitionProgress?: Animated.Value;
}

export const DraggableActionBar = forwardRef<any, DraggableActionBarProps>(({
  primaryAction,
  secondaryAction,
  primaryColor = '#FF6B6B',
  secondaryColor = '#4ECDC4',
  themeColor = '#6B73FF',
  onScroll,
  tabTransitionProgress,
}, ref) => {
  const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
  const buttonSize = 56;
  const pillWidth = 120;
  const margin = 16;
  
  // Position buttons at bottom corners
  const leftButtonPos = { x: margin, y: screenHeight - buttonSize - margin - 80 };
  const rightButtonPos = { x: screenWidth - buttonSize - margin, y: screenHeight - buttonSize - margin - 80 };

  // Button state - both start in pill mode
  const [isCircleMode, setIsCircleMode] = useState(false);
  
  // Left button animations
  const leftButtonWidth = useRef(new Animated.Value(pillWidth)).current;
  const leftTextOpacity = useRef(new Animated.Value(1)).current;
  const leftIconScale = useRef(new Animated.Value(1)).current;
  const leftButtonTranslateX = useRef(new Animated.Value(0)).current;

  // Right button animations
  const rightButtonWidth = useRef(new Animated.Value(pillWidth)).current;
  const rightTextOpacity = useRef(new Animated.Value(1)).current;
  const rightIconScale = useRef(new Animated.Value(1)).current;
  const rightButtonTranslateX = useRef(new Animated.Value(-(pillWidth - buttonSize))).current;

  // Animate to circle mode when scrolling
  const animateToCircleMode = () => {
    if (isCircleMode) return; // Already in circle mode
    
    setIsCircleMode(true);
    
    Animated.parallel([
      // Left button
      Animated.timing(leftButtonWidth, {
        toValue: buttonSize,
        duration: 200,
        useNativeDriver: false,
      }),
      Animated.timing(leftButtonTranslateX, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(leftTextOpacity, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(leftIconScale, {
        toValue: 1.1,
        duration: 200,
        useNativeDriver: true,
      }),
      // Right button
      Animated.timing(rightButtonWidth, {
        toValue: buttonSize,
        duration: 200,
        useNativeDriver: false,
      }),
      Animated.timing(rightButtonTranslateX, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(rightTextOpacity, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(rightIconScale, {
        toValue: 1.1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  };

  // Animate back to pill mode when scroll stops
  const animateToPillMode = () => {
    if (!isCircleMode) return; // Already in pill mode
    
    setIsCircleMode(false);
    
    Animated.parallel([
      // Left button
      Animated.timing(leftButtonWidth, {
        toValue: pillWidth,
        duration: 300,
        useNativeDriver: false,
      }),
      Animated.timing(leftButtonTranslateX, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(leftTextOpacity, {
        toValue: 1,
        duration: 200,
        delay: 150,
        useNativeDriver: true,
      }),
      Animated.timing(leftIconScale, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      // Right button
      Animated.timing(rightButtonWidth, {
        toValue: pillWidth,
        duration: 300,
        useNativeDriver: false,
      }),
      Animated.timing(rightButtonTranslateX, {
        toValue: -(pillWidth - buttonSize),
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(rightTextOpacity, {
        toValue: 1,
        duration: 200,
        delay: 150,
        useNativeDriver: true,
      }),
      Animated.timing(rightIconScale, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  };

  // Scroll detection with debouncing
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const handleScroll = (scrollY: number) => {
    // Notify parent component
    if (onScroll) {
      onScroll(scrollY);
    }
    
    // Transform to circle mode when scrolling
    animateToCircleMode();
    
    // Clear existing timeout
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }
    
    // Set timeout to return to pill mode after scroll stops
    scrollTimeoutRef.current = setTimeout(() => {
      animateToPillMode();
    }, 50); // 50ms delay after scroll stops
  };

  // Expose handleScroll method to parent component
  useImperativeHandle(ref, () => ({
    handleScroll,
  }));

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  const handleLeftPress = () => {
    secondaryAction.onPress();
  };

  const handleRightPress = () => {
    primaryAction.onPress();
  };

  return (
    <View style={styles.container}>
      {/* Left Button (Secondary Action) */}
      <View
        style={[
          styles.buttonContainer,
          {
            left: leftButtonPos.x,
            top: leftButtonPos.y,
          }
        ]}
      >
        <Animated.View
          style={[
            styles.floatingButton,
            {
              transform: [{ translateX: leftButtonTranslateX }],
            }
          ]}
        >
          <Animated.View
            style={[
              styles.buttonBackground,
              {
                backgroundColor: secondaryColor,
                width: leftButtonWidth,
              }
            ]}
          >
            <TouchableOpacity
              style={styles.buttonContent}
              onPress={handleLeftPress}
              activeOpacity={0.8}
            >
              <View style={styles.content}>
                <Animated.View
                  style={[
                    styles.iconContainer,
                    { 
                      transform: [{ scale: leftIconScale }],
                      left: 12,
                    }
                  ]}
                >
                  <Text style={styles.icon}>
                    {secondaryAction.icon || '📖'}
                  </Text>
                </Animated.View>
                
                <Animated.View
                  style={[
                    styles.textContainer,
                    { 
                      opacity: leftTextOpacity,
                      left: 44,
                      alignItems: 'flex-start',
                    }
                  ]}
                >
                  <Text style={styles.pillText} numberOfLines={1}>
                    {secondaryAction.title}
                  </Text>
                </Animated.View>
              </View>
            </TouchableOpacity>
          </Animated.View>
        </Animated.View>
      </View>

      {/* Right Button (Primary Action) */}
      <View
        style={[
          styles.buttonContainer,
          {
            left: rightButtonPos.x,
            top: rightButtonPos.y,
          }
        ]}
      >
        <Animated.View
          style={[
            styles.floatingButton,
            {
              transform: [{ translateX: rightButtonTranslateX }],
            }
          ]}
        >
          <Animated.View
            style={[
              styles.buttonBackground,
              {
                backgroundColor: themeColor,
                width: rightButtonWidth,
              }
            ]}
          >
            <TouchableOpacity
              style={styles.buttonContent}
              onPress={handleRightPress}
              activeOpacity={0.8}
            >
              <View style={styles.content}>
                <Animated.View
                  style={[
                    styles.iconContainer,
                    { 
                      transform: [{ scale: rightIconScale }],
                      right: 12,
                    }
                  ]}
                >
                  <Text style={styles.icon}>
                    {primaryAction.icon || '▶'}
                  </Text>
                </Animated.View>
                
                <Animated.View
                  style={[
                    styles.textContainer,
                    { 
                      opacity: rightTextOpacity,
                      right: 44,
                      alignItems: 'flex-end',
                    }
                  ]}
                >
                  <Text style={styles.pillText} numberOfLines={1}>
                    {primaryAction.title}
                  </Text>
                </Animated.View>
              </View>
            </TouchableOpacity>
          </Animated.View>
        </Animated.View>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
    pointerEvents: 'box-none', // Allow touches to pass through to content below
  },
  buttonContainer: {
    position: 'absolute',
    height: 56,
    zIndex: 1000,
    pointerEvents: 'auto', // Ensure buttons can be touched
  },
  floatingButton: {
    height: 56,
    borderWidth: 0,
    borderColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonBackground: {
    height: 56,
    borderRadius: 28, // This will create a pill shape when width > height
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonContent: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '100%',
  },
  iconContainer: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
  },
  textContainer: {
    position: 'absolute',
    height: 56, // Match button height for proper vertical centering
    justifyContent: 'center',
    alignItems: 'center',
  },
  pillText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
  },
  icon: {
    fontSize: 16,
    color: '#ffffff',
  },
});