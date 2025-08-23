import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface Slider0to10Props {
  value: number;
  onValueChange: (value: number) => void;
  label: string;
  disabled?: boolean;
}

export const Slider0to10: React.FC<Slider0to10Props> = ({ 
  value, 
  onValueChange, 
  label,
  disabled = false 
}) => {
  const numbers = Array.from({ length: 11 }, (_, i) => i);

  return (
    <View style={styles.container}>
      <Text style={styles.label}>
        {label}
      </Text>
      <View style={styles.sliderContainer}>
        {numbers.map((num) => (
          <TouchableOpacity
            key={num}
            onPress={() => !disabled && onValueChange(num)}
            disabled={disabled}
            style={[
              styles.numberButton,
              value === num ? styles.selectedButton : styles.unselectedButton,
              disabled && styles.disabled
            ]}
          >
            <Text 
              style={[
                styles.numberText,
                value === num ? styles.selectedText : styles.unselectedText
              ]}
            >
              {num}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      <View style={styles.labels}>
        <Text style={styles.endLabel}>Calm</Text>
        <Text style={styles.endLabel}>Anxious</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  label: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  sliderContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  numberButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedButton: {
    backgroundColor: '#3b82f6',
  },
  unselectedButton: {
    backgroundColor: '#e5e7eb',
  },
  disabled: {
    opacity: 0.5,
  },
  numberText: {
    fontSize: 14,
    fontWeight: '500',
  },
  selectedText: {
    color: '#ffffff',
  },
  unselectedText: {
    color: '#6b7280',
  },
  labels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  endLabel: {
    fontSize: 12,
    color: '#6b7280',
  },
}); 