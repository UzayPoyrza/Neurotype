import React from 'react';
import Svg, { Path } from 'react-native-svg';

interface ProgressIconProps {
  size?: number;
  color?: string;
  focused?: boolean;
}

export const ProgressIcon: React.FC<ProgressIconProps> = ({ 
  size = 24, 
  color = '#666666', 
  focused = false 
}) => {
  const iconColor = focused ? '#000000' : color;
  
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path 
        d="M3 17l6-6 4 4 8-8" 
        stroke={iconColor} 
        strokeWidth="1.5" 
        strokeLinecap="round" 
        strokeLinejoin="round"
        fill="none"
      />
      <Path 
        d="M3 17l6-6 4 4 8-8L21 17H3z" 
        stroke={iconColor} 
        strokeWidth="1.5" 
        strokeLinecap="round" 
        strokeLinejoin="round"
        fill={focused ? iconColor : "none"}
      />
    </Svg>
  );
}; 