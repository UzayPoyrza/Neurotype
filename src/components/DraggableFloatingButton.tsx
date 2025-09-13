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

// Classic circular refresh icon using SVG (matches common refresh/swap symbol)
const ChangeIcon: React.FC<{ size: number; color: string }> = ({ size, color }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    {/* Path adapted from the widely-recognized refresh/autorenew glyph */}
    <Path
      d="M12 6V3L8 7l4 4V8c3.31 0 6 2.69 6 6 0 .34-.03.67-.08 1h2.02c.04-.33.06-.66.06-1 0-4.42-3.58-8-8-8zM6 12c0-.34.03-.67.08-1H2.06c-.04.33-.06.66-.06 1 0 4.42 3.58 8 8 8v3l4-4-4-4v3c-3.31 0-6-2.69-6-6z"
      fill={color}
    />
  </Svg>
);

type Corner = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';

interface DraggableFloatingButtonProps {
  backgroundColor: string;
  onPress: () => void;
}

export const DraggableFloatingButton: React.FC<DraggableFloatingButtonProps> = ({
  backgroundColor,
  onPress,
}) => {
  const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
  const buttonSize = 56; // Match play button size
  const margin = 16; // Better spacing from corners
  
  // Corner positions - fixed to screen viewport, closer to corners
  const corners = {
    'top-left': { x: margin, y: 80 },
    'top-right': { x: screenWidth - buttonSize - margin, y: 80 },
    'bottom-left': { x: margin, y: screenHeight - buttonSize - margin - 80 },
    'bottom-right': { x: screenWidth - buttonSize - margin, y: screenHeight - buttonSize - margin - 80 },
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
        const boundedY = Math.max(80, Math.min(screenHeight - buttonSize - 100, finalY));
        
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
        style={[styles.floatingButton, { backgroundColor: backgroundColor }]}
        onPress={onPress}
        activeOpacity={0.8}
        disabled={isDragging}
      >
        <ChangeIcon size={20} color="#ffffff" />
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
});