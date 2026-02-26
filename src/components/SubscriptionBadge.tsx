import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

interface SubscriptionBadgeProps {
  subscriptionType: 'basic' | 'premium';
  size?: 'small' | 'medium' | 'large';
}

export const SubscriptionBadge: React.FC<SubscriptionBadgeProps> = ({
  subscriptionType,
  size = 'medium'
}) => {
  const isPremium = subscriptionType === 'premium';

  const sizeConfig = {
    small: { fontSize: 15, iconSize: 15, paddingH: 12, paddingV: 7, gap: 6 },
    medium: { fontSize: 15, iconSize: 16, paddingH: 14, paddingV: 8, gap: 6 },
    large: { fontSize: 22, iconSize: 22, paddingH: 20, paddingV: 10, gap: 8 },
  };

  const config = sizeConfig[size];

  if (isPremium) {
    return (
      <LinearGradient
        colors={['#B8860B', '#DAA520', '#FFD700']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[
          styles.badge,
          {
            paddingHorizontal: config.paddingH,
            paddingVertical: config.paddingV,
          },
        ]}
      >
        <Ionicons name="diamond" size={config.iconSize} color="#1C1C1E" />
        <Text
          style={[
            styles.premiumText,
            { fontSize: config.fontSize, marginLeft: config.gap },
          ]}
        >
          Neurotype Premium
        </Text>
      </LinearGradient>
    );
  }

  return (
    <View
      style={[
        styles.badge,
        styles.basicBadge,
        {
          paddingHorizontal: config.paddingH,
          paddingVertical: config.paddingV,
        },
      ]}
    >
      <Ionicons name="leaf-outline" size={config.iconSize} color="#D0D0D8" />
      <Text
        style={[
          styles.basicText,
          { fontSize: config.fontSize, marginLeft: config.gap },
        ]}
      >
        Neurotype Basic
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  basicBadge: {
    backgroundColor: '#2C2C2E',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  premiumText: {
    fontWeight: '700',
    color: '#1C1C1E',
    letterSpacing: -0.3,
  },
  basicText: {
    fontWeight: '600',
    color: '#D0D0D8',
    letterSpacing: -0.3,
  },
});
