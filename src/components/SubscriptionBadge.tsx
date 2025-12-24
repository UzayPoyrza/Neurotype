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
  
  const sizeStyles = {
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

  return (
    <View style={styles.container}>
      <Image
        source={isPremium ? premiumImage : basicImage}
        style={[
          styles.badgeImage,
          { 
            height: sizeStyles[size].height,
            width: sizeStyles[size].width,
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
    overflow: 'visible',
  },
  badgeImage: {
    // Width will be determined by image aspect ratio
    overflow: 'visible',
  },
});