import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  StatusBar,
  SafeAreaView,
  Vibration,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { 
  GestureHandlerRootView,
  Gesture,
  GestureDetector,
} from 'react-native-gesture-handler';
import Reanimated, {
  useSharedValue,
  useAnimatedStyle,
  runOnJS,
  withSpring,
  interpolate,
  Extrapolate,
} from 'react-native-reanimated';
import { useStore } from '../store/useStore';
import { theme } from '../styles/theme';
import { meditationAudioData, sessionProgressData, mockAudioPlayer } from '../data/meditationMockData';
import { PlayIcon, PauseIcon, SkipForward10Icon, SkipBackward10Icon, BackIcon } from '../components/icons/PlayerIcons';
import { createMeditationPlayerBackground, getPrerenderedGradient } from '../utils/gradientBackgrounds';

const { width: screenWidth } = Dimensions.get('window');

type PlayerState = 'ready' | 'playing' | 'paused' | 'finished';

export const TutorialPlayerScreen: React.FC = () => {
  const [playerState, setPlayerState] = useState<PlayerState>('ready');
  const [currentTime, setCurrentTime] = useState(0);
  const [totalDuration, setTotalDuration] = useState(0);
  const { activeSession, setActiveSession, isTransitioning, setIsTransitioning } = useStore();
  const [currentSegment, setCurrentSegment] = useState<string>('');
  const [audioLoaded, setAudioLoaded] = useState(false);
  const progressAnim = useRef(new Animated.Value(0)).current;
  const playButtonScale = useRef(new Animated.Value(1)).current;
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioPlayerRef = useRef(mockAudioPlayer);
  
  // Reanimated values for smooth gesture handling
  const thumbPosition = useSharedValue(0);
  const thumbScale = useSharedValue(1);
  const isDragging = useSharedValue(false);
  const progressBarWidth = screenWidth - 64;
  const startPosition = useSharedValue(0);
  const progressFillWidth = useSharedValue(0);
  
  // Tutorial completion state
  const [showCompletionScreen, setShowCompletionScreen] = useState(false);
  const completionAnim = useRef(new Animated.Value(0)).current;
  const completionContentAnim = useRef(new Animated.Value(0)).current;
  
  // Transition state
  const transitionAnim = useRef(new Animated.Value(0)).current;
  
  // Gradient background colors - different shade for tutorial
  const [gradientColors, setGradientColors] = useState({ top: '#2a2a2a', bottom: '#2a2a2a', base: '#2a2a2a' });

  // Apply blur immediately on mount if transitioning to prevent visual glitch
  useEffect(() => {
    if (isTransitioning && activeSession && activeSession.isTutorial) {
      transitionAnim.setValue(1);
    }
  }, []);

  // Prerender state to ensure screen is fully styled before unblur
  const [isPrerendered, setIsPrerendered] = useState(false);
  const [layoutComplete, setLayoutComplete] = useState(false);

  useEffect(() => {
    if (activeSession) {
      // Check if this is a transition from meditation (isTutorial flag means it came from meditation)
      const isFromMeditation = activeSession.isTutorial && isTransitioning;
      
      // Update gradient colors based on session goal with darker shade for tutorial
      const baseGradient = createMeditationPlayerBackground(activeSession.goal, 0);
      setGradientColors({
        top: '#2a2a2a', // Darker shade
        bottom: '#2a2a2a',
        base: '#2a2a2a'
      });
      
      const audioData = meditationAudioData[activeSession.id as keyof typeof meditationAudioData];
      if (audioData) {
        setTotalDuration(audioData.duration);
        setCurrentTime(0);
        setPlayerState('playing'); // Start immediately
        setCurrentSegment(audioData.segments[0]?.text || '');
        
        // Initialize thumb position and progress fill
        thumbPosition.value = 0;
        progressFillWidth.value = 0;
        
        // Load audio in background and start playing when ready
        audioPlayerRef.current.loadAudio(audioData.backgroundAudio).then(() => {
          setAudioLoaded(true);
          audioPlayerRef.current.play();
        });
      } else {
        // Fallback to duration in minutes
        setTotalDuration(activeSession.durationMin * 60);
        setCurrentTime(0);
        setPlayerState('playing'); // Auto-start even without audio data
        
        // Initialize thumb position and progress fill
        thumbPosition.value = 0;
        progressFillWidth.value = 0;
      }
      
      // If coming from meditation, start unblur animation
      if (isFromMeditation) {
        // Start with blur already at full intensity
        transitionAnim.setValue(1);
        setIsTransitioning(true);
        
        // Wait for layout to complete before starting unblur
        if (layoutComplete) {
          setIsPrerendered(true);
          
          // Then start unblur animation
          setTimeout(() => {
            Animated.timing(transitionAnim, {
              toValue: 0,
              duration: 500,
              useNativeDriver: true,
            }).start(() => {
              setIsTransitioning(false);
            });
          }, 50);
        }
      } else {
        // Not transitioning, mark as prerendered immediately
        setIsPrerendered(true);
      }
    }
  }, [activeSession, thumbPosition, isTransitioning, layoutComplete]);

  useEffect(() => {
    if (playerState === 'playing' && currentTime < totalDuration) {
      timerRef.current = setInterval(() => {
        setCurrentTime(prev => {
          const newTime = prev + 1;
          
          // Update current meditation segment
          if (activeSession) {
            const audioData = meditationAudioData[activeSession.id as keyof typeof meditationAudioData];
            if (audioData) {
              const currentSegmentData = audioData.segments.find(
                segment => newTime >= segment.start && newTime <= segment.end
              );
              if (currentSegmentData) {
                setCurrentSegment(currentSegmentData.text);
              }
            }
          }
          
          if (newTime >= totalDuration) {
            setPlayerState('finished');
            // Show completion screen
            setShowCompletionScreen(true);
            Animated.parallel([
              Animated.timing(completionAnim, {
                toValue: 1,
                duration: 500,
                useNativeDriver: true,
              }),
              Animated.timing(completionContentAnim, {
                toValue: 1,
                duration: 800,
                delay: 200, // Start content animation after background
                useNativeDriver: true,
              })
            ]).start();
            return totalDuration;
          }
          return newTime;
        });
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [playerState, currentTime, totalDuration, activeSession]);

  useEffect(() => {
    if (!isDragging.value) {
      const progress = totalDuration > 0 ? currentTime / totalDuration : 0;
      Animated.timing(progressAnim, {
        toValue: progress,
        duration: 200,
        useNativeDriver: false,
      }).start();
      
      // Update thumb position and progress fill when not dragging
      const newThumbPosition = progress * progressBarWidth;
      thumbPosition.value = newThumbPosition;
      progressFillWidth.value = newThumbPosition;
    }
  }, [currentTime, totalDuration, progressAnim, thumbPosition, isDragging, progressBarWidth, progressFillWidth]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handlePlayPause = () => {
    // Animate button press
    Animated.sequence([
      Animated.timing(playButtonScale, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(playButtonScale, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    if (playerState === 'ready') {
      setPlayerState('playing');
      audioPlayerRef.current.play();
    } else if (playerState === 'playing') {
      setPlayerState('paused');
      audioPlayerRef.current.pause();
    } else if (playerState === 'paused') {
      setPlayerState('playing');
      audioPlayerRef.current.play();
    }
  };

  const handleSkipTutorial = () => {
    // Start transition animation
    setIsTransitioning(true);
    Animated.timing(transitionAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start(() => {
      // Stop tutorial audio
      audioPlayerRef.current.stop();
      
      // Reset animations
      completionAnim.setValue(0);
      completionContentAnim.setValue(0);
      
      // Switch to meditation mode while still blurred
      if (activeSession) {
        const normalSession = { ...activeSession };
        delete normalSession.isTutorial;
        setActiveSession(normalSession);
      }
      
      // The new meditation screen will handle the unblur animation
    });
  };

  const handleDiscardSession = () => {
    // Stop audio and close without saving
    audioPlayerRef.current.stop();
    setActiveSession(null);
  };

  const handleStartMeditation = () => {
    // Start transition animation
    setIsTransitioning(true);
    Animated.timing(transitionAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start(() => {
      // Reset animations
      completionAnim.setValue(0);
      completionContentAnim.setValue(0);
      
      // Switch to meditation mode while still blurred
      if (activeSession) {
        const normalSession = { ...activeSession };
        delete normalSession.isTutorial;
        setActiveSession(normalSession);
      }
      
      // The new meditation screen will handle the unblur animation
    });
  };

  const handleBack = () => {
    // Stop audio and close
    audioPlayerRef.current.stop();
    setActiveSession(null);
  };

  const handleSkipForward = () => {
    const newTime = Math.min(currentTime + 10, totalDuration);
    updateCurrentTime(newTime);
  };

  const handleSkipBackward = () => {
    const newTime = Math.max(currentTime - 10, 0);
    updateCurrentTime(newTime);
  };

  // Helper function to update current time (called from worklet)
  const updateCurrentTime = (newTime: number) => {
    setCurrentTime(newTime);
    audioPlayerRef.current.seekTo(newTime);
    
    // Check if we've reached the end of the tutorial
    if (newTime >= totalDuration) {
      setPlayerState('finished');
      setShowCompletionScreen(true);
      Animated.parallel([
        Animated.timing(completionAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(completionContentAnim, {
          toValue: 1,
          duration: 800,
          delay: 200, // Start content animation after background
          useNativeDriver: true,
        })
      ]).start();
    }
  };

  // Helper function to trigger haptic feedback
  const triggerHapticFeedback = () => {
    Vibration.vibrate(10); // Short vibration for touch feedback
  };

  // Enhanced gesture handler using newer Gesture API
  const panGesture = Gesture.Pan()
    .onStart(() => {
      isDragging.value = true;
      startPosition.value = thumbPosition.value; // Store the current position as starting point
      thumbScale.value = withSpring(1.3, {
        damping: 15,
        stiffness: 200,
      });
      runOnJS(triggerHapticFeedback)();
    })
    .onUpdate((event) => {
      // Calculate new position: start position + finger movement
      const newPosition = Math.max(0, Math.min(progressBarWidth, startPosition.value + event.translationX));
      thumbPosition.value = newPosition;
      
      // Update progress fill to follow thumb 1:1
      progressFillWidth.value = newPosition;
      
      // Calculate and update time in real-time
      const progress = newPosition / progressBarWidth;
      const newTime = Math.round(progress * totalDuration);
      runOnJS(updateCurrentTime)(newTime);
    })
    .onEnd(() => {
      isDragging.value = false;
      thumbScale.value = withSpring(1, {
        damping: 15,
        stiffness: 200,
      });
    })
    .minDistance(0)
    .activeOffsetX([-10, 10])
    .failOffsetY([-20, 20]);

  // Animated styles for the thumb
  const thumbAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: thumbPosition.value },
        { scale: thumbScale.value }
      ],
    };
  });

  // Animated styles for the progress fill
  const progressFillAnimatedStyle = useAnimatedStyle(() => {
    return {
      width: progressFillWidth.value,
    };
  });

  if (!activeSession) return null;

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, screenWidth - 64],
    extrapolate: 'clamp',
  });

  return (
    <GestureHandlerRootView 
      style={styles.container}
      onLayout={() => {
        setLayoutComplete(true);
      }}
    >
      <SafeAreaView style={styles.container}>
        <StatusBar 
          barStyle="light-content" 
          backgroundColor="transparent" 
          translucent 
        />
      
      {/* Dynamic gradient background - darker shade for tutorial */}
      <View style={styles.backgroundGradient}>
        <LinearGradient
          colors={[gradientColors.top, gradientColors.bottom]}
          style={styles.backgroundGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
        />
      </View>
      
      {/* Top Bar */}
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.topBarButton} onPress={handleBack}>
          <BackIcon size={20} color="#ffffff" />
        </TouchableOpacity>
        
        {playerState === 'playing' && (
          <TouchableOpacity style={styles.tutorialButton} onPress={handleSkipTutorial}>
            <Text style={styles.tutorialButtonText}>Skip tutorial</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Main Content */}
      <View style={styles.mainContent}>
        {/* Session Title */}
        <View style={styles.titleSection}>
          <Text style={styles.sessionTitle}>{activeSession.title}</Text>
        </View>

        {/* Artist/Creator */}
        <View style={styles.artistContainer}>
          <Text style={styles.artistName}>Prashanti Paz</Text>
        </View>

        {/* Progress Bar */}
        <TouchableOpacity 
          style={styles.progressSection} 
          onPress={(e) => e.stopPropagation()}
          activeOpacity={1}
        >
          <View style={styles.progressContainer}>
            <View style={styles.progressTrack} />
            <Reanimated.View style={[styles.progressFill, progressFillAnimatedStyle]} />
            <GestureDetector gesture={panGesture}>
              <Reanimated.View style={[styles.progressThumb, thumbAnimatedStyle]} />
            </GestureDetector>
          </View>
          <View style={styles.timeContainer}>
            <Text style={styles.timeText}>{formatTime(currentTime)}</Text>
            <Text style={styles.timeText}>-{formatTime(totalDuration - currentTime)}</Text>
          </View>
        </TouchableOpacity>

        {/* Player Controls */}
        <View style={styles.playerControls}>
          <TouchableOpacity style={styles.controlButton} onPress={(e) => { e.stopPropagation(); handleSkipBackward(); }}>
            <SkipBackward10Icon size={60} color="#ffffff" />
          </TouchableOpacity>
          
          <Animated.View style={{ transform: [{ scale: playButtonScale }] }}>
            <TouchableOpacity style={styles.playButton} onPress={(e) => { e.stopPropagation(); handlePlayPause(); }}>
              {!audioLoaded && playerState === 'playing' ? (
                <ActivityIndicator size="small" color="#1a1a1a" />
              ) : playerState === 'playing' ? (
                <PauseIcon size={36} color="#1a1a1a" />
              ) : (
                <PlayIcon size={36} color="#1a1a1a" />
              )}
            </TouchableOpacity>
          </Animated.View>
          
          <TouchableOpacity style={styles.controlButton} onPress={(e) => { e.stopPropagation(); handleSkipForward(); }}>
            <SkipForward10Icon size={60} color="#ffffff" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Bottom Section - Action Buttons for paused state */}
      <View style={styles.bottomSection}>
        <View 
          style={[
            styles.actionButtonsSection,
            { 
              opacity: (playerState === 'paused' || playerState === 'finished') ? 1 : 0,
              pointerEvents: (playerState === 'paused' || playerState === 'finished') ? 'auto' : 'none'
            }
          ]}
        >
          <TouchableOpacity style={styles.skipTutorialButton} onPress={handleSkipTutorial}>
            <Text style={styles.skipTutorialButtonText}>Skip tutorial</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.discardButton} onPress={handleDiscardSession}>
            <Text style={styles.discardButtonText}>Discard Session</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Transition Overlay - Always present to prevent glitch */}
      <Animated.View 
        style={[
          styles.transitionOverlay,
          {
            opacity: transitionAnim,
            pointerEvents: isTransitioning ? 'auto' : 'none',
          }
        ]}
      >
        <BlurView
          intensity={80}
          tint="dark"
          style={styles.blurView}
        />
      </Animated.View>

      {/* Tutorial Completion Screen */}
      {showCompletionScreen && (
        <Animated.View 
          style={[
            styles.completionScreen,
            {
              opacity: completionAnim,
            }
          ]}
        >
          <Animated.View 
            style={[
              styles.completionContent,
              {
                opacity: completionContentAnim,
                transform: [{
                  translateY: completionContentAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [30, 0],
                  })
                }]
              }
            ]}
          >
            <TouchableOpacity style={styles.completionStartButton} onPress={handleStartMeditation}>
              <Text style={styles.completionStartButtonText}>Start meditation</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.completionDiscardButton} onPress={handleDiscardSession}>
              <Text style={styles.completionDiscardButtonText}>Discard session</Text>
            </TouchableOpacity>
          </Animated.View>
        </Animated.View>
      )}
      </SafeAreaView>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#2a2a2a', // Darker background for tutorial
  },
  backgroundGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
    zIndex: 10,
  },
  topBarButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  tutorialButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    minWidth: 120,
    alignItems: 'center',
  },
  tutorialButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '500',
  },
  mainContent: {
    flex: 1,
    paddingHorizontal: 32,
    justifyContent: 'flex-start',
    alignItems: 'stretch',
    paddingTop: 240,
  },
  titleSection: {
    alignItems: 'flex-start',
    marginBottom: 8,
    marginLeft: 0,
  },
  sessionTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#ffffff',
  },
  artistContainer: {
    width: '100%',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  artistName: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'left',
  },
  progressSection: {
    width: '100%',
    marginBottom: 40,
  },
  progressContainer: {
    position: 'relative',
    height: 20,
    marginBottom: 12,
    justifyContent: 'center',
  },
  progressTrack: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 3,
    marginTop: 7,
  },
  progressFill: {
    position: 'absolute',
    top: 0,
    left: 0,
    height: 6,
    backgroundColor: '#ffffff',
    borderRadius: 3,
    marginTop: 7,
  },
  progressThumb: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    top: -2,
    left: -12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.9)',
  },
  timeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  timeText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '500',
  },
  playerControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 24,
    alignSelf: 'center',
    marginBottom: 50,
  },
  controlButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 12,
  },
  bottomSection: {
    paddingHorizontal: 32,
    paddingBottom: 40,
    minHeight: 200,
    position: 'relative',
  },
  actionButtonsSection: {
    position: 'absolute',
    top: 50,
    left: 32,
    right: 32,
    alignItems: 'center',
    gap: 12,
  },
  skipTutorialButton: {
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
  skipTutorialButtonText: {
    color: '#1a1a1a',
    fontSize: 18,
    fontWeight: '600',
  },
  discardButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  discardButtonText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 16,
    fontWeight: '500',
  },
  completionScreen: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  completionContent: {
    alignItems: 'center',
    gap: 20,
    paddingHorizontal: 40,
  },
  completionDiscardButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 48,
    width: '100%',
    alignItems: 'center',
  },
  completionDiscardButtonText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 18,
    fontWeight: '600',
  },
  completionStartButton: {
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
  completionStartButtonText: {
    color: '#1a1a1a',
    fontSize: 18,
    fontWeight: '600',
  },
  transitionOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 2000,
  },
  blurView: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
});
