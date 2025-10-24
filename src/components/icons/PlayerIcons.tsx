import React from 'react';
import Svg, { Path, Rect, Text, Polyline, G} from 'react-native-svg';

interface IconProps {
  size?: number;
  color?: string;
}

export const PlayIcon: React.FC<IconProps> = ({ size = 24, color = '#ffffff' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M8 5v14l11-7z"
      fill={color}
    />
  </Svg>
);

export const PauseIcon: React.FC<IconProps> = ({ size = 24, color = '#ffffff' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"
      fill={color}
    />
  </Svg>
);

export const SkipForward10Icon: React.FC<IconProps> = ({ size = 32, color = '#ffffff' }) => (
  <Svg width={size} height={size} viewBox="0 0 64 64" fill="none" stroke={color} strokeWidth="3">
    <Path
      d="M23.93,41.41V23a.09.09,0,0,0-.16-.07s-2.58,3.69-4.17,4.78"
      strokeLinecap="round"
    />
    <Rect
      x="29.19"
      y="22.52"
      width="11.41"
      height="18.89"
      rx="5.7"
    />
    <Polyline
      points="54.43 15.41 51.83 24.05 43.19 21.44"
      strokeLinecap="round"
    />
    <Path
      d="M51.86,23.94a21.91,21.91,0,1,0,.91,13.25"
      strokeLinecap="round"
    />
  </Svg>
);

export const SkipBackward10Icon: React.FC<IconProps> = ({ size = 32, color = '#ffffff' }) => (
  <Svg width={size} height={size} viewBox="0 0 64 64" fill="none" stroke={color} strokeWidth="3">
    <Polyline
      points="9.57 15.41 12.17 24.05 20.81 21.44"
      strokeLinecap="round"
    />
    <Path
      d="M26.93,41.41V23a.09.09,0,0,0-.16-.07s-2.58,3.69-4.17,4.78"
      strokeLinecap="round"
    />
    <Rect
      x="32.19"
      y="22.52"
      width="11.41"
      height="18.89"
      rx="5.7"
    />
    <Path
      d="M12.14,23.94a21.91,21.91,0,1,1-.91,13.25"
      strokeLinecap="round"
    />
  </Svg>
);

export const HeartIcon: React.FC<IconProps> = ({ size = 24, color = '#ffffff' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
      fill={color}
    />
  </Svg>
);

export const HeartOutlineIcon: React.FC<IconProps> = ({ size = 24, color = '#ffffff' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
      stroke={color}
      strokeWidth="2"
      fill="none"
    />
  </Svg>
);

export const BackIcon: React.FC<IconProps> = ({ size = 24, color = '#ffffff' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"
      fill={color}
    />
  </Svg>
);

export const MoreIcon: React.FC<IconProps> = ({ size = 24, color = '#ffffff' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"
      fill={color}
    />
  </Svg>
);
