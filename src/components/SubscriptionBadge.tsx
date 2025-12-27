import React from 'react';
import { View, Image, StyleSheet, ImageSourcePropType } from 'react-native';
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
  
  // Image sources - update these paths if your images have different names
  const premiumImage: ImageSourcePropType = require('../../assets/badge-premium.png');
  const basicImage: ImageSourcePropType = require('../../assets/badge-basic.png');
  
  // Separate size styles for basic and premium badges
  const basicSizeStyles = {
    small: {
      height: 30,
      width: 150,
    },
    medium: {
      height: 40,
      width: 200,
    },
    large: {
      height: 50,
      width: 250,
    },
  };

  const premiumSizeStyles = {
    small: {
      height: 35,
      width: 175,
    },
    medium: {
      height: 46,
      width: 230,
    },
    large: {
      height: 58,
      width: 290,
    },
  };

  const currentSizeStyles = isPremium ? premiumSizeStyles : basicSizeStyles;

  return (
    <View style={styles.container}>
      <Image
        source={isPremium ? premiumImage : basicImage}
        style={[
          styles.badgeImage,
          { 
            height: currentSizeStyles[size].height,
            width: currentSizeStyles[size].width,
            maxWidth: '100%', // Allow scaling down if container is smaller
          }
        ]}
        resizeMode="contain"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'flex-start',
    justifyContent: 'center',
    flexShrink: 1, // Allow container to shrink if needed
  },
  badgeImage: {
    flexShrink: 1, // Allow image to shrink if container is too small
  },
});