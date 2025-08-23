import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Polyline, Circle } from 'react-native-svg';
import { SessionDelta } from '../types';

interface SparklineProps {
  data: SessionDelta[];
  width?: number;
  height?: number;
}

export const Sparkline: React.FC<SparklineProps> = ({ 
  data, 
  width = 200, 
  height = 60 
}) => {
  if (data.length < 2) return null;

  // Get last 7 data points
  const recentData = data.slice(-7);
  const deltas = recentData.map(d => d.before - d.after);
  
  // Find min and max for scaling
  const minDelta = Math.min(...deltas);
  const maxDelta = Math.max(...deltas);
  const range = maxDelta - minDelta || 1;

  // Calculate points
  const points = deltas.map((delta, index) => {
    const x = (index / (deltas.length - 1)) * width;
    const y = height - ((delta - minDelta) / range) * height;
    return `${x},${y}`;
  }).join(' ');

  return (
    <View style={styles.container}>
      <Svg width={width} height={height} style={styles.svg}>
        <Polyline
          fill="none"
          stroke="#3B82F6"
          strokeWidth="2"
          points={points}
        />
        {/* Add dots at each point */}
        {deltas.map((delta, index) => {
          const x = (index / (deltas.length - 1)) * width;
          const y = height - ((delta - minDelta) / range) * height;
          return (
            <Circle
              key={index}
              cx={x}
              cy={y}
              r="3"
              fill="#3B82F6"
            />
          );
        })}
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  svg: {
    marginBottom: 8,
  },
}); 