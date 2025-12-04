import React, { useState, useEffect, useRef, useMemo } from 'react';
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
  Switch,
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
import { Slider0to10 } from '../components/Slider0to10';
import { meditationAudioData, sessionProgressData, mockAudioPlayer } from '../data/meditationMockData';
import { PlayIcon, PauseIcon, SkipForward10Icon, SkipBackward10Icon, HeartIcon, HeartOutlineIcon, BackIcon, MoreIcon } from '../components/icons/PlayerIcons';
import { createMeditationPlayerBackground, getPrerenderedGradient } from '../utils/gradientBackgrounds';
import MeditationCompletionLanding from '../components/MeditationCompletionLanding';
import MeditationFeedbackLanding from '../components/MeditationFeedbackLanding';
import { markSessionCompleted } from '../services/progressService';
import { addSessionRating } from '../services/ratingService';
import { addEmotionalFeedback } from '../services/feedbackService';

const { width: screenWidth } = Dimensions.get('window');

type PlayerState = 'ready' | 'playing' | 'paused' | 'finished';

export const MeditationPlayerScreen: React.FC = () => {
  const [playerState, setPlayerState] = useState<PlayerState>('ready');
  const [currentTime, setCurrentTime] = useState(0);
  const [totalDuration, setTotalDuration] = useState(0);
  const { activeSession, setActiveSession, isTransitioning, setIsTransitioning } = useStore();
  const toggleLikedSession = useStore((state: any) => state.toggleLikedSession);
  const likedSessionIds = useStore((state: any) => state.likedSessionIds);
  const addEmotionalFeedbackEntry = useStore((state: any) => state.addEmotionalFeedbackEntry);
  const userId = useStore((state: any) => state.userId);
  const activeModuleId = useStore((state: any) => state.activeModuleId);
  const todayModuleId = useStore((state: any) => state.todayModuleId);
  const isLiked = activeSession ? likedSessionIds.includes(activeSession.id) : false;
  const [showTutorial, setShowTutorial] = useState(false);
  const [emotionalRating, setEmotionalRating] = useState(5);
  const [currentSegment, setCurrentSegment] = useState<string>('');
  const [audioLoaded, setAudioLoaded] = useState(false);
  const [showCompletionLanding, setShowCompletionLanding] = useState(false);
  const [showFeedbackLanding, setShowFeedbackLanding] = useState(false);
  const progressAnim = useRef(new Animated.Value(0)).current;
  const playButtonScale = useRef(new Animated.Value(1)).current;
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioPlayerRef = useRef(mockAudioPlayer);
  const truncatedTitle = useMemo(() => {
    const title = activeSession?.title ?? '';
    if (!title) return '';

    const limit = 26;
    if (title.length <= limit) {
      return title;
    }

    const trimmed = title.slice(0, limit).trimEnd();
    return `${trimmed}...`;
  }, [activeSession?.title]);
  
  // Reanimated values for smooth gesture handling
  const thumbPosition = useSharedValue(0);
  const thumbScale = useSharedValue(1);
  const isDragging = useSharedValue(false);
  const progressBarWidth = screenWidth - 64;
  const startPosition = useSharedValue(0);
  const progressFillWidth = useSharedValue(0);
  
  // Emotional feedback progress bar values
  const emotionalThumbPosition = useSharedValue(0);
  const emotionalThumbScale = useSharedValue(1);
  const emotionalIsDragging = useSharedValue(false);
  const emotionalStartPosition = useSharedValue(0);
  const emotionalProgressFillWidth = useSharedValue(0);
  const [actualEmotionalBarWidth, setActualEmotionalBarWidth] = useState(0);
  const [currentEmotionalLabel, setCurrentEmotionalLabel] = useState('');
  const emotionalLabelRef = useRef<string>(''); // Store label for countdown confirmation
  const [progressBarColor, setProgressBarColor] = useState('rgba(255, 255, 255, 0.8)'); // Start with high opacity white
  const [isProgressBarVisible, setIsProgressBarVisible] = useState(true);
  const [hasUserInteracted, setHasUserInteracted] = useState(false);
  const hasUserInteractedValue = useSharedValue(false);
  const progressBarWidthAnim = useRef(new Animated.Value(0)).current;
  const emotionalFeedbackOpacity = useRef(new Animated.Value(0)).current;
  const previousColorRef = useRef('rgba(255, 255, 255, 0.8)');
  
  // Confirmation system state
  const [isConfirming, setIsConfirming] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [confirmedEmotionalState, setConfirmedEmotionalState] = useState('');
  const [lockedPosition, setLockedPosition] = useState<number | null>(null);
  const countdownTimerRef = useRef<NodeJS.Timeout | null>(null);
  const countdownProgressAnim = useRef(new Animated.Value(0)).current;
  const countdownScaleAnim = useRef(new Animated.Value(1)).current;
  const confirmationMessageAnim = useRef(new Animated.Value(0)).current;
  const [showConfirmationMessage, setShowConfirmationMessage] = useState(false);
  const canceledMessageAnim = useRef(new Animated.Value(0)).current;
  const [showCanceledMessage, setShowCanceledMessage] = useState(false);
  const pulseAnimationRef = useRef<Animated.CompositeAnimation | null>(null);
  const darkModeMessageAnim = useRef(new Animated.Value(0)).current;
  const [showDarkModeMessage, setShowDarkModeMessage] = useState(false);
  const likedMessageAnim = useRef(new Animated.Value(0)).current;
  const [showLikedMessage, setShowLikedMessage] = useState(false);
  const [isLikedAction, setIsLikedAction] = useState(true); // true = added, false = removed
  const likedMessageTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Options menu state
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);
  const [sleepModeEnabled, setSleepModeEnabled] = useState(false);
  const [downloadEnabled, setDownloadEnabled] = useState(false);
  const [idleTimerEnabled, setIdleTimerEnabled] = useState(true);
  const optionsMenuAnim = useRef(new Animated.Value(0)).current;
  
  // Dark mode state
  const [isDarkMode, setIsDarkMode] = useState(false);
  const darkModeAnim = useRef(new Animated.Value(0)).current;
  const darkModeBackgroundAnim = useRef(new Animated.Value(0)).current;
  
  // Transition state
  const transitionAnim = useRef(new Animated.Value(0)).current;
  
  // Idle timer for auto dark mode
  const idleTimerRef = useRef<NodeJS.Timeout | null>(null);
  const IDLE_TIMEOUT = 10000; // 10 seconds
  
  // Gradient background colors
  const [gradientColors, setGradientColors] = useState({ top: '#1a1a1a', bottom: '#1a1a1a', base: '#1a1a1a' });

  // Apply blur immediately on mount if transitioning to prevent visual glitch
  useEffect(() => {
    if (isTransitioning && activeSession && !activeSession.isTutorial) {
      transitionAnim.setValue(1);
    }
  }, []);

  // Prerender state to ensure screen is fully styled before unblur
  const [isPrerendered, setIsPrerendered] = useState(false);
  const [layoutComplete, setLayoutComplete] = useState(false);

  useEffect(() => {
    if (activeSession) {
      // Check if this is a transition from tutorial (no isTutorial flag means it came from tutorial)
      const isFromTutorial = !activeSession.isTutorial && isTransitioning;
      
      // Update gradient colors based on session goal
      const newGradientColors = createMeditationPlayerBackground(activeSession.goal, 0);
      setGradientColors(newGradientColors);
      
      const audioData = meditationAudioData[activeSession.id as keyof typeof meditationAudioData];
      if (audioData) {
        setTotalDuration(audioData.duration);
        setCurrentTime(0);
        setAudioLoaded(false);
        setCurrentSegment(audioData.segments[0]?.text || '');
        
        // Initialize thumb position and progress fill
        thumbPosition.value = 0;
        progressFillWidth.value = 0;
        
        // Initialize emotional feedback position (start at center)
        // Will be set properly once actualEmotionalBarWidth is measured
        // Don't reset to 0 - let the width measurement handle positioning
        setEmotionalRating(3); // Start at "okay"
        setCurrentEmotionalLabel(''); // No initial label - only show when interacted
        setHasUserInteracted(false); // Reset interaction state
        hasUserInteractedValue.value = false; // Reset shared value
        setProgressBarColor('rgba(255, 255, 255, 0.8)'); // Start with high opacity white (neutral)
        
        // Reset emotional feedback opacity
        emotionalFeedbackOpacity.setValue(0);
        
        // Load audio in background and start playing when ready
        audioPlayerRef.current.loadAudio(audioData.backgroundAudio).then(() => {
          setAudioLoaded(true);
          setPlayerState('playing');
          audioPlayerRef.current.play();
          
          // Animate emotional feedback section in
          Animated.timing(emotionalFeedbackOpacity, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }).start();
        });
      } else {
        // Fallback to duration in minutes
        setTotalDuration(activeSession.durationMin * 60);
        setCurrentTime(0);
        setAudioLoaded(true);
        setPlayerState('playing'); // Auto-start even without audio data
        
        // Initialize thumb position and progress fill
        thumbPosition.value = 0;
        progressFillWidth.value = 0;
        
        // Initialize emotional feedback position (start at center)
        // Will be set properly once actualEmotionalBarWidth is measured
        // Don't reset to 0 - let the width measurement handle positioning
        setEmotionalRating(3); // Start at "okay"
        setCurrentEmotionalLabel(''); // No initial label - only show when interacted
        setHasUserInteracted(false); // Reset interaction state
        hasUserInteractedValue.value = false; // Reset shared value
        setProgressBarColor('rgba(255, 255, 255, 0.8)'); // Start with high opacity white (neutral)
        
        // Reset emotional feedback opacity
        emotionalFeedbackOpacity.setValue(0);
        
        // Animate emotional feedback section in (fallback case)
        Animated.timing(emotionalFeedbackOpacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }).start();
      }
      
      // If coming from tutorial, start unblur animation
      if (isFromTutorial) {
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

  // Update gradient colors based on session progress
  useEffect(() => {
    if (activeSession && totalDuration > 0) {
      const progress = currentTime / totalDuration;
      const newGradientColors = createMeditationPlayerBackground(activeSession.goal, progress);
      setGradientColors(newGradientColors);
    }
  }, [currentTime, totalDuration, activeSession]);

  // Initialize emotional position once width is measured
  useEffect(() => {
    if (actualEmotionalBarWidth > 0) {
      // Position thumb at center of the bar (for "Okay" state)
      // No need to adjust for thumb radius here since center is always within bounds
      const centerPosition = actualEmotionalBarWidth / 2;
      emotionalThumbPosition.value = centerPosition;
      // Don't set initial label - only show when user interacts
      // Keep white color as neutral default
      setProgressBarColor('#ffffff');
      // Progress fill is calculated dynamically in the animated style
    }
  }, [actualEmotionalBarWidth, emotionalThumbPosition]);

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
            setShowCompletionLanding(true);
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

  // Cleanup countdown timer on unmount
  useEffect(() => {
    return () => {
      if (countdownTimerRef.current) {
        clearInterval(countdownTimerRef.current);
      }
    };
  }, []);

  // Idle timer management
  useEffect(() => {
    // Start idle timer when component mounts and player is playing
    if (playerState === 'playing' && !isDarkMode && idleTimerEnabled) {
      resetIdleTimer();
    }

    // Cleanup timer on unmount
    return () => {
      clearIdleTimer();
    };
  }, [playerState, isDarkMode, idleTimerEnabled]);

  // Reset idle timer on specific user interactions (not on time updates)
  useEffect(() => {
    if (playerState === 'playing' && !isDarkMode && idleTimerEnabled) {
      resetIdleTimer();
    }
  }, [emotionalRating, showTutorial, isLiked, idleTimerEnabled]);


  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handlePlayPause = () => {
    // Reset idle timer on user interaction
    resetIdleTimer();
    
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

    if (!audioLoaded) {
      return;
    }
    if (playerState === 'ready') {
      setPlayerState('playing');
      audioPlayerRef.current.play();
      // Animate emotional feedback bar in
      Animated.timing(emotionalFeedbackOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else if (playerState === 'playing') {
      setPlayerState('paused');
      audioPlayerRef.current.pause();
      // Cancel emotional feedback countdown silently when pausing
      cancelCountdownSilently();
      // Animate emotional feedback bar out
      Animated.timing(emotionalFeedbackOpacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else if (playerState === 'paused') {
      setPlayerState('playing');
      audioPlayerRef.current.play();
      // Animate emotional feedback bar in
      Animated.timing(emotionalFeedbackOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  };

  const handleFinish = () => {
    // Stop audio and open completion landing
    audioPlayerRef.current.stop();
    setShowCompletionLanding(true);
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
    if (showTutorial) {
      // Skip tutorial - go back to normal player
      setShowTutorial(false);
    } else {
      // Do tutorial - switch to tutorial mode with transition
      setIsTransitioning(true);
      Animated.timing(transitionAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start(() => {
        // Switch to tutorial mode while still blurred
        if (activeSession) {
          const tutorialSession = { ...activeSession, isTutorial: true };
          setActiveSession(tutorialSession);
        }
        
        // The new tutorial screen will handle the unblur animation
      });
    }
  };

  const handleLike = () => {
    if (activeSession) {
      const wasLiked = isLiked;
      toggleLikedSession(activeSession.id);
      
      // Clear any existing timeout
      if (likedMessageTimeoutRef.current) {
        clearTimeout(likedMessageTimeoutRef.current);
      }
      
      // Stop any ongoing animation
      likedMessageAnim.stopAnimation();
      
      // Reset animation value
      likedMessageAnim.setValue(0);
      
      // Set the action type (opposite of what it was)
      setIsLikedAction(!wasLiked);
      setShowLikedMessage(true);
      
      // Fade in animation
      Animated.timing(likedMessageAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
      
      // Fade out after 2 seconds
      likedMessageTimeoutRef.current = setTimeout(() => {
        Animated.timing(likedMessageAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }).start(() => {
          setShowLikedMessage(false);
        });
      }, 2000);
    }
  };

  const handleOptions = () => {
    setShowOptionsMenu(true);
    Animated.timing(optionsMenuAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const handleCloseOptions = () => {
    Animated.timing(optionsMenuAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setShowOptionsMenu(false);
    });
  };

  // Function to activate dark mode with animation
  const activateDarkMode = (newDarkMode: boolean) => {
    setIsDarkMode(newDarkMode);
    
    // Show dark mode message when entering dark mode
    if (newDarkMode) {
      setShowDarkModeMessage(true);
      Animated.sequence([
        Animated.timing(darkModeMessageAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.delay(1500),
        Animated.timing(darkModeMessageAnim, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setShowDarkModeMessage(false);
      });
    }
    
    // Smooth fade animations
    Animated.parallel([
      Animated.timing(darkModeAnim, {
        toValue: newDarkMode ? 1 : 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(darkModeBackgroundAnim, {
        toValue: newDarkMode ? 1 : 0,
        duration: 300,
        useNativeDriver: false,
      })
    ]).start();
  };

  // Function to reset idle timer
  const resetIdleTimer = () => {
    // Clear existing timer
    if (idleTimerRef.current) {
      console.log('Resetting idle timer...');
      clearTimeout(idleTimerRef.current);
    }
    
    // Only start timer if enabled, not already in dark mode, and player is playing
    if (idleTimerEnabled && !isDarkMode && playerState === 'playing') {
      console.log('Starting idle timer for dark mode...');
      idleTimerRef.current = setTimeout(() => {
        console.log('Idle timer triggered - activating dark mode');
        activateDarkMode(true);
      }, IDLE_TIMEOUT);
    }
  };

  // Function to clear idle timer
  const clearIdleTimer = () => {
    if (idleTimerRef.current) {
      clearTimeout(idleTimerRef.current);
      idleTimerRef.current = null;
    }
  };

  // Helper function to hide dark mode message
  const hideDarkModeMessage = () => {
    if (showDarkModeMessage) {
      darkModeMessageAnim.stopAnimation(() => {
        darkModeMessageAnim.setValue(0);
        setShowDarkModeMessage(false);
      });
    }
  };

  const handleScreenTap = () => {
    // Only allow dark mode toggle when playing, not when paused
    if (playerState !== 'playing') {
      return;
    }
    
    // Hide dark mode message if exiting dark mode
    if (isDarkMode) {
      hideDarkModeMessage();
    }
    
    // Toggle dark mode when tapping anywhere on the screen
    const newDarkMode = !isDarkMode;
    activateDarkMode(newDarkMode);
    
    // Reset idle timer when user interacts
    if (!newDarkMode) {
      resetIdleTimer();
    } else {
      clearIdleTimer();
    }
  };

  const handleSkipForward = () => {
    const newTime = Math.min(currentTime + 10, totalDuration);
    updateCurrentTimeWithReset(newTime);
  };

  const handleSkipBackward = () => {
    const newTime = Math.max(currentTime - 10, 0);
    updateCurrentTimeWithReset(newTime);
  };

  // Helper function to update current time (called from worklet)
  const updateCurrentTime = (newTime: number) => {
    setCurrentTime(newTime);
    audioPlayerRef.current.seekTo(newTime);
  };

  // Helper function to update current time with idle timer reset (for user interactions)
  const updateCurrentTimeWithReset = (newTime: number) => {
    // If user skips to or beyond the end, finish immediately
    if (newTime >= totalDuration) {
      setCurrentTime(totalDuration);
      audioPlayerRef.current.seekTo(totalDuration);
      audioPlayerRef.current.stop();
      setPlayerState('finished');
      setShowCompletionLanding(true);
      return;
    }
    setCurrentTime(newTime);
    audioPlayerRef.current.seekTo(newTime);
    resetIdleTimer();
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
      runOnJS(updateCurrentTimeWithReset)(newTime);
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

  // Helper function to get emotional label based on position
  const getEmotionalLabel = (position: number) => {
    const progress = actualEmotionalBarWidth > 0 ? position / actualEmotionalBarWidth : 0.5;
    if (progress < 0.2) return 'Bad';
    if (progress < 0.4) return 'Meh';
    if (progress < 0.6) return 'Okay';
    if (progress < 0.8) return 'Good';
    return 'Great';
  };

  // Helper function to get color index for animation
  const getEmotionalColorIndex = (label: string) => {
    switch (label) {
      case 'Bad': return 0;
      case 'Meh': return 1;
      case 'Okay': return 2;
      case 'Good': return 3;
      case 'Great': return 4;
      default: return 2; // Default to middle (Okay)
    }
  };

  // Color palette for smooth transitions - using more colors for smoother interpolation
  const emotionalColors = [
    '#ff4757', // Bad - Red
    '#ff6b35', // Bad-Meh transition - Orange-red
    '#ffa502', // Meh - Orange
    '#ffb347', // Meh-Okay transition - Light orange
    '#ffd700', // Okay - Yellow
    '#9acd32', // Okay-Good transition - Yellow-green
    '#2ed573', // Good - Green
    '#20b2aa', // Good-Great transition - Teal
    '#1e90ff'  // Great - Blue
  ];

  // Helper function to update emotional rating (called from worklet)
  const updateEmotionalRating = (newRating: number) => {
    setEmotionalRating(newRating);
    // Reset idle timer on emotional feedback interaction
    resetIdleTimer();
  };

  // Start countdown confirmation
  const startCountdown = (label: string) => {
    console.log('💬 [Emotional Feedback] startCountdown called with label:', label);
    
    // Clear any existing timer
    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current);
    }
    
    // Lock the current position
    setLockedPosition(emotionalThumbPosition.value);
    
    setIsConfirming(true);
    setCountdown(3);
    setConfirmedEmotionalState(label);
    console.log('💬 [Emotional Feedback] Set confirmedEmotionalState to:', label);
    
    // Reset and animate countdown progress
    countdownProgressAnim.setValue(0);
    countdownScaleAnim.setValue(1);
    
    // Animate progress bar from 0 to 1 over 3 seconds
    Animated.timing(countdownProgressAnim, {
      toValue: 1,
      duration: 3000,
      useNativeDriver: false,
    }).start();
    
    // Pulse animation for countdown number
    pulseAnimationRef.current = Animated.loop(
      Animated.sequence([
        Animated.timing(countdownScaleAnim, {
          toValue: 1.15,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(countdownScaleAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
      ])
    );
    pulseAnimationRef.current.start();
    
    // Store the label in a ref so we can access it even if state hasn't updated
    emotionalLabelRef.current = label;
    
    countdownTimerRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          // Countdown finished, confirm the selection
          if (pulseAnimationRef.current) {
            pulseAnimationRef.current.stop();
            pulseAnimationRef.current = null;
          }
          // Use the label from ref to ensure we have the correct value
          confirmEmotionalState(emotionalLabelRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // Confirm the emotional state and reset to default
  const confirmEmotionalState = async (label?: string) => {
    // Clear timer
    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current);
      countdownTimerRef.current = null;
    }
    
    // Use the passed label parameter, or fall back to state (label parameter takes priority)
    const emotionalStateToSave = label || confirmedEmotionalState;
    const timeAtConfirmation = currentTime;
    
    console.log('💬 [Emotional Feedback] Confirming emotional state:', emotionalStateToSave);
    console.log('💬 [Emotional Feedback] Label parameter:', label);
    console.log('💬 [Emotional Feedback] State value:', confirmedEmotionalState);
    
    // Save emotional feedback to store and database
    if (activeSession && emotionalStateToSave) {
      const feedbackEntry = {
        id: `feedback-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        sessionId: activeSession.id,
        label: emotionalStateToSave as any,
        timestampSeconds: timeAtConfirmation,
        date: new Date().toISOString(),
      };
      
      // Save to database first
      if (userId) {
        const moduleContext = activeModuleId || todayModuleId || undefined;
        console.log('💾 [Emotional Feedback] Saving to database:', {
          userId,
          sessionId: activeSession.id,
          label: emotionalStateToSave,
          timestampSeconds: timeAtConfirmation,
          contextModule: moduleContext,
        });
        
        const result = await addEmotionalFeedback(
          userId,
          activeSession.id,
          emotionalStateToSave as any,
          timeAtConfirmation,
          moduleContext
        );
        
        if (result.success) {
          console.log('✅ [Emotional Feedback] Saved to database successfully, ID:', result.id);
          // Update the entry with the database ID if available
          if (result.id) {
            feedbackEntry.id = result.id;
          }
          // Add to local store after database save (deferred to avoid render issues)
          setTimeout(() => {
            addEmotionalFeedbackEntry(feedbackEntry);
          }, 0);
        } else {
          console.error('❌ [Emotional Feedback] Failed to save to database:', result.error);
          // Still add to store even if database save fails (for offline support)
          setTimeout(() => {
            addEmotionalFeedbackEntry(feedbackEntry);
          }, 0);
        }
      } else {
        console.warn('⚠️ [Emotional Feedback] No user ID, cannot save to database');
        // Add to store anyway (will be synced later when user ID is available)
        setTimeout(() => {
          addEmotionalFeedbackEntry(feedbackEntry);
        }, 0);
      }
    } else {
      if (!activeSession) {
        console.warn('⚠️ [Emotional Feedback] No active session');
      }
      if (!emotionalStateToSave) {
        console.warn('⚠️ [Emotional Feedback] No emotional state to save');
      }
    }
    
    // First hide the countdown
    setIsConfirming(false);
    setCountdown(0);
    
    // Reset bar to default immediately to prevent bugs if user drags while message is showing
    setHasUserInteracted(false);
    hasUserInteractedValue.value = false;
    setCurrentEmotionalLabel('');
    setProgressBarColor('rgba(255, 255, 255, 0.8)');
    setConfirmedEmotionalState('');
    setLockedPosition(null);
    
    // Reset thumb to center position immediately
    if (actualEmotionalBarWidth > 0) {
      const centerPosition = actualEmotionalBarWidth / 2;
      emotionalThumbPosition.value = centerPosition;
    }
    
    // Reset animations
    countdownProgressAnim.setValue(0);
    countdownScaleAnim.setValue(1);
    
    // Then show confirmation message after a brief delay
    setTimeout(() => {
      setShowConfirmationMessage(true);
      Animated.sequence([
        Animated.timing(confirmationMessageAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.delay(2000),
        Animated.timing(confirmationMessageAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setShowConfirmationMessage(false);
      });
    }, 200); // Small delay to ensure countdown disappears first
  };

  // Cancel countdown (when user clicks X button)
  const cancelCountdown = () => {
    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current);
      countdownTimerRef.current = null;
    }
    if (pulseAnimationRef.current) {
      pulseAnimationRef.current.stop();
      pulseAnimationRef.current = null;
    }
    
    // Hide countdown
    setIsConfirming(false);
    setCountdown(0);
    
    // Reset bar to default immediately to prevent bugs if user drags while message is showing
    setConfirmedEmotionalState('');
    setLockedPosition(null);
    countdownProgressAnim.setValue(0);
    countdownScaleAnim.setValue(1);
    setHasUserInteracted(false);
    hasUserInteractedValue.value = false;
    setCurrentEmotionalLabel('');
    setProgressBarColor('rgba(255, 255, 255, 0.8)');
    
    // Reset thumb to center position immediately
    if (actualEmotionalBarWidth > 0) {
      const centerPosition = actualEmotionalBarWidth / 2;
      emotionalThumbPosition.value = centerPosition;
    }
    
    // Show canceled message
    setShowCanceledMessage(true);
    Animated.sequence([
      Animated.timing(canceledMessageAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.delay(1500),
      Animated.timing(canceledMessageAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setShowCanceledMessage(false);
    });
  };
  
  // Cancel countdown silently (when user moves the bar or pauses)
  const cancelCountdownSilently = () => {
    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current);
      countdownTimerRef.current = null;
    }
    if (pulseAnimationRef.current) {
      pulseAnimationRef.current.stop();
      pulseAnimationRef.current = null;
    }
    setIsConfirming(false);
    setCountdown(0);
    setConfirmedEmotionalState('');
    setLockedPosition(null);
    
    // Reset animations
    countdownProgressAnim.setValue(0);
    countdownScaleAnim.setValue(1);
    
    // Reset to default state
    setHasUserInteracted(false);
    hasUserInteractedValue.value = false;
    setCurrentEmotionalLabel('');
    setProgressBarColor('rgba(255, 255, 255, 0.8)');
    
    // Reset thumb to center position
    if (actualEmotionalBarWidth > 0) {
      const centerPosition = actualEmotionalBarWidth / 2;
      emotionalThumbPosition.value = centerPosition;
    }
  };

  // Helper function to interpolate between colors for smooth transitions
  const interpolateColor = (progress: number) => {
    // Clamp progress between 0 and 1
    const clampedProgress = Math.max(0, Math.min(1, progress));
    
    // Scale to our color array length (9 colors = 8 intervals)
    const scaledProgress = clampedProgress * (emotionalColors.length - 1);
    
    // Get the two colors to interpolate between
    const lowerIndex = Math.floor(scaledProgress);
    const upperIndex = Math.min(lowerIndex + 1, emotionalColors.length - 1);
    const t = scaledProgress - lowerIndex;
    
    // If we're at the exact color, return it
    if (t === 0) {
      return emotionalColors[lowerIndex];
    }
    
    // Simple linear interpolation between hex colors
    const color1 = emotionalColors[lowerIndex];
    const color2 = emotionalColors[upperIndex];
    
    // Convert hex to RGB
    const hexToRgb = (hex: string) => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
      } : null;
    };
    
    const rgb1 = hexToRgb(color1);
    const rgb2 = hexToRgb(color2);
    
    if (!rgb1 || !rgb2) return color1;
    
    // Interpolate each component
    const r = Math.round(rgb1.r + (rgb2.r - rgb1.r) * t);
    const g = Math.round(rgb1.g + (rgb2.g - rgb1.g) * t);
    const b = Math.round(rgb1.b + (rgb2.b - rgb1.b) * t);
    
    // Convert back to hex
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  };

  // Helper function to update emotional label and color (called from worklet)
  const updateEmotionalLabel = (position: number) => {
    try {
      const label = getEmotionalLabel(position);
      setCurrentEmotionalLabel(label);
      emotionalLabelRef.current = label; // Also update ref
      
      // Also set interaction state here as a backup
      if (!hasUserInteracted) {
        setHasUserInteracted(true);
        hasUserInteractedValue.value = true;
      }
      
      // Calculate smooth color based on position
      const progress = actualEmotionalBarWidth > 0 ? position / actualEmotionalBarWidth : 0.5;
      const newColor = interpolateColor(progress);
      
      // Only update color if it actually changed to avoid unnecessary re-renders
      if (newColor !== previousColorRef.current) {
        setProgressBarColor(newColor);
        previousColorRef.current = newColor;
      }
    } catch (error) {
      console.log('Error in updateEmotionalLabel:', error);
    }
  };

  // Helper function to hide confirmation message
  const hideConfirmationMessage = () => {
    // Stop any ongoing animation and hide the message
    confirmationMessageAnim.stopAnimation(() => {
      confirmationMessageAnim.setValue(0);
      setShowConfirmationMessage(false);
    });
    // Also hide canceled message if showing
    canceledMessageAnim.stopAnimation(() => {
      canceledMessageAnim.setValue(0);
      setShowCanceledMessage(false);
    });
  };

  // Emotional feedback gesture handler
  const emotionalGestureHandler = Gesture.Pan()
    .onStart(() => {
      try {
        // Safety check: only proceed if bar width is measured
        if (actualEmotionalBarWidth <= 0) {
          console.log('Emotional bar width not measured yet, ignoring gesture');
          return;
        }
        
        // Hide confirmation message if it's showing
        runOnJS(hideConfirmationMessage)();
        
        emotionalIsDragging.value = true;
        emotionalStartPosition.value = emotionalThumbPosition.value;
        emotionalThumbScale.value = withSpring(1.2, {
          damping: 15,
          stiffness: 200,
        });
        
        // Mark that user has started interacting
        setHasUserInteracted(true);
        hasUserInteractedValue.value = true;
        
        // Show progress bar (always visible now)
        if (!isProgressBarVisible) {
          setIsProgressBarVisible(true);
        }
        
        // Progress fill will be calculated dynamically in the animated style
      } catch (error) {
        console.log('Error in gesture onStart:', error);
      }
    })
    .onUpdate((event) => {
      try {
        // Safety check: only proceed if bar width is measured
        if (actualEmotionalBarWidth <= 0) {
          console.log('Emotional bar width not measured in onUpdate, ignoring');
          return;
        }
        
        // Cancel countdown silently if user moves the bar
        if (isConfirming) {
          runOnJS(cancelCountdownSilently)();
        }
        
        // Calculate new position with strict clamping using actual measured width
        const rawPosition = emotionalStartPosition.value + event.translationX;
        
        // Account for thumb radius to prevent extending beyond bar boundaries
        const thumbRadius = 10;
        const newPosition = Math.max(thumbRadius, Math.min(actualEmotionalBarWidth - thumbRadius, rawPosition));
        
        // Update position
        emotionalThumbPosition.value = newPosition;
        // Progress fill is now calculated dynamically in the animated style
        
        // Calculate rating (0-4 scale for 5 levels: bad, meh, okay, good, great)
        const progress = newPosition / actualEmotionalBarWidth;
        const newRating = Math.round(progress * 4) + 1; // 1-5 scale
        runOnJS(updateEmotionalRating)(newRating);
        runOnJS(updateEmotionalLabel)(newPosition);
      } catch (error) {
        console.log('Error in gesture onUpdate:', error);
      }
    })
    .onEnd(() => {
      emotionalIsDragging.value = false;
      emotionalThumbScale.value = withSpring(1, {
        damping: 15,
        stiffness: 200,
      });
      
      // Start countdown confirmation if user has interacted
      if (hasUserInteracted && currentEmotionalLabel) {
        runOnJS(startCountdown)(currentEmotionalLabel);
      }
    })
    .minDistance(0)
    .activeOffsetX([-10, 10])
    .failOffsetY([-20, 20]);

  // Animated styles for emotional thumb
  const emotionalThumbAnimatedStyle = useAnimatedStyle(() => {
    // Offset by half thumb width (10px) so the thumb center aligns with the position
    const thumbRadius = 10;
    return {
      transform: [
        { translateX: emotionalThumbPosition.value - thumbRadius },
        { scale: emotionalThumbScale.value }
      ],
    };
  });

  // Animated styles for emotional progress fill
  const emotionalProgressFillAnimatedStyle = useAnimatedStyle(() => {
    const thumbPosition = emotionalThumbPosition.value;
    
    // Always show progress fill, but with different opacity based on interaction
    return {
      width: '100%', // Fill the entire bar
      left: 0,
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
          hidden={isDarkMode}
          animated={true}
        />
      
      {/* Dynamic gradient background based on module */}
      <Animated.View style={styles.backgroundGradient}>
        <LinearGradient
          colors={isDarkMode ? ['#000000', '#000000'] : [gradientColors.top, gradientColors.bottom]}
          style={styles.backgroundGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
        />
      </Animated.View>
      
      {/* Top Bar - Hidden in dark mode */}
      <Animated.View style={[
        styles.topBar, 
        {
          opacity: darkModeAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [1, 0],
          }),
          pointerEvents: isDarkMode ? 'none' : 'auto',
        }
      ]}>
        <TouchableOpacity style={styles.topBarButton} onPress={handleBack}>
          <BackIcon size={20} color="#ffffff" />
        </TouchableOpacity>
        
        {!!(activeSession && (meditationAudioData[activeSession.id as keyof typeof meditationAudioData] as any)?.tutorialBackgroundAudio) && (
          <TouchableOpacity style={styles.tutorialButton} onPress={handleTutorialToggle}>
            <Text style={styles.tutorialButtonText}>
              {showTutorial ? 'Skip tutorial' : 'Do tutorial'}
            </Text>
          </TouchableOpacity>
        )}
        
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
      </Animated.View>

      {/* Main Content */}
      <TouchableOpacity 
        style={styles.mainContent} 
        onPress={handleScreenTap}
        activeOpacity={1}
      >
        {/* Session Title - Hidden in dark mode */}
        <Animated.View style={[
          styles.titleSection,
          {
            opacity: darkModeAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [1, 0],
            }),
            pointerEvents: isDarkMode ? 'none' : 'auto',
          }
        ]}>
          <Text style={styles.sessionTitle} numberOfLines={1} ellipsizeMode="tail">
            {truncatedTitle}
          </Text>
        </Animated.View>

        {/* Artist/Creator - Hidden in dark mode */}
        <Animated.View style={[
          styles.artistContainer,
          {
            opacity: darkModeAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [1, 0],
            }),
            pointerEvents: isDarkMode ? 'none' : 'auto',
          }
        ]}>
          <Text style={styles.artistName}>Prashanti Paz</Text>
        </Animated.View>

        {/* Progress Bar - Always visible */}
        <TouchableOpacity 
          style={[
            styles.progressSection,
            isDarkMode && styles.darkModeTint
          ]} 
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

        {/* Player Controls - Hidden in dark mode */}
        <Animated.View style={[
          styles.playerControls,
          {
            opacity: darkModeAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [1, 0],
            }),
            pointerEvents: isDarkMode ? 'none' : 'auto',
          }
        ]}>
          <TouchableOpacity style={styles.controlButton} onPress={(e) => { e.stopPropagation(); handleSkipBackward(); }}>
            <SkipBackward10Icon size={60} color="#ffffff" />
          </TouchableOpacity>
          
          <Animated.View style={{ transform: [{ scale: playButtonScale }] }}>
            <TouchableOpacity style={styles.playButton} onPress={(e) => { e.stopPropagation(); handlePlayPause(); }}>
              {!audioLoaded ? (
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
        </Animated.View>
      </TouchableOpacity>

      {/* Bottom Section - Fixed Height */}
      <View style={styles.bottomSection}>
        {/* Emotional Feedback Section - Always rendered, shown/hidden with opacity */}
        <Animated.View 
          style={[
            styles.emotionalFeedbackSection,
            isDarkMode && styles.darkModeTint,
            isDarkMode && styles.darkModeEmotionalSection,
            { 
              opacity: emotionalFeedbackOpacity,
              pointerEvents: playerState === 'playing' ? 'auto' : 'none',
            }
          ]}
        >
          <Text style={styles.emotionalFeedbackTitle}>How do you feel?</Text>
          
          <View style={styles.emotionalProgressContainer}>
            {/* Mood Indicator - Always visible */}
            <View style={styles.emotionalIndicator}>
              <Text style={[
                styles.emotionalIndicatorText,
                { opacity: hasUserInteracted && currentEmotionalLabel ? 1 : 0 }
              ]}>
                {currentEmotionalLabel || 'Okay'}
              </Text>
            </View>
            
            
            {/* Progress Bar */}
            <View 
              style={styles.emotionalProgressBar}
              onLayout={(event) => {
                const { width } = event.nativeEvent.layout;
                setActualEmotionalBarWidth(width);
              }}
            >
              <View 
                style={[
                  styles.emotionalProgressTrack,
                  {
                    width: '100%',
                    opacity: 1,
                  }
                ]} 
              />
              <Reanimated.View 
                style={[
                  styles.emotionalProgressFill, 
                  emotionalProgressFillAnimatedStyle,
                  { 
                    backgroundColor: hasUserInteracted ? progressBarColor : 'rgba(255, 255, 255, 0.2)',
                    opacity: 1,
                  }
                ]} 
              />
              <GestureDetector gesture={emotionalGestureHandler}>
                <Reanimated.View 
                  style={[
                    styles.emotionalProgressThumb, 
                    emotionalThumbAnimatedStyle,
                    { backgroundColor: progressBarColor }
                  ]} 
                />
              </GestureDetector>
            </View>
            
            {/* End Labels */}
            <View style={styles.emotionalEndLabels}>
              <Text style={styles.emotionalEndLabel}>Bad</Text>
              
              {/* Countdown - Positioned between Bad and Great */}
              {isConfirming && (
                <View style={styles.countdownOverlayBetweenLabels}>
                  <View style={styles.countdownContainer}>
                    <View style={styles.countdownCircleContainer}>
                      {/* Background circle */}
                      <View style={styles.countdownCircleBackground} />
                      {/* Animated progress ring */}
                      <Animated.View
                        style={[
                          styles.countdownProgressRing,
                          {
                            opacity: countdownProgressAnim.interpolate({
                              inputRange: [0, 0.01, 1],
                              outputRange: [0, 1, 1],
                            }),
                            transform: [
                              {
                                rotate: countdownProgressAnim.interpolate({
                                  inputRange: [0, 1],
                                  outputRange: ['0deg', '360deg'],
                                }),
                              },
                            ],
                          },
                        ]}
                      />
                      {/* Countdown number */}
                      <Animated.View
                        style={[
                          styles.countdownNumberContainer,
                          {
                            transform: [{ scale: countdownScaleAnim }],
                          },
                        ]}
                      >
                        <Text style={styles.countdownNumber}>{countdown}</Text>
                      </Animated.View>
                    </View>
                    <View style={styles.countdownLabelContainer}>
                      <Text style={styles.countdownLabel}>
                        Confirming...
                      </Text>
                      <TouchableOpacity
                        style={styles.cancelButton}
                        onPress={(e) => {
                          e.stopPropagation();
                          cancelCountdown();
                        }}
                        hitSlop={{ top: 12, right: 12, bottom: 12, left: 12 }}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.cancelButtonText}>×</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              )}
              
              {/* Confirmation Message - Positioned between Bad and Great */}
              {showConfirmationMessage && (
                <Animated.View
                  style={[
                    styles.confirmationMessageOverlayBetweenLabels,
                    {
                      opacity: confirmationMessageAnim,
                      transform: [
                        {
                          scale: confirmationMessageAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [0.9, 1],
                          }),
                        },
                      ],
                    },
                  ]}
                >
                  <View style={styles.confirmationMessageContainer}>
                    <Text style={styles.confirmationMessageIcon}>✓</Text>
                    <Text style={styles.confirmationMessageText}>
                      Saved! View in Profile
                    </Text>
                  </View>
                </Animated.View>
              )}
              
              {/* Canceled Message - Positioned between Bad and Great */}
              {showCanceledMessage && (
                <Animated.View
                  style={[
                    styles.confirmationMessageOverlayBetweenLabels,
                    {
                      opacity: canceledMessageAnim,
                      transform: [
                        {
                          scale: canceledMessageAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [0.9, 1],
                          }),
                        },
                      ],
                    },
                  ]}
                >
                  <View style={styles.canceledMessageContainer}>
                    <Text style={styles.canceledMessageIcon}>×</Text>
                    <Text style={styles.canceledMessageText}>
                      Canceled
                    </Text>
                  </View>
                </Animated.View>
              )}
              
              <Text style={styles.emotionalEndLabel}>Great</Text>
            </View>
          </View>
        </Animated.View>

        {/* Action Buttons Section - Always rendered, shown/hidden with opacity */}
        <TouchableOpacity 
          style={[
            styles.actionButtonsSection,
            { 
              opacity: (playerState === 'paused' || playerState === 'finished') ? 1 : 0,
              pointerEvents: (playerState === 'paused' || playerState === 'finished') ? 'auto' : 'none'
            }
          ]}
          onPress={(e) => e.stopPropagation()}
          activeOpacity={1}
        >
          <TouchableOpacity style={styles.finishButton} onPress={(e) => { e.stopPropagation(); handleFinish(); }}>
            <Text style={styles.finishButtonText}>Finish</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.discardButton} onPress={(e) => { e.stopPropagation(); handleDiscard(); }}>
            <Text style={styles.discardButtonText}>Discard session</Text>
          </TouchableOpacity>
        </TouchableOpacity>
      </View>

      {/* Dark Mode Message */}
      {showDarkModeMessage && (
        <Animated.View
          style={[
            styles.darkModeMessageOverlay,
            {
              opacity: darkModeMessageAnim,
              transform: [
                {
                  translateY: darkModeMessageAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-20, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <View style={styles.darkModeMessageContainer}>
            <Text style={styles.darkModeMessageIcon}>🌙</Text>
            <Text style={styles.darkModeMessageText}>Dark Mode</Text>
          </View>
        </Animated.View>
      )}

      {/* Liked/Unliked Message */}
      {showLikedMessage && (
        <Animated.View
          style={[
            styles.likedMessageOverlay,
            {
              opacity: likedMessageAnim,
              transform: [
                {
                  translateY: likedMessageAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-20, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <View style={styles.likedMessageContainer}>
            <Text style={styles.likedMessageText}>
              {isLikedAction ? 'Added to Liked meditations' : 'Removed from Liked meditations'}
            </Text>
          </View>
        </Animated.View>
      )}

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

      {/* Options Menu Bottom Sheet */}
      {showOptionsMenu && (
        <View style={styles.optionsMenuOverlay}>
          <Animated.View 
            style={[
              styles.optionsMenuBackdrop,
              {
                opacity: optionsMenuAnim,
              }
            ]}
          >
            <TouchableOpacity 
              style={styles.optionsMenuBackdropTouchable} 
              onPress={handleCloseOptions}
              activeOpacity={1}
            />
          </Animated.View>
          <Animated.View style={[
            styles.optionsMenuContainer,
            {
              transform: [{
                translateY: optionsMenuAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [300, 0],
                })
              }]
            }
          ]}>
            <View style={styles.optionsMenuHandle} />
            
            <View style={styles.optionsMenuContent}>
              <Text style={styles.optionsMenuTitle}>Options</Text>
              
              {/* Sleep Mode Toggle */}
              <View style={styles.optionsMenuItem}>
                <View style={styles.optionsMenuTextContainer}>
                  <Text style={styles.optionsMenuLabel}>Sleep Mode</Text>
                  <Text style={styles.optionsMenuDescription}>Automatically pause when you fall asleep</Text>
                </View>
                <Switch
                  value={sleepModeEnabled}
                  onValueChange={setSleepModeEnabled}
                  trackColor={{ false: '#e0e0e0', true: '#007AFF' }}
                  thumbColor="#ffffff"
                />
              </View>

              {/* Download Toggle */}
              <View style={styles.optionsMenuItem}>
                <View style={styles.optionsMenuTextContainer}>
                  <Text style={styles.optionsMenuLabel}>Download</Text>
                  <Text style={styles.optionsMenuDescription}>Download for offline listening</Text>
                </View>
                <Switch
                  value={downloadEnabled}
                  onValueChange={setDownloadEnabled}
                  trackColor={{ false: '#e0e0e0', true: '#007AFF' }}
                  thumbColor="#ffffff"
                />
              </View>

              {/* Idle Timer Toggle */}
              <View style={styles.optionsMenuItem}>
                <View style={styles.optionsMenuTextContainer}>
                  <Text style={styles.optionsMenuLabel}>Auto Dark Mode</Text>
                  <Text style={styles.optionsMenuDescription}>Automatically activate dark mode after 10 seconds of inactivity</Text>
                </View>
                <Switch
                  value={idleTimerEnabled}
                  onValueChange={(value) => {
                    setIdleTimerEnabled(value);
                    // Clear timer if disabling
                    if (!value) {
                      clearIdleTimer();
                    }
                  }}
                  trackColor={{ false: '#e0e0e0', true: '#007AFF' }}
                  thumbColor="#ffffff"
                />
              </View>
            </View>
          </Animated.View>
        </View>
      )}
      {/* Completion Landing Overlay */}
      <MeditationCompletionLanding
        visible={showCompletionLanding}
        secondsMeditated={currentTime}
        onContinue={() => {
          setShowFeedbackLanding(true);
        }}
        onDiscard={() => {
          setActiveSession(null);
        }}
      />

      {/* Feedback Landing Overlay */}
      <MeditationFeedbackLanding
        visible={showFeedbackLanding}
        onFinish={async (rating) => {
          if (activeSession) {
            console.log('📊 [Session Completion] Starting session completion process...');
            console.log('📊 [Session Completion] Session ID:', activeSession.id);
            console.log('📊 [Session Completion] Session Title:', activeSession.title);
            console.log('📊 [Session Completion] Duration (seconds):', currentTime);
            console.log('📊 [Session Completion] Duration (minutes):', Math.round(currentTime / 60));
            console.log('📊 [Session Completion] Rating:', rating);
            console.log('📊 [Session Completion] User ID:', userId);
            
            // Determine module context
            const moduleContext = activeModuleId || todayModuleId || null;
            console.log('📊 [Session Completion] Module Context:', moduleContext);
            
            if (!userId) {
              console.warn('⚠️ [Session Completion] No user ID found - skipping database save');
              // Still call the mock for local state
              sessionProgressData.markSessionComplete(activeSession.id, currentTime, rating);
            } else {
              // Convert seconds to minutes with decimal precision (e.g., 125 seconds = 2.083 minutes)
              const minutesCompleted = currentTime / 60;
              console.log('📊 [Session Completion] Calculated minutes (decimal):', minutesCompleted);
              
              // Save completed session to database
              console.log('💾 [Session Completion] Saving completed session to database...');
              const sessionResult = await markSessionCompleted(
                userId,
                activeSession.id,
                minutesCompleted,
                moduleContext || undefined
              );
              
              if (sessionResult.success) {
                console.log('✅ [Session Completion] Session saved to completed_sessions table successfully!');
                console.log('✅ [Session Completion] Session added to activity history');
              } else {
                console.error('❌ [Session Completion] Failed to save session:', sessionResult.error);
              }
              
              // Save session rating to database
              console.log('💾 [Session Completion] Saving session rating to database...');
              const ratingResult = await addSessionRating(
                userId,
                activeSession.id,
                rating,
                moduleContext || undefined
              );
              
              if (ratingResult.success) {
                console.log('✅ [Session Completion] Rating saved to session_ratings table successfully!');
              } else {
                console.error('❌ [Session Completion] Failed to save rating:', ratingResult.error);
              }
              
              // Also call the mock for local state updates
              sessionProgressData.markSessionComplete(activeSession.id, currentTime, rating);
              
              console.log('✅ [Session Completion] Session completion process finished');
            }
          }
          setActiveSession(null);
        }}
      />
      </SafeAreaView>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
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
    top: 20, // Move back up but still avoid overlap
    left: 32, // Match the paddingHorizontal
    right: 32, // Match the paddingHorizontal
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    overflow: 'visible', // Allow overlays to extend beyond bounds
    zIndex: 150, // Ensure section is above dark mode overlay
  },
  darkModeEmotionalSection: {
    borderWidth: 0,
    borderColor: 'transparent',
  },
  emotionalFeedbackTitle: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 20,
    textAlign: 'center',
  },
  emotionalProgressContainer: {
    width: '100%',
    paddingHorizontal: 8,
  },
  emotionalIndicatorText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  emotionalProgressBar: {
    position: 'relative',
    height: 20,
    marginBottom: 16,
    justifyContent: 'center',
  },
  emotionalProgressTrack: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 3,
    marginTop: 7,
  },
  emotionalProgressFill: {
    position: 'absolute',
    top: 0,
    height: 6,
    backgroundColor: '#00ff00', // Bright green for debugging
    borderRadius: 3,
    marginTop: 7,
  },
  emotionalProgressThumb: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#ffffff',
    top: 0,
    left: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.8)',
  },
  emotionalEndLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 10,
    position: 'relative',
    paddingTop: 8,
    paddingBottom: 8,
    zIndex: 200, // Ensure labels container is above dark mode overlay
  },
  emotionalEndLabel: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
  emotionalIndicator: {
    alignItems: 'center',
    marginBottom: 12,
    minHeight: 24, // Reserve space to prevent layout shift
  },
  countdownOverlayBetweenLabels: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: -10, // Position slightly above the labels
    alignItems: 'center',
    justifyContent: 'center',
    pointerEvents: 'box-none', // Allow clicks on children but not on container
    zIndex: 300, // Ensure it's above dark mode overlay
    elevation: 10, // Android elevation
  },
  countdownContainer: {
    alignItems: 'center',
  },
  countdownCircleContainer: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
    position: 'relative',
  },
  countdownCircleBackground: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  countdownProgressRing: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderTopColor: '#ffffff',
    borderRightColor: '#ffffff',
    borderBottomColor: 'transparent',
    borderLeftColor: 'transparent',
  },
  countdownNumberContainer: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  countdownNumber: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  countdownLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  countdownLabel: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 11,
    fontWeight: '500',
    textAlign: 'center',
  },
  cancelButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    marginTop: -4, // Move only the button up slightly
  },
  cancelButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
    lineHeight: 18,
  },
  confirmationMessageOverlayBetweenLabels: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 4, // Position slightly below the labels
    alignItems: 'center',
    justifyContent: 'center',
    pointerEvents: 'none',
    zIndex: 300, // Ensure it's above dark mode overlay
    elevation: 10, // Android elevation
  },
  confirmationMessageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(46, 213, 115, 0.2)',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: 'rgba(46, 213, 115, 0.4)',
  },
  confirmationMessageIcon: {
    fontSize: 14,
    color: '#2ed573',
    fontWeight: '700',
    marginRight: 6,
  },
  confirmationMessageText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  canceledMessageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 71, 87, 0.2)',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 71, 87, 0.4)',
  },
  canceledMessageIcon: {
    fontSize: 14,
    color: '#ff4757',
    fontWeight: '700',
    marginRight: 6,
  },
  canceledMessageText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
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
  // Options Menu Styles
  optionsMenuOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
  },
  optionsMenuBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  optionsMenuBackdropTouchable: {
    flex: 1,
  },
  optionsMenuContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#2a2a2a',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 20,
  },
  optionsMenuHandle: {
    width: 40,
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 20,
  },
  optionsMenuContent: {
    paddingHorizontal: 24,
  },
  optionsMenuTitle: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 24,
    textAlign: 'center',
  },
  optionsMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  optionsMenuTextContainer: {
    flex: 1,
    marginRight: 16,
  },
  optionsMenuLabel: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '500',
    marginBottom: 4,
  },
  optionsMenuDescription: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 14,
    fontWeight: '400',
  },
  hiddenElement: {
    opacity: 0,
    pointerEvents: 'none',
  },
  darkModeTint: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 12,
    padding: 16,
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
  darkModeMessageOverlay: {
    position: 'absolute',
    top: 60, // Position at top bar area (SafeArea + padding)
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 5000,
    pointerEvents: 'none',
  },
  darkModeMessageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 24,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 12,
  },
  darkModeMessageIcon: {
    fontSize: 20,
    marginRight: 10,
  },
  darkModeMessageText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  likedMessageOverlay: {
    position: 'absolute',
    top: 130, // Position at top bar area (same as dark mode message)
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 5000,
    pointerEvents: 'none',
  },
  likedMessageContainer: {
    backgroundColor: '#000000',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 12,
  },
  likedMessageText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '600',
  },
});

