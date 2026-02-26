import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableWithoutFeedback, Animated, TouchableOpacity } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';

interface InfoBoxProps {
  isVisible: boolean;
  onClose: () => void;
  title: string;
  content: string;
  position?: {
    top?: number;
    left?: number;
    right?: number;
  };
  onHowToUsePress?: () => void;
}

export const InfoBox: React.FC<InfoBoxProps> = ({
  isVisible,
  onClose,
  title,
  content,
  position = {},
  onHowToUsePress
}) => {
  const theme = useTheme();
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isVisible) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [isVisible, fadeAnim]);

  if (!isVisible) return null;

  return (
    <TouchableWithoutFeedback onPress={onClose}>
      <View style={styles.overlay}>
        <TouchableWithoutFeedback onPress={() => {}}>
          <Animated.View
            style={[
              styles.infoBox,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.borderMedium,
                shadowOpacity: theme.isDark ? 0.3 : 0.08,
              },
              position,
              { opacity: fadeAnim }
            ]}
          >
            <Text style={[styles.infoTitle, { color: theme.colors.text.primary }]}>{title}</Text>
            <Text style={[styles.infoContent, { color: theme.colors.text.secondary }, onHowToUsePress && styles.infoContentWithButton]}>{content}</Text>
            {onHowToUsePress && (
              <TouchableOpacity
                style={[styles.howToUseButton, { backgroundColor: theme.colors.accent }]}
                onPress={() => {
                  onClose();
                  onHowToUsePress();
                }}
                activeOpacity={0.7}
              >
                <Text style={styles.howToUseButtonText}>How to use the app</Text>
              </TouchableOpacity>
            )}
          </Animated.View>
        </TouchableWithoutFeedback>
      </View>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
  },
  infoBox: {
    position: 'absolute',
    borderRadius: 12,
    padding: 16,
    maxWidth: 280,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 8,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  infoContent: {
    fontSize: 14,
    lineHeight: 20,
  },
  infoContentWithButton: {
    marginBottom: 12,
  },
  howToUseButton: {
    marginTop: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  howToUseButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
});