import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { theme } from '../../styles/theme';

interface UserIconProps {
  size?: number;
  profileIcon?: string;
  onPress?: () => void;
}

export const UserIcon: React.FC<UserIconProps> = ({ 
  size = 40, 
  profileIcon = '👤',
  onPress 
}) => {
  const iconSize = size * 0.6; // Icon should be 60% of container size
  
  return (
    <TouchableOpacity
      style={[
        styles.container,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
        }
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text style={[styles.icon, { fontSize: iconSize }]}>
        {profileIcon}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.surface,
    borderWidth: theme.borders.width.thick,
    borderColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...theme.shadows.medium,
  },
  icon: {
    textAlign: 'center',
  },
});