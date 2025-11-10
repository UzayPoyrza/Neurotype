import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { theme } from '../styles/theme';

interface TopNavProps {
  title: string;
  showBackButton?: boolean;
  onBackPress?: () => void;
  rightComponent?: React.ReactNode;
  titleMaxLength?: number;
}

export const TopNav: React.FC<TopNavProps> = ({
  title,
  showBackButton = false,
  onBackPress,
  rightComponent,
  titleMaxLength,
}) => {
  const navigation = useNavigation();

  const handleBackPress = () => {
    if (onBackPress) {
      onBackPress();
    } else {
      navigation.goBack();
    }
  };

  return (
    <View style={styles.container}>
      {/* TopShell - Always visible status bar padding */}
      <View style={styles.topShell}>
        <View style={styles.topShellContent}>
          {/* Status bar padding only */}
        </View>
      </View>

      {/* Static header content */}
      <View style={styles.headerContent}>
        <View style={styles.content}>
          {/* Left side - Back button or empty space */}
          <View style={styles.leftSection}>
            {showBackButton && (
              <TouchableOpacity
                style={styles.backButton}
                onPress={handleBackPress}
                testID="top-nav-back-button"
              >
                <Text style={styles.backButtonText}>←</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Center - Title */}
          <View style={styles.centerSection}>
            <Text style={styles.title} numberOfLines={1}>
              {titleMaxLength && title.length > titleMaxLength
                ? `${title.slice(0, titleMaxLength).trimEnd()}...`
                : title}
            </Text>
          </View>

          {/* Right side - Optional component or empty space */}
          <View style={styles.rightSection}>
            {rightComponent}
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.surface,
    borderBottomWidth: theme.borders.width.thick,
    borderBottomColor: theme.colors.primary,
    ...theme.shadows.medium,
    zIndex: 1000,
  },
  topShell: {
    height: 60, // Fixed height for status bar + padding
  },
  topShellContent: {
    flex: 1,
    paddingTop: 20, // Status bar padding
  },
  headerContent: {
    backgroundColor: theme.colors.surface,
    ...theme.shadows.medium,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    minHeight: 60,
  },
  leftSection: {
    flex: 1,
    alignItems: 'flex-start',
  },
  centerSection: {
    flex: 2,
    alignItems: 'center',
  },
  rightSection: {
    flex: 1,
    alignItems: 'flex-end',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: theme.borders.radius.md,
    backgroundColor: theme.colors.background,
    borderWidth: theme.borders.width.normal,
    borderColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...theme.shadows.small,
  },
  backButtonText: {
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.primary,
    fontFamily: theme.typography.fontFamily,
  },
  title: {
    fontSize: theme.typography.sizes.xl,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.primary,
    fontFamily: theme.typography.fontFamily,
    textAlign: 'center',
  },
}); 