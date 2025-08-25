import React, { useState, useImperativeHandle, forwardRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { theme } from '../styles/theme';

interface SearchTopNavProps {
  onSearch?: (query: string) => void;
  placeholder?: string;
}

export interface SearchTopNavRef {
  showSearchBar: () => void;
  hideSearchBar: () => void;
}

export const SearchTopNav = forwardRef<SearchTopNavRef, SearchTopNavProps>(({
  onSearch,
  placeholder = "Search interventions..."
}, ref) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isVisible, setIsVisible] = useState(true);
  const translateY = new Animated.Value(0);

  const showSearchBar = () => {
    if (!isVisible) {
      setIsVisible(true);
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }).start();
    }
  };

  const hideSearchBar = () => {
    if (isVisible) {
      setIsVisible(false);
      Animated.spring(translateY, {
        toValue: -60,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }).start();
    }
  };

  useImperativeHandle(ref, () => ({
    showSearchBar,
    hideSearchBar,
  }));

  const handleSearch = (text: string) => {
    setSearchQuery(text);
    if (onSearch) {
      onSearch(text);
    }
  };

  return (
    <Animated.View 
      style={[
        styles.container,
        {
          transform: [{ translateY }],
        }
      ]}
    >
      <View style={styles.content}>
        <View style={styles.searchContainer}>
          <View style={styles.searchIcon}>
            <Text style={styles.searchIconText}>🔍</Text>
          </View>
          <TextInput
            style={styles.searchInput}
            placeholder={placeholder}
            placeholderTextColor={theme.colors.secondary}
            value={searchQuery}
            onChangeText={handleSearch}
            returnKeyType="search"
          />
        </View>
      </View>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.surface,
    borderBottomWidth: theme.borders.width.thick,
    borderBottomColor: theme.colors.primary,
    ...theme.shadows.medium,
    zIndex: 1000,
  },
  content: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    paddingTop: theme.spacing.lg + 20, // Extra padding for status bar
    minHeight: 60,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
    borderRadius: theme.borders.radius.lg,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderWidth: theme.borders.width.normal,
    borderColor: theme.colors.primary,
    ...theme.shadows.small,
  },
  searchIcon: {
    marginRight: theme.spacing.sm,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchIconText: {
    fontSize: 16,
    color: theme.colors.secondary,
  },
  searchInput: {
    flex: 1,
    fontSize: theme.typography.sizes.md,
    color: theme.colors.primary,
    fontFamily: theme.typography.fontFamily,
    paddingVertical: 0,
  },
});