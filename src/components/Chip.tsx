import React from 'react';
import { Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Modality, Goal } from '../types';

interface ChipProps {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  variant?: 'modality' | 'goal';
}

export const Chip: React.FC<ChipProps> = ({ 
  label, 
  selected = false, 
  onPress, 
  variant = 'modality' 
}) => {
  const getChipStyle = () => {
    if (selected) {
      return variant === 'modality' ? styles.selectedModality : styles.selectedGoal;
    }
    return styles.unselected;
  };

  const getTextStyle = () => {
    if (selected) {
      return variant === 'modality' ? styles.selectedModalityText : styles.selectedGoalText;
    }
    return styles.unselectedText;
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.chip, getChipStyle()]}
      disabled={!onPress}
    >
      <Text style={[styles.text, getTextStyle()]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
  },
  selectedModality: {
    backgroundColor: '#dbeafe',
    borderColor: '#93c5fd',
  },
  selectedGoal: {
    backgroundColor: '#dcfce7',
    borderColor: '#86efac',
  },
  unselected: {
    backgroundColor: '#f3f4f6',
    borderColor: '#e5e7eb',
  },
  text: {
    fontSize: 12,
    fontWeight: '500',
  },
  selectedModalityText: {
    color: '#1e40af',
  },
  selectedGoalText: {
    color: '#166534',
  },
  unselectedText: {
    color: '#6b7280',
  },
}); 