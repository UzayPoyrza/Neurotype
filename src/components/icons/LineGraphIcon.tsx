import React from 'react';
import Svg, { Path, Circle } from 'react-native-svg';

interface LineGraphIconProps {
  size?: number;
  color?: string;
  accentColor?: string;
}

export const LineGraphIcon: React.FC<LineGraphIconProps> = ({
  size = 24,
  color = '#FFFFFF',
  accentColor = '#FFFFFF',
}) => {
  const strokeWidth = 2;
  const padding = strokeWidth;
  const viewBoxSize = 24;

  return (
    <Svg
      width={size}
      height={size}
      viewBox={`0 0 ${viewBoxSize} ${viewBoxSize}`}
      fill="none"
    >
      <Path
        d="M4 18V6"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
      <Path
        d="M4 18H20"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
      <Path
        d="M6 14L11 10L15 13L20 8"
        stroke={accentColor}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Circle cx="6" cy="14" r="1.5" fill={accentColor} />
      <Circle cx="11" cy="10" r="1.5" fill={accentColor} />
      <Circle cx="15" cy="13" r="1.5" fill={accentColor} />
      <Circle cx="20" cy="8" r="1.5" fill={accentColor} />
    </Svg>
  );
};

