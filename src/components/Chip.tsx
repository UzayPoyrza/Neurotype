import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';

interface ChipProps {
  label: string;
  selected: boolean;
  onPress: () => void;
}

export const Chip: React.FC<ChipProps> = ({ label, selected, onPress }) => {
  const theme = useTheme();

  return (
    <TouchableOpacity
      style={[
        styles.chip,
        {
          paddingHorizontal: theme.spacing.lg,
          paddingVertical: theme.spacing.sm,
          borderRadius: theme.borders.radius.xxl,
          borderWidth: theme.borders.width.normal,
          backgroundColor: selected ? theme.colors.primary : theme.colors.surface,
          borderColor: theme.colors.primary,
          ...theme.shadows.small,
        },
      ]}
      onPress={onPress}
    >
      <Text style={[
        styles.chipText,
        {
          fontSize: theme.typography.sizes.sm,
          fontWeight: theme.typography.weights.semibold,
          fontFamily: theme.typography.fontFamily,
          color: selected ? theme.colors.surface : theme.colors.primary,
        },
      ]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  chip: {},
  chipText: {},
});
