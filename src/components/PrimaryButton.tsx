import React from 'react';
import { Text, TouchableOpacity, TouchableOpacityProps, StyleSheet } from 'react-native';

interface PrimaryButtonProps extends TouchableOpacityProps {
  title: string;
  testID?: string;
  variant?: 'primary' | 'secondary';
}

export const PrimaryButton: React.FC<PrimaryButtonProps> = ({ 
  title, 
  testID, 
  variant = 'primary',
  disabled = false,
  ...props 
}) => {
  return (
    <TouchableOpacity
      testID={testID}
      style={[
        styles.button,
        variant === 'primary' ? styles.primaryButton : styles.secondaryButton,
        disabled && styles.disabled
      ]}
      disabled={disabled}
      {...props}
    >
      <Text style={[
        styles.text,
        variant === 'primary' ? styles.primaryText : styles.secondaryText
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
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: '#3b82f6',
  },
  secondaryButton: {
    backgroundColor: '#e5e7eb',
  },
  disabled: {
    opacity: 0.5,
  },
  text: {
    fontSize: 16,
    fontWeight: '600',
  },
  primaryText: {
    color: '#ffffff',
  },
  secondaryText: {
    color: '#374151',
  },
}); 