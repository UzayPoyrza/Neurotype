import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';

interface PrimaryButtonProps {
  title: string;
  onPress: () => void;
  testID?: string;
  disabled?: boolean;
}

export const PrimaryButton: React.FC<PrimaryButtonProps> = ({ 
  title, 
  onPress, 
  testID,
  disabled = false 
}) => {
  return (
    <TouchableOpacity
      style={[
        styles.button,
        disabled ? styles.disabledButton : styles.enabledButton,
      ]}
      onPress={onPress}
      disabled={disabled}
      testID={testID}
    >
      <Text style={[
        styles.buttonText,
        disabled ? styles.disabledText : styles.enabledText,
      ]}>
        {title}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: { width: 1, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  enabledButton: {
    backgroundColor: '#0A84FF',
    borderColor: '#0A84FF',
  },
  disabledButton: {
    backgroundColor: '#2C2C2E',
    borderColor: '#3A3A3C',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'System',
  },
  enabledText: {
    color: '#ffffff',
  },
  disabledText: {
    color: '#6B6B7B',
  },
}); 