import React from 'react';
import Svg, { Circle, Path } from 'react-native-svg';

interface ProfileIconProps {
  size?: number;
  color?: string;
  focused?: boolean;
}

export const ProfileIcon: React.FC<ProfileIconProps> = ({ 
  size = 24, 
  color = '#666666', 
  focused = false 
}) => {
  const iconColor = color;
  
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle 
        cx="12" 
        cy="8" 
        r="5" 
        stroke={iconColor} 
        strokeWidth="2" 
        fill={focused ? iconColor : "none"}
      />
      <Path 
        d="M4 21c0-4.41 3.59-8 8-8s8 3.59 8 8H4z" 
        stroke={iconColor} 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round"
        fill={focused ? iconColor : "none"}
      />
    </Svg>
  );
}; 