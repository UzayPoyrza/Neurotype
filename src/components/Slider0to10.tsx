import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, LayoutChangeEvent } from 'react-native';

interface Slider0to10Props {
  value: number;
  onValueChange: (value: number) => void;
  label?: string;
  showLabels?: boolean;
  variant?: 'pill' | 'bar';
}

export const Slider0to10: React.FC<Slider0to10Props> = ({ 
  value, 
  onValueChange, 
  label,
  showLabels = true,
  variant = 'pill',
}) => {
  const numbers = Array.from({ length: 11 }, (_, i) => i);
  const [trackWidth, setTrackWidth] = useState(0);

  const handleTrackLayout = (event: LayoutChangeEvent) => {
    setTrackWidth(event.nativeEvent.layout.width);
  };

  if (variant === 'bar') {
    const knobPosition = trackWidth ? (value / 10) * trackWidth : 0;

    return (
      <View style={styles.barRoot}>
        {showLabels && !!label && <Text style={styles.label}>{label}</Text>}

        <View style={styles.barTrackWrapper}>
          <View style={styles.barTrack} onLayout={handleTrackLayout}>
            <View style={[styles.barTrackFill, { width: trackWidth ? (value / 10) * trackWidth : 0 }]} />
            <View
              style={[
                styles.barKnob,
                {
                  transform: [{ translateX: -16 }],
                  left: knobPosition,
                },
              ]}
            >
              <View style={styles.barKnobInner} />
            </View>
          </View>

          <View style={styles.barTouchLayer}>
            {numbers.map((number) => {
              const position = trackWidth ? (number / 10) * trackWidth : 0;
              return (
                <TouchableOpacity
                  key={number}
                  onPress={() => onValueChange(number)}
                  style={[
                    styles.barTouchTarget,
                    {
                      left: position,
                    },
                  ]}
                  activeOpacity={0.8}
                >
                  <View
                    style={[
                      styles.barTick,
                      value === number ? styles.barTickActive : undefined,
                    ]}
                  />
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={styles.barNumberRow}>
          {numbers.map((number) => (
            <TouchableOpacity
              key={`label-${number}`}
              onPress={() => onValueChange(number)}
              activeOpacity={0.8}
              style={styles.barNumberWrapper}
            >
              <Text
                style={[
                  styles.barNumberText,
                  value === number ? styles.barNumberTextActive : undefined,
                ]}
              >
                {number}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {showLabels && !!label && <Text style={styles.label}>{label}</Text>}
      <View style={styles.sliderContainer}>
        {numbers.map((number) => (
          <TouchableOpacity
            key={number}
            style={[
              styles.numberButton,
              value === number ? styles.selectedButton : styles.unselectedButton,
            ]}
            onPress={() => onValueChange(number)}
          >
            <Text style={[
              styles.numberText,
              value === number ? styles.selectedText : styles.unselectedText,
            ]}>
              {number}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      {showLabels && (
        <View style={styles.scaleLabels}>
          <Text style={styles.scaleLabel}>Low</Text>
          <Text style={styles.scaleLabel}>High</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 16,
  },
  barRoot: {
    marginVertical: 16,
    gap: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 12,
    fontFamily: 'System',
  },
  sliderContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  numberButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: { width: 1, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  selectedButton: {
    backgroundColor: '#ffffff',
    borderColor: '#ffffff',
  },
  unselectedButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  numberText: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'System',
  },
  selectedText: {
    color: '#1a1a1a',
  },
  unselectedText: {
    color: '#ffffff',
  },
  scaleLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  scaleLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    fontFamily: 'System',
  },
  barTrackWrapper: {
    position: 'relative',
    paddingHorizontal: 4,
    paddingVertical: 12,
  },
  barTrack: {
    width: '100%',
    height: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    overflow: 'hidden',
  },
  barTrackFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: '#ffffff',
  },
  barKnob: {
    position: 'absolute',
    top: -10,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.45)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.22,
    shadowRadius: 12,
    elevation: 6,
  },
  barKnobInner: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#ffffff',
  },
  barTouchLayer: {
    position: 'absolute',
    top: 0,
    left: 4,
    right: 4,
    bottom: 0,
  },
  barTouchTarget: {
    position: 'absolute',
    width: 36,
    height: 36,
    marginLeft: -18,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  barTick: {
    width: 2,
    height: 10,
    borderRadius: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.35)',
  },
  barTickActive: {
    backgroundColor: '#ffffff',
    height: 14,
  },
  barNumberRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  barNumberWrapper: {
    flex: 1,
    alignItems: 'center',
  },
  barNumberText: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.65)',
    fontFamily: 'System',
  },
  barNumberTextActive: {
    color: '#ffffff',
  },
}); 