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
import { Slider0to10 } from '../components/Slider0to10';
import { meditationAudioData, emotionalFeedbackData, sessionProgressData, mockAudioPlayer } from '../data/meditationMockData';
import { PlayIcon, PauseIcon, SkipForward10Icon, SkipBackward10Icon, HeartIcon, HeartOutlineIcon, BackIcon, MoreIcon } from '../components/icons/PlayerIcons';

const { width: screenWidth } = Dimensions.get('window');

type PlayerState = 'ready' | 'playing' | 'paused' | 'finished';

export const MeditationPlayerScreen: React.FC = () => {
  const [playerState, setPlayerState] = useState<PlayerState>('ready');
  const [currentTime, setCurrentTime] = useState(0);
  const [totalDuration, setTotalDuration] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [emotionalRating, setEmotionalRating] = useState(5);
  const [currentSegment, setCurrentSegment] = useState<string>('');
  const [audioLoaded, setAudioLoaded] = useState(false);
  
  const { activeSession, setActiveSession } = useStore();
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

  useEffect(() => {
    if (activeSession) {
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
    }
  }, [activeSession, thumbPosition]);

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
          
          // Track emotional feedback every 30 seconds
          if (newTime % 30 === 0) {
            emotionalFeedbackData.trackEmotionalState(activeSession?.id || '', newTime, emotionalRating);
          }
          
          if (newTime >= totalDuration) {
            setPlayerState('finished');
            // Mark session as complete
            if (activeSession) {
              sessionProgressData.markSessionComplete(activeSession.id, totalDuration, emotionalRating);
            }
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
  }, [playerState, currentTime, totalDuration, activeSession, emotionalRating]);

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

  const handleFinish = () => {
    // Stop audio and save session
    audioPlayerRef.current.stop();
    if (activeSession) {
      sessionProgressData.markSessionComplete(activeSession.id, currentTime, emotionalRating);
    }
    setActiveSession(null);
  };

  const handleDiscard = () => {
    // Stop audio and close without saving
    audioPlayerRef.current.stop();
    setActiveSession(null);
  };

  const handleBack = () => {
    // Stop audio and close
    audioPlayerRef.current.stop();
    setActiveSession(null);
  };

  const handleTutorialToggle = () => {
    setShowTutorial(!showTutorial);
  };

  const handleLike = () => {
    setIsLiked(!isLiked);
  };

  const handleOptions = () => {
    // Handle options menu
    console.log('Options pressed');
  };

  const handleSkipForward = () => {
    const newTime = Math.min(currentTime + 10, totalDuration);
    setCurrentTime(newTime);
    audioPlayerRef.current.seekTo(newTime);
  };

  const handleSkipBackward = () => {
    const newTime = Math.max(currentTime - 10, 0);
    setCurrentTime(newTime);
    audioPlayerRef.current.seekTo(newTime);
  };

  // Helper function to update current time (called from worklet)
  const updateCurrentTime = (newTime: number) => {
    setCurrentTime(newTime);
    audioPlayerRef.current.seekTo(newTime);
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
    <GestureHandlerRootView style={styles.container}>
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      {/* Background with meditation theme */}
      <View style={styles.backgroundOverlay} />
      
      {/* Top Bar */}
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.topBarButton} onPress={handleBack}>
          <BackIcon size={20} color="#ffffff" />
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.tutorialButton} onPress={handleTutorialToggle}>
          <Text style={styles.tutorialButtonText}>
            {showTutorial ? 'Skip tutorial' : 'Do tutorial'}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.heartButtonTop} onPress={handleLike}>
          {isLiked ? (
            <HeartIcon size={32} color="#ff6b6b" />
          ) : (
            <HeartOutlineIcon size={32} color="#ffffff" />
          )}
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.topBarButton} onPress={handleOptions}>
          <MoreIcon size={20} color="#ffffff" />
        </TouchableOpacity>
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
        <View style={styles.progressSection}>
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
            {!audioLoaded && playerState === 'playing' && (
              <View style={styles.loadingOverlay}>
                <ActivityIndicator size="small" color="#ffffff" />
                <Text style={styles.loadingText}>Loading audio...</Text>
              </View>
            )}
          </View>
        </View>

        {/* Player Controls */}
        <View style={styles.playerControls}>
          <TouchableOpacity style={styles.controlButton} onPress={handleSkipBackward}>
            <SkipBackward10Icon size={60} color="#ffffff" />
          </TouchableOpacity>
          
          <Animated.View style={{ transform: [{ scale: playButtonScale }] }}>
            <TouchableOpacity style={styles.playButton} onPress={handlePlayPause}>
              {!audioLoaded && playerState === 'playing' ? (
                <ActivityIndicator size="small" color="#1a1a1a" />
              ) : playerState === 'playing' ? (
                <PauseIcon size={36} color="#1a1a1a" />
              ) : (
                <PlayIcon size={36} color="#1a1a1a" />
              )}
            </TouchableOpacity>
          </Animated.View>
          
          <TouchableOpacity style={styles.controlButton} onPress={handleSkipForward}>
            <SkipForward10Icon size={60} color="#ffffff" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Bottom Section - Fixed Height */}
      <View style={styles.bottomSection}>
        {/* Emotional Feedback Section - Always rendered, shown/hidden with opacity */}
        <Animated.View style={[
          styles.emotionalFeedbackSection,
          { 
            opacity: playerState === 'playing' ? 1 : 0,
            pointerEvents: playerState === 'playing' ? 'auto' : 'none'
          }
        ]}>
          <Text style={styles.emotionalFeedbackTitle}>How do you feel?</Text>
          <View style={styles.emotionalSliderContainer}>
            <Slider0to10
              value={emotionalRating}
              onValueChange={setEmotionalRating}
              label=""
              showLabels={false}
            />
          </View>
        </Animated.View>

        {/* Action Buttons Section - Always rendered, shown/hidden with opacity */}
        <Animated.View style={[
          styles.actionButtonsSection,
          { 
            opacity: (playerState === 'paused' || playerState === 'finished') ? 1 : 0,
            pointerEvents: (playerState === 'paused' || playerState === 'finished') ? 'auto' : 'none'
          }
        ]}>
          <TouchableOpacity style={styles.finishButton} onPress={handleFinish}>
            <Text style={styles.finishButtonText}>Finish</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.discardButton} onPress={handleDiscard}>
            <Text style={styles.discardButtonText}>Discard session</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
      </SafeAreaView>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  backgroundOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(139, 69, 19, 0.4)', // Warm brown overlay for meditation ambiance
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
  topBarButtonText: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '400',
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
    paddingTop: 240, // Increased padding to push content further down
  },
  titleSection: {
    alignItems: 'flex-start',
    marginBottom: 8,
    marginLeft: 0, // Align with progress bar left edge
  },
  sessionTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#ffffff',
  },
  heartButtonTop: {
    padding: 8,
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
  loadingOverlay: {
    position: 'absolute',
    top: -30,
    left: '50%',
    transform: [{ translateX: -50 }],
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  loadingText: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 12,
    fontWeight: '400',
  },
  playerControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 24,
    alignSelf: 'center',
    marginBottom: 50, // Add space between player controls and bottom buttons
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
    minHeight: 200, // Use minHeight instead of fixed height
    position: 'relative',
  },
  emotionalFeedbackSection: {
    position: 'absolute',
    top: 10, // Move down to create space from player controls
    left: 32, // Match the paddingHorizontal
    right: 32, // Match the paddingHorizontal
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  emotionalFeedbackTitle: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 20,
    textAlign: 'center',
  },
  emotionalSliderContainer: {
    width: '100%',
    paddingHorizontal: 8,
  },
  actionButtonsSection: {
    position: 'absolute',
    top: 50, // Move down to create space from player controls
    left: 32, // Match the paddingHorizontal
    right: 32, // Match the paddingHorizontal
    alignItems: 'center',
    gap: 12,
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
  finishButtonText: {
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
});
