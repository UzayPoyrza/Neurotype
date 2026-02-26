import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';

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
  const theme = useTheme();

  return (
    <TouchableOpacity
      style={[
        styles.button,
        disabled
          ? { backgroundColor: theme.colors.surfaceElevated, borderColor: theme.colors.surfaceElevated }
          : { backgroundColor: theme.colors.accent, borderColor: theme.colors.accent },
      ]}
      onPress={onPress}
      disabled={disabled}
      testID={testID}
    >
      <Text style={[
        styles.buttonText,
        disabled ? { color: theme.colors.text.tertiary } : styles.enabledText,
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
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'System',
  },
  enabledText: {
    color: '#ffffff',
  },
});
