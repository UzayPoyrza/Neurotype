import React from 'react';
import Svg, { Path, Circle } from 'react-native-svg';

interface TodayIconProps {
  size?: number;
  color?: string;
  focused?: boolean;
}

export const TodayIcon: React.FC<TodayIconProps> = ({ 
  size = 24, 
  color = '#666666', 
  focused = false 
}) => {
  const iconColor = focused ? '#000000' : color;
  
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke={iconColor} strokeWidth="2" fill="none"/>
      <Path 
        d="M12 6v6l4 2" 
        stroke={iconColor} 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round"
        fill="none"
      />
    </Svg>
  );
}; 