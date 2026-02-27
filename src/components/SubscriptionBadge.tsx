import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../contexts/ThemeContext';

interface SubscriptionBadgeProps {
  subscriptionType: 'basic' | 'premium';
  size?: 'small' | 'medium' | 'large';
  moduleColor?: string;
}

export const SubscriptionBadge: React.FC<SubscriptionBadgeProps> = ({
  subscriptionType,
  size = 'medium',
  moduleColor = '#007AFF',
}) => {
  const theme = useTheme();
  const isPremium = subscriptionType === 'premium';

  const sizeConfig = {
    small: { fontSize: 14, iconSize: 13, paddingH: 11, paddingV: 6, gap: 6 },
    medium: { fontSize: 15, iconSize: 14, paddingH: 14, paddingV: 7, gap: 7 },
    large: { fontSize: 21, iconSize: 19, paddingH: 20, paddingV: 10, gap: 8 },
  };

  const config = sizeConfig[size];

  if (isPremium) {
    return (
      <LinearGradient
        colors={theme.isDark
          ? ['#1a1a2e', '#16213e', '#1a1a2e']
          : ['#faf8f2', '#f2edd8', '#faf8f2']
        }
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[
          styles.badge,
          {
            paddingHorizontal: config.paddingH,
            paddingVertical: config.paddingV,
            borderWidth: 1.5,
            borderColor: theme.isDark ? '#DAA520' : '#C5A028',
          },
        ]}
      >
        <Ionicons
          name="diamond"
          size={config.iconSize}
          color="#DAA520"
        />
        <Text
          style={[
            styles.premiumText,
            {
              fontSize: config.fontSize,
              marginLeft: config.gap,
              color: theme.isDark ? '#F2F2F7' : '#1a1a2e',
            },
          ]}
        >
          Neurotype <Text style={styles.proText}>Pro</Text>
        </Text>
      </LinearGradient>
    );
  }

  return (
    <View
      style={[
        styles.badge,
        {
          paddingHorizontal: config.paddingH,
          paddingVertical: config.paddingV,
          backgroundColor: theme.isDark ? moduleColor + '18' : moduleColor + '12',
          borderWidth: 1.5,
          borderColor: theme.isDark ? moduleColor + '60' : moduleColor + '40',
        },
      ]}
    >
      <Ionicons
        name="sparkles"
        size={config.iconSize}
        color={moduleColor}
      />
      <Text
        style={[
          styles.basicText,
          {
            fontSize: config.fontSize,
            marginLeft: config.gap,
            color: theme.isDark ? '#E8E8ED' : '#1a1a1a',
          },
        ]}
      >
        Neurotype <Text style={[styles.planSuffix, { color: moduleColor }]}>Free</Text>
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  premiumText: {
    fontWeight: '600',
    letterSpacing: -0.3,
  },
  proText: {
    fontWeight: '800',
    color: '#DAA520',
  },
  basicText: {
    fontWeight: '600',
    letterSpacing: -0.3,
  },
  planSuffix: {
    fontWeight: '700',
  },
});
