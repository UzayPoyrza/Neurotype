import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, SafeAreaView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { createTutorialBackground } from '../utils/gradientBackgrounds';
import { useStore } from '../store/useStore';
import { Slider0to10 } from './Slider0to10';

interface MeditationFeedbackLandingProps {
  visible: boolean;
  onFinish: (rating: number) => void;
}

export const MeditationFeedbackLanding: React.FC<MeditationFeedbackLandingProps> = ({ visible, onFinish }) => {
  const { activeSession, userProgress } = useStore();
  const [rating, setRating] = useState<number | null>(null);

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
      ]).start(() => setRating(null));
    }
  }, [visible, backdropAnim, contentAnim]);

  if (!visible || !activeSession) return null;

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
          {/* Top: Streak */}
          <View style={styles.streakPill}>
            <Text style={styles.streakNumber}>{userProgress.streak}</Text>
            <Text style={styles.streakFire}>🔥</Text>
            <Text style={styles.streakLabel}>day streak</Text>
          </View>

          {/* Middle: Feedback Slider */}
          <View style={styles.panel}>
            <Text style={styles.questionText}>How was this meditation for you?</Text>
            <View style={styles.sliderContainer}>
              <Slider0to10 value={rating ?? 5} onValueChange={(v) => setRating(v)} label={null as any} />
              <View style={styles.sliderLabelsRow}>
                <Text style={styles.sliderEdgeLabel}>Low</Text>
                <Text style={styles.sliderEdgeLabel}>High</Text>
              </View>
            </View>
          </View>

          {/* Bottom: Finish Button */}
          <View style={styles.bottomButtons}>
            <TouchableOpacity
              style={[styles.finishButton, !rating && styles.finishButtonDisabled]}
              onPress={() => {
                if (rating) onFinish(rating);
              }}
              disabled={!rating}
            >
              <Text style={[styles.finishButtonText, !rating && styles.finishButtonTextDisabled]}>Finish</Text>
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
    paddingTop: 120,
  },
  streakPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  streakNumber: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '700',
  },
  streakFire: {
    fontSize: 18,
  },
  streakLabel: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 14,
    fontWeight: '600',
  },
  panel: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    padding: 20,
    gap: 16,
  },
  sliderContainer: {
    alignItems: 'stretch',
    gap: 8,
  },
  questionText: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
  },
  sliderLabelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  sliderEdgeLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 13,
  },
  bottomButtons: {
    alignItems: 'center',
  },
  finishButton: {
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
  finishButtonDisabled: {
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  finishButtonText: {
    color: '#1a1a1a',
    fontSize: 18,
    fontWeight: '600',
  },
  finishButtonTextDisabled: {
    color: 'rgba(26,26,26,0.6)',
  },
});

export default MeditationFeedbackLanding;


