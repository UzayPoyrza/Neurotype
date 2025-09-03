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

type Corner = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';

interface DraggableFloatingButtonProps {
  backgroundColor: string;
  onPress: () => void;
  icon?: string;
}

export const DraggableFloatingButton: React.FC<DraggableFloatingButtonProps> = ({
  backgroundColor,
  onPress,
  icon = '🔄',
}) => {
  const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
  const buttonSize = 56;
  const margin = 20;
  
  // Corner positions - fixed to screen viewport
  const corners = {
    'top-left': { x: margin, y: 100 },
    'top-right': { x: screenWidth - buttonSize - margin, y: 100 },
    'bottom-left': { x: margin, y: screenHeight - buttonSize - margin - 100 },
    'bottom-right': { x: screenWidth - buttonSize - margin, y: screenHeight - buttonSize - margin - 100 },
  };

  const [currentCorner, setCurrentCorner] = useState<Corner>('bottom-right');
  const [position, setPosition] = useState(corners[currentCorner]);
  const [isDragging, setIsDragging] = useState(false);
  
  const pan = useRef(new Animated.ValueXY()).current;
  const scale = useRef(new Animated.Value(1)).current;

  // Initialize position
  useEffect(() => {
    pan.setValue(corners[currentCorner]);
  }, []);

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
        useNativeDriver: false, // Keep consistent with PanResponder
        tension: 100,
        friction: 8,
      }),
      Animated.spring(scale, {
        toValue: 1,
        useNativeDriver: false, // Changed to false to match pan
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
        
        // Get current position from animated value
        const currentPos = {
          x: (pan.x as any)._value,
          y: (pan.y as any)._value,
        };
        setPosition(currentPos);
        
        // Set up offset for relative dragging
        pan.setOffset(currentPos);
        pan.setValue({ x: 0, y: 0 });
        
        // Scale up when dragging starts
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
        
        // Flatten offset to get absolute position
        pan.flattenOffset();
        
        // Get final position
        const finalX = (pan.x as any)._value;
        const finalY = (pan.y as any)._value;
        
        // Keep within bounds
        const boundedX = Math.max(margin, Math.min(screenWidth - buttonSize - margin, finalX));
        const boundedY = Math.max(100, Math.min(screenHeight - buttonSize - 120, finalY));
        
        // Find nearest corner and snap to it
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
      <TouchableOpacity
        style={[styles.floatingButton, { backgroundColor }]}
        onPress={onPress}
        activeOpacity={0.8}
        disabled={isDragging}
      >
        <Text style={styles.buttonIcon}>{icon}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    width: 56,
    height: 56,
    zIndex: 1000, // Very high z-index to stay above everything
  },
  floatingButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonIcon: {
    fontSize: 20,
    color: theme.colors.surface,
  },
});