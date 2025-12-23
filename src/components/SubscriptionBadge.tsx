import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '../styles/theme';

interface SubscriptionBadgeProps {
  subscriptionType: 'basic' | 'premium';
  size?: 'small' | 'medium' | 'large';
}

export const SubscriptionBadge: React.FC<SubscriptionBadgeProps> = ({ 
  subscriptionType,
  size = 'medium'
}) => {
  const isPremium = subscriptionType === 'premium';
  
  const sizeStyles = {
    small: {
      paddingHorizontal: theme.spacing.sm,
      paddingVertical: theme.spacing.xs,
      fontSize: theme.typography.sizes.xs,
    },
    medium: {
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
      fontSize: theme.typography.sizes.sm,
    },
    large: {
      paddingHorizontal: theme.spacing.lg,
      paddingVertical: theme.spacing.md,
      fontSize: theme.typography.sizes.md,
    },
  };

  return (
    <View style={[
      styles.container,
      isPremium ? styles.premiumContainer : styles.basicContainer,
      {
        paddingHorizontal: sizeStyles[size].paddingHorizontal,
        paddingVertical: sizeStyles[size].paddingVertical,
      }
    ]}>
      {isPremium ? (
        <Text style={[styles.crown, { fontSize: sizeStyles[size].fontSize * 0.9 }]}>
          💎
        </Text>
      ) : (
        <Text style={[styles.basicIcon, { fontSize: sizeStyles[size].fontSize * 0.9 }]}>
          📱
        </Text>
      )}
      <Text style={[
        styles.text,
        isPremium ? styles.premiumText : styles.basicText,
        { fontSize: sizeStyles[size].fontSize }
      ]}>
        {isPremium ? 'Premium' : 'Basic Member'}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: theme.borders.radius.xl,
    ...theme.shadows.small,
  },
  basicContainer: {
    backgroundColor: '#f8f9fa',
    borderColor: '#d1d5db',
    borderWidth: 1.5,
  },
  premiumContainer: {
    backgroundColor: '#1f2937', // Dark elegant background
    borderColor: '#374151',
    borderWidth: theme.borders.width.normal,
  },
  text: {
    fontWeight: theme.typography.weights.bold,
    fontFamily: theme.typography.fontFamily,
    letterSpacing: 0.5,
  },
  basicText: {
    color: '#374151',
    fontWeight: '600',
  },
  premiumText: {
    color: '#f9fafb', // Light text for dark background
  },
  crown: {
    marginRight: theme.spacing.xs,
  },
  basicIcon: {
    marginRight: theme.spacing.xs,
  },
});