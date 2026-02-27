import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  PanResponder,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../contexts/ThemeContext';
import Svg, { Path } from 'react-native-svg';

// Classic circular refresh icon using SVG
const ChangeIcon: React.FC<{ size: number; color: string }> = ({ size, color }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M12 6V3L8 7l4 4V8c3.31 0 6 2.69 6 6 0 .34-.03.67-.08 1h2.02c.04-.33.06-.66.06-1 0-4.42-3.58-8-8-8zM6 12c0-.34.03-.67.08-1H2.06c-.04.33-.06.66-.06 1 0 4.42 3.58 8 8 8v3l4-4-4-4v3c-3.31 0-6-2.69-6-6z"
      fill={color}
    />
  </Svg>
);

type Corner = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';

interface AnimatedFloatingButtonProps {
  backgroundColor: string;
  onPress: () => void;
  isPillMode: boolean;
  onScroll?: (scrollY: number) => void;
  onDragStart?: () => void;
}

const AnimatedFloatingButtonComponent: React.FC<AnimatedFloatingButtonProps> = ({
  backgroundColor,
  onPress,
  isPillMode,
  onScroll,
  onDragStart,
}) => {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = Dimensions.get('window');
  const buttonSize = 56;
  const pillWidth = 120;
  const margin = 16;
  // Tab bar is position:absolute, so content extends behind it
  // Tab bar height = 55 + Math.max(insets.bottom, 10) (matches AnimatedTabBar)
  const tabBarHeight = 55 + Math.max(insets.bottom, 10);

  // Container height measured via onLayout (parent is position:absolute filling the screen area)
  const [containerHeight, setContainerHeight] = useState(0);
  const containerHeightRef = useRef(0);
  const tabBarHeightRef = useRef(tabBarHeight);
  tabBarHeightRef.current = tabBarHeight;

  const handleLayout = (event: any) => {
    const height = event.nativeEvent.layout.height;
    if (height > 0) {
      setContainerHeight(height);
      containerHeightRef.current = height;
    }
  };

  const getCorners = (height: number, tabBar: number) => ({
    'top-left': { x: margin, y: 130 },
    'top-right': { x: screenWidth - buttonSize - margin, y: 130 },
    'bottom-left': { x: margin, y: height - tabBar - buttonSize - 6 },
    'bottom-right': { x: screenWidth - buttonSize - margin, y: height - tabBar - buttonSize - 6 },
  });

  const corners = getCorners(containerHeight || 600, tabBarHeight);

  const [currentCorner, setCurrentCorner] = useState<Corner>('bottom-right');
  const [position, setPosition] = useState(corners[currentCorner]);
  const [isDragging, setIsDragging] = useState(false);

  // Determine if button is on left or right side for proper expansion direction
  const isLeftSide = currentCorner === 'top-left' || currentCorner === 'bottom-left';

  const pan = useRef(new Animated.ValueXY()).current;
  const scale = useRef(new Animated.Value(1)).current;
  const buttonWidth = useRef(new Animated.Value(buttonSize)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const iconScale = useRef(new Animated.Value(1)).current;
  const buttonTranslateX = useRef(new Animated.Value(0)).current;

  // Initialize position once container height is measured
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (containerHeight > 0 && !isInitialized) {
      const targetPos = getCorners(containerHeight, tabBarHeight)[currentCorner];
      pan.setValue(targetPos);
      setPosition(targetPos);
      setIsInitialized(true);
    }
  }, [containerHeight, isInitialized]);

  // Animate to pill mode
  useEffect(() => {
    // Stop any running animations first to prevent jittering
    buttonWidth.stopAnimation();
    buttonTranslateX.stopAnimation();
    textOpacity.stopAnimation();
    iconScale.stopAnimation();

    if (isPillMode) {
      // Calculate how much to translate left for right-side buttons
      const translateAmount = isLeftSide ? 0 : -(pillWidth - buttonSize);

      Animated.parallel([
        Animated.timing(buttonWidth, {
          toValue: pillWidth,
          duration: 300,
          useNativeDriver: false, // Width animation requires layout driver
        }),
        Animated.timing(buttonTranslateX, {
          toValue: translateAmount,
          duration: 300,
          useNativeDriver: false, // Match the width animation driver for perfect sync
        }),
        Animated.timing(textOpacity, {
          toValue: 1,
          duration: 200,
          delay: 150,
          useNativeDriver: true,
        }),
        Animated.timing(iconScale, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Hide text first, then collapse button width
      Animated.sequence([
        Animated.timing(textOpacity, {
          toValue: 0,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.parallel([
          Animated.timing(buttonWidth, {
            toValue: buttonSize,
            duration: 300,
            useNativeDriver: false, // Width animation requires layout driver
          }),
          Animated.timing(buttonTranslateX, {
            toValue: 0,
            duration: 300,
            useNativeDriver: false, // Match the width animation driver for perfect sync
          }),
          Animated.timing(iconScale, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
        ]),
      ]).start();
    }
  }, [isPillMode, isLeftSide]);

  const findNearestCorner = (x: number, y: number): Corner => {
    const distances = Object.entries(corners).map(([corner, pos]) => ({
      corner: corner as Corner,
      distance: Math.sqrt(Math.pow(x - pos.x, 2) + Math.pow(y - pos.y, 2)),
    }));

    return distances.reduce((nearest, current) =>
      current.distance < nearest.distance ? current : nearest
    ).corner;
  };

  const snapToCorner = (corner: Corner) => {
    const targetPos = corners[corner];

    Animated.parallel([
      Animated.spring(pan, {
        toValue: targetPos,
        useNativeDriver: false,
        tension: 100,
        friction: 8,
      }),
      Animated.spring(scale, {
        toValue: 1,
        useNativeDriver: false,
        tension: 100,
        friction: 8,
      }),
    ]).start();

    setCurrentCorner(corner);
    setPosition(targetPos);
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        // Only capture when there's significant movement (dragging, not scrolling)
        // Increase threshold to avoid interfering with scroll
        const moved = Math.abs(gestureState.dx) > 15 || Math.abs(gestureState.dy) > 15;
        return moved;
      },
      onPanResponderGrant: () => {
        setIsDragging(true);

        // Notify parent component that dragging has started
        if (onDragStart) {
          onDragStart();
        }

        const currentPos = {
          x: (pan.x as any)._value,
          y: (pan.y as any)._value,
        };
        setPosition(currentPos);

        pan.setOffset(currentPos);
        pan.setValue({ x: 0, y: 0 });

        Animated.spring(scale, {
          toValue: 1.15,
          useNativeDriver: false,
          tension: 150,
          friction: 8,
        }).start();
      },
      onPanResponderMove: Animated.event(
        [null, { dx: pan.x, dy: pan.y }],
        { useNativeDriver: false }
      ),
      onPanResponderRelease: (evt, gestureState) => {
        setIsDragging(false);

        pan.flattenOffset();

        const finalX = (pan.x as any)._value;
        const finalY = (pan.y as any)._value;

        // Use refs for dynamic values to avoid stale closure in PanResponder
        const height = containerHeightRef.current || 600;
        const tabBar = tabBarHeightRef.current;
        const boundedX = Math.max(margin, Math.min(screenWidth - buttonSize - margin, finalX));
        const boundedY = Math.max(130, Math.min(height - tabBar - buttonSize - 6, finalY));

        // Compute corners using current container height and tab bar height
        const currentCorners = getCorners(height, tabBar);
        const distances = Object.entries(currentCorners).map(([corner, pos]) => ({
          corner: corner as Corner,
          distance: Math.sqrt(Math.pow(boundedX - pos.x, 2) + Math.pow(boundedY - pos.y, 2)),
        }));
        const nearestCorner = distances.reduce((nearest, current) =>
          current.distance < nearest.distance ? current : nearest
        ).corner;

        const targetPos = currentCorners[nearestCorner];
        Animated.parallel([
          Animated.spring(pan, {
            toValue: targetPos,
            useNativeDriver: false,
            tension: 100,
            friction: 8,
          }),
          Animated.spring(scale, {
            toValue: 1,
            useNativeDriver: false,
            tension: 100,
            friction: 8,
          }),
        ]).start();
        setCurrentCorner(nearestCorner);
        setPosition(targetPos);
      },
      onPanResponderTerminate: () => {
        setIsDragging(false);
      },
    })
  ).current;

  return (
    <View style={styles.layoutContainer} onLayout={handleLayout} pointerEvents="box-none">
      {isInitialized && (
      <Animated.View
        style={[
          styles.container,
          {
            transform: [
              { translateX: pan.x },
              { translateY: pan.y },
              { scale },
            ],
          },
        ]}
        {...panResponder.panHandlers}
      >
      <Animated.View
        style={[
          styles.floatingButton,
          {
            transform: [{ translateX: buttonTranslateX }],
          }
        ]}
      >
        <Animated.View
          style={[
            styles.buttonBackground,
            {
              backgroundColor: backgroundColor,
              width: buttonWidth,
              shadowOpacity: theme.isDark ? 0.3 : 0.06,
            }
          ]}
        >
        <TouchableOpacity
          style={styles.buttonContent}
          onPress={onPress}
          activeOpacity={0.8}
          disabled={isDragging}
          delayPressIn={0}
          delayPressOut={0}
          delayLongPress={500}
        >
        <View style={styles.content}>
          <Animated.View
            style={[
              styles.iconContainer,
              {
                transform: [{ scale: iconScale }],
                left: isLeftSide ? 12 : undefined,
                right: isLeftSide ? undefined : 12,
              }
            ]}
          >
            <ChangeIcon size={20} color="#ffffff" />
          </Animated.View>

          <Animated.View
            style={[
              styles.textContainer,
              {
                opacity: textOpacity,
                left: isLeftSide ? 44 : 12,
                right: isLeftSide ? 12 : 44,
                alignItems: isLeftSide ? 'flex-start' : 'flex-end',
                justifyContent: 'center',
              }
            ]}
          >
            <Text style={[styles.pillText, { marginTop: 1 }]} numberOfLines={1}>
              Change
            </Text>
          </Animated.View>
        </View>
        </TouchableOpacity>
        </Animated.View>
      </Animated.View>
      </Animated.View>
      )}
    </View>
  );
};

// Memoize to prevent re-renders when props haven't changed
export const AnimatedFloatingButton = React.memo(AnimatedFloatingButtonComponent);

const styles = StyleSheet.create({
  layoutContainer: {
    ...StyleSheet.absoluteFillObject,
  },
  container: {
    position: 'absolute',
    height: 56,
    zIndex: 1000,
    pointerEvents: 'box-none',
  },
  floatingButton: {
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    pointerEvents: 'auto',
  },
  buttonBackground: {
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 6,
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
});
