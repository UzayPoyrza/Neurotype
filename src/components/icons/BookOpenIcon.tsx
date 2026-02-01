import React from 'react';
import Svg, { Path } from 'react-native-svg';

interface BookOpenIconProps {
  size?: number;
  color?: string;
}

export const BookOpenIcon: React.FC<BookOpenIconProps> = ({
  size = 16,
  color = '#ffffff'
}) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <Path
        d="M4,0 C1.791,0 0,1.791 0,4 L0,25 C0,27.209 1.885,28.313 4,29 L15,32 L15,3 C9.988,1.656 4,0 4,0 L4,0 Z M28,0 C28,0 22.212,1.594 16.951,3 L17,3 L17,32 C22.617,30.501 28,29 28,29 C30.053,28.469 32,27.209 32,25 L32,4 C32,1.791 30.209,0 28,0 L28,0 Z"
        fill={color}
      />
    </Svg>
  );
};
