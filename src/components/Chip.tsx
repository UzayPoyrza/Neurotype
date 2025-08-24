import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { theme } from '../styles/theme';

interface ChipProps {
  label: string;
  selected: boolean;
  onPress: () => void;
}

export const Chip: React.FC<ChipProps> = ({ label, selected, onPress }) => {
  return (
    <TouchableOpacity
      style={[
        styles.chip,
        selected ? styles.selectedChip : styles.unselectedChip,
      ]}
      onPress={onPress}
    >
      <Text style={[
        styles.chipText,
        selected ? styles.selectedText : styles.unselectedText,
      ]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borders.radius.xxl,
    borderWidth: theme.borders.width.normal,
    ...theme.shadows.small,
  },
  selectedChip: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  unselectedChip: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.primary,
  },
  chipText: {
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.semibold,
    fontFamily: theme.typography.fontFamily,
  },
  selectedText: {
    color: theme.colors.surface,
  },
  unselectedText: {
    color: theme.colors.primary,
  },
}); 