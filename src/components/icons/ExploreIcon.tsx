import React from 'react';
import Svg, { Circle, Path } from 'react-native-svg';

interface ExploreIconProps {
  size?: number;
  color?: string;
  focused?: boolean;
}

export const ExploreIcon: React.FC<ExploreIconProps> = ({ 
  size = 24, 
  color = '#666666', 
  focused = false 
}) => {
  const iconColor = focused ? '#000000' : color;
  
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle 
        cx="11" 
        cy="11" 
        r="8" 
        stroke={iconColor} 
        strokeWidth="2" 
        fill="none"
      />
      <Path 
        d="m21 21-4.35-4.35" 
        stroke={iconColor} 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round"
        fill="none"
      />
      {focused && (
        <Circle 
          cx="11" 
          cy="11" 
          r="5" 
          fill={iconColor}
        />
      )}
    </Svg>
  );
}; 