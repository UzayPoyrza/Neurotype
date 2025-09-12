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
import { theme } from '../styles/theme';
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

export const AnimatedFloatingButton: React.FC<AnimatedFloatingButtonProps> = ({
  backgroundColor,
  onPress,
  isPillMode,
  onScroll,
  onDragStart,
}) => {
  const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
  const buttonSize = 56;
  const pillWidth = 140;
  const margin = 16;
  
  // Corner positions
  const corners = {
    'top-left': { x: margin, y: 80 },
    'top-right': { x: screenWidth - buttonSize - margin, y: 80 },
    'bottom-left': { x: margin, y: screenHeight - buttonSize - margin - 80 },
    'bottom-right': { x: screenWidth - buttonSize - margin, y: screenHeight - buttonSize - margin - 80 },
  };

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

  // Initialize position only on first mount
  const [isInitialized, setIsInitialized] = useState(false);
  
  useEffect(() => {
    if (!isInitialized) {
      pan.setValue(corners[currentCorner]);
      setIsInitialized(true);
    }
  }, [isInitialized]);

  // Animate to pill mode
  useEffect(() => {
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
          useNativeDriver: true,
        }),
        Animated.timing(textOpacity, {
          toValue: 1,
          duration: 200,
          delay: 150,
          useNativeDriver: true,
        }),
        Animated.timing(iconScale, {
          toValue: 0.9,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(buttonWidth, {
          toValue: buttonSize,
          duration: 300,
          useNativeDriver: false, // Width animation requires layout driver
        }),
        Animated.timing(buttonTranslateX, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(textOpacity, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(iconScale, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
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
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
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
        
        const boundedX = Math.max(margin, Math.min(screenWidth - buttonSize - margin, finalX));
        const boundedY = Math.max(80, Math.min(screenHeight - buttonSize - 100, finalY));
        
        const nearestCorner = findNearestCorner(boundedX, boundedY);
        snapToCorner(nearestCorner);
      },
    })
  ).current;

  return (
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
            }
          ]}
        >
        <TouchableOpacity
          style={styles.buttonContent}
          onPress={onPress}
          activeOpacity={0.8}
          disabled={isDragging}
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
              }
            ]}
          >
            <Text style={styles.pillText} numberOfLines={1}>
              Change Module
            </Text>
          </Animated.View>
        </View>
        </TouchableOpacity>
        </Animated.View>
      </Animated.View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    height: 56,
    zIndex: 1000,
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
    justifyContent: 'center',
    alignItems: 'center',
  },
  pillText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
});