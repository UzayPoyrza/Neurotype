import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface Slider0to10Props {
  value: number;
  onValueChange: (value: number) => void;
  label: string;
}

export const Slider0to10: React.FC<Slider0to10Props> = ({ 
  value, 
  onValueChange, 
  label 
}) => {
  const numbers = Array.from({ length: 11 }, (_, i) => i);

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.sliderContainer}>
        {numbers.map((number) => (
          <TouchableOpacity
            key={number}
            style={[
              styles.numberButton,
              value === number ? styles.selectedButton : styles.unselectedButton,
            ]}
            onPress={() => onValueChange(number)}
          >
            <Text style={[
              styles.numberText,
              value === number ? styles.selectedText : styles.unselectedText,
            ]}>
              {number}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      <View style={styles.scaleLabels}>
        <Text style={styles.scaleLabel}>Low</Text>
        <Text style={styles.scaleLabel}>High</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 12,
    fontFamily: 'System',
  },
  sliderContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  numberButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: { width: 1, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  selectedButton: {
    backgroundColor: '#000000',
    borderColor: '#000000',
  },
  unselectedButton: {
    backgroundColor: '#ffffff',
    borderColor: '#000000',
  },
  numberText: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'System',
  },
  selectedText: {
    color: '#ffffff',
  },
  unselectedText: {
    color: '#000000',
  },
  scaleLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  scaleLabel: {
    fontSize: 12,
    color: '#666666',
    fontFamily: 'System',
  },
}); 