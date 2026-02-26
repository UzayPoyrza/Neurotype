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
  const iconColor = color;
  
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {/* Simple filled bar chart that fits the meditation theme */}
      <Path 
        d="M3 22V6h4v16H3z" 
        fill={iconColor}
      />
      <Path 
        d="M8 22V2h4v20H8z" 
        fill={iconColor}
      />
      <Path 
        d="M13 22V8h4v14H13z" 
        fill={iconColor}
      />
      <Path 
        d="M18 22V4h3v18H18z" 
        fill={iconColor}
      />
    </Svg>
  );
}; 