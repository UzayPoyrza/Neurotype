import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, LayoutChangeEvent, PanResponder, GestureResponderEvent, Animated, Easing } from 'react-native';

interface Slider0to10Props {
  value: number;
  onValueChange: (value: number) => void;
  label?: string;
  showLabels?: boolean;
  variant?: 'pill' | 'bar';
  numberColor?: string;
  activeNumberColor?: string;
}

const BAR_KNOB_SIZE = 26;
const BAR_TRACK_HEIGHT = 6;

export const Slider0to10: React.FC<Slider0to10Props> = ({ 
  value, 
  onValueChange, 
  label,
  showLabels = true,
  variant = 'pill',
  numberColor,
  activeNumberColor,
}) => {
  const numbers = Array.from({ length: 11 }, (_, i) => i);
  const [trackWidth, setTrackWidth] = useState(0);
  const animatedKnobX = useRef(new Animated.Value(0)).current;
  const knobScale = useRef(new Animated.Value(1)).current;

  const clamp = useCallback((input: number, min: number, max: number) => {
    return Math.min(Math.max(input, min), max);
  }, []);

  const updateValueFromGesture = useCallback((event: GestureResponderEvent) => {
    if (!trackWidth) return;

    const { locationX } = event.nativeEvent;
    const clampedPosition = clamp(locationX, 0, trackWidth);
    animatedKnobX.setValue(clampedPosition);

    const ratio = clampedPosition / trackWidth;
    const newValue = Math.round(ratio * 10);
    if (newValue !== value) {
      onValueChange(newValue);
    }
  }, [trackWidth, clamp, onValueChange, value, animatedKnobX]);

  const animateKnobToValue = useCallback((targetValue: number) => {
    if (!trackWidth) return;
    animatedKnobX.stopAnimation();
    Animated.timing(animatedKnobX, {
      toValue: (targetValue / 10) * trackWidth,
      duration: 160,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [animatedKnobX, trackWidth]);

  useEffect(() => {
    if (trackWidth) {
      animateKnobToValue(value);
    }
  }, [value, trackWidth, animateKnobToValue]);

  const handlePanStart = useCallback((event: GestureResponderEvent) => {
    Animated.spring(knobScale, {
      toValue: 1.1,
      useNativeDriver: false,
      friction: 5,
      tension: 90,
    }).start();
    updateValueFromGesture(event);
  }, [knobScale, updateValueFromGesture]);

  const handlePanMove = useCallback((event: GestureResponderEvent) => {
    updateValueFromGesture(event);
  }, [updateValueFromGesture]);

  const handlePanEnd = useCallback((event: GestureResponderEvent) => {
    updateValueFromGesture(event);
    Animated.spring(knobScale, {
      toValue: 1,
      useNativeDriver: false,
      friction: 6,
      tension: 120,
    }).start();
  }, [knobScale, updateValueFromGesture]);

  const panResponder = useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onStartShouldSetPanResponderCapture: () => true,
    onMoveShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponderCapture: () => true,
    onPanResponderGrant: handlePanStart,
    onPanResponderMove: handlePanMove,
    onPanResponderRelease: handlePanEnd,
    onPanResponderTerminate: handlePanEnd,
    onPanResponderTerminationRequest: () => false,
  }), [handlePanEnd, handlePanMove, handlePanStart]);

  const handleTrackLayout = useCallback((event: LayoutChangeEvent) => {
    const width = event.nativeEvent.layout.width;
    setTrackWidth(width);
    animatedKnobX.setValue((value / 10) * width);
  }, [animatedKnobX, value]);

  if (variant === 'bar') {
    const knobPosition = animatedKnobX;
    const knobRadius = BAR_KNOB_SIZE / 2;
    const knobVerticalOffset = -((BAR_KNOB_SIZE - BAR_TRACK_HEIGHT) / 2) + 10;

    return (
      <View style={styles.barRoot}>
        {showLabels && !!label && <Text style={styles.label}>{label}</Text>}

        <View style={styles.barTrackWrapper} {...panResponder.panHandlers}>
          <View style={styles.barTrack} onLayout={handleTrackLayout}>
            <Animated.View
              pointerEvents="none"
              style={[styles.barTrackFill, { width: knobPosition }]}
            />
            <View style={styles.barTicksWrapper} pointerEvents="none">
              {numbers.map((number) => {
                const position = trackWidth ? (number / 10) * trackWidth : 0;
                return (
                  <View
                    key={`tick-${number}`}
                    style={[
                      styles.barTick,
                      {
                        left: position,
                      },
                      value === number ? styles.barTickActive : undefined,
                    ]}
                  />
                );
              })}
            </View>
          </View>
          <View style={styles.barKnobWrapper} pointerEvents="none">
            <Animated.View
              style={[
                styles.barKnob,
                {
                  width: BAR_KNOB_SIZE,
                  height: BAR_KNOB_SIZE,
                  borderRadius: knobRadius,
                  transform: [
                    { translateX: Animated.subtract(knobPosition, knobRadius) },
                    { translateY: knobVerticalOffset },
                    { scale: knobScale },
                  ],
                },
              ]}
            />
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
                  numberColor && value !== number ? { color: numberColor } : undefined,
                  activeNumberColor && value === number ? { color: activeNumberColor } : undefined,
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
    paddingVertical: 12,
  },
  barTrack: {
    width: '100%',
    height: BAR_TRACK_HEIGHT,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    position: 'relative',
    overflow: 'hidden',
  },
  barTrackFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: '#ffffff',
  },
  barKnobWrapper: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
  },
  barKnob: {
    position: 'absolute',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 6,
  },
  barTicksWrapper: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
  },
  barTick: {
    position: 'absolute',
    width: 2,
    height: 10,
    borderRadius: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.35)',
    bottom: -2,
    transform: [{ translateX: -1 }],
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