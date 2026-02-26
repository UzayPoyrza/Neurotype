import React, { useRef } from 'react';
import { TouchableOpacity, Text, StyleSheet, Animated, Vibration } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';

interface AnimatedTabIconProps {
  children: React.ReactNode;
  focused: boolean;
  onPress: () => void;
  label: string;
}

export const AnimatedTabIcon: React.FC<AnimatedTabIconProps> = ({
  children,
  focused,
  onPress,
  label,
}) => {
  const theme = useTheme();
  const scaleAnimation = useRef(new Animated.Value(1)).current;

  const handlePress = () => {
    // Trigger vibration
    Vibration.vibrate(50); // 50ms vibration

    // Squeeze animation
    Animated.sequence([
      Animated.timing(scaleAnimation, {
        toValue: 0.8,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnimation, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    // Call the original onPress
    onPress();
  };

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      <Animated.View
        style={[
          styles.iconContainer,
          {
            transform: [{ scale: scaleAnimation }],
          },
        ]}
      >
        {children}
      </Animated.View>
      <Text style={[
        styles.label,
        { color: focused ? theme.colors.text.primary : theme.colors.text.secondary },
      ]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: -3,
  },
  label: {
    fontSize: 12,
    marginTop: 4,
    fontWeight: '500',
  },
});
