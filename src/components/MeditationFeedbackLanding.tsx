import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, SafeAreaView, Easing, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { createTutorialBackground } from '../utils/gradientBackgrounds';
import { useStore } from '../store/useStore';
import { Slider0to10 } from './Slider0to10';
import Svg, { Path } from 'react-native-svg';

const AnimatedPath = Animated.createAnimatedComponent(Path);
const { width: screenWidth } = Dimensions.get('window');

interface MeditationFeedbackLandingProps {
  visible: boolean;
  onFinish: (rating: number) => void;
  onComplete?: () => void;
}

export const MeditationFeedbackLanding: React.FC<MeditationFeedbackLandingProps> = ({ visible, onFinish, onComplete }) => {
  const { activeSession, userProgress } = useStore();
  const [rating, setRating] = useState<number | null>(null);
  const [showCongrats, setShowCongrats] = useState(false);

  const backdropAnim = useRef(new Animated.Value(0)).current;
  const contentAnim = useRef(new Animated.Value(0)).current;
  
  // Congrats screen animations
  const feedbackScreenTranslateX = useRef(new Animated.Value(0)).current;
  const congratsScreenTranslateX = useRef(new Animated.Value(0)).current;
  const circlePathAnim = useRef(new Animated.Value(0)).current;
  const checkmarkPathAnim = useRef(new Animated.Value(0)).current;
  const checkmarkScaleAnim = useRef(new Animated.Value(0)).current;
  const messageOpacityAnim = useRef(new Animated.Value(0)).current;
  const messageTranslateYAnim = useRef(new Animated.Value(20)).current;

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
      ]).start(() => {
        setRating(null);
        setShowCongrats(false);
      });
    }
  }, [visible, backdropAnim, contentAnim]);

  // Congrats screen animation
  useEffect(() => {
    if (showCongrats) {
      // Reset animations
      feedbackScreenTranslateX.setValue(0);
      congratsScreenTranslateX.setValue(screenWidth);
      circlePathAnim.setValue(0);
      checkmarkPathAnim.setValue(0);
      checkmarkScaleAnim.setValue(0);
      messageOpacityAnim.setValue(0);
      messageTranslateYAnim.setValue(20);

      // Start checkmark animation immediately (in parallel with screen transition)
      // Animate circle path drawing first
      Animated.timing(circlePathAnim, {
        toValue: 1,
        duration: 600,
        delay: 100,
        easing: Easing.out(Easing.ease),
        useNativeDriver: false,
      }).start(() => {
        // Then animate checkmark path drawing
        Animated.timing(checkmarkPathAnim, {
          toValue: 1,
          duration: 500,
          easing: Easing.out(Easing.ease),
          useNativeDriver: false,
        }).start(() => {
          // Scale checkmark after path is drawn
          Animated.spring(checkmarkScaleAnim, {
            toValue: 1,
            tension: 50,
            friction: 7,
            useNativeDriver: true,
          }).start();
        });
      });

      // Slide out feedback screen and slide in congrats screen
      Animated.parallel([
        Animated.timing(feedbackScreenTranslateX, {
          toValue: -screenWidth,
          duration: 400,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(congratsScreenTranslateX, {
          toValue: 0,
          duration: 400,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]).start();

      // Animate message (starts earlier, during transition)
      Animated.parallel([
        Animated.timing(messageOpacityAnim, {
          toValue: 1,
          duration: 500,
          delay: 800,
          useNativeDriver: true,
        }),
        Animated.timing(messageTranslateYAnim, {
          toValue: 0,
          duration: 500,
          delay: 800,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
      ]).start();

      // Auto dismiss after animation completes
      const timer = setTimeout(() => {
        handleCongratsComplete();
      }, 2800);

      return () => clearTimeout(timer);
    } else {
      // Reset screen positions when hiding
      feedbackScreenTranslateX.setValue(0);
      congratsScreenTranslateX.setValue(screenWidth);
    }
  }, [showCongrats]);

  if (!visible || !activeSession) return null;

  const tutorialGradient = createTutorialBackground(activeSession.goal, 0);

  const handleFinish = () => {
    if (rating !== null) {
      // Show congrats screen immediately
      setShowCongrats(true);
      // Call onFinish to start background operations
      onFinish(rating);
    }
  };

  const handleCongratsComplete = () => {
    // Immediately hide the entire component to prevent showing feedback screen again
    if (onComplete) {
      onComplete();
    }
    setShowCongrats(false);
  };

  // Path animations - approximate path lengths
  const circlePathLength = 314; // ~2 * PI * 50 (radius)
  const checkmarkPathLength = 60; // Approximate checkmark path length
  
  const circleDashOffset = circlePathAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [circlePathLength, 0],
  });

  const checkmarkDashOffset = checkmarkPathAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [checkmarkPathLength, 0],
  });

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
        {/* Feedback Screen */}
        <Animated.View
          style={[
            styles.screenContainer,
            {
              opacity: showCongrats ? 0 : contentAnim,
              transform: [
                {
                  translateX: feedbackScreenTranslateX,
                },
                {
                  translateY: contentAnim.interpolate({ inputRange: [0, 1], outputRange: [30, 0] }),
                },
              ],
            },
          ]}
          pointerEvents={showCongrats ? 'none' : 'auto'}
        >
          <View style={styles.content}>
            {/* Top: Streak */}
            <View style={styles.topSection}>
              <View style={styles.streakPill}>
                <Text style={styles.streakNumber}>{userProgress.streak}</Text>
                <Text style={styles.streakFire}>🔥</Text>
                <Text style={styles.streakLabel}>day streak</Text>
              </View>
            </View>

            <View style={styles.header}>
              <Text style={styles.headerTitle}>Take a quick reflection</Text>
              <Text style={styles.headerSubtitle}>
                Your feedback keeps the journey tailored just for you.
              </Text>
            </View>

            {/* Middle: Feedback Card */}
            <View style={styles.feedbackCard}>
              <Text style={styles.questionTitle}>How was this meditation?</Text>
              <Text style={styles.questionSubtitle}>Slide to rate your experience.</Text>
              <View style={styles.sliderContainer}>
                <Slider0to10
                  value={rating ?? 5}
                  onValueChange={(v) => setRating(v)}
                  showLabels={false}
                  variant="bar"
                />
                <View style={styles.sliderLabelsRow}>
                  <Text style={[styles.sliderLabel, styles.sliderLabelLeft]}>Not great</Text>
                  <Text style={[styles.sliderLabel, styles.sliderLabelCenter]}>Neutral</Text>
                  <Text style={[styles.sliderLabel, styles.sliderLabelRight]}>Very good</Text>
                </View>
              </View>
            </View>

            {/* Bottom: Finish Button */}
            <View style={styles.bottomButtons}>
              <TouchableOpacity
                style={[styles.finishButton, rating === null && styles.finishButtonDisabled]}
                onPress={handleFinish}
                disabled={rating === null}
              >
                <Text style={[styles.finishButtonText, rating === null && styles.finishButtonTextDisabled]}>Finish</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>

        {/* Congrats Screen */}
        <Animated.View
          style={[
            styles.screenContainer,
            styles.congratsScreen,
            {
              transform: [{ translateX: congratsScreenTranslateX }],
            },
          ]}
        >
          <View style={styles.congratsContent}>
            {/* Animated Checkmark */}
            <Animated.View
              style={[
                styles.checkmarkContainer,
                {
                  transform: [{ scale: checkmarkScaleAnim }],
                },
              ]}
            >
              <Svg width={120} height={120} viewBox="0 0 120 120">
                {/* Circle - animated drawing */}
                <AnimatedPath
                  d="M60 10 C85 10 110 35 110 60 C110 85 85 110 60 110 C35 110 10 85 10 60 C10 35 35 10 60 10 Z"
                  stroke="#ffffff"
                  strokeWidth="6"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeDasharray={circlePathLength}
                  strokeDashoffset={circleDashOffset}
                />
                {/* Checkmark - animated drawing */}
                <AnimatedPath
                  d="M35 60 L50 75 L85 40"
                  stroke="#ffffff"
                  strokeWidth="8"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeDasharray={checkmarkPathLength}
                  strokeDashoffset={checkmarkDashOffset}
                />
              </Svg>
            </Animated.View>

            {/* Message */}
            <Animated.View
              style={[
                styles.congratsMessage,
                {
                  opacity: messageOpacityAnim,
                  transform: [{ translateY: messageTranslateYAnim }],
                },
              ]}
            >
              <Text style={styles.congratsTitle}>Congrats!</Text>
              <Text style={styles.congratsSubtitle}>You are done for today</Text>
            </Animated.View>
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
  screenContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: screenWidth,
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 28,
    paddingBottom: 48,
    paddingTop: 32,
    gap: 36,
  },
  congratsScreen: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  topSection: {
    alignItems: 'center',
    marginBottom: 8,
  },
  header: {
    alignItems: 'center',
    gap: 12,
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
  headerTitle: {
    color: '#ffffff',
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
  },
  headerSubtitle: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
    paddingHorizontal: 16,
  },
  feedbackCard: {
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderRadius: 28,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    paddingVertical: 28,
    paddingHorizontal: 24,
    gap: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.22,
    shadowRadius: 24,
    elevation: 12,
  },
  sliderContainer: {
    alignItems: 'stretch',
    gap: 8,
  },
  questionTitle: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
  },
  questionSubtitle: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
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
    alignItems: 'center',
    marginTop: 18,
    paddingHorizontal: 4,
  },
  sliderLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
  },
  sliderLabelLeft: {
    textAlign: 'left',
  },
  sliderLabelRight: {
    textAlign: 'right',
  },
  sliderLabelCenter: {
    textAlign: 'center',
    color: '#ffffff',
    fontWeight: '600',
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
  congratsContent: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 32,
    paddingHorizontal: 32,
  },
  checkmarkContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  congratsMessage: {
    alignItems: 'center',
    gap: 8,
  },
  congratsTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#ffffff',
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  congratsSubtitle: {
    fontSize: 18,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
  },
});

export default MeditationFeedbackLanding;


