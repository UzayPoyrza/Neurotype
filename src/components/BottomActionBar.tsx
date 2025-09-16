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
  themeColor?: string;
  globalBackgroundColor?: string;
}

export const BottomActionBar: React.FC<BottomActionBarProps> = ({
  primaryAction,
  secondaryAction,
  primaryColor = '#FF6B6B',
  secondaryColor = '#4ECDC4',
  themeColor = '#6B73FF',
  globalBackgroundColor = '#f2f2f7',
}) => {
  const primaryScale = useRef(new Animated.Value(1)).current;
  const secondaryScale = useRef(new Animated.Value(1)).current;

  // Convert any color format to rgba with opacity for glass effect
  const colorToRgba = (color: string, opacity: number) => {
    console.log('Converting color:', color);
    
    // If it's already rgba, just update the opacity
    if (color.startsWith('rgba(')) {
      const rgbaMatch = color.match(/rgba\((\d+),\s*(\d+),\s*(\d+),\s*[\d.]+\)/);
      if (rgbaMatch) {
        const [, r, g, b] = rgbaMatch;
        console.log('Already rgba, updating opacity:', r, g, b, opacity);
        return `rgba(${r}, ${g}, ${b}, ${opacity})`;
      }
    }
    
    // If it's rgb, convert to rgba
    if (color.startsWith('rgb(')) {
      const rgbMatch = color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
      if (rgbMatch) {
        const [, r, g, b] = rgbMatch;
        console.log('Converting rgb to rgba:', r, g, b, opacity);
        return `rgba(${r}, ${g}, ${b}, ${opacity})`;
      }
    }
    
    // If it's hex, convert to rgba
    if (color.startsWith('#')) {
      let cleanHex = color.replace('#', '');
      
      // If it's a 3-character hex, expand it
      if (cleanHex.length === 3) {
        cleanHex = cleanHex.split('').map(char => char + char).join('');
      }
      
      if (cleanHex.length === 6) {
        const r = parseInt(cleanHex.slice(0, 2), 16);
        const g = parseInt(cleanHex.slice(2, 4), 16);
        const b = parseInt(cleanHex.slice(4, 6), 16);
        console.log('Converting hex to rgba:', r, g, b, opacity);
        return `rgba(${r}, ${g}, ${b}, ${opacity})`;
      }
    }
    
    // Fallback for unknown formats
    console.log('Unknown color format, using fallback:', color);
    return `rgba(242, 242, 247, ${opacity})`;
  };


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
              { borderColor: '#6B7280' }
            ]}
            onPress={handleSecondaryPress}
            activeOpacity={0.8}
          >
            <View style={styles.buttonContent}>
              {secondaryAction.icon && (
                <Text style={[styles.icon, { color: '#6B7280' }]}>
                  {secondaryAction.icon}
                </Text>
              )}
              <Text style={[styles.secondaryText, { color: '#6B7280' }]}>
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
              { backgroundColor: themeColor }
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
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.15)',
    gap: 16,
    overflow: 'hidden',
  },
  secondaryButton: {
    flex: 0.3,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 8,
    borderWidth: 1.5,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButton: {
    flex: 0.7,
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
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