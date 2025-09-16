import React, { useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { theme } from '../styles/theme';

interface BottomActionBarProps {
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
}

export const BottomActionBar: React.FC<BottomActionBarProps> = ({
  primaryAction,
  secondaryAction,
  primaryColor = '#FF6B6B',
  secondaryColor = '#4ECDC4',
}) => {
  const primaryScale = useRef(new Animated.Value(1)).current;
  const secondaryScale = useRef(new Animated.Value(1)).current;

  const handlePrimaryPress = () => {
    // Squeeze animation
    Animated.sequence([
      Animated.timing(primaryScale, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(primaryScale, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    primaryAction.onPress();
  };

  const handleSecondaryPress = () => {
    // Squeeze animation
    Animated.sequence([
      Animated.timing(secondaryScale, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(secondaryScale, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    secondaryAction.onPress();
  };

  return (
    <View style={styles.container}>
      <View style={styles.actionBar}>
        {/* Secondary Action (Tutorial) - Outline Style */}
        <Animated.View style={{ transform: [{ scale: secondaryScale }] }}>
          <TouchableOpacity
            style={[
              styles.secondaryButton,
              { borderColor: secondaryColor }
            ]}
            onPress={handleSecondaryPress}
            activeOpacity={0.8}
          >
            <View style={styles.buttonContent}>
              {secondaryAction.icon && (
                <Text style={[styles.icon, { color: secondaryColor }]}>
                  {secondaryAction.icon}
                </Text>
              )}
              <Text style={[styles.secondaryText, { color: secondaryColor }]}>
                {secondaryAction.title}
              </Text>
            </View>
          </TouchableOpacity>
        </Animated.View>

        {/* Primary Action (Start) - Solid Style */}
        <Animated.View style={{ transform: [{ scale: primaryScale }] }}>
          <TouchableOpacity
            style={[
              styles.primaryButton,
              { backgroundColor: primaryColor }
            ]}
            onPress={handlePrimaryPress}
            activeOpacity={0.8}
          >
            <View style={styles.buttonContent}>
              {primaryAction.icon && (
                <Text style={styles.primaryIcon}>
                  {primaryAction.icon}
                </Text>
              )}
              <Text style={styles.primaryText}>
                {primaryAction.title}
              </Text>
            </View>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 80, // Position right above the tab bar
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingBottom: 0,
    paddingTop: 16,
    backgroundColor: 'transparent',
  },
  actionBar: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderRadius: 20,
    paddingVertical: 4,
    paddingHorizontal: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
    gap: 6,
  },
  secondaryButton: {
    flex: 0.3,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1.5,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButton: {
    flex: 0.7,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 3,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    fontSize: 16,
    marginRight: 6,
  },
  primaryIcon: {
    fontSize: 16,
    marginRight: 6,
    color: '#ffffff',
  },
  secondaryText: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'System',
  },
  primaryText: {
    fontSize: 16,
    fontWeight: '700',
    fontFamily: 'System',
    color: '#ffffff',
  },
});