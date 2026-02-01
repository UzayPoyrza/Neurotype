import React from 'react';
import Svg, { Line, Polyline } from 'react-native-svg';

interface AlphabeticalIconProps {
  size?: number;
  color?: string;
}

export const AlphabeticalIcon: React.FC<AlphabeticalIconProps> = ({ 
  size = 20, 
  color = '#141124'
}) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <Line 
        x1="23" 
        y1="26.1" 
        x2="23" 
        y2="5" 
        stroke={color} 
        strokeWidth="1.5" 
        strokeMiterlimit="10"
      />
      <Polyline 
        points="18.7,21.8 23,26.1 27.3,21.8"
        fill="none"
        stroke={color} 
        strokeWidth="1.5" 
        strokeMiterlimit="10"
      />
      <Polyline 
        points="12,15 12,14 9.1,6 8.9,6 6,14 6,15"
        fill="none"
        stroke={color} 
        strokeWidth="1.5" 
        strokeMiterlimit="10"
      />
      <Line 
        x1="6" 
        y1="12" 
        x2="12" 
        y2="12" 
        stroke={color} 
        strokeWidth="1.5" 
        strokeMiterlimit="10"
      />
      <Polyline 
        points="5,18 12,18 12,19 6,25 6,26 13,26"
        fill="none"
        stroke={color} 
        strokeWidth="1.5" 
        strokeMiterlimit="10"
      />
    </Svg>
  );
};

