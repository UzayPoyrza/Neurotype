import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, Easing } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { MentalHealthModule } from '../data/modules';
import { useTheme } from '../contexts/ThemeContext';
import { prerenderedModuleBackgrounds, prerenderedLightModuleBackgrounds } from '../store/useStore';

interface ModuleCardProps {
  module: MentalHealthModule;
  onPress: (moduleId: string) => void;
}

const { width: screenWidth } = Dimensions.get('window');

export const ModuleCard: React.FC<ModuleCardProps> = ({ module, onPress }) => {
  const theme = useTheme();
  const cardMargin = theme.spacing.md;
  const cardsPerRow = 2;
  const cardWidth = (screenWidth - (theme.spacing.lg * 2) - (cardMargin * (cardsPerRow - 1))) / cardsPerRow;

  const scale = useSharedValue(1);

  // Use the subtle background color for the module card
  const backgroundColor = theme.isDark
    ? (prerenderedModuleBackgrounds[module.id] || module.color)
    : (prerenderedLightModuleBackgrounds[module.id] || module.color);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  });

  const handlePressIn = () => {
    scale.value = withTiming(0.98, {
      duration: 150,
      easing: Easing.out(Easing.quad),
    });
  };

  const handlePressOut = () => {
    scale.value = withTiming(1, {
      duration: 200,
      easing: Easing.out(Easing.quad),
    });
  };

  return (
    <Animated.View style={animatedStyle}>
      <TouchableOpacity
        style={[
          styles.card,
          {
            width: cardWidth,
            height: cardWidth,
            backgroundColor,
            borderRadius: theme.borders.radius.lg,
            borderWidth: theme.borders.width.thick,
            borderColor: theme.colors.primary,
            ...theme.shadows.medium,
          }
        ]}
        onPress={() => onPress(module.id)}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}
        accessibilityRole="button"
        accessibilityLabel={`${module.title}, ${module.meditationCount} meditations`}
      >
      <View style={[styles.content, { padding: theme.spacing.lg }]}>
        <View style={[styles.header, { marginBottom: theme.spacing.sm }]}>
          <Text
            style={[
              styles.title,
              {
                fontSize: theme.typography.sizes.lg,
                fontWeight: theme.typography.weights.bold,
                color: theme.colors.primary,
                fontFamily: theme.typography.fontFamily,
                marginRight: theme.spacing.sm,
              }
            ]}
            numberOfLines={2}
          >
            {module.title}
          </Text>
          <View style={[
            styles.badge,
            theme.shadows.small,
            {
              backgroundColor: theme.colors.surface,
              borderRadius: theme.borders.radius.sm,
              paddingHorizontal: theme.spacing.sm,
              paddingVertical: theme.spacing.xs,
              borderWidth: theme.borders.width.normal,
              borderColor: theme.colors.primary,
            }
          ]}>
            <Text style={[
              styles.badgeText,
              {
                fontSize: theme.typography.sizes.sm,
                fontWeight: theme.typography.weights.bold,
                color: theme.colors.primary,
                fontFamily: theme.typography.fontFamily,
              }
            ]}>
              {module.meditationCount}
            </Text>
          </View>
        </View>

        <Text
          style={[
            styles.description,
            {
              fontSize: theme.typography.sizes.sm,
              fontWeight: theme.typography.weights.medium,
              color: theme.colors.primary,
              fontFamily: theme.typography.fontFamily,
            }
          ]}
          numberOfLines={3}
        >
          {module.description}
        </Text>

        <View style={styles.footer}>
          <View style={[
            styles.categoryBadge,
            {
              backgroundColor: theme.colors.category[module.category].background,
              borderRadius: theme.borders.radius.sm,
              paddingHorizontal: theme.spacing.sm,
              paddingVertical: theme.spacing.xs,
              borderWidth: theme.borders.width.normal,
              borderColor: theme.colors.primary,
            }
          ]}>
            <Text style={[
              styles.categoryText,
              {
                fontSize: theme.typography.sizes.xs,
                fontWeight: theme.typography.weights.bold,
                color: theme.colors.category[module.category].text,
                fontFamily: theme.typography.fontFamily,
              }
            ]}>
              {module.category.toUpperCase()}
            </Text>
          </View>
        </View>
      </View>

      {/* Subtle gradient overlay for better text readability */}
      <LinearGradient
        colors={['rgba(255,255,255,0.15)', 'rgba(255,255,255,0.05)']}
        style={[styles.overlay, { borderRadius: theme.borders.radius.lg }]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      />
    </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  card: {
    overflow: 'hidden',
    position: 'relative',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
    zIndex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  title: {
    flex: 1,
    textShadowColor: 'rgba(255, 255, 255, 0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  badge: {
    minWidth: 28,
    alignItems: 'center',
  },
  badgeText: {},
  description: {
    lineHeight: 18,
    textShadowColor: 'rgba(255, 255, 255, 0.6)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 1,
  },
  footer: {
    alignItems: 'flex-start',
  },
  categoryBadge: {},
  categoryText: {
    letterSpacing: 0.5,
  },
});
