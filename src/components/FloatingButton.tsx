import React, { useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { theme } from '../styles/theme';

interface FloatingButtonProps {
  title: string;
  onPress: () => void;
  icon?: string;
  backgroundColor?: string;
  textColor?: string;
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  style?: any;
}

export const FloatingButton: React.FC<FloatingButtonProps> = ({
  title,
  onPress,
  icon,
  backgroundColor = theme.colors.primary,
  textColor = '#ffffff',
  position = 'bottom-right',
  style,
}) => {
  const scaleAnimation = useRef(new Animated.Value(1)).current;

  const handlePress = () => {
    // Squeeze animation similar to other buttons in the app
    Animated.sequence([
      Animated.timing(scaleAnimation, {
        toValue: 0.9,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnimation, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    onPress();
  };

  const getPositionStyle = () => {
    const margin = 20;
    const topMargin = 160; // Increased to account for sticky header + safe area
    
    switch (position) {
      case 'top-left':
        return { top: topMargin, left: margin };
      case 'top-right':
        return { top: topMargin, right: margin };
      case 'bottom-left':
        return { bottom: margin + 80, left: margin }; // Lowered position
      case 'bottom-right':
        return { bottom: margin + 80, right: margin }; // Lowered position
      default:
        return { bottom: margin + 80, right: margin };
    }
  };

  return (
    <Animated.View
      style={[
        styles.container,
        getPositionStyle(),
        { transform: [{ scale: scaleAnimation }] },
        style,
      ]}
    >
      <TouchableOpacity
        style={[
          styles.button,
          { backgroundColor },
        ]}
        onPress={handlePress}
        activeOpacity={0.8}
      >
        <View style={styles.content}>
          {icon && (
            <Text style={[styles.icon, { color: textColor }]}>
              {icon}
            </Text>
          )}
          <Text style={[styles.text, { color: textColor }]}>
            {title}
          </Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    zIndex: 1000,
  },
  button: {
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 14,
    minWidth: 120,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
    borderWidth: 2,
    borderColor: '#000000',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    fontSize: 16,
    marginRight: 6,
  },
  text: {
    fontSize: 15,
    fontWeight: '600',
    fontFamily: 'System',
  },
});