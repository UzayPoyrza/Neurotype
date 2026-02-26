import React from 'react';
import Svg, { Path } from 'react-native-svg';

interface BarChartIconProps {
  size?: number;
  color?: string;
}

export const BarChartIcon: React.FC<BarChartIconProps> = ({ 
  size = 24, 
  color = '#F2F2F7'
}) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path 
        d="M10 4H14V20H10V4Z" 
        stroke={color} 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />
      <Path 
        d="M14 9H18V20H14V9Z" 
        stroke={color} 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />
      <Path 
        d="M6 13H10V20H6V13Z" 
        stroke={color} 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />
      <Path 
        d="M3 20H21" 
        stroke={color} 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />
    </Svg>
  );
};

