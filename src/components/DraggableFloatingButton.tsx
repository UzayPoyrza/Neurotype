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

// Clear change/swap icon component
const ChangeIcon: React.FC<{ size: number; color: string }> = ({ size, color }) => (
  <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
    <View style={{
      width: size * 0.8,
      height: size * 0.8,
      justifyContent: 'center',
      alignItems: 'center',
    }}>
      {/* Two curved arrows forming a swap symbol */}
      <View style={{
        position: 'absolute',
        width: size * 0.3,
        height: size * 0.3,
        borderWidth: 2,
        borderColor: color,
        borderTopColor: 'transparent',
        borderRightColor: 'transparent',
        borderRadius: size * 0.15,
        transform: [{ rotate: '45deg' }, { translateX: -size * 0.1 }, { translateY: -size * 0.1 }],
      }} />
      
      {/* Arrow head for first arrow */}
      <View style={{
        position: 'absolute',
        width: size * 0.08,
        height: 2,
        backgroundColor: color,
        transform: [{ rotate: '45deg' }, { translateX: -size * 0.05 }, { translateY: -size * 0.15 }],
      }} />
      <View style={{
        position: 'absolute',
        width: size * 0.08,
        height: 2,
        backgroundColor: color,
        transform: [{ rotate: '-45deg' }, { translateX: -size * 0.15 }, { translateY: -size * 0.05 }],
      }} />
      
      {/* Second curved arrow */}
      <View style={{
        position: 'absolute',
        width: size * 0.3,
        height: size * 0.3,
        borderWidth: 2,
        borderColor: color,
        borderBottomColor: 'transparent',
        borderLeftColor: 'transparent',
        borderRadius: size * 0.15,
        transform: [{ rotate: '45deg' }, { translateX: size * 0.1 }, { translateY: size * 0.1 }],
      }} />
      
      {/* Arrow head for second arrow */}
      <View style={{
        position: 'absolute',
        width: size * 0.08,
        height: 2,
        backgroundColor: color,
        transform: [{ rotate: '45deg' }, { translateX: size * 0.05 }, { translateY: size * 0.15 }],
      }} />
      <View style={{
        position: 'absolute',
        width: size * 0.08,
        height: 2,
        backgroundColor: color,
        transform: [{ rotate: '-45deg' }, { translateX: size * 0.15 }, { translateY: size * 0.05 }],
      }} />
    </View>
  </View>
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
  const buttonSize = 72; // Larger button
  const margin = 8; // Closer to corners
  
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
        style={[styles.floatingButton, { backgroundColor: `${backgroundColor}40` }]}
        onPress={onPress}
        activeOpacity={0.8}
        disabled={isDragging}
      >
        <ChangeIcon size={24} color="rgba(0, 0, 0, 0.8)" />
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    width: 72,
    height: 72,
    zIndex: 1000, // Very high z-index to stay above everything
  },
  floatingButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.2)',
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
    justifyContent: 'center',
    alignItems: 'center',
    backdropFilter: 'blur(8px)',
  },
});