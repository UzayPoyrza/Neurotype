import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { MentalHealthModule } from '../data/modules';
import { theme } from '../styles/theme';

interface ModuleCardProps {
  module: MentalHealthModule;
  onPress: (moduleId: string) => void;
}

const { width: screenWidth } = Dimensions.get('window');
const cardMargin = theme.spacing.md;
const cardsPerRow = 2;
const cardWidth = (screenWidth - (theme.spacing.lg * 2) - (cardMargin * (cardsPerRow - 1))) / cardsPerRow;

export const ModuleCard: React.FC<ModuleCardProps> = ({ module, onPress }) => {
  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: module.color }]}
      onPress={() => onPress(module.id)}
      activeOpacity={0.8}
    >
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title} numberOfLines={2}>
            {module.title}
          </Text>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{module.meditationCount}</Text>
          </View>
        </View>
        
        <Text style={styles.description} numberOfLines={3}>
          {module.description}
        </Text>
        
        <View style={styles.footer}>
          <View style={[
            styles.categoryBadge,
            { backgroundColor: theme.colors.category[module.category].background }
          ]}>
            <Text style={[
              styles.categoryText,
              { color: theme.colors.category[module.category].text }
            ]}>
              {module.category.toUpperCase()}
            </Text>
          </View>
        </View>
      </View>
      
      {/* Spotify-like gradient overlay for better text readability */}
      <View style={styles.overlay} />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    width: cardWidth,
    height: cardWidth, // Square aspect ratio
    borderRadius: theme.borders.radius.lg,
    borderWidth: theme.borders.width.thick,
    borderColor: theme.colors.primary,
    ...theme.shadows.medium,
    overflow: 'hidden',
    position: 'relative',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.15)',
    borderRadius: theme.borders.radius.lg,
  },
  content: {
    flex: 1,
    padding: theme.spacing.lg,
    justifyContent: 'space-between',
    zIndex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.sm,
  },
  title: {
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.primary,
    fontFamily: theme.typography.fontFamily,
    flex: 1,
    marginRight: theme.spacing.sm,
    textShadowColor: 'rgba(255, 255, 255, 0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  badge: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borders.radius.sm,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderWidth: theme.borders.width.normal,
    borderColor: theme.colors.primary,
    minWidth: 28,
    alignItems: 'center',
  },
  badgeText: {
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.primary,
    fontFamily: theme.typography.fontFamily,
  },
  description: {
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.medium,
    color: theme.colors.primary,
    fontFamily: theme.typography.fontFamily,
    lineHeight: 18,
    textShadowColor: 'rgba(255, 255, 255, 0.6)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 1,
  },
  footer: {
    alignItems: 'flex-start',
  },
  categoryBadge: {
    borderRadius: theme.borders.radius.sm,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderWidth: theme.borders.width.normal,
    borderColor: theme.colors.primary,
  },
  categoryText: {
    fontSize: theme.typography.sizes.xs,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.primary,
    fontFamily: theme.typography.fontFamily,
    letterSpacing: 0.5,
  },
});