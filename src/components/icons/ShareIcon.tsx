import React from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import Svg, { Path } from 'react-native-svg';

interface ShareIconProps {
  size?: number;
  onPress?: () => void;
}

export const ShareIcon: React.FC<ShareIconProps> = ({ 
  size = 40,
  onPress 
}) => {
  const iconSize = size * 0.6;
  
  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none">
        <Path
          d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"
          stroke="#007AFF"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <Path
          d="m16 6-4-4-4 4"
          stroke="#007AFF"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <Path
          d="M12 2v13"
          stroke="#007AFF"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
});