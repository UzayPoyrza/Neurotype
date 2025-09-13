import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableWithoutFeedback, Animated } from 'react-native';

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
}

export const InfoBox: React.FC<InfoBoxProps> = ({
  isVisible,
  onClose,
  title,
  content,
  position = {}
}) => {
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
              position,
              { opacity: fadeAnim }
            ]}
          >
            <Text style={styles.infoTitle}>{title}</Text>
            <Text style={styles.infoContent}>{content}</Text>
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
    backgroundColor: '#000000',
    borderRadius: 12,
    padding: 16,
    maxWidth: 280,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 8,
  },
  infoContent: {
    fontSize: 14,
    color: '#ffffff',
    lineHeight: 20,
  },
});