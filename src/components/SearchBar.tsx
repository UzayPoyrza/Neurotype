import React, { useState, useRef } from 'react';
import { View, TextInput, StyleSheet, TouchableOpacity, Text } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { useTheme } from '../contexts/ThemeContext';

interface SearchBarProps {
  placeholder?: string;
  value: string;
  onChangeText: (text: string) => void;
  onSearch?: () => void;
  onClear?: () => void;
  onFocus?: () => void;
  onBlur?: () => void;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  placeholder = "Search interventions...",
  value,
  onChangeText,
  onSearch,
  onClear,
  onFocus,
  onBlur,
}) => {
  const theme = useTheme();
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<TextInput>(null);

  const handleClear = () => {
    onChangeText('');
    onClear?.();
    // Blur the input when clearing to deactivate search
    inputRef.current?.blur();
  };

  return (
    <View
      style={[
        styles.searchContainer,
        {
          backgroundColor: theme.colors.surface,
          borderColor: isFocused ? theme.colors.accent : theme.colors.border,
        },
        isFocused && styles.focusedContainer,
      ]}
    >
      {/* Search Icon */}
      <View style={styles.searchIcon}>
        <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
          <Circle cx="11" cy="11" r="8" stroke={theme.colors.secondary} strokeWidth="2" fill="none"/>
          <Path
            d="m21 21-4.35-4.35"
            stroke={theme.colors.secondary}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </Svg>
      </View>

      {/* Search Input */}
      <TextInput
        ref={inputRef}
        style={[styles.input, { color: theme.colors.text.primary }]}
        placeholder={placeholder}
        placeholderTextColor={theme.colors.secondary}
        value={value}
        onChangeText={onChangeText}
        onFocus={() => {
          setIsFocused(true);
          onFocus?.();
        }}
        onBlur={() => {
          setIsFocused(false);
          onBlur?.();
        }}
        onSubmitEditing={onSearch}
        returnKeyType="search"
        autoCapitalize="none"
        autoCorrect={false}
      />

      {/* Clear Button */}
      {value.length > 0 && (
        <TouchableOpacity
          style={[styles.clearButton, { backgroundColor: theme.colors.surfaceTertiary }]}
          onPress={handleClear}
        >
          <Text style={[styles.clearButtonText, { color: theme.colors.text.primary }]}>✕</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    minHeight: 44,
    width: '100%',
  },
  focusedContainer: {
    shadowOpacity: 0.15,
  },
  searchIcon: {
    marginRight: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    fontSize: 16,
    fontWeight: '400',
    minHeight: 24,
  },
  clearButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  clearButtonText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
});
