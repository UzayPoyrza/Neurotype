import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../contexts/ThemeContext';

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
  const theme = useTheme();
  const navigation = useNavigation();

  const handleBackPress = () => {
    if (onBackPress) {
      onBackPress();
    } else {
      navigation.goBack();
    }
  };

  return (
    <View style={[
      styles.container,
      {
        backgroundColor: theme.colors.surface,
        borderBottomColor: theme.colors.primary,
        ...theme.shadows.medium,
      }
    ]}>
      {/* TopShell - Always visible status bar padding */}
      <View style={styles.topShell}>
        <View style={styles.topShellContent}>
          {/* Status bar padding only */}
        </View>
      </View>

      {/* Static header content */}
      <View style={[styles.headerContent, { backgroundColor: theme.colors.surface, ...theme.shadows.medium }]}>
        <View style={[styles.content, { paddingHorizontal: theme.spacing.lg, paddingVertical: theme.spacing.md }]}>
          {/* Left side - Back button or empty space */}
          <View style={styles.leftSection}>
            {showBackButton && (
              <TouchableOpacity
                style={[
                  styles.backButton,
                  {
                    borderRadius: theme.borders.radius.md,
                    backgroundColor: theme.colors.background,
                    borderColor: theme.colors.primary,
                    ...theme.shadows.small,
                  }
                ]}
                onPress={handleBackPress}
                testID="top-nav-back-button"
              >
                <Text style={[
                  styles.backButtonText,
                  {
                    fontSize: theme.typography.sizes.lg,
                    color: theme.colors.primary,
                    fontFamily: theme.typography.fontFamily,
                  }
                ]}>
                  ←
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Center - Title */}
          <View style={styles.centerSection}>
            <Text
              style={[
                styles.title,
                {
                  fontSize: theme.typography.sizes.xl,
                  color: theme.colors.primary,
                  fontFamily: theme.typography.fontFamily,
                }
              ]}
              numberOfLines={1}
            >
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
    borderBottomWidth: 2,
    zIndex: 1000,
  },
  topShell: {
    height: 60, // Fixed height for status bar + padding
  },
  topShellContent: {
    flex: 1,
    paddingTop: 20, // Status bar padding
  },
  headerContent: {},
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonText: {
    fontWeight: '700',
    textAlign: 'center',
  },
  title: {
    fontWeight: '600',
    textAlign: 'center',
  },
});
