import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, SafeAreaView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { createTutorialBackground } from '../utils/gradientBackgrounds';
import { useStore } from '../store/useStore';

interface MeditationCompletionLandingProps {
  secondsMeditated: number;
  visible: boolean;
  onContinue: () => void;
  onDiscard: () => void;
}

export const MeditationCompletionLanding: React.FC<MeditationCompletionLandingProps> = ({
  secondsMeditated,
  visible,
  onContinue,
  onDiscard,
}) => {
  const { activeSession } = useStore();

  const backdropAnim = useRef(new Animated.Value(0)).current;
  const contentAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(backdropAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.timing(contentAnim, { toValue: 1, duration: 500, delay: 120, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(backdropAnim, { toValue: 0, duration: 250, useNativeDriver: true }),
        Animated.timing(contentAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
      ]).start();
    }
  }, [visible, backdropAnim, contentAnim]);

  if (!visible || !activeSession) return null;

  const mins = Math.floor(secondsMeditated / 60);
  const secs = secondsMeditated % 60;

  const tutorialGradient = createTutorialBackground(activeSession.goal, 0);

  return (
    <Animated.View
      pointerEvents={visible ? 'auto' : 'none'}
      style={[styles.overlay, { opacity: backdropAnim }]}
    >
      <LinearGradient
        colors={[tutorialGradient.top, tutorialGradient.bottom]}
        style={styles.background}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      />
      <SafeAreaView style={styles.safeArea}>
        <Animated.View
          style={[
            styles.content,
            {
              opacity: contentAnim,
              transform: [
                {
                  translateY: contentAnim.interpolate({ inputRange: [0, 1], outputRange: [30, 0] }),
                },
              ],
            },
          ]}
        >
          <View style={styles.centerTextContainer}>
            <Text style={styles.title}>Completed!</Text>
            <Text style={styles.subtitle}>You meditated</Text>
            <Text style={styles.timeText}>
              {mins}m {secs.toString().padStart(2, '0')}s
            </Text>
          </View>

          <View style={styles.bottomButtons}>
            <TouchableOpacity style={styles.continueButton} onPress={onContinue}>
              <Text style={styles.continueButtonText}>Continue</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.discardButton} onPress={onDiscard}>
              <Text style={styles.discardButtonText}>Discard session</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </SafeAreaView>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 3000,
  },
  background: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 32,
    paddingBottom: 40,
    paddingTop: 220,
  },
  centerTextContainer: {
    alignItems: 'center',
    gap: 8,
  },
  title: {
    color: '#ffffff',
    fontSize: 28,
    fontWeight: '700',
  },
  subtitle: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 18,
    fontWeight: '500',
    marginTop: 6,
  },
  timeText: {
    color: '#ffffff',
    fontSize: 40,
    fontWeight: '800',
    marginTop: 6,
  },
  bottomButtons: {
    alignItems: 'center',
    gap: 12,
  },
  continueButton: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 48,
    width: '100%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  continueButtonText: {
    color: '#1a1a1a',
    fontSize: 18,
    fontWeight: '600',
  },
  discardButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  discardButtonText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 16,
    fontWeight: '500',
  },
});

export default MeditationCompletionLanding;


